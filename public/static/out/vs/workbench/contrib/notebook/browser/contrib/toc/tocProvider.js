/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/codicons"], function (require, exports, gotoSymbolQuickAccess_1, notebookEditor_1, notebookCommon_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    gotoSymbolQuickAccess_1.TableOfContentsProviderRegistry.register(notebookEditor_1.NotebookEditor.ID, new class {
        async provideTableOfContents(editor) {
            if (!editor.viewModel) {
                return undefined;
            }
            // return an entry per markdown header
            const notebookWidget = editor.getControl();
            const result = [];
            for (const cell of editor.viewModel.viewCells) {
                const content = cell.getText();
                const regexp = cell.cellKind === notebookCommon_1.CellKind.Markdown
                    ? /^[ \t]*(\#+)(.+)$/gm // md: header
                    : /^.*\w+.*\w*$/m; // code: none empty line
                const matches = content.match(regexp);
                if (matches && matches.length) {
                    for (let j = 0; j < matches.length; j++) {
                        result.push({
                            icon: cell.cellKind === notebookCommon_1.CellKind.Markdown ? codicons_1.Codicon.markdown : codicons_1.Codicon.code,
                            label: matches[j].replace(/^[ \t]*(\#+)/, ''),
                            pick() {
                                notebookWidget === null || notebookWidget === void 0 ? void 0 : notebookWidget.revealInCenterIfOutsideViewport(cell);
                                notebookWidget === null || notebookWidget === void 0 ? void 0 : notebookWidget.selectElement(cell);
                                notebookWidget === null || notebookWidget === void 0 ? void 0 : notebookWidget.focusNotebookCell(cell, cell.cellKind === notebookCommon_1.CellKind.Markdown ? 'container' : 'editor');
                            },
                            preview() {
                                notebookWidget === null || notebookWidget === void 0 ? void 0 : notebookWidget.revealInCenterIfOutsideViewport(cell);
                                notebookWidget === null || notebookWidget === void 0 ? void 0 : notebookWidget.selectElement(cell);
                            }
                        });
                    }
                }
            }
            return result;
        }
    });
});
//# __sourceMappingURL=tocProvider.js.map