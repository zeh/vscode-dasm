/**
 * @author Zeh Fernando
 */

export default class StringUtils {

	public static splitIntoLines(text:string):string[] {
		return text.split(/\r?\n/g);
	}

	public static removeWrappingQuotes(text:string):string {
		if (text) {
			const start = text.substr(0, 1);
			const end = text.substr(text.length - 1);
			if (start === end && start === "\"" || start === "'") {
				return text.substr(1, text.length - 2);
			}
		}
		return text;
	}
}
