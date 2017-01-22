import {
	Hover,
	ResponseError,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import { IAssemblerResult, ISymbol } from './Assembler';

export default class HoverProvider {

	constructor() {

	}

	/**
	 * Returns hover information
	 */
	public process(textDocumentPosition:TextDocumentPositionParams, source:string, results:IAssemblerResult):Hover|ResponseError<void> {
		// Find the line this hover refers to
		const line = textDocumentPosition.position.line;
		const sourceLines = source.split("\n");
		const removeCommentsRegex = /^(.*?)(;.*|)$/;
		if (!isNaN(line) && sourceLines.length > line) {
			// Find the char and the surrounding symbol it relates to
			const sourceLine = sourceLines[line];
			const character = textDocumentPosition.position.character;
			const sourceLineNoCommentsMatch = sourceLine.match(removeCommentsRegex);
			if (sourceLineNoCommentsMatch && sourceLineNoCommentsMatch[1]) {
				const sourceLineNoComments = sourceLineNoCommentsMatch[1];
				if (character < sourceLineNoComments.length) {
					const targetRegex = new RegExp("^.{0," + character + "}\\b([\\w.]*)\\b.*$");
					const targetMatch = sourceLine.match(targetRegex);
					if (targetMatch && targetMatch[1]) {
						const targetName = targetMatch[1];
						if (results.symbols) {
							let symbolOrLabel = results.symbols.find((symbol) => symbol.name === targetName);
							if (symbolOrLabel) {
								const symbolType = symbolOrLabel.isConstant ? "Constant" : "Label";
								const symbolValue = symbolOrLabel.value;
								return {
									contents: `(${symbolType}) ${targetName} = ${symbolValue} | %${symbolValue.toString(2)} | 0${symbolValue.toString(8)} | $${symbolValue.toString(16)}`,
									//range:
								};
							}
						}
					}
				}
			}
		}

		return new ResponseError<void>(0, "Cancelled");
	}
}
