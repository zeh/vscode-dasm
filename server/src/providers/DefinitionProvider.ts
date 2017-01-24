import {
	Location,
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
			const sourceLine = LineUtils.removeComments(sourceLines[line]);
			if (sourceLine) {
				const character = textDocumentPosition.position.character;
				const token = LineUtils.getTokenAtPosition(sourceLine, character);
				const symbol = results.symbols.find((tSymbol) => tSymbol.name === token);
				if (token && symbol && symbol.definitionLineNumber > 0 && !symbol.definitionFilename) {
					// TODO: only allowing current file definitions! Need to add from included files
					const definitionLine = symbol.definitionLineNumber - 1;
					const tokenRange = LineUtils.getTokenRange(sourceLines[definitionLine], token, definitionLine);
					if (tokenRange) {
						locations.push(Location.create(textDocumentPosition.textDocument.uri, tokenRange));
					}
				}
			}
		}

		return locations;
	}
}
