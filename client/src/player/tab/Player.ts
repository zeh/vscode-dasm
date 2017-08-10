import "babel-polyfill";

import * as DasmTabProtocol from "../../network/DasmTabProtocol";
import TabClient from "./../../network/TabClient";
import Emulator from "./Emulator";

class Player {

	private static readonly ASPECT_RATIO = 4 / 3;

	private _width: number;
	private _height: number;
	private _hasResizeScheduled: boolean;

	private _container: HTMLElement;
	private _canvas: HTMLCanvasElement;
	private _logContainer: HTMLElement | null;

	private _tabClient: TabClient<DasmTabProtocol.IMessage>;
	private _emulator: Emulator;

	constructor(element: HTMLElement | null, logContainer: HTMLElement | null) {
		if (element) {
			// Setup UI
			this._container = element;
			this._logContainer = logContainer;
			this._canvas = document.createElement("canvas");
			this._canvas.tabIndex = 1;
			this._container.appendChild(this._canvas);
			window.addEventListener("resize", this.scheduleUpdateSize.bind(this), false);
			this.scheduleUpdateSize();

			// Setup tab client
			const port = Number.parseInt(this.getMetaProperty("dasm:port", "8080"));
			this._tabClient = new TabClient<DasmTabProtocol.IMessage>(port, 2000);
			this._tabClient.onMessage.add(this.onMessage.bind(this));
			this._tabClient.onConnect.add(() => {
				this.log("Connected to server");
			});
			this._tabClient.onDisconnect.add(() => {
				this.log("Disconnected from server");
			});
			this._tabClient.onError.add(() => {
				this.log("Error from server");
			});

			// Setup emulator
			this._emulator = new Emulator(this._canvas);

			// End
			this.log("Player initialized");
			this.log("Connecting on port " + port);
		}
	}

	private render() {
		this._emulator.resize(this._width, this._height);
	}

	private getMetaProperty(name: string, defaultValue?: string) {
		const element = document.querySelector("meta[property='dasm:port']");
		return element ? (element as any).content : defaultValue;
	}

	private onMessage(message: any) {
		this.log("Received client message of type " + message.kind);
		if (message.kind === DasmTabProtocol.Kinds.Server.Rom.Load) {
			const b = (message as any).data.buffer;
			this.log("...loading ROM with size size " + b.length);
			this._emulator.loadROM(new Uint8Array((message as any).data.buffer));
		} else {
			this.log("...message not understood (unknown kind)");
		}
	}

	private scheduleUpdateSize() {
		// Using a ResizeObserver would be a better idea in the future: https://stackoverflow.com/a/39312522/439026
		if (!this._hasResizeScheduled) {
			this._hasResizeScheduled = true;
			requestAnimationFrame(() => {
				this.updateSize();
				this._hasResizeScheduled = false;
			});
		}
	}

	private updateSize() {
		const containerWidth = this._container.offsetWidth;
		const containerHeight = this._container.offsetHeight;
		const containerAspectRatio = containerWidth / containerHeight;

		let newWidth = containerWidth;
		let newHeight = containerHeight;

		if (containerAspectRatio > Player.ASPECT_RATIO) {
			// Screen has longer width than desired, use height
			newWidth = Math.round(containerHeight * Player.ASPECT_RATIO);
		} else {
			// Screen has shorter width than desired, use width
			newHeight = Math.round(containerWidth / Player.ASPECT_RATIO);
		}

		if (newWidth !== this._width && newHeight !== this._height) {
			this._width = newWidth;
			this._height = newHeight;
			this.render();
			this.log(`Player resized to ${newWidth}x${newHeight}px`);
		}
	}

	private log(text: string) {
		if (this._logContainer) {
			const newDiv = document.createElement("div");
			const newContent = document.createTextNode(text);
			newDiv.appendChild(newContent);
			this._logContainer.appendChild(newDiv);

			// Scroll the log container to the new line
			const lc = this._logContainer;
			requestAnimationFrame(() => {
				const oh = lc.offsetHeight;
				const sh = lc.scrollHeight;
				if (sh > oh) lc.scrollTop = sh - oh;
			});
		}
	}
}

export default new Player(document.getElementById("player-content"), document.getElementById("player-log"));
