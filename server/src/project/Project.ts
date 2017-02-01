import {
	CompletionItem,
	CompletionItemKind,
	createConnection,
	Diagnostic,
	IConnection,
	InitializeResult,
	IPCMessageReader,
	IPCMessageWriter,
	Location,
	TextDocument,
	TextDocumentPositionParams,
	TextDocuments,
} from "vscode-languageserver";

import * as fs from "fs";
import * as path from "path";

import PathUtils from "../utils/PathUtils";
import StringUtils from "../utils/StringUtils";
import { Extensions } from "./../definitions/LanguageDefinition";
import { Assembler, IAssemblerResult } from "./../providers/Assembler";

interface IProjectFileInfo {
	uri: string;
	entryRelativeUri?: string; // Name it was included as, e.g "vcs.h"
	document?: TextDocument;
	contents?: string;
	contentsLines?: string[];
	includes: string[];
	isDirty: boolean;
	isOpened: boolean;
	isInclude: boolean;
	version: number;
}

export default class Project {

	private _files:{[key:string]:IProjectFileInfo};
	private _entryFile?:IProjectFileInfo;
	private _results?:IAssemblerResult;
	private _assembler:Assembler;

	constructor() {
		this._assembler = new Assembler();
		this._files = {};
		this._entryFile = undefined;
		this._results = undefined;
	}

	public addFile(document:TextDocument) {
		this.addFileByUri(document.uri);
		this.updateFile(document);
	}

	public addFileByUri(uri:string, localUri?:string) {
		// Create new document if one doesn't exist
		if (!this.hasFile(uri)) {
			const isInclude = this.isFileInclude(uri);
			const newFile:IProjectFileInfo = {
				uri,
				entryRelativeUri: localUri,
				document: undefined,
				contents: undefined,
				includes: [],
				isDirty: false,
				isOpened: false,
				isInclude,
				version: -1,
			};

			if (!this._entryFile && !isInclude) {
				this._entryFile = newFile;
			}

			this._files[uri] = newFile;
		}
	}

	public debug_logProject() {
		const keys = Object.keys(this._files);
		console.log("  " + keys.length + " files: ");
		keys.forEach((key, index) => {
			const file = this._files[key];
			console.log(`    ${index}: ${file.uri}`);
			console.log(`      entryRelativeUri: ${file.entryRelativeUri}`);
			console.log(`      has document = ${Boolean(file.document)}`);
			console.log(`      has content = ${Boolean(file.contents)}, length = ${file.contents ? file.contents.length : -1}`);
			console.log(`      is dirty = ${Boolean(file.isDirty)}`);
			console.log(`      is opened = ${Boolean(file.isOpened)}`);
			console.log(`      is include = ${Boolean(file.isInclude)}`);
			console.log(`      version = ${file.version}`);
			console.log(`      includes = ${file.includes.length}`);
		});
	}

	public updateFile(document:TextDocument) {
		const fileInfo = this._files[document.uri];
		if (fileInfo && fileInfo.version !== document.version) {
			// Needs update
			fileInfo.document = document;
			fileInfo.contents = document.getText();
			fileInfo.contentsLines = StringUtils.splitIntoLines(fileInfo.contents);
			fileInfo.version = document.version;
			fileInfo.isDirty = true;
			fileInfo.isOpened = true;

			// Search for all includes within a file
			fileInfo.includes = this.getAllFileIncludes(fileInfo.contents);
			this.addLocalFiles(fileInfo);

			this.assemble();
		}
	}

	public updateFileFromFileSystem(uri:string) {
		console.log("[project] Adding file as uri", uri);
		const fileInfo = this._files[uri];
		if (fileInfo) {
			// Needs update
			fileInfo.contents = fs.readFileSync(PathUtils.uriToPlatformPath(uri), {encoding: "utf8"});
			fileInfo.contentsLines = StringUtils.splitIntoLines(fileInfo.contents);
			fileInfo.version = -1;
			fileInfo.isDirty = false;
			fileInfo.isOpened = false;

			// Search for all includes within a file
			fileInfo.includes = this.getAllFileIncludes(fileInfo.contents);
			this.addLocalFiles(fileInfo);

			this.assemble();
		}
	}

	public markFileSaved(document:TextDocument) {
		const fileInfo = this._files[document.uri];
		if (fileInfo && fileInfo.version !== document.version) {
			fileInfo.isDirty = false;
		}
	}

	public markFileOpened(document:TextDocument) {
		const fileInfo = this._files[document.uri];
		if (fileInfo && fileInfo.version !== document.version) {
			fileInfo.isOpened = true;
		}
	}

	public markFileClosed(document:TextDocument) {
		// TODO: close project if all files are closed
		const fileInfo = this._files[document.uri];
		if (fileInfo && fileInfo.version !== document.version) {
			fileInfo.isOpened = false;
		}
	}

	public hasFile(uri:string) {
		return this._files.hasOwnProperty(uri);
	}

	public isFileSource(uri:string) {
		const extension = path.extname(uri);
		return Boolean(extension) && Extensions.source.some((ext) => Boolean(ext) && ext.toLowerCase() === extension.toLowerCase());
	}

	public isFileInclude(uri:string) {
		const extension = path.extname(uri);
		return Boolean(extension) && Extensions.include.some((ext) => Boolean(ext) && ext.toLowerCase() === extension.toLowerCase());
	}

	public getResults():IAssemblerResult|undefined {
		return this._results;
	}

	public getFileInfo(uri:string):IProjectFileInfo|undefined {
		return this.hasFile(uri) ? this._files[uri] : undefined;
	}

	public getFileInfoLocalUri(localUri:string):IProjectFileInfo|undefined {
		const keys = Object.keys(this._files);
		const fileKey = keys.find((key) => this._files[key].entryRelativeUri === localUri);
		return fileKey ? this.getFileInfo(fileKey) : undefined;
	}

	private getAllFileIncludes(src:string) {
		const includeFind = /^[^;\n]+include\s*([^ ;\n]*)/gmi;
		const files:string[] = [];
		let result = includeFind.exec(src);
		while (result) {
			let fileName:string = this.removeQuotes(result[1]);
			if (fileName) files.push(fileName);
			result = includeFind.exec(src);
		}
		return files;
	}

	private removeQuotes(text:string) {
		if (text) {
			const start = text.substr(0, 1);
			const end = text.substr(text.length - 1);
			if (start === end && start === "\"" || start === "'") {
				return text.substr(1, text.length - 2);
			}
		}
		return text;
	}

	private addLocalFiles(file:IProjectFileInfo) {
		// TODO: resolve issue when a .h file is opened first, before its project
		// TODO: allow .asm includes?
		// TODO: just update existing files, don't re-open
		// TODO: this is a bit messy, to get an uri like a real file uri. need to check on osx, or make it more platform agnostic
		// TODO: check if file exists first, before adding
		// TODO: remove files when their include line is removed
		// TODO: use a real graph for dependencies
		const baseFolder = PathUtils.uriToPlatformPath(path.dirname(file.uri));
		file.includes.forEach((filename) => {
			const uri = PathUtils.platformPathToUri(path.join(baseFolder, filename));
			if (!this.hasFile(uri)) {
				this.addFileByUri(uri, filename);
				this.updateFileFromFileSystem(uri);
			}
		});
	}

	private assemble() {
		// Gather all files and compile
		if (this._entryFile && this._entryFile.contents) {
			console.time("[project] Assembling");
			const includes:{[key:string]:string} = {};
			Object.keys(this._files).forEach((key) => {
				const fileInfo = this._files[key];
				if (fileInfo !== this._entryFile && fileInfo.entryRelativeUri && fileInfo.contents) {
					console.log("[project]   Added file as " + fileInfo.entryRelativeUri);
					includes[fileInfo.entryRelativeUri] = fileInfo.contents;
				}
			});
			this._results = this._assembler.assemble(this._entryFile.contents, includes);
			console.timeEnd("[project] Assembling");
		} else {
			console.warn("[project] No entry file to compile");
		}
	}
}

