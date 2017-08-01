import dasm from "dasm";
import { IDasmResult } from "dasm";

function assemble(src: string, includes?: { [key: string]: string }): IDasmResult {
	console.time("[assembler] Compile");
	const result = dasm(src, { format: 3, includes });
	if (includes) {
		const includeList = Object.keys(includes).map((key) => {
			return {
				[key]: includes[key] ? includes[key].length + " chars" : undefined,
			};
		});
		console.log("[assembler] includes:", includeList);
	}
	console.timeEnd("[assembler] Compile");
	console.log("[assembler] ROM length is", result.data.length);
	return result;
}

export default {
	assemble,
};
