export default class PathUtils {

	/**
	 * Converts "D:\blaba\a.x" to "file:///d%3A/blaba"
	 */
	public static platformPathToUri(path: string): string {
		let uri = path.replace(/\\/g, "/");

		// On windows, the path starts with a drive letter but it needs a slash
		if (uri.charAt(0) !== "/") uri = "/" + uri;

		return encodeURI("file://" + uri);
	}

	/**
	 * Converts "file:///d%3A/blaba/a.x" to "d:\blaba\a.x"
	 */
	public static uriToPlatformPath(path: string): string {
		let uri = decodeURIComponent(path.replace(/file:[\/\\]{1,2}/g, ""));

		// On windows, the first slash is not desired
		if (uri.charAt(2) === ":") uri = uri.substr(1);

		return uri;
	}
}
