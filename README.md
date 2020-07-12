# teditor
npm install teditor &amp; have a web IDE

teditor is about to become a WebEditor that you will install with a single command.

```sh
npm install -g teditor && teditor
```

![teditor presentation](https://unpkg.com/teditor@0.1.3/teditor_presentation.gif)

```
$ teditor --help
usage: teditor --dir=. --host=127.0.0.1 --port=3000
        Then open your the shown port in the browser
options:
        --dir=.         the directory to edit int he ide, default is the current directory.
        --host=0.0.0.0  set this to 0.0.0.0 to access from anywhere, to a remove host, to accept only 
lets say from your home/office, default is localhost
        --port=3000     the port to bind, default is 3000
```


After a first version based on the code editor codemirror, the new version let you run vsCode in your browser. It can be installed on a remote server or on a micro computer such as the raspberry pi.

This is an experimental project, implemented just during a weekend and should not jet be installed public accessible.

Currently you can create, edit, rename, and move files and directories. This is already useful, when on the server you use utilities that watch the files and do automatic rebuilds and tests, such as webpack or nodemon. In future versions more features could be supported.


# what work has been done:
checkout and run the vscode repo:
```sh
git clone https://github.com/microsoft/vscode.git
cd vscode
yarn install
yarn run web
```
These commands can run vscode in your browser, however a virtual in memory filesystem is used. I used `tstaticstoringproxy` to save to all the files the browser would load into a directory. so I can do my adjustments in them and only have the files in this package, that are needed to run vscode, without the need for additional compilations. 

Experimenting with this code and configuration, I found to change the configuration to an http filesystem. however most of its functions have not been implemented. So I edited the `public\static\out\vs\workbench\services\extensions\browser\webWorkerFileSystemProvider.js` to do use the browsers fetch to interact with a server.

The server is currently completely implemented using express and lives completely in a single file, the index.js.


# Plan
When I, you or we want to go forward with this project, we can cleanup the code. add features to use vscode debug run functionalities to send commands to the server that could run, based on the users definitions.

We could see if we can support more features. 

Currently it is a manual process, of checking out the latest version of vscode and compile it to be used in teditor. We can try to automate it.



