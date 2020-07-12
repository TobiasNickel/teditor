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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/base/common/lifecycle", "vs/base/common/arrays"], function (require, exports, nls_1, async_1, cancellation_1, log_1, progress_1, lifecycle_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileSaveParticipant = void 0;
    let TextFileSaveParticipant = class TextFileSaveParticipant extends lifecycle_1.Disposable {
        constructor(progressService, logService) {
            super();
            this.progressService = progressService;
            this.logService = logService;
            this.saveParticipants = [];
        }
        addSaveParticipant(participant) {
            const remove = arrays_1.insert(this.saveParticipants, participant);
            return lifecycle_1.toDisposable(() => remove());
        }
        participate(model, context, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            return this.progressService.withProgress({
                title: nls_1.localize('saveParticipants', "Saving '{0}'", model.name),
                location: 15 /* Notification */,
                cancellable: true,
                delay: model.isDirty() ? 3000 : 5000
            }, async (progress) => {
                var _a, _b;
                // undoStop before participation
                (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.pushStackElement();
                for (const saveParticipant of this.saveParticipants) {
                    if (cts.token.isCancellationRequested || !model.textEditorModel /* disposed */) {
                        break;
                    }
                    try {
                        const promise = saveParticipant.participate(model, context, progress, cts.token);
                        await async_1.raceCancellation(promise, cts.token);
                    }
                    catch (err) {
                        this.logService.warn(err);
                    }
                }
                // undoStop after participation
                (_b = model.textEditorModel) === null || _b === void 0 ? void 0 : _b.pushStackElement();
            }, () => {
                // user cancel
                cts.dispose(true);
            });
        }
        dispose() {
            this.saveParticipants.splice(0, this.saveParticipants.length);
        }
    };
    TextFileSaveParticipant = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, log_1.ILogService)
    ], TextFileSaveParticipant);
    exports.TextFileSaveParticipant = TextFileSaveParticipant;
});
//# __sourceMappingURL=textFileSaveParticipant.js.map