import {
	Hover,
	ResponseError,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import LanguageDefinition from "../definitions/LanguageDefinition";
import { IAssemblerResult, ISymbol } from "./Assembler";

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
				const sourceLineNoComments = sourceLineNoCommentsMatch[1];
				if (character < sourceLineNoComments.length) {
					const targetRegex = new RegExp("^.{0," + character + "}\\b([\\w.]*)\\b.*$");
					const targetMatch = sourceLine.match(targetRegex);
					if (targetMatch && targetMatch[1]) {
						// Will search for valid hover strings based on the target
						const targetName = targetMatch[1];
						let contents:string[]|undefined;
						let range:{start:number, end:number}|undefined;

						// Check if the target is an instruction
						if (!contents) contents = this.getInstructionHover(targetName);

						// Check if the target is a pseudo-op
						if (!contents) contents = this.getPseudoOpsHover(targetName);

						// Check if the target is a symbol or label
						if (!contents) contents = this.getSymbolOrLabelHover(results, targetName);

						if (contents) {
							return {
								contents,
								//range,
							};
						}
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
