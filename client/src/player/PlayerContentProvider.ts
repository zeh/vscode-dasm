import * as fs from "fs";
import * as path from "path";
import * as querystring from "querystring";
import {
	CancellationToken,
	Event,
	EventEmitter,
	ExtensionContext,
	TextDocumentContentProvider,
	Uri,
} from "vscode";

export default class PlayerContentProvider implements TextDocumentContentProvider {

	public static readonly VAR_ASSET_PATH = /\$\{ASSET_PATH\}/g;
	public static readonly VAR_DASM_PORT = /\$\{DASM_PORT\}/g;

	private _onDidChangeEmitter: EventEmitter<Uri>;
	private _context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this._context = context;
		this._onDidChangeEmitter = new EventEmitter<Uri>();
	}

	public provideTextDocumentContent(uri: Uri, token: CancellationToken): string {
		const relativePlayerPath = path.join("resources", "player");
		const playerPath = this._context.asAbsolutePath(relativePlayerPath);
		const playerPathHTML = Uri.file(playerPath + "/").path;

		const params = querystring.parse(uri.query);

		const htmlContents = fs
			.readFileSync(path.join(playerPath, "index.html"), "utf8")
			.replace(PlayerContentProvider.VAR_ASSET_PATH, playerPathHTML)
			.replace(PlayerContentProvider.VAR_DASM_PORT, params.port);

		return htmlContents;
	}

	public update(uri: Uri) {
		this._onDidChangeEmitter.fire(uri);
	}

	public dispose() {
		delete this._context;
	}

	get onDidChange(): Event<Uri> {
		return this._onDidChangeEmitter.event;
	}

	private getProjectRoot() {
		const assetPath = this._context.asAbsolutePath(".");
		return Uri.file(assetPath).path;
	}

	private getResourcePath(file: string) {
		return path.join(this.getProjectRoot(), file);
	}
}
