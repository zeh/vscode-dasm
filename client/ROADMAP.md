# Roadmap

This extension is an early work-in-progress. As such, there is much left to be done.

## Major objectives

The major milestones in our roadmap are:

### Emulator support

Developers should be able to not only write code with the aid of this extension, but to test their game on a separate tab within the editor itself. This will open up the door to several more advanced development features.

### Debugger support

Modern development concepts such as step-by-step execution, address/value watching, and stack tracing, can and should be added to the extension when running games within the editor.

### Live/hot reloading

Finally, concepts used in some development platforms such as live compiling and reloading (on save) and hot reloading (modifying the code as it runs) should make Atari VCS/6502 development iterative and more fun than ever before.

## To-do

A more granular list of tasks, more or less in order of priority, is listed below. Once tasks are completed, they are removed from the list. The counterpart of this document is the [changelog](CHANGELOG.MD), which is where features are listed once they are implemented.

* Manage multi-file projects
  * [TEST] debounce include checking (ie one per second max)
  * [TEST] debounce compilation (eg wait until 200ms or so have passed)
  * add definition link to included files, so they can be opened directly with ctrl+clicking
  * Support INCDIR
  * Support INCBIN
  * when opening included files, use [file language type](https://code.visualstudio.com/updates/v1_9#_new-api-to-open-an-untitled-file-with-optional-language)
* [Auto-indent](https://code.visualstudio.com/updates/v1_14#_auto-indent-on-type-move-lines-and-paste)
* Documnentation
  * [Fix images in README to use https and avoid SVGs](https://code.visualstudio.com/updates/v1_14#_constraints-for-rendering-svg-images)
* Auto completion
  * Better trigger characters (currently on ".") in `server/ProjectManager.ts`
  * Test registers
  * [Parameter hints](https://code.visualstudio.com/docs/editor/editingevolved#_parameter-hints)
* Respect preferences
  * Prefer uppercase/lowercase for pseudo-ops and instructions
  * Add tabbing/spacing preferences?
* Language definition
  * Add parameters to instructions and pseudo-ops descriptions
  * Better descriptions for pseudo-ops
* More syntax highlight: symbol, labels
  * Differentiate between values (`#$99`) and addresses (`$99`)
  * Show binaries as bitmap (for better sprite definition)
* [List errors/warnings as problems](https://code.visualstudio.com/docs/editor/editingevolved#_errors-warnings)/[Problem Matchers](https://code.visualstudio.com/docs/extensionAPI/extension-points#_contributesproblemmatchers)
* Test go-to-type-definition
* Test go-to-implementation
* Test go-to-symbol (e.g. labels, symbols)
* [Reference information](https://code.visualstudio.com/docs/editor/editingevolved#_reference-information) for symbols?
* Think of [code actions](https://code.visualstudio.com/docs/editor/editingevolved#_code-action)
* [Custom explorer view](https://code.visualstudio.com/updates/v1_13#_extension-authoring) for projects
  * List files per project
    * Add commands to open file
  * List symbols/labels per file
    * Add commands to jump to symbol/label
* [CodeLens](https://code.visualstudio.com/blogs/2017/02/12/code-lens-roundup) for references or graphics
* More actions for F1: [formatting](https://code.visualstudio.com/blogs/2016/11/15/formatters-best-practices), enforcing case, etc
* All [language server features](https://code.visualstudio.com/docs/extensions/example-language-server#_additional-language-server-features)
  * List workspace symbols
  * List document symbols
  * Document formatting
  * Document links
* More hover support
  * Test registers
  * Revamp description for registers: shows more registers information, etc
  * Show line where the hover is defined
  * Show comments from the same line (or before) as documentation
  * Show whether it's referenced or not (or use as warnings?)
  * Don't show when hovering the same line as it's defined
  * Identify values - e.g.  `#$99` is value `$99`, `$3E32` is memory location
  * Add more complex pseudo-ops descriptions
  * Use parameters for pseudo-ops in the description
* [Inline variables when debugging](https://code.visualstudio.com/updates/v1_9#_inline-variable-values-in-source-code)
* More navigation to definition support
  * Clean up provider file
* Find usages
* Support incremental document sync
* Auto-format
  * Linting? "dasmlint"
  * Format-as-you-type
* Source code snippets
* Smart bracket matching
* Debugger support
  * Play compiled game on new tab on F5
  * Use [6502.ts](https://github.com/6502ts/6502.ts) instead of Javatari
  * Play/pause
  * Step in/out/etc
  * Hot reload (continue on same address)
  * Register/address monitoring
  * Time travel
  * Use a [custom view](https://code.visualstudio.com/updates/v1_14#_custom-views) for the emulator?
