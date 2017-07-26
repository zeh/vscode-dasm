import SimpleSignal from "simplesignal";
import * as TabProtocol from "./TabProtocol";

/**
 * Provides the (HTML preview, browsewr-based) client-side counterpart for extension-preview tab communication
 */
export default class TabClient<T> {

	private _socketClient: WebSocket;
	private _connected: boolean;
	private _port: number;
	private _reconnectDelay: number;
	private _onMessage: SimpleSignal<(m: T) => void>;
	private _onConnect: SimpleSignal<() => void>;
	private _onDisconnect: SimpleSignal<() => void>;
	private _onError: SimpleSignal<() => void>;

	constructor(port: number, reconnectDelay: number) {
		this._port = port;
		this._reconnectDelay = reconnectDelay;
		this._connected = false;
		this._onMessage = new SimpleSignal<(m: T) => void>();
		this._onConnect = new SimpleSignal<() => void>();
		this._onDisconnect = new SimpleSignal<() => void>();
		this._onError = new SimpleSignal<(e: Event) => void>();
		this.connect();
	}

	public send(message: T) {
		this._socketClient.send(JSON.stringify(message));
	}

	get onMessage() {
		return this._onMessage;
	}

	get onConnect() {
		return this._onConnect;
	}

	get onDisconnect() {
		return this._onDisconnect;
	}

	get onError() {
		return this._onError;
	}

	private connect() {
		this._socketClient = new WebSocket(`ws://localhost:${this._port}`);

		this._socketClient.addEventListener("open", () => {
			const id = `dasm-client-${Date.now().toString(36)}-${Math.round(Math.random() * 9999)}`;
			const message = TabProtocol.createMessage(TabProtocol.Kinds.Client.RequestAcknowledge, id);
			this._socketClient.send(JSON.stringify(message));
		});

		this._socketClient.addEventListener("message", (event: any) => {
			if (event.data) {
				const message = JSON.parse(event.data);
				if (message.kind === TabProtocol.Kinds.Server.Acknowledge) {
					this._onConnect.dispatch();
				} else {
					this._onMessage.dispatch(message);
				}
			}
		});

		this._socketClient.addEventListener("close", (event: Event) => {
			this._onDisconnect.dispatch();
		});

		this._socketClient.addEventListener("error", (event: Event) => {
			this._onError.dispatch(event);
			this.queueConnection();
		});
	}

	private queueConnection() {
		if (!this._connected && this._reconnectDelay > 0) {
			setTimeout(this.connect.bind(this), this._reconnectDelay);
		}
	}
}
