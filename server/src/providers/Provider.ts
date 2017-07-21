import { IConnection } from "vscode-languageserver";

import Project from "../project/Project";
import { IProjectFile } from "./../project/ProjectFiles";
import { IAssemblerResult } from "./Assembler";
import { ISettings } from "./SettingsProvider";

export interface IPostAssemblyProvider {
	process(files:IProjectFile[], results?:IAssemblerResult):void;
}

export interface IProjectInfoProvider {
	getAllProjects:() => Project[];
	getProjectForFile:(uri:string) => Project|undefined;
	getFile:(uri:string) => IProjectFile|undefined;
	getFileByLocalUri:(localUri:string) => IProjectFile|undefined;
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
