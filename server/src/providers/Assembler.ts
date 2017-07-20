import dasm from "dasm";

export interface ISymbol {
	name: string;
	isLabel: boolean;
	isConstant: boolean;
	value: number;
	wasReferenced: boolean;
	wasPseudoOpCreated: boolean;
	definitionFilename?: string;
	definitionLineNumber: number;
	definitionColumnStart: number;
	definitionColumnEnd: number;
}

export interface ILine {
	number: number;
	filename?: string;
	address: number;
	bytes?: Uint8Array;
	raw: string;
	errorMessage?: string;
	comment?: string;
	command?: string;
}

export interface IAssemblerResult {
	data: Uint8Array;
	output: string[];
	list: ILine[] | undefined;
	listRaw?: string;
	symbols: ISymbol[] | undefined;
	symbolsRaw?: string;
	exitStatus: number;
	success: boolean;
}

export class Assembler {

	constructor() {
	}

	public assemble(src:string, includes?:{[key:string]: string}):IAssemblerResult {
		console.time("[assembler] Compile");
		const result = dasm(src, { format: 3, includes });
		console.timeEnd("[assembler] Compile");
		console.log("[assembler] ROM length is ", result.data.length);

		return result;
	}
}

export default Assembler;
