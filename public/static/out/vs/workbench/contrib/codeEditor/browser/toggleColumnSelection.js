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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/controller/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/controller/cursorCommon"], function (require, exports, nls, actions_1, actions_2, configuration_1, contextkey_1, platform_1, actions_3, codeEditorService_1, coreCommands_1, position_1, selection_1, cursorCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleColumnSelectionAction = void 0;
    let ToggleColumnSelectionAction = class ToggleColumnSelectionAction extends actions_1.Action {
        constructor(id, label, _configurationService, _codeEditorService) {
            super(id, label);
            this._configurationService = _configurationService;
            this._codeEditorService = _codeEditorService;
        }
        _getCodeEditor() {
            const codeEditor = this._codeEditorService.getFocusedCodeEditor();
            if (codeEditor) {
                return codeEditor;
            }
            return this._codeEditorService.getActiveCodeEditor();
        }
        async run() {
            const oldValue = this._configurationService.getValue('editor.columnSelection');
            const codeEditor = this._getCodeEditor();
            await this._configurationService.updateValue('editor.columnSelection', !oldValue, 1 /* USER */);
            const newValue = this._configurationService.getValue('editor.columnSelection');
            if (!codeEditor || codeEditor !== this._getCodeEditor() || oldValue === newValue || !codeEditor.hasModel()) {
                return;
            }
            const viewModel = codeEditor._getViewModel();
            if (codeEditor.getOption(13 /* columnSelection */)) {
                const selection = codeEditor.getSelection();
                const modelSelectionStart = new position_1.Position(selection.selectionStartLineNumber, selection.selectionStartColumn);
                const viewSelectionStart = viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelSelectionStart);
                const modelPosition = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, {
                    position: modelSelectionStart,
                    viewPosition: viewSelectionStart
                });
                const visibleColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(viewModel.cursorConfig, viewModel, viewPosition);
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: modelPosition,
                    viewPosition: viewPosition,
                    doColumnSelect: true,
                    mouseColumn: visibleColumn + 1
                });
            }
            else {
                const columnSelectData = viewModel.getCursorColumnSelectData();
                const fromViewColumn = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(viewModel.cursorConfig, viewModel, columnSelectData.fromViewLineNumber, columnSelectData.fromViewVisualColumn);
                const fromPosition = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(columnSelectData.fromViewLineNumber, fromViewColumn));
                const toViewColumn = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(viewModel.cursorConfig, viewModel, columnSelectData.toViewLineNumber, columnSelectData.toViewVisualColumn);
                const toPosition = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(columnSelectData.toViewLineNumber, toViewColumn));
                codeEditor.setSelection(new selection_1.Selection(fromPosition.lineNumber, fromPosition.column, toPosition.lineNumber, toPosition.column));
            }
        }
    };
    ToggleColumnSelectionAction.ID = 'editor.action.toggleColumnSelection';
    ToggleColumnSelectionAction.LABEL = nls.localize('toggleColumnSelection', "Toggle Column Selection Mode");
    ToggleColumnSelectionAction = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, codeEditorService_1.ICodeEditorService)
    ], ToggleColumnSelectionAction);
    exports.ToggleColumnSelectionAction = ToggleColumnSelectionAction;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleColumnSelectionAction), 'Toggle Column Selection Mode');
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleColumnSelectionAction.ID,
            title: nls.localize({ key: 'miColumnSelection', comment: ['&& denotes a mnemonic'] }, "Column &&Selection Mode"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.editor.columnSelection', true)
        },
        order: 2
    });
});
//# __sourceMappingURL=toggleColumnSelection.js.map