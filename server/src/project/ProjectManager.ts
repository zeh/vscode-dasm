import {
	IConnection,
	InitializeResult,
	TextDocument,
	TextDocuments,
} from "vscode-languageserver";

import { IAssemblerResult } from "../providers/Assembler";
import CompletionProvider from "../providers/CompletionProvider";
import DefinitionProvider from "../providers/DefinitionProvider";
import DiagnosticsProvider from "../providers/DiagnosticsProvider";
import HoverProvider from "../providers/HoverProvider";
import SettingsProvider from "../providers/SettingsProvider";
import { ISettings } from "../providers/SettingsProvider";
import Project from "./Project";

export default class ProjectManager {

	private _connection:IConnection;
	private _projects:Project[];
	private _currentProject?:Project;
	private _currentDocumentUri?:string;
	private _workspaceRoot:string;
	private _documents:TextDocuments;

	private _diagnosticsProvider:DiagnosticsProvider;
	private _hoverProvider:HoverProvider;
	private _definitionProvider:DefinitionProvider;
	private _settingsProvider:SettingsProvider;
	private _completionProvider:CompletionProvider;

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
		const projectInfoProvider = {
			getSource: this.getCurrentSource.bind(this),
			getResults: this.getCurrentResults.bind(this),
			getUriForProjectFile: this.getUriForProjectFile.bind(this),
			getSourceForProjectFile: this.getSourceForProjectFile.bind(this),
			getSettings: this.getSettings.bind(this),
		};

		this._diagnosticsProvider = new DiagnosticsProvider(this._connection, projectInfoProvider);
		this._hoverProvider = new HoverProvider(this._connection, projectInfoProvider);
		this._definitionProvider = new DefinitionProvider(this._connection, projectInfoProvider);
		this._settingsProvider = new SettingsProvider(this._connection, projectInfoProvider);
		this._completionProvider = new CompletionProvider(this._connection, projectInfoProvider);
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
			this.updatePostProviders();
		}
	}

	/**
	 * Set a document as the current active document tab (and current "project")
	 */
	private setCurrentDocument(document:TextDocument) {
		if (document.uri !== this._currentDocumentUri) {
			// Tab changed: change context, changing (and creating) a new project if needed
			console.log("[pm] NEW CURRENT URI is ", document.uri);
			const project = this.getProjectForFile(document);

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
			this.updatePostProviders();
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
	 * Updates existing providers with the latest info from the current tab
	 */
	private updatePostProviders() {
		const fileUri = this._currentDocumentUri;
		if (fileUri) {
			// Diagnostics
			this._diagnosticsProvider.process(fileUri);
		}
	}

	private getCurrentSource():string[]|undefined {
		if (this._currentDocumentUri) {
			return this.getSourceForProjectFile(this._currentDocumentUri);
		}
	}

	private getSourceForProjectFile(uri:string):string[]|undefined {
		if (this._currentProject && uri) {
			const file = this._currentProject.getFileInfo(uri);
			return file ? file.contentsLines : undefined;
		}
	}

	private getCurrentResults():IAssemblerResult|undefined {
		if (this._currentProject) {
			return this._currentProject.getResults();
		}
	}

	private getUriForProjectFile(parentRelativeUri:string) {
		if (this._currentProject) {
			const file = this._currentProject.getFileInfoLocalUri(parentRelativeUri);
			return file ? file.uri : undefined;
		}
	}

	/**
	 * Returns the project a file belongs to
	 * TODO: Some files (e.g. include files) can belong to more than one project!
	 */
	private getProjectForFile(document:TextDocument, avoidCreating:boolean = false):Project|undefined {
		let newProject = this._projects.find((project) => project.hasFile(document.uri));
		if (!newProject && !avoidCreating) {
			// A new file, create a project for it
			newProject = new Project();
			newProject.addFile(document);
			this._projects.push(newProject);
		}
		return newProject;
	}

	private getSettings():ISettings {
		return this._settingsProvider.getCurrent();
	}
}
