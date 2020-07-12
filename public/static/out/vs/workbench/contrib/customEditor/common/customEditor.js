/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/glob", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, arrays_1, glob, network_1, path_1, resources_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorInfoCollection = exports.CustomEditorInfo = exports.CustomEditorPriority = exports.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE = exports.CONTEXT_CUSTOM_EDITORS = exports.ICustomEditorService = void 0;
    exports.ICustomEditorService = instantiation_1.createDecorator('customEditorService');
    exports.CONTEXT_CUSTOM_EDITORS = new contextkey_1.RawContextKey('customEditors', '');
    exports.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE = new contextkey_1.RawContextKey('focusedCustomEditorIsEditable', false);
    var CustomEditorPriority;
    (function (CustomEditorPriority) {
        CustomEditorPriority["default"] = "default";
        CustomEditorPriority["builtin"] = "builtin";
        CustomEditorPriority["option"] = "option";
    })(CustomEditorPriority = exports.CustomEditorPriority || (exports.CustomEditorPriority = {}));
    class CustomEditorInfo {
        constructor(descriptor) {
            this.id = descriptor.id;
            this.displayName = descriptor.displayName;
            this.providerDisplayName = descriptor.providerDisplayName;
            this.priority = descriptor.priority;
            this.selector = descriptor.selector;
        }
        matches(resource) {
            return this.selector.some(selector => CustomEditorInfo.selectorMatches(selector, resource));
        }
        static selectorMatches(selector, resource) {
            if (CustomEditorInfo.excludedSchemes.has(resource.scheme)) {
                return false;
            }
            if (selector.filenamePattern) {
                const matchOnPath = selector.filenamePattern.indexOf(path_1.posix.sep) >= 0;
                const target = matchOnPath ? resource.path : resources_1.basename(resource);
                if (glob.match(selector.filenamePattern.toLowerCase(), target.toLowerCase())) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.CustomEditorInfo = CustomEditorInfo;
    CustomEditorInfo.excludedSchemes = new Set([
        network_1.Schemas.extension,
        network_1.Schemas.webviewPanel,
    ]);
    class CustomEditorInfoCollection {
        constructor(editors) {
            this.allEditors = arrays_1.distinct(editors, editor => editor.id);
        }
        get length() { return this.allEditors.length; }
        /**
         * Find the single default editor to use (if any) by looking at the editor's priority and the
         * other contributed editors.
         */
        get defaultEditor() {
            return this.allEditors.find(editor => {
                switch (editor.priority) {
                    case "default" /* default */:
                    case "builtin" /* builtin */:
                        // A default editor must have higher priority than all other contributed editors.
                        return this.allEditors.every(otherEditor => otherEditor === editor || isLowerPriority(otherEditor, editor));
                    default:
                        return false;
                }
            });
        }
        /**
         * Find the best available editor to use.
         *
         * Unlike the `defaultEditor`, a bestAvailableEditor can exist even if there are other editors with
         * the same priority.
         */
        get bestAvailableEditor() {
            const editors = arrays_1.mergeSort(Array.from(this.allEditors), (a, b) => {
                return priorityToRank(a.priority) - priorityToRank(b.priority);
            });
            return editors[0];
        }
    }
    exports.CustomEditorInfoCollection = CustomEditorInfoCollection;
    function isLowerPriority(otherEditor, editor) {
        return priorityToRank(otherEditor.priority) < priorityToRank(editor.priority);
    }
    function priorityToRank(priority) {
        switch (priority) {
            case "default" /* default */: return 3;
            case "builtin" /* builtin */: return 2;
            case "option" /* option */: return 1;
        }
    }
});
//# __sourceMappingURL=customEditor.js.map