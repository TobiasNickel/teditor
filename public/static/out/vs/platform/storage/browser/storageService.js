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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/base/parts/storage/common/storage", "vs/base/common/resources", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/types"], function (require, exports, lifecycle_1, event_1, storage_1, environment_1, files_1, storage_2, resources_1, async_1, buffer_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileStorageDatabase = exports.BrowserStorageService = void 0;
    let BrowserStorageService = class BrowserStorageService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._onWillSaveState = this._register(new event_1.Emitter());
            this.onWillSaveState = this._onWillSaveState.event;
            this.periodicFlushScheduler = this._register(new async_1.RunOnceScheduler(() => this.doFlushWhenIdle(), 5000 /* every 5s */));
            this.runWhenIdleDisposable = undefined;
        }
        initialize(payload) {
            if (!this.initializePromise) {
                this.initializePromise = this.doInitialize(payload);
            }
            return this.initializePromise;
        }
        async doInitialize(payload) {
            // Ensure state folder exists
            const stateRoot = resources_1.joinPath(this.environmentService.userRoamingDataHome, 'state');
            await this.fileService.createFolder(stateRoot);
            // Workspace Storage
            this.workspaceStorageFile = resources_1.joinPath(stateRoot, `${payload.id}.json`);
            this.workspaceStorageDatabase = this._register(new FileStorageDatabase(this.workspaceStorageFile, false /* do not watch for external changes */, this.fileService));
            this.workspaceStorage = this._register(new storage_2.Storage(this.workspaceStorageDatabase));
            this._register(this.workspaceStorage.onDidChangeStorage(key => this._onDidChangeStorage.fire({ key, scope: 1 /* WORKSPACE */ })));
            // Global Storage
            this.globalStorageFile = resources_1.joinPath(stateRoot, 'global.json');
            this.globalStorageDatabase = this._register(new FileStorageDatabase(this.globalStorageFile, true /* watch for external changes */, this.fileService));
            this.globalStorage = this._register(new storage_2.Storage(this.globalStorageDatabase));
            this._register(this.globalStorage.onDidChangeStorage(key => this._onDidChangeStorage.fire({ key, scope: 0 /* GLOBAL */ })));
            // Init both
            await Promise.all([
                this.workspaceStorage.init(),
                this.globalStorage.init()
            ]);
            // Check to see if this is the first time we are "opening" this workspace
            const firstOpen = this.workspaceStorage.getBoolean(storage_1.WorkspaceStorageSettings.WORKSPACE_FIRST_OPEN);
            if (firstOpen === undefined) {
                // NOTE@eamodio We can't reliably check to see if a workspace was added before this setting was introduced, so just pretend it is the first time
                this.workspaceStorage.set(storage_1.WorkspaceStorageSettings.WORKSPACE_FIRST_OPEN, true);
            }
            else if (firstOpen) {
                this.workspaceStorage.set(storage_1.WorkspaceStorageSettings.WORKSPACE_FIRST_OPEN, false);
            }
            // In the browser we do not have support for long running unload sequences. As such,
            // we cannot ask for saving state in that moment, because that would result in a
            // long running operation.
            // Instead, periodically ask customers to save save. The library will be clever enough
            // to only save state that has actually changed.
            this.periodicFlushScheduler.schedule();
        }
        get(key, scope, fallbackValue) {
            return this.getStorage(scope).get(key, fallbackValue);
        }
        getBoolean(key, scope, fallbackValue) {
            return this.getStorage(scope).getBoolean(key, fallbackValue);
        }
        getNumber(key, scope, fallbackValue) {
            return this.getStorage(scope).getNumber(key, fallbackValue);
        }
        store(key, value, scope) {
            this.getStorage(scope).set(key, value);
        }
        remove(key, scope) {
            this.getStorage(scope).delete(key);
        }
        getStorage(scope) {
            return types_1.assertIsDefined(scope === 0 /* GLOBAL */ ? this.globalStorage : this.workspaceStorage);
        }
        async logStorage() {
            const [globalStorage, workspaceStorage, globalStorageFile, workspaceStorageFile] = types_1.assertAllDefined(this.globalStorage, this.workspaceStorage, this.globalStorageFile, this.workspaceStorageFile);
            const result = await Promise.all([
                globalStorage.items,
                workspaceStorage.items
            ]);
            return storage_1.logStorage(result[0], result[1], globalStorageFile.toString(), workspaceStorageFile.toString());
        }
        async migrate(toWorkspace) {
            throw new Error('Migrating storage is currently unsupported in Web');
        }
        doFlushWhenIdle() {
            // Dispose any previous idle runner
            lifecycle_1.dispose(this.runWhenIdleDisposable);
            // Run when idle
            this.runWhenIdleDisposable = async_1.runWhenIdle(() => {
                // this event will potentially cause new state to be stored
                // since new state will only be created while the document
                // has focus, one optimization is to not run this when the
                // document has no focus, assuming that state has not changed
                //
                // another optimization is to not collect more state if we
                // have a pending update already running which indicates
                // that the connection is either slow or disconnected and
                // thus unhealthy.
                if (document.hasFocus() && !this.hasPendingUpdate) {
                    this.flush();
                }
                // repeat
                this.periodicFlushScheduler.schedule();
            });
        }
        get hasPendingUpdate() {
            return (!!this.globalStorageDatabase && this.globalStorageDatabase.hasPendingUpdate) || (!!this.workspaceStorageDatabase && this.workspaceStorageDatabase.hasPendingUpdate);
        }
        flush() {
            this._onWillSaveState.fire({ reason: storage_1.WillSaveStateReason.NONE });
        }
        close() {
            // We explicitly do not close our DBs because writing data onBeforeUnload()
            // can result in unexpected results. Namely, it seems that - even though this
            // operation is async - sometimes it is being triggered on unload and
            // succeeds. Often though, the DBs turn out to be empty because the write
            // never had a chance to complete.
            //
            // Instead we trigger dispose() to ensure that no timeouts or callbacks
            // get triggered in this phase.
            this.dispose();
        }
        dispose() {
            lifecycle_1.dispose(this.runWhenIdleDisposable);
            this.runWhenIdleDisposable = undefined;
            super.dispose();
        }
    };
    BrowserStorageService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService)
    ], BrowserStorageService);
    exports.BrowserStorageService = BrowserStorageService;
    let FileStorageDatabase = class FileStorageDatabase extends lifecycle_1.Disposable {
        constructor(file, watchForExternalChanges, fileService) {
            super();
            this.file = file;
            this.watchForExternalChanges = watchForExternalChanges;
            this.fileService = fileService;
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.pendingUpdate = Promise.resolve();
            this._hasPendingUpdate = false;
            this.isWatching = false;
        }
        get hasPendingUpdate() {
            return this._hasPendingUpdate;
        }
        async ensureWatching() {
            if (this.isWatching || !this.watchForExternalChanges) {
                return;
            }
            const exists = await this.fileService.exists(this.file);
            if (this.isWatching || !exists) {
                return; // file must exist to be watched
            }
            this.isWatching = true;
            this._register(this.fileService.watch(this.file));
            this._register(this.fileService.onDidFilesChange(e => {
                if (document.hasFocus()) {
                    return; // optimization: ignore changes from ourselves by checking for focus
                }
                if (!e.contains(this.file, 0 /* UPDATED */)) {
                    return; // not our file
                }
                this.onDidStorageChangeExternal();
            }));
        }
        async onDidStorageChangeExternal() {
            const items = await this.doGetItemsFromFile();
            // pervious cache, diff for changes
            let changed = new Map();
            let deleted = new Set();
            if (this.cache) {
                items.forEach((value, key) => {
                    var _a;
                    const existingValue = (_a = this.cache) === null || _a === void 0 ? void 0 : _a.get(key);
                    if (existingValue !== value) {
                        changed.set(key, value);
                    }
                });
                this.cache.forEach((_, key) => {
                    if (!items.has(key)) {
                        deleted.add(key);
                    }
                });
            }
            // no previous cache, consider all as changed
            else {
                changed = items;
            }
            // Update cache
            this.cache = items;
            // Emit as event as needed
            if (changed.size > 0 || deleted.size > 0) {
                this._onDidChangeItemsExternal.fire({ changed, deleted });
            }
        }
        async getItems() {
            if (!this.cache) {
                try {
                    this.cache = await this.doGetItemsFromFile();
                }
                catch (error) {
                    this.cache = new Map();
                }
            }
            return this.cache;
        }
        async doGetItemsFromFile() {
            await this.pendingUpdate;
            const itemsRaw = await this.fileService.readFile(this.file);
            this.ensureWatching(); // now that the file must exist, ensure we watch it for changes
            return new Map(JSON.parse(itemsRaw.value.toString()));
        }
        async updateItems(request) {
            const items = await this.getItems();
            if (request.insert) {
                request.insert.forEach((value, key) => items.set(key, value));
            }
            if (request.delete) {
                request.delete.forEach(key => items.delete(key));
            }
            await this.pendingUpdate;
            this.pendingUpdate = (async () => {
                try {
                    this._hasPendingUpdate = true;
                    await this.fileService.writeFile(this.file, buffer_1.VSBuffer.fromString(JSON.stringify(Array.from(items.entries()))));
                    this.ensureWatching(); // now that the file must exist, ensure we watch it for changes
                }
                finally {
                    this._hasPendingUpdate = false;
                }
            })();
            return this.pendingUpdate;
        }
        close() {
            return this.pendingUpdate;
        }
    };
    FileStorageDatabase = __decorate([
        __param(2, files_1.IFileService)
    ], FileStorageDatabase);
    exports.FileStorageDatabase = FileStorageDatabase;
});
//# __sourceMappingURL=storageService.js.map