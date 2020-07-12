/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/welcome/walkThrough/browser/walkThroughInput", "vs/workbench/contrib/welcome/walkThrough/browser/walkThroughPart", "vs/workbench/contrib/welcome/walkThrough/browser/walkThroughActions", "vs/workbench/contrib/welcome/walkThrough/common/walkThroughContentProvider", "vs/workbench/contrib/welcome/walkThrough/browser/editor/editorWalkThrough", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/common/contributions", "vs/workbench/browser/editor", "vs/platform/keybinding/common/keybindingsRegistry"], function (require, exports, nls_1, walkThroughInput_1, walkThroughPart_1, walkThroughActions_1, walkThroughContentProvider_1, editorWalkThrough_1, platform_1, editor_1, descriptors_1, actions_1, actions_2, contributions_1, editor_2, keybindingsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(editor_2.Extensions.Editors)
        .registerEditor(editor_2.EditorDescriptor.create(walkThroughPart_1.WalkThroughPart, walkThroughPart_1.WalkThroughPart.ID, nls_1.localize('walkThrough.editor.label', "Interactive Playground")), [new descriptors_1.SyncDescriptor(walkThroughInput_1.WalkThroughInput)]);
    platform_1.Registry.as(actions_1.Extensions.WorkbenchActions)
        .registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorWalkThrough_1.EditorWalkThroughAction), 'Help: Interactive Playground', nls_1.localize('help', "Help"));
    platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).registerEditorInputFactory(editorWalkThrough_1.EditorWalkThroughInputFactory.ID, editorWalkThrough_1.EditorWalkThroughInputFactory);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(walkThroughContentProvider_1.WalkThroughContentProvider, 1 /* Starting */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(walkThroughContentProvider_1.WalkThroughSnippetContentProvider, 1 /* Starting */);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughArrowUp);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughArrowDown);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughPageUp);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughPageDown);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarHelpMenu, {
        group: '1_welcome',
        command: {
            id: 'workbench.action.showInteractivePlayground',
            title: nls_1.localize({ key: 'miInteractivePlayground', comment: ['&& denotes a mnemonic'] }, "I&&nteractive Playground")
        },
        order: 2
    });
});
//# __sourceMappingURL=walkThrough.contribution.js.map