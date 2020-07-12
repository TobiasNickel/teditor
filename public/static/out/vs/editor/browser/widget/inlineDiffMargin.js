/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/base/common/codicons"], function (require, exports, nls, dom, actions_1, lifecycle_1, range_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineDiffMargin = void 0;
    class InlineDiffMargin extends lifecycle_1.Disposable {
        constructor(_viewZoneId, _marginDomNode, editor, diff, _contextMenuService, _clipboardService) {
            super();
            this._viewZoneId = _viewZoneId;
            this._marginDomNode = _marginDomNode;
            this.editor = editor;
            this.diff = diff;
            this._contextMenuService = _contextMenuService;
            this._clipboardService = _clipboardService;
            this._visibility = false;
            // make sure the diff margin shows above overlay.
            this._marginDomNode.style.zIndex = '10';
            this._diffActions = document.createElement('div');
            this._diffActions.className = codicons_1.Codicon.lightBulb.classNames + ' lightbulb-glyph';
            this._diffActions.style.position = 'absolute';
            const lineHeight = editor.getOption(51 /* lineHeight */);
            const lineFeed = editor.getModel().getEOL();
            this._diffActions.style.right = '0px';
            this._diffActions.style.visibility = 'hidden';
            this._diffActions.style.height = `${lineHeight}px`;
            this._diffActions.style.lineHeight = `${lineHeight}px`;
            this._marginDomNode.appendChild(this._diffActions);
            const actions = [];
            // default action
            actions.push(new actions_1.Action('diff.clipboard.copyDeletedContent', diff.originalEndLineNumber > diff.modifiedStartLineNumber
                ? nls.localize('diff.clipboard.copyDeletedLinesContent.label', "Copy deleted lines")
                : nls.localize('diff.clipboard.copyDeletedLinesContent.single.label', "Copy deleted line"), undefined, true, async () => {
                await this._clipboardService.writeText(diff.originalContent.join(lineFeed) + lineFeed);
            }));
            let currentLineNumberOffset = 0;
            let copyLineAction = undefined;
            if (diff.originalEndLineNumber > diff.modifiedStartLineNumber) {
                copyLineAction = new actions_1.Action('diff.clipboard.copyDeletedLineContent', nls.localize('diff.clipboard.copyDeletedLineContent.label', "Copy deleted line ({0})", diff.originalStartLineNumber), undefined, true, async () => {
                    await this._clipboardService.writeText(diff.originalContent[currentLineNumberOffset]);
                });
                actions.push(copyLineAction);
            }
            const readOnly = editor.getOption(72 /* readOnly */);
            if (!readOnly) {
                actions.push(new actions_1.Action('diff.inline.revertChange', nls.localize('diff.inline.revertChange.label', "Revert this change"), undefined, true, async () => {
                    if (diff.modifiedEndLineNumber === 0) {
                        // deletion only
                        const column = editor.getModel().getLineMaxColumn(diff.modifiedStartLineNumber);
                        editor.executeEdits('diffEditor', [
                            {
                                range: new range_1.Range(diff.modifiedStartLineNumber, column, diff.modifiedStartLineNumber, column),
                                text: lineFeed + diff.originalContent.join(lineFeed)
                            }
                        ]);
                    }
                    else {
                        const column = editor.getModel().getLineMaxColumn(diff.modifiedEndLineNumber);
                        editor.executeEdits('diffEditor', [
                            {
                                range: new range_1.Range(diff.modifiedStartLineNumber, 1, diff.modifiedEndLineNumber, column),
                                text: diff.originalContent.join(lineFeed)
                            }
                        ]);
                    }
                }));
            }
            const showContextMenu = (x, y) => {
                this._contextMenuService.showContextMenu({
                    getAnchor: () => {
                        return {
                            x,
                            y
                        };
                    },
                    getActions: () => {
                        if (copyLineAction) {
                            copyLineAction.label = nls.localize('diff.clipboard.copyDeletedLineContent.label', "Copy deleted line ({0})", diff.originalStartLineNumber + currentLineNumberOffset);
                        }
                        return actions;
                    },
                    autoSelectFirstItem: true
                });
            };
            this._register(dom.addStandardDisposableListener(this._diffActions, 'mousedown', e => {
                const { top, height } = dom.getDomNodePagePosition(this._diffActions);
                let pad = Math.floor(lineHeight / 3);
                e.preventDefault();
                showContextMenu(e.posx, top + height + pad);
            }));
            this._register(editor.onMouseMove((e) => {
                if (e.target.type === 8 /* CONTENT_VIEW_ZONE */ || e.target.type === 5 /* GUTTER_VIEW_ZONE */) {
                    const viewZoneId = e.target.detail.viewZoneId;
                    if (viewZoneId === this._viewZoneId) {
                        this.visibility = true;
                        currentLineNumberOffset = this._updateLightBulbPosition(this._marginDomNode, e.event.browserEvent.y, lineHeight);
                    }
                    else {
                        this.visibility = false;
                    }
                }
                else {
                    this.visibility = false;
                }
            }));
            this._register(editor.onMouseDown((e) => {
                if (!e.event.rightButton) {
                    return;
                }
                if (e.target.type === 8 /* CONTENT_VIEW_ZONE */ || e.target.type === 5 /* GUTTER_VIEW_ZONE */) {
                    const viewZoneId = e.target.detail.viewZoneId;
                    if (viewZoneId === this._viewZoneId) {
                        e.event.preventDefault();
                        currentLineNumberOffset = this._updateLightBulbPosition(this._marginDomNode, e.event.browserEvent.y, lineHeight);
                        showContextMenu(e.event.posx, e.event.posy + lineHeight);
                    }
                }
            }));
        }
        get visibility() {
            return this._visibility;
        }
        set visibility(_visibility) {
            if (this._visibility !== _visibility) {
                this._visibility = _visibility;
                if (_visibility) {
                    this._diffActions.style.visibility = 'visible';
                }
                else {
                    this._diffActions.style.visibility = 'hidden';
                }
            }
        }
        _updateLightBulbPosition(marginDomNode, y, lineHeight) {
            const { top } = dom.getDomNodePagePosition(marginDomNode);
            const offset = y - top;
            const lineNumberOffset = Math.floor(offset / lineHeight);
            const newTop = lineNumberOffset * lineHeight;
            this._diffActions.style.top = `${newTop}px`;
            return lineNumberOffset;
        }
    }
    exports.InlineDiffMargin = InlineDiffMargin;
});
//# __sourceMappingURL=inlineDiffMargin.js.map