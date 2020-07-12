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
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/editorContextKeys", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, uri_1, editorContextKeys_1, getIconClasses_1, modelService_1, modeService_1, nls_1, actions_1, clipboardService_1, commands_1, contextkey_1, contextkeys_1, quickInput_1, notebookBrowser_1, notebookCommon_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChangeCellLanguageAction = exports.changeCellToKind = exports.getActiveNotebookEditor = exports.CancelCellAction = exports.ExecuteCellAction = exports.CELL_TITLE_GROUP_ID = exports.NOTEBOOK_ACTIONS_CATEGORY = void 0;
    // Notebook Commands
    const EXECUTE_NOTEBOOK_COMMAND_ID = 'notebook.execute';
    const CANCEL_NOTEBOOK_COMMAND_ID = 'notebook.cancelExecution';
    const NOTEBOOK_FOCUS_TOP = 'notebook.focusTop';
    const NOTEBOOK_FOCUS_BOTTOM = 'notebook.focusBottom';
    const NOTEBOOK_REDO = 'notebook.redo';
    const NOTEBOOK_UNDO = 'notebook.undo';
    const NOTEBOOK_FOCUS_PREVIOUS_EDITOR = 'notebook.focusPreviousEditor';
    const NOTEBOOK_FOCUS_NEXT_EDITOR = 'notebook.focusNextEditor';
    const CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID = 'notebook.clearAllCellsOutputs';
    const RENDER_ALL_MARKDOWN_CELLS = 'notebook.renderAllMarkdownCells';
    // Cell Commands
    const INSERT_CODE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertCodeCellAbove';
    const INSERT_CODE_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertCodeCellBelow';
    const INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertMarkdownCellAbove';
    const INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertMarkdownCellBelow';
    const CHANGE_CELL_TO_CODE_COMMAND_ID = 'notebook.cell.changeToCode';
    const CHANGE_CELL_TO_MARKDOWN_COMMAND_ID = 'notebook.cell.changeToMarkdown';
    const EDIT_CELL_COMMAND_ID = 'notebook.cell.edit';
    const QUIT_EDIT_CELL_COMMAND_ID = 'notebook.cell.quitEdit';
    const DELETE_CELL_COMMAND_ID = 'notebook.cell.delete';
    const MOVE_CELL_UP_COMMAND_ID = 'notebook.cell.moveUp';
    const MOVE_CELL_DOWN_COMMAND_ID = 'notebook.cell.moveDown';
    const COPY_CELL_COMMAND_ID = 'notebook.cell.copy';
    const CUT_CELL_COMMAND_ID = 'notebook.cell.cut';
    const PASTE_CELL_COMMAND_ID = 'notebook.cell.paste';
    const PASTE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.pasteAbove';
    const COPY_CELL_UP_COMMAND_ID = 'notebook.cell.copyUp';
    const COPY_CELL_DOWN_COMMAND_ID = 'notebook.cell.copyDown';
    const SPLIT_CELL_COMMAND_ID = 'notebook.cell.split';
    const JOIN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.joinAbove';
    const JOIN_CELL_BELOW_COMMAND_ID = 'notebook.cell.joinBelow';
    const EXECUTE_CELL_COMMAND_ID = 'notebook.cell.execute';
    const CANCEL_CELL_COMMAND_ID = 'notebook.cell.cancelExecution';
    const EXECUTE_CELL_SELECT_BELOW = 'notebook.cell.executeAndSelectBelow';
    const EXECUTE_CELL_INSERT_BELOW = 'notebook.cell.executeAndInsertBelow';
    const CLEAR_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.clearOutputs';
    const CHANGE_CELL_LANGUAGE = 'notebook.cell.changeLanguage';
    const CENTER_ACTIVE_CELL = 'notebook.centerActiveCell';
    const FOCUS_IN_OUTPUT_COMMAND_ID = 'notebook.cell.focusInOutput';
    const FOCUS_OUT_OUTPUT_COMMAND_ID = 'notebook.cell.focusOutOutput';
    exports.NOTEBOOK_ACTIONS_CATEGORY = nls_1.localize('notebookActions.category', "Notebook");
    exports.CELL_TITLE_GROUP_ID = 'inline';
    const EDITOR_WIDGET_ACTION_WEIGHT = 100 /* EditorContrib */; // smaller than Suggest Widget, etc
    var CellToolbarOrder;
    (function (CellToolbarOrder) {
        CellToolbarOrder[CellToolbarOrder["EditCell"] = 0] = "EditCell";
        CellToolbarOrder[CellToolbarOrder["SplitCell"] = 1] = "SplitCell";
        CellToolbarOrder[CellToolbarOrder["SaveCell"] = 2] = "SaveCell";
        CellToolbarOrder[CellToolbarOrder["ClearCellOutput"] = 3] = "ClearCellOutput";
        CellToolbarOrder[CellToolbarOrder["DeleteCell"] = 4] = "DeleteCell";
    })(CellToolbarOrder || (CellToolbarOrder = {}));
    class NotebookAction extends actions_1.Action2 {
        constructor(desc) {
            if (desc.f1 !== false) {
                desc.f1 = false;
                const f1Menu = {
                    id: actions_1.MenuId.CommandPalette,
                    when: notebookBrowser_1.NOTEBOOK_IS_ACTIVE_EDITOR
                };
                if (!desc.menu) {
                    desc.menu = [];
                }
                else if (!Array.isArray(desc.menu)) {
                    desc.menu = [desc.menu];
                }
                desc.menu = [
                    ...desc.menu,
                    f1Menu
                ];
            }
            desc.category = exports.NOTEBOOK_ACTIONS_CATEGORY;
            super(desc);
        }
        async run(accessor, context) {
            if (!this.isCellActionContext(context)) {
                context = this.getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            this.runWithContext(accessor, context);
        }
        isCellActionContext(context) {
            return context && !!context.cell && !!context.notebookEditor;
        }
        getActiveCellContext(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const activeCell = editor.getActiveCell();
            if (!activeCell) {
                return;
            }
            return {
                cell: activeCell,
                notebookEditor: editor
            };
        }
    }
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: EXECUTE_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.execute', "Execute Cell"),
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 256 /* WinCtrl */ | 3 /* Enter */,
                    win: {
                        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 3 /* Enter */
                    },
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
                icon: { id: 'codicon/play' },
            });
        }
        async runWithContext(accessor, context) {
            return runCell(context);
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CANCEL_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.cancel', "Stop Cell Execution"),
                icon: { id: 'codicon/primitive-square' },
            });
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.cancelNotebookCellExecution(context.cell);
        }
    });
    let ExecuteCellAction = class ExecuteCellAction extends actions_1.MenuItemAction {
        constructor(contextKeyService, commandService) {
            super({
                id: EXECUTE_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.executeCell', "Execute Cell"),
                icon: { id: 'codicon/play' }
            }, undefined, { shouldForwardArgs: true }, contextKeyService, commandService);
        }
    };
    ExecuteCellAction = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService)
    ], ExecuteCellAction);
    exports.ExecuteCellAction = ExecuteCellAction;
    let CancelCellAction = class CancelCellAction extends actions_1.MenuItemAction {
        constructor(contextKeyService, commandService) {
            super({
                id: CANCEL_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.CancelCell', "Cancel Execution"),
                icon: { id: 'codicon/primitive-square' }
            }, undefined, { shouldForwardArgs: true }, contextKeyService, commandService);
        }
    };
    CancelCellAction = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService)
    ], CancelCellAction);
    exports.CancelCellAction = CancelCellAction;
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: EXECUTE_CELL_SELECT_BELOW,
                title: nls_1.localize('notebookActions.executeAndSelectBelow', "Execute Notebook Cell and Select Below"),
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 1024 /* Shift */ | 3 /* Enter */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            var _a, _b;
            const idx = (_a = context.notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(context.cell);
            if (typeof idx !== 'number') {
                return;
            }
            const newFocusMode = context.cell.focusMode === notebookBrowser_1.CellFocusMode.Editor ? 'editor' : 'container';
            const executionP = runCell(context);
            // Try to select below, fall back on inserting
            const nextCell = (_b = context.notebookEditor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx + 1];
            if (nextCell) {
                context.notebookEditor.focusNotebookCell(nextCell, newFocusMode);
            }
            else {
                const newCell = context.notebookEditor.insertNotebookCell(context.cell, notebookCommon_1.CellKind.Code, 'below');
                if (newCell) {
                    context.notebookEditor.focusNotebookCell(newCell, newFocusMode);
                }
            }
            return executionP;
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: EXECUTE_CELL_INSERT_BELOW,
                title: nls_1.localize('notebookActions.executeAndInsertBelow', "Execute Notebook Cell and Insert Below"),
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 512 /* Alt */ | 3 /* Enter */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const newFocusMode = context.cell.focusMode === notebookBrowser_1.CellFocusMode.Editor ? 'editor' : 'container';
            const executionP = runCell(context);
            const newCell = context.notebookEditor.insertNotebookCell(context.cell, notebookCommon_1.CellKind.Code, 'below');
            if (newCell) {
                context.notebookEditor.focusNotebookCell(newCell, newFocusMode);
            }
            return executionP;
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: RENDER_ALL_MARKDOWN_CELLS,
                title: nls_1.localize('notebookActions.renderMarkdown', "Render All Markdown Cells"),
            });
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: EXECUTE_NOTEBOOK_COMMAND_ID,
                title: nls_1.localize('notebookActions.executeNotebook', "Execute Notebook"),
            });
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
            return context.notebookEditor.executeNotebook();
        }
    });
    function renderAllMarkdownCells(context) {
        context.notebookEditor.viewModel.viewCells.forEach(cell => {
            if (cell.cellKind === notebookCommon_1.CellKind.Markdown) {
                cell.editState = notebookBrowser_1.CellEditState.Preview;
            }
        });
    }
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CANCEL_NOTEBOOK_COMMAND_ID,
                title: nls_1.localize('notebookActions.cancelNotebook', "Cancel Notebook Execution"),
            });
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.cancelNotebookExecution();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: EXECUTE_NOTEBOOK_COMMAND_ID,
            title: nls_1.localize('notebookActions.menu.executeNotebook', "Execute Notebook (Run all cells)"),
            icon: { id: 'codicon/run-all' }
        },
        order: -1,
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK.toNegated(), notebookBrowser_1.NOTEBOOK_EDITOR_RUNNABLE)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: CANCEL_NOTEBOOK_COMMAND_ID,
            title: nls_1.localize('notebookActions.menu.cancelNotebook', "Stop Notebook Execution"),
            icon: { id: 'codicon/primitive-square' }
        },
        order: -1,
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK)
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CHANGE_CELL_TO_CODE_COMMAND_ID,
                title: nls_1.localize('notebookActions.changeCellToCode', "Change Cell to Code"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 55 /* KEY_Y */,
                    weight: 200 /* WorkbenchContrib */
                },
                precondition: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_IS_ACTIVE_EDITOR),
            });
        }
        async runWithContext(accessor, context) {
            await changeCellToKind(notebookCommon_1.CellKind.Code, context);
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CHANGE_CELL_TO_MARKDOWN_COMMAND_ID,
                title: nls_1.localize('notebookActions.changeCellToMarkdown', "Change Cell to Markdown"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 43 /* KEY_M */,
                    weight: 200 /* WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            await changeCellToKind(notebookCommon_1.CellKind.Markdown, context);
        }
    });
    function getActiveNotebookEditor(editorService) {
        // TODO can `isNotebookEditor` be on INotebookEditor to avoid a circular dependency?
        const activeEditorPane = editorService.activeEditorPane;
        return (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) ? activeEditorPane.getControl() : undefined;
    }
    exports.getActiveNotebookEditor = getActiveNotebookEditor;
    async function runCell(context) {
        var _a;
        if (((_a = context.cell.metadata) === null || _a === void 0 ? void 0 : _a.runState) === notebookCommon_1.NotebookCellRunState.Running) {
            return;
        }
        return context.notebookEditor.executeNotebookCell(context.cell);
    }
    async function changeCellToKind(kind, context, language) {
        var _a, _b;
        const { cell, notebookEditor } = context;
        if (cell.cellKind === kind) {
            return null;
        }
        const text = cell.getText();
        if (!notebookEditor.insertNotebookCell(cell, kind, 'below', text)) {
            return null;
        }
        const idx = (_a = notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(cell);
        if (typeof idx !== 'number') {
            return null;
        }
        const newCell = (_b = notebookEditor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx + 1];
        if (!newCell) {
            return null;
        }
        if (language) {
            newCell.model.language = language;
        }
        await notebookEditor.focusNotebookCell(newCell, cell.editState === notebookBrowser_1.CellEditState.Editing ? 'editor' : 'container');
        notebookEditor.deleteNotebookCell(cell);
        return newCell;
    }
    exports.changeCellToKind = changeCellToKind;
    class InsertCellCommand extends NotebookAction {
        constructor(desc, kind, direction) {
            super(desc);
            this.kind = kind;
            this.direction = direction;
        }
        async runWithContext(accessor, context) {
            const newCell = context.notebookEditor.insertNotebookCell(context.cell, this.kind, this.direction, undefined, context.ui);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
    }
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertCodeCellAbove', "Insert Code Cell Above"),
                keybinding: {
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 3 /* Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* WorkbenchContrib */
                },
            }, notebookCommon_1.CellKind.Code, 'above');
        }
    });
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertCodeCellBelow', "Insert Code Cell Below"),
                keybinding: {
                    primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* WorkbenchContrib */
                },
            }, notebookCommon_1.CellKind.Code, 'below');
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            title: nls_1.localize('notebookActions.menu.insertCode', "$(add) Code")
        },
        order: 0,
        group: 'inline'
    });
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertMarkdownCellAbove', "Insert Markdown Cell Above"),
            }, notebookCommon_1.CellKind.Markdown, 'above');
        }
    });
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertMarkdownCellBelow', "Insert Markdown Cell Below"),
            }, notebookCommon_1.CellKind.Markdown, 'below');
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
            title: nls_1.localize('notebookActions.menu.insertMarkdown', "$(add) Markdown")
        },
        order: 1,
        group: 'inline'
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: EDIT_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.editCell', "Edit Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 3 /* Enter */,
                    weight: 200 /* WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_CELL_TYPE.isEqualTo('markdown'), notebookBrowser_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.toNegated(), notebookBrowser_1.NOTEBOOK_CELL_EDITABLE),
                    order: 0 /* EditCell */,
                    group: exports.CELL_TITLE_GROUP_ID
                },
                icon: { id: 'codicon/pencil' }
            });
        }
        async runWithContext(accessor, context) {
            context.notebookEditor.focusNotebookCell(context.cell, 'editor');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: QUIT_EDIT_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.quitEdit', "Stop Editing Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_CELL_TYPE.isEqualTo('markdown'), notebookBrowser_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE, notebookBrowser_1.NOTEBOOK_CELL_EDITABLE),
                    order: 2 /* SaveCell */,
                    group: exports.CELL_TITLE_GROUP_ID
                },
                icon: { id: 'codicon/check' },
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext, editorContextKeys_1.EditorContextKeys.hoverVisible.toNegated(), editorContextKeys_1.EditorContextKeys.hasNonEmptySelection.toNegated()),
                    primary: 9 /* Escape */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT - 5
                },
            });
        }
        async runWithContext(accessor, context) {
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markdown) {
                context.cell.editState = notebookBrowser_1.CellEditState.Preview;
            }
            return context.notebookEditor.focusNotebookCell(context.cell, 'container');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: DELETE_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.deleteCell', "Delete Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    order: 4 /* DeleteCell */,
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_EDITABLE,
                    group: exports.CELL_TITLE_GROUP_ID
                },
                keybinding: {
                    primary: 20 /* Delete */,
                    mac: {
                        primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
                    },
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    weight: 200 /* WorkbenchContrib */
                },
                icon: { id: 'codicon/trash' },
            });
        }
        async runWithContext(accessor, context) {
            const index = context.notebookEditor.viewModel.getCellIndex(context.cell);
            const result = await context.notebookEditor.deleteNotebookCell(context.cell);
            if (result) {
                // deletion succeeds, move focus to the next cell
                const nextCellIdx = index < context.notebookEditor.viewModel.length ? index : context.notebookEditor.viewModel.length - 1;
                if (nextCellIdx >= 0) {
                    await context.notebookEditor.focusNotebookCell(context.notebookEditor.viewModel.viewCells[nextCellIdx], 'container');
                }
                else {
                    // No cells left, insert a new empty one
                    const newCell = context.notebookEditor.insertNotebookCell(undefined, context.cell.cellKind);
                    if (newCell) {
                        await context.notebookEditor.focusNotebookCell(newCell, 'editor');
                    }
                }
            }
        }
    });
    async function moveCell(context, direction) {
        const result = direction === 'up' ?
            await context.notebookEditor.moveCellUp(context.cell) :
            await context.notebookEditor.moveCellDown(context.cell);
        if (result) {
            // move cell command only works when the cell container has focus
            await context.notebookEditor.focusNotebookCell(context.cell, 'container');
        }
    }
    async function copyCell(context, direction) {
        const text = context.cell.getText();
        const newCellDirection = direction === 'up' ? 'above' : 'below';
        const newCell = context.notebookEditor.insertNotebookCell(context.cell, context.cell.cellKind, newCellDirection, text);
        if (newCell) {
            await context.notebookEditor.focusNotebookCell(newCell, 'container');
        }
    }
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: MOVE_CELL_UP_COMMAND_ID,
                title: nls_1.localize('notebookActions.moveCellUp', "Move Cell Up"),
                icon: { id: 'codicon/arrow-up' },
                keybinding: {
                    primary: 512 /* Alt */ | 16 /* UpArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            return moveCell(context, 'up');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: MOVE_CELL_DOWN_COMMAND_ID,
                title: nls_1.localize('notebookActions.moveCellDown', "Move Cell Down"),
                icon: { id: 'codicon/arrow-down' },
                keybinding: {
                    primary: 512 /* Alt */ | 18 /* DownArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            return moveCell(context, 'down');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: COPY_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.copy', "Copy Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const notebookService = accessor.get(notebookService_1.INotebookService);
            clipboardService.writeText(context.cell.getText());
            notebookService.setToCopy([context.cell.model]);
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CUT_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.cut', "Cut Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const notebookService = accessor.get(notebookService_1.INotebookService);
            clipboardService.writeText(context.cell.getText());
            const viewModel = context.notebookEditor.viewModel;
            if (!viewModel) {
                return;
            }
            viewModel.deleteCell(viewModel.getCellIndex(context.cell), true);
            notebookService.setToCopy([context.cell.model]);
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: PASTE_CELL_ABOVE_COMMAND_ID,
                title: nls_1.localize('notebookActions.pasteAbove', "Paste Cell Above"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 52 /* KEY_V */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy() || [];
            const viewModel = context.notebookEditor.viewModel;
            if (!viewModel) {
                return;
            }
            const currCellIndex = viewModel.getCellIndex(context.cell);
            pasteCells.reverse().forEach(pasteCell => {
                viewModel.insertCell(currCellIndex, pasteCell, true);
                return;
            });
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: PASTE_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.paste', "Paste Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy() || [];
            const viewModel = context.notebookEditor.viewModel;
            if (!viewModel) {
                return;
            }
            const currCellIndex = viewModel.getCellIndex(context.cell);
            pasteCells.reverse().forEach(pasteCell => {
                viewModel.insertCell(currCellIndex + 1, pasteCell, true);
                return;
            });
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: COPY_CELL_UP_COMMAND_ID,
                title: nls_1.localize('notebookActions.copyCellUp', "Copy Cell Up"),
                keybinding: {
                    primary: 512 /* Alt */ | 1024 /* Shift */ | 16 /* UpArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            return copyCell(context, 'up');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: COPY_CELL_DOWN_COMMAND_ID,
                title: nls_1.localize('notebookActions.copyCellDown', "Copy Cell Down"),
                keybinding: {
                    primary: 512 /* Alt */ | 1024 /* Shift */ | 18 /* DownArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            return copyCell(context, 'down');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_NEXT_EDITOR,
                title: nls_1.localize('cursorMoveDown', 'Focus Next Cell Editor'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('top'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')),
                        primary: 18 /* DownArrow */,
                        weight: EDITOR_WIDGET_ACTION_WEIGHT
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_OUTPUT_FOCUSED),
                        primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */,
                        mac: { primary: 256 /* WinCtrl */ | 2048 /* CtrlCmd */ | 18 /* DownArrow */, },
                        weight: 200 /* WorkbenchContrib */
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            var _a, _b;
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = (_a = editor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            const newCell = (_b = editor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx + 1];
            if (!newCell) {
                return;
            }
            await editor.focusNotebookCell(newCell, 'editor');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_PREVIOUS_EDITOR,
                title: nls_1.localize('cursorMoveUp', 'Focus Previous Cell Editor'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('bottom'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')),
                    primary: 16 /* UpArrow */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            var _a, _b;
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = (_a = editor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            if (idx < 1) {
                // we don't do loop
                return;
            }
            const newCell = (_b = editor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx - 1];
            if (!newCell) {
                return;
            }
            await editor.focusNotebookCell(newCell, 'editor');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: FOCUS_IN_OUTPUT_COMMAND_ID,
                title: nls_1.localize('focusOutput', 'Focus In Active Cell Output'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_CELL_HAS_OUTPUTS),
                    primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */,
                    mac: { primary: 256 /* WinCtrl */ | 2048 /* CtrlCmd */ | 18 /* DownArrow */, },
                    weight: 200 /* WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            editor.focusNotebookCell(activeCell, 'output');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: FOCUS_OUT_OUTPUT_COMMAND_ID,
                title: nls_1.localize('focusOutputOut', 'Focus Out Active Cell Output'),
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */,
                    mac: { primary: 256 /* WinCtrl */ | 2048 /* CtrlCmd */ | 16 /* UpArrow */, },
                    weight: 200 /* WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            await editor.focusNotebookCell(activeCell, 'editor');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_UNDO,
                title: nls_1.localize('undo', 'Undo'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 56 /* KEY_Z */,
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            var _a;
            await ((_a = context.notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.undo());
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_REDO,
                title: nls_1.localize('redo', 'Redo'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */,
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            var _a;
            await ((_a = context.notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.redo());
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_TOP,
                title: nls_1.localize('focusFirstCell', 'Focus First Cell'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 14 /* Home */,
                    mac: { primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */ },
                    weight: 200 /* WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            const firstCell = editor.viewModel.viewCells[0];
            await editor.focusNotebookCell(firstCell, 'container');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_BOTTOM,
                title: nls_1.localize('focusLastCell', 'Focus Last Cell'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 13 /* End */,
                    mac: { primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */ },
                    weight: 200 /* WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            const firstCell = editor.viewModel.viewCells[editor.viewModel.length - 1];
            await editor.focusNotebookCell(firstCell, 'container');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CLEAR_CELL_OUTPUTS_COMMAND_ID,
                title: nls_1.localize('clearActiveCellOutputs', 'Clear Active Cell Outputs'),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), notebookBrowser_1.NOTEBOOK_EDITOR_RUNNABLE),
                    order: 3 /* ClearCellOutput */,
                    group: exports.CELL_TITLE_GROUP_ID
                },
                icon: { id: 'codicon/clear-all' },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            editor.viewModel.notebookDocument.clearCellOutput(context.cell.handle);
        }
    });
    class ChangeCellLanguageAction extends NotebookAction {
        constructor() {
            super({
                id: CHANGE_CELL_LANGUAGE,
                title: nls_1.localize('changeLanguage', 'Change Cell Language'),
            });
        }
        async runWithContext(accessor, context) {
            this.showLanguagePicker(accessor, context);
        }
        async showLanguagePicker(accessor, context) {
            var _a, _b;
            const topItems = [];
            const mainItems = [];
            const modeService = accessor.get(modeService_1.IModeService);
            const modelService = accessor.get(modelService_1.IModelService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const providerLanguages = [...context.notebookEditor.viewModel.notebookDocument.languages, 'markdown'];
            providerLanguages.forEach(languageId => {
                let description;
                if (languageId === context.cell.language) {
                    description = nls_1.localize('languageDescription', "({0}) - Current Language", languageId);
                }
                else {
                    description = nls_1.localize('languageDescriptionConfigured', "({0})", languageId);
                }
                const languageName = modeService.getLanguageName(languageId);
                if (!languageName) {
                    // Notebook has unrecognized language
                    return;
                }
                const item = {
                    label: languageName,
                    iconClasses: getIconClasses_1.getIconClasses(modelService, modeService, this.getFakeResource(languageName, modeService)),
                    description,
                    languageId
                };
                if (languageId === 'markdown' || languageId === context.cell.language) {
                    topItems.push(item);
                }
                else {
                    mainItems.push(item);
                }
            });
            mainItems.sort((a, b) => {
                return a.description.localeCompare(b.description);
            });
            const picks = [
                ...topItems,
                { type: 'separator' },
                ...mainItems
            ];
            const selection = await quickInputService.pick(picks, { placeHolder: nls_1.localize('pickLanguageToConfigure', "Select Language Mode") });
            if (selection && selection.languageId) {
                if (selection.languageId === 'markdown' && ((_a = context.cell) === null || _a === void 0 ? void 0 : _a.language) !== 'markdown') {
                    const newCell = await changeCellToKind(notebookCommon_1.CellKind.Markdown, { cell: context.cell, notebookEditor: context.notebookEditor });
                    if (newCell) {
                        await context.notebookEditor.focusNotebookCell(newCell, 'editor');
                    }
                }
                else if (selection.languageId !== 'markdown' && ((_b = context.cell) === null || _b === void 0 ? void 0 : _b.language) === 'markdown') {
                    await changeCellToKind(notebookCommon_1.CellKind.Code, { cell: context.cell, notebookEditor: context.notebookEditor }, selection.languageId);
                }
                else {
                    context.notebookEditor.viewModel.notebookDocument.changeCellLanguage(context.cell.handle, selection.languageId);
                }
            }
        }
        /**
         * Copied from editorStatus.ts
         */
        getFakeResource(lang, modeService) {
            let fakeResource;
            const extensions = modeService.getExtensions(lang);
            if (extensions === null || extensions === void 0 ? void 0 : extensions.length) {
                fakeResource = uri_1.URI.file(extensions[0]);
            }
            else {
                const filenames = modeService.getFilenames(lang);
                if (filenames === null || filenames === void 0 ? void 0 : filenames.length) {
                    fakeResource = uri_1.URI.file(filenames[0]);
                }
            }
            return fakeResource;
        }
    }
    exports.ChangeCellLanguageAction = ChangeCellLanguageAction;
    actions_1.registerAction2(ChangeCellLanguageAction);
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID,
                title: nls_1.localize('clearAllCellsOutputs', 'Clear All Cells Outputs'),
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    group: 'navigation',
                    order: 0
                },
                icon: { id: 'codicon/clear-all' },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            editor.viewModel.notebookDocument.clearAllCellOutputs();
        }
    });
    async function splitCell(context) {
        if (context.cell.cellKind === notebookCommon_1.CellKind.Code) {
            const newCells = await context.notebookEditor.splitNotebookCell(context.cell);
            if (newCells) {
                await context.notebookEditor.focusNotebookCell(newCells[newCells.length - 1], 'editor');
            }
        }
    }
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: SPLIT_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.splitCell', "Split Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), notebookBrowser_1.NOTEBOOK_EDITOR_EDITABLE, notebookBrowser_1.NOTEBOOK_CELL_EDITABLE, contextkeys_1.InputFocusedContext),
                    order: 1 /* SplitCell */,
                    group: exports.CELL_TITLE_GROUP_ID
                },
                icon: { id: 'codicon/split-vertical' },
            });
        }
        async runWithContext(accessor, context) {
            return splitCell(context);
        }
    });
    async function joinCells(context, direction) {
        const cell = await context.notebookEditor.joinNotebookCells(context.cell, direction, notebookCommon_1.CellKind.Code);
        if (cell) {
            await context.notebookEditor.focusNotebookCell(cell, 'editor');
        }
    }
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: JOIN_CELL_ABOVE_COMMAND_ID,
                title: nls_1.localize('notebookActions.joinCellAbove', "Join with Previous Cell"),
            });
        }
        async runWithContext(accessor, context) {
            return joinCells(context, 'above');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: JOIN_CELL_BELOW_COMMAND_ID,
                title: nls_1.localize('notebookActions.joinCellBelow', "Join with Next Cell"),
            });
        }
        async runWithContext(accessor, context) {
            return joinCells(context, 'below');
        }
    });
    actions_1.registerAction2(class extends NotebookAction {
        constructor() {
            super({
                id: CENTER_ACTIVE_CELL,
                title: nls_1.localize('notebookActions.centerActiveCell', "Center Active Cell"),
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 2048 /* CtrlCmd */ | 42 /* KEY_L */,
                    mac: {
                        primary: 256 /* WinCtrl */ | 42 /* KEY_L */,
                    },
                    weight: 200 /* WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.revealInCenter(context.cell);
        }
    });
});
//# __sourceMappingURL=coreActions.js.map