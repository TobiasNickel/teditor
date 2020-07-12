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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/codeEditorServiceImpl", "vs/platform/theme/common/themeService", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/extensions", "vs/base/common/resources"], function (require, exports, editorBrowser_1, codeEditorServiceImpl_1, themeService_1, editor_1, editorService_1, codeEditorService_1, extensions_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeEditorService = void 0;
    let CodeEditorService = class CodeEditorService extends codeEditorServiceImpl_1.CodeEditorServiceImpl {
        constructor(editorService, themeService) {
            super(themeService);
            this.editorService = editorService;
        }
        getActiveCodeEditor() {
            var _a;
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            if (editorBrowser_1.isCodeEditor(activeTextEditorControl)) {
                return activeTextEditorControl;
            }
            if (editorBrowser_1.isDiffEditor(activeTextEditorControl)) {
                return activeTextEditorControl.getModifiedEditor();
            }
            const activeControl = (_a = this.editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorBrowser_1.isCompositeEditor(activeControl) && editorBrowser_1.isCodeEditor(activeControl.activeCodeEditor)) {
                return activeControl.activeCodeEditor;
            }
            return null;
        }
        async openCodeEditor(input, source, sideBySide) {
            // Special case: If the active editor is a diff editor and the request to open originates and
            // targets the modified side of it, we just apply the request there to prevent opening the modified
            // side as separate editor.
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            if (!sideBySide && // we need the current active group to be the taret
                editorBrowser_1.isDiffEditor(activeTextEditorControl) && // we only support this for active text diff editors
                input.options && // we need options to apply
                input.resource && // we need a request resource to compare with
                activeTextEditorControl.getModel() && // we need a target model to compare with
                source === activeTextEditorControl.getModifiedEditor() && // we need the source of this request to be the modified side of the diff editor
                resources_1.extUri.isEqual(input.resource, activeTextEditorControl.getModel().modified.uri) // we need the input resources to match with modified side
            ) {
                const targetEditor = activeTextEditorControl.getModifiedEditor();
                const textOptions = editor_1.TextEditorOptions.create(input.options);
                textOptions.apply(targetEditor, 0 /* Smooth */);
                return targetEditor;
            }
            // Open using our normal editor service
            return this.doOpenCodeEditor(input, source, sideBySide);
        }
        async doOpenCodeEditor(input, source, sideBySide) {
            const control = await this.editorService.openEditor(input, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            if (control) {
                const widget = control.getControl();
                if (editorBrowser_1.isCodeEditor(widget)) {
                    return widget;
                }
                if (editorBrowser_1.isCompositeEditor(widget) && editorBrowser_1.isCodeEditor(widget.activeCodeEditor)) {
                    return widget.activeCodeEditor;
                }
            }
            return null;
        }
    };
    CodeEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, themeService_1.IThemeService)
    ], CodeEditorService);
    exports.CodeEditorService = CodeEditorService;
    extensions_1.registerSingleton(codeEditorService_1.ICodeEditorService, CodeEditorService, true);
});
//# __sourceMappingURL=codeEditorService.js.map