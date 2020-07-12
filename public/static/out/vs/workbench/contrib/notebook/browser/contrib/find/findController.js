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
define(["require", "exports", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/contrib/find/findDecorations", "vs/editor/common/viewModel/prefixSumComputer", "vs/workbench/contrib/codeEditor/browser/find/simpleFindReplaceWidget", "vs/platform/theme/common/themeService", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/platform/actions/common/actions", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/contrib/coreActions"], function (require, exports, contextView_1, contextkey_1, notebookBrowser_1, findDecorations_1, prefixSumComputer_1, simpleFindReplaceWidget_1, themeService_1, DOM, notebookEditorExtensions_1, actions_1, nls_1, editorService_1, coreActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFindWidget = void 0;
    let NotebookFindWidget = class NotebookFindWidget extends simpleFindReplaceWidget_1.SimpleFindReplaceWidget {
        constructor(_notebookEditor, contextViewService, contextKeyService, themeService) {
            super(contextViewService, contextKeyService, themeService);
            this._notebookEditor = _notebookEditor;
            this._findMatches = [];
            this._findMatchesStarts = null;
            this._currentMatch = -1;
            this._allMatchesDecorations = [];
            this._currentMatchDecorations = [];
            DOM.append(this._notebookEditor.getDomNode(), this.getDomNode());
            this._findWidgetFocused = notebookBrowser_1.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED.bindTo(contextKeyService);
            this._register(this._findInput.onKeyDown((e) => this._onFindInputKeyDown(e)));
            this.updateTheme(themeService.getColorTheme());
        }
        _onFindInputKeyDown(e) {
            if (e.equals(3 /* Enter */)) {
                if (this._findMatches.length) {
                    this.find(false);
                }
                else {
                    this.set(null);
                }
                e.preventDefault();
                return;
            }
            else if (e.equals(1024 /* Shift */ | 3 /* Enter */)) {
                if (this._findMatches.length) {
                    this.find(true);
                }
                else {
                    this.set(null);
                }
                e.preventDefault();
                return;
            }
        }
        onInputChanged() {
            const val = this.inputValue;
            if (val) {
                this._findMatches = this._notebookEditor.viewModel.find(val).filter(match => match.matches.length > 0);
                if (this._findMatches.length) {
                    return true;
                }
                else {
                    return false;
                }
            }
            return false;
        }
        find(previous) {
            if (!this._findMatches.length) {
                return;
            }
            if (!this._findMatchesStarts) {
                this.set(this._findMatches);
            }
            else {
                const totalVal = this._findMatchesStarts.getTotalValue();
                const nextVal = (this._currentMatch + (previous ? -1 : 1) + totalVal) % totalVal;
                this._currentMatch = nextVal;
            }
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            this.setCurrentFindMatchDecoration(nextIndex.index, nextIndex.remainder);
            this.revealCellRange(nextIndex.index, nextIndex.remainder);
        }
        replaceOne() {
            if (!this._findMatches.length) {
                return;
            }
            if (!this._findMatchesStarts) {
                this.set(this._findMatches);
            }
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            const cell = this._findMatches[nextIndex.index].cell;
            const match = this._findMatches[nextIndex.index].matches[nextIndex.remainder];
            this._progressBar.infinite().show();
            this._notebookEditor.viewModel.replaceOne(cell, match.range, this.replaceValue).then(() => {
                this._progressBar.stop();
            });
        }
        replaceAll() {
            this._progressBar.infinite().show();
            this._notebookEditor.viewModel.replaceAll(this._findMatches, this.replaceValue).then(() => {
                this._progressBar.stop();
            });
        }
        revealCellRange(cellIndex, matchIndex) {
            this._findMatches[cellIndex].cell.editState = notebookBrowser_1.CellEditState.Editing;
            this._notebookEditor.selectElement(this._findMatches[cellIndex].cell);
            this._notebookEditor.setCellSelection(this._findMatches[cellIndex].cell, this._findMatches[cellIndex].matches[matchIndex].range);
            this._notebookEditor.revealRangeInCenterIfOutsideViewportAsync(this._findMatches[cellIndex].cell, this._findMatches[cellIndex].matches[matchIndex].range);
        }
        hide() {
            super.hide();
            this.set([]);
        }
        findFirst() { }
        onFocusTrackerFocus() {
            this._findWidgetFocused.set(true);
        }
        onFocusTrackerBlur() {
            this._findWidgetFocused.reset();
        }
        onReplaceInputFocusTrackerFocus() {
            // throw new Error('Method not implemented.');
        }
        onReplaceInputFocusTrackerBlur() {
            // throw new Error('Method not implemented.');
        }
        onFindInputFocusTrackerFocus() { }
        onFindInputFocusTrackerBlur() { }
        constructFindMatchesStarts() {
            if (this._findMatches && this._findMatches.length) {
                const values = new Uint32Array(this._findMatches.length);
                for (let i = 0; i < this._findMatches.length; i++) {
                    values[i] = this._findMatches[i].matches.length;
                }
                this._findMatchesStarts = new prefixSumComputer_1.PrefixSumComputer(values);
            }
            else {
                this._findMatchesStarts = null;
            }
        }
        set(cellFindMatches) {
            if (!cellFindMatches || !cellFindMatches.length) {
                this._findMatches = [];
                this.setAllFindMatchesDecorations([]);
                this.constructFindMatchesStarts();
                this._currentMatch = -1;
                this.clearCurrentFindMatchDecoration();
                return;
            }
            // all matches
            this._findMatches = cellFindMatches;
            this.setAllFindMatchesDecorations(cellFindMatches || []);
            // current match
            this.constructFindMatchesStarts();
            this._currentMatch = 0;
            this.setCurrentFindMatchDecoration(0, 0);
        }
        setCurrentFindMatchDecoration(cellIndex, matchIndex) {
            this._notebookEditor.changeDecorations(accessor => {
                const findMatchesOptions = findDecorations_1.FindDecorations._CURRENT_FIND_MATCH_DECORATION;
                const cell = this._findMatches[cellIndex].cell;
                const match = this._findMatches[cellIndex].matches[matchIndex];
                const decorations = [
                    { range: match.range, options: findMatchesOptions }
                ];
                const deltaDecoration = {
                    ownerId: cell.handle,
                    decorations: decorations
                };
                this._currentMatchDecorations = accessor.deltaDecorations(this._currentMatchDecorations, [deltaDecoration]);
            });
        }
        clearCurrentFindMatchDecoration() {
            this._notebookEditor.changeDecorations(accessor => {
                this._currentMatchDecorations = accessor.deltaDecorations(this._currentMatchDecorations, []);
            });
        }
        setAllFindMatchesDecorations(cellFindMatches) {
            this._notebookEditor.changeDecorations((accessor) => {
                let findMatchesOptions = findDecorations_1.FindDecorations._FIND_MATCH_DECORATION;
                let deltaDecorations = cellFindMatches.map(cellFindMatch => {
                    const findMatches = cellFindMatch.matches;
                    // Find matches
                    let newFindMatchesDecorations = new Array(findMatches.length);
                    for (let i = 0, len = findMatches.length; i < len; i++) {
                        newFindMatchesDecorations[i] = {
                            range: findMatches[i].range,
                            options: findMatchesOptions
                        };
                    }
                    return { ownerId: cellFindMatch.cell.handle, decorations: newFindMatchesDecorations };
                });
                this._allMatchesDecorations = accessor.deltaDecorations(this._allMatchesDecorations, deltaDecorations);
            });
        }
        clear() {
            this._currentMatch = -1;
            this._findMatches = [];
        }
    };
    NotebookFindWidget.id = 'workbench.notebook.find';
    NotebookFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService)
    ], NotebookFindWidget);
    exports.NotebookFindWidget = NotebookFindWidget;
    notebookEditorExtensions_1.registerNotebookContribution(NotebookFindWidget.id, NotebookFindWidget);
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.hideFind',
                title: nls_1.localize('notebookActions.hideFind', "Hide Find in Notebook"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED),
                    primary: 9 /* Escape */,
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            let editorService = accessor.get(editorService_1.IEditorService);
            let editor = coreActions_1.getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(NotebookFindWidget.id);
            controller.hide();
            editor.focus();
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.find',
                title: nls_1.localize('notebookActions.findInNotebook', "Find in Notebook"),
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 36 /* KEY_F */ | 2048 /* CtrlCmd */,
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            let editorService = accessor.get(editorService_1.IEditorService);
            let editor = coreActions_1.getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(NotebookFindWidget.id);
            controller.show();
        }
    });
});
//# __sourceMappingURL=findController.js.map