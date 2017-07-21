import {
	DocumentHighlight,
	DocumentHighlightKind,
	IConnection,
	TextDocumentPositionParams,
} from "vscode-languageserver";

import LineUtils from "../utils/LineUtils";
import SourceUtils from "../utils/SourceUtils";
import { IProjectInfoProvider, Provider } from "./Provider";

export default class DocumentHighlightProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onDocumentHighlight((textDocumentPositionParams:TextDocumentPositionParams):DocumentHighlight[] => {
			return this.process(textDocumentPositionParams);
		});
	}

	/**
	 * Returns highlight information
	 */
	public process(textDocumentPositionParams:TextDocumentPositionParams):DocumentHighlight[] {
		const line = textDocumentPositionParams.position.line;
		const column = textDocumentPositionParams.position.character;
		let highlights:DocumentHighlight[] = [];

		if (!isNaN(line)) {
			const fileUri = textDocumentPositionParams.textDocument.uri;
			const file = this.getProjectInfo().getFile(fileUri);
			const sourceLines = file ? file.contentsLines : undefined;
			const token = LineUtils.getTokenAtSourcePosition(sourceLines, line, column);
			const project = this.getProjectInfo().getProjectForFile(fileUri);
			const results = project ? project.getAssemblerResults() : undefined;
			const symbols = results ? results.symbols : undefined;

			if (token && sourceLines && symbols) {
				const symbol = symbols ? symbols.find((tSymbol) => tSymbol.name === token) : undefined;
				if (symbol) {
					const occurrences = SourceUtils.findAllOccurrencesOfSymbolInFile(symbol, fileUri, sourceLines);
					highlights = highlights.concat(occurrences.map((occurrence) => {
						return DocumentHighlight.create(
							occurrence.range,
							occurrence.isComment ? DocumentHighlightKind.Text :
								(occurrence.isDeclaration ? DocumentHighlightKind.Write : DocumentHighlightKind.Read),
						);
					}));
				}
			}
		}

		return highlights;
	}
}
