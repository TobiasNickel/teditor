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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/panel/common/panelService", "vs/platform/progress/common/progress", "vs/workbench/common/views"], function (require, exports, lifecycle_1, types_1, viewlet_1, panelService_1, progress_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositeProgressIndicator = exports.CompositeScope = exports.EditorProgressIndicator = exports.ProgressBarIndicator = void 0;
    class ProgressBarIndicator extends lifecycle_1.Disposable {
        constructor(progressbar) {
            super();
            this.progressbar = progressbar;
        }
        show(infiniteOrTotal, delay) {
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressbar.infinite().show(delay);
            }
            else {
                this.progressbar.total(infiniteOrTotal).show(delay);
            }
            return {
                total: (total) => {
                    this.progressbar.total(total);
                },
                worked: (worked) => {
                    if (this.progressbar.hasTotal()) {
                        this.progressbar.worked(worked);
                    }
                    else {
                        this.progressbar.infinite().show();
                    }
                },
                done: () => {
                    this.progressbar.stop().hide();
                }
            };
        }
        async showWhile(promise, delay) {
            try {
                this.progressbar.infinite().show(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                this.progressbar.stop().hide();
            }
        }
    }
    exports.ProgressBarIndicator = ProgressBarIndicator;
    class EditorProgressIndicator extends ProgressBarIndicator {
        constructor(progressBar, group) {
            super(progressBar);
            this.group = group;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.group.onDidCloseEditor(e => {
                if (this.group.isEmpty) {
                    this.progressbar.stop().hide();
                }
            }));
        }
        show(infiniteOrTotal, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                return progress_1.emptyProgressRunner;
            }
            if (infiniteOrTotal === true) {
                return super.show(true, delay);
            }
            return super.show(infiniteOrTotal, delay);
        }
        async showWhile(promise, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                try {
                    await promise;
                }
                catch (error) {
                    // ignore
                }
            }
            return super.showWhile(promise, delay);
        }
    }
    exports.EditorProgressIndicator = EditorProgressIndicator;
    var ProgressIndicatorState;
    (function (ProgressIndicatorState) {
        let Type;
        (function (Type) {
            Type[Type["None"] = 0] = "None";
            Type[Type["Done"] = 1] = "Done";
            Type[Type["Infinite"] = 2] = "Infinite";
            Type[Type["While"] = 3] = "While";
            Type[Type["Work"] = 4] = "Work";
        })(Type = ProgressIndicatorState.Type || (ProgressIndicatorState.Type = {}));
        ProgressIndicatorState.None = { type: 0 /* None */ };
        ProgressIndicatorState.Done = { type: 1 /* Done */ };
        ProgressIndicatorState.Infinite = { type: 2 /* Infinite */ };
        class While {
            constructor(whilePromise, whileStart, whileDelay) {
                this.whilePromise = whilePromise;
                this.whileStart = whileStart;
                this.whileDelay = whileDelay;
                this.type = 3 /* While */;
            }
        }
        ProgressIndicatorState.While = While;
        class Work {
            constructor(total, worked) {
                this.total = total;
                this.worked = worked;
                this.type = 4 /* Work */;
            }
        }
        ProgressIndicatorState.Work = Work;
    })(ProgressIndicatorState || (ProgressIndicatorState = {}));
    class CompositeScope extends lifecycle_1.Disposable {
        constructor(viewletService, panelService, viewsService, scopeId) {
            super();
            this.viewletService = viewletService;
            this.panelService = panelService;
            this.viewsService = viewsService;
            this.scopeId = scopeId;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.viewsService.onDidChangeViewVisibility(e => e.visible ? this.onScopeOpened(e.id) : this.onScopeClosed(e.id)));
            this._register(this.viewletService.onDidViewletOpen(viewlet => this.onScopeOpened(viewlet.getId())));
            this._register(this.panelService.onDidPanelOpen(({ panel }) => this.onScopeOpened(panel.getId())));
            this._register(this.viewletService.onDidViewletClose(viewlet => this.onScopeClosed(viewlet.getId())));
            this._register(this.panelService.onDidPanelClose(panel => this.onScopeClosed(panel.getId())));
        }
        onScopeClosed(scopeId) {
            if (scopeId === this.scopeId) {
                this.onScopeDeactivated();
            }
        }
        onScopeOpened(scopeId) {
            if (scopeId === this.scopeId) {
                this.onScopeActivated();
            }
        }
    }
    exports.CompositeScope = CompositeScope;
    let CompositeProgressIndicator = class CompositeProgressIndicator extends CompositeScope {
        constructor(progressbar, scopeId, isActive, viewletService, panelService, viewsService) {
            super(viewletService, panelService, viewsService, scopeId);
            this.progressState = ProgressIndicatorState.None;
            this.progressbar = progressbar;
            this.isActive = isActive || types_1.isUndefinedOrNull(scopeId); // If service is unscoped, enable by default
        }
        onScopeDeactivated() {
            this.isActive = false;
            this.progressbar.stop().hide();
        }
        onScopeActivated() {
            this.isActive = true;
            // Return early if progress state indicates that progress is done
            if (this.progressState.type === ProgressIndicatorState.Done.type) {
                return;
            }
            // Replay Infinite Progress from Promise
            if (this.progressState.type === 3 /* While */) {
                let delay;
                if (this.progressState.whileDelay > 0) {
                    const remainingDelay = this.progressState.whileDelay - (Date.now() - this.progressState.whileStart);
                    if (remainingDelay > 0) {
                        delay = remainingDelay;
                    }
                }
                this.doShowWhile(delay);
            }
            // Replay Infinite Progress
            else if (this.progressState.type === 2 /* Infinite */) {
                this.progressbar.infinite().show();
            }
            // Replay Finite Progress (Total & Worked)
            else if (this.progressState.type === 4 /* Work */) {
                if (this.progressState.total) {
                    this.progressbar.total(this.progressState.total).show();
                }
                if (this.progressState.worked) {
                    this.progressbar.worked(this.progressState.worked).show();
                }
            }
        }
        show(infiniteOrTotal, delay) {
            // Sort out Arguments
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressState = ProgressIndicatorState.Infinite;
            }
            else {
                this.progressState = new ProgressIndicatorState.Work(infiniteOrTotal, undefined);
            }
            // Active: Show Progress
            if (this.isActive) {
                // Infinite: Start Progressbar and Show after Delay
                if (this.progressState.type === 2 /* Infinite */) {
                    this.progressbar.infinite().show(delay);
                }
                // Finite: Start Progressbar and Show after Delay
                else if (this.progressState.type === 4 /* Work */ && typeof this.progressState.total === 'number') {
                    this.progressbar.total(this.progressState.total).show(delay);
                }
            }
            return {
                total: (total) => {
                    this.progressState = new ProgressIndicatorState.Work(total, this.progressState.type === 4 /* Work */ ? this.progressState.worked : undefined);
                    if (this.isActive) {
                        this.progressbar.total(total);
                    }
                },
                worked: (worked) => {
                    // Verify first that we are either not active or the progressbar has a total set
                    if (!this.isActive || this.progressbar.hasTotal()) {
                        this.progressState = new ProgressIndicatorState.Work(this.progressState.type === 4 /* Work */ ? this.progressState.total : undefined, this.progressState.type === 4 /* Work */ && typeof this.progressState.worked === 'number' ? this.progressState.worked + worked : worked);
                        if (this.isActive) {
                            this.progressbar.worked(worked);
                        }
                    }
                    // Otherwise the progress bar does not support worked(), we fallback to infinite() progress
                    else {
                        this.progressState = ProgressIndicatorState.Infinite;
                        this.progressbar.infinite().show();
                    }
                },
                done: () => {
                    this.progressState = ProgressIndicatorState.Done;
                    if (this.isActive) {
                        this.progressbar.stop().hide();
                    }
                }
            };
        }
        async showWhile(promise, delay) {
            // Join with existing running promise to ensure progress is accurate
            if (this.progressState.type === 3 /* While */) {
                promise = Promise.all([promise, this.progressState.whilePromise]);
            }
            // Keep Promise in State
            this.progressState = new ProgressIndicatorState.While(promise, delay || 0, Date.now());
            try {
                this.doShowWhile(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                // If this is not the last promise in the list of joined promises, skip this
                if (this.progressState.type !== 3 /* While */ || this.progressState.whilePromise === promise) {
                    // The while promise is either null or equal the promise we last hooked on
                    this.progressState = ProgressIndicatorState.None;
                    if (this.isActive) {
                        this.progressbar.stop().hide();
                    }
                }
            }
        }
        doShowWhile(delay) {
            // Show Progress when active
            if (this.isActive) {
                this.progressbar.infinite().show(delay);
            }
        }
    };
    CompositeProgressIndicator = __decorate([
        __param(3, viewlet_1.IViewletService),
        __param(4, panelService_1.IPanelService),
        __param(5, views_1.IViewsService)
    ], CompositeProgressIndicator);
    exports.CompositeProgressIndicator = CompositeProgressIndicator;
});
//# __sourceMappingURL=progressIndicator.js.map