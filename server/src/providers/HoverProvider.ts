import {
	Hover,
	Position,
	Range,
	ResponseError,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import LanguageDefinition from "../definitions/LanguageDefinition";
import LineUtils from "../utils/LineUtils";
import { IAssemblerResult } from "./Assembler";

export default class HoverProvider {

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
				const lineString = sourceLineNoCommentsMatch[1];
				const token = LineUtils.getTokenAtPosition(lineString, character);
				if (token) {
					// Will search for valid hover strings based on the target
					let contents:string[]|undefined;
					const rangeToken = LineUtils.getTokenRangeInLine(lineString, token, character);
					const range:Range|undefined = rangeToken ?
						Range.create(Position.create(line, rangeToken.start), Position.create(line, rangeToken.end)) :
						undefined;

					// Check if the target is an instruction
					if (!contents) contents = this.getInstructionHover(token);

					// Check if the target is a pseudo-op
					if (!contents) contents = this.getPseudoOpsHover(token);

					// Check if the target is a symbol or label
					if (!contents) contents = this.getSymbolOrLabelHover(results, token);

					if (contents) {
						return {
							contents,
							range,
						};
					}
				}
			}
		}

		return new ResponseError<void>(0, "Cancelled");
	}

	private getInstructionHover(target:string):string[]|undefined {
		const instructionMatch = LanguageDefinition.Instructions.find((instruction) => {
			return instruction.name.toLowerCase() === target.toLowerCase()
		});
		if (instructionMatch) {
			return [
				`(instruction) \`${instructionMatch.name}\`: ${instructionMatch.description}`,
			];
		}
	}

	private getPseudoOpsHover(target:string):string[]|undefined {
		const pseudoOpMatch = LanguageDefinition.PseudoOps.find((pseudoOp) => {
			return pseudoOp.name.toLowerCase() === target.toLowerCase() ||
				pseudoOp.otherNames.some((otherName) => otherName.toLowerCase() === target.toLowerCase());
		});
		if (pseudoOpMatch) {
			return [
				`(pseudo-op) \`${pseudoOpMatch.name}\`: ${pseudoOpMatch.description}`,
			];
		}
	}

	private getSymbolOrLabelHover(results:IAssemblerResult, target:string):string[]|undefined {
		if (results.symbols) {
			let symbolOrLabel = results.symbols.find((symbol) => symbol.name === target);
			if (symbolOrLabel) {
				if (symbolOrLabel.isConstant) {
					// Symbol
					return [
						`(symbol) \`${symbolOrLabel.name}\``,
						this.getFormattedValue(symbolOrLabel.value),
					];
				} else {
					// Label
					return [
						`(label) \`${symbolOrLabel.name}\``,
						this.getFormattedValue(symbolOrLabel.value),
					];
				}
			}
		}
	}

	private getFormattedValue(value:number):string {
		return "* Decimal: `" + value + "`\n\n" +
			"* Binary: `%" + value.toString(2) + "`\n\n" +
			"* Octal: `0" + value.toString(8) + "`\n\n" +
			"* Hexa: `$" + value.toString(16) + "`\n\n";
	}
}
