export const Kinds = {
	Empty: "none",

	// Client-to-server
	Client: {
		State: "state",									// TODO
	},

	// Server-to-client
	Server: {
		Rom: {
			Load: "rom_load",
		},
		Debug: {
			Seek: "debug_seek",							// TODO
			Pause: "debug_pause",						// TODO
			Play: "debug_play",							// TODO
			StepForward: "step",						// TODO
			StepOut: "step_out",						// TODO
			StepBack: "step_back",						// TODO
			SetBreakpoint: "set_breakpoint",			// TODO
			ClearBreakpoint: "clear_breakpoint",		// TODO
		},
		Screen: {
			SaveScreenshot: "save_screenshot",			// TODO
		},
	},
};

export interface IMessageEmpty {
	kind: typeof Kinds.Empty;
}

export interface IMessageClientState {
	kind: typeof Kinds.Client.State;
	data: {
		value: string;
	};
}

export interface IMessageServerRomLoad {
	kind: typeof Kinds.Server.Rom.Load;
	data: {
		buffer: number[];
	};
}

export type IMessage = IMessageEmpty | IMessageClientState;

export function createMessage(kind: typeof Kinds.Client.State, value: string): IMessageClientState;
export function createMessage(kind: typeof Kinds.Server.Rom.Load, buffer: number[]): IMessageClientState;
export function createMessage(kind: string, payload?: any): IMessage {
	if (kind === Kinds.Client.State) {
		return {
			kind,
			data: { value: payload },
		};
	} else if (kind === Kinds.Server.Rom.Load) {
		return {
			kind,
			data: { buffer: payload },
		};
	} else {
		return {
			kind: Kinds.Empty,
		};
	}
}
