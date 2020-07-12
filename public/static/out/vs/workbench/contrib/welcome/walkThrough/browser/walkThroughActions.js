/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/welcome/walkThrough/browser/walkThroughPart", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey"], function (require, exports, editorService_1, walkThroughPart_1, editorContextKeys_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughPageDown = exports.WalkThroughPageUp = exports.WalkThroughArrowDown = exports.WalkThroughArrowUp = void 0;
    exports.WalkThroughArrowUp = {
        id: 'workbench.action.interactivePlayground.arrowUp',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 16 /* UpArrow */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.arrowUp();
            }
        }
    };
    exports.WalkThroughArrowDown = {
        id: 'workbench.action.interactivePlayground.arrowDown',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 18 /* DownArrow */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.arrowDown();
            }
        }
    };
    exports.WalkThroughPageUp = {
        id: 'workbench.action.interactivePlayground.pageUp',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 11 /* PageUp */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.pageUp();
            }
        }
    };
    exports.WalkThroughPageDown = {
        id: 'workbench.action.interactivePlayground.pageDown',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 12 /* PageDown */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.pageDown();
            }
        }
    };
});
//# __sourceMappingURL=walkThroughActions.js.map