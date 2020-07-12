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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/strings", "vs/base/common/event", "vs/base/common/async", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/base/common/arrays", "vs/base/common/buffer"], function (require, exports, instantiation_1, strings, event_1, async_1, files_1, modelService_1, modeService_1, lifecycle_1, types_1, editOperation_1, position_1, arrays_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferredOutputChannel = exports.AbstractFileOutputChannelModel = exports.AsbtractOutputChannelModelService = exports.IOutputChannelModelService = void 0;
    exports.IOutputChannelModelService = instantiation_1.createDecorator('outputChannelModelService');
    let AsbtractOutputChannelModelService = class AsbtractOutputChannelModelService {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        createOutputChannelModel(id, modelUri, mimeType, file) {
            return file ? this.instantiationService.createInstance(FileOutputChannelModel, modelUri, mimeType, file) : this.instantiationService.createInstance(BufferredOutputChannel, modelUri, mimeType);
        }
    };
    AsbtractOutputChannelModelService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], AsbtractOutputChannelModelService);
    exports.AsbtractOutputChannelModelService = AsbtractOutputChannelModelService;
    class AbstractFileOutputChannelModel extends lifecycle_1.Disposable {
        constructor(modelUri, mimeType, file, fileService, modelService, modeService) {
            super();
            this.modelUri = modelUri;
            this.mimeType = mimeType;
            this.file = file;
            this.fileService = fileService;
            this.modelService = modelService;
            this.modeService = modeService;
            this._onDidAppendedContent = this._register(new event_1.Emitter());
            this.onDidAppendedContent = this._onDidAppendedContent.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.model = null;
            this.startOffset = 0;
            this.endOffset = 0;
            this.modelUpdater = new async_1.RunOnceScheduler(() => this.updateModel(), 300);
            this._register(lifecycle_1.toDisposable(() => this.modelUpdater.cancel()));
        }
        clear(till) {
            if (this.modelUpdater.isScheduled()) {
                this.modelUpdater.cancel();
                this.onUpdateModelCancelled();
            }
            if (this.model) {
                this.model.setValue('');
            }
            this.endOffset = types_1.isNumber(till) ? till : this.endOffset;
            this.startOffset = this.endOffset;
        }
        update() { }
        createModel(content) {
            if (this.model) {
                this.model.setValue(content);
            }
            else {
                this.model = this.modelService.createModel(content, this.modeService.create(this.mimeType), this.modelUri);
                this.onModelCreated(this.model);
                const disposable = this.model.onWillDispose(() => {
                    this.onModelWillDispose(this.model);
                    this.model = null;
                    lifecycle_1.dispose(disposable);
                });
            }
            return this.model;
        }
        appendToModel(content) {
            if (this.model && content) {
                const lastLine = this.model.getLineCount();
                const lastLineMaxColumn = this.model.getLineMaxColumn(lastLine);
                this.model.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(lastLine, lastLineMaxColumn), content)]);
                this._onDidAppendedContent.fire();
            }
        }
        onModelCreated(model) { }
        onModelWillDispose(model) { }
        onUpdateModelCancelled() { }
        updateModel() { }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    }
    exports.AbstractFileOutputChannelModel = AbstractFileOutputChannelModel;
    // TODO@ben see if new watchers can cope with spdlog and avoid polling then
    class OutputFileListener extends lifecycle_1.Disposable {
        constructor(file, fileService) {
            super();
            this.file = file;
            this.fileService = fileService;
            this._onDidContentChange = new event_1.Emitter();
            this.onDidContentChange = this._onDidContentChange.event;
            this.watching = false;
            this.syncDelayer = new async_1.ThrottledDelayer(500);
        }
        watch(eTag) {
            if (!this.watching) {
                this.etag = eTag;
                this.poll();
                this.watching = true;
            }
        }
        poll() {
            const loop = () => this.doWatch().then(() => this.poll());
            this.syncDelayer.trigger(loop);
        }
        doWatch() {
            return this.fileService.resolve(this.file, { resolveMetadata: true })
                .then(stat => {
                if (stat.etag !== this.etag) {
                    this.etag = stat.etag;
                    this._onDidContentChange.fire(stat.size);
                }
            });
        }
        unwatch() {
            if (this.watching) {
                this.syncDelayer.cancel();
                this.watching = false;
            }
        }
        dispose() {
            this.unwatch();
            super.dispose();
        }
    }
    /**
     * An output channel driven by a file and does not support appending messages.
     */
    let FileOutputChannelModel = class FileOutputChannelModel extends AbstractFileOutputChannelModel {
        constructor(modelUri, mimeType, file, fileService, modelService, modeService) {
            super(modelUri, mimeType, file, fileService, modelService, modeService);
            this.updateInProgress = false;
            this.etag = '';
            this.loadModelPromise = null;
            this.fileHandler = this._register(new OutputFileListener(this.file, this.fileService));
            this._register(this.fileHandler.onDidContentChange(size => this.update(size)));
            this._register(lifecycle_1.toDisposable(() => this.fileHandler.unwatch()));
        }
        loadModel() {
            this.loadModelPromise = this.fileService.readFile(this.file, { position: this.startOffset })
                .then(content => {
                this.endOffset = this.startOffset + content.value.byteLength;
                this.etag = content.etag;
                return this.createModel(content.value.toString());
            });
            return this.loadModelPromise;
        }
        clear(till) {
            const loadModelPromise = this.loadModelPromise ? this.loadModelPromise : Promise.resolve();
            loadModelPromise.then(() => {
                super.clear(till);
                this.update();
            });
        }
        append(message) {
            throw new Error('Not supported');
        }
        updateModel() {
            if (this.model) {
                this.fileService.readFile(this.file, { position: this.endOffset })
                    .then(content => {
                    this.etag = content.etag;
                    if (content.value) {
                        this.endOffset = this.endOffset + content.value.byteLength;
                        this.appendToModel(content.value.toString());
                    }
                    this.updateInProgress = false;
                }, () => this.updateInProgress = false);
            }
            else {
                this.updateInProgress = false;
            }
        }
        onModelCreated(model) {
            this.fileHandler.watch(this.etag);
        }
        onModelWillDispose(model) {
            this.fileHandler.unwatch();
        }
        onUpdateModelCancelled() {
            this.updateInProgress = false;
        }
        getByteLength(str) {
            return buffer_1.VSBuffer.fromString(str).byteLength;
        }
        update(size) {
            if (this.model) {
                if (!this.updateInProgress) {
                    this.updateInProgress = true;
                    if (types_1.isNumber(size) && this.endOffset > size) { // Reset - Content is removed
                        this.startOffset = this.endOffset = 0;
                        this.model.setValue('');
                    }
                    this.modelUpdater.schedule();
                }
            }
        }
    };
    FileOutputChannelModel = __decorate([
        __param(3, files_1.IFileService),
        __param(4, modelService_1.IModelService),
        __param(5, modeService_1.IModeService)
    ], FileOutputChannelModel);
    let BufferredOutputChannel = class BufferredOutputChannel extends lifecycle_1.Disposable {
        constructor(modelUri, mimeType, modelService, modeService) {
            super();
            this.modelUri = modelUri;
            this.mimeType = mimeType;
            this.modelService = modelService;
            this.modeService = modeService;
            this.file = null;
            this.scrollLock = false;
            this._onDidAppendedContent = new event_1.Emitter();
            this.onDidAppendedContent = this._onDidAppendedContent.event;
            this._onDispose = new event_1.Emitter();
            this.onDispose = this._onDispose.event;
            this.model = null;
            this.lastReadId = undefined;
            this.modelUpdater = new async_1.RunOnceScheduler(() => this.updateModel(), 300);
            this._register(lifecycle_1.toDisposable(() => this.modelUpdater.cancel()));
            this.bufferredContent = new BufferedContent();
            this._register(lifecycle_1.toDisposable(() => this.bufferredContent.clear()));
        }
        append(output) {
            this.bufferredContent.append(output);
            if (!this.modelUpdater.isScheduled()) {
                this.modelUpdater.schedule();
            }
        }
        update() { }
        clear() {
            if (this.modelUpdater.isScheduled()) {
                this.modelUpdater.cancel();
            }
            if (this.model) {
                this.model.setValue('');
            }
            this.bufferredContent.clear();
            this.lastReadId = undefined;
        }
        loadModel() {
            const { value, id } = this.bufferredContent.getDelta(this.lastReadId);
            if (this.model) {
                this.model.setValue(value);
            }
            else {
                this.model = this.createModel(value);
            }
            this.lastReadId = id;
            return Promise.resolve(this.model);
        }
        createModel(content) {
            const model = this.modelService.createModel(content, this.modeService.create(this.mimeType), this.modelUri);
            const disposable = model.onWillDispose(() => {
                this.model = null;
                lifecycle_1.dispose(disposable);
            });
            return model;
        }
        updateModel() {
            if (this.model) {
                const { value, id } = this.bufferredContent.getDelta(this.lastReadId);
                this.lastReadId = id;
                const lastLine = this.model.getLineCount();
                const lastLineMaxColumn = this.model.getLineMaxColumn(lastLine);
                this.model.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(lastLine, lastLineMaxColumn), value)]);
                this._onDidAppendedContent.fire();
            }
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    BufferredOutputChannel = __decorate([
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService)
    ], BufferredOutputChannel);
    exports.BufferredOutputChannel = BufferredOutputChannel;
    class BufferedContent {
        constructor() {
            this.data = [];
            this.dataIds = [];
            this.idPool = 0;
            this.length = 0;
        }
        append(content) {
            this.data.push(content);
            this.dataIds.push(++this.idPool);
            this.length += content.length;
            this.trim();
        }
        clear() {
            this.data.length = 0;
            this.dataIds.length = 0;
            this.length = 0;
        }
        trim() {
            if (this.length < BufferedContent.MAX_OUTPUT_LENGTH * 1.2) {
                return;
            }
            while (this.length > BufferedContent.MAX_OUTPUT_LENGTH) {
                this.dataIds.shift();
                const removed = this.data.shift();
                if (removed) {
                    this.length -= removed.length;
                }
            }
        }
        getDelta(previousId) {
            let idx = -1;
            if (previousId !== undefined) {
                idx = arrays_1.binarySearch(this.dataIds, previousId, (a, b) => a - b);
            }
            const id = this.idPool;
            if (idx >= 0) {
                const value = strings.removeAnsiEscapeCodes(this.data.slice(idx + 1).join(''));
                return { value, id };
            }
            else {
                const value = strings.removeAnsiEscapeCodes(this.data.join(''));
                return { value, id };
            }
        }
    }
    BufferedContent.MAX_OUTPUT_LENGTH = 10000 /* Max. number of output lines to show in output */ * 100 /* Guestimated chars per line */;
});
//# __sourceMappingURL=outputChannelModel.js.map