/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/editor", "vs/workbench/contrib/files/browser/editors/textFileEditor"], function (require, exports, nls, platform_1, fileEditorInput_1, descriptors_1, editor_1, textFileEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register file editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(textFileEditor_1.TextFileEditor, textFileEditor_1.TextFileEditor.ID, nls.localize('textFileEditor', "Text File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
});
//# __sourceMappingURL=files.web.contribution.js.map