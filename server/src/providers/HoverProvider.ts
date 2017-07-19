import {
	Hover,
	IConnection,
	ResponseError,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import LanguageDefinition from "../definitions/LanguageDefinition";
import LineUtils from "../utils/LineUtils";
import NumberUtils from "../utils/NumberUtils";
import { IAssemblerResult } from "./Assembler";
import { IProjectInfoProvider, Provider } from "./Provider";

export default class HoverProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onHover((textDocumentPosition) => {
			return this.process(textDocumentPosition);
		});
	}

	/**
	 * Returns hover information
	 */
	public process(textDocumentPositionParams:TextDocumentPositionParams):Hover|ResponseError<void> {
		// Find the line this hover refers to
		const line = textDocumentPositionParams.position.line;
		const fileUri = textDocumentPositionParams.textDocument.uri;
		const file = this.getProjectInfo().getFile(fileUri);
		const sourceLines = file ? file.contentsLines : undefined;
		const results = this.getProjectInfo().getResults();

		if (sourceLines && results && !isNaN(line) && sourceLines.length > line) {
			// Find the char and the surrounding symbol it relates to
			const sourceLine = LineUtils.removeComments(sourceLines[line]);
			if (sourceLine) {
				const character = textDocumentPositionParams.position.character;
				const token = LineUtils.getTokenAtPosition(sourceLine, character);
				if (token) {
					// Will search for valid hover strings based on the target
					let contents:string[]|undefined;
					const range = LineUtils.getTokenRange(sourceLine, token, line, character);

					// Check if the target is an instruction
					if (!contents) contents = this.getInstructionHover(token);

					// Check if the target is a pseudo-op
					if (!contents) contents = this.getPseudoOpsHover(token);

					// Check if the target is a symbol or label
					if (!contents) contents = this.getSymbolOrLabelHover(results, token);

					// Check if the target is a register
					if (!contents) contents = this.getRegisterHover(token);

					if (contents) {
						return {
							contents,
							range,
						};
					}
				}
			}
		}

		return  { contents: [] };
	}

	private getInstructionHover(target:string):string[]|undefined {
		const instructionMatch = LanguageDefinition.Instructions.find((instruction) => {
			return instruction.name.toLowerCase() === target.toLowerCase();
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
			const symbolOrLabel = results.symbols.find((symbol) => symbol.name === target);
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

	private getRegisterHover(target:string):string[]|undefined {
		const registerMatch = LanguageDefinition.Registers.find((register) => {
			return register.name.toLowerCase() === target.toLowerCase();
		});
		if (registerMatch) {
			return [
				`\`${registerMatch.name}\` (register)`,
				registerMatch.description,
				...registerMatch.documentation,
			];
		}
	}

	private getFormattedValue(value:number):string {
		return `* Decimal: \`${NumberUtils.asDecimal(value)}\`\n\n` +
			`* Binary: \`${NumberUtils.asBinary(value)}\`\n\n` +
			`* Octal: \`${NumberUtils.asOctal(value)}\`\n\n` +
			`* Hexa: \`${NumberUtils.asHexa(value)}\`\n\n`;
	}
}
