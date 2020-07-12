/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/replaceCommand", "vs/editor/common/controller/cursorCommon", "vs/editor/common/controller/cursorWordOperations", "vs/editor/common/controller/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/platform/accessibility/common/accessibility", "vs/platform/contextkey/common/contextkey", "vs/editor/common/config/editorOptions"], function (require, exports, editorExtensions_1, replaceCommand_1, cursorCommon_1, cursorWordOperations_1, wordCharacterClassifier_1, position_1, range_1, selection_1, editorContextKeys_1, accessibility_1, contextkey_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeleteWordRight = exports.DeleteWordEndRight = exports.DeleteWordStartRight = exports.DeleteWordLeft = exports.DeleteWordEndLeft = exports.DeleteWordStartLeft = exports.DeleteWordRightCommand = exports.DeleteWordLeftCommand = exports.DeleteWordCommand = exports.CursorWordAccessibilityRightSelect = exports.CursorWordAccessibilityRight = exports.CursorWordRightSelect = exports.CursorWordEndRightSelect = exports.CursorWordStartRightSelect = exports.CursorWordRight = exports.CursorWordEndRight = exports.CursorWordStartRight = exports.CursorWordAccessibilityLeftSelect = exports.CursorWordAccessibilityLeft = exports.CursorWordLeftSelect = exports.CursorWordEndLeftSelect = exports.CursorWordStartLeftSelect = exports.CursorWordLeft = exports.CursorWordEndLeft = exports.CursorWordStartLeft = exports.WordRightCommand = exports.WordLeftCommand = exports.MoveWordCommand = void 0;
    class MoveWordCommand extends editorExtensions_1.EditorCommand {
        constructor(opts) {
            super(opts);
            this._inSelectionMode = opts.inSelectionMode;
            this._wordNavigationType = opts.wordNavigationType;
        }
        runEditorCommand(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const wordSeparators = wordCharacterClassifier_1.getMapForWordSeparators(editor.getOption(104 /* wordSeparators */));
            const model = editor.getModel();
            const selections = editor.getSelections();
            const result = selections.map((sel) => {
                const inPosition = new position_1.Position(sel.positionLineNumber, sel.positionColumn);
                const outPosition = this._move(wordSeparators, model, inPosition, this._wordNavigationType);
                return this._moveTo(sel, outPosition, this._inSelectionMode);
            });
            model.pushStackElement();
            editor._getViewModel().setCursorStates('moveWordCommand', 0 /* NotSet */, result.map(r => cursorCommon_1.CursorState.fromModelSelection(r)));
            if (result.length === 1) {
                const pos = new position_1.Position(result[0].positionLineNumber, result[0].positionColumn);
                editor.revealPosition(pos, 0 /* Smooth */);
            }
        }
        _moveTo(from, to, inSelectionMode) {
            if (inSelectionMode) {
                // move just position
                return new selection_1.Selection(from.selectionStartLineNumber, from.selectionStartColumn, to.lineNumber, to.column);
            }
            else {
                // move everything
                return new selection_1.Selection(to.lineNumber, to.column, to.lineNumber, to.column);
            }
        }
    }
    exports.MoveWordCommand = MoveWordCommand;
    class WordLeftCommand extends MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordOperations.moveWordLeft(wordSeparators, model, position, wordNavigationType);
        }
    }
    exports.WordLeftCommand = WordLeftCommand;
    class WordRightCommand extends MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordOperations.moveWordRight(wordSeparators, model, position, wordNavigationType);
        }
    }
    exports.WordRightCommand = WordRightCommand;
    class CursorWordStartLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordStart */,
                id: 'cursorWordStartLeft',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 15 /* LeftArrow */,
                    mac: { primary: 512 /* Alt */ | 15 /* LeftArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordStartLeft = CursorWordStartLeft;
    class CursorWordEndLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordEndLeft',
                precondition: undefined
            });
        }
    }
    exports.CursorWordEndLeft = CursorWordEndLeft;
    class CursorWordLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 1 /* WordStartFast */,
                id: 'cursorWordLeft',
                precondition: undefined
            });
        }
    }
    exports.CursorWordLeft = CursorWordLeft;
    class CursorWordStartLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordStart */,
                id: 'cursorWordStartLeftSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 15 /* LeftArrow */,
                    mac: { primary: 512 /* Alt */ | 1024 /* Shift */ | 15 /* LeftArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordStartLeftSelect = CursorWordStartLeftSelect;
    class CursorWordEndLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordEndLeftSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordEndLeftSelect = CursorWordEndLeftSelect;
    class CursorWordLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 1 /* WordStartFast */,
                id: 'cursorWordLeftSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordLeftSelect = CursorWordLeftSelect;
    // Accessibility navigation commands should only be enabled on windows since they are tuned to what NVDA expects
    class CursorWordAccessibilityLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 3 /* WordAccessibility */,
                id: 'cursorWordAccessibilityLeft',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED),
                    win: { primary: 2048 /* CtrlCmd */ | 15 /* LeftArrow */ },
                    weight: 100 /* EditorContrib */ + 1
                }
            });
        }
        _move(_, model, position, wordNavigationType) {
            return super._move(wordCharacterClassifier_1.getMapForWordSeparators(editorOptions_1.EditorOptions.wordSeparators.defaultValue), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityLeft = CursorWordAccessibilityLeft;
    class CursorWordAccessibilityLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 3 /* WordAccessibility */,
                id: 'cursorWordAccessibilityLeftSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED),
                    win: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 15 /* LeftArrow */ },
                    weight: 100 /* EditorContrib */ + 1
                }
            });
        }
        _move(_, model, position, wordNavigationType) {
            return super._move(wordCharacterClassifier_1.getMapForWordSeparators(editorOptions_1.EditorOptions.wordSeparators.defaultValue), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityLeftSelect = CursorWordAccessibilityLeftSelect;
    class CursorWordStartRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordStart */,
                id: 'cursorWordStartRight',
                precondition: undefined
            });
        }
    }
    exports.CursorWordStartRight = CursorWordStartRight;
    class CursorWordEndRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordEndRight',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 17 /* RightArrow */,
                    mac: { primary: 512 /* Alt */ | 17 /* RightArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordEndRight = CursorWordEndRight;
    class CursorWordRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordRight',
                precondition: undefined
            });
        }
    }
    exports.CursorWordRight = CursorWordRight;
    class CursorWordStartRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordStart */,
                id: 'cursorWordStartRightSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordStartRightSelect = CursorWordStartRightSelect;
    class CursorWordEndRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordEndRightSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 17 /* RightArrow */,
                    mac: { primary: 512 /* Alt */ | 1024 /* Shift */ | 17 /* RightArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordEndRightSelect = CursorWordEndRightSelect;
    class CursorWordRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordRightSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordRightSelect = CursorWordRightSelect;
    class CursorWordAccessibilityRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 3 /* WordAccessibility */,
                id: 'cursorWordAccessibilityRight',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED),
                    win: { primary: 2048 /* CtrlCmd */ | 17 /* RightArrow */ },
                    weight: 100 /* EditorContrib */ + 1
                }
            });
        }
        _move(_, model, position, wordNavigationType) {
            return super._move(wordCharacterClassifier_1.getMapForWordSeparators(editorOptions_1.EditorOptions.wordSeparators.defaultValue), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityRight = CursorWordAccessibilityRight;
    class CursorWordAccessibilityRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 3 /* WordAccessibility */,
                id: 'cursorWordAccessibilityRightSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED),
                    win: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 17 /* RightArrow */ },
                    weight: 100 /* EditorContrib */ + 1
                }
            });
        }
        _move(_, model, position, wordNavigationType) {
            return super._move(wordCharacterClassifier_1.getMapForWordSeparators(editorOptions_1.EditorOptions.wordSeparators.defaultValue), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityRightSelect = CursorWordAccessibilityRightSelect;
    class DeleteWordCommand extends editorExtensions_1.EditorCommand {
        constructor(opts) {
            super(opts);
            this._whitespaceHeuristics = opts.whitespaceHeuristics;
            this._wordNavigationType = opts.wordNavigationType;
        }
        runEditorCommand(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const wordSeparators = wordCharacterClassifier_1.getMapForWordSeparators(editor.getOption(104 /* wordSeparators */));
            const model = editor.getModel();
            const selections = editor.getSelections();
            const commands = selections.map((sel) => {
                const deleteRange = this._delete(wordSeparators, model, sel, this._whitespaceHeuristics, this._wordNavigationType);
                return new replaceCommand_1.ReplaceCommand(deleteRange, '');
            });
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.DeleteWordCommand = DeleteWordCommand;
    class DeleteWordLeftCommand extends DeleteWordCommand {
        _delete(wordSeparators, model, selection, whitespaceHeuristics, wordNavigationType) {
            let r = cursorWordOperations_1.WordOperations.deleteWordLeft(wordSeparators, model, selection, whitespaceHeuristics, wordNavigationType);
            if (r) {
                return r;
            }
            return new range_1.Range(1, 1, 1, 1);
        }
    }
    exports.DeleteWordLeftCommand = DeleteWordLeftCommand;
    class DeleteWordRightCommand extends DeleteWordCommand {
        _delete(wordSeparators, model, selection, whitespaceHeuristics, wordNavigationType) {
            let r = cursorWordOperations_1.WordOperations.deleteWordRight(wordSeparators, model, selection, whitespaceHeuristics, wordNavigationType);
            if (r) {
                return r;
            }
            const lineCount = model.getLineCount();
            const maxColumn = model.getLineMaxColumn(lineCount);
            return new range_1.Range(lineCount, maxColumn, lineCount, maxColumn);
        }
    }
    exports.DeleteWordRightCommand = DeleteWordRightCommand;
    class DeleteWordStartLeft extends DeleteWordLeftCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 0 /* WordStart */,
                id: 'deleteWordStartLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordStartLeft = DeleteWordStartLeft;
    class DeleteWordEndLeft extends DeleteWordLeftCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 2 /* WordEnd */,
                id: 'deleteWordEndLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordEndLeft = DeleteWordEndLeft;
    class DeleteWordLeft extends DeleteWordLeftCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 0 /* WordStart */,
                id: 'deleteWordLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 1 /* Backspace */,
                    mac: { primary: 512 /* Alt */ | 1 /* Backspace */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.DeleteWordLeft = DeleteWordLeft;
    class DeleteWordStartRight extends DeleteWordRightCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 0 /* WordStart */,
                id: 'deleteWordStartRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordStartRight = DeleteWordStartRight;
    class DeleteWordEndRight extends DeleteWordRightCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 2 /* WordEnd */,
                id: 'deleteWordEndRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordEndRight = DeleteWordEndRight;
    class DeleteWordRight extends DeleteWordRightCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 2 /* WordEnd */,
                id: 'deleteWordRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 20 /* Delete */,
                    mac: { primary: 512 /* Alt */ | 20 /* Delete */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.DeleteWordRight = DeleteWordRight;
    editorExtensions_1.registerEditorCommand(new CursorWordStartLeft());
    editorExtensions_1.registerEditorCommand(new CursorWordEndLeft());
    editorExtensions_1.registerEditorCommand(new CursorWordLeft());
    editorExtensions_1.registerEditorCommand(new CursorWordStartLeftSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordEndLeftSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordLeftSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordStartRight());
    editorExtensions_1.registerEditorCommand(new CursorWordEndRight());
    editorExtensions_1.registerEditorCommand(new CursorWordRight());
    editorExtensions_1.registerEditorCommand(new CursorWordStartRightSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordEndRightSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordRightSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordAccessibilityLeft());
    editorExtensions_1.registerEditorCommand(new CursorWordAccessibilityLeftSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordAccessibilityRight());
    editorExtensions_1.registerEditorCommand(new CursorWordAccessibilityRightSelect());
    editorExtensions_1.registerEditorCommand(new DeleteWordStartLeft());
    editorExtensions_1.registerEditorCommand(new DeleteWordEndLeft());
    editorExtensions_1.registerEditorCommand(new DeleteWordLeft());
    editorExtensions_1.registerEditorCommand(new DeleteWordStartRight());
    editorExtensions_1.registerEditorCommand(new DeleteWordEndRight());
    editorExtensions_1.registerEditorCommand(new DeleteWordRight());
});
//# __sourceMappingURL=wordOperations.js.map