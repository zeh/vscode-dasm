import {
	Position,
	Range,
} from "vscode-languageserver";

import { ISymbol } from "../providers/Assembler";
import LineUtils from "../utils/LineUtils";

export interface ISymbolOccurrenceInfo {
	range: Range;
	isComment: boolean;
	isDeclaration: boolean;
}

export default class SourceUtils {

	/**
	 * Checks if this is the definition line for the symbol
	 */
	public static isDefinitionLine(symbol:ISymbol, fileUri:string, line:number, column:number):boolean {
		if (symbol) {
			const hasDefFilename = Boolean(symbol.definitionFilename);
			const fileMatches = (!hasDefFilename && !fileUri) || (hasDefFilename && fileUri.endsWith(symbol.definitionFilename as string));
			return fileMatches && symbol.definitionLineNumber === line + 1 && symbol.definitionColumnStart === column;
		}
		return false;
	}

	public static findAllOccurrencesOfSymbolInFile(symbol:ISymbol, fileUri:string, sourceLines:string[]):ISymbolOccurrenceInfo[] {
		let occurrences:ISymbolOccurrenceInfo[] = [];

		sourceLines.forEach((sourceLine, lineIndex) => {
			const tokenPositions = LineUtils.getTokenPositions(sourceLine, symbol.name);
			occurrences = occurrences.concat(tokenPositions.map((tokenPosition) => {
				const commentStartPosition = sourceLine.indexOf(";");
				return {
					range: Range.create(
						Position.create(lineIndex, tokenPosition.start),
						Position.create(lineIndex, tokenPosition.end),
					),
					isComment: commentStartPosition > -1 && tokenPosition.start >= commentStartPosition,
					isDeclaration: SourceUtils.isDefinitionLine(symbol, fileUri, lineIndex, tokenPosition.start),
				};
			}));
		});

		return occurrences;
	}
}
//		const symbolInfo = symbols.find((symbol) => symbol.name === token);

