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

		connection.onDocumentSymbol((symbolParams:DocumentSymbolParams):SymbolInformation[] => {
			return this.process(symbolParams);
		});
	}

	/**
	 * Returns symbol information
	 */
	public process(symbolParams:DocumentSymbolParams):SymbolInformation[] {
		const fileUriRequested = symbolParams.textDocument.uri;
		const results = this.getProjectInfo().getResults();
		console.log("[symbols] Symbols requested for ", fileUriRequested);

		if (fileUriRequested && results && results.symbols) {
			// Requested symbols for a specific file
			const file = this.getProjectInfo().getFile(fileUriRequested);
			return results.symbols
				.filter((symbol) => {
					return !symbol.definitionFilename || fileUriRequested.endsWith(symbol.definitionFilename);
				})
				.map((symbol) => {
					return SymbolInformation.create(
						symbol.name,
						symbol.isLabel ? SymbolKind.Function : SymbolKind.Constant,
						// TODO: use correct range for symbol definition!
						Range.create(Position.create(symbol.definitionLineNumber - 1, 0), Position.create(symbol.definitionLineNumber - 1, 1)),
						file ? file.uri : fileUriRequested,
					);
				});
		} else {
			return [];
		}
	}
}
