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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/editor/contrib/codelens/codelens", "vs/base/common/map", "vs/platform/storage/common/storage", "vs/editor/common/core/range", "vs/base/common/async", "vs/base/common/functional"], function (require, exports, instantiation_1, extensions_1, codelens_1, map_1, storage_1, range_1, async_1, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensCache = exports.ICodeLensCache = void 0;
    exports.ICodeLensCache = instantiation_1.createDecorator('ICodeLensCache');
    class CacheItem {
        constructor(lineCount, data) {
            this.lineCount = lineCount;
            this.data = data;
        }
    }
    let CodeLensCache = class CodeLensCache {
        constructor(storageService) {
            this._fakeProvider = new class {
                provideCodeLenses() {
                    throw new Error('not supported');
                }
            };
            this._cache = new map_1.LRUCache(20, 0.75);
            // remove old data
            const oldkey = 'codelens/cache';
            async_1.runWhenIdle(() => storageService.remove(oldkey, 1 /* WORKSPACE */));
            // restore lens data on start
            const key = 'codelens/cache2';
            const raw = storageService.get(key, 1 /* WORKSPACE */, '{}');
            this._deserialize(raw);
            // store lens data on shutdown
            functional_1.once(storageService.onWillSaveState)(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    storageService.store(key, this._serialize(), 1 /* WORKSPACE */);
                }
            });
        }
        put(model, data) {
            // create a copy of the model that is without command-ids
            // but with comand-labels
            const copyItems = data.lenses.map(item => {
                var _a;
                return {
                    range: item.symbol.range,
                    command: item.symbol.command && { id: '', title: (_a = item.symbol.command) === null || _a === void 0 ? void 0 : _a.title },
                };
            });
            const copyModel = new codelens_1.CodeLensModel();
            copyModel.add({ lenses: copyItems, dispose: () => { } }, this._fakeProvider);
            const item = new CacheItem(model.getLineCount(), copyModel);
            this._cache.set(model.uri.toString(), item);
        }
        get(model) {
            const item = this._cache.get(model.uri.toString());
            return item && item.lineCount === model.getLineCount() ? item.data : undefined;
        }
        delete(model) {
            this._cache.delete(model.uri.toString());
        }
        // --- persistence
        _serialize() {
            const data = Object.create(null);
            for (const [key, value] of this._cache) {
                const lines = new Set();
                for (const d of value.data.lenses) {
                    lines.add(d.symbol.range.startLineNumber);
                }
                data[key] = {
                    lineCount: value.lineCount,
                    lines: [...lines.values()]
                };
            }
            return JSON.stringify(data);
        }
        _deserialize(raw) {
            try {
                const data = JSON.parse(raw);
                for (const key in data) {
                    const element = data[key];
                    const lenses = [];
                    for (const line of element.lines) {
                        lenses.push({ range: new range_1.Range(line, 1, line, 11) });
                    }
                    const model = new codelens_1.CodeLensModel();
                    model.add({ lenses, dispose() { } }, this._fakeProvider);
                    this._cache.set(key, new CacheItem(element.lineCount, model));
                }
            }
            catch (_a) {
                // ignore...
            }
        }
    };
    CodeLensCache = __decorate([
        __param(0, storage_1.IStorageService)
    ], CodeLensCache);
    exports.CodeLensCache = CodeLensCache;
    extensions_1.registerSingleton(exports.ICodeLensCache, CodeLensCache);
});
//# __sourceMappingURL=codeLensCache.js.map