import {
	commands,
	ExtensionContext,
	Uri,
	ViewColumn,
	window,
	workspace,
} from "vscode";

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

	// Create a content provider for the preview tab
	const provider = new JavatariDocumentContentProvider(context);
	context.subscriptions.push(provider);
	workspace.registerTextDocumentContentProvider("javatari-preview", provider);

	// We need to add all objects to the list of subscriptions
	// Once the extension is deactivated, the references cease to exist
	// And they are garbage-collected
	let disposable = commands.registerCommand("vscode-dasm.openToTheSide", () => {
		openToTheSide(context);
	});
	context.subscriptions.push(disposable);

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
	const src = window.activeTextEditor.document.getText();
	// const src = fs.readFileSync(context.asAbsolutePath("assets/_test.asm"), "utf8");
	const assembler = new RomAssembler(src);
	console.log("[compile] Done compiling");
}

function createPreviewTab(context:ExtensionContext) {
	let path = Uri.parse("javatari-preview://preview/filename");
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
