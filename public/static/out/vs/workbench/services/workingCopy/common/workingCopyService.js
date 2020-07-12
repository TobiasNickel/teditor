/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map"], function (require, exports, instantiation_1, extensions_1, event_1, lifecycle_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyService = exports.IWorkingCopyService = exports.WorkingCopyCapabilities = void 0;
    var WorkingCopyCapabilities;
    (function (WorkingCopyCapabilities) {
        /**
         * Signals that the working copy requires
         * additional input when saving, e.g. an
         * associated path to save to.
         */
        WorkingCopyCapabilities[WorkingCopyCapabilities["Untitled"] = 2] = "Untitled";
    })(WorkingCopyCapabilities = exports.WorkingCopyCapabilities || (exports.WorkingCopyCapabilities = {}));
    exports.IWorkingCopyService = instantiation_1.createDecorator('workingCopyService');
    class WorkingCopyService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            //#region Events
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidUnregister = this._register(new event_1.Emitter());
            this.onDidUnregister = this._onDidUnregister.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._workingCopies = new Set();
            this.mapResourceToWorkingCopy = new map_1.ResourceMap();
            //#endregion
        }
        //#endregion
        //#region Registry
        get workingCopies() { return Array.from(this._workingCopies.values()); }
        registerWorkingCopy(workingCopy) {
            if (this.mapResourceToWorkingCopy.has(workingCopy.resource)) {
                throw new Error(`Cannot register more than one working copy with the same resource ${workingCopy.resource.toString(true)}.`);
            }
            const disposables = new lifecycle_1.DisposableStore();
            // Registry
            this._workingCopies.add(workingCopy);
            this.mapResourceToWorkingCopy.set(workingCopy.resource, workingCopy);
            // Wire in Events
            disposables.add(workingCopy.onDidChangeContent(() => this._onDidChangeContent.fire(workingCopy)));
            disposables.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            // Send some initial events
            this._onDidRegister.fire(workingCopy);
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            return lifecycle_1.toDisposable(() => {
                this.unregisterWorkingCopy(workingCopy);
                lifecycle_1.dispose(disposables);
                // Signal as event
                this._onDidUnregister.fire(workingCopy);
            });
        }
        unregisterWorkingCopy(workingCopy) {
            // Remove from registry
            this._workingCopies.delete(workingCopy);
            this.mapResourceToWorkingCopy.delete(workingCopy.resource);
            // If copy is dirty, ensure to fire an event to signal the dirty change
            // (a disposed working copy cannot account for being dirty in our model)
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
        }
        //#endregion
        //#region Dirty Tracking
        get hasDirty() {
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    return true;
                }
            }
            return false;
        }
        get dirtyCount() {
            let totalDirtyCount = 0;
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    totalDirtyCount++;
                }
            }
            return totalDirtyCount;
        }
        get dirtyWorkingCopies() {
            return this.workingCopies.filter(workingCopy => workingCopy.isDirty());
        }
        isDirty(resource) {
            const workingCopy = this.mapResourceToWorkingCopy.get(resource);
            if (workingCopy) {
                return workingCopy.isDirty();
            }
            return false;
        }
    }
    exports.WorkingCopyService = WorkingCopyService;
    extensions_1.registerSingleton(exports.IWorkingCopyService, WorkingCopyService, true);
});
//# __sourceMappingURL=workingCopyService.js.map