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
exports.deactivate = exports.activate = void 0;
const services_1 = __webpack_require__(1);
function activate(context) {
    // Register disposables
    const services = new services_1.default(context);
    services.begin();
    context.subscriptions.push(services);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __webpack_require__(2);
const documentTracker_1 = __webpack_require__(3);
const codelensProvider_1 = __webpack_require__(7);
const commandHandler_1 = __webpack_require__(9);
const contentProvider_1 = __webpack_require__(10);
const mergeDecorator_1 = __webpack_require__(11);
const ConfigurationSectionName = 'merge-conflict';
class ServiceWrapper {
    constructor(context) {
        this.context = context;
        this.services = [];
    }
    begin() {
        let configuration = this.createExtensionConfiguration();
        const documentTracker = new documentTracker_1.default();
        this.services.push(documentTracker, new commandHandler_1.default(documentTracker), new codelensProvider_1.default(documentTracker), new contentProvider_1.default(this.context), new mergeDecorator_1.default(this.context, documentTracker));
        this.services.forEach((service) => {
            if (service.begin && service.begin instanceof Function) {
                service.begin(configuration);
            }
        });
        vscode.workspace.onDidChangeConfiguration(() => {
            this.services.forEach((service) => {
                if (service.configurationUpdated && service.configurationUpdated instanceof Function) {
                    service.configurationUpdated(this.createExtensionConfiguration());
                }
            });
        });
    }
    createExtensionConfiguration() {
        const workspaceConfiguration = vscode.workspace.getConfiguration(ConfigurationSectionName);
        const codeLensEnabled = workspaceConfiguration.get('codeLens.enabled', true);
        const decoratorsEnabled = workspaceConfiguration.get('decorators.enabled', true);
        return {
            enableCodeLens: codeLensEnabled,
            enableDecorations: decoratorsEnabled,
            enableEditorOverview: decoratorsEnabled
        };
    }
    dispose() {
        this.services.forEach(disposable => disposable.dispose());
        this.services = [];
    }
}
exports.default = ServiceWrapper;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("vscode");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const mergeConflictParser_1 = __webpack_require__(4);
const delayer_1 = __webpack_require__(6);
class ScanTask {
    constructor(delayTime, initialOrigin) {
        this.origins = new Set();
        this.origins.add(initialOrigin);
        this.delayTask = new delayer_1.Delayer(delayTime);
    }
    addOrigin(name) {
        if (this.origins.has(name)) {
            return false;
        }
        return false;
    }
    hasOrigin(name) {
        return this.origins.has(name);
    }
}
class OriginDocumentMergeConflictTracker {
    constructor(parent, origin) {
        this.parent = parent;
        this.origin = origin;
    }
    getConflicts(document) {
        return this.parent.getConflicts(document, this.origin);
    }
    isPending(document) {
        return this.parent.isPending(document, this.origin);
    }
    forget(document) {
        this.parent.forget(document);
    }
}
class DocumentMergeConflictTracker {
    constructor() {
        this.cache = new Map();
        this.delayExpireTime = 0;
    }
    getConflicts(document, origin) {
        // Attempt from cache
        let key = this.getCacheKey(document);
        if (!key) {
            // Document doesn't have a uri, can't cache it, so return
            return Promise.resolve(this.getConflictsOrEmpty(document, [origin]));
        }
        let cacheItem = this.cache.get(key);
        if (!cacheItem) {
            cacheItem = new ScanTask(this.delayExpireTime, origin);
            this.cache.set(key, cacheItem);
        }
        else {
            cacheItem.addOrigin(origin);
        }
        return cacheItem.delayTask.trigger(() => {
            let conflicts = this.getConflictsOrEmpty(document, Array.from(cacheItem.origins));
            if (this.cache) {
                this.cache.delete(key);
            }
            return conflicts;
        });
    }
    isPending(document, origin) {
        if (!document) {
            return false;
        }
        let key = this.getCacheKey(document);
        if (!key) {
            return false;
        }
        const task = this.cache.get(key);
        if (!task) {
            return false;
        }
        return task.hasOrigin(origin);
    }
    createTracker(origin) {
        return new OriginDocumentMergeConflictTracker(this, origin);
    }
    forget(document) {
        let key = this.getCacheKey(document);
        if (key) {
            this.cache.delete(key);
        }
    }
    dispose() {
        this.cache.clear();
    }
    getConflictsOrEmpty(document, _origins) {
        const containsConflict = mergeConflictParser_1.MergeConflictParser.containsConflict(document);
        if (!containsConflict) {
            return [];
        }
        const conflicts = mergeConflictParser_1.MergeConflictParser.scanDocument(document);
        return conflicts;
    }
    getCacheKey(document) {
        if (document.uri) {
            return document.uri.toString();
        }
        return null;
    }
}
exports.default = DocumentMergeConflictTracker;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeConflictParser = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __webpack_require__(2);
const documentMergeConflict_1 = __webpack_require__(5);
const startHeaderMarker = '<<<<<<<';
const commonAncestorsMarker = '|||||||';
const splitterMarker = '=======';
const endFooterMarker = '>>>>>>>';
class MergeConflictParser {
    static scanDocument(document) {
        // Scan each line in the document, we already know there is at least a <<<<<<< and
        // >>>>>> marker within the document, we need to group these into conflict ranges.
        // We initially build a scan match, that references the lines of the header, splitter
        // and footer. This is then converted into a full descriptor containing all required
        // ranges.
        let currentConflict = null;
        const conflictDescriptors = [];
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            // Ignore empty lines
            if (!line || line.isEmptyOrWhitespace) {
                continue;
            }
            // Is this a start line? <<<<<<<
            if (line.text.startsWith(startHeaderMarker)) {
                if (currentConflict !== null) {
                    // Error, we should not see a startMarker before we've seen an endMarker
                    currentConflict = null;
                    // Give up parsing, anything matched up this to this point will be decorated
                    // anything after will not
                    break;
                }
                // Create a new conflict starting at this line
                currentConflict = { startHeader: line, commonAncestors: [] };
            }
            // Are we within a conflict block and is this a common ancestors marker? |||||||
            else if (currentConflict && !currentConflict.splitter && line.text.startsWith(commonAncestorsMarker)) {
                currentConflict.commonAncestors.push(line);
            }
            // Are we within a conflict block and is this a splitter? =======
            else if (currentConflict && !currentConflict.splitter && line.text.startsWith(splitterMarker)) {
                currentConflict.splitter = line;
            }
            // Are we within a conflict block and is this a footer? >>>>>>>
            else if (currentConflict && line.text.startsWith(endFooterMarker)) {
                currentConflict.endFooter = line;
                // Create a full descriptor from the lines that we matched. This can return
                // null if the descriptor could not be completed.
                let completeDescriptor = MergeConflictParser.scanItemTolMergeConflictDescriptor(document, currentConflict);
                if (completeDescriptor !== null) {
                    conflictDescriptors.push(completeDescriptor);
                }
                // Reset the current conflict to be empty, so we can match the next
                // starting header marker.
                currentConflict = null;
            }
        }
        return conflictDescriptors
            .filter(Boolean)
            .map(descriptor => new documentMergeConflict_1.DocumentMergeConflict(descriptor));
    }
    static scanItemTolMergeConflictDescriptor(document, scanned) {
        // Validate we have all the required lines within the scan item.
        if (!scanned.startHeader || !scanned.splitter || !scanned.endFooter) {
            return null;
        }
        let tokenAfterCurrentBlock = scanned.commonAncestors[0] || scanned.splitter;
        // Assume that descriptor.current.header, descriptor.incoming.header and descriptor.splitter
        // have valid ranges, fill in content and total ranges from these parts.
        // NOTE: We need to shift the decorator range back one character so the splitter does not end up with
        // two decoration colors (current and splitter), if we take the new line from the content into account
        // the decorator will wrap to the next line.
        return {
            current: {
                header: scanned.startHeader.range,
                decoratorContent: new vscode.Range(scanned.startHeader.rangeIncludingLineBreak.end, MergeConflictParser.shiftBackOneCharacter(document, tokenAfterCurrentBlock.range.start, scanned.startHeader.rangeIncludingLineBreak.end)),
                // Current content is range between header (shifted for linebreak) and splitter or common ancestors mark start
                content: new vscode.Range(scanned.startHeader.rangeIncludingLineBreak.end, tokenAfterCurrentBlock.range.start),
                name: scanned.startHeader.text.substring(startHeaderMarker.length + 1)
            },
            commonAncestors: scanned.commonAncestors.map((currentTokenLine, index, commonAncestors) => {
                let nextTokenLine = commonAncestors[index + 1] || scanned.splitter;
                return {
                    header: currentTokenLine.range,
                    decoratorContent: new vscode.Range(currentTokenLine.rangeIncludingLineBreak.end, MergeConflictParser.shiftBackOneCharacter(document, nextTokenLine.range.start, currentTokenLine.rangeIncludingLineBreak.end)),
                    // Each common ancestors block is range between one common ancestors token
                    // (shifted for linebreak) and start of next common ancestors token or splitter
                    content: new vscode.Range(currentTokenLine.rangeIncludingLineBreak.end, nextTokenLine.range.start),
                    name: currentTokenLine.text.substring(commonAncestorsMarker.length + 1)
                };
            }),
            splitter: scanned.splitter.range,
            incoming: {
                header: scanned.endFooter.range,
                decoratorContent: new vscode.Range(scanned.splitter.rangeIncludingLineBreak.end, MergeConflictParser.shiftBackOneCharacter(document, scanned.endFooter.range.start, scanned.splitter.rangeIncludingLineBreak.end)),
                // Incoming content is range between splitter (shifted for linebreak) and footer start
                content: new vscode.Range(scanned.splitter.rangeIncludingLineBreak.end, scanned.endFooter.range.start),
                name: scanned.endFooter.text.substring(endFooterMarker.length + 1)
            },
            // Entire range is between current header start and incoming header end (including line break)
            range: new vscode.Range(scanned.startHeader.range.start, scanned.endFooter.rangeIncludingLineBreak.end)
        };
    }
    static containsConflict(document) {
        if (!document) {
            return false;
        }
        let text = document.getText();
        return text.includes(startHeaderMarker) && text.includes(endFooterMarker);
    }
    static shiftBackOneCharacter(document, range, unlessEqual) {
        if (range.isEqual(unlessEqual)) {
            return range;
        }
        let line = range.line;
        let character = range.character - 1;
        if (character < 0) {
            line--;
            character = document.lineAt(line).range.end.character;
        }
        return new vscode.Position(line, character);
    }
}
exports.MergeConflictParser = MergeConflictParser;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentMergeConflict = void 0;
class DocumentMergeConflict {
    constructor(descriptor) {
        this.range = descriptor.range;
        this.current = descriptor.current;
        this.incoming = descriptor.incoming;
        this.commonAncestors = descriptor.commonAncestors;
        this.splitter = descriptor.splitter;
    }
    commitEdit(type, editor, edit) {
        if (edit) {
            this.applyEdit(type, editor.document, edit);
            return Promise.resolve(true);
        }
        return editor.edit((edit) => this.applyEdit(type, editor.document, edit));
    }
    applyEdit(type, document, edit) {
        // Each conflict is a set of ranges as follows, note placements or newlines
        // which may not in spans
        // [ Conflict Range             -- (Entire content below)
        //   [ Current Header ]\n       -- >>>>> Header
        //   [ Current Content ]        -- (content)
        //   [ Splitter ]\n             -- =====
        //   [ Incoming Content ]       -- (content)
        //   [ Incoming Header ]\n      -- <<<<< Incoming
        // ]
        if (type === 0 /* Current */) {
            // Replace [ Conflict Range ] with [ Current Content ]
            let content = document.getText(this.current.content);
            this.replaceRangeWithContent(content, edit);
        }
        else if (type === 1 /* Incoming */) {
            let content = document.getText(this.incoming.content);
            this.replaceRangeWithContent(content, edit);
        }
        else if (type === 2 /* Both */) {
            // Replace [ Conflict Range ] with [ Current Content ] + \n + [ Incoming Content ]
            const currentContent = document.getText(this.current.content);
            const incomingContent = document.getText(this.incoming.content);
            edit.replace(this.range, currentContent.concat(incomingContent));
        }
    }
    replaceRangeWithContent(content, edit) {
        if (this.isNewlineOnly(content)) {
            edit.replace(this.range, '');
            return;
        }
        // Replace [ Conflict Range ] with [ Current Content ]
        edit.replace(this.range, content);
    }
    isNewlineOnly(text) {
        return text === '\n' || text === '\r\n';
    }
}
exports.DocumentMergeConflict = DocumentMergeConflict;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delayer = void 0;
class Delayer {
    constructor(defaultDelay) {
        this.defaultDelay = defaultDelay;
        this.timeout = null;
        this.completionPromise = null;
        this.onSuccess = null;
        this.task = null;
    }
    trigger(task, delay = this.defaultDelay) {
        this.task = task;
        if (delay >= 0) {
            this.cancelTimeout();
        }
        if (!this.completionPromise) {
            this.completionPromise = new Promise((resolve) => {
                this.onSuccess = resolve;
            }).then(() => {
                this.completionPromise = null;
                this.onSuccess = null;
                let result = this.task();
                this.task = null;
                return result;
            });
        }
        if (delay >= 0 || this.timeout === null) {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.onSuccess(undefined);
            }, delay >= 0 ? delay : this.defaultDelay);
        }
        return this.completionPromise;
    }
    forceDelivery() {
        if (!this.completionPromise) {
            return null;
        }
        this.cancelTimeout();
        let result = this.completionPromise;
        this.onSuccess(undefined);
        return result;
    }
    isTriggered() {
        return this.timeout !== null;
    }
    cancel() {
        this.cancelTimeout();
        this.completionPromise = null;
    }
    cancelTimeout() {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}
exports.Delayer = Delayer;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __webpack_require__(2);
const vscode_nls_1 = __webpack_require__(8);
const localize = vscode_nls_1.loadMessageBundle();
class MergeConflictCodeLensProvider {
    constructor(trackerService) {
        this.tracker = trackerService.createTracker('codelens');
    }
    begin(config) {
        this.config = config;
        if (this.config.enableCodeLens) {
            this.registerCodeLensProvider();
        }
    }
    configurationUpdated(updatedConfig) {
        if (updatedConfig.enableCodeLens === false && this.codeLensRegistrationHandle) {
            this.codeLensRegistrationHandle.dispose();
            this.codeLensRegistrationHandle = null;
        }
        else if (updatedConfig.enableCodeLens === true && !this.codeLensRegistrationHandle) {
            this.registerCodeLensProvider();
        }
        this.config = updatedConfig;
    }
    dispose() {
        if (this.codeLensRegistrationHandle) {
            this.codeLensRegistrationHandle.dispose();
            this.codeLensRegistrationHandle = null;
        }
    }
    async provideCodeLenses(document, _token) {
        if (!this.config || !this.config.enableCodeLens) {
            return null;
        }
        let conflicts = await this.tracker.getConflicts(document);
        if (!conflicts || conflicts.length === 0) {
            return null;
        }
        let items = [];
        conflicts.forEach(conflict => {
            let acceptCurrentCommand = {
                command: 'merge-conflict.accept.current',
                title: localize('acceptCurrentChange', 'Accept Current Change'),
                arguments: ['known-conflict', conflict]
            };
            let acceptIncomingCommand = {
                command: 'merge-conflict.accept.incoming',
                title: localize('acceptIncomingChange', 'Accept Incoming Change'),
                arguments: ['known-conflict', conflict]
            };
            let acceptBothCommand = {
                command: 'merge-conflict.accept.both',
                title: localize('acceptBothChanges', 'Accept Both Changes'),
                arguments: ['known-conflict', conflict]
            };
            let diffCommand = {
                command: 'merge-conflict.compare',
                title: localize('compareChanges', 'Compare Changes'),
                arguments: [conflict]
            };
            items.push(new vscode.CodeLens(conflict.range, acceptCurrentCommand), new vscode.CodeLens(conflict.range.with(conflict.range.start.with({ character: conflict.range.start.character + 1 })), acceptIncomingCommand), new vscode.CodeLens(conflict.range.with(conflict.range.start.with({ character: conflict.range.start.character + 2 })), acceptBothCommand), new vscode.CodeLens(conflict.range.with(conflict.range.start.with({ character: conflict.range.start.character + 3 })), diffCommand));
        });
        return items;
    }
    registerCodeLensProvider() {
        this.codeLensRegistrationHandle = vscode.languages.registerCodeLensProvider([
            { scheme: 'file' },
            { scheme: 'untitled' },
            { scheme: 'vscode-userdata' },
        ], this);
    }
}
exports.default = MergeConflictCodeLensProvider;


/***/ }),
/* 8 */
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
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __webpack_require__(2);
const contentProvider_1 = __webpack_require__(10);
const vscode_nls_1 = __webpack_require__(8);
const localize = vscode_nls_1.loadMessageBundle();
var NavigationDirection;
(function (NavigationDirection) {
    NavigationDirection[NavigationDirection["Forwards"] = 0] = "Forwards";
    NavigationDirection[NavigationDirection["Backwards"] = 1] = "Backwards";
})(NavigationDirection || (NavigationDirection = {}));
class CommandHandler {
    constructor(trackerService) {
        this.disposables = [];
        this.tracker = trackerService.createTracker('commands');
    }
    begin() {
        this.disposables.push(this.registerTextEditorCommand('merge-conflict.accept.current', this.acceptCurrent), this.registerTextEditorCommand('merge-conflict.accept.incoming', this.acceptIncoming), this.registerTextEditorCommand('merge-conflict.accept.selection', this.acceptSelection), this.registerTextEditorCommand('merge-conflict.accept.both', this.acceptBoth), this.registerTextEditorCommand('merge-conflict.accept.all-current', this.acceptAllCurrent, this.acceptAllCurrentResources), this.registerTextEditorCommand('merge-conflict.accept.all-incoming', this.acceptAllIncoming, this.acceptAllIncomingResources), this.registerTextEditorCommand('merge-conflict.accept.all-both', this.acceptAllBoth), this.registerTextEditorCommand('merge-conflict.next', this.navigateNext), this.registerTextEditorCommand('merge-conflict.previous', this.navigatePrevious), this.registerTextEditorCommand('merge-conflict.compare', this.compare));
    }
    registerTextEditorCommand(command, cb, resourceCB) {
        return vscode.commands.registerCommand(command, (...args) => {
            if (resourceCB && args.length && args.every(arg => arg && arg.resourceUri)) {
                return resourceCB.call(this, args.map(arg => arg.resourceUri));
            }
            const editor = vscode.window.activeTextEditor;
            return editor && cb.call(this, editor, ...args);
        });
    }
    acceptCurrent(editor, ...args) {
        return this.accept(0 /* Current */, editor, ...args);
    }
    acceptIncoming(editor, ...args) {
        return this.accept(1 /* Incoming */, editor, ...args);
    }
    acceptBoth(editor, ...args) {
        return this.accept(2 /* Both */, editor, ...args);
    }
    acceptAllCurrent(editor) {
        return this.acceptAll(0 /* Current */, editor);
    }
    acceptAllIncoming(editor) {
        return this.acceptAll(1 /* Incoming */, editor);
    }
    acceptAllCurrentResources(resources) {
        return this.acceptAllResources(0 /* Current */, resources);
    }
    acceptAllIncomingResources(resources) {
        return this.acceptAllResources(1 /* Incoming */, resources);
    }
    acceptAllBoth(editor) {
        return this.acceptAll(2 /* Both */, editor);
    }
    async compare(editor, conflict) {
        // No conflict, command executed from command palette
        if (!conflict) {
            conflict = await this.findConflictContainingSelection(editor);
            // Still failed to find conflict, warn the user and exit
            if (!conflict) {
                vscode.window.showWarningMessage(localize('cursorNotInConflict', 'Editor cursor is not within a merge conflict'));
                return;
            }
        }
        const conflicts = await this.tracker.getConflicts(editor.document);
        // Still failed to find conflict, warn the user and exit
        if (!conflicts) {
            vscode.window.showWarningMessage(localize('cursorNotInConflict', 'Editor cursor is not within a merge conflict'));
            return;
        }
        const scheme = editor.document.uri.scheme;
        let range = conflict.current.content;
        let leftRanges = conflicts.map(conflict => [conflict.current.content, conflict.range]);
        let rightRanges = conflicts.map(conflict => [conflict.incoming.content, conflict.range]);
        const leftUri = editor.document.uri.with({
            scheme: contentProvider_1.default.scheme,
            query: JSON.stringify({ scheme, range: range, ranges: leftRanges })
        });
        range = conflict.incoming.content;
        const rightUri = leftUri.with({ query: JSON.stringify({ scheme, ranges: rightRanges }) });
        let mergeConflictLineOffsets = 0;
        for (let nextconflict of conflicts) {
            if (nextconflict.range.isEqual(conflict.range)) {
                break;
            }
            else {
                mergeConflictLineOffsets += (nextconflict.range.end.line - nextconflict.range.start.line) - (nextconflict.incoming.content.end.line - nextconflict.incoming.content.start.line);
            }
        }
        const selection = new vscode.Range(conflict.range.start.line - mergeConflictLineOffsets, conflict.range.start.character, conflict.range.start.line - mergeConflictLineOffsets, conflict.range.start.character);
        const docPath = editor.document.uri.path;
        const fileName = docPath.substring(docPath.lastIndexOf('/') + 1); // avoid NodeJS path to keep browser webpack small
        const title = localize('compareChangesTitle', '{0}: Current Changes ⟷ Incoming Changes', fileName);
        const mergeConflictConfig = vscode.workspace.getConfiguration('merge-conflict');
        const openToTheSide = mergeConflictConfig.get('diffViewPosition');
        const opts = {
            viewColumn: openToTheSide === 'Beside' ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
            selection
        };
        if (openToTheSide === 'Below') {
            await vscode.commands.executeCommand('workbench.action.newGroupBelow');
        }
        await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, title, opts);
    }
    navigateNext(editor) {
        return this.navigate(editor, NavigationDirection.Forwards);
    }
    navigatePrevious(editor) {
        return this.navigate(editor, NavigationDirection.Backwards);
    }
    async acceptSelection(editor) {
        let conflict = await this.findConflictContainingSelection(editor);
        if (!conflict) {
            vscode.window.showWarningMessage(localize('cursorNotInConflict', 'Editor cursor is not within a merge conflict'));
            return;
        }
        let typeToAccept;
        let tokenAfterCurrentBlock = conflict.splitter;
        if (conflict.commonAncestors.length > 0) {
            tokenAfterCurrentBlock = conflict.commonAncestors[0].header;
        }
        // Figure out if the cursor is in current or incoming, we do this by seeing if
        // the active position is before or after the range of the splitter or common
        // ancestors marker. We can use this trick as the previous check in
        // findConflictByActiveSelection will ensure it's within the conflict range, so
        // we don't falsely identify "current" or "incoming" if outside of a conflict range.
        if (editor.selection.active.isBefore(tokenAfterCurrentBlock.start)) {
            typeToAccept = 0 /* Current */;
        }
        else if (editor.selection.active.isAfter(conflict.splitter.end)) {
            typeToAccept = 1 /* Incoming */;
        }
        else if (editor.selection.active.isBefore(conflict.splitter.start)) {
            vscode.window.showWarningMessage(localize('cursorOnCommonAncestorsRange', 'Editor cursor is within the common ancestors block, please move it to either the "current" or "incoming" block'));
            return;
        }
        else {
            vscode.window.showWarningMessage(localize('cursorOnSplitterRange', 'Editor cursor is within the merge conflict splitter, please move it to either the "current" or "incoming" block'));
            return;
        }
        this.tracker.forget(editor.document);
        conflict.commitEdit(typeToAccept, editor);
    }
    dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
    async navigate(editor, direction) {
        let navigationResult = await this.findConflictForNavigation(editor, direction);
        if (!navigationResult) {
            // Check for autoNavigateNextConflict, if it's enabled(which indicating no conflict remain), then do not show warning
            const mergeConflictConfig = vscode.workspace.getConfiguration('merge-conflict');
            if (mergeConflictConfig.get('autoNavigateNextConflict.enabled')) {
                return;
            }
            vscode.window.showWarningMessage(localize('noConflicts', 'No merge conflicts found in this file'));
            return;
        }
        else if (!navigationResult.canNavigate) {
            vscode.window.showWarningMessage(localize('noOtherConflictsInThisFile', 'No other merge conflicts within this file'));
            return;
        }
        else if (!navigationResult.conflict) {
            // TODO: Show error message?
            return;
        }
        // Move the selection to the first line of the conflict
        editor.selection = new vscode.Selection(navigationResult.conflict.range.start, navigationResult.conflict.range.start);
        editor.revealRange(navigationResult.conflict.range, vscode.TextEditorRevealType.Default);
    }
    async accept(type, editor, ...args) {
        let conflict;
        // If launched with known context, take the conflict from that
        if (args[0] === 'known-conflict') {
            conflict = args[1];
        }
        else {
            // Attempt to find a conflict that matches the current cursor position
            conflict = await this.findConflictContainingSelection(editor);
        }
        if (!conflict) {
            vscode.window.showWarningMessage(localize('cursorNotInConflict', 'Editor cursor is not within a merge conflict'));
            return;
        }
        // Tracker can forget as we know we are going to do an edit
        this.tracker.forget(editor.document);
        conflict.commitEdit(type, editor);
        // navigate to the next merge conflict
        const mergeConflictConfig = vscode.workspace.getConfiguration('merge-conflict');
        if (mergeConflictConfig.get('autoNavigateNextConflict.enabled')) {
            this.navigateNext(editor);
        }
    }
    async acceptAll(type, editor) {
        let conflicts = await this.tracker.getConflicts(editor.document);
        if (!conflicts || conflicts.length === 0) {
            vscode.window.showWarningMessage(localize('noConflicts', 'No merge conflicts found in this file'));
            return;
        }
        // For get the current state of the document, as we know we are doing to do a large edit
        this.tracker.forget(editor.document);
        // Apply all changes as one edit
        await editor.edit((edit) => conflicts.forEach(conflict => {
            conflict.applyEdit(type, editor.document, edit);
        }));
    }
    async acceptAllResources(type, resources) {
        const documents = await Promise.all(resources.map(resource => vscode.workspace.openTextDocument(resource)));
        const edit = new vscode.WorkspaceEdit();
        for (const document of documents) {
            const conflicts = await this.tracker.getConflicts(document);
            if (!conflicts || conflicts.length === 0) {
                continue;
            }
            // For get the current state of the document, as we know we are doing to do a large edit
            this.tracker.forget(document);
            // Apply all changes as one edit
            conflicts.forEach(conflict => {
                conflict.applyEdit(type, document, { replace: (range, newText) => edit.replace(document.uri, range, newText) });
            });
        }
        vscode.workspace.applyEdit(edit);
    }
    async findConflictContainingSelection(editor, conflicts) {
        if (!conflicts) {
            conflicts = await this.tracker.getConflicts(editor.document);
        }
        if (!conflicts || conflicts.length === 0) {
            return null;
        }
        for (const conflict of conflicts) {
            if (conflict.range.contains(editor.selection.active)) {
                return conflict;
            }
        }
        return null;
    }
    async findConflictForNavigation(editor, direction, conflicts) {
        if (!conflicts) {
            conflicts = await this.tracker.getConflicts(editor.document);
        }
        if (!conflicts || conflicts.length === 0) {
            return null;
        }
        let selection = editor.selection.active;
        if (conflicts.length === 1) {
            if (conflicts[0].range.contains(selection)) {
                return {
                    canNavigate: false
                };
            }
            return {
                canNavigate: true,
                conflict: conflicts[0]
            };
        }
        let predicate;
        let fallback;
        if (direction === NavigationDirection.Forwards) {
            predicate = (conflict) => selection.isBefore(conflict.range.start);
            fallback = () => conflicts[0];
        }
        else if (direction === NavigationDirection.Backwards) {
            predicate = (conflict) => selection.isAfter(conflict.range.start);
            fallback = () => conflicts[conflicts.length - 1];
        }
        else {
            throw new Error(`Unsupported direction ${direction}`);
        }
        for (const conflict of conflicts) {
            if (predicate(conflict) && !conflict.range.contains(selection)) {
                return {
                    canNavigate: true,
                    conflict: conflict
                };
            }
        }
        // Went all the way to the end, return the head
        return {
            canNavigate: true,
            conflict: fallback()
        };
    }
}
exports.default = CommandHandler;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __webpack_require__(2);
class MergeConflictContentProvider {
    constructor(context) {
        this.context = context;
    }
    begin() {
        this.context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(MergeConflictContentProvider.scheme, this));
    }
    dispose() {
    }
    async provideTextDocumentContent(uri) {
        try {
            const { scheme, ranges } = JSON.parse(uri.query);
            // complete diff
            const document = await vscode.workspace.openTextDocument(uri.with({ scheme, query: '' }));
            let text = '';
            let lastPosition = new vscode.Position(0, 0);
            ranges.forEach(rangeObj => {
                let [conflictRange, fullRange] = rangeObj;
                const [start, end] = conflictRange;
                const [fullStart, fullEnd] = fullRange;
                text += document.getText(new vscode.Range(lastPosition.line, lastPosition.character, fullStart.line, fullStart.character));
                text += document.getText(new vscode.Range(start.line, start.character, end.line, end.character));
                lastPosition = new vscode.Position(fullEnd.line, fullEnd.character);
            });
            let documentEnd = document.lineAt(document.lineCount - 1).range.end;
            text += document.getText(new vscode.Range(lastPosition.line, lastPosition.character, documentEnd.line, documentEnd.character));
            return text;
        }
        catch (ex) {
            await vscode.window.showErrorMessage('Unable to show comparison');
            return null;
        }
    }
}
exports.default = MergeConflictContentProvider;
MergeConflictContentProvider.scheme = 'merge-conflict.conflict-diff';


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __webpack_require__(2);
const vscode_nls_1 = __webpack_require__(8);
const localize = vscode_nls_1.loadMessageBundle();
class MergeDecorator {
    constructor(context, trackerService) {
        this.context = context;
        this.decorations = {};
        this.decorationUsesWholeLine = true; // Useful for debugging, set to false to see exact match ranges
        this.updating = new Map();
        this.tracker = trackerService.createTracker('decorator');
    }
    begin(config) {
        this.config = config;
        this.registerDecorationTypes(config);
        // Check if we already have a set of active windows, attempt to track these.
        vscode.window.visibleTextEditors.forEach(e => this.applyDecorations(e));
        vscode.workspace.onDidOpenTextDocument(event => {
            this.applyDecorationsFromEvent(event);
        }, null, this.context.subscriptions);
        vscode.workspace.onDidChangeTextDocument(event => {
            this.applyDecorationsFromEvent(event.document);
        }, null, this.context.subscriptions);
        vscode.window.onDidChangeVisibleTextEditors((e) => {
            // Any of which could be new (not just the active one).
            e.forEach(e => this.applyDecorations(e));
        }, null, this.context.subscriptions);
    }
    configurationUpdated(config) {
        this.config = config;
        this.registerDecorationTypes(config);
        // Re-apply the decoration
        vscode.window.visibleTextEditors.forEach(e => {
            this.removeDecorations(e);
            this.applyDecorations(e);
        });
    }
    registerDecorationTypes(config) {
        // Dispose of existing decorations
        Object.keys(this.decorations).forEach(k => this.decorations[k].dispose());
        this.decorations = {};
        // None of our features are enabled
        if (!config.enableDecorations || !config.enableEditorOverview) {
            return;
        }
        // Create decorators
        if (config.enableDecorations || config.enableEditorOverview) {
            this.decorations['current.content'] = vscode.window.createTextEditorDecorationType(this.generateBlockRenderOptions('merge.currentContentBackground', 'editorOverviewRuler.currentContentForeground', config));
            this.decorations['incoming.content'] = vscode.window.createTextEditorDecorationType(this.generateBlockRenderOptions('merge.incomingContentBackground', 'editorOverviewRuler.incomingContentForeground', config));
            this.decorations['commonAncestors.content'] = vscode.window.createTextEditorDecorationType(this.generateBlockRenderOptions('merge.commonContentBackground', 'editorOverviewRuler.commonContentForeground', config));
        }
        if (config.enableDecorations) {
            this.decorations['current.header'] = vscode.window.createTextEditorDecorationType({
                isWholeLine: this.decorationUsesWholeLine,
                backgroundColor: new vscode.ThemeColor('merge.currentHeaderBackground'),
                color: new vscode.ThemeColor('editor.foreground'),
                outlineStyle: 'solid',
                outlineWidth: '1pt',
                outlineColor: new vscode.ThemeColor('merge.border'),
                after: {
                    contentText: ' ' + localize('currentChange', '(Current Change)'),
                    color: new vscode.ThemeColor('descriptionForeground')
                }
            });
            this.decorations['commonAncestors.header'] = vscode.window.createTextEditorDecorationType({
                isWholeLine: this.decorationUsesWholeLine,
                backgroundColor: new vscode.ThemeColor('merge.commonHeaderBackground'),
                color: new vscode.ThemeColor('editor.foreground'),
                outlineStyle: 'solid',
                outlineWidth: '1pt',
                outlineColor: new vscode.ThemeColor('merge.border')
            });
            this.decorations['splitter'] = vscode.window.createTextEditorDecorationType({
                color: new vscode.ThemeColor('editor.foreground'),
                outlineStyle: 'solid',
                outlineWidth: '1pt',
                outlineColor: new vscode.ThemeColor('merge.border'),
                isWholeLine: this.decorationUsesWholeLine,
            });
            this.decorations['incoming.header'] = vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor('merge.incomingHeaderBackground'),
                color: new vscode.ThemeColor('editor.foreground'),
                outlineStyle: 'solid',
                outlineWidth: '1pt',
                outlineColor: new vscode.ThemeColor('merge.border'),
                isWholeLine: this.decorationUsesWholeLine,
                after: {
                    contentText: ' ' + localize('incomingChange', '(Incoming Change)'),
                    color: new vscode.ThemeColor('descriptionForeground')
                }
            });
        }
    }
    dispose() {
        // TODO: Replace with Map<string, T>
        Object.keys(this.decorations).forEach(name => {
            this.decorations[name].dispose();
        });
        this.decorations = {};
    }
    generateBlockRenderOptions(backgroundColor, overviewRulerColor, config) {
        let renderOptions = {};
        if (config.enableDecorations) {
            renderOptions.backgroundColor = new vscode.ThemeColor(backgroundColor);
            renderOptions.isWholeLine = this.decorationUsesWholeLine;
        }
        if (config.enableEditorOverview) {
            renderOptions.overviewRulerColor = new vscode.ThemeColor(overviewRulerColor);
            renderOptions.overviewRulerLane = vscode.OverviewRulerLane.Full;
        }
        return renderOptions;
    }
    applyDecorationsFromEvent(eventDocument) {
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document === eventDocument) {
                // Attempt to apply
                this.applyDecorations(editor);
            }
        }
    }
    async applyDecorations(editor) {
        if (!editor || !editor.document) {
            return;
        }
        if (!this.config || (!this.config.enableDecorations && !this.config.enableEditorOverview)) {
            return;
        }
        // If we have a pending scan from the same origin, exit early. (Cannot use this.tracker.isPending() because decorations are per editor.)
        if (this.updating.get(editor)) {
            return;
        }
        try {
            this.updating.set(editor, true);
            let conflicts = await this.tracker.getConflicts(editor.document);
            if (vscode.window.visibleTextEditors.indexOf(editor) === -1) {
                return;
            }
            if (conflicts.length === 0) {
                this.removeDecorations(editor);
                return;
            }
            // Store decorations keyed by the type of decoration, set decoration wants a "style"
            // to go with it, which will match this key (see constructor);
            let matchDecorations = {};
            let pushDecoration = (key, d) => {
                matchDecorations[key] = matchDecorations[key] || [];
                matchDecorations[key].push(d);
            };
            conflicts.forEach(conflict => {
                // TODO, this could be more effective, just call getMatchPositions once with a map of decoration to position
                if (!conflict.current.decoratorContent.isEmpty) {
                    pushDecoration('current.content', conflict.current.decoratorContent);
                }
                if (!conflict.incoming.decoratorContent.isEmpty) {
                    pushDecoration('incoming.content', conflict.incoming.decoratorContent);
                }
                conflict.commonAncestors.forEach(commonAncestorsRegion => {
                    if (!commonAncestorsRegion.decoratorContent.isEmpty) {
                        pushDecoration('commonAncestors.content', commonAncestorsRegion.decoratorContent);
                    }
                });
                if (this.config.enableDecorations) {
                    pushDecoration('current.header', conflict.current.header);
                    pushDecoration('splitter', conflict.splitter);
                    pushDecoration('incoming.header', conflict.incoming.header);
                    conflict.commonAncestors.forEach(commonAncestorsRegion => {
                        pushDecoration('commonAncestors.header', commonAncestorsRegion.header);
                    });
                }
            });
            // For each match we've generated, apply the generated decoration with the matching decoration type to the
            // editor instance. Keys in both matches and decorations should match.
            Object.keys(matchDecorations).forEach(decorationKey => {
                let decorationType = this.decorations[decorationKey];
                if (decorationType) {
                    editor.setDecorations(decorationType, matchDecorations[decorationKey]);
                }
            });
        }
        finally {
            this.updating.delete(editor);
        }
    }
    removeDecorations(editor) {
        // Remove all decorations, there might be none
        Object.keys(this.decorations).forEach(decorationKey => {
            // Race condition, while editing the settings, it's possible to
            // generate regions before the configuration has been refreshed
            let decorationType = this.decorations[decorationKey];
            if (decorationType) {
                editor.setDecorations(decorationType, []);
            }
        });
    }
}
exports.default = MergeDecorator;


/***/ })
/******/ ])));
//# __sourceMappingURL=mergeConflictMain.js.map