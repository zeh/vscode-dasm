import * as fs from "fs";
import * as path from "path";
import {
	CancellationToken,
	Event,
	EventEmitter,
	ExtensionContext,
	TextDocumentContentProvider,
	Uri,
} from "vscode";

export default class JavatariDocumentContentProvider implements TextDocumentContentProvider  {

	public static readonly VAR_ASSET_PATH = /\$\{ASSET_PATH\}/g;

	private _onDidChangeEmitter:EventEmitter<Uri>;
	private _context:ExtensionContext;

	constructor(context:ExtensionContext) {
		this._context = context;
		this._onDidChangeEmitter = new EventEmitter<Uri>();
	}

	public provideTextDocumentContent(uri:Uri, token:CancellationToken): string {
		const relativeAssetPath = path.join("assets");
		const assetPath = this._context.asAbsolutePath(relativeAssetPath);
		const assetPathHTML = "file:///" + assetPath.replace(/\\/g, "/") + "/";

		const htmlContents = fs
			.readFileSync(path.join(assetPath, "index.html"), "utf8")
			.replace(
				JavatariDocumentContentProvider.VAR_ASSET_PATH,
				assetPathHTML);

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
}
