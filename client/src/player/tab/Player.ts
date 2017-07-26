import "babel-polyfill";

class Player {

	private static readonly ASPECT_RATIO = 4 / 3;

	private _width: number;
	private _height: number;

	private _container: HTMLElement;
	private _canvas: HTMLCanvasElement;
	private _logContainer: HTMLElement | null;

	private _hasResizeScheduled: boolean;

	constructor(element: HTMLElement | null, logContainer: HTMLElement | null) {
		if (element) {
			this._container = element;
			this._logContainer = logContainer;

			this._canvas = document.createElement("canvas");
			this._container.appendChild(this._canvas);

			window.addEventListener("resize", this.scheduleUpdateSize.bind(this), false);
			this.scheduleUpdateSize();

			this.log("Player initialized");

			const port = this.getMetaProperty("dasm:port", "8080");

			this.log("Will listen on port " + port);
		}
	}

	private render() {
		this._canvas.width = this._width;
		this._canvas.height = this._height;
	}

	private getMetaProperty(name: string, defaultValue?: string) {
		const element = document.querySelector("meta[property='dasm:port']");
		return element ? (element as any).content : defaultValue;
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
