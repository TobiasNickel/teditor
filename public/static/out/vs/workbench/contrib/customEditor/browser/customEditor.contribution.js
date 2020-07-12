/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/customEditor/browser/customEditorInputFactory", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/webview/browser/webviewEditor", "./customEditorInput", "./customEditors"], function (require, exports, network_1, descriptors_1, extensions_1, platform_1, editor_1, contributions_1, editor_2, customEditorInputFactory_1, customEditor_1, webviewEditor_1, customEditorInput_1, customEditors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(customEditor_1.ICustomEditorService, customEditors_1.CustomEditorService);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(customEditors_1.CustomEditorContribution, 1 /* Starting */);
    platform_1.Registry.as(editor_1.Extensions.Editors)
        .registerEditor(editor_1.EditorDescriptor.create(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, 'Webview Editor'), [
        new descriptors_1.SyncDescriptor(customEditorInput_1.CustomEditorInput)
    ]);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories)
        .registerEditorInputFactory(customEditorInputFactory_1.CustomEditorInputFactory.ID, customEditorInputFactory_1.CustomEditorInputFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories)
        .registerCustomEditorInputFactory(network_1.Schemas.vscodeCustomEditor, customEditorInputFactory_1.CustomEditorInputFactory);
});
//# __sourceMappingURL=customEditor.contribution.js.map