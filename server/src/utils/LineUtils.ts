import {
	Position,
	Range,
} from "vscode-languageserver";

interface ITokenPosition {
	start: number;
	end: number;
	length: number;
}

export default class LineUtils {

	/**
	 * Given a list of lines, returns what is the assumed symbol/label/value at a specific position
	 */
	public static getTokenAtSourcePosition(sourceLines:string[]|undefined, line:number, column:number):string|undefined {
		if (sourceLines && sourceLines.length > line) {
			// Find the char and the surrounding symbol it relates to
			const sourceLine = LineUtils.removeComments(sourceLines[line]);
			return LineUtils.getTokenAtLinePosition(sourceLine, column);
		}

		return undefined;
	}

	/**
	 * Given a line, returns what is the assumed symbol/label/value at a specific position
	 */
	public static getTokenAtLinePosition(sourceLine:string|undefined, column:number):string|undefined {
		if (sourceLine && column <= sourceLine.length) {
			let targetRegex = new RegExp("^.{0," + Math.max(column, 0) + "}\\b([\\w.]*)\\b.*$");
			let targetMatch = sourceLine.match(targetRegex);
			if (!targetMatch || !targetMatch[1]) {
				// Fallback: this regex is more lenient, so we can have rename working from the end of the string...
				// but it may give false positives
				targetRegex = new RegExp("^.{0," + Math.max(column - 1, 0) + "}\\b([\\w.]*)\\b.*$");
				targetMatch = sourceLine.match(targetRegex);
			}

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
	public static getTokenPosition(line:string, token:string, character:number = -1):ITokenPosition|undefined {
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
	 * Given a line and a token, returns all the location in that line (start and end) that the token is in
	 */
	public static getTokenPositions(line:string, token:string):ITokenPosition[] {
		const len = token.length;
		let pos = line.indexOf(token);
		const positions = [];
		while (pos > -1) {
			positions.push({ start: pos, end: pos + len, length: len });
			pos = line.indexOf(token, pos + len);
		}
		return positions;
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
