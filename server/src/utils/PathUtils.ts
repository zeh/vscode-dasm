export default class PathUtils {

	/**
	 * Converts "D:\blaba\a.x" to "file:///d%3A/blaba"
	 */
	public static platformPathToUri(path:string):string {
		let uri = path.replace(/\\/g, "/");

		// On windows, the path starts with a drive letter but it needs a slash
		if (uri[0] !== "/") uri = "/" + uri;

		return encodeURI("file://" + uri);
	}

	/**
	 * Converts "file:///d%3A/blaba/a.x" to "d:\blaba\a.x"
	 */
	public static uriToPlatformPath(uri:string):string {
		return decodeURIComponent(uri.replace(/file:[\/\\]+/g, ""));
	}
}
