import * as path from "path";
import * as url from "url";

import ProjectFiles from "../src/project/ProjectFiles";
import { IProjectFile } from "../src/project/ProjectFiles";

function createProjectFiles() {
	const pf = new ProjectFiles();
	pf.debounceTime = 0;
	return pf;
}

function clearFileUri(fileUri: string) {
	const filePath = url.parse(fileUri).pathname;
	const rootPath = path.posix.sep + __dirname.split(path.sep).splice(1).join(path.posix.sep);
	if (filePath) {
		return "<test-path>/" + path.posix.relative(rootPath, filePath);
	} else {
		return "?";
	}
}

function clearFileContent(contents?: string) {
	return `Redacted (was ${contents ? `${contents.length} chars in ${contents.split("\n").length} lines` : "undefined"})`;
}

function clearFile(file: IProjectFile): IProjectFile {
	const newContent = clearFileContent(file.contents);
	return {
		...file,
		uri: clearFileUri(file.uri),
		dependencies: file.dependencies.map((dependency) => {
			return {
				...dependency,
				uri: clearFileUri(dependency.uri),
				file: dependency.file ? clearFile(dependency.file) : undefined,
			};
		}),
		contents: newContent,
		contentsLines: [ newContent ],
	};
}

function getIncludeList(includes?: {[key:string]:string}) {
	if (includes) {
		const keys = Object.keys(includes);
		const newIncludes:{[key:string]:string} = {};
		for (const key of keys) {
			newIncludes[key] = clearFileContent(includes[key]);
		}
		return newIncludes;
	} else {
		return undefined;
	}
}

describe("test adding with includes", () => {
	test("is empty", () => {
		const pf = createProjectFiles();
		expect(pf.has("a")).toBe(false);
		expect(pf.all().length).toEqual(0);
	});

	test("no-include project", () => {
		const pf = createProjectFiles();

		const filePath = path.posix.join(__dirname, "sources/_test_single.asm");
		pf.addFromDiskPath(filePath);

		expect(pf.all().length).toEqual(1);
		expect(pf.all().map(clearFile)).toMatchSnapshot();

		const includes = getIncludeList(pf.getIncludes());
		expect(includes).toMatchSnapshot();
		expect(Object.keys(includes).length).toBe(0);
	});

	test("single-include project", () => {
		const pf = createProjectFiles();

		const filePath = path.posix.join(__dirname, "sources/_test_include.asm");
		pf.addFromDiskPath(filePath);

		expect(pf.all().length).toEqual(2);
		expect(pf.all().map(clearFile)).toMatchSnapshot();

		const includes = getIncludeList(pf.getIncludes());
		expect(includes).toMatchSnapshot();
		expect(Object.keys(includes).length).toBe(1);
	});

	test("single-include project with incdir", () => {
		const pf = createProjectFiles();

		const filePath = path.posix.join(__dirname, "sources/_test_include_incdir.asm");
		pf.addFromDiskPath(filePath);

		expect(pf.all().length).toEqual(2);
		expect(pf.all().map(clearFile)).toMatchSnapshot();

		const includes = getIncludeList(pf.getIncludes());
		expect(includes).toMatchSnapshot();
		expect(Object.keys(includes).length).toBe(1);
	});

	test("single-include project with missing include", () => {
		const pf = createProjectFiles();

		const filePath = path.posix.join(__dirname, "sources/_test_broken.asm");
		pf.addFromDiskPath(filePath);

		expect(pf.all().length).toEqual(2);
		expect(pf.all().map(clearFile)).toMatchSnapshot();

		const includes = getIncludeList(pf.getIncludes());
		expect(includes).toMatchSnapshot();
		expect(Object.keys(includes).length).toBe(0);
	});
});
