import SimpleSignal from "simplesignal";
import * as vscode from "vscode";
import * as ws from "ws";

import * as TabProtocol from "./TabProtocol";

/**
 * Provides the (extension, node-based) server-side counterpart for extension-preview tab communication
 */
export default class TabServer<T> {

	private _socketServer: ws.Server;
	private _listening: Promise<void>;
	private _clients: Map<string, ws>;
	private _onMessage: SimpleSignal<(m: T) => void>;
	private _onClientConnect: SimpleSignal<(clientId: string) => void>;
	private _onClientDisconnect: SimpleSignal<(clientId: string) => void>;

	constructor(port: number) {
		this._clients = new Map<string, ws>();
		this._onMessage = new SimpleSignal<(m: T) => void>();
		this._onClientConnect = new SimpleSignal<() => void>();
		this._onClientDisconnect = new SimpleSignal<() => void>();

		this._socketServer = new ws.Server({
			host: "localhost",
			port,
		}, () => {
			console.log("[TAB SERVER] Tab Server is online on port", port);
		});

		this._socketServer.on("connection", (client) => {
			client.on("open", this.onClientOpen.bind(this, client));
			client.on("message", this.onClientMessage.bind(this, client));
			client.on("close", this.onClientClose.bind(this, client));
		});

		console.log("[TAB SERVER] Tab Server is starting");
	}

	public send(message: T) {
		for (const client of this._clients.values()) {
			client.send(JSON.stringify(message));
		}
	}

	public sendToClient(id: string, message: T) {
		const client = this._clients.get(id);
		if (client) {
			client.send(JSON.stringify(message));
		}
	}

	public dispose() {
		this._socketServer.close();
	}

	get onMessage() {
		return this._onMessage;
	}

	get onClientConnect() {
		return this._onClientConnect;
	}

	get onClientDisconnect() {
		return this._onClientDisconnect;
	}

	private onClientOpen(client: ws) {
		console.log("[TAB SERVER] CLIENT OPEN");
	}

	private onClientMessage(client: ws, message: any) {
		const payload = JSON.parse(message);

		if (payload.kind === TabProtocol.Kinds.Client.RequestAcknowledge) {
			// Opening: started the connection
			const id = payload.data.id;
			console.log("[TAB SERVER] CLIENT CONNECTED as " + id + ", READY STATE IS " + (ws.OPEN === client.readyState));
			this._clients.set(id, client);
			client.send(JSON.stringify(TabProtocol.createMessage(TabProtocol.Kinds.Server.Acknowledge)));
			this._onClientConnect.dispatch(id);
		} else {
			console.log("[TAB SERVER] UNKNOWN CLIENT MESSAGE ===>", message);
			this._onMessage.dispatch(message);
		}
	}

	private onClientClose(client: ws) {
		console.log("[TAB SERVER] CLIENT CLOSE");

		const id = this.getIdByClient(client);
		if (id) {
			this._onClientDisconnect.dispatch(id);
			this._clients.delete(id);
		}
	}

	private getIdByClient(client: ws) {
		for (const key in this._clients) {
			if (this._clients.get(key) === client) return key;
		}
		return undefined;
	}
}
