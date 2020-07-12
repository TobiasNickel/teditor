/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/idGenerator", "vs/base/common/objects"], function (require, exports, idGenerator_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileQueryCacheState = void 0;
    var LoadingPhase;
    (function (LoadingPhase) {
        LoadingPhase[LoadingPhase["Created"] = 1] = "Created";
        LoadingPhase[LoadingPhase["Loading"] = 2] = "Loading";
        LoadingPhase[LoadingPhase["Loaded"] = 3] = "Loaded";
        LoadingPhase[LoadingPhase["Errored"] = 4] = "Errored";
        LoadingPhase[LoadingPhase["Disposed"] = 5] = "Disposed";
    })(LoadingPhase || (LoadingPhase = {}));
    class FileQueryCacheState {
        constructor(cacheQuery, loadFn, disposeFn, previousCacheState) {
            this.cacheQuery = cacheQuery;
            this.loadFn = loadFn;
            this.disposeFn = disposeFn;
            this.previousCacheState = previousCacheState;
            this._cacheKey = idGenerator_1.defaultGenerator.nextId();
            this.query = this.cacheQuery(this._cacheKey);
            this.loadingPhase = LoadingPhase.Created;
            if (this.previousCacheState) {
                const current = objects_1.assign({}, this.query, { cacheKey: null });
                const previous = objects_1.assign({}, this.previousCacheState.query, { cacheKey: null });
                if (!objects_1.equals(current, previous)) {
                    this.previousCacheState.dispose();
                    this.previousCacheState = undefined;
                }
            }
        }
        get cacheKey() {
            if (this.loadingPhase === LoadingPhase.Loaded || !this.previousCacheState) {
                return this._cacheKey;
            }
            return this.previousCacheState.cacheKey;
        }
        get isLoaded() {
            const isLoaded = this.loadingPhase === LoadingPhase.Loaded;
            return isLoaded || !this.previousCacheState ? isLoaded : this.previousCacheState.isLoaded;
        }
        get isUpdating() {
            const isUpdating = this.loadingPhase === LoadingPhase.Loading;
            return isUpdating || !this.previousCacheState ? isUpdating : this.previousCacheState.isUpdating;
        }
        load() {
            if (this.isUpdating) {
                return this;
            }
            this.loadingPhase = LoadingPhase.Loading;
            this.loadPromise = (async () => {
                try {
                    await this.loadFn(this.query);
                    this.loadingPhase = LoadingPhase.Loaded;
                    if (this.previousCacheState) {
                        this.previousCacheState.dispose();
                        this.previousCacheState = undefined;
                    }
                }
                catch (error) {
                    this.loadingPhase = LoadingPhase.Errored;
                    throw error;
                }
            })();
            return this;
        }
        dispose() {
            if (this.loadPromise) {
                (async () => {
                    try {
                        await this.loadPromise;
                    }
                    catch (error) {
                        // ignore
                    }
                    this.loadingPhase = LoadingPhase.Disposed;
                    this.disposeFn(this._cacheKey);
                })();
            }
            else {
                this.loadingPhase = LoadingPhase.Disposed;
            }
            if (this.previousCacheState) {
                this.previousCacheState.dispose();
                this.previousCacheState = undefined;
            }
        }
    }
    exports.FileQueryCacheState = FileQueryCacheState;
});
//# __sourceMappingURL=cacheState.js.map