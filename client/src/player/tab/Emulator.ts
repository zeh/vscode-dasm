import PaddleInterface from "./6502ts/machine/io/PaddleInterface";
import Board from "./6502ts/machine/stella/Board";
import CartridgeFactory from "./6502ts/machine/stella/cartridge/CartridgeFactory";
import CartridgeInterface from "./6502ts/machine/stella/cartridge/CartridgeInterface";
import StellaConfig from "./6502ts/machine/stella/Config";
import ImmediateScheduler from "./6502ts/tools/scheduler/ImmedateScheduler";
import ConstantCyclesScheduler from "./6502ts/tools/scheduler/limiting/ConstantCycles";
import FullscreenVideoDriver from "./6502ts/web/driver/FullscreenVideo";
import MouseAsPaddleDriver from "./6502ts/web/driver/MouseAsPaddle";
import SimpleCanvasVideo from "./6502ts/web/driver/SimpleCanvasVideo";
import VideoDriverInterface from "./6502ts/web/driver/VideoDriverInterface";
import VideoEndpoint from "./6502ts/web/driver/VideoEndpoint";
import KeyboardIO from "./6502ts/web/stella/driver/KeyboardIO";
import WebAudioDriver from "./6502ts/web/stella/driver/WebAudio";

export default class Emulator {

	private _canvasElement:HTMLCanvasElement;
	private _rom: Uint8Array;

	private _videoDriver: VideoDriverInterface;
	private _width: number;
	private _height: number;

	constructor(canvasElement: HTMLCanvasElement) {
		this._canvasElement = canvasElement;
		this._width = 100;
		this._height = 100;
	}

	public resize(width: number, height: number) {
		this._width = width;
		this._height = height;
		this.resizeCanvas();
	}

	public loadROM(buffer: Uint8Array) {
		this._rom = buffer;
		this.start();
	}

	private start() {
		// Basic board initialization
		const config = this.createConfig();
		const cartridge = this.createCartridge(this._rom);
		const board = this.createBoard(config, cartridge);

		// Attach drivers
		this._videoDriver = this.createVideoDriver(board, this._canvasElement);
		const fullSceenVideoDriver = this.createFullScreenVideoDriver(this._videoDriver);
		const audioDriver = this.createAudioDriver(board);
		const keyboardDriver = this.createKeyboardDriver(board, this._canvasElement, fullSceenVideoDriver);
		const paddleDriver = this.createPaddleDriver(board.getPaddle(0));

		// Final initialization
		board.setAudioEnabled(true);

		// Play
		const timer = board.getTimer();
		timer.stop();
		// timer.start(new ImmediateScheduler());
		timer.start(new ConstantCyclesScheduler());

		this.resizeCanvas();

		console.log("emulator initialized");
	}

	private createConfig() {
		return new StellaConfig();
	}

	private createCartridge(buffer: Uint8Array) {
		const factory = new CartridgeFactory();
		return factory.createCartridge(buffer);
	}

	private createBoard(config: StellaConfig, cartridge: CartridgeInterface) {
		const board = new Board(config, cartridge);
		return board;
	}

	private createVideoDriver(board: Board, canvasElement: HTMLCanvasElement) {
		const driver = new SimpleCanvasVideo(canvasElement);
		driver.init();
		driver.bind(new VideoEndpoint(board.getVideoOutput()));
		return driver;
	}

	private createFullScreenVideoDriver(videoDriver: VideoDriverInterface) {
		return new FullscreenVideoDriver(videoDriver);
	}

	private createAudioDriver(board: Board) {
		const driver = new WebAudioDriver();
		driver.init();
		driver.bind(board.getAudioOutput());
		return driver;
	}

	private createKeyboardDriver(board: Board, canvasElement: HTMLCanvasElement, fullscreenVideoDriver: FullscreenVideoDriver) {
		const ioDriver = new KeyboardIO(canvasElement);
		ioDriver.bind(board.getJoystick0(), board.getJoystick1(), board.getControlPanel());
		ioDriver.toggleFullscreen.addHandler(() => {
			fullscreenVideoDriver.toggle();
		});
		return ioDriver;
	}

	private createPaddleDriver(paddle: PaddleInterface) {
		const paddleDriver = new MouseAsPaddleDriver();
		paddleDriver.bind(paddle);
		return paddleDriver;
	}

	private resizeCanvas() {
		if (this._videoDriver) {
			this._videoDriver.resize(this._width, this._height);
		}
	}
}

/*

DirtyHairy:

# Debugger

* The debugger resides in src/machine/Debugger.ts and is attached to the Board once it has been initialized.
* While it supports all basic operations (breaking, stepping and tracing) it always returns human-readable strings.
* Good idea to change it to proper data structures that could be merged upstream
* Had started to work on advanced stuff like read / write traps and watches but shelved. A possibility if they would be of benefit for you.

* Once you have initialized the board
  * You need to configure the various "drivers" that connect the emulated hardware to the DOM and browser APIs.
    * There are drivers for video, audio and I/O.
    * You can find the relevant code for the CLI in src/web/stellaCLI.ts.
    * The drivers are first initialized and then bound to their respective counterpart on the board.

* After board and drivers are set up you are ready to run the emulation.
* The board exposes a "timer" interface that is used to start and stop the scheduler if you want to run the emulation continiously.
* Stepping is handled by the debugger (which in turn uses the timer to control the board clock).

* Traps, exceptions and other things are handled by events. The event system is a separate github project (microevent)

--

# More debugger

* You could also consider writing your own debugger modelled after Debugger.ts.
* There is not much magic involved; all it does is attach to the board using a set of defined interfaces and
monitor and drive execution.
* State inspection is in place for bus and CPU
* The work I that I have put on hold consists of adding a DSL for writing watch and break expressions,
together with a state tree that can be used to get a deep view of the hardware state (TIA and RIOT in particular),
which I guess is much more than you'll need to get started.
* State snapshots are something that is not implemented yet. In the past, the internal state of the TIA was mostly
in flux, and I didn't want to bother with keeping snapshotting code in sync. At this point, things are stable
enough and, again, adding it is on my agenda, so we can add it when you need it.

*/
