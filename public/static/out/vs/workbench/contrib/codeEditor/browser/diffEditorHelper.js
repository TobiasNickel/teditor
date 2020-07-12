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
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/editorWidgets", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification"], function (require, exports, nls, editorExtensions_1, lifecycle_1, editorWidgets_1, instantiation_1, configuration_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WidgetState;
    (function (WidgetState) {
        WidgetState[WidgetState["Hidden"] = 0] = "Hidden";
        WidgetState[WidgetState["HintWhitespace"] = 1] = "HintWhitespace";
    })(WidgetState || (WidgetState = {}));
    let DiffEditorHelperContribution = class DiffEditorHelperContribution extends lifecycle_1.Disposable {
        constructor(_diffEditor, _instantiationService, _configurationService, _notificationService) {
            super();
            this._diffEditor = _diffEditor;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._notificationService = _notificationService;
            this._helperWidget = null;
            this._helperWidgetListener = null;
            this._state = 0 /* Hidden */;
            this._register(this._diffEditor.onDidUpdateDiff(() => {
                const diffComputationResult = this._diffEditor.getDiffComputationResult();
                this._setState(this._deduceState(diffComputationResult));
                if (diffComputationResult && diffComputationResult.quitEarly) {
                    this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('hintTimeout', "The diff algorithm was stopped early (after {0} ms.)", this._diffEditor.maxComputationTime), [{
                            label: nls.localize('removeTimeout', "Remove limit"),
                            run: () => {
                                this._configurationService.updateValue('diffEditor.maxComputationTime', 0, 1 /* USER */);
                            }
                        }], {});
                }
            }));
        }
        _deduceState(diffComputationResult) {
            if (!diffComputationResult) {
                return 0 /* Hidden */;
            }
            if (this._diffEditor.ignoreTrimWhitespace && diffComputationResult.changes.length === 0 && !diffComputationResult.identical) {
                return 1 /* HintWhitespace */;
            }
            return 0 /* Hidden */;
        }
        _setState(newState) {
            if (this._state === newState) {
                return;
            }
            this._state = newState;
            if (this._helperWidgetListener) {
                this._helperWidgetListener.dispose();
                this._helperWidgetListener = null;
            }
            if (this._helperWidget) {
                this._helperWidget.dispose();
                this._helperWidget = null;
            }
            if (this._state === 1 /* HintWhitespace */) {
                this._helperWidget = this._instantiationService.createInstance(editorWidgets_1.FloatingClickWidget, this._diffEditor.getModifiedEditor(), nls.localize('hintWhitespace', "Show Whitespace Differences"), null);
                this._helperWidgetListener = this._helperWidget.onClick(() => this._onDidClickHelperWidget());
                this._helperWidget.render();
            }
        }
        _onDidClickHelperWidget() {
            if (this._state === 1 /* HintWhitespace */) {
                this._configurationService.updateValue('diffEditor.ignoreTrimWhitespace', false, 1 /* USER */);
            }
        }
        dispose() {
            super.dispose();
        }
    };
    DiffEditorHelperContribution.ID = 'editor.contrib.diffEditorHelper';
    DiffEditorHelperContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService)
    ], DiffEditorHelperContribution);
    editorExtensions_1.registerDiffEditorContribution(DiffEditorHelperContribution.ID, DiffEditorHelperContribution);
});
//# __sourceMappingURL=diffEditorHelper.js.map