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
define(["require", "exports", "vs/nls", "vs/platform/undoRedo/common/undoRedo", "vs/base/common/errors", "vs/platform/instantiation/common/extensions", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/base/common/lifecycle"], function (require, exports, nls, undoRedo_1, errors_1, extensions_1, dialogs_1, severity_1, network_1, notification_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndoRedoService = void 0;
    const DEBUG = false;
    function getResourceLabel(resource) {
        return resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path;
    }
    class ResourceStackElement {
        constructor(actual, resourceLabel, strResource) {
            this.type = 0 /* Resource */;
            this.actual = actual;
            this.label = actual.label;
            this.resourceLabel = resourceLabel;
            this.strResource = strResource;
            this.resourceLabels = [this.resourceLabel];
            this.strResources = [this.strResource];
            this.isValid = true;
        }
        setValid(isValid) {
            this.isValid = isValid;
        }
        toString() {
            return `[VALID] ${this.actual}`;
        }
    }
    var RemovedResourceReason;
    (function (RemovedResourceReason) {
        RemovedResourceReason[RemovedResourceReason["ExternalRemoval"] = 0] = "ExternalRemoval";
        RemovedResourceReason[RemovedResourceReason["NoParallelUniverses"] = 1] = "NoParallelUniverses";
    })(RemovedResourceReason || (RemovedResourceReason = {}));
    class ResourceReasonPair {
        constructor(resourceLabel, reason) {
            this.resourceLabel = resourceLabel;
            this.reason = reason;
        }
    }
    class RemovedResources {
        constructor() {
            this.elements = new Map();
        }
        createMessage() {
            const externalRemoval = [];
            const noParallelUniverses = [];
            for (const [, element] of this.elements) {
                const dest = (element.reason === 0 /* ExternalRemoval */
                    ? externalRemoval
                    : noParallelUniverses);
                dest.push(element.resourceLabel);
            }
            let messages = [];
            if (externalRemoval.length > 0) {
                messages.push(nls.localize('externalRemoval', "The following files have been closed and modified on disk: {0}.", externalRemoval.join(', ')));
            }
            if (noParallelUniverses.length > 0) {
                messages.push(nls.localize('noParallelUniverses', "The following files have been modified in an incompatible way: {0}.", noParallelUniverses.join(', ')));
            }
            return messages.join('\n');
        }
        get size() {
            return this.elements.size;
        }
        has(strResource) {
            return this.elements.has(strResource);
        }
        set(strResource, value) {
            this.elements.set(strResource, value);
        }
        delete(strResource) {
            return this.elements.delete(strResource);
        }
    }
    class WorkspaceStackElement {
        constructor(actual, resourceLabels, strResources) {
            this.type = 1 /* Workspace */;
            this.actual = actual;
            this.label = actual.label;
            this.resourceLabels = resourceLabels;
            this.strResources = strResources;
            this.removedResources = null;
            this.invalidatedResources = null;
        }
        removeResource(resourceLabel, strResource, reason) {
            if (!this.removedResources) {
                this.removedResources = new RemovedResources();
            }
            if (!this.removedResources.has(strResource)) {
                this.removedResources.set(strResource, new ResourceReasonPair(resourceLabel, reason));
            }
        }
        setValid(resourceLabel, strResource, isValid) {
            if (isValid) {
                if (this.invalidatedResources) {
                    this.invalidatedResources.delete(strResource);
                    if (this.invalidatedResources.size === 0) {
                        this.invalidatedResources = null;
                    }
                }
            }
            else {
                if (!this.invalidatedResources) {
                    this.invalidatedResources = new RemovedResources();
                }
                if (!this.invalidatedResources.has(strResource)) {
                    this.invalidatedResources.set(strResource, new ResourceReasonPair(resourceLabel, 0 /* ExternalRemoval */));
                }
            }
        }
        toString() {
            return `[VALID] ${this.actual}`;
        }
    }
    class ResourceEditStack {
        constructor(resourceLabel, strResource) {
            this.resourceLabel = resourceLabel;
            this.strResource = strResource;
            this._past = [];
            this._future = [];
            this.locked = false;
            this.versionId = 1;
        }
        dispose() {
            for (const element of this._past) {
                if (element.type === 1 /* Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* ExternalRemoval */);
                }
            }
            for (const element of this._future) {
                if (element.type === 1 /* Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* ExternalRemoval */);
                }
            }
            this.versionId++;
        }
        toString() {
            let result = [];
            result.push(`* ${this.strResource}:`);
            for (let i = 0; i < this._past.length; i++) {
                result.push(`   * [UNDO] ${this._past[i]}`);
            }
            for (let i = this._future.length - 1; i >= 0; i--) {
                result.push(`   * [REDO] ${this._future[i]}`);
            }
            return result.join('\n');
        }
        flushAllElements() {
            this._past = [];
            this._future = [];
            this.versionId++;
        }
        setElementsIsValid(isValid) {
            for (const element of this._past) {
                if (element.type === 1 /* Workspace */) {
                    element.setValid(this.resourceLabel, this.strResource, isValid);
                }
                else {
                    element.setValid(isValid);
                }
            }
            for (const element of this._future) {
                if (element.type === 1 /* Workspace */) {
                    element.setValid(this.resourceLabel, this.strResource, isValid);
                }
                else {
                    element.setValid(isValid);
                }
            }
        }
        _setElementValidFlag(element, isValid) {
            if (element.type === 1 /* Workspace */) {
                element.setValid(this.resourceLabel, this.strResource, isValid);
            }
            else {
                element.setValid(isValid);
            }
        }
        setElementsValidFlag(isValid, filter) {
            for (const element of this._past) {
                if (filter(element.actual)) {
                    this._setElementValidFlag(element, isValid);
                }
            }
            for (const element of this._future) {
                if (filter(element.actual)) {
                    this._setElementValidFlag(element, isValid);
                }
            }
        }
        pushElement(element) {
            // remove the future
            for (const futureElement of this._future) {
                if (futureElement.type === 1 /* Workspace */) {
                    futureElement.removeResource(this.resourceLabel, this.strResource, 1 /* NoParallelUniverses */);
                }
            }
            this._future = [];
            if (this._past.length > 0) {
                const lastElement = this._past[this._past.length - 1];
                if (lastElement.type === 0 /* Resource */ && !lastElement.isValid) {
                    // clear undo stack
                    this._past = [];
                }
            }
            this._past.push(element);
            this.versionId++;
        }
        getElements() {
            const past = [];
            const future = [];
            for (const element of this._past) {
                past.push(element.actual);
            }
            for (const element of this._future) {
                future.push(element.actual);
            }
            return { past, future };
        }
        getClosestPastElement() {
            if (this._past.length === 0) {
                return null;
            }
            return this._past[this._past.length - 1];
        }
        getClosestFutureElement() {
            if (this._future.length === 0) {
                return null;
            }
            return this._future[this._future.length - 1];
        }
        hasPastElements() {
            return (this._past.length > 0);
        }
        hasFutureElements() {
            return (this._future.length > 0);
        }
        splitPastWorkspaceElement(toRemove, individualMap) {
            for (let j = this._past.length - 1; j >= 0; j--) {
                if (this._past[j] === toRemove) {
                    if (individualMap.has(this.strResource)) {
                        // gets replaced
                        this._past[j] = individualMap.get(this.strResource);
                    }
                    else {
                        // gets deleted
                        this._past.splice(j, 1);
                    }
                    break;
                }
            }
            this.versionId++;
        }
        splitFutureWorkspaceElement(toRemove, individualMap) {
            for (let j = this._future.length - 1; j >= 0; j--) {
                if (this._future[j] === toRemove) {
                    if (individualMap.has(this.strResource)) {
                        // gets replaced
                        this._future[j] = individualMap.get(this.strResource);
                    }
                    else {
                        // gets deleted
                        this._future.splice(j, 1);
                    }
                    break;
                }
            }
            this.versionId++;
        }
        moveBackward(element) {
            this._past.pop();
            this._future.push(element);
            this.versionId++;
        }
        moveForward(element) {
            this._future.pop();
            this._past.push(element);
            this.versionId++;
        }
    }
    class EditStackSnapshot {
        constructor(editStacks) {
            this.editStacks = editStacks;
            this._versionIds = [];
            for (let i = 0, len = this.editStacks.length; i < len; i++) {
                this._versionIds[i] = this.editStacks[i].versionId;
            }
        }
        isValid() {
            for (let i = 0, len = this.editStacks.length; i < len; i++) {
                if (this._versionIds[i] !== this.editStacks[i].versionId) {
                    return false;
                }
            }
            return true;
        }
    }
    let UndoRedoService = class UndoRedoService {
        constructor(_dialogService, _notificationService) {
            this._dialogService = _dialogService;
            this._notificationService = _notificationService;
            this._editStacks = new Map();
            this._uriComparisonKeyComputers = [];
        }
        registerUriComparisonKeyComputer(uriComparisonKeyComputer) {
            this._uriComparisonKeyComputers.push(uriComparisonKeyComputer);
            return {
                dispose: () => {
                    for (let i = 0, len = this._uriComparisonKeyComputers.length; i < len; i++) {
                        if (this._uriComparisonKeyComputers[i] === uriComparisonKeyComputer) {
                            this._uriComparisonKeyComputers.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        getUriComparisonKey(resource) {
            for (const uriComparisonKeyComputer of this._uriComparisonKeyComputers) {
                const result = uriComparisonKeyComputer.getComparisonKey(resource);
                if (result !== null) {
                    return result;
                }
            }
            return resource.toString();
        }
        _print(label) {
            console.log(`------------------------------------`);
            console.log(`AFTER ${label}: `);
            let str = [];
            for (const element of this._editStacks) {
                str.push(element[1].toString());
            }
            console.log(str.join('\n'));
        }
        pushElement(element) {
            if (element.type === 0 /* Resource */) {
                const resourceLabel = getResourceLabel(element.resource);
                const strResource = this.getUriComparisonKey(element.resource);
                this._pushElement(new ResourceStackElement(element, resourceLabel, strResource));
            }
            else {
                const seen = new Set();
                const resourceLabels = [];
                const strResources = [];
                for (const resource of element.resources) {
                    const resourceLabel = getResourceLabel(resource);
                    const strResource = this.getUriComparisonKey(resource);
                    if (seen.has(strResource)) {
                        continue;
                    }
                    seen.add(strResource);
                    resourceLabels.push(resourceLabel);
                    strResources.push(strResource);
                }
                if (resourceLabels.length === 1) {
                    this._pushElement(new ResourceStackElement(element, resourceLabels[0], strResources[0]));
                }
                else {
                    this._pushElement(new WorkspaceStackElement(element, resourceLabels, strResources));
                }
            }
            if (DEBUG) {
                this._print('pushElement');
            }
        }
        _pushElement(element) {
            for (let i = 0, len = element.strResources.length; i < len; i++) {
                const resourceLabel = element.resourceLabels[i];
                const strResource = element.strResources[i];
                let editStack;
                if (this._editStacks.has(strResource)) {
                    editStack = this._editStacks.get(strResource);
                }
                else {
                    editStack = new ResourceEditStack(resourceLabel, strResource);
                    this._editStacks.set(strResource, editStack);
                }
                editStack.pushElement(element);
            }
        }
        getLastElement(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                if (editStack.hasFutureElements()) {
                    return null;
                }
                const closestPastElement = editStack.getClosestPastElement();
                return closestPastElement ? closestPastElement.actual : null;
            }
            return null;
        }
        _splitPastWorkspaceElement(toRemove, ignoreResources) {
            const individualArr = toRemove.actual.split();
            const individualMap = new Map();
            for (const _element of individualArr) {
                const resourceLabel = getResourceLabel(_element.resource);
                const strResource = this.getUriComparisonKey(_element.resource);
                const element = new ResourceStackElement(_element, resourceLabel, strResource);
                individualMap.set(element.strResource, element);
            }
            for (const strResource of toRemove.strResources) {
                if (ignoreResources && ignoreResources.has(strResource)) {
                    continue;
                }
                const editStack = this._editStacks.get(strResource);
                editStack.splitPastWorkspaceElement(toRemove, individualMap);
            }
        }
        _splitFutureWorkspaceElement(toRemove, ignoreResources) {
            const individualArr = toRemove.actual.split();
            const individualMap = new Map();
            for (const _element of individualArr) {
                const resourceLabel = getResourceLabel(_element.resource);
                const strResource = this.getUriComparisonKey(_element.resource);
                const element = new ResourceStackElement(_element, resourceLabel, strResource);
                individualMap.set(element.strResource, element);
            }
            for (const strResource of toRemove.strResources) {
                if (ignoreResources && ignoreResources.has(strResource)) {
                    continue;
                }
                const editStack = this._editStacks.get(strResource);
                editStack.splitFutureWorkspaceElement(toRemove, individualMap);
            }
        }
        removeElements(resource) {
            const strResource = typeof resource === 'string' ? resource : this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.dispose();
                this._editStacks.delete(strResource);
            }
            if (DEBUG) {
                this._print('removeElements');
            }
        }
        setElementsValidFlag(resource, isValid, filter) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.setElementsValidFlag(isValid, filter);
            }
            if (DEBUG) {
                this._print('setElementsValidFlag');
            }
        }
        hasElements(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return (editStack.hasPastElements() || editStack.hasFutureElements());
            }
            return false;
        }
        getElements(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.getElements();
            }
            return { past: [], future: [] };
        }
        canUndo(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.hasPastElements();
            }
            return false;
        }
        _onError(err, element) {
            errors_1.onUnexpectedError(err);
            // An error occured while undoing or redoing => drop the undo/redo stack for all affected resources
            for (const strResource of element.strResources) {
                this.removeElements(strResource);
            }
            this._notificationService.error(err);
        }
        _acquireLocks(editStackSnapshot) {
            // first, check if all locks can be acquired
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    throw new Error('Cannot acquire edit stack lock');
                }
            }
            // can acquire all locks
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.locked = true;
            }
            return () => {
                // release all locks
                for (const editStack of editStackSnapshot.editStacks) {
                    editStack.locked = false;
                }
            };
        }
        _safeInvokeWithLocks(element, invoke, editStackSnapshot, cleanup = lifecycle_1.Disposable.None) {
            const releaseLocks = this._acquireLocks(editStackSnapshot);
            let result;
            try {
                result = invoke();
            }
            catch (err) {
                releaseLocks();
                cleanup.dispose();
                return this._onError(err, element);
            }
            if (result) {
                // result is Promise<void>
                return result.then(() => {
                    releaseLocks();
                    cleanup.dispose();
                }, (err) => {
                    releaseLocks();
                    cleanup.dispose();
                    return this._onError(err, element);
                });
            }
            else {
                // result is void
                releaseLocks();
                cleanup.dispose();
            }
        }
        async _invokeWorkspacePrepare(element) {
            if (typeof element.actual.prepareUndoRedo === 'undefined') {
                return lifecycle_1.Disposable.None;
            }
            const result = element.actual.prepareUndoRedo();
            if (typeof result === 'undefined') {
                return lifecycle_1.Disposable.None;
            }
            return result;
        }
        _invokeResourcePrepare(element, callback) {
            if (element.actual.type !== 1 /* Workspace */ || typeof element.actual.prepareUndoRedo === 'undefined') {
                // no preparation needed
                callback(lifecycle_1.Disposable.None);
                return;
            }
            const r = element.actual.prepareUndoRedo();
            if (!r) {
                // nothing to clean up
                callback(lifecycle_1.Disposable.None);
                return;
            }
            if (lifecycle_1.isDisposable(r)) {
                callback(r);
                return;
            }
            return r.then((disposable) => {
                callback(disposable);
            });
        }
        _getAffectedEditStacks(element) {
            const affectedEditStacks = [];
            for (const strResource of element.strResources) {
                affectedEditStacks.push(this._editStacks.get(strResource));
            }
            return new EditStackSnapshot(affectedEditStacks);
        }
        _checkWorkspaceUndo(strResource, element, editStackSnapshot, checkInvalidatedResources) {
            if (element.removedResources) {
                this._splitPastWorkspaceElement(element, element.removedResources);
                const message = nls.localize('cannotWorkspaceUndo', "Could not undo '{0}' across all files. {1}", element.label, element.removedResources.createMessage());
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.undo(strResource));
            }
            if (checkInvalidatedResources && element.invalidatedResources) {
                this._splitPastWorkspaceElement(element, element.invalidatedResources);
                const message = nls.localize('cannotWorkspaceUndo', "Could not undo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage());
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.undo(strResource));
            }
            // this must be the last past element in all the impacted resources!
            const cannotUndoDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.getClosestPastElement() !== element) {
                    cannotUndoDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotUndoDueToResources.length > 0) {
                this._splitPastWorkspaceElement(element, null);
                const message = nls.localize('cannotWorkspaceUndoDueToChanges', "Could not undo '{0}' across all files because changes were made to {1}", element.label, cannotUndoDueToResources.join(', '));
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.undo(strResource));
            }
            const cannotLockDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    cannotLockDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotLockDueToResources.length > 0) {
                this._splitPastWorkspaceElement(element, null);
                const message = nls.localize('cannotWorkspaceUndoDueToInProgressUndoRedo', "Could not undo '{0}' across all files because there is already an undo or redo operation running on {1}", element.label, cannotLockDueToResources.join(', '));
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.undo(strResource));
            }
            // check if new stack elements were added in the meantime...
            if (!editStackSnapshot.isValid()) {
                this._splitPastWorkspaceElement(element, null);
                const message = nls.localize('cannotWorkspaceUndoDueToInMeantimeUndoRedo', "Could not undo '{0}' across all files because an undo or redo operation occurred in the meantime", element.label);
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.undo(strResource));
            }
            return null;
        }
        _workspaceUndo(strResource, element) {
            const affectedEditStacks = this._getAffectedEditStacks(element);
            const verificationError = this._checkWorkspaceUndo(strResource, element, affectedEditStacks, /*invalidated resources will be checked after the prepare call*/ false);
            if (verificationError) {
                return verificationError.returnValue;
            }
            return this._confirmAndExecuteWorkspaceUndo(strResource, element, affectedEditStacks);
        }
        async _confirmAndExecuteWorkspaceUndo(strResource, element, editStackSnapshot) {
            const result = await this._dialogService.show(severity_1.default.Info, nls.localize('confirmWorkspace', "Would you like to undo '{0}' across all files?", element.label), [
                nls.localize({ key: 'ok', comment: ['{0} denotes a number that is > 1'] }, "Undo in {0} Files", editStackSnapshot.editStacks.length),
                nls.localize('nok', "Undo this File"),
                nls.localize('cancel', "Cancel"),
            ], {
                cancelId: 2
            });
            if (result.choice === 2) {
                // choice: cancel
                return;
            }
            if (result.choice === 1) {
                // choice: undo this file
                this._splitPastWorkspaceElement(element, null);
                return this.undo(strResource);
            }
            // choice: undo in all files
            // At this point, it is possible that the element has been made invalid in the meantime (due to the confirmation await)
            const verificationError1 = this._checkWorkspaceUndo(strResource, element, editStackSnapshot, /*invalidated resources will be checked after the prepare call*/ false);
            if (verificationError1) {
                return verificationError1.returnValue;
            }
            // prepare
            let cleanup;
            try {
                cleanup = await this._invokeWorkspacePrepare(element);
            }
            catch (err) {
                return this._onError(err, element);
            }
            // At this point, it is possible that the element has been made invalid in the meantime (due to the prepare await)
            const verificationError2 = this._checkWorkspaceUndo(strResource, element, editStackSnapshot, /*now also check that there are no more invalidated resources*/ true);
            if (verificationError2) {
                cleanup.dispose();
                return verificationError2.returnValue;
            }
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.moveBackward(element);
            }
            return this._safeInvokeWithLocks(element, () => element.actual.undo(), editStackSnapshot, cleanup);
        }
        _resourceUndo(editStack, element) {
            if (!element.isValid) {
                // invalid element => immediately flush edit stack!
                editStack.flushAllElements();
                return;
            }
            if (editStack.locked) {
                const message = nls.localize('cannotResourceUndoDueToInProgressUndoRedo', "Could not undo '{0}' because there is already an undo or redo operation running.", element.label);
                this._notificationService.info(message);
                return;
            }
            return this._invokeResourcePrepare(element, (cleanup) => {
                editStack.moveBackward(element);
                return this._safeInvokeWithLocks(element, () => element.actual.undo(), new EditStackSnapshot([editStack]), cleanup);
            });
        }
        undo(resource) {
            const strResource = typeof resource === 'string' ? resource : this.getUriComparisonKey(resource);
            if (!this._editStacks.has(strResource)) {
                return;
            }
            const editStack = this._editStacks.get(strResource);
            const element = editStack.getClosestPastElement();
            if (!element) {
                return;
            }
            try {
                if (element.type === 1 /* Workspace */) {
                    return this._workspaceUndo(strResource, element);
                }
                else {
                    return this._resourceUndo(editStack, element);
                }
            }
            finally {
                if (DEBUG) {
                    this._print('undo');
                }
            }
        }
        canRedo(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.hasFutureElements();
            }
            return false;
        }
        _checkWorkspaceRedo(strResource, element, editStackSnapshot, checkInvalidatedResources) {
            if (element.removedResources) {
                this._splitFutureWorkspaceElement(element, element.removedResources);
                const message = nls.localize('cannotWorkspaceRedo', "Could not redo '{0}' across all files. {1}", element.label, element.removedResources.createMessage());
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.redo(strResource));
            }
            if (checkInvalidatedResources && element.invalidatedResources) {
                this._splitFutureWorkspaceElement(element, element.invalidatedResources);
                const message = nls.localize('cannotWorkspaceRedo', "Could not redo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage());
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.redo(strResource));
            }
            // this must be the last future element in all the impacted resources!
            const cannotRedoDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.getClosestFutureElement() !== element) {
                    cannotRedoDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotRedoDueToResources.length > 0) {
                this._splitFutureWorkspaceElement(element, null);
                const message = nls.localize('cannotWorkspaceRedoDueToChanges', "Could not redo '{0}' across all files because changes were made to {1}", element.label, cannotRedoDueToResources.join(', '));
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.redo(strResource));
            }
            const cannotLockDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    cannotLockDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotLockDueToResources.length > 0) {
                this._splitFutureWorkspaceElement(element, null);
                const message = nls.localize('cannotWorkspaceRedoDueToInProgressUndoRedo', "Could not redo '{0}' across all files because there is already an undo or redo operation running on {1}", element.label, cannotLockDueToResources.join(', '));
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.redo(strResource));
            }
            // check if new stack elements were added in the meantime...
            if (!editStackSnapshot.isValid()) {
                this._splitPastWorkspaceElement(element, null);
                const message = nls.localize('cannotWorkspaceRedoDueToInMeantimeUndoRedo', "Could not redo '{0}' across all files because an undo or redo operation occurred in the meantime", element.label);
                this._notificationService.info(message);
                return new WorkspaceVerificationError(this.redo(strResource));
            }
            return null;
        }
        _workspaceRedo(strResource, element) {
            const affectedEditStacks = this._getAffectedEditStacks(element);
            const verificationError = this._checkWorkspaceRedo(strResource, element, affectedEditStacks, /*invalidated resources will be checked after the prepare call*/ false);
            if (verificationError) {
                return verificationError.returnValue;
            }
            return this._executeWorkspaceRedo(strResource, element, affectedEditStacks);
        }
        async _executeWorkspaceRedo(strResource, element, editStackSnapshot) {
            // prepare
            let cleanup;
            try {
                cleanup = await this._invokeWorkspacePrepare(element);
            }
            catch (err) {
                return this._onError(err, element);
            }
            // At this point, it is possible that the element has been made invalid in the meantime (due to the prepare await)
            const verificationError = this._checkWorkspaceRedo(strResource, element, editStackSnapshot, /*now also check that there are no more invalidated resources*/ true);
            if (verificationError) {
                cleanup.dispose();
                return verificationError.returnValue;
            }
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.moveForward(element);
            }
            return this._safeInvokeWithLocks(element, () => element.actual.redo(), editStackSnapshot, cleanup);
        }
        _resourceRedo(editStack, element) {
            if (!element.isValid) {
                // invalid element => immediately flush edit stack!
                editStack.flushAllElements();
                return;
            }
            if (editStack.locked) {
                const message = nls.localize('cannotResourceRedoDueToInProgressUndoRedo', "Could not redo '{0}' because there is already an undo or redo operation running.", element.label);
                this._notificationService.info(message);
                return;
            }
            return this._invokeResourcePrepare(element, (cleanup) => {
                editStack.moveForward(element);
                return this._safeInvokeWithLocks(element, () => element.actual.redo(), new EditStackSnapshot([editStack]), cleanup);
            });
        }
        redo(resource) {
            const strResource = typeof resource === 'string' ? resource : this.getUriComparisonKey(resource);
            if (!this._editStacks.has(strResource)) {
                return;
            }
            const editStack = this._editStacks.get(strResource);
            const element = editStack.getClosestFutureElement();
            if (!element) {
                return;
            }
            try {
                if (element.type === 1 /* Workspace */) {
                    return this._workspaceRedo(strResource, element);
                }
                else {
                    return this._resourceRedo(editStack, element);
                }
            }
            finally {
                if (DEBUG) {
                    this._print('redo');
                }
            }
        }
    };
    UndoRedoService = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, notification_1.INotificationService)
    ], UndoRedoService);
    exports.UndoRedoService = UndoRedoService;
    class WorkspaceVerificationError {
        constructor(returnValue) {
            this.returnValue = returnValue;
        }
    }
    extensions_1.registerSingleton(undoRedo_1.IUndoRedoService, UndoRedoService);
});
//# __sourceMappingURL=undoRedoService.js.map