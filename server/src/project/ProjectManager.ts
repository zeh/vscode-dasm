import {
	IConnection,
	InitializeResult,
	TextDocument,
	TextDocuments,
} from "vscode-languageserver";

import CompletionProvider from "../providers/CompletionProvider";
import DefinitionProvider from "../providers/DefinitionProvider";
import DiagnosticsProvider from "../providers/DiagnosticsProvider";
import DocumentLinkProvider from "../providers/DocumentLinkProvider";
import DocumentSymbolProvider from "../providers/DocumentSymbolProvider";
import HoverProvider from "../providers/HoverProvider";
import { IPostAssemblyProvider, Provider } from "../providers/Provider";
import SettingsProvider from "../providers/SettingsProvider";
import { ISettings } from "../providers/SettingsProvider";
import WorkspaceSymbolProvider from "../providers/WorkspaceSymbolProvider";
import { IProjectInfoProvider } from "./../providers/Provider";
import Project from "./Project";
import { IProjectFile } from "./ProjectFiles";

interface IProviderInfo {
	provider: Provider;
	needsPostAssemblyProcessing?: false;
}

interface IPostAssemblyProviderInfo {
	provider: IPostAssemblyProvider;
	needsPostAssemblyProcessing: true;
}

export default class ProjectManager {

	private readonly _connection:IConnection;
	private readonly _providers:Array<IProviderInfo|IPostAssemblyProviderInfo>;
	private readonly _settingsProvider:SettingsProvider;

	private _projects:Project[];
	private _currentProject?:Project;
	private _currentDocumentUri?:string;
	private _workspaceRoot:string;
	private _documents:TextDocuments;

	constructor(connection:IConnection) {
		this._connection = connection;
		this._projects = [];

		this._currentProject = undefined;
		this._currentDocumentUri = undefined;

		// Initialize hooks; full document sync (open, change and close document events)
		this._documents = new TextDocuments();
		this._documents.listen(this._connection);

		// Initialization
		this._connection.onInitialize((params):InitializeResult => {
			this._workspaceRoot = params.rootUri || "";

			return {
				// Tells the client about the server's capabilities
				capabilities: {
					// Working in FULL text document sync mode
					textDocumentSync: this._documents.syncKind,

					// Hover on symbols/etc
					hoverProvider: true,

					// Code complete
					completionProvider: {
						resolveProvider: true,
						triggerCharacters: [ "." ],
					},

					// Go to definition
					definitionProvider: true,

					// Links (dependencies)
					documentLinkProvider: {
						resolveProvider: true,
					},

					// Symbols per document
					documentSymbolProvider: true,

					// Symbols per workspace
					workspaceSymbolProvider: true,
				},
			};
		});

		// When a text document is opened or when its content has changed
		this._documents.onDidOpen((change) => {
			this.debug_logProjects();
			this.onDocumentOpened(change.document);
		});

		this._documents.onDidChangeContent((change) => {
			this.debug_logProjects();
			this.onDocumentChanged(change.document);
		});

		this._documents.onDidSave((change) => {
			this.debug_logProjects();
			this.onDocumentSaved(change.document);
		});

		this._documents.onDidClose((change) => {
			this.debug_logProjects();
			this.onDocumentClosed(change.document);
		});

		// Create providers
		const projectInfoProvider:IProjectInfoProvider = {
			getAllProjects: this.getAllProjects.bind(this),
			getProjectForFile: this.getProjectForFile.bind(this),
			getFile: this.getFile.bind(this),
			getFileByLocalUri: this.getFileByLocalUri.bind(this),
			getSettings: this.getSettings.bind(this),
		};

		this._settingsProvider = new SettingsProvider(this._connection, projectInfoProvider);

		this._providers = [
			{ provider: new DiagnosticsProvider(this._connection, projectInfoProvider), needsPostAssemblyProcessing: true },
			{ provider: new HoverProvider(this._connection, projectInfoProvider) },
			{ provider: new DefinitionProvider(this._connection, projectInfoProvider) },
			{ provider: new CompletionProvider(this._connection, projectInfoProvider) },
			{ provider: new DocumentLinkProvider(this._connection, projectInfoProvider) },
			{ provider: new DocumentSymbolProvider(this._connection, projectInfoProvider) },
			{ provider: new WorkspaceSymbolProvider(this._connection, projectInfoProvider) },
		];
	}

	public start() {
		// Listen on the connection
		this._connection.listen();
	}

	private debug_logProjects() {
		console.log("---");
		console.log(" ALL tabs: ", this._documents.keys());
		console.log(" Projects: ", this._projects.length);
		if (this._currentProject) {
			console.log(" CURRENT project:");
			this._currentProject.debug_logProject();
		}
		// this._projects.forEach((project, index) => {
		// 	console.log(index + " ----");
		// 	project.debug_logProject();
		// });
		console.log("---");
	}

	/**
	 * A documented was opened; fired before a change event when switched to a new tab
	 */
	private onDocumentOpened(document:TextDocument) {
		this.setCurrentDocument(document);
	}

	/**
	 * A document's contents was updated
	 */
	private onDocumentChanged(document:TextDocument) {
		this.setCurrentDocument(document);

		// Re-assemble the current project
		if (this._currentProject) {
			this._currentProject.updateFile(document);
		}
	}

	/**
	 * Set a document as the current active document tab (and current "project")
	 */
	private setCurrentDocument(document:TextDocument) {
		if (document.uri !== this._currentDocumentUri) {
			// Tab changed: change context, changing (and creating) a new project if needed
			console.log("[pm] NEW CURRENT URI is ", document.uri);
			const project = this.getProjectForDocument(document);

			if (project && project !== this._currentProject) {
				// A new project altogether, set it as default
				console.log("[pm] ...ALSO SETTING new project");
				this._currentProject = project;
			}

			this._currentDocumentUri = document.uri;
		}
	}

	/**
	 * After closing a document, don't know the current one
	 */
	private unsetCurrentDocument() {
		this._currentDocumentUri = undefined;
		this._currentProject = undefined;
	}

	/**
	 * A documented was saved
	 */
	private onDocumentSaved(document:TextDocument) {
		this.setCurrentDocument(document);

		if (this._currentProject) {
			this._currentProject.markFileSaved(document);
		}
	}

	/**
	 * A documented was closed
	 */
	private onDocumentClosed(document:TextDocument) {
		if (this._currentProject) {
			this._currentProject.updateFile(document);
			this._currentProject.markFileClosed(document);
		}
		// TODO: close project if all files are closed

		this.unsetCurrentDocument();
	}

	/**
	 * Updates existing providers with the latest info from an assembled project
	 */
	private updatePostAssemblyProviders(project:Project) {
		for (const providerInfo of this._providers) {
			if (providerInfo.needsPostAssemblyProcessing) {
				providerInfo.provider.process(project.getFiles(), project.getAssemblerResults());
			}
		}
	}

	/**
	 * Get a list of all projects
	 */
	private getAllProjects():Project[] {
		return this._projects.concat();
	}

	/**
	 * Based on an URI, find the project that contains that file
	 */
	private getProjectForFile(uri:string):Project|undefined {
		return this._projects.find((projectInfo) => projectInfo.hasFile(uri));
	}

	/**
	 * Based on an URI, find a file in any of the current projects
	 */
	private getFile(uri:string):IProjectFile|undefined {
		const project = this.getProjectForFile(uri);
		return project ? project.getFileInfo(uri) : undefined;
	}

	/**
	 * Based on a local URI (i.e. a file relative to another file), find a file in any of the current projects
	 */
	private getFileByLocalUri(parentRelativeUri:string) {
		for (const project of this._projects) {
			const file = project.getFileInfoLocalUri(parentRelativeUri);
			if (file) return file;
		}
	}

	/**
	 * Returns the project a document belongs to
	 * TODO: Some files (e.g. include files) can belong to more than one project!
	 */
	private getProjectForDocument(document:TextDocument, avoidCreating:boolean = false):Project|undefined {
		let newProject = this.getProjectForFile(document.uri);
		if (!newProject && !avoidCreating) {
			// A new document, create a project for it
			newProject = new Project();
			newProject.onAssembled.add((project) => { this.updatePostAssemblyProviders(project); });
			newProject.addFile(document);
			this._projects.push(newProject);
		}
		return newProject;
	}

	private getSettings():ISettings {
		return this._settingsProvider.getCurrent();
	}
}
