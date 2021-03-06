import {
	DocumentLink,
	DocumentLinkParams,
	IConnection,
	Position,
	Range,
} from "vscode-languageserver";

import { IProjectFile } from "../project/ProjectFiles";
import { IProjectInfoProvider, Provider } from "./Provider";

export default class DocumentLinkProvider extends Provider {

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onDocumentLinks((documentLink:DocumentLinkParams):DocumentLink[] => {
			return this.process(documentLink);
		});

		connection.onDocumentLinkResolve((documentLink:DocumentLink):DocumentLink => {
			return documentLink;
		});
	}

	/**
	 * Returns link information
	 */
	public process(documentLink:DocumentLinkParams):DocumentLink[] {
		const fileUriRequested = documentLink.textDocument.uri;
		if (!fileUriRequested) {
			// No file requested: return the project roots
			return this.getProjectInfo().getAllProjects()
				.filter((project) => Boolean(project.getEntryFileInfo()))
				.map((project) => {
					return DocumentLink.create(
						Range.create(Position.create(0, 0), Position.create(0, 0)),
						(project.getEntryFileInfo() as IProjectFile).uri,
					);
				});
		} else {
			// Requested links for a specific file: return it
			const file = this.getProjectInfo().getFile(fileUriRequested);
			if (file) {
				return this.buildLinksForFile(file);
			} else {
				return [];
			}
		}
	}

	private buildLinksForFile(file:IProjectFile): DocumentLink[] {
		return file.dependencies.map((dependency) => {
			return DocumentLink.create(
				dependency.range,
				dependency.file ? dependency.file.uri : dependency.parentRelativeUri,
			);
		});
		// return [
		// 	{
		// 		range: Range.create(Position.create(0, 0), Position.create(0, 1)),
		// 		target: "aaa.aa",
		// 	},
		// ];

	}
}
