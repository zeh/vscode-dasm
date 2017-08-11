import {
	ExtensionContext,
	workspace,
} from "vscode";

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from "vscode-languageclient";

import * as path from "path";

import PlayerTabProvider from "./player/PlayerTabProvider";

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
	const serverModule = context.asAbsolutePath(path.join("out", "server", "src", "server.js"));
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

	context.subscriptions.push(commands.registerCommand("extension.vscode-dasm.provideInitialConfigurations", () => {
		return [
			"// Use IntelliSense to learn about possible dasm debug attributes.",
			"// Hover to view descriptions of existing attributes.",
			"// On 'program', use '${command:GetCurrentProgramName}' to use the current window as the source,",
			"// or '${workspaceRoot}' as the root, e.g. '${workspaceRoot}/entry.asm'",
			JSON.stringify(getInitialConfigurations(), null, "\t"),
		].join("\n");
	}));

	context.subscriptions.push(commands.registerCommand("extension.vscode-dasm.getCurrentProgramName", () => {
		return getCurrentFileUri(true);
	}));

	// Register tab provider so we can open a preview tab when we start debugging
	const previewTabProvider = new PlayerTabProvider(context, "extension.vscode-dasm.openPlayerWindow", (config) => {
		commands.executeCommand("vscode.startDebug", config);
	});
	context.subscriptions.push(previewTabProvider);

	console.log("vscode-dasm is now active.");
}

function getCurrentFileUri(absolute: boolean) {
	const currentFile = window.activeTextEditor ? window.activeTextEditor.document.uri : null;
	if (currentFile) {
		if (absolute) {
			return currentFile.fsPath;
		} else {
			const workspacePath = workspace.rootPath;
			if (workspacePath) return path.posix.relative(workspacePath, currentFile.fsPath);
		}
	}
	return "?";
}

function getInitialConfigurations() {
	return {
		version: "0.0.1",
		configurations: [
			{
				type: "dasm",
				request: "launch",
				name: "dasm Debug",
				program: "${command:GetCurrentProgramName}",
				stopOnEntry: true,
			},
		],
	};
}

// Called when the extension is deactivated
export function deactivate() {
	console.log("vscode-dasm is now inactive.");
}
