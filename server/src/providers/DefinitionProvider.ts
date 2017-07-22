import {
	IConnection,
	Location,
	Position,
	Range,
	TextDocumentPositionParams,
} from "vscode-languageserver";

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
		const project = this.getProjectInfo().getProjectForFile(fileUri);
		const results = project ? project.getAssemblerResults() : undefined;

		if (sourceLines && project && results && !isNaN(line) && sourceLines.length > line && results.symbols) {
			// Find the char and the surrounding symbol it relates to
			const sourceLine = LineUtils.removeComments(sourceLines[line]);
			if (sourceLine) {
				const character = textDocumentPositionParams.position.character;
				const token = LineUtils.getTokenAtLinePosition(sourceLine, character);
				const symbol = results.symbols.find((tSymbol) => tSymbol.name === token);
				if (token && symbol && symbol.definitionLineNumber > 0) {
					const definitionFile = symbol.definitionFilename ? project.getFileInfoLocalUri(symbol.definitionFilename) : project.getEntryFileInfo();
					if (definitionFile) {
						const definitionLine = symbol.definitionLineNumber - 1;
						locations.push(
							Location.create(
								definitionFile.uri,
								Range.create(
									Position.create(definitionLine, symbol.definitionColumnStart),
									Position.create(definitionLine, symbol.definitionColumnEnd),
								),
							),
						);
					}
				}
			}
		}

		return locations;
	}
}
