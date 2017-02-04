import {
	IConnection,
	Location,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import LineUtils from "../utils/LineUtils";
import { IProjectInfoProvider, Provider } from "./Provider";

export default class DefinitionProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onDefinition((textDocumentPosition:TextDocumentPositionParams):Location[] => {
			return this.process(textDocumentPosition);
		});
	}

	/**
	 * Returns definition information
	 */
	public process(textDocumentPositionParams:TextDocumentPositionParams):Location[] {
		const locations:Location[] = [];
		const line = textDocumentPositionParams.position.line;
		const sourceLines = this.getProjectInfo().getSource();
		const results = this.getProjectInfo().getResults();

		if (sourceLines && results && !isNaN(line) && sourceLines.length > line && results.symbols) {
			// Find the char and the surrounding symbol it relates to
			const sourceLine = LineUtils.removeComments(sourceLines[line]);
			if (sourceLine) {
				const character = textDocumentPositionParams.position.character;
				const token = LineUtils.getTokenAtPosition(sourceLine, character);
				const symbol = results.symbols.find((tSymbol) => tSymbol.name === token);
				if (token && symbol && symbol.definitionLineNumber > 0) {
					const definitionLine = symbol.definitionLineNumber - 1;
					if (symbol.definitionFilename) {
						// Definition is in another file
						const otherUri:string|undefined = this.getProjectInfo().getUriForProjectFile(symbol.definitionFilename);
						const otherSource:string[]|undefined = otherUri ? this.getProjectInfo().getSourceForProjectFile(otherUri) : undefined;

						if (otherUri && otherSource) {
							const tokenRange = LineUtils.getTokenRange(otherSource[definitionLine], token, definitionLine);
							if (tokenRange) {
								locations.push(Location.create(otherUri, tokenRange));
							}
						}
					} else {
						// Definition is in the same file
						const tokenRange = LineUtils.getTokenRange(sourceLines[definitionLine], token, definitionLine);
						if (tokenRange) {
							locations.push(Location.create(textDocumentPositionParams.textDocument.uri, tokenRange));
						}
					}
				}
			}
		}

		return locations;
	}
}
