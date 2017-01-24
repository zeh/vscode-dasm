import {
	Location,
	Position,
	Range,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import LineUtils from "../utils/LineUtils";
import { IAssemblerResult } from "./Assembler";

export default class DefinitionProvider {

	/**
	 * Returns definition information
	 */
	public process(textDocumentPosition:TextDocumentPositionParams, sourceLines:string[], results:IAssemblerResult):Location[] {
		const locations:Location[] = [];
		const line = textDocumentPosition.position.line;
		if (!isNaN(line) && sourceLines.length > line && results.symbols) {
			// Find the char and the surrounding symbol it relates to
			const removeCommentsRegex = /^(.*?)(;.*|)$/;
			const sourceLine = sourceLines[line];
			const character = textDocumentPosition.position.character;
			const sourceLineNoCommentsMatch = sourceLine.match(removeCommentsRegex);
			if (sourceLineNoCommentsMatch && sourceLineNoCommentsMatch[1]) {
				const lineString = sourceLineNoCommentsMatch[1];
				const token = LineUtils.getTokenAtPosition(lineString, character);
				const symbol = results.symbols.find((symbol) => symbol.name === token);
				if (token && symbol && symbol.definitionLineNumber > 0 && !symbol.definitionFilename) {
					console.log("token " + token + " at line " + symbol.definitionLineNumber);
					// TODO: only allowing current file definitions! Need to add from included files
					const definitionLine = symbol.definitionLineNumber - 1;
					const rangeToken = LineUtils.getTokenRangeInLine(sourceLines[definitionLine], token);
					console.log("token " + token + " at range ", rangeToken);
					if (rangeToken) {
						locations.push(
							Location.create(textDocumentPosition.textDocument.uri,
								Range.create(
									Position.create(definitionLine, rangeToken.start),
									Position.create(definitionLine, rangeToken.end)))
						);
					}
				}
			}
		}

		return locations;
	}
}
