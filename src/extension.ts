import * as vscode from "vscode";

// https://code.visualstudio.com/docs/extensions/overview
// https://code.visualstudio.com/docs/extensionAPI/overview

export function activate(context: vscode.ExtensionContext) {
	// Only executed the first time an activationEvent command is triggered

	// We need to add all objects to the list of subscriptions
	// Once the extension is deactivated, the references cease to exist
	// And they are garbage-collected
	let disposable = vscode.commands.registerCommand("vscode-javatarijs.openToTheSide", openToTheSide);
	context.subscriptions.push(disposable);

	console.log("vscode-javatarijs is now active.");
}

// Called when the extension is deactivated
export function deactivate() {
	console.log("vscode-javatarijs is now inactive.");
}

function openToTheSide() {
	vscode.window.showInformationMessage("Open To The Side");

	// TODO:
	// 1. Open a new tab with the Javatari.js content
	// 2. Set the new tab with content from the previous tab (compiled)
	// 3. Watch for changes in the previously focused tab
	// 4. Update the new tab when changes are detected
}
