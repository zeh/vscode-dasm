import {
	DidChangeConfigurationParams,
	IConnection,
} from "vscode-languageserver";

import { IProjectInfoProvider, Provider } from "./Provider";

interface IGlobalSettings {
	["vscode-dasm"]:ISettings;
}

interface ISettings {
	preferUppercase:UppercaseTypes[];
}

export type UppercaseTypes = "instructions"|"symbols"|"registers"|"pseudoops"|"all";

export default class SettingsProvider extends Provider {

	private _current:ISettings;

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		super(connection, projectInfoProvider);

		connection.onDidChangeConfiguration((changeConfigurationParams:DidChangeConfigurationParams) => {
			const settings = <IGlobalSettings>changeConfigurationParams.settings;
			this.process(<ISettings>settings["vscode-dasm"]);
		});
	}

	private process(newSettings:ISettings) {
		this._current = newSettings;
		console.log("[settings] CHANGED:", this._current);
		// TODO: Revalidate any open text documents
		// documents.all().forEach(assembleDocument);
	}

	public getCurrent():ISettings {
		return this._current;
	}
}
