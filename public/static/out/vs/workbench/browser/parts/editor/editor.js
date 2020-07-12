/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/editor/browser/editorBrowser"], function (require, exports, editor_1, dom_1, editorBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getActiveTextEditorOptions = exports.getEditorPartOptions = exports.impactsEditorPartOptions = exports.DEFAULT_EDITOR_PART_OPTIONS = exports.DEFAULT_EDITOR_MAX_DIMENSIONS = exports.DEFAULT_EDITOR_MIN_DIMENSIONS = exports.EDITOR_TITLE_HEIGHT = void 0;
    exports.EDITOR_TITLE_HEIGHT = 35;
    exports.DEFAULT_EDITOR_MIN_DIMENSIONS = new dom_1.Dimension(220, 70);
    exports.DEFAULT_EDITOR_MAX_DIMENSIONS = new dom_1.Dimension(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    exports.DEFAULT_EDITOR_PART_OPTIONS = {
        showTabs: true,
        highlightModifiedTabs: false,
        tabCloseButton: 'right',
        tabSizing: 'fit',
        titleScrollbarSizing: 'default',
        focusRecentEditorAfterClose: true,
        showIcons: true,
        hasIcons: true,
        enablePreview: true,
        openPositioning: 'right',
        openSideBySideDirection: 'right',
        closeEmptyGroups: true,
        labelFormat: 'default',
        splitSizing: 'distribute'
    };
    function impactsEditorPartOptions(event) {
        return event.affectsConfiguration('workbench.editor') || event.affectsConfiguration('workbench.iconTheme');
    }
    exports.impactsEditorPartOptions = impactsEditorPartOptions;
    function getEditorPartOptions(configurationService, themeService) {
        var _a;
        const options = Object.assign(Object.assign({}, exports.DEFAULT_EDITOR_PART_OPTIONS), { hasIcons: themeService.getFileIconTheme().hasFileIcons });
        const config = configurationService.getValue();
        if ((_a = config === null || config === void 0 ? void 0 : config.workbench) === null || _a === void 0 ? void 0 : _a.editor) {
            Object.assign(options, config.workbench.editor);
        }
        return options;
    }
    exports.getEditorPartOptions = getEditorPartOptions;
    function getActiveTextEditorOptions(group, expectedActiveEditor, presetOptions) {
        const activeGroupCodeEditor = group.activeEditorPane ? editorBrowser_1.getCodeEditor(group.activeEditorPane.getControl()) : undefined;
        if (activeGroupCodeEditor) {
            if (!expectedActiveEditor || expectedActiveEditor.matches(group.activeEditor)) {
                return editor_1.TextEditorOptions.fromEditor(activeGroupCodeEditor, presetOptions);
            }
        }
        return presetOptions || new editor_1.EditorOptions();
    }
    exports.getActiveTextEditorOptions = getActiveTextEditorOptions;
});
//# __sourceMappingURL=editor.js.map