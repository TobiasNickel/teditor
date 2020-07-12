/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditorWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/editor/contrib/contextmenu/contextmenu", "vs/editor/contrib/suggest/suggestController", "vs/editor/contrib/snippet/snippetController2", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/platform/theme/common/themeService", "vs/platform/notification/common/notification", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/comments/common/commentContextKeys"], function (require, exports, editorExtensions_1, codeEditorService_1, codeEditorWidget_1, contextkey_1, instantiation_1, commands_1, menuPreventer_1, contextmenu_1, suggestController_1, snippetController2_1, tabCompletion_1, themeService_1, notification_1, accessibility_1, commentContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleCommentEditor = exports.ctxCommentEditorFocused = void 0;
    exports.ctxCommentEditorFocused = new contextkey_1.RawContextKey('commentEditorFocused', false);
    let SimpleCommentEditor = class SimpleCommentEditor extends codeEditorWidget_1.CodeEditorWidget {
        constructor(domElement, options, parentEditor, parentThread, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService, accessibilityService) {
            const codeEditorWidgetOptions = {
                isSimpleWidget: true,
                contributions: [
                    { id: menuPreventer_1.MenuPreventer.ID, ctor: menuPreventer_1.MenuPreventer },
                    { id: contextmenu_1.ContextMenuController.ID, ctor: contextmenu_1.ContextMenuController },
                    { id: suggestController_1.SuggestController.ID, ctor: suggestController_1.SuggestController },
                    { id: snippetController2_1.SnippetController2.ID, ctor: snippetController2_1.SnippetController2 },
                    { id: tabCompletion_1.TabCompletionController.ID, ctor: tabCompletion_1.TabCompletionController },
                ]
            };
            super(domElement, options, codeEditorWidgetOptions, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService, accessibilityService);
            this._commentEditorFocused = exports.ctxCommentEditorFocused.bindTo(contextKeyService);
            this._commentEditorEmpty = commentContextKeys_1.CommentContextKeys.commentIsEmpty.bindTo(contextKeyService);
            this._commentEditorEmpty.set(!this.getValue());
            this._parentEditor = parentEditor;
            this._parentThread = parentThread;
            this._register(this.onDidFocusEditorWidget(_ => this._commentEditorFocused.set(true)));
            this._register(this.onDidChangeModelContent(e => this._commentEditorEmpty.set(!this.getValue())));
            this._register(this.onDidBlurEditorWidget(_ => this._commentEditorFocused.reset()));
        }
        getParentEditor() {
            return this._parentEditor;
        }
        getParentThread() {
            return this._parentThread;
        }
        _getActions() {
            return editorExtensions_1.EditorExtensionsRegistry.getEditorActions();
        }
        static getEditorOptions() {
            return {
                wordWrap: 'on',
                glyphMargin: false,
                lineNumbers: 'off',
                folding: false,
                selectOnLineNumbers: false,
                scrollbar: {
                    vertical: 'visible',
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false
                },
                overviewRulerLanes: 2,
                lineDecorationsWidth: 0,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
                fixedOverflowWidgets: true,
                acceptSuggestionOnEnter: 'smart',
                minimap: {
                    enabled: false
                }
            };
        }
    };
    SimpleCommentEditor = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, codeEditorService_1.ICodeEditorService),
        __param(6, commands_1.ICommandService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, themeService_1.IThemeService),
        __param(9, notification_1.INotificationService),
        __param(10, accessibility_1.IAccessibilityService)
    ], SimpleCommentEditor);
    exports.SimpleCommentEditor = SimpleCommentEditor;
});
//# __sourceMappingURL=simpleCommentEditor.js.map