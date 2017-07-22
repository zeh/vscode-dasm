import {
	Position,
	Range,
	TextDocument,
} from "vscode-languageserver";

import * as fs from "fs";
import * as path from "path";
import SimpleSignal from "simplesignal";

import PathUtils from "../utils/PathUtils";
import StringUtils from "../utils/StringUtils";

export interface IProjectFileDependency {
	parentRelativeUri: string;
	range: Range;
	file?: IProjectFile;
}

export interface IProjectFile {
	uri: string;
	document?: TextDocument;
	contents?: string;
	contentsLines?: string[];
	dependencies: IProjectFileDependency[];
	isDirty: boolean;
	version: number;
}

interface IFileUpdateEvent {
	uri: string;
	process: () => void;
}

export default class ProjectFiles {

	private static readonly FILE_UPDATE_DEBOUNCE_MS = 250; // Time to wait until a file change is propagated

	private _files:{[key:string]:IProjectFile};
	private _entryFile?:IProjectFile;
	private _onChanged:SimpleSignal<(files:ProjectFiles) => void>;
	private _onAdded:SimpleSignal<(files:ProjectFiles) => void>;

	private _queuedFileUpdate?:IFileUpdateEvent;
	private _queuedUpdateProcessId?:NodeJS.Timer;

	constructor() {
		this._files = {};
		this._entryFile = undefined;
		this._onChanged = new SimpleSignal<(files:ProjectFiles) => void>();
		this._onAdded = new SimpleSignal<(files:ProjectFiles) => void>();
	}

	public addFromDocument(document:TextDocument) {
		this.addByUri(document.uri);
		this.updateFromDocument(document);
	}

	public addByUri(uri:string) {
		// Create new document if one doesn't exist
		const cleanUri = this.getCleanUri(uri);
		if (!this.has(uri)) {
			const newFile:IProjectFile = {
				uri: cleanUri,
				document: undefined,
				contents: undefined,
				contentsLines: undefined,
				dependencies: [],
				isDirty: false,
				version: -1,
			};

			if (!this._entryFile) {
				this._entryFile = newFile;
			}

			this._files[cleanUri] = newFile;
			this._onAdded.dispatch(this);
		}
	}

	public debug_logProject() {
		const keys = Object.keys(this._files);
		console.log("  " + keys.length + " files: ");
		keys.forEach((key, index) => {
			const file = this._files[key];
			console.log(`    ${index}: ${file.uri}`);
			console.log(`      has document = ${Boolean(file.document)}`);
			console.log(`      has content = ${Boolean(file.contents)}, length = ${file.contents ? file.contents.length : -1}`);
			console.log(`      is dirty = ${Boolean(file.isDirty)}`);
			console.log(`      version = ${file.version}`);
			console.log(`      includes = ${file.dependencies.length}`);
		});
	}

	public updateFromDocument(document:TextDocument) {
		const fileInfo = this.get(document.uri);
		if (fileInfo && fileInfo.version !== document.version) {
			this.queueFileUpdate(document.uri, () => {
				// Needs update
				fileInfo.document = document;
				fileInfo.contents = document.getText();
				fileInfo.contentsLines = StringUtils.splitIntoLines(fileInfo.contents);
				fileInfo.version = document.version;
				fileInfo.isDirty = true;

				this.updateDependencies(fileInfo);
				this._onChanged.dispatch(this);
			});
		}
	}

	public updateFromFileSystem(uri:string) {
		console.log("[files] Adding file as uri", uri);
		const fileInfo = this.get(uri);
		if (fileInfo) {
			this.queueFileUpdate(uri, () => {
				// Needs update
				fileInfo.document = undefined;
				fileInfo.contents = fs.readFileSync(PathUtils.uriToPlatformPath(uri), {encoding: "utf8"});
				fileInfo.contentsLines = StringUtils.splitIntoLines(fileInfo.contents);
				fileInfo.version = -1;
				fileInfo.isDirty = false;

				this.updateDependencies(fileInfo);
				this._onChanged.dispatch(this);
			});
		}
	}

	public markSaved(document:TextDocument) {
		const fileInfo = this.get(document.uri);
		if (fileInfo) fileInfo.isDirty = false;
	}

	public markClosed(document:TextDocument) {
		const fileInfo = this.get(document.uri);
		if (fileInfo) fileInfo.document = undefined;
	}

	public has(uri:string) {
		return this._files.hasOwnProperty(this.getCleanUri(uri));
	}

	public get(uri:string):IProjectFile|undefined {
		const cleanUri = this.getCleanUri(uri);
		return this.has(cleanUri) ? this._files[cleanUri] : undefined;
	}

	public getEntry():IProjectFile|undefined {
		return this._entryFile;
	}

	public all():IProjectFile[] {
		const files:IProjectFile[] = [];
		const keys = Object.keys(this._files);
		keys.forEach((key) => {
			if (this.has(key)) files.push(this.get(key) as IProjectFile);
		});
		return files;
	}

	public getByDependencyUri(parentUri:string|undefined, parentRelativeUri:string):IProjectFile|undefined {
		let possibleParents:IProjectFile[] = [];
		if (parentUri) {
			// Parent-specific dependency
			const parent = this.get(parentUri);
			if (parent) {
				possibleParents = [parent];
			}
		} else {
			// Any parent
			possibleParents = this.all();
		}

		for (const parent of possibleParents) {
			const dependency = parent.dependencies.find((dependencyInfo) => dependencyInfo.parentRelativeUri === parentRelativeUri);
			if (dependency) return dependency.file;
		}

		return undefined;
	}

	public get onAdded() {
		return this._onAdded;
	}

	public get onChanged() {
		return this._onChanged;
	}

	/**
	 * Creates a list of all includes, with the entry-relative uri as the key and the contents as the value
	 */
	public getIncludes():{[key:string]:string} {
		return this._entryFile ? this.buildIncludes(this._entryFile) : {};
	}

	public getSource():string|undefined {
		return this._entryFile ? this._entryFile.contents : undefined;
	}

	public dispose() {
		this.clearQueuedFileUpdate();
		this._onAdded.removeAll();
		this._onChanged.removeAll();
	}

	private getCleanUri(uri:string):string {
		return decodeURIComponent(uri);
	}

	/**
	 * Trigger an event to update all dependencies,
	 * with proper debouncing so it doesn't do that too often
	 */
	private queueFileUpdate(uri:string, process:() => void) {
		// Cancel existing update event if existing
		this.clearQueuedFileUpdate();

		// If an event exists and it's a different file, process it immediately
		if (this._queuedFileUpdate && this._queuedFileUpdate.uri !== uri) {
			this._queuedFileUpdate.process();
		}

		// Finally, add the new one as the next one
		this._queuedFileUpdate = {
			uri,
			process,
		};

		// And queue it to execute next
		this._queuedUpdateProcessId = setTimeout(() => {
			process();
			this._queuedUpdateProcessId = undefined;
		}, ProjectFiles.FILE_UPDATE_DEBOUNCE_MS);
	}

	private clearQueuedFileUpdate() {
		if (this._queuedUpdateProcessId) {
			clearTimeout(this._queuedUpdateProcessId);
			this._queuedUpdateProcessId = undefined;
		}
	}

	/**
	 * Return a list of all files included within a source, with their include filename and range
	 */
	private getIncludedFileLinks(lines:string[]) {
		const includeFind = /^[^;\n]+include\s*([^ ;\n]*)/gmi;
		const files:Array<{fileName:string, range:Range}> = [];
		lines.forEach((line, lineIndex) => {
			let result = includeFind.exec(line);
			while (result) {
				const fileName:string = StringUtils.removeWrappingQuotes(result[1]);
				if (fileName) files.push({
					fileName,
					range: Range.create(
						Position.create(lineIndex, result.index + result[0].indexOf(result[1])),
						Position.create(lineIndex, result.index + result[0].length),
					),
				});
				result = includeFind.exec(line);
			}
		});
		return files;
	}

	/**
	 * Given a file info, update its existing dependencies, removing
	 * the ones that are not there and adding the new ones
	 */
	private updateDependencies(file:IProjectFile) {
		if (file.contentsLines) {
			const allDependencyLinks = this.getIncludedFileLinks(file.contentsLines);

			// Remove dependencies that are not featured anymore
			file.dependencies = file.dependencies.filter(
				(dependencyInfo) => allDependencyLinks.some(
					(dependencyLink) => dependencyLink.fileName === dependencyInfo.parentRelativeUri,
				),
			);

			// Filter down to new dependencies only
			const newDependencyLinks = allDependencyLinks.filter((dependencyLink) => {
				return !file.dependencies.some((dependencyInfo) => dependencyInfo.parentRelativeUri === dependencyLink.fileName);
			});
			const newDependencies:IProjectFileDependency[] = newDependencyLinks.map((dependencyLink) => {
				return {
					parentRelativeUri: dependencyLink.fileName,
					range: dependencyLink.range,
				};
			});
			file.dependencies = file.dependencies.concat(newDependencies);

			// TODO: this is a bit messy, to get an uri like a real file uri. need to check on osx, or make it more platform agnostic

			// Add dependency files to the main file list where needed
			const baseFolder = PathUtils.uriToPlatformPath(path.dirname(file.uri));
			file.dependencies.forEach((dependencyInfo) => {
				const uri = PathUtils.platformPathToUri(path.join(baseFolder, dependencyInfo.parentRelativeUri));
				if (!this.has(uri)) {
					// Doesn't exist: a new file, add to the project
					this.addByUri(uri);
					this.updateFromFileSystem(uri);
				}

				// Update its contents
				dependencyInfo.file = this.get(uri);
			});
		}
	}

	private buildIncludes(file:IProjectFile, previousRelativeUri?:string) {
		const includes:{[key:string]:string} = {};
		file.dependencies.forEach((dependency) => {
			// Includes the file itself
			const includeUri = previousRelativeUri ? path.join(previousRelativeUri, dependency.parentRelativeUri) : dependency.parentRelativeUri;
			if (dependency.file && dependency.file.contents) {
				includes[includeUri] = dependency.file.contents;
				// Includes its own dependencies
				Object.assign(includes, this.buildIncludes(dependency.file, includeUri));
			} else {
				console.error(`Error! Trying to include "${previousRelativeUri}" as a file dependency without contents!`);
			}
		});
		return includes;
	}
}

