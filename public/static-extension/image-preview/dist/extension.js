(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __webpack_require__(1);
const preview_1 = __webpack_require__(2);
const sizeStatusBarEntry_1 = __webpack_require__(6);
const binarySizeStatusBarEntry_1 = __webpack_require__(8);
const zoomStatusBarEntry_1 = __webpack_require__(9);
function activate(context) {
    const sizeStatusBarEntry = new sizeStatusBarEntry_1.SizeStatusBarEntry();
    context.subscriptions.push(sizeStatusBarEntry);
    const binarySizeStatusBarEntry = new binarySizeStatusBarEntry_1.BinarySizeStatusBarEntry();
    context.subscriptions.push(binarySizeStatusBarEntry);
    const zoomStatusBarEntry = new zoomStatusBarEntry_1.ZoomStatusBarEntry();
    context.subscriptions.push(zoomStatusBarEntry);
    const previewManager = new preview_1.PreviewManager(context.extensionUri, sizeStatusBarEntry, binarySizeStatusBarEntry, zoomStatusBarEntry);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(preview_1.PreviewManager.viewType, previewManager, {
        supportsMultipleEditorsPerDocument: true,
    }));
    context.subscriptions.push(vscode.commands.registerCommand('imagePreview.zoomIn', () => {
        var _a;
        (_a = previewManager.activePreview) === null || _a === void 0 ? void 0 : _a.zoomIn();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('imagePreview.zoomOut', () => {
        var _a;
        (_a = previewManager.activePreview) === null || _a === void 0 ? void 0 : _a.zoomOut();
    }));
}
exports.activate = activate;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewManager = void 0;
const vscode = __webpack_require__(1);
const nls = __webpack_require__(4);
const dispose_1 = __webpack_require__(5);
const localize = nls.loadMessageBundle();
class PreviewManager {
    constructor(extensionRoot, sizeStatusBarEntry, binarySizeStatusBarEntry, zoomStatusBarEntry) {
        this.extensionRoot = extensionRoot;
        this.sizeStatusBarEntry = sizeStatusBarEntry;
        this.binarySizeStatusBarEntry = binarySizeStatusBarEntry;
        this.zoomStatusBarEntry = zoomStatusBarEntry;
        this._previews = new Set();
    }
    async openCustomDocument(uri) {
        return { uri, dispose: () => { } };
    }
    async resolveCustomEditor(document, webviewEditor) {
        const preview = new Preview(this.extensionRoot, document.uri, webviewEditor, this.sizeStatusBarEntry, this.binarySizeStatusBarEntry, this.zoomStatusBarEntry);
        this._previews.add(preview);
        this.setActivePreview(preview);
        webviewEditor.onDidDispose(() => { this._previews.delete(preview); });
        webviewEditor.onDidChangeViewState(() => {
            if (webviewEditor.active) {
                this.setActivePreview(preview);
            }
            else if (this._activePreview === preview && !webviewEditor.active) {
                this.setActivePreview(undefined);
            }
        });
    }
    get activePreview() { return this._activePreview; }
    setActivePreview(value) {
        this._activePreview = value;
        this.setPreviewActiveContext(!!value);
    }
    setPreviewActiveContext(value) {
        vscode.commands.executeCommand('setContext', 'imagePreviewFocus', value);
    }
}
exports.PreviewManager = PreviewManager;
PreviewManager.viewType = 'imagePreview.previewEditor';
class Preview extends dispose_1.Disposable {
    constructor(extensionRoot, resource, webviewEditor, sizeStatusBarEntry, binarySizeStatusBarEntry, zoomStatusBarEntry) {
        super();
        this.extensionRoot = extensionRoot;
        this.resource = resource;
        this.webviewEditor = webviewEditor;
        this.sizeStatusBarEntry = sizeStatusBarEntry;
        this.binarySizeStatusBarEntry = binarySizeStatusBarEntry;
        this.zoomStatusBarEntry = zoomStatusBarEntry;
        this.id = `${Date.now()}-${Math.random().toString()}`;
        this._previewState = 1 /* Visible */;
        this.emptyPngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR42gEFAPr/AP///wAI/AL+Sr4t6gAAAABJRU5ErkJggg==';
        const resourceRoot = resource.with({
            path: resource.path.replace(/\/[^\/]+?\.\w+$/, '/'),
        });
        webviewEditor.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                resourceRoot,
                extensionRoot,
            ]
        };
        this._register(webviewEditor.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'size':
                    {
                        this._imageSize = message.value;
                        this.update();
                        break;
                    }
                case 'zoom':
                    {
                        this._imageZoom = message.value;
                        this.update();
                        break;
                    }
                case 'reopen-as-text':
                    {
                        vscode.commands.executeCommand('vscode.openWith', resource, 'default', webviewEditor.viewColumn);
                        break;
                    }
            }
        }));
        this._register(zoomStatusBarEntry.onDidChangeScale(e => {
            if (this._previewState === 2 /* Active */) {
                this.webviewEditor.webview.postMessage({ type: 'setScale', scale: e.scale });
            }
        }));
        this._register(webviewEditor.onDidChangeViewState(() => {
            this.update();
            this.webviewEditor.webview.postMessage({ type: 'setActive', value: this.webviewEditor.active });
        }));
        this._register(webviewEditor.onDidDispose(() => {
            if (this._previewState === 2 /* Active */) {
                this.sizeStatusBarEntry.hide(this.id);
                this.binarySizeStatusBarEntry.hide(this.id);
                this.zoomStatusBarEntry.hide(this.id);
            }
            this._previewState = 0 /* Disposed */;
        }));
        const watcher = this._register(vscode.workspace.createFileSystemWatcher(resource.fsPath));
        this._register(watcher.onDidChange(e => {
            if (e.toString() === this.resource.toString()) {
                this.render();
            }
        }));
        this._register(watcher.onDidDelete(e => {
            if (e.toString() === this.resource.toString()) {
                this.webviewEditor.dispose();
            }
        }));
        vscode.workspace.fs.stat(resource).then(({ size }) => {
            this._imageBinarySize = size;
            this.update();
        });
        this.render();
        this.update();
        this.webviewEditor.webview.postMessage({ type: 'setActive', value: this.webviewEditor.active });
    }
    zoomIn() {
        if (this._previewState === 2 /* Active */) {
            this.webviewEditor.webview.postMessage({ type: 'zoomIn' });
        }
    }
    zoomOut() {
        if (this._previewState === 2 /* Active */) {
            this.webviewEditor.webview.postMessage({ type: 'zoomOut' });
        }
    }
    async render() {
        if (this._previewState !== 0 /* Disposed */) {
            this.webviewEditor.webview.html = await this.getWebviewContents();
        }
    }
    update() {
        if (this._previewState === 0 /* Disposed */) {
            return;
        }
        if (this.webviewEditor.active) {
            this._previewState = 2 /* Active */;
            this.sizeStatusBarEntry.show(this.id, this._imageSize || '');
            this.binarySizeStatusBarEntry.show(this.id, this._imageBinarySize);
            this.zoomStatusBarEntry.show(this.id, this._imageZoom || 'fit');
        }
        else {
            if (this._previewState === 2 /* Active */) {
                this.sizeStatusBarEntry.hide(this.id);
                this.binarySizeStatusBarEntry.hide(this.id);
                this.zoomStatusBarEntry.hide(this.id);
            }
            this._previewState = 1 /* Visible */;
        }
    }
    async getWebviewContents() {
        const version = Date.now().toString();
        const settings = {
            isMac: process.platform === 'darwin',
            src: await this.getResourcePath(this.webviewEditor, this.resource, version),
        };
        const nonce = Date.now().toString();
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">

	<!-- Disable pinch zooming -->
	<meta name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">

	<title>Image Preview</title>

	<link rel="stylesheet" href="${escapeAttribute(this.extensionResource('/media/main.css'))}" type="text/css" media="screen" nonce="${nonce}">

	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data: ${this.webviewEditor.webview.cspSource}; script-src 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';">
	<meta id="image-preview-settings" data-settings="${escapeAttribute(JSON.stringify(settings))}">
</head>
<body class="container image scale-to-fit loading">
	<div class="loading-indicator"></div>
	<div class="image-load-error">
		<p>${localize('preview.imageLoadError', "An error occurred while loading the image.")}</p>
		<a href="#" class="open-file-link">${localize('preview.imageLoadErrorLink', "Open file using VS Code's standard text/binary editor?")}</a>
	</div>
	<script src="${escapeAttribute(this.extensionResource('/media/main.js'))}" nonce="${nonce}"></script>
</body>
</html>`;
    }
    async getResourcePath(webviewEditor, resource, version) {
        if (resource.scheme === 'git') {
            const stat = await vscode.workspace.fs.stat(resource);
            if (stat.size === 0) {
                return this.emptyPngDataUri;
            }
        }
        // Avoid adding cache busting if there is already a query string
        if (resource.query) {
            return webviewEditor.webview.asWebviewUri(resource).toString();
        }
        return webviewEditor.webview.asWebviewUri(resource).with({ query: `version=${version}` }).toString();
    }
    extensionResource(path) {
        return this.webviewEditor.webview.asWebviewUri(this.extensionRoot.with({
            path: this.extensionRoot.path + path
        }));
    }
}
function escapeAttribute(value) {
    return value.toString().replace(/"/g, '&quot;');
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(3)))

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


Object.defineProperty(exports, "__esModule", { value: true });

function format(message, args) {
	let result;
	// if (isPseudo) {
	// 	// FF3B and FF3D is the Unicode zenkaku representation for [ and ]
	// 	message = '\uFF3B' + message.replace(/[aouei]/g, '$&$&') + '\uFF3D';
	// }
	if (args.length === 0) {
		result = message;
	}
	else {
		result = message.replace(/\{(\d+)\}/g, function (match, rest) {
			let index = rest[0];
			let arg = args[index];
			let replacement = match;
			if (typeof arg === 'string') {
				replacement = arg;
			}
			else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === void 0 || arg === null) {
				replacement = String(arg);
			}
			return replacement;
		});
	}
	return result;
}

function localize(key, message) {
	let args = [];
	for (let _i = 2; _i < arguments.length; _i++) {
		args[_i - 2] = arguments[_i];
	}
	return format(message, args);
}

function loadMessageBundle(file) {
	return localize;
}

let MessageFormat;
(function (MessageFormat) {
	MessageFormat["file"] = "file";
	MessageFormat["bundle"] = "bundle";
	MessageFormat["both"] = "both";
})(MessageFormat = exports.MessageFormat || (exports.MessageFormat = {}));
let BundleFormat;
(function (BundleFormat) {
	// the nls.bundle format
	BundleFormat["standalone"] = "standalone";
	BundleFormat["languagePack"] = "languagePack";
})(BundleFormat = exports.BundleFormat || (exports.BundleFormat = {}));

exports.loadMessageBundle = loadMessageBundle;
function config(opts) {
	if (opts) {
		if (isString(opts.locale)) {
			options.locale = opts.locale.toLowerCase();
			options.language = options.locale;
			resolvedLanguage = undefined;
			resolvedBundles = Object.create(null);
		}
		if (opts.messageFormat !== undefined) {
			options.messageFormat = opts.messageFormat;
		}
		if (opts.bundleFormat === BundleFormat.standalone && options.languagePackSupport === true) {
			options.languagePackSupport = false;
		}
	}
	isPseudo = options.locale === 'pseudo';
	return loadMessageBundle;
}
exports.config = config;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Disposable = exports.disposeAll = void 0;
function disposeAll(disposables) {
    while (disposables.length) {
        const item = disposables.pop();
        if (item) {
            item.dispose();
        }
    }
}
exports.disposeAll = disposeAll;
class Disposable {
    constructor() {
        this._isDisposed = false;
        this._disposables = [];
    }
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        disposeAll(this._disposables);
    }
    _register(value) {
        if (this._isDisposed) {
            value.dispose();
        }
        else {
            this._disposables.push(value);
        }
        return value;
    }
    get isDisposed() {
        return this._isDisposed;
    }
}
exports.Disposable = Disposable;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SizeStatusBarEntry = void 0;
const vscode = __webpack_require__(1);
const nls = __webpack_require__(4);
const ownedStatusBarEntry_1 = __webpack_require__(7);
const localize = nls.loadMessageBundle();
class SizeStatusBarEntry extends ownedStatusBarEntry_1.PreviewStatusBarEntry {
    constructor() {
        super({
            id: 'imagePreview.size',
            name: localize('sizeStatusBar.name', "Image Size"),
            alignment: vscode.StatusBarAlignment.Right,
            priority: 101 /* to the left of editor status (100) */,
        });
    }
    show(owner, text) {
        this.showItem(owner, text);
    }
}
exports.SizeStatusBarEntry = SizeStatusBarEntry;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewStatusBarEntry = void 0;
const vscode = __webpack_require__(1);
const dispose_1 = __webpack_require__(5);
class PreviewStatusBarEntry extends dispose_1.Disposable {
    constructor(options) {
        super();
        this.entry = this._register(vscode.window.createStatusBarItem(options));
    }
    showItem(owner, text) {
        this._showOwner = owner;
        this.entry.text = text;
        this.entry.show();
    }
    hide(owner) {
        if (owner === this._showOwner) {
            this.entry.hide();
            this._showOwner = undefined;
        }
    }
}
exports.PreviewStatusBarEntry = PreviewStatusBarEntry;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinarySizeStatusBarEntry = void 0;
const vscode = __webpack_require__(1);
const nls = __webpack_require__(4);
const ownedStatusBarEntry_1 = __webpack_require__(7);
const localize = nls.loadMessageBundle();
class BinarySize {
    static formatSize(size) {
        if (size < BinarySize.KB) {
            return localize('sizeB', "{0}B", size);
        }
        if (size < BinarySize.MB) {
            return localize('sizeKB', "{0}KB", (size / BinarySize.KB).toFixed(2));
        }
        if (size < BinarySize.GB) {
            return localize('sizeMB', "{0}MB", (size / BinarySize.MB).toFixed(2));
        }
        if (size < BinarySize.TB) {
            return localize('sizeGB', "{0}GB", (size / BinarySize.GB).toFixed(2));
        }
        return localize('sizeTB', "{0}TB", (size / BinarySize.TB).toFixed(2));
    }
}
BinarySize.KB = 1024;
BinarySize.MB = BinarySize.KB * BinarySize.KB;
BinarySize.GB = BinarySize.MB * BinarySize.KB;
BinarySize.TB = BinarySize.GB * BinarySize.KB;
class BinarySizeStatusBarEntry extends ownedStatusBarEntry_1.PreviewStatusBarEntry {
    constructor() {
        super({
            id: 'imagePreview.binarySize',
            name: localize('sizeStatusBar.name', "Image Binary Size"),
            alignment: vscode.StatusBarAlignment.Right,
            priority: 100,
        });
    }
    show(owner, size) {
        if (typeof size === 'number') {
            super.showItem(owner, BinarySize.formatSize(size));
        }
        else {
            this.hide(owner);
        }
    }
}
exports.BinarySizeStatusBarEntry = BinarySizeStatusBarEntry;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomStatusBarEntry = void 0;
const vscode = __webpack_require__(1);
const nls = __webpack_require__(4);
const ownedStatusBarEntry_1 = __webpack_require__(7);
const localize = nls.loadMessageBundle();
const selectZoomLevelCommandId = '_imagePreview.selectZoomLevel';
class ZoomStatusBarEntry extends ownedStatusBarEntry_1.PreviewStatusBarEntry {
    constructor() {
        super({
            id: 'imagePreview.zoom',
            name: localize('zoomStatusBar.name', "Image Zoom"),
            alignment: vscode.StatusBarAlignment.Right,
            priority: 102 /* to the left of editor size entry (101) */,
        });
        this._onDidChangeScale = this._register(new vscode.EventEmitter());
        this.onDidChangeScale = this._onDidChangeScale.event;
        this._register(vscode.commands.registerCommand(selectZoomLevelCommandId, async () => {
            const scales = [10, 5, 2, 1, 0.5, 0.2, 'fit'];
            const options = scales.map((scale) => ({
                label: this.zoomLabel(scale),
                scale
            }));
            const pick = await vscode.window.showQuickPick(options, {
                placeHolder: localize('zoomStatusBar.placeholder', "Select zoom level")
            });
            if (pick) {
                this._onDidChangeScale.fire({ scale: pick.scale });
            }
        }));
        this.entry.command = selectZoomLevelCommandId;
    }
    show(owner, scale) {
        this.showItem(owner, this.zoomLabel(scale));
    }
    zoomLabel(scale) {
        return scale === 'fit'
            ? localize('zoomStatusBar.wholeImageLabel', "Whole Image")
            : `${Math.round(scale * 100)}%`;
    }
}
exports.ZoomStatusBarEntry = ZoomStatusBarEntry;


/***/ })
/******/ ])));
//# __sourceMappingURL=extension.js.map