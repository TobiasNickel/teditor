/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Handler = exports.EditorType = exports.isThemeColor = exports.ScrollType = void 0;
    var ScrollType;
    (function (ScrollType) {
        ScrollType[ScrollType["Smooth"] = 0] = "Smooth";
        ScrollType[ScrollType["Immediate"] = 1] = "Immediate";
    })(ScrollType = exports.ScrollType || (exports.ScrollType = {}));
    /**
     * @internal
     */
    function isThemeColor(o) {
        return o && typeof o.id === 'string';
    }
    exports.isThemeColor = isThemeColor;
    /**
     * The type of the `IEditor`.
     */
    exports.EditorType = {
        ICodeEditor: 'vs.editor.ICodeEditor',
        IDiffEditor: 'vs.editor.IDiffEditor'
    };
    /**
     * Built-in commands.
     * @internal
     */
    var Handler;
    (function (Handler) {
        Handler["CompositionStart"] = "compositionStart";
        Handler["CompositionEnd"] = "compositionEnd";
        Handler["Type"] = "type";
        Handler["ReplacePreviousChar"] = "replacePreviousChar";
        Handler["Paste"] = "paste";
        Handler["Cut"] = "cut";
    })(Handler = exports.Handler || (exports.Handler = {}));
});
//# __sourceMappingURL=editorCommon.js.map