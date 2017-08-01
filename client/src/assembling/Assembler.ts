import dasm from "dasm";
import { IDasmResult, IIncludeInfo } from "dasm";

function assemble(src: string, includes?: { [key: string]: string } | IIncludeInfo[]): IDasmResult {
	console.time("[assembler] Compile");
	const result = dasm(src, { format: 3, includes });
	console.timeEnd("[assembler] Compile");
	console.log("[assembler] ROM length is", result.data.length);
	return result;
}

export default {
	assemble,
};
