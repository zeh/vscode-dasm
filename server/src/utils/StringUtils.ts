/**
 * @author Zeh Fernando
 */

export default class StringUtils {

	public static splitIntoLines(text:string):string[] {
		return text.split(/\r?\n/g);
	}


}