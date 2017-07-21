import {
	IConnection,
	Location,
	ReferenceParams,
} from "vscode-languageserver";

import LineUtils from "../utils/LineUtils";
import SourceUtils from "../utils/SourceUtils";
import { IProjectInfoProvider, Provider } from "./Provider";

export default class ReferencesProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onReferences((referenceParams:ReferenceParams):Location[] => {
			return this.process(referenceParams);
		});
	}

	/**
	 * Returns reference positions
	 */
	public process(referenceParams:ReferenceParams):Location[] {
		const line = referenceParams.position.line;
		const column = referenceParams.position.character;
		let locations:Location[] = [];

		if (!isNaN(line)) {
			const fileUri = referenceParams.textDocument.uri;
			const file = this.getProjectInfo().getFile(fileUri);
			const sourceLines = file ? file.contentsLines : undefined;
			const token = LineUtils.getTokenAtSourcePosition(sourceLines, line, column);
			const project = this.getProjectInfo().getProjectForFile(fileUri);
			const results = project ? project.getAssemblerResults() : undefined;
			const symbols = results ? results.symbols : undefined;

			if (project && token && sourceLines && symbols) {
				const symbol = symbols ? symbols.find((tSymbol) => tSymbol.name === token) : undefined;
				if (symbol) {

					// Find occurrences in ALL project files
					for (const projectFile of project.getFiles()) {
						if (projectFile.contentsLines) {
							// Find only occurrences that matter
							const occurrences = SourceUtils.findAllOccurrencesOfSymbolInFile(symbol, projectFile.uri, projectFile.contentsLines)
								.filter((occurrence) => !occurrence.isComment)
								.filter((occurrence) => !occurrence.isDeclaration || referenceParams.context.includeDeclaration);

							// Concatenate them all in the expected format
							locations = locations.concat(occurrences.map((occurrence) => {
								return Location.create(
									projectFile.uri,
									occurrence.range,
								);
							}));
						}
					}
				}
			}
		}

		return locations;
	}
}
