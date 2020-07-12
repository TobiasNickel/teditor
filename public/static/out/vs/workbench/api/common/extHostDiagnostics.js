/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/platform/markers/common/markers", "vs/base/common/uri", "./extHost.protocol", "./extHostTypes", "./extHostTypeConverters", "vs/base/common/arrays", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/map"], function (require, exports, nls_1, markers_1, uri_1, extHost_protocol_1, extHostTypes_1, converter, arrays_1, event_1, log_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDiagnostics = exports.DiagnosticCollection = void 0;
    class DiagnosticCollection {
        constructor(_name, _owner, _maxDiagnosticsPerFile, _proxy, _onDidChangeDiagnostics) {
            this._name = _name;
            this._owner = _owner;
            this._maxDiagnosticsPerFile = _maxDiagnosticsPerFile;
            this._proxy = _proxy;
            this._onDidChangeDiagnostics = _onDidChangeDiagnostics;
            this._isDisposed = false;
            this._data = new map_1.ResourceMap();
        }
        dispose() {
            if (!this._isDisposed) {
                this._onDidChangeDiagnostics.fire([...this._data.keys()]);
                if (this._proxy) {
                    this._proxy.$clear(this._owner);
                }
                this._data = undefined;
                this._isDisposed = true;
            }
        }
        get name() {
            this._checkDisposed();
            return this._name;
        }
        set(first, diagnostics) {
            if (!first) {
                // this set-call is a clear-call
                this.clear();
                return;
            }
            // the actual implementation for #set
            this._checkDisposed();
            let toSync = [];
            if (uri_1.URI.isUri(first)) {
                if (!diagnostics) {
                    // remove this entry
                    this.delete(first);
                    return;
                }
                // update single row
                this._data.set(first, diagnostics.slice());
                toSync = [first];
            }
            else if (Array.isArray(first)) {
                // update many rows
                toSync = [];
                let lastUri;
                // ensure stable-sort
                arrays_1.mergeSort(first, DiagnosticCollection._compareIndexedTuplesByUri);
                for (const tuple of first) {
                    const [uri, diagnostics] = tuple;
                    if (!lastUri || uri.toString() !== lastUri.toString()) {
                        if (lastUri && this._data.get(lastUri).length === 0) {
                            this._data.delete(lastUri);
                        }
                        lastUri = uri;
                        toSync.push(uri);
                        this._data.set(uri.toString(), []);
                    }
                    if (!diagnostics) {
                        // [Uri, undefined] means clear this
                        const currentDiagnostics = this._data.get(uri.toString());
                        if (currentDiagnostics) {
                            currentDiagnostics.length = 0;
                        }
                    }
                    else {
                        const currentDiagnostics = this._data.get(uri.toString());
                        if (currentDiagnostics) {
                            currentDiagnostics.push(...diagnostics);
                        }
                    }
                }
            }
            // send event for extensions
            this._onDidChangeDiagnostics.fire(toSync);
            // compute change and send to main side
            if (!this._proxy) {
                return;
            }
            const entries = [];
            for (let uri of toSync) {
                let marker = [];
                const diagnostics = this._data.get(uri);
                if (diagnostics) {
                    // no more than N diagnostics per file
                    if (diagnostics.length > this._maxDiagnosticsPerFile) {
                        marker = [];
                        const order = [extHostTypes_1.DiagnosticSeverity.Error, extHostTypes_1.DiagnosticSeverity.Warning, extHostTypes_1.DiagnosticSeverity.Information, extHostTypes_1.DiagnosticSeverity.Hint];
                        orderLoop: for (let i = 0; i < 4; i++) {
                            for (let diagnostic of diagnostics) {
                                if (diagnostic.severity === order[i]) {
                                    const len = marker.push(converter.Diagnostic.from(diagnostic));
                                    if (len === this._maxDiagnosticsPerFile) {
                                        break orderLoop;
                                    }
                                }
                            }
                        }
                        // add 'signal' marker for showing omitted errors/warnings
                        marker.push({
                            severity: markers_1.MarkerSeverity.Info,
                            message: nls_1.localize({ key: 'limitHit', comment: ['amount of errors/warning skipped due to limits'] }, "Not showing {0} further errors and warnings.", diagnostics.length - this._maxDiagnosticsPerFile),
                            startLineNumber: marker[marker.length - 1].startLineNumber,
                            startColumn: marker[marker.length - 1].startColumn,
                            endLineNumber: marker[marker.length - 1].endLineNumber,
                            endColumn: marker[marker.length - 1].endColumn
                        });
                    }
                    else {
                        marker = diagnostics.map(diag => converter.Diagnostic.from(diag));
                    }
                }
                entries.push([uri, marker]);
            }
            this._proxy.$changeMany(this._owner, entries);
        }
        delete(uri) {
            this._checkDisposed();
            this._onDidChangeDiagnostics.fire([uri]);
            this._data.delete(uri);
            if (this._proxy) {
                this._proxy.$changeMany(this._owner, [[uri, undefined]]);
            }
        }
        clear() {
            this._checkDisposed();
            this._onDidChangeDiagnostics.fire([...this._data.keys()]);
            this._data.clear();
            if (this._proxy) {
                this._proxy.$clear(this._owner);
            }
        }
        forEach(callback, thisArg) {
            this._checkDisposed();
            for (let uri of this._data.keys()) {
                callback.apply(thisArg, [uri, this.get(uri), this]);
            }
        }
        get(uri) {
            this._checkDisposed();
            const result = this._data.get(uri);
            if (Array.isArray(result)) {
                return Object.freeze(result.slice(0));
            }
            return [];
        }
        has(uri) {
            this._checkDisposed();
            return Array.isArray(this._data.get(uri));
        }
        _checkDisposed() {
            if (this._isDisposed) {
                throw new Error('illegal state - object is disposed');
            }
        }
        static _compareIndexedTuplesByUri(a, b) {
            if (a[0].toString() < b[0].toString()) {
                return -1;
            }
            else if (a[0].toString() > b[0].toString()) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }
    exports.DiagnosticCollection = DiagnosticCollection;
    let ExtHostDiagnostics = class ExtHostDiagnostics {
        constructor(mainContext, _logService) {
            this._logService = _logService;
            this._collections = new Map();
            this._onDidChangeDiagnostics = new event_1.Emitter();
            this.onDidChangeDiagnostics = event_1.Event.map(event_1.Event.debounce(this._onDidChangeDiagnostics.event, ExtHostDiagnostics._debouncer, 50), ExtHostDiagnostics._mapper);
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDiagnostics);
        }
        static _debouncer(last, current) {
            if (!last) {
                return current;
            }
            else {
                return last.concat(current);
            }
        }
        static _mapper(last) {
            const uris = [];
            const map = new Set();
            for (const uri of last) {
                if (typeof uri === 'string') {
                    if (!map.has(uri)) {
                        map.add(uri);
                        uris.push(uri_1.URI.parse(uri));
                    }
                }
                else {
                    if (!map.has(uri.toString())) {
                        map.add(uri.toString());
                        uris.push(uri);
                    }
                }
            }
            Object.freeze(uris);
            return { uris };
        }
        createDiagnosticCollection(extensionId, name) {
            const { _collections, _proxy, _onDidChangeDiagnostics, _logService } = this;
            const loggingProxy = new class {
                $changeMany(owner, entries) {
                    _proxy.$changeMany(owner, entries);
                    _logService.trace('[DiagnosticCollection] change many (extension, owner, uris)', extensionId.value, owner, entries.length === 0 ? 'CLEARING' : entries);
                }
                $clear(owner) {
                    _proxy.$clear(owner);
                    _logService.trace('[DiagnosticCollection] remove all (extension, owner)', extensionId.value, owner);
                }
                dispose() {
                    _proxy.dispose();
                }
            };
            let owner;
            if (!name) {
                name = '_generated_diagnostic_collection_name_#' + ExtHostDiagnostics._idPool++;
                owner = name;
            }
            else if (!_collections.has(name)) {
                owner = name;
            }
            else {
                this._logService.warn(`DiagnosticCollection with name '${name}' does already exist.`);
                do {
                    owner = name + ExtHostDiagnostics._idPool++;
                } while (_collections.has(owner));
            }
            const result = new class extends DiagnosticCollection {
                constructor() {
                    super(name, owner, ExtHostDiagnostics._maxDiagnosticsPerFile, loggingProxy, _onDidChangeDiagnostics);
                    _collections.set(owner, this);
                }
                dispose() {
                    super.dispose();
                    _collections.delete(owner);
                }
            };
            return result;
        }
        getDiagnostics(resource) {
            if (resource) {
                return this._getDiagnostics(resource);
            }
            else {
                const index = new Map();
                const res = [];
                for (const collection of this._collections.values()) {
                    collection.forEach((uri, diagnostics) => {
                        let idx = index.get(uri.toString());
                        if (typeof idx === 'undefined') {
                            idx = res.length;
                            index.set(uri.toString(), idx);
                            res.push([uri, []]);
                        }
                        res[idx][1] = res[idx][1].concat(...diagnostics);
                    });
                }
                return res;
            }
        }
        _getDiagnostics(resource) {
            let res = [];
            for (let collection of this._collections.values()) {
                if (collection.has(resource)) {
                    res = res.concat(collection.get(resource));
                }
            }
            return res;
        }
        $acceptMarkersChange(data) {
            if (!this._mirrorCollection) {
                const name = '_generated_mirror';
                const collection = new DiagnosticCollection(name, name, ExtHostDiagnostics._maxDiagnosticsPerFile, undefined, this._onDidChangeDiagnostics);
                this._collections.set(name, collection);
                this._mirrorCollection = collection;
            }
            for (const [uri, markers] of data) {
                this._mirrorCollection.set(uri_1.URI.revive(uri), markers.map(converter.Diagnostic.to));
            }
        }
    };
    ExtHostDiagnostics._idPool = 0;
    ExtHostDiagnostics._maxDiagnosticsPerFile = 1000;
    ExtHostDiagnostics = __decorate([
        __param(1, log_1.ILogService)
    ], ExtHostDiagnostics);
    exports.ExtHostDiagnostics = ExtHostDiagnostics;
});
//# __sourceMappingURL=extHostDiagnostics.js.map