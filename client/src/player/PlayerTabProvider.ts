import * as fs from "fs";
import * as path from "path";
import {
	commands,
	ExtensionContext,
	Uri,
	ViewColumn,
	window,
	workspace,
} from "vscode";

import DasmConstants from "../DasmConstants";
import PlayerContentProvider from "./PlayerContentProvider";

export default class PlayerTabProvider {

	private _context: ExtensionContext;
	private _provider: PlayerContentProvider;

	constructor(context: ExtensionContext, commandName: string, callback?: (args: any[]) => any) {
		this._context = context;

		// Create a content provider for the preview tab
		this._provider = new PlayerContentProvider(context);
		// provider.update()

		// Register the schema type
		this._context.subscriptions.push(workspace.registerTextDocumentContentProvider("dasm-preview", this._provider));

		// Register the new command
		this._context.subscriptions.push(commands.registerCommand(commandName, (args: any[]) => {
			this.openPlayerWindow(context);
			if (callback) callback(args);
		}));
	}

	public dispose() {
		this._provider.dispose();

		delete this._context;
		delete this._provider;
	}

	private openPlayerWindow(context: ExtensionContext) {
		const tabPath = Uri.parse("dasm-preview://player?port=" + DasmConstants.PLAYER_COMMUNICATION_PORT);
		commands.executeCommand("vscode.previewHtml", tabPath, ViewColumn.Three, "dasm Player").then((success) => {
			console.log("Editor shown! Result is:", success);
		}, (errorMessage) => {
			window.showErrorMessage("Error opening player window: " + errorMessage);
		});
	}
}
