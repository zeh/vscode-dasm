import {
	commands,
	Disposable,
	ExtensionContext,
	Uri,
	ViewColumn,
	window,
	workspace,
} from "vscode";

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from "vscode-languageclient";

import * as path from "path";

import RomAssembler from "./assembler/RomAssembler";
import JavatariDocumentContentProvider from "./JavatariDocumentContentProvider";

// https://code.visualstudio.com/docs/extensions/overview
// https://code.visualstudio.com/docs/extensionAPI/overview

// Language extensions:
// https://code.visualstudio.com/docs/extensions/language-support

// Language server:
// https://code.visualstudio.com/docs/extensions/example-language-server
// https://github.com/Microsoft/vscode-languageserver-node

export function activate(context:ExtensionContext) {
	// Only executed the first time an activationEvent command is triggered

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(path.join("out", "server", "server.js"));
	// The debug options for the server
	const debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: ["dasm"],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: "vscode-dasm",
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
		},
	};

	// Create the language client and start the client
	const languageClient = new LanguageClient("vscode-dasm", "Language Server for VSCode-dasm", serverOptions, clientOptions);
	const disposableLanguageClient = languageClient.start();
	context.subscriptions.push(disposableLanguageClient);

	// Create a content provider for the preview tab
	const provider = new JavatariDocumentContentProvider(context);
	context.subscriptions.push(provider);
	workspace.registerTextDocumentContentProvider("javatari-preview", provider);

	// We need to add all objects to the list of subscriptions
	// Once the extension is deactivated, the references cease to exist
	// And they are garbage-collected
	const disposableCommand = commands.registerCommand("vscode-dasm.openToTheSide", () => {
		openToTheSide(context);
	});
	context.subscriptions.push(disposableCommand);

	console.log("vscode-dasm is now active.");
}

// Called when the extension is deactivated
export function deactivate() {
	console.log("vscode-dasm is now inactive.");
}

function openToTheSide(context:ExtensionContext) {
	openExampleGame(context)
		.then((result) => {
			console.log("Document opened!");
			const b = compileGame(context);

		}, window.showErrorMessage);

	createPreviewTab(context)
		.then((result) => {
			console.log("Editor shown!");
			// this.enterExampleGame();
		}, window.showErrorMessage);

	// TODO:
	// * Compile the code from the active tab
	// * Set the new tab with the compile code
	// * Watch for changes in the previously focused tab
	// * Update the new tab when changes are detected

	// Future:
	// * Allow debugging?
	// * Syntax highlighting and autocompletion?
	// * Linting and automatic compilation?
	// * Side panel with compiled byte code?
	// * Code size on status bar?
}

function compileGame(context:ExtensionContext) {
	// Compiles the current tab
	if (window.activeTextEditor) {
		const src = window.activeTextEditor.document.getText();
		// const src = fs.readFileSync(context.asAbsolutePath("assets/_test.asm"), "utf8");
		const assembler = new RomAssembler(src);
		console.log("[compile] Done compiling");
	}
}

function createPreviewTab(context:ExtensionContext) {
	const path = Uri.parse("javatari-preview://preview/filename");
	return commands.executeCommand("vscode.previewHtml", path, ViewColumn.Three);
}

function openExampleGame(context:ExtensionContext) {
	// Open a game source in the currently active tab
	// TODO: this is temporary, for testing purposes only
	const docPath = Uri.file(context.asAbsolutePath("assets/_test.asm"));
	return workspace.openTextDocument(docPath).then((doc) => {
		return window.showTextDocument(doc, ViewColumn.One);
	});
}
