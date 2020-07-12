/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/controller/cursorWordOperations", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/wordOperations/wordOperations", "vs/platform/commands/common/commands"], function (require, exports, editorExtensions_1, cursorWordOperations_1, range_1, editorContextKeys_1, wordOperations_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorWordPartRightSelect = exports.CursorWordPartRight = exports.WordPartRightCommand = exports.CursorWordPartLeftSelect = exports.CursorWordPartLeft = exports.WordPartLeftCommand = exports.DeleteWordPartRight = exports.DeleteWordPartLeft = void 0;
    class DeleteWordPartLeft extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 0 /* WordStart */,
                id: 'deleteWordPartLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 1 /* Backspace */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _delete(wordSeparators, model, selection, whitespaceHeuristics, wordNavigationType) {
            let r = cursorWordOperations_1.WordPartOperations.deleteWordPartLeft(wordSeparators, model, selection, whitespaceHeuristics);
            if (r) {
                return r;
            }
            return new range_1.Range(1, 1, 1, 1);
        }
    }
    exports.DeleteWordPartLeft = DeleteWordPartLeft;
    class DeleteWordPartRight extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 2 /* WordEnd */,
                id: 'deleteWordPartRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 20 /* Delete */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _delete(wordSeparators, model, selection, whitespaceHeuristics, wordNavigationType) {
            let r = cursorWordOperations_1.WordPartOperations.deleteWordPartRight(wordSeparators, model, selection, whitespaceHeuristics);
            if (r) {
                return r;
            }
            const lineCount = model.getLineCount();
            const maxColumn = model.getLineMaxColumn(lineCount);
            return new range_1.Range(lineCount, maxColumn, lineCount, maxColumn);
        }
    }
    exports.DeleteWordPartRight = DeleteWordPartRight;
    class WordPartLeftCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartLeft(wordSeparators, model, position);
        }
    }
    exports.WordPartLeftCommand = WordPartLeftCommand;
    class CursorWordPartLeft extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordStart */,
                id: 'cursorWordPartLeft',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 15 /* LeftArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeft = CursorWordPartLeft;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeft', 'cursorWordPartLeft');
    class CursorWordPartLeftSelect extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordStart */,
                id: 'cursorWordPartLeftSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 1024 /* Shift */ | 15 /* LeftArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeftSelect = CursorWordPartLeftSelect;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeftSelect', 'cursorWordPartLeftSelect');
    class WordPartRightCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartRight(wordSeparators, model, position);
        }
    }
    exports.WordPartRightCommand = WordPartRightCommand;
    class CursorWordPartRight extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordPartRight',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 17 /* RightArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRight = CursorWordPartRight;
    class CursorWordPartRightSelect extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordEnd */,
                id: 'cursorWordPartRightSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 1024 /* Shift */ | 17 /* RightArrow */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRightSelect = CursorWordPartRightSelect;
    editorExtensions_1.registerEditorCommand(new DeleteWordPartLeft());
    editorExtensions_1.registerEditorCommand(new DeleteWordPartRight());
    editorExtensions_1.registerEditorCommand(new CursorWordPartLeft());
    editorExtensions_1.registerEditorCommand(new CursorWordPartLeftSelect());
    editorExtensions_1.registerEditorCommand(new CursorWordPartRight());
    editorExtensions_1.registerEditorCommand(new CursorWordPartRightSelect());
});
//# __sourceMappingURL=wordPartOperations.js.map