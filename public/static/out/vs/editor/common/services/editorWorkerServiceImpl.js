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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/worker/simpleWorker", "vs/base/worker/defaultWorkerFactory", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/common/services/editorSimpleWorker", "vs/editor/common/services/modelService", "vs/editor/common/services/textResourceConfigurationService", "vs/base/common/strings", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/stopwatch"], function (require, exports, async_1, lifecycle_1, simpleWorker_1, defaultWorkerFactory_1, range_1, modes, languageConfigurationRegistry_1, editorSimpleWorker_1, modelService_1, textResourceConfigurationService_1, strings_1, arrays_1, log_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorWorkerClient = exports.EditorWorkerHost = exports.EditorWorkerServiceImpl = void 0;
    /**
     * Stop syncing a model to the worker if it was not needed for 1 min.
     */
    const STOP_SYNC_MODEL_DELTA_TIME_MS = 60 * 1000;
    /**
     * Stop the worker if it was not needed for 5 min.
     */
    const STOP_WORKER_DELTA_TIME_MS = 5 * 60 * 1000;
    function canSyncModel(modelService, resource) {
        let model = modelService.getModel(resource);
        if (!model) {
            return false;
        }
        if (model.isTooLargeForSyncing()) {
            return false;
        }
        return true;
    }
    let EditorWorkerServiceImpl = class EditorWorkerServiceImpl extends lifecycle_1.Disposable {
        constructor(modelService, configurationService, logService) {
            super();
            this._modelService = modelService;
            this._workerManager = this._register(new WorkerManager(this._modelService));
            this._logService = logService;
            // register default link-provider and default completions-provider
            this._register(modes.LinkProviderRegistry.register('*', {
                provideLinks: (model, token) => {
                    if (!canSyncModel(this._modelService, model.uri)) {
                        return Promise.resolve({ links: [] }); // File too large
                    }
                    return this._workerManager.withWorker().then(client => client.computeLinks(model.uri)).then(links => {
                        return links && { links };
                    });
                }
            }));
            this._register(modes.CompletionProviderRegistry.register('*', new WordBasedCompletionItemProvider(this._workerManager, configurationService, this._modelService)));
        }
        dispose() {
            super.dispose();
        }
        canComputeDiff(original, modified) {
            return (canSyncModel(this._modelService, original) && canSyncModel(this._modelService, modified));
        }
        computeDiff(original, modified, ignoreTrimWhitespace, maxComputationTime) {
            return this._workerManager.withWorker().then(client => client.computeDiff(original, modified, ignoreTrimWhitespace, maxComputationTime));
        }
        canComputeDirtyDiff(original, modified) {
            return (canSyncModel(this._modelService, original) && canSyncModel(this._modelService, modified));
        }
        computeDirtyDiff(original, modified, ignoreTrimWhitespace) {
            return this._workerManager.withWorker().then(client => client.computeDirtyDiff(original, modified, ignoreTrimWhitespace));
        }
        computeMoreMinimalEdits(resource, edits) {
            if (arrays_1.isNonEmptyArray(edits)) {
                if (!canSyncModel(this._modelService, resource)) {
                    return Promise.resolve(edits); // File too large
                }
                const sw = stopwatch_1.StopWatch.create(true);
                const result = this._workerManager.withWorker().then(client => client.computeMoreMinimalEdits(resource, edits));
                result.finally(() => this._logService.trace('FORMAT#computeMoreMinimalEdits', resource.toString(true), sw.elapsed()));
                return result;
            }
            else {
                return Promise.resolve(undefined);
            }
        }
        canNavigateValueSet(resource) {
            return (canSyncModel(this._modelService, resource));
        }
        navigateValueSet(resource, range, up) {
            return this._workerManager.withWorker().then(client => client.navigateValueSet(resource, range, up));
        }
        canComputeWordRanges(resource) {
            return canSyncModel(this._modelService, resource);
        }
        computeWordRanges(resource, range) {
            return this._workerManager.withWorker().then(client => client.computeWordRanges(resource, range));
        }
    };
    EditorWorkerServiceImpl = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(2, log_1.ILogService)
    ], EditorWorkerServiceImpl);
    exports.EditorWorkerServiceImpl = EditorWorkerServiceImpl;
    class WordBasedCompletionItemProvider {
        constructor(workerManager, configurationService, modelService) {
            this._debugDisplayName = 'wordbasedCompletions';
            this._workerManager = workerManager;
            this._configurationService = configurationService;
            this._modelService = modelService;
        }
        async provideCompletionItems(model, position) {
            const { wordBasedSuggestions } = this._configurationService.getValue(model.uri, position, 'editor');
            if (!wordBasedSuggestions) {
                return undefined;
            }
            if (!canSyncModel(this._modelService, model.uri)) {
                return undefined; // File too large
            }
            const word = model.getWordAtPosition(position);
            const replace = !word ? range_1.Range.fromPositions(position) : new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
            const insert = replace.setEndPosition(position.lineNumber, position.column);
            const client = await this._workerManager.withWorker();
            const words = await client.textualSuggest(model.uri, position);
            if (!words) {
                return undefined;
            }
            return {
                suggestions: words.map((word) => {
                    return {
                        kind: 18 /* Text */,
                        label: word,
                        insertText: word,
                        range: { insert, replace }
                    };
                })
            };
        }
    }
    class WorkerManager extends lifecycle_1.Disposable {
        constructor(modelService) {
            super();
            this._modelService = modelService;
            this._editorWorkerClient = null;
            this._lastWorkerUsedTime = (new Date()).getTime();
            let stopWorkerInterval = this._register(new async_1.IntervalTimer());
            stopWorkerInterval.cancelAndSet(() => this._checkStopIdleWorker(), Math.round(STOP_WORKER_DELTA_TIME_MS / 2));
            this._register(this._modelService.onModelRemoved(_ => this._checkStopEmptyWorker()));
        }
        dispose() {
            if (this._editorWorkerClient) {
                this._editorWorkerClient.dispose();
                this._editorWorkerClient = null;
            }
            super.dispose();
        }
        /**
         * Check if the model service has no more models and stop the worker if that is the case.
         */
        _checkStopEmptyWorker() {
            if (!this._editorWorkerClient) {
                return;
            }
            let models = this._modelService.getModels();
            if (models.length === 0) {
                // There are no more models => nothing possible for me to do
                this._editorWorkerClient.dispose();
                this._editorWorkerClient = null;
            }
        }
        /**
         * Check if the worker has been idle for a while and then stop it.
         */
        _checkStopIdleWorker() {
            if (!this._editorWorkerClient) {
                return;
            }
            let timeSinceLastWorkerUsedTime = (new Date()).getTime() - this._lastWorkerUsedTime;
            if (timeSinceLastWorkerUsedTime > STOP_WORKER_DELTA_TIME_MS) {
                this._editorWorkerClient.dispose();
                this._editorWorkerClient = null;
            }
        }
        withWorker() {
            this._lastWorkerUsedTime = (new Date()).getTime();
            if (!this._editorWorkerClient) {
                this._editorWorkerClient = new EditorWorkerClient(this._modelService, false, 'editorWorkerService');
            }
            return Promise.resolve(this._editorWorkerClient);
        }
    }
    class EditorModelManager extends lifecycle_1.Disposable {
        constructor(proxy, modelService, keepIdleModels) {
            super();
            this._syncedModels = Object.create(null);
            this._syncedModelsLastUsedTime = Object.create(null);
            this._proxy = proxy;
            this._modelService = modelService;
            if (!keepIdleModels) {
                let timer = new async_1.IntervalTimer();
                timer.cancelAndSet(() => this._checkStopModelSync(), Math.round(STOP_SYNC_MODEL_DELTA_TIME_MS / 2));
                this._register(timer);
            }
        }
        dispose() {
            for (let modelUrl in this._syncedModels) {
                lifecycle_1.dispose(this._syncedModels[modelUrl]);
            }
            this._syncedModels = Object.create(null);
            this._syncedModelsLastUsedTime = Object.create(null);
            super.dispose();
        }
        ensureSyncedResources(resources) {
            for (const resource of resources) {
                let resourceStr = resource.toString();
                if (!this._syncedModels[resourceStr]) {
                    this._beginModelSync(resource);
                }
                if (this._syncedModels[resourceStr]) {
                    this._syncedModelsLastUsedTime[resourceStr] = (new Date()).getTime();
                }
            }
        }
        _checkStopModelSync() {
            let currentTime = (new Date()).getTime();
            let toRemove = [];
            for (let modelUrl in this._syncedModelsLastUsedTime) {
                let elapsedTime = currentTime - this._syncedModelsLastUsedTime[modelUrl];
                if (elapsedTime > STOP_SYNC_MODEL_DELTA_TIME_MS) {
                    toRemove.push(modelUrl);
                }
            }
            for (const e of toRemove) {
                this._stopModelSync(e);
            }
        }
        _beginModelSync(resource) {
            let model = this._modelService.getModel(resource);
            if (!model) {
                return;
            }
            if (model.isTooLargeForSyncing()) {
                return;
            }
            let modelUrl = resource.toString();
            this._proxy.acceptNewModel({
                url: model.uri.toString(),
                lines: model.getLinesContent(),
                EOL: model.getEOL(),
                versionId: model.getVersionId()
            });
            const toDispose = new lifecycle_1.DisposableStore();
            toDispose.add(model.onDidChangeContent((e) => {
                this._proxy.acceptModelChanged(modelUrl.toString(), e);
            }));
            toDispose.add(model.onWillDispose(() => {
                this._stopModelSync(modelUrl);
            }));
            toDispose.add(lifecycle_1.toDisposable(() => {
                this._proxy.acceptRemovedModel(modelUrl);
            }));
            this._syncedModels[modelUrl] = toDispose;
        }
        _stopModelSync(modelUrl) {
            let toDispose = this._syncedModels[modelUrl];
            delete this._syncedModels[modelUrl];
            delete this._syncedModelsLastUsedTime[modelUrl];
            lifecycle_1.dispose(toDispose);
        }
    }
    class SynchronousWorkerClient {
        constructor(instance) {
            this._instance = instance;
            this._proxyObj = Promise.resolve(this._instance);
        }
        dispose() {
            this._instance.dispose();
        }
        getProxyObject() {
            return this._proxyObj;
        }
    }
    class EditorWorkerHost {
        constructor(workerClient) {
            this._workerClient = workerClient;
        }
        // foreign host request
        fhr(method, args) {
            return this._workerClient.fhr(method, args);
        }
    }
    exports.EditorWorkerHost = EditorWorkerHost;
    class EditorWorkerClient extends lifecycle_1.Disposable {
        constructor(modelService, keepIdleModels, label) {
            super();
            this._modelService = modelService;
            this._keepIdleModels = keepIdleModels;
            this._workerFactory = new defaultWorkerFactory_1.DefaultWorkerFactory(label);
            this._worker = null;
            this._modelManager = null;
        }
        // foreign host request
        fhr(method, args) {
            throw new Error(`Not implemented!`);
        }
        _getOrCreateWorker() {
            if (!this._worker) {
                try {
                    this._worker = this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/editor/common/services/editorSimpleWorker', new EditorWorkerHost(this)));
                }
                catch (err) {
                    simpleWorker_1.logOnceWebWorkerWarning(err);
                    this._worker = new SynchronousWorkerClient(new editorSimpleWorker_1.EditorSimpleWorker(new EditorWorkerHost(this), null));
                }
            }
            return this._worker;
        }
        _getProxy() {
            return this._getOrCreateWorker().getProxyObject().then(undefined, (err) => {
                simpleWorker_1.logOnceWebWorkerWarning(err);
                this._worker = new SynchronousWorkerClient(new editorSimpleWorker_1.EditorSimpleWorker(new EditorWorkerHost(this), null));
                return this._getOrCreateWorker().getProxyObject();
            });
        }
        _getOrCreateModelManager(proxy) {
            if (!this._modelManager) {
                this._modelManager = this._register(new EditorModelManager(proxy, this._modelService, this._keepIdleModels));
            }
            return this._modelManager;
        }
        _withSyncedResources(resources) {
            return this._getProxy().then((proxy) => {
                this._getOrCreateModelManager(proxy).ensureSyncedResources(resources);
                return proxy;
            });
        }
        computeDiff(original, modified, ignoreTrimWhitespace, maxComputationTime) {
            return this._withSyncedResources([original, modified]).then(proxy => {
                return proxy.computeDiff(original.toString(), modified.toString(), ignoreTrimWhitespace, maxComputationTime);
            });
        }
        computeDirtyDiff(original, modified, ignoreTrimWhitespace) {
            return this._withSyncedResources([original, modified]).then(proxy => {
                return proxy.computeDirtyDiff(original.toString(), modified.toString(), ignoreTrimWhitespace);
            });
        }
        computeMoreMinimalEdits(resource, edits) {
            return this._withSyncedResources([resource]).then(proxy => {
                return proxy.computeMoreMinimalEdits(resource.toString(), edits);
            });
        }
        computeLinks(resource) {
            return this._withSyncedResources([resource]).then(proxy => {
                return proxy.computeLinks(resource.toString());
            });
        }
        textualSuggest(resource, position) {
            return this._withSyncedResources([resource]).then(proxy => {
                let model = this._modelService.getModel(resource);
                if (!model) {
                    return null;
                }
                let wordDefRegExp = languageConfigurationRegistry_1.LanguageConfigurationRegistry.getWordDefinition(model.getLanguageIdentifier().id);
                let wordDef = wordDefRegExp.source;
                let wordDefFlags = strings_1.regExpFlags(wordDefRegExp);
                return proxy.textualSuggest(resource.toString(), position, wordDef, wordDefFlags);
            });
        }
        computeWordRanges(resource, range) {
            return this._withSyncedResources([resource]).then(proxy => {
                let model = this._modelService.getModel(resource);
                if (!model) {
                    return Promise.resolve(null);
                }
                let wordDefRegExp = languageConfigurationRegistry_1.LanguageConfigurationRegistry.getWordDefinition(model.getLanguageIdentifier().id);
                let wordDef = wordDefRegExp.source;
                let wordDefFlags = strings_1.regExpFlags(wordDefRegExp);
                return proxy.computeWordRanges(resource.toString(), range, wordDef, wordDefFlags);
            });
        }
        navigateValueSet(resource, range, up) {
            return this._withSyncedResources([resource]).then(proxy => {
                let model = this._modelService.getModel(resource);
                if (!model) {
                    return null;
                }
                let wordDefRegExp = languageConfigurationRegistry_1.LanguageConfigurationRegistry.getWordDefinition(model.getLanguageIdentifier().id);
                let wordDef = wordDefRegExp.source;
                let wordDefFlags = strings_1.regExpFlags(wordDefRegExp);
                return proxy.navigateValueSet(resource.toString(), range, up, wordDef, wordDefFlags);
            });
        }
    }
    exports.EditorWorkerClient = EditorWorkerClient;
});
//# __sourceMappingURL=editorWorkerServiceImpl.js.map