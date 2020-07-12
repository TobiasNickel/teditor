/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/nls", "vs/platform/actions/common/actions", "vs/base/common/lifecycle", "vs/editor/contrib/smartSelect/wordSelections", "vs/editor/contrib/smartSelect/bracketSelections", "vs/platform/commands/common/commands", "vs/base/common/errors"], function (require, exports, arrays, cancellation_1, editorExtensions_1, position_1, range_1, selection_1, editorContextKeys_1, modes, nls, actions_1, lifecycle_1, wordSelections_1, bracketSelections_1, commands_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.provideSelectionRanges = void 0;
    class SelectionRanges {
        constructor(index, ranges) {
            this.index = index;
            this.ranges = ranges;
        }
        mov(fwd) {
            let index = this.index + (fwd ? 1 : -1);
            if (index < 0 || index >= this.ranges.length) {
                return this;
            }
            const res = new SelectionRanges(index, this.ranges);
            if (res.ranges[index].equalsRange(this.ranges[this.index])) {
                // next range equals this range, retry with next-next
                return res.mov(fwd);
            }
            return res;
        }
    }
    class SmartSelectController {
        constructor(editor) {
            this._ignoreSelection = false;
            this._editor = editor;
        }
        static get(editor) {
            return editor.getContribution(SmartSelectController.ID);
        }
        dispose() {
            lifecycle_1.dispose(this._selectionListener);
        }
        run(forward) {
            if (!this._editor.hasModel()) {
                return;
            }
            const selections = this._editor.getSelections();
            const model = this._editor.getModel();
            if (!modes.SelectionRangeRegistry.has(model)) {
                return;
            }
            let promise = Promise.resolve(undefined);
            if (!this._state) {
                promise = provideSelectionRanges(model, selections.map(s => s.getPosition()), cancellation_1.CancellationToken.None).then(ranges => {
                    if (!arrays.isNonEmptyArray(ranges) || ranges.length !== selections.length) {
                        // invalid result
                        return;
                    }
                    if (!this._editor.hasModel() || !arrays.equals(this._editor.getSelections(), selections, (a, b) => a.equalsSelection(b))) {
                        // invalid editor state
                        return;
                    }
                    for (let i = 0; i < ranges.length; i++) {
                        ranges[i] = ranges[i].filter(range => {
                            // filter ranges inside the selection
                            return range.containsPosition(selections[i].getStartPosition()) && range.containsPosition(selections[i].getEndPosition());
                        });
                        // prepend current selection
                        ranges[i].unshift(selections[i]);
                    }
                    this._state = ranges.map(ranges => new SelectionRanges(0, ranges));
                    // listen to caret move and forget about state
                    lifecycle_1.dispose(this._selectionListener);
                    this._selectionListener = this._editor.onDidChangeCursorPosition(() => {
                        if (!this._ignoreSelection) {
                            lifecycle_1.dispose(this._selectionListener);
                            this._state = undefined;
                        }
                    });
                });
            }
            return promise.then(() => {
                if (!this._state) {
                    // no state
                    return;
                }
                this._state = this._state.map(state => state.mov(forward));
                const selections = this._state.map(state => selection_1.Selection.fromPositions(state.ranges[state.index].getStartPosition(), state.ranges[state.index].getEndPosition()));
                this._ignoreSelection = true;
                try {
                    this._editor.setSelections(selections);
                }
                finally {
                    this._ignoreSelection = false;
                }
            });
        }
    }
    SmartSelectController.ID = 'editor.contrib.smartSelectController';
    class AbstractSmartSelect extends editorExtensions_1.EditorAction {
        constructor(forward, opts) {
            super(opts);
            this._forward = forward;
        }
        async run(_accessor, editor) {
            let controller = SmartSelectController.get(editor);
            if (controller) {
                await controller.run(this._forward);
            }
        }
    }
    class GrowSelectionAction extends AbstractSmartSelect {
        constructor() {
            super(true, {
                id: 'editor.action.smartSelect.expand',
                label: nls.localize('smartSelect.expand', "Expand Selection"),
                alias: 'Expand Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 17 /* RightArrow */,
                    mac: {
                        primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 1024 /* Shift */ | 17 /* RightArrow */,
                        secondary: [256 /* WinCtrl */ | 1024 /* Shift */ | 17 /* RightArrow */],
                    },
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '1_basic',
                    title: nls.localize({ key: 'miSmartSelectGrow', comment: ['&& denotes a mnemonic'] }, "&&Expand Selection"),
                    order: 2
                }
            });
        }
    }
    // renamed command id
    commands_1.CommandsRegistry.registerCommandAlias('editor.action.smartSelect.grow', 'editor.action.smartSelect.expand');
    class ShrinkSelectionAction extends AbstractSmartSelect {
        constructor() {
            super(false, {
                id: 'editor.action.smartSelect.shrink',
                label: nls.localize('smartSelect.shrink', "Shrink Selection"),
                alias: 'Shrink Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 15 /* LeftArrow */,
                    mac: {
                        primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 1024 /* Shift */ | 15 /* LeftArrow */,
                        secondary: [256 /* WinCtrl */ | 1024 /* Shift */ | 15 /* LeftArrow */],
                    },
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '1_basic',
                    title: nls.localize({ key: 'miSmartSelectShrink', comment: ['&& denotes a mnemonic'] }, "&&Shrink Selection"),
                    order: 3
                }
            });
        }
    }
    editorExtensions_1.registerEditorContribution(SmartSelectController.ID, SmartSelectController);
    editorExtensions_1.registerEditorAction(GrowSelectionAction);
    editorExtensions_1.registerEditorAction(ShrinkSelectionAction);
    // word selection
    modes.SelectionRangeRegistry.register('*', new wordSelections_1.WordSelectionRangeProvider());
    function provideSelectionRanges(model, positions, token) {
        const providers = modes.SelectionRangeRegistry.all(model);
        if (providers.length === 1) {
            // add word selection and bracket selection when no provider exists
            providers.unshift(new bracketSelections_1.BracketSelectionRangeProvider());
        }
        let work = [];
        let allRawRanges = [];
        for (const provider of providers) {
            work.push(Promise.resolve(provider.provideSelectionRanges(model, positions, token)).then(allProviderRanges => {
                if (arrays.isNonEmptyArray(allProviderRanges) && allProviderRanges.length === positions.length) {
                    for (let i = 0; i < positions.length; i++) {
                        if (!allRawRanges[i]) {
                            allRawRanges[i] = [];
                        }
                        for (const oneProviderRanges of allProviderRanges[i]) {
                            if (range_1.Range.isIRange(oneProviderRanges.range) && range_1.Range.containsPosition(oneProviderRanges.range, positions[i])) {
                                allRawRanges[i].push(range_1.Range.lift(oneProviderRanges.range));
                            }
                        }
                    }
                }
            }, errors_1.onUnexpectedExternalError));
        }
        return Promise.all(work).then(() => {
            return allRawRanges.map(oneRawRanges => {
                if (oneRawRanges.length === 0) {
                    return [];
                }
                // sort all by start/end position
                oneRawRanges.sort((a, b) => {
                    if (position_1.Position.isBefore(a.getStartPosition(), b.getStartPosition())) {
                        return 1;
                    }
                    else if (position_1.Position.isBefore(b.getStartPosition(), a.getStartPosition())) {
                        return -1;
                    }
                    else if (position_1.Position.isBefore(a.getEndPosition(), b.getEndPosition())) {
                        return -1;
                    }
                    else if (position_1.Position.isBefore(b.getEndPosition(), a.getEndPosition())) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
                // remove ranges that don't contain the former range or that are equal to the
                // former range
                let oneRanges = [];
                let last;
                for (const range of oneRawRanges) {
                    if (!last || (range_1.Range.containsRange(range, last) && !range_1.Range.equalsRange(range, last))) {
                        oneRanges.push(range);
                        last = range;
                    }
                }
                // add ranges that expand trivia at line starts and ends whenever a range
                // wraps onto the a new line
                let oneRangesWithTrivia = [oneRanges[0]];
                for (let i = 1; i < oneRanges.length; i++) {
                    const prev = oneRanges[i - 1];
                    const cur = oneRanges[i];
                    if (cur.startLineNumber !== prev.startLineNumber || cur.endLineNumber !== prev.endLineNumber) {
                        // add line/block range without leading/failing whitespace
                        const rangeNoWhitespace = new range_1.Range(prev.startLineNumber, model.getLineFirstNonWhitespaceColumn(prev.startLineNumber), prev.endLineNumber, model.getLineLastNonWhitespaceColumn(prev.endLineNumber));
                        if (rangeNoWhitespace.containsRange(prev) && !rangeNoWhitespace.equalsRange(prev) && cur.containsRange(rangeNoWhitespace) && !cur.equalsRange(rangeNoWhitespace)) {
                            oneRangesWithTrivia.push(rangeNoWhitespace);
                        }
                        // add line/block range
                        const rangeFull = new range_1.Range(prev.startLineNumber, 1, prev.endLineNumber, model.getLineMaxColumn(prev.endLineNumber));
                        if (rangeFull.containsRange(prev) && !rangeFull.equalsRange(rangeNoWhitespace) && cur.containsRange(rangeFull) && !cur.equalsRange(rangeFull)) {
                            oneRangesWithTrivia.push(rangeFull);
                        }
                    }
                    oneRangesWithTrivia.push(cur);
                }
                return oneRangesWithTrivia;
            });
        });
    }
    exports.provideSelectionRanges = provideSelectionRanges;
    editorExtensions_1.registerModelCommand('_executeSelectionRangeProvider', function (model, ...args) {
        const [positions] = args;
        return provideSelectionRanges(model, positions, cancellation_1.CancellationToken.None);
    });
});
//# __sourceMappingURL=smartSelect.js.map