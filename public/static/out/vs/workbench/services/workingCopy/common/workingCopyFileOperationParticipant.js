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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/common/arrays"], function (require, exports, nls_1, async_1, cancellation_1, log_1, progress_1, lifecycle_1, configuration_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyFileOperationParticipant = void 0;
    let WorkingCopyFileOperationParticipant = class WorkingCopyFileOperationParticipant extends lifecycle_1.Disposable {
        constructor(progressService, logService, configurationService) {
            super();
            this.progressService = progressService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.participants = [];
        }
        addFileOperationParticipant(participant) {
            const remove = arrays_1.insert(this.participants, participant);
            return lifecycle_1.toDisposable(() => remove());
        }
        async participate(target, source, operation) {
            const timeout = this.configurationService.getValue('files.participants.timeout');
            if (timeout <= 0) {
                return; // disabled
            }
            const cts = new cancellation_1.CancellationTokenSource();
            return this.progressService.withProgress({
                location: 10 /* Window */,
                title: this.progressLabel(operation)
            }, async (progress) => {
                // For each participant
                for (const participant of this.participants) {
                    if (cts.token.isCancellationRequested) {
                        break;
                    }
                    try {
                        const promise = participant.participate(target, source, operation, progress, timeout, cts.token);
                        await async_1.raceTimeout(promise, timeout, () => cts.dispose(true /* cancel */));
                    }
                    catch (err) {
                        this.logService.warn(err);
                    }
                }
            });
        }
        progressLabel(operation) {
            switch (operation) {
                case 0 /* CREATE */:
                    return nls_1.localize('msg-create', "Running 'File Create' participants...");
                case 2 /* MOVE */:
                    return nls_1.localize('msg-rename', "Running 'File Rename' participants...");
                case 3 /* COPY */:
                    return nls_1.localize('msg-copy', "Running 'File Copy' participants...");
                case 1 /* DELETE */:
                    return nls_1.localize('msg-delete', "Running 'File Delete' participants...");
            }
        }
        dispose() {
            this.participants.splice(0, this.participants.length);
        }
    };
    WorkingCopyFileOperationParticipant = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, log_1.ILogService),
        __param(2, configuration_1.IConfigurationService)
    ], WorkingCopyFileOperationParticipant);
    exports.WorkingCopyFileOperationParticipant = WorkingCopyFileOperationParticipant;
});
//# __sourceMappingURL=workingCopyFileOperationParticipant.js.map