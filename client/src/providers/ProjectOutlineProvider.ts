/* tslint:disable:max-classes-per-file */

import * as fs from "fs";
import * as path from "path";
import {
	Command,
	Event,
	EventEmitter,
	ExtensionContext,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
	Uri,
	window,
} from "vscode";
import {
	DocumentLink,
	DocumentLinkRequest,
	DocumentLinkResolveRequest,
	LanguageClient,
} from "vscode-languageclient";

export default class ProjectOutlineProvider implements TreeDataProvider<FileItem> {

	public readonly onDidChangeTreeData:Event<FileItem | undefined>;

	private _context:ExtensionContext;
	private _client:LanguageClient;
	private _onDidChangeTreeDataEmitter:EventEmitter<FileItem | undefined>;
	private _clientReady:boolean;
	private _currentProjectEntryFileUri?:string;

	constructor(context:ExtensionContext, client:LanguageClient) {
		this._context = context;
		this._client = client;
		this._client.onReady().then(() => this.activate());
		window.onDidChangeActiveTextEditor(() => this.refresh());
		this._onDidChangeTreeDataEmitter = new EventEmitter<FileItem | undefined>();
		this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;
	}

	public refresh(): void {
		if (this._clientReady) {
			// Check if the entry file changed
			// TODO: this only works for new files because the server has no concept of "focused" project.
			this._client.sendRequest<DocumentLink[]>(DocumentLinkRequest.type.method,
				{
					textDocument: { uri: "" },
				}).then((documentLinks: DocumentLink[]) => {
					console.log("Requesting entries, is", documentLinks);
					if (documentLinks.length === 1) {
						const uri = documentLinks[0].target;
						if (this._currentProjectEntryFileUri !== uri) {
							// Changed entry file
							this._currentProjectEntryFileUri = uri;

							console.log("REFRESHING, new entry is", uri);

							// Will re-send everything
							this._onDidChangeTreeDataEmitter.fire();
						}
					}
					return true;
				}, (err: any) => {
					console.warn("Error getting current entry file uri", err);
				},
			);
		}
	}

	public getTreeItem(element:FileItem): TreeItem {
		console.log("request tree item element", element);
		return element;
	}

	public getChildren(element?:FileItem): Thenable<FileItem[]> {
		console.log("request tree child items", element);
		return new Promise((resolve) => {
			if (!element) {
				// Root
				resolve(this.getProjectFiles());
			} else {
				// An item's children
				// TODO: reconstruct list of symbols too
				resolve(this.getProjectFiles(element.contextValue));
			}
		});
	}

	public dispose() {
		delete this._context;
	}

	private activate() {
		// The client is ready, so we trigger the first refresh
		console.log("ready=>");
		this._clientReady = true;
		this.refresh();
	}

	private getProjectFiles(uri:string = "") {
		console.log("...sending request for", uri);

		return this._client.onReady().then(() => {
			return this._client.sendRequest<DocumentLink[]>(DocumentLinkRequest.type.method,
				{
					textDocument: { uri },
				}).then((documentLinks: DocumentLink[]) => {
					return documentLinks.map((documentLink) => {
						if (documentLink.target) {
							const label = this.getFileName(documentLink.target);
							const extension = this.getFileExtension(documentLink.target);
							const type = extension && extension.toLowerCase() === "h" ? "header" : "entryfile";
							const context = documentLink.target;
							const command = this.getFileCommand(documentLink.target);
							// TODO: know ahead of time whether the file has dependencies, and if not, don't show collapsed state
							return new FileItem(label, context, type, TreeItemCollapsibleState.Collapsed, command);
						} else {
							return new FileItem("<Entry>", "?", "entryfile", TreeItemCollapsibleState.None, undefined);
						}
					});
				}, (err: any) => {
					console.log("NOT OK!", err);
					// errCb(err)();
				},
			);
		});
	}

	private getFileName(uri:string):string {
		const fileNameRegex = /([\w\.]+)$/m;
		const match = uri.match(fileNameRegex);
		return match ? match[1] : uri;
	}

	private getFileExtension(uri:string):string|undefined {
		const fileExtensionRegex = /\.(\w{1,4})$/m;
		const match = uri.match(fileExtensionRegex);
		return match ? match[1] : undefined;
	}

	private getFileCommand(target:string) {
		return {
			tooltip: "ToolTip",
			command: "vscode.open",
			title: "Open",
			arguments: [ Uri.parse(target) ],
		};
	}
}

class IIconPath {
	public light: string;
	public dark: string;
}

class FileItem extends TreeItem {

	public readonly label:string;
	public readonly contextType:string;
	public readonly contextValue:string;
	public readonly collapsibleState:TreeItemCollapsibleState;
	public readonly command?:Command;
	public readonly iconPath:IIconPath;

	constructor(label:string, contextValue:string, contextType:string, collapsibleState: TreeItemCollapsibleState, command?: Command) {
		super(label, collapsibleState);

		this.label = label;
		this.contextType = contextType;
		this.contextValue = contextValue;
		this.collapsibleState = collapsibleState;
		this.command = command;
		this.iconPath = {
			light: path.join(__filename, "..", "..", "..", "..", "resources", "light", contextType + ".svg"),
			dark: path.join(__filename, "..", "..", "..", "..", "resources", "dark", contextType + ".svg"),
		};
	}
}
