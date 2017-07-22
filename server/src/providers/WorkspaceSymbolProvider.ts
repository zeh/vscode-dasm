import {
	IConnection,
	Position,
	Range,
	SymbolInformation,
	SymbolKind,
	WorkspaceSymbolParams,
} from "vscode-languageserver";

import { IProjectInfoProvider, Provider } from "./Provider";

export default class WorkspaceSymbolProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onWorkspaceSymbol((workspaceSymbolParams:WorkspaceSymbolParams):SymbolInformation[] => {
			return this.process(workspaceSymbolParams);
		});
	}

	/**
	 * Returns symbol information
	 */
	public process(workspaceSymbolParams:WorkspaceSymbolParams):SymbolInformation[] {
		// We also have workspaceSymbolParams.query, but we haven't needed to use it
		// Maybe in the future, for optimization

		const projects = this.getProjectInfo().getAllProjects();
		let symbols:SymbolInformation[] = [];

		for (const project of projects) {
			const results = project.getAssemblerResults();
			if (results && results.symbols) {
				const filenames = new Map<string, string>();
				symbols = symbols.concat(
					results.symbols.map((symbol) => {
						const localFileUri = symbol.definitionFilename as string;
						if (!filenames.has(localFileUri)) {
							const file = localFileUri ? project.getFileInfoLocalUri(localFileUri) : project.getEntryFileInfo();
							if (file) filenames.set(localFileUri, file.uri);
						}
						return SymbolInformation.create(
							symbol.name,
							symbol.isLabel ? SymbolKind.Function : SymbolKind.Constant,
							Range.create(
								Position.create(symbol.definitionLineNumber - 1, symbol.definitionColumnStart),
								Position.create(symbol.definitionLineNumber - 1, symbol.definitionColumnEnd),
							),
							filenames.get(localFileUri),
						);
					}),
				);
			}
		}

		return symbols;
	}
}
