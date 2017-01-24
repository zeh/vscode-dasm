export default class LineUtils {

	/**
	 * Given a line, returns what is the assume symbol/label/value at a specific position
	 */
	public static getTokenAtPosition(line:string, character:number):string|undefined {
		if (character < line.length) {
			const targetRegex = new RegExp("^.{0," + character + "}\\b([\\w.]*)\\b.*$");
			const targetMatch = line.match(targetRegex);
			if (targetMatch && targetMatch[1]) {
				return targetMatch[1];
			}
		}

		return undefined;
	}

	/**
	 * Given a line and a token, returns the location in that line (start and end) that the token is in
	 * A `character` parameter can be used when the token needs to be in that position
	 */
	public static getTokenRangeInLine(line:string, token:string, character:number = -1):{start:number, end:number, length:number}|undefined {
		const len = token.length;
		let pos = line.indexOf(token);
		while (pos > -1) {
			if (character < 0 || (pos <= character && pos + len >= character)) {
				return { start: pos, end: pos + len, length: len };
			}
			pos = line.indexOf(token, pos + len);
		}
	}
}
