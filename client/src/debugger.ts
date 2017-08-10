import dasm from "dasm";
import { readFileSync } from "fs";
import { basename } from "path";

import {
	Breakpoint,
	BreakpointEvent,
	DebugSession,
	Handles,
	InitializedEvent,
	Logger,
	logger,
	LoggingDebugSession,
	OutputEvent,
	Scope,
	Source,
	StackFrame,
	StoppedEvent,
	TerminatedEvent,
	Thread,
} from "vscode-debugadapter";

import { IDasmResult } from "dasm";
import { DebugProtocol } from "vscode-debugprotocol";
import Assembler from "./assembling/Assembler";
import DasmConstants from "./DasmConstants";
import * as DasmTabProtocol from "./network/DasmTabProtocol";
import TabServer from "./network/TabServer";

/**
 * This interface should always match the schema found in the mock-debug extension manifest.
 */
export interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	program: string;		// An absolute path to the program to debug
	stopOnEntry?: boolean;	// Automatically stop target after launch; if not specified, target does not stop
	trace?: boolean;		// Enable logging the Debug Adapter Protocol
}

class DasmDebugSession extends LoggingDebugSession {

	private static readonly THREAD_ID = 1;					// Hardcoded thread id because there's only one thread

	private _server: TabServer<DasmTabProtocol.IMessage>;	// Server that communicates with the player tab
	private _results: IDasmResult;							// Current assembly results

	private _breakpointIndex: number = 1000;
	private _currentAddress: number = 0;
	private _sourceFile: string;

	private _breakPoints = new Map<string, DebugProtocol.Breakpoint[]>();
	private _variableHandles = new Handles<string>();

	public constructor() {
		super("dasm-debugger-log.txt");

		// Basic options
		this.setDebuggerLinesStartAt1(false);
		this.setDebuggerColumnsStartAt1(false);

		// Create the server so we can talk to the player
		this._server = new TabServer<DasmTabProtocol.IMessage>(DasmConstants.PLAYER_COMMUNICATION_PORT);
		this._server.onMessage.add((message) => {
			console.log("[DEBUGGER] Received server message of type ", message.kind, message);
		});
		this._server.onClientConnect.add((id) => {
			console.log("[DEBUGGER] Connected to client", id);
			// TODO: also update running state
			this.sendRomToClients();
		});
		this._server.onClientDisconnect.add((id) => {
			console.log("[DEBUGGER] Disconnected from client", id);
			if (this._server.clients.length === 0) {
				console.log("[DEBUGGER] Last client disconnected");
				// No more clients connected, terminate the debugger
				this.sendEvent(new TerminatedEvent());
			}
		});
	}

	/**
	 * Request called by the frontent to interrogate the features the debug adapter provides.
	 */
	protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
		console.log("[DEBUGGER] Initialized with args =", args);

		// Asks the frontent to initialize so it can send configuration requests like 'setBreakpoint' at any time;
		// the frontend will end the configuration sequence by calling 'configurationDone' request.
		this.sendEvent(new InitializedEvent());

		response.body = response.body || {};

		// Implements the configurationDoneRequest
		response.body.supportsConfigurationDoneRequest = true;

		// Allows restarting
		response.body.supportsRestartRequest = true;

		// Side effect-free evaluate request for data hovers
		response.body.supportsEvaluateForHovers = false;

		// Stepping back via the stepBack and reverseContinue requests
		response.body.supportsStepBack = false;

		/*
		All features:
        supportsFunctionBreakpoints?: boolean;
        supportsConditionalBreakpoints?: boolean;
        supportsHitConditionalBreakpoints?: boolean;
        exceptionBreakpointFilters?: ExceptionBreakpointsFilter[];
        supportsSetVariable?: boolean;
        supportsRestartFrame?: boolean;
        supportsGotoTargetsRequest?: boolean;
        supportsStepInTargetsRequest?: boolean;
        supportsCompletionsRequest?: boolean;
        supportsModulesRequest?: boolean;
        additionalModuleColumns?: ColumnDescriptor[];
        supportedChecksumAlgorithms?: ChecksumAlgorithm[];
        supportsExceptionOptions?: boolean;
        supportsValueFormattingOptions?: boolean;
        supportsExceptionInfoRequest?: boolean;
        supportTerminateDebuggee?: boolean;
		supportsDelayedStackTraceLoading?: boolean;
		*/

		this.sendResponse(response);
	}

	protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments) {
		console.log("[DEBUGGER] Configuration done", args);
		this.sendResponse(response);
	}

	protected launchRequest(response: DebugProtocol.LaunchResponse, args: ILaunchRequestArguments): void {
		// Initialize logging
		logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);

		console.log("[DEBUGGER] Launched", args);

		this._sourceFile = args.program;
		const source = readFileSync(this._sourceFile).toString();

		// Actually assemble the source
		this._results = Assembler.assemble(source);
		console.log("[DEBUGGER] Rom assembled, size is", this._results.data.length);

		if (args.stopOnEntry) {
			this.currentAddress = 0;
			this.sendResponse(response);

			// Stop at the beginning
			this.sendEvent(new StoppedEvent("entry", DasmDebugSession.THREAD_ID));
		} else {
			// Start running until a breakpoint or an exception are hit
			this.continueRequest(response as DebugProtocol.ContinueResponse, { threadId: DasmDebugSession.THREAD_ID });
		}
	}

	protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void {
		// TODO: reimplement
		this.sendResponse(response);

		/*
		const path = args.source.path as string;
		const clientLines = args.lines || [];

		// read file contents into array for direct access
		const lines = readFileSync(path).toString().split("\n");

		const breakpoints = new Array<Breakpoint>();

		// verify breakpoint locations
		for (const clientLine of clientLines) {
			let l = this.convertClientLineToDebugger(clientLine);
			let verified = false;
			if (l < lines.length) {
				const line = lines[l].trim();
				// if a line is empty or starts with '+' we don't allow to set a breakpoint but move the breakpoint down
				if (line.length === 0 || line.indexOf("+") === 0) {
					l++;
				}
				// if a line starts with '-' we don't allow to set a breakpoint but move the breakpoint up
				if (line.indexOf("-") === 0) {
					l--;
				}
				// don't set 'verified' to true if the line contains the word 'lazy'
				// in this case the breakpoint will be verified 'lazy' after hitting it once.
				if (line.indexOf("lazy") < 0) {
					verified = true;    // this breakpoint has been validated
				}
			}
			const bp = new Breakpoint(verified, this.convertDebuggerLineToClient(l)) as DebugProtocol.Breakpoint;
			bp.id = this._breakpointIndex++;
			breakpoints.push(bp);
		}
		this._breakPoints.set(path, breakpoints);

		// send back the actual breakpoint positions
		response.body = {
			breakpoints,
		};
		this.sendResponse(response);
		*/
	}

	protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
		// We only have one thread
		response.body = {
			threads: [
				new Thread(DasmDebugSession.THREAD_ID, "Main thread"),
			],
		};
		this.sendResponse(response);
	}

	protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {
		// TODO: implement
		response.body = {
			stackFrames: [],
			totalFrames: 0,
		};
		this.sendResponse(response);

		/*
		const words = this._sourceLines[this.currentAddress].trim().split(/\s+/);

		const startFrame = typeof args.startFrame === "number" ? args.startFrame : 0;
		const maxLevels = typeof args.levels === "number" ? args.levels : words.length - startFrame;
		const endFrame = Math.min(startFrame + maxLevels, words.length);

		const frames = new Array<StackFrame>();
		// every word of the current line becomes a stack frame.
		for (let i = startFrame; i < endFrame; i++) {
			const name = words[i];	// use a word of the line as the stackframe name
			frames.push(new StackFrame(i, `${name}(${i})`, new Source(basename(this._sourceFile),
				this.convertDebuggerPathToClient(this._sourceFile)),
				this.convertDebuggerLineToClient(this.currentAddress), 0));
		}
		response.body = {
			stackFrames: frames,
			totalFrames: words.length,
		};
		this.sendResponse(response);
		*/
	}

	protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
		// TODO: implement
		response.body = {
			scopes: [],
		};
		this.sendResponse(response);

		/*
		const frameReference = args.frameId;
		const scopes = new Array<Scope>();
		scopes.push(new Scope("Local", this._variableHandles.create("local_" + frameReference), false));
		scopes.push(new Scope("Closure", this._variableHandles.create("closure_" + frameReference), false));
		scopes.push(new Scope("Global", this._variableHandles.create("global_" + frameReference), true));

		response.body = {
			scopes,
		};
		this.sendResponse(response);
		*/
	}

	protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void {
		// TODO: implement
		response.body = {
			variables: [],
		};
		this.sendResponse(response);

		/*
		const variables = new Array<DebugProtocol.Variable>();
		const id = this._variableHandles.get(args.variablesReference);
		if (id !== null) {
			variables.push({
				name: id + "_i",
				type: "integer",
				value: "123",
				variablesReference: 0,
			});
			variables.push({
				name: id + "_f",
				type: "float",
				value: "3.14",
				variablesReference: 0,
			});
			variables.push({
				name: id + "_s",
				type: "string",
				value: "hello world",
				variablesReference: 0,
			});
			variables.push({
				name: id + "_o",
				type: "object",
				value: "Object",
				variablesReference: this._variableHandles.create("object_"),
			});
		}

		response.body = {
			variables,
		};
		this.sendResponse(response);
		*/
	}

	protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
		// TODO: implement
		this.sendResponse(response);
		this.sendEvent(new TerminatedEvent());

		/*
		for (let ln = this.currentAddress + 1; ln < this._sourceLines.length; ln++) {
			if (this.fireEventsForLine(response, ln)) {
				return;
			}
		}
		this.sendResponse(response);
		// no more lines: run to end
		this.sendEvent(new TerminatedEvent());
		*/
	}

	protected reverseContinueRequest(response: DebugProtocol.ReverseContinueResponse, args: DebugProtocol.ReverseContinueArguments): void {
		// TODO: implement
		this.sendResponse(response);
		this.currentAddress = 0;
		this.sendEvent(new StoppedEvent("entry", DasmDebugSession.THREAD_ID));

		/*
		for (let ln = this.currentAddress - 1; ln >= 0; ln--) {
			if (this.fireEventsForLine(response, ln)) {
				return;
			}
		}
		this.sendResponse(response);
		// no more lines: stop at first line
		this.currentAddress = 0;
		this.sendEvent(new StoppedEvent("entry", DasmDebugSession.THREAD_ID));
		*/
	}

	protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
		// TODO: implement
		this.sendResponse(response);
		this.sendEvent(new TerminatedEvent());

		/*
		for (let ln = this.currentAddress + 1; ln < this._sourceLines.length; ln++) {
			if (this.fireStepEvent(response, ln)) {
				return;
			}
		}
		this.sendResponse(response);
		// no more lines: run to end
		this.sendEvent(new TerminatedEvent());
		*/
	}

	protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void {
		// TODO: implement
		this.sendResponse(response);
		this.currentAddress = 0;
		this.sendEvent(new StoppedEvent("entry", DasmDebugSession.THREAD_ID));

		/*
		for (let ln = this.currentAddress - 1; ln >= 0; ln--) {
			if (this.fireStepEvent(response, ln)) {
				return;
			}
		}
		this.sendResponse(response);
		// no more lines: stop at first line
		this.currentAddress = 0;
		this.sendEvent(new StoppedEvent("entry", DasmDebugSession.THREAD_ID));
		*/
	}

	protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void {
		// TODO: implement

		/*
		response.body = {
			result: `evaluate(context: '${args.context}', '${args.expression}')`,
			variablesReference: 0,
		};
		this.sendResponse(response);
		*/
	}

	protected pause(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): void {
		// TODO: implement
		console.log("[DEBUGGER] Pause request", args);
	}

	protected restartRequest(response: DebugProtocol.RestartResponse, args: DebugProtocol.RestartArguments): void {
		// TODO: implement
		console.log("[DEBUGGER] Restart request", args);
	}

	protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): void {
		console.log("[DEBUGGER] Disconnecting", args);

		// TODO: close player tab

		this._server.dispose();
		this.sendResponse(response);
	}

	private get currentAddress(): number {
		return this._currentAddress;
	}

	private set currentAddress(line: number) {
		this._currentAddress = line;
		this.log("line", line);
	}

	private sendRomToClients() {
		if (this._results.success) {
			this._server.send(DasmTabProtocol.createMessage(DasmTabProtocol.Kinds.Server.Rom.Load, Array.from(this._results.data)));
		}
	}

	// ---- some helpers

	/**
	 * Fire StoppedEvent if line is not empty.
	 */
	private fireStepEvent(response: DebugProtocol.Response, ln: number): boolean {
		// TODO: reimplement
		return false;

		/*
		if (this._sourceLines[ln].trim().length > 0) {	// non-empty line
			this.currentAddress = ln;
			this.sendResponse(response);
			this.sendEvent(new StoppedEvent("step", DasmDebugSession.THREAD_ID));
			return true;
		}
		return false;
		*/
	}

	/**
	 * Fire StoppedEvent if line has a breakpoint or the word 'exception' is found.
	 */
	private fireEventsForLine(response: DebugProtocol.Response, ln: number): boolean {
		// TODO: reimplement
		return false;

		/*
		// find the breakpoints for the current source file
		const breakpoints = this._breakPoints.get(this._sourceFile);
		if (breakpoints) {
			const bps = breakpoints.filter((bp) => bp.line === this.convertDebuggerLineToClient(ln));
			if (bps.length > 0) {
				this.currentAddress = ln;

				// 'continue' request finished
				this.sendResponse(response);

				// send 'stopped' event
				this.sendEvent(new StoppedEvent("breakpoint", DasmDebugSession.THREAD_ID));

				// the following shows the use of 'breakpoint' events to update properties of a breakpoint in the UI
				// if breakpoint is not yet verified, verify it now and send a 'breakpoint' update event
				if (!bps[0].verified) {
					bps[0].verified = true;
					this.sendEvent(new BreakpointEvent("update", bps[0]));
				}
				return true;
			}
		}

		// if word 'exception' found in source -> throw exception
		if (this._sourceLines[ln].indexOf("exception") >= 0) {
			this.currentAddress = ln;
			this.sendResponse(response);
			this.sendEvent(new StoppedEvent("exception", DasmDebugSession.THREAD_ID));
			this.log("exception in line", ln);
			return true;
		}

		return false;
		*/
	}

	/**
	 * Log onto both the console and the log file
	 */
	private log(msg: string, line: number) {
		const e = new OutputEvent(`${msg}: ${line}\n`);
		(e as DebugProtocol.OutputEvent).body.variablesReference = this._variableHandles.create("args");
		this.sendEvent(e);	// print current line on debug console
	}
}

DebugSession.run(DasmDebugSession);
