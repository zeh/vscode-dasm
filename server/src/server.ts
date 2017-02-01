// Reference:
// https://code.visualstudio.com/docs/extensions/example-language-server
// https://code.visualstudio.com/docs/extensions/language-support#_programmatic-language-support

import {
	createConnection,
	IConnection,
	IPCMessageReader,
	IPCMessageWriter,
} from "vscode-languageserver";

import ProjectManager from "./project/ProjectManager";

// Create a connection for the server. The connection uses Node's IPC as a transport
const connection:IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const projectManager = new ProjectManager(connection);
projectManager.start();

// Create all needed provider instances

/* Never fired?
connection.onDidChangeWatchedFiles((change) => {
	// Monitored files have change in VSCode
	console.log("We received an file change event");
	connection.console.log("We received an file change event");
});
*/

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed:${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

