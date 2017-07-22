import dasm from "dasm";

export default class RomAssembler {

	private _source:string;

	constructor(source:string) {
		console.log("[assembler] constructed");
		this._source = source;
		this.assemble();
	}

	public assemble() {
		console.log("[assembler] File has " + this._source.length + " chars");
		console.log("[assembler] DASM is ", dasm);

		// console.time("[assembler] Compile");
		const result = dasm(this._source, { format: 3, quick: true });
		// console.timeEnd("[assembler] Compile");
		console.log("[assembler] ROM length is ", result.data.length);
		console.log("[assembler] LOG: ", result.output);
	}
}
