import {
	IConnection,
	Location,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import { IProjectFile } from "../project/ProjectFiles";
import LineUtils from "../utils/LineUtils";
import { IProjectInfoProvider, Provider } from "./Provider";

export default class DefinitionProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onDefinition((textDocumentPositionParams:TextDocumentPositionParams):Location[] => {
			return this.process(textDocumentPositionParams);
		});
	}

	/**
	 * Returns definition information
	 */
	public process(textDocumentPositionParams:TextDocumentPositionParams):Location[] {
		const locations:Location[] = [];
		const line = textDocumentPositionParams.position.line;
		const fileUri = textDocumentPositionParams.textDocument.uri;
		const file = this.getProjectInfo().getFile(fileUri);
		const sourceLines = file ? file.contentsLines : undefined;
		const results = this.getProjectInfo().getAssemblerResults(fileUri);

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
						const otherUri:string|undefined = this.getProjectInfo().getFileByLocalUri(symbol.definitionFilename);
						const otherFile:IProjectFile|undefined = otherUri ? this.getProjectInfo().getFile(otherUri) : undefined;
						const otherSource:string[]|undefined = otherFile ? otherFile.contentsLines : undefined;

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
