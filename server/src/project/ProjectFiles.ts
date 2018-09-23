import {
	Position,
	Range,
	TextDocument,
} from "vscode-languageserver";

import { resolveIncludes } from "dasm";
import * as fs from "fs";
import * as path from "path";
import SimpleSignal from "simplesignal";
import * as url from "url";

import PathUtils from "../utils/PathUtils";
import StringUtils from "../utils/StringUtils";

export interface IProjectFileDependency {
	parentRelativeUri: string;
	uri: string;
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

	public addFromDiskPath(filePath:string) {
		const uri = "file://" + url.parse(filePath).href;
		this.addByUri(uri);
		this.updateFromFileSystem(uri);
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
		console.log("[files] Updating from document", document.uri);
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
					console.warn("[PF] Could not open file at", PathUtils.uriToPlatformPath(uri), "with original URI", uri);
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

		// If an event exists and it's a different file, process it immediately
		if (this._queuedFileUpdate && this._queuedFileUpdate.uri !== uri) {
			this._queuedFileUpdate.process();
			this.clearQueuedFileUpdate();
		}

		// Finally, add the new one as the next one and queue it to execute next
		if (this._debounceTime > 0) {
			// Needs to be queued
			this._queuedFileUpdate = {
				uri,
				process,
			};
			this._queuedUpdateProcessId = setTimeout(() => {
				this.clearQueuedFileUpdate();
				process();
			}, this._debounceTime);
		} else {
			// Can execute immediately
			process();
		}
	}

	private clearQueuedFileUpdate() {
		if (this._queuedUpdateProcessId) {
			clearTimeout(this._queuedUpdateProcessId);
			this._queuedUpdateProcessId = undefined;
			this._queuedFileUpdate = undefined;
		}
	}

	private bufferToArray(b:Buffer) {
		const arr = new Uint8Array(b.length);
		return arr.map((v, i) => b[i]);
	}

	private getFileFrom(parentLocation:string) {
		return (sourceEntryRelativeUri:string, isBinary:boolean): string|Uint8Array|undefined => {
			const projectRoot = path.posix.join(this.getProjectRoot(), parentLocation);
			const fullUri = path.resolve(path.posix.join(projectRoot, sourceEntryRelativeUri));
			const localPath = PathUtils.uriToPlatformPath(fullUri);
			const file = this.get(fullUri);
			console.log("[PF] [get] At root", projectRoot);
			console.log("[PF] [get] ...Looking for", sourceEntryRelativeUri);
			console.log("[PF] [get] ...Is", fullUri);
			if (file && file.contents) {
				console.log("[PF] [get] ... ...exists in project as", fullUri);
				// Is already read, use it
				return file.contents;
			} else if (fs.existsSync(localPath)) {
				// Not read yet, get from disk
				console.log("[PF] [get] ... ...exists in folder as", localPath);
				if (isBinary) {
					return this.bufferToArray(fs.readFileSync(localPath));
				} else {
					return fs.readFileSync(localPath, "utf8");
				}
			} else {
				console.log("[PF] [get] ... ...does not exist");
			}
		};
	}

	private getProjectRoot(): string {
		const root = this._entryFile ? url.parse(this._entryFile.uri).pathname : undefined;
		return root ? path.posix.dirname(root) : ".";
	}

	/**
	 * Given a file info, update its existing dependencies, removing
	 * the ones that are not there and adding the new ones
	 */
	private updateDependencies(file:IProjectFile) {
		console.log("[PF] Updating dependencies for file", file.uri);
		if (file.contents) {
			// Parse all dependencies in a file's source
			const projectRoot = this.getProjectRoot();
			const filePath = url.parse(file.uri).pathname;
			const parentLocation = filePath ? path.posix.relative(projectRoot, path.posix.dirname(filePath)) : "";
			console.log("[PF] ...parent location is", parentLocation);
			const newFileDependencyLinks = resolveIncludes(file.contents, this.getFileFrom(parentLocation), undefined, false);
			const newFileDependencyUris = newFileDependencyLinks.map((dependencyLink) => {
				const newFileUri = PathUtils.platformPathToUri(path.posix.resolve(projectRoot, parentLocation, dependencyLink.parentRelativeUri));
				console.log("[PF] ... ...dependency is at", newFileUri);
				return newFileUri;
			});
			const currentFileDependenciesUris = file.dependencies.map((dependency) => dependency.uri);

			// Remove dependencies that are not featured anymore
			file.dependencies = file.dependencies.filter((dependency) => {
				return newFileDependencyUris.includes(dependency.uri);
			});

			// Filter down to new dependency links only
			const fileDependencyLinksToAdd = newFileDependencyLinks.filter((dependencyLink, index) => {
				return !currentFileDependenciesUris.includes(newFileDependencyUris[index]);
			});

			// Create the new dependency entries
			// TODO: check if this uri to get a real URI works universally
			const fileDependenciesToAdd = fileDependencyLinksToAdd.map((dependencyLink, index) => {
				return {
					uri: newFileDependencyUris[index],
					parentRelativeUri: dependencyLink.parentRelativeUri,
					range: Range.create(
						Position.create(dependencyLink.line, dependencyLink.column),
						Position.create(dependencyLink.line, dependencyLink.column + dependencyLink.entryRelativeUri.length),
					),
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

	/**
	 * Creates a list of all current dependencies for the assembly process to include
	 */
	private buildIncludesForAssembly(file:IProjectFile, previousRelativeUri?:string) {
		const includes:{[key:string]:string} = {};
		file.dependencies.forEach((dependency) => {
			// Includes the file itself
			if (dependency.file && dependency.file.contents) {
				let includeUri = dependency.parentRelativeUri;
				if (previousRelativeUri) includeUri = path.posix.join(previousRelativeUri, includeUri);
				includes[includeUri] = dependency.file.contents;
				// Includes its own dependencies
				Object.assign(includes, this.buildIncludesForAssembly(dependency.file, includeUri));
			} else {
				console.warn(`Error! Trying to include "${previousRelativeUri}" as a assembly file dependency without contents!`);
			}
		});
		return includes;
	}
}

