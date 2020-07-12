/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/cancellation", "vs/base/common/lifecycle"], function (require, exports, instantiation_1, cancellation_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IEditorProgressService = exports.LongRunningOperation = exports.Progress = exports.emptyProgressRunner = exports.ProgressLocation = exports.IProgressService = void 0;
    exports.IProgressService = instantiation_1.createDecorator('progressService');
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["Explorer"] = 1] = "Explorer";
        ProgressLocation[ProgressLocation["Scm"] = 3] = "Scm";
        ProgressLocation[ProgressLocation["Extensions"] = 5] = "Extensions";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
        ProgressLocation[ProgressLocation["Dialog"] = 20] = "Dialog";
    })(ProgressLocation = exports.ProgressLocation || (exports.ProgressLocation = {}));
    exports.emptyProgressRunner = Object.freeze({
        total() { },
        worked() { },
        done() { }
    });
    class Progress {
        constructor(callback) {
            this.callback = callback;
        }
        get value() { return this._value; }
        report(item) {
            this._value = item;
            this.callback(this._value);
        }
    }
    exports.Progress = Progress;
    Progress.None = Object.freeze({ report() { } });
    class LongRunningOperation extends lifecycle_1.Disposable {
        constructor(progressIndicator) {
            super();
            this.progressIndicator = progressIndicator;
            this.currentOperationId = 0;
            this.currentOperationDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        start(progressDelay) {
            // Stop any previous operation
            this.stop();
            // Start new
            const newOperationId = ++this.currentOperationId;
            const newOperationToken = new cancellation_1.CancellationTokenSource();
            this.currentProgressTimeout = setTimeout(() => {
                if (newOperationId === this.currentOperationId) {
                    this.currentProgressRunner = this.progressIndicator.show(true);
                }
            }, progressDelay);
            this.currentOperationDisposables.add(lifecycle_1.toDisposable(() => clearTimeout(this.currentProgressTimeout)));
            this.currentOperationDisposables.add(lifecycle_1.toDisposable(() => newOperationToken.cancel()));
            this.currentOperationDisposables.add(lifecycle_1.toDisposable(() => this.currentProgressRunner ? this.currentProgressRunner.done() : undefined));
            return {
                id: newOperationId,
                token: newOperationToken.token,
                stop: () => this.doStop(newOperationId),
                isCurrent: () => this.currentOperationId === newOperationId
            };
        }
        stop() {
            this.doStop(this.currentOperationId);
        }
        doStop(operationId) {
            if (this.currentOperationId === operationId) {
                this.currentOperationDisposables.clear();
            }
        }
    }
    exports.LongRunningOperation = LongRunningOperation;
    exports.IEditorProgressService = instantiation_1.createDecorator('editorProgressService');
});
//# __sourceMappingURL=progress.js.map