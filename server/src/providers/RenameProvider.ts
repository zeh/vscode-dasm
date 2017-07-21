import {
	IConnection,
	RenameParams,
	TextDocumentEdit,
	TextEdit,
	WorkspaceEdit,
} from "vscode-languageserver";

import LineUtils from "../utils/LineUtils";
import SourceUtils from "../utils/SourceUtils";
import { IProjectInfoProvider, Provider } from "./Provider";

export default class RenameProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onRenameRequest((renameParams:RenameParams):WorkspaceEdit => {
			return this.process(renameParams);
		});
	}

	/**
	 * Returns editing actions
	 */
	public process(renameParams:RenameParams):WorkspaceEdit {
		const line = renameParams.position.line;
		const column = renameParams.position.character;
		const documentChanges:TextDocumentEdit[] = [];

		if (!isNaN(line)) {
			const fileUri = renameParams.textDocument.uri;
			const file = this.getProjectInfo().getFile(fileUri);
			const sourceLines = file ? file.contentsLines : undefined;
			const token = LineUtils.getTokenAtSourcePosition(sourceLines, line, column);
			const project = this.getProjectInfo().getProjectForFile(fileUri);
			const results = project ? project.getAssemblerResults() : undefined;
			const symbols = results ? results.symbols : undefined;
			const symbol = symbols ? symbols.find((tSymbol) => tSymbol.name === token) : undefined;

			if (project && symbol) {
				// Find occurrences in ALL project files
				for (const projectFile of project.getFiles()) {
					if (projectFile.contentsLines) {
						// Find only occurrences that matter
						const occurrences = SourceUtils.findAllOccurrencesOfSymbolInFile(symbol, projectFile.uri, projectFile.contentsLines)
							.filter((occurrence) => !occurrence.isComment);

						// Concatenate them all in the expected format
						documentChanges.push({
							textDocument: {
								uri: projectFile.uri,
								version: projectFile.version,
							},
							edits: occurrences.map((occurrence) => {
								return TextEdit.replace(
									occurrence.range,
									renameParams.newName,
								);
							}),
						});
					}
				}
			}
		}

		return {
			documentChanges,
		};
	}
}
