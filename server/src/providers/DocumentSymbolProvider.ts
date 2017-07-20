import {
	DocumentSymbolParams,
	IConnection,
	Position,
	Range,
	SymbolInformation,
	SymbolKind,
} from "vscode-languageserver";

import { IProjectInfoProvider, Provider } from "./Provider";

export default class DocumentSymbolProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onDocumentSymbol((documentSymbolParams:DocumentSymbolParams):SymbolInformation[] => {
			return this.process(documentSymbolParams);
		});
	}

	/**
	 * Returns symbol information
	 */
	public process(documentSymbolParams:DocumentSymbolParams):SymbolInformation[] {
		const fileUri = documentSymbolParams.textDocument.uri;
		const project = this.getProjectInfo().getProjectForFile(fileUri);
		if (fileUri && project) {
			const projectEntryFile = project.getEntryFileInfo();
			const results = project.getAssemblerResults();
			const file = project.getFileInfo(fileUri);

			if (results && results.symbols && file) {
				// Requested symbols for a specific file
				const isFileEntry = projectEntryFile && file.uri === projectEntryFile.uri;
				return results.symbols
					.filter((symbol) => {
						const defFilename = symbol.definitionFilename;
						return (!defFilename && isFileEntry) || (defFilename && fileUri.endsWith(defFilename));
					})
					.map((symbol) => {
						return SymbolInformation.create(
							symbol.name,
							symbol.isLabel ? SymbolKind.Function : SymbolKind.Constant,
							Range.create(
								Position.create(symbol.definitionLineNumber - 1, symbol.definitionColumnStart),
								Position.create(symbol.definitionLineNumber - 1, symbol.definitionColumnEnd),
							),
							file.uri,
						);
					});
			}
		}

		return [];
	}
}
