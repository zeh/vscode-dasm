// Reference:
// https://code.visualstudio.com/docs/extensions/example-language-server
// https://code.visualstudio.com/docs/extensions/language-support#_programmatic-language-support

import {
	CompletionItem,
	CompletionItemKind,
	createConnection,
	Diagnostic,
	IConnection,
	InitializeResult,
	IPCMessageReader,
	IPCMessageWriter,
	Location,
	TextDocument,
	TextDocumentPositionParams,
	TextDocuments,
} from "vscode-languageserver";

import ProjectManager from "./project/ProjectManager";

// Create a connection for the server. The connection uses Node's IPC as a transport
const connection:IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const projectManager = new ProjectManager(connection);
projectManager.start();

// Create all needed provider instances
interface ISettings {
	["vscode-dasm"]:IExtensionSettings;
}

interface IExtensionSettings {
	preferUppercase:string[];
}

/*
// Hold settings
let preferUppercase:string[];

// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	let settings = <ISettings>change.settings;
	preferUppercase = settings["vscode-dasm"].preferUppercase;

	console.log("[server] Uppercase preference is ", preferUppercase);

	// Revalidate any open text documents
	documents.all().forEach(assembleDocument);
});

function assembleDocument(textDocument:TextDocument):void {
	console.log("[server] Assembling");


	// Provide diagnostics
	const diagnostics:Diagnostic[] = diagnosticsProvider.process(currentSourceLines, currentResults);

	// Send the computed diagnostics to VSCode
	connection.sendDiagnostics({ uri:textDocument.uri, diagnostics });
}


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition:TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	return [
		{
			label: "processor",
			kind: CompletionItemKind.Text,
			data: 1,
		}
	]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (item.data === 1) {
		item.detail = "Processor type";
		item.documentation = "Selects the processor type for the assembly";
	}
	return item;
});

connection.onDidChangeWatchedFiles((change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
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

