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
define(["require", "exports", "vs/workbench/services/uriIdentity/common/uriIdentity", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/skipList", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, uriIdentity_1, extensions_1, files_1, resources_1, skipList_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UriIdentityService = void 0;
    class Entry {
        constructor(uri) {
            this.uri = uri;
            this.time = Entry._clock++;
        }
        touch() {
            this.time = Entry._clock++;
            return this;
        }
    }
    Entry._clock = 0;
    let UriIdentityService = class UriIdentityService {
        constructor(_fileService) {
            this._fileService = _fileService;
            this._dispooables = new lifecycle_1.DisposableStore();
            this._limit = 2 ** 16;
            const schemeIgnoresPathCasingCache = new Map();
            // assume path casing matters unless the file system provider spec'ed the opposite.
            // for all other cases path casing matters, e.g for
            // * virtual documents
            // * in-memory uris
            // * all kind of "private" schemes
            const ignorePathCasing = (uri) => {
                let ignorePathCasing = schemeIgnoresPathCasingCache.get(uri.scheme);
                if (ignorePathCasing === undefined) {
                    // retrieve once and then case per scheme until a change happens
                    ignorePathCasing = _fileService.canHandleResource(uri) && !this._fileService.hasCapability(uri, 1024 /* PathCaseSensitive */);
                    schemeIgnoresPathCasingCache.set(uri.scheme, ignorePathCasing);
                }
                return ignorePathCasing;
            };
            this._dispooables.add(event_1.Event.any(_fileService.onDidChangeFileSystemProviderRegistrations, _fileService.onDidChangeFileSystemProviderCapabilities)(e => {
                // remove from cache
                schemeIgnoresPathCasingCache.delete(e.scheme);
            }));
            this.extUri = new resources_1.ExtUri(ignorePathCasing);
            this._canonicalUris = new skipList_1.SkipList((a, b) => this.extUri.compare(a, b, true), this._limit);
        }
        dispose() {
            this._dispooables.dispose();
            this._canonicalUris.clear();
        }
        asCanonicalUri(uri) {
            // (1) normalize URI
            if (this._fileService.canHandleResource(uri)) {
                uri = resources_1.normalizePath(uri);
            }
            // (2) find the uri in its canonical form or use this uri to define it
            let item = this._canonicalUris.get(uri);
            if (item) {
                return item.touch().uri.with({ fragment: uri.fragment });
            }
            // this uri is first and defines the canonical form
            this._canonicalUris.set(uri, new Entry(uri));
            this._checkTrim();
            return uri;
        }
        _checkTrim() {
            if (this._canonicalUris.size < this._limit) {
                return;
            }
            // get all entries, sort by touch (MRU) and re-initalize
            // the uri cache and the entry clock. this is an expensive
            // operation and should happen rarely
            const entries = [...this._canonicalUris.entries()].sort((a, b) => {
                if (a[1].touch < b[1].touch) {
                    return 1;
                }
                else if (a[1].touch > b[1].touch) {
                    return -1;
                }
                else {
                    return 0;
                }
            });
            Entry._clock = 0;
            this._canonicalUris.clear();
            const newSize = this._limit * 0.5;
            for (let i = 0; i < newSize; i++) {
                this._canonicalUris.set(entries[i][0], entries[i][1].touch());
            }
        }
    };
    UriIdentityService = __decorate([
        __param(0, files_1.IFileService)
    ], UriIdentityService);
    exports.UriIdentityService = UriIdentityService;
    extensions_1.registerSingleton(uriIdentity_1.IUriIdentityService, UriIdentityService, true);
});
//# __sourceMappingURL=uriIdentityService.js.map