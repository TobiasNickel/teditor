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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/workingCopyFileOperationParticipant"], function (require, exports, instantiation_1, extensions_1, event_1, arrays_1, lifecycle_1, files_1, cancellation_1, workingCopyService_1, uriIdentity_1, workingCopyFileOperationParticipant_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyFileService = exports.IWorkingCopyFileService = void 0;
    exports.IWorkingCopyFileService = instantiation_1.createDecorator('workingCopyFileService');
    let WorkingCopyFileService = class WorkingCopyFileService extends lifecycle_1.Disposable {
        constructor(fileService, workingCopyService, instantiationService, uriIdentityService) {
            super();
            this.fileService = fileService;
            this.workingCopyService = workingCopyService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            //#region Events
            this._onWillRunWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onWillRunWorkingCopyFileOperation = this._onWillRunWorkingCopyFileOperation.event;
            this._onDidFailWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onDidFailWorkingCopyFileOperation = this._onDidFailWorkingCopyFileOperation.event;
            this._onDidRunWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onDidRunWorkingCopyFileOperation = this._onDidRunWorkingCopyFileOperation.event;
            //#endregion
            this.correlationIds = 0;
            //#region File operation participants
            this.fileOperationParticipants = this._register(this.instantiationService.createInstance(workingCopyFileOperationParticipant_1.WorkingCopyFileOperationParticipant));
            //#endregion
            //#region Path related
            this.workingCopyProviders = [];
            // register a default working copy provider that uses the working copy service
            this.registerWorkingCopyProvider(resource => {
                return this.workingCopyService.workingCopies.filter(workingCopy => {
                    if (this.fileService.canHandleResource(resource)) {
                        // only check for parents if the resource can be handled
                        // by the file system where we then assume a folder like
                        // path structure
                        return this.uriIdentityService.extUri.isEqualOrParent(workingCopy.resource, resource);
                    }
                    return this.uriIdentityService.extUri.isEqual(workingCopy.resource, resource);
                });
            });
        }
        async move(source, target, overwrite) {
            return this.moveOrCopy(source, target, true, overwrite);
        }
        async copy(source, target, overwrite) {
            return this.moveOrCopy(source, target, false, overwrite);
        }
        async moveOrCopy(source, target, move, overwrite) {
            // validate move/copy operation before starting
            const validateMoveOrCopy = await (move ? this.fileService.canMove(source, target, overwrite) : this.fileService.canCopy(source, target, overwrite));
            if (validateMoveOrCopy instanceof Error) {
                throw validateMoveOrCopy;
            }
            // file operation participant
            await this.runFileOperationParticipants(target, source, move ? 2 /* MOVE */ : 3 /* COPY */);
            // Before doing the heave operations, check first if source and target
            // are either identical or are considered to be identical for the file
            // system. In that case we want the model to stay as is and only do the
            // raw file operation.
            if (this.uriIdentityService.extUri.isEqual(source, target)) {
                if (move) {
                    return this.fileService.move(source, target, overwrite);
                }
                else {
                    return this.fileService.copy(source, target, overwrite);
                }
            }
            // before event
            const event = { correlationId: this.correlationIds++, operation: move ? 2 /* MOVE */ : 3 /* COPY */, target, source };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None);
            // handle dirty working copies depending on the operation:
            // - move: revert both source and target (if any)
            // - copy: revert target (if any)
            const dirtyWorkingCopies = (move ? [...this.getDirty(source), ...this.getDirty(target)] : this.getDirty(target));
            await Promise.all(dirtyWorkingCopies.map(dirtyWorkingCopy => dirtyWorkingCopy.revert({ soft: true })));
            // now we can rename the source to target via file operation
            let stat;
            try {
                if (move) {
                    stat = await this.fileService.move(source, target, overwrite);
                }
                else {
                    stat = await this.fileService.copy(source, target, overwrite);
                }
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None);
            return stat;
        }
        async delete(resource, options) {
            // validate delete operation before starting
            const validateDelete = await this.fileService.canDelete(resource, options);
            if (validateDelete instanceof Error) {
                throw validateDelete;
            }
            // file operation participant
            await this.runFileOperationParticipants(resource, undefined, 1 /* DELETE */);
            // before events
            const event = { correlationId: this.correlationIds++, operation: 1 /* DELETE */, target: resource };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None);
            // Check for any existing dirty working copies for the resource
            // and do a soft revert before deleting to be able to close
            // any opened editor with these working copies
            const dirtyWorkingCopies = this.getDirty(resource);
            await Promise.all(dirtyWorkingCopies.map(dirtyWorkingCopy => dirtyWorkingCopy.revert({ soft: true })));
            // Now actually delete from disk
            try {
                await this.fileService.del(resource, options);
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None);
        }
        addFileOperationParticipant(participant) {
            return this.fileOperationParticipants.addFileOperationParticipant(participant);
        }
        runFileOperationParticipants(target, source, operation) {
            return this.fileOperationParticipants.participate(target, source, operation);
        }
        registerWorkingCopyProvider(provider) {
            const remove = arrays_1.insert(this.workingCopyProviders, provider);
            return lifecycle_1.toDisposable(remove);
        }
        getDirty(resource) {
            const dirtyWorkingCopies = new Set();
            for (const provider of this.workingCopyProviders) {
                for (const workingCopy of provider(resource)) {
                    if (workingCopy.isDirty()) {
                        dirtyWorkingCopies.add(workingCopy);
                    }
                }
            }
            return Array.from(dirtyWorkingCopies);
        }
    };
    WorkingCopyFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workingCopyService_1.IWorkingCopyService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], WorkingCopyFileService);
    exports.WorkingCopyFileService = WorkingCopyFileService;
    extensions_1.registerSingleton(exports.IWorkingCopyFileService, WorkingCopyFileService, true);
});
//# __sourceMappingURL=workingCopyFileService.js.map