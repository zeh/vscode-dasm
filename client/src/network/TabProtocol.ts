/**
 * Constant variables for client-server tab communication
 */

export const Kinds = {
	Empty: "none",

	// Client-to-server
	Client: {
		RequestAcknowledge: "notice_me_senpai",
	},

	// Server-to-client
	Server: {
		Acknowledge: "acknowledged",
	},
};

export interface IMessageEmpty {
	kind: typeof Kinds.Empty;
}

export interface IMessageClientRequestAcknowledge {
	kind: typeof Kinds.Client.RequestAcknowledge;
	data: {
		id: string;
	};
}

export interface IMessageServerAcknowledge {
	kind: typeof Kinds.Server.Acknowledge;
}

export type IMessage = IMessageEmpty | IMessageClientRequestAcknowledge | IMessageServerAcknowledge;

export function createMessage(kind: typeof Kinds.Client.RequestAcknowledge, id: string): IMessageClientRequestAcknowledge;
export function createMessage(kind: typeof Kinds.Server.Acknowledge): IMessageServerAcknowledge;
export function createMessage(kind: string, payload?: any): IMessage {
	if (kind === Kinds.Client.RequestAcknowledge) {
		return {
			kind,
			data: { id: payload },
		};
	} else if (kind === Kinds.Server.Acknowledge) {
		return {
			kind,
		};
	} else {
		return {
			kind: Kinds.Empty,
		};
	}
}
