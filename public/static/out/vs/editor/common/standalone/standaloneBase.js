/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/core/token", "vs/editor/common/standalone/standaloneEnums"], function (require, exports, cancellation_1, event_1, keyCodes_1, uri_1, position_1, range_1, selection_1, token_1, standaloneEnums) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createMonacoBaseAPI = exports.KeyMod = void 0;
    class KeyMod {
        static chord(firstPart, secondPart) {
            return keyCodes_1.KeyChord(firstPart, secondPart);
        }
    }
    exports.KeyMod = KeyMod;
    KeyMod.CtrlCmd = 2048 /* CtrlCmd */;
    KeyMod.Shift = 1024 /* Shift */;
    KeyMod.Alt = 512 /* Alt */;
    KeyMod.WinCtrl = 256 /* WinCtrl */;
    function createMonacoBaseAPI() {
        return {
            editor: undefined,
            languages: undefined,
            CancellationTokenSource: cancellation_1.CancellationTokenSource,
            Emitter: event_1.Emitter,
            KeyCode: standaloneEnums.KeyCode,
            KeyMod: KeyMod,
            Position: position_1.Position,
            Range: range_1.Range,
            Selection: selection_1.Selection,
            SelectionDirection: standaloneEnums.SelectionDirection,
            MarkerSeverity: standaloneEnums.MarkerSeverity,
            MarkerTag: standaloneEnums.MarkerTag,
            Uri: uri_1.URI,
            Token: token_1.Token
        };
    }
    exports.createMonacoBaseAPI = createMonacoBaseAPI;
});
//# __sourceMappingURL=standaloneBase.js.map