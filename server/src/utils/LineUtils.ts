import {
	Position,
	Range,
} from "vscode-languageserver";

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
	public static getTokenPosition(line:string, token:string, character:number = -1):{start:number, end:number, length:number}|undefined {
		const len = token.length;
		let pos = line.indexOf(token);
		while (pos > -1) {
			if (character < 0 || (pos <= character && pos + len >= character)) {
				return { start: pos, end: pos + len, length: len };
			}
			pos = line.indexOf(token, pos + len);
		}
	}

	/**
	 * Same as getTokenPosition(), but returning a range of a specific line
	 */
	public static getTokenRange(line:string, token:string, lineNumber:number, character:number = -1):Range|undefined {
		const pos = LineUtils.getTokenPosition(line, token, character);
		if (pos) {
			return Range.create(Position.create(lineNumber, pos.start), Position.create(lineNumber, pos.end));
		}
	}

	/**
	 * Returns a line without comments
	 */
	public static removeComments(line:string):string|undefined {
		const removeCommentsRegex = /^(.+?)(;.+|)$/;
		const sourceLineNoCommentsMatch = line.match(removeCommentsRegex);
		if (sourceLineNoCommentsMatch && sourceLineNoCommentsMatch[1]) {
			return sourceLineNoCommentsMatch[1];
		}
	}
}
