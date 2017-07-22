# Contributing

This extension is still a work-in-progress. As such, any help is accepted:

* Bug reports
* Bug fixes
* Typo/documentation fixes and additions
* Feature implementations
* Ideas and comments

For any of those, check [our project on GitHub](https://github.com/zeh/vscode-dasm) and either [open a new issue](https://github.com/zeh/vscode-dasm/issues) or [submit a pull request](https://github.com/zeh/vscode-dasm/pulls). For general comments, tweet at [@zeh](https://twitter.com/zeh) or email [me](https://github.com/zeh).

## Running

By definition, Visual Studio Code extensions can be a bit finicky to develop and test; you frequently need several different instances of the editor opened. This is what you need to do to run a local version of the extension, so you can implement and test changes to it:

### Setup

1. Fork the vscode-dasm project into a repository of your own. Go to [https://github.com/zeh/vscode-dasm](https://github.com/zeh/vscode-dasm) and click the "Fork" button on the top right.

1. Clone the whole repo into a folder on your machine.

    ```shell
    git clone https://github.com/YOUR-USERNAME/vscode-dasm
    ```

1. Install all dependencies for the main extension code (language client). Go into `/client` and do:

    ```shell
    npm install
    ```

1. Install all dependencies for the language server. Go into `/server` and do:

    ```shell
    npm install
    ```

### Run

Running is the weird part, as it requires 3 (!) different instances of Visual Studio Code running concurrently. Normally, you'll only be spending time on a particular instance at one time, but it can be difficult if you have to switch between windows. Therefore, multiple monitors help.

1. Run Visual Studio Code and open the `/client` folder as a new project. That will be the main extension project.

1. Open a new instance of Visual Studio Code ("File" > "New Window") and open the `/server` folder as a new project. This is the language server, where most stuff is done.

1. On the language server editor (or on a terminal instance at `/serve`), start the main task via the "Run Build Task" command or by opening the terminal and running the watch script:

    ```shell
    npm run watch
    ```

    This will build the server code into the `/client` folder every time a change is made.

1. On the client editor, press F5 (or run "Debug" > "Start Debugging"). This will open yet another instance of Visual Studio Code, now with the local extension installed and running.

1. On the new instance, open up an ASM file and start editing to test the extension.

1. On the new instance, open the output window ("View" > "Output") and select the dasm Language server from the pull down on the top right. This will show all log messages coming from vscode-dasm.

1. Once you change code on the client or server version of the extension, re-run or re-load the extension from the client editor instance (F5 again). This will close and reopen the third Visual Studio Code instance.
