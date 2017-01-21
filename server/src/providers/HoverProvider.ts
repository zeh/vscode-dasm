import {
	Hover,
	TextDocumentPositionParams,
} from "vscode-languageserver";

export default class HoverProvider {

	constructor() {

	}

	/**
	 * Returns hover information
	 */
	public process(textDocumentPosition:TextDocumentPositionParams):Hover {
		return {
			contents: "Null",
		};
	}
}
