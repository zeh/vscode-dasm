export default class NumberUtils {

	public static asDecimal(value:number):string {
		return value.toString(10);
	}

	public static asBinary(value:number):string {
		return "%" + value.toString(2);
	}

	public static asOctal(value:number):string {
		return "0" + value.toString(8);
	}

	public static asHexa(value:number):string {
		return "$" + value.toString(16);
	}

}
