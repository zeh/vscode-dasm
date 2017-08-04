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
	uri: string;
	range: Range;
	file?: IProjectFile;
}

export interface IDependencyLink {
	parentRelativeUri: string;
	uri: string;
	range: Range;
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
	private _debounceTime:number;

	private _queuedFileUpdate?:IFileUpdateEvent;
	private _queuedUpdateProcessId?:NodeJS.Timer;

	constructor() {
		this._files = {};
		this._entryFile = undefined;
		this._onChanged = new SimpleSignal<(files:ProjectFiles) => void>();
		this._onAdded = new SimpleSignal<(files:ProjectFiles) => void>();
		this._debounceTime = ProjectFiles.FILE_UPDATE_DEBOUNCE_MS;
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

	public remove(uri:string) {
		delete this._files[uri];
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
				try {
					fileInfo.contents = fs.readFileSync(PathUtils.uriToPlatformPath(uri), {encoding: "utf8"});
					fileInfo.contentsLines = StringUtils.splitIntoLines(fileInfo.contents);
					fileInfo.isDirty = false;
				} catch (e) {
					fileInfo.contents = undefined;
					console.error("[ProjectFiles] Could not open file at ", uri);
					fileInfo.isDirty = true;
				}
				fileInfo.version = -1;

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

	public get debounceTime() {
		return this._debounceTime;
	}

	public set debounceTime(value: number) {
		this._debounceTime = value;
	}

	/**
	 * Creates a list of all includes, with the entry-relative uri as the key and the contents as the value
	 */
	public getIncludes():{[key:string]:string} {
		return this._entryFile ? this.buildIncludesForAssembly(this._entryFile) : {};
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
		if (this._debounceTime > 0) {
			this._queuedUpdateProcessId = setTimeout(() => {
				process();
				this._queuedUpdateProcessId = undefined;
			}, this._debounceTime);
		} else {
			process();
			this._queuedUpdateProcessId = undefined;
		}
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
	private getIncludedFileLinks(parentUri:string, lines:string[]):IDependencyLink[] {
		const baseFolder = PathUtils.uriToPlatformPath(path.dirname(parentUri));
		const includeFolders = this.getIncludeDirs(lines);

		const includeFind = /^[^;"\n]+include\s+([^ ;\n]*)/gmi;
		const files:IDependencyLink[] = [];

		lines.forEach((line, lineIndex) => {
			let result = includeFind.exec(line);
			while (result) {
				const fileName = StringUtils.removeWrappingQuotes(result[1]);
				const uri = this.findPossibleFileLocations(baseFolder, includeFolders, fileName);
				if (fileName && uri) {
					files.push({
						parentRelativeUri: fileName,
						uri,
						range: Range.create(
							Position.create(lineIndex, result.index + result[0].indexOf(result[1])),
							Position.create(lineIndex, result.index + result[0].length),
						),
					});
				}
				result = includeFind.exec(line);
			}
		});
		return files;
	}

	// Return all the base folders a file can have for included files
	private getIncludeDirs(lines:string[]) {
		const folders:string[] = [ "." ];
		const includeDirFind = /^[^;"\n]+incdir\s+([^ ;\n]*)/gmi;
		lines.forEach((line, lineIndex) => {
			let result = includeDirFind.exec(line);
			while (result) {
				const folder = StringUtils.removeWrappingQuotes(result[1]);
				if (!folders.includes(folder)) folders.push(folder);
				result = includeDirFind.exec(line);
			}
		});
		return folders;
	}

	/**
	 * Given a file info, update its existing dependencies, removing
	 * the ones that are not there and adding the new ones
	 */
	private updateDependencies(file:IProjectFile) {
		if (file.contentsLines) {
			// Parse all dependencies in a file's source
			const newFileDependencyLinks = this.getIncludedFileLinks(file.uri, file.contentsLines);
			const newFileDependencyUris = newFileDependencyLinks.map((dependencyLink) => dependencyLink.uri);
			const currentFileDependenciesUris = file.dependencies.map((dependency) => dependency.uri);

			// Remove dependencies that are not featured anymore
			file.dependencies = file.dependencies.filter((dependency) => {
				return newFileDependencyUris.includes(dependency.uri);
			});

			// Filter down to new dependency links only
			const fileDependencyLinksToAdd = newFileDependencyLinks.filter((dependencyLink) => {
				return !currentFileDependenciesUris.includes(dependencyLink.uri);
			});

			// Create the new dependency entries
			// TODO: check if this uri to get a real URI works universally
			const fileDependenciesToAdd = fileDependencyLinksToAdd.map((dependencyLink) => {
				return {
					uri: dependencyLink.uri,
					parentRelativeUri: dependencyLink.parentRelativeUri,
					range: dependencyLink.range,
				};
			});
			file.dependencies = file.dependencies.concat(fileDependenciesToAdd);

			// Add dependency files to the main file list where needed
			file.dependencies.forEach((dependencyInfo) => {
				const uri = dependencyInfo.uri;
				if (!this.has(uri)) {
					// Doesn't exist: a new file, add to the project
					this.addByUri(uri);
					this.updateFromFileSystem(uri);
				}

				// Update its contents
				dependencyInfo.file = this.get(uri);
			});

			this.cleanProjectFiles();
		}
	}

	/**
	 * Based on all possible file locations (as added by INCDIR), find a dependency location if it exists
	 */
	private findPossibleFileLocations(baseFolder:string, includeFolders:string[], fileName:string) {
		for (const includeFolder of includeFolders) {
			const uri = path.join(baseFolder, includeFolder, fileName);
			if (fs.existsSync(uri)) return PathUtils.platformPathToUri(uri);
		}
		return undefined;
	}

	/**
	 * Remove files from project if they're not dependencies of any other file anymore
	 */
	private cleanProjectFiles() {
		const allFiles = this.all();

		const filesToRemove = allFiles.filter((file) => {
			// Check if the file is a dependency of any other file
			if (file === this._entryFile) {
				// Don't remove if it's the entry file
				return false;
			} else {
				// Don't remove if it's used as a dependency in any other file
				const fileWithThisAsADependency = allFiles.find((aFile) => {
					return Boolean(aFile.dependencies.find((dependency) => {
						return dependency.uri === file.uri;
					}));
				});
				return !Boolean(fileWithThisAsADependency);
			}
		});

		for (const rFile of filesToRemove) this.remove(rFile.uri);
	}

	private buildIncludesForAssembly(file:IProjectFile, previousRelativeUri?:string) {
		const includes:{[key:string]:string} = {};
		file.dependencies.forEach((dependency) => {
			// Includes the file itself
			if (dependency.file && dependency.file.contents) {
				const includeUri = previousRelativeUri ? path.join(previousRelativeUri, dependency.parentRelativeUri) : dependency.parentRelativeUri;
				includes[includeUri] = dependency.file.contents;
				// Includes its own dependencies
				Object.assign(includes, this.buildIncludesForAssembly(dependency.file, includeUri));
			} else {
				console.error(`Error! Trying to include "${previousRelativeUri}" as a file dependency without contents!`);
			}
		});
		return includes;
	}
}

