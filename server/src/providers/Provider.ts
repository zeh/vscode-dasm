import { IConnection } from "vscode-languageserver";

import { IAssemblerResult } from "./Assembler";
import { ISettings } from "./SettingsProvider";

export interface IPostCompilationProvider {
	process(uri:string, sourceLines:string[], results:IAssemblerResult):void;
}

export type SourceProvider = () => string[]|undefined;
export type ResultsProvider = () => IAssemblerResult|undefined;

export interface IProjectInfoProvider {
	getSource:() => string[]|undefined;
	getResults:() => IAssemblerResult|undefined;
	getUriForProjectFile:(localUri:string) => string|undefined;
	getSourceForProjectFile:(uri:string) => string[]|undefined;
	getSettings:() => ISettings;
}

export class Provider {
	private _connection:IConnection;
	private _projectInfoProvider:IProjectInfoProvider;

	constructor(connection:IConnection, projectInfoProvider:IProjectInfoProvider) {
		this._connection = connection;
		this._projectInfoProvider = projectInfoProvider;
	}

	public getConnection():IConnection {
		return this._connection;
	}

	public getProjectInfo():IProjectInfoProvider {
		return this._projectInfoProvider;
	}
}
