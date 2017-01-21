// Reference:
// https://code.visualstudio.com/docs/extensions/example-language-server
// https://code.visualstudio.com/docs/extensions/language-support#_programmatic-language-support

import {
	Hover,
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind,
} from "vscode-languageserver";

import { Assembler, IAssemblerResult } from "./providers/Assembler";
import DiagnosticsProvider from "./providers/DiagnosticsProvider";
import HoverProvider from "./providers/HoverProvider";

// Create a connection for the server. The connection uses Node's IPC as a transport
const connection:IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create all needed provider instances
const assembler = new Assembler();
const diagnosticsProvider = new DiagnosticsProvider();
const hoverProvider = new HoverProvider();

let currentResults:IAssemblerResult;

// Use full document sync only for open, change and close text document events
const documents:TextDocuments = new TextDocuments();
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let workspaceRoot:string;

connection.onInitialize((params):InitializeResult => {
	workspaceRoot = params.rootPath;

	return {
		// Tells the client about the server's capabilities
		capabilities: {
			// The server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,

			// The server supports hover
			hoverProvider: true,

			// The server supports code complete
			completionProvider: {
				resolveProvider: true,
			},
		},
	};
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	assembleDocument(change.document);
});


// The settings interface DESCRIBE the server relevant settings part
interface Settings {
	languageServerExample:ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
	maxNumberOfProblems:number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems:number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;

	// Revalidate any open text documents
	documents.all().forEach(assembleDocument);
});

function assembleDocument(textDocument:TextDocument):void {
	console.log("[server] Assembling");

	// Assemble first
	const src = textDocument.getText();
	currentResults = assembler.assemble(src);

	// Provide diagnostics
	const diagnostics:Diagnostic[] = diagnosticsProvider.process(src, currentResults);

	// Send the computed diagnostics to VSCode
	connection.sendDiagnostics({ uri:textDocument.uri, diagnostics });
}

connection.onHover((textDocumentPosition:TextDocumentPositionParams) => {
	return hoverProvider.process(textDocumentPosition);
});

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

// Finally, listen on the connection
connection.listen();
