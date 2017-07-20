import { IConnection } from "vscode-languageserver";

import { IProjectFile } from "./../project/ProjectFiles";
import { IAssemblerResult } from "./Assembler";
import { ISettings } from "./SettingsProvider";

export interface IPostCompilationProvider {
	process(files:IProjectFile[], results?:IAssemblerResult):void;
}

export interface IProjectInfoProvider {
	getEntryFiles:() => IProjectFile[];
	getFile:(uri:string) => IProjectFile|undefined;
	getAssemblerResults:(uri:string) => IAssemblerResult|undefined;
	getFileByLocalUri:(localUri:string) => string|undefined;
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
