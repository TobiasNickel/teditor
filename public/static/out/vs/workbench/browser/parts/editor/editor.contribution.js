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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/base/common/uri", "vs/workbench/browser/editor", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/browser/parts/editor/editorStatus", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/base/common/keyCodes", "vs/workbench/browser/parts/editor/editorActions", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/quickaccess", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/workbench/browser/parts/editor/editorWidgets", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/workbench/common/contributions", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/browser/parts/editor/editorAutoSave", "vs/editor/common/modes/modesRegistry", "vs/platform/quickinput/common/quickAccess", "vs/workbench/browser/parts/editor/editorQuickAccess"], function (require, exports, platform_1, nls, uri_1, editor_1, editor_2, textResourceEditor_1, sideBySideEditor_1, diffEditorInput_1, untitledTextEditorInput_1, resourceEditorInput_1, textDiffEditor_1, textfiles_1, binaryDiffEditor_1, editorStatus_1, actions_1, actions_2, descriptors_1, keyCodes_1, editorActions_1, editorCommands, editorService_1, quickaccess_1, keybindingsRegistry_1, contextkey_1, platform_2, editorExtensions_1, editorWidgets_1, environmentService_1, resources_1, contributions_1, filesConfigurationService_1, editorAutoSave_1, modesRegistry_1, quickAccess_1, editorQuickAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractSideBySideEditorInputFactory = void 0;
    // Register String Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(textResourceEditor_1.TextResourceEditor, textResourceEditor_1.TextResourceEditor.ID, nls.localize('textEditor', "Text Editor")), [
        new descriptors_1.SyncDescriptor(untitledTextEditorInput_1.UntitledTextEditorInput),
        new descriptors_1.SyncDescriptor(resourceEditorInput_1.ResourceEditorInput)
    ]);
    // Register Text Diff Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(textDiffEditor_1.TextDiffEditor, textDiffEditor_1.TextDiffEditor.ID, nls.localize('textDiffEditor', "Text Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    // Register Binary Resource Diff Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(binaryDiffEditor_1.BinaryResourceDiffEditor, binaryDiffEditor_1.BinaryResourceDiffEditor.ID, nls.localize('binaryDiffEditor', "Binary Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(sideBySideEditor_1.SideBySideEditor, sideBySideEditor_1.SideBySideEditor.ID, nls.localize('sideBySideEditor', "Side by Side Editor")), [
        new descriptors_1.SyncDescriptor(editor_2.SideBySideEditorInput)
    ]);
    // Register Editor Input Factory
    let UntitledTextEditorInputFactory = class UntitledTextEditorInputFactory {
        constructor(filesConfigurationService, environmentService) {
            this.filesConfigurationService = filesConfigurationService;
            this.environmentService = environmentService;
        }
        canSerialize(editorInput) {
            return this.filesConfigurationService.isHotExitEnabled && !editorInput.isDisposed();
        }
        serialize(editorInput) {
            if (!this.filesConfigurationService.isHotExitEnabled || editorInput.isDisposed()) {
                return undefined;
            }
            const untitledTextEditorInput = editorInput;
            let resource = untitledTextEditorInput.resource;
            if (untitledTextEditorInput.model.hasAssociatedFilePath) {
                resource = resources_1.toLocalResource(resource, this.environmentService.configuration.remoteAuthority); // untitled with associated file path use the local schema
            }
            // Mode: only remember mode if it is either specific (not text)
            // or if the mode was explicitly set by the user. We want to preserve
            // this information across restarts and not set the mode unless
            // this is the case.
            let modeId;
            const modeIdCandidate = untitledTextEditorInput.getMode();
            if (modeIdCandidate !== modesRegistry_1.PLAINTEXT_MODE_ID) {
                modeId = modeIdCandidate;
            }
            else if (untitledTextEditorInput.model.hasModeSetExplicitly) {
                modeId = modeIdCandidate;
            }
            const serialized = {
                resourceJSON: resource.toJSON(),
                modeId,
                encoding: untitledTextEditorInput.getEncoding()
            };
            return JSON.stringify(serialized);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.invokeFunction(accessor => {
                const deserialized = JSON.parse(serializedEditorInput);
                const resource = uri_1.URI.revive(deserialized.resourceJSON);
                const mode = deserialized.modeId;
                const encoding = deserialized.encoding;
                return accessor.get(editorService_1.IEditorService).createEditorInput({ resource, mode, encoding, forceUntitled: true });
            });
        }
    };
    UntitledTextEditorInputFactory = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], UntitledTextEditorInputFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(untitledTextEditorInput_1.UntitledTextEditorInput.ID, UntitledTextEditorInputFactory);
    class AbstractSideBySideEditorInputFactory {
        getInputFactories(secondaryId, primaryId) {
            const registry = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories);
            return [registry.getEditorInputFactory(secondaryId), registry.getEditorInputFactory(primaryId)];
        }
        canSerialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputFactory, primaryInputFactory] = this.getInputFactories(input.secondary.getTypeId(), input.primary.getTypeId());
                return !!((secondaryInputFactory === null || secondaryInputFactory === void 0 ? void 0 : secondaryInputFactory.canSerialize(input.secondary)) && (primaryInputFactory === null || primaryInputFactory === void 0 ? void 0 : primaryInputFactory.canSerialize(input.primary)));
            }
            return false;
        }
        serialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputFactory, primaryInputFactory] = this.getInputFactories(input.secondary.getTypeId(), input.primary.getTypeId());
                if (primaryInputFactory && secondaryInputFactory) {
                    const primarySerialized = primaryInputFactory.serialize(input.primary);
                    const secondarySerialized = secondaryInputFactory.serialize(input.secondary);
                    if (primarySerialized && secondarySerialized) {
                        const serializedEditorInput = {
                            name: input.getName(),
                            description: input.getDescription(),
                            primarySerialized: primarySerialized,
                            secondarySerialized: secondarySerialized,
                            primaryTypeId: input.primary.getTypeId(),
                            secondaryTypeId: input.secondary.getTypeId()
                        };
                        return JSON.stringify(serializedEditorInput);
                    }
                }
            }
            return undefined;
        }
        deserialize(instantiationService, serializedEditorInput) {
            const deserialized = JSON.parse(serializedEditorInput);
            const [secondaryInputFactory, primaryInputFactory] = this.getInputFactories(deserialized.secondaryTypeId, deserialized.primaryTypeId);
            if (primaryInputFactory && secondaryInputFactory) {
                const primaryInput = primaryInputFactory.deserialize(instantiationService, deserialized.primarySerialized);
                const secondaryInput = secondaryInputFactory.deserialize(instantiationService, deserialized.secondarySerialized);
                if (primaryInput && secondaryInput) {
                    return this.createEditorInput(deserialized.name, deserialized.description, secondaryInput, primaryInput);
                }
            }
            return undefined;
        }
    }
    exports.AbstractSideBySideEditorInputFactory = AbstractSideBySideEditorInputFactory;
    class SideBySideEditorInputFactory extends AbstractSideBySideEditorInputFactory {
        createEditorInput(name, description, secondaryInput, primaryInput) {
            return new editor_2.SideBySideEditorInput(name, description, secondaryInput, primaryInput);
        }
    }
    class DiffEditorInputFactory extends AbstractSideBySideEditorInputFactory {
        createEditorInput(name, description, secondaryInput, primaryInput) {
            return new diffEditorInput_1.DiffEditorInput(name, description, secondaryInput, primaryInput);
        }
    }
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(editor_2.SideBySideEditorInput.ID, SideBySideEditorInputFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(diffEditorInput_1.DiffEditorInput.ID, DiffEditorInputFactory);
    // Register Editor Contributions
    editorExtensions_1.registerEditorContribution(editorWidgets_1.OpenWorkspaceButtonContribution.ID, editorWidgets_1.OpenWorkspaceButtonContribution);
    // Register Editor Status
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(editorStatus_1.EditorStatus, 2 /* Ready */);
    // Register Editor Auto Save
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(editorAutoSave_1.EditorAutoSave, 2 /* Ready */);
    // Register Status Actions
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorStatus_1.ChangeModeAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 43 /* KEY_M */) }), 'Change Language Mode');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorStatus_1.ChangeEOLAction), 'Change End of Line Sequence');
    if (Object.keys(textfiles_1.SUPPORTED_ENCODINGS).length > 1) {
        registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorStatus_1.ChangeEncodingAction), 'Change File Encoding');
    }
    // Register Editor Quick Access
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    const editorPickerContextKey = 'inEditorsPicker';
    const editorPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(editorPickerContextKey));
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: nls.localize('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: nls.localize('activeGroupEditorsByMostRecentlyUsedQuickAccess', "Show Editors in Active Group by Most Recently Used"), needsEditor: false }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: nls.localize('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: nls.localize('allEditorsByAppearanceQuickAccess', "Show All Opened Editors By Appearance"), needsEditor: false }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: nls.localize('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: nls.localize('allEditorsByMostRecentlyUsedQuickAccess', "Show All Opened Editors By Most Recently Used"), needsEditor: false }]
    });
    // Register Editor Actions
    const category = nls.localize('view', "View");
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextEditor, { primary: 2048 /* CtrlCmd */ | 12 /* PageDown */, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 17 /* RightArrow */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 89 /* US_CLOSE_SQUARE_BRACKET */] } }), 'View: Open Next Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousEditor, { primary: 2048 /* CtrlCmd */ | 11 /* PageUp */, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 15 /* LeftArrow */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 87 /* US_OPEN_SQUARE_BRACKET */] } }), 'View: Open Previous Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextEditorInGroup, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 12 /* PageDown */), mac: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 512 /* Alt */ | 17 /* RightArrow */) } }), 'View: Open Next Editor in Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousEditorInGroup, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 11 /* PageUp */), mac: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 512 /* Alt */ | 15 /* LeftArrow */) } }), 'View: Open Previous Editor in Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextRecentlyUsedEditorAction), 'View: Open Next Recently Used Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousRecentlyUsedEditorAction), 'View: Open Previous Recently Used Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextRecentlyUsedEditorInGroupAction), 'View: Open Next Recently Used Editor In Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousRecentlyUsedEditorInGroupAction), 'View: Open Previous Recently Used Editor In Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenFirstEditorInGroup), 'View: Open First Editor in Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenLastEditorInGroup, { primary: 512 /* Alt */ | 21 /* KEY_0 */, secondary: [2048 /* CtrlCmd */ | 30 /* KEY_9 */], mac: { primary: 256 /* WinCtrl */ | 21 /* KEY_0 */, secondary: [2048 /* CtrlCmd */ | 30 /* KEY_9 */] } }), 'View: Open Last Editor in Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ReopenClosedEditorAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 50 /* KEY_T */ }), 'View: Reopen Closed Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ShowAllEditorsByAppearanceAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 46 /* KEY_P */), mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 2 /* Tab */ } }), 'View: Show All Editors By Appearance', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ShowAllEditorsByMostRecentlyUsedAction), 'View: Show All Editors By Most Recently Used', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ShowEditorsInActiveGroupByMostRecentlyUsedAction), 'View: Show Editors in Active Group By Most Recently Used', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ClearRecentFilesAction), 'File: Clear Recently Opened', nls.localize('file', "File"));
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseAllEditorsAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 53 /* KEY_W */) }), 'View: Close All Editors', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseAllEditorGroupsAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 53 /* KEY_W */) }), 'View: Close All Editor Groups', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseLeftEditorsInGroupAction), 'View: Close Editors to the Left in Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseEditorsInOtherGroupsAction), 'View: Close Editors in Other Groups', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseEditorInAllGroupsAction), 'View: Close Editor in All Groups', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorAction, { primary: 2048 /* CtrlCmd */ | 88 /* US_BACKSLASH */ }), 'View: Split Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorOrthogonalAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 88 /* US_BACKSLASH */) }), 'View: Split Editor Orthogonal', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorLeftAction), 'View: Split Editor Left', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorRightAction), 'View: Split Editor Right', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorUpAction), 'Split Editor Up', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorDownAction), 'View: Split Editor Down', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.JoinTwoGroupsAction), 'View: Join Editor Group with Next Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.JoinAllGroupsAction), 'View: Join All Editor Groups', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateBetweenGroupsAction), 'View: Navigate Between Editor Groups', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ResetGroupSizesAction), 'View: Reset Editor Group Sizes', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ToggleGroupSizesAction), 'View: Toggle Editor Group Sizes', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MaximizeGroupAction), 'View: Maximize Editor Group and Hide Side Bar', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MinimizeOtherGroupsAction), 'View: Maximize Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorLeftInGroupAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 11 /* PageUp */, mac: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 15 /* LeftArrow */) } }), 'View: Move Editor Left', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorRightInGroupAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 12 /* PageDown */, mac: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 17 /* RightArrow */) } }), 'View: Move Editor Right', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupLeftAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 15 /* LeftArrow */) }), 'View: Move Editor Group Left', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupRightAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 17 /* RightArrow */) }), 'View: Move Editor Group Right', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupUpAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 16 /* UpArrow */) }), 'View: Move Editor Group Up', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupDownAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 18 /* DownArrow */) }), 'View: Move Editor Group Down', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToPreviousGroupAction, { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 15 /* LeftArrow */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 15 /* LeftArrow */ } }), 'View: Move Editor into Previous Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToNextGroupAction, { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 17 /* RightArrow */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 17 /* RightArrow */ } }), 'View: Move Editor into Next Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToFirstGroupAction, { primary: 1024 /* Shift */ | 512 /* Alt */ | 22 /* KEY_1 */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 22 /* KEY_1 */ } }), 'View: Move Editor into First Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToLastGroupAction, { primary: 1024 /* Shift */ | 512 /* Alt */ | 30 /* KEY_9 */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 30 /* KEY_9 */ } }), 'View: Move Editor into Last Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToLeftGroupAction), 'View: Move Editor into Left Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToRightGroupAction), 'View: Move Editor into Right Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToAboveGroupAction), 'View: Move Editor into Above Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToBelowGroupAction), 'View: Move Editor into Below Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusActiveGroupAction), 'View: Focus Active Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusFirstGroupAction, { primary: 2048 /* CtrlCmd */ | 22 /* KEY_1 */ }), 'View: Focus First Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusLastGroupAction), 'View: Focus Last Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusPreviousGroup), 'View: Focus Previous Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusNextGroup), 'View: Focus Next Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusLeftGroup, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 15 /* LeftArrow */) }), 'View: Focus Left Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusRightGroup, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 17 /* RightArrow */) }), 'View: Focus Right Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusAboveGroup, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 16 /* UpArrow */) }), 'View: Focus Above Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusBelowGroup, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 18 /* DownArrow */) }), 'View: Focus Below Editor Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupLeftAction), 'View: New Editor Group to the Left', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupRightAction), 'View: New Editor Group to the Right', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupAboveAction), 'View: New Editor Group Above', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupBelowAction), 'View: New Editor Group Below', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateForwardAction, { primary: 0, win: { primary: 512 /* Alt */ | 17 /* RightArrow */ }, mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 83 /* US_MINUS */ }, linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 83 /* US_MINUS */ } }), 'Go Forward');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateBackwardsAction, { primary: 0, win: { primary: 512 /* Alt */ | 15 /* LeftArrow */ }, mac: { primary: 256 /* WinCtrl */ | 83 /* US_MINUS */ }, linux: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 83 /* US_MINUS */ } }), 'Go Back');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateToLastEditLocationAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 47 /* KEY_Q */) }), 'Go to Last Edit Location');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateLastAction), 'Go Last');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ClearEditorHistoryAction), 'Clear Editor History');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.RevertAndCloseEditorAction), 'View: Revert and Close Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutSingleAction), 'View: Single Column Editor Layout', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoColumnsAction), 'View: Two Columns Editor Layout', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutThreeColumnsAction), 'View: Three Columns Editor Layout', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoRowsAction), 'View: Two Rows Editor Layout', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutThreeRowsAction), 'View: Three Rows Editor Layout', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoByTwoGridAction), 'View: Grid Editor Layout (2x2)', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoRowsRightAction), 'View: Two Rows Right Editor Layout', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoColumnsBottomAction), 'View: Two Columns Bottom Editor Layout', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ReopenResourcesAction), 'View: Reopen Editor With...', category, editor_2.ActiveEditorAvailableEditorIdsContext);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ToggleEditorTypeAction), 'View: Toggle Editor Type', category, editor_2.ActiveEditorAvailableEditorIdsContext);
    // Register Quick Editor Actions including built in quick navigate support for some
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessPreviousRecentlyUsedEditorAction), 'View: Quick Open Previous Recently Used Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessLeastRecentlyUsedEditorAction), 'View: Quick Open Least Recently Used Editor', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessPreviousRecentlyUsedEditorInGroupAction, { primary: 2048 /* CtrlCmd */ | 2 /* Tab */, mac: { primary: 256 /* WinCtrl */ | 2 /* Tab */ } }), 'View: Quick Open Previous Recently Used Editor in Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessLeastRecentlyUsedEditorInGroupAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 2 /* Tab */, mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 2 /* Tab */ } }), 'View: Quick Open Least Recently Used Editor in Group', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessPreviousEditorFromHistoryAction), 'Quick Open Previous Editor from History');
    const quickAccessNavigateNextInEditorPickerId = 'workbench.action.quickOpenNavigateNextInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInEditorPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigateNextInEditorPickerId, true),
        when: editorPickerContext,
        primary: 2048 /* CtrlCmd */ | 2 /* Tab */,
        mac: { primary: 256 /* WinCtrl */ | 2 /* Tab */ }
    });
    const quickAccessNavigatePreviousInEditorPickerId = 'workbench.action.quickOpenNavigatePreviousInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInEditorPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigatePreviousInEditorPickerId, false),
        when: editorPickerContext,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 2 /* Tab */,
        mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 2 /* Tab */ }
    });
    // Editor Commands
    editorCommands.setup();
    // Touch Bar
    if (platform_2.isMacintosh) {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateBackwardsAction.ID, title: editorActions_1.NavigateBackwardsAction.LABEL, icon: { dark: uri_1.URI.parse(require.toUrl('vs/workbench/browser/parts/editor/media/back-tb.png')) } },
            group: 'navigation',
            order: 0
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateForwardAction.ID, title: editorActions_1.NavigateForwardAction.LABEL, icon: { dark: uri_1.URI.parse(require.toUrl('vs/workbench/browser/parts/editor/media/forward-tb.png')) } },
            group: 'navigation',
            order: 1
        });
    }
    // Empty Editor Group Context Menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands.SPLIT_EDITOR_UP, title: nls.localize('splitUp', "Split Up") }, group: '2_split', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands.SPLIT_EDITOR_DOWN, title: nls.localize('splitDown', "Split Down") }, group: '2_split', order: 20 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands.SPLIT_EDITOR_LEFT, title: nls.localize('splitLeft', "Split Left") }, group: '2_split', order: 30 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands.SPLIT_EDITOR_RIGHT, title: nls.localize('splitRight', "Split Right") }, group: '2_split', order: 40 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands.CLOSE_EDITOR_GROUP_COMMAND_ID, title: nls.localize('close', "Close") }, group: '3_close', order: 10, when: contextkey_1.ContextKeyExpr.has('multipleEditorGroups') });
    // Editor Title Context Menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.CLOSE_EDITOR_COMMAND_ID, title: nls.localize('close', "Close") }, group: '1_close', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: nls.localize('closeOthers', "Close Others"), precondition: editor_2.EditorGroupEditorsCountContext.notEqualsTo('1') }, group: '1_close', order: 20 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: nls.localize('closeRight', "Close to the Right"), precondition: editor_2.EditorGroupEditorsCountContext.notEqualsTo('1') }, group: '1_close', order: 30, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.CLOSE_SAVED_EDITORS_COMMAND_ID, title: nls.localize('closeAllSaved', "Close Saved") }, group: '1_close', order: 40 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: nls.localize('closeAll', "Close All") }, group: '1_close', order: 50 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.KEEP_EDITOR_COMMAND_ID, title: nls.localize('keepOpen', "Keep Open"), precondition: editor_2.EditorPinnedContext.toNegated() }, group: '3_preview', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.PIN_EDITOR_COMMAND_ID, title: nls.localize('pin', "Pin") }, group: '3_preview', order: 20, when: contextkey_1.ContextKeyExpr.and(editor_2.EditorStickyContext.toNegated(), contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs')) });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.UNPIN_EDITOR_COMMAND_ID, title: nls.localize('unpin', "Unpin") }, group: '3_preview', order: 20, when: contextkey_1.ContextKeyExpr.and(editor_2.EditorStickyContext, contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs')) });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.SPLIT_EDITOR_UP, title: nls.localize('splitUp', "Split Up") }, group: '5_split', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.SPLIT_EDITOR_DOWN, title: nls.localize('splitDown', "Split Down") }, group: '5_split', order: 20 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.SPLIT_EDITOR_LEFT, title: nls.localize('splitLeft', "Split Left") }, group: '5_split', order: 30 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands.SPLIT_EDITOR_RIGHT, title: nls.localize('splitRight', "Split Right") }, group: '5_split', order: 40 });
    // Editor Title Menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands.TOGGLE_DIFF_SIDE_BY_SIDE, title: nls.localize('toggleInlineView', "Toggle Inline View") }, group: '1_diff', order: 10, when: contextkey_1.ContextKeyExpr.has('isInDiffEditor') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands.SHOW_EDITORS_IN_GROUP, title: nls.localize('showOpenedEditors', "Show Opened Editors") }, group: '3_open', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: nls.localize('closeAll', "Close All") }, group: '5_close', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands.CLOSE_SAVED_EDITORS_COMMAND_ID, title: nls.localize('closeAllSaved', "Close Saved") }, group: '5_close', order: 20, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorActions_1.ReopenResourcesAction.ID, title: editorActions_1.ReopenResourcesAction.LABEL }, group: '6_reopen', order: 20, when: editor_2.ActiveEditorAvailableEditorIdsContext });
    function appendEditorToolItem(primary, when, order, alternative, precondition) {
        const item = {
            command: {
                id: primary.id,
                title: primary.title,
                icon: primary.icon,
                precondition
            },
            group: 'navigation',
            when,
            order
        };
        if (alternative) {
            item.alt = {
                id: alternative.id,
                title: alternative.title,
                icon: alternative.icon
            };
        }
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, item);
    }
    // Editor Title Menu: Split Editor
    appendEditorToolItem({
        id: editorActions_1.SplitEditorAction.ID,
        title: nls.localize('splitEditorRight', "Split Editor Right"),
        icon: { id: 'codicon/split-horizontal' }
    }, contextkey_1.ContextKeyExpr.not('splitEditorsVertically'), 100000, // towards the end
    {
        id: editorCommands.SPLIT_EDITOR_DOWN,
        title: nls.localize('splitEditorDown', "Split Editor Down"),
        icon: { id: 'codicon/split-vertical' }
    });
    appendEditorToolItem({
        id: editorActions_1.SplitEditorAction.ID,
        title: nls.localize('splitEditorDown', "Split Editor Down"),
        icon: { id: 'codicon/split-vertical' }
    }, contextkey_1.ContextKeyExpr.has('splitEditorsVertically'), 100000, // towards the end
    {
        id: editorCommands.SPLIT_EDITOR_RIGHT,
        title: nls.localize('splitEditorRight', "Split Editor Right"),
        icon: { id: 'codicon/split-horizontal' }
    });
    // Editor Title Menu: Close Group (tabs disabled)
    appendEditorToolItem({
        id: editorCommands.CLOSE_EDITOR_COMMAND_ID,
        title: nls.localize('close', "Close"),
        icon: { id: 'codicon/close' }
    }, contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('config.workbench.editor.showTabs'), contextkey_1.ContextKeyExpr.not('groupActiveEditorDirty')), 1000000, // towards the far end
    {
        id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: nls.localize('closeAll', "Close All"),
        icon: { id: 'codicon/close-all' }
    });
    appendEditorToolItem({
        id: editorCommands.CLOSE_EDITOR_COMMAND_ID,
        title: nls.localize('close', "Close"),
        icon: { id: 'codicon/close-dirty' }
    }, contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('config.workbench.editor.showTabs'), contextkey_1.ContextKeyExpr.has('groupActiveEditorDirty')), 1000000, // towards the far end
    {
        id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: nls.localize('closeAll', "Close All"),
        icon: { id: 'codicon/close-all' }
    });
    // Diff Editor Title Menu: Previous Change
    appendEditorToolItem({
        id: editorCommands.GOTO_PREVIOUS_CHANGE,
        title: nls.localize('navigate.prev.label', "Previous Change"),
        icon: { id: 'codicon/arrow-up' }
    }, editor_2.TextCompareEditorActiveContext, 10);
    // Diff Editor Title Menu: Next Change
    appendEditorToolItem({
        id: editorCommands.GOTO_NEXT_CHANGE,
        title: nls.localize('navigate.next.label', "Next Change"),
        icon: { id: 'codicon/arrow-down' }
    }, editor_2.TextCompareEditorActiveContext, 11);
    // Diff Editor Title Menu: Toggle Ignore Trim Whitespace (Enabled)
    appendEditorToolItem({
        id: editorCommands.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
        title: nls.localize('ignoreTrimWhitespace.label', "Ignore Leading/Trailing Whitespace Differences"),
        icon: { id: 'codicon/whitespace' }
    }, contextkey_1.ContextKeyExpr.and(editor_2.TextCompareEditorActiveContext, contextkey_1.ContextKeyExpr.notEquals('config.diffEditor.ignoreTrimWhitespace', true)), 20);
    // Diff Editor Title Menu: Toggle Ignore Trim Whitespace (Disabled)
    appendEditorToolItem({
        id: editorCommands.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
        title: nls.localize('showTrimWhitespace.label', "Show Leading/Trailing Whitespace Differences"),
        icon: { id: 'codicon/whitespace~disabled' }
    }, contextkey_1.ContextKeyExpr.and(editor_2.TextCompareEditorActiveContext, contextkey_1.ContextKeyExpr.notEquals('config.diffEditor.ignoreTrimWhitespace', false)), 20);
    // Editor Commands for Command Palette
    const viewCategory = { value: nls.localize('view', "View"), original: 'View' };
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands.KEEP_EDITOR_COMMAND_ID, title: { value: nls.localize('keepEditor', "Keep Editor"), original: 'Keep Editor' }, category: viewCategory }, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands.PIN_EDITOR_COMMAND_ID, title: { value: nls.localize('pinEditor', "Pin Editor"), original: 'Pin Editor' }, category: viewCategory }, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands.UNPIN_EDITOR_COMMAND_ID, title: { value: nls.localize('unpinEditor', "Unpin Editor"), original: 'Unpin Editor' }, category: viewCategory }, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: { value: nls.localize('closeEditorsInGroup', "Close All Editors in Group"), original: 'Close All Editors in Group' }, category: viewCategory } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands.CLOSE_SAVED_EDITORS_COMMAND_ID, title: { value: nls.localize('closeSavedEditors', "Close Saved Editors in Group"), original: 'Close Saved Editors in Group' }, category: viewCategory } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: { value: nls.localize('closeOtherEditors', "Close Other Editors in Group"), original: 'Close Other Editors in Group' }, category: viewCategory } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: { value: nls.localize('closeRightEditors', "Close Editors to the Right in Group"), original: 'Close Editors to the Right in Group' }, category: viewCategory } });
    // File menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarRecentMenu, {
        group: '1_editor',
        command: {
            id: editorActions_1.ReopenClosedEditorAction.ID,
            title: nls.localize({ key: 'miReopenClosedEditor', comment: ['&& denotes a mnemonic'] }, "&&Reopen Closed Editor"),
            precondition: contextkey_1.ContextKeyExpr.has('canReopenClosedEditor')
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarRecentMenu, {
        group: 'z_clear',
        command: {
            id: editorActions_1.ClearRecentFilesAction.ID,
            title: nls.localize({ key: 'miClearRecentOpen', comment: ['&& denotes a mnemonic'] }, "&&Clear Recently Opened")
        },
        order: 1
    });
    // Layout menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '2_appearance',
        title: nls.localize({ key: 'miEditorLayout', comment: ['&& denotes a mnemonic'] }, "Editor &&Layout"),
        submenu: actions_2.MenuId.MenubarLayoutMenu,
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_UP,
            title: nls.localize({ key: 'miSplitEditorUp', comment: ['&& denotes a mnemonic'] }, "Split &&Up")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_DOWN,
            title: nls.localize({ key: 'miSplitEditorDown', comment: ['&& denotes a mnemonic'] }, "Split &&Down")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_LEFT,
            title: nls.localize({ key: 'miSplitEditorLeft', comment: ['&& denotes a mnemonic'] }, "Split &&Left")
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands.SPLIT_EDITOR_RIGHT,
            title: nls.localize({ key: 'miSplitEditorRight', comment: ['&& denotes a mnemonic'] }, "Split &&Right")
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutSingleAction.ID,
            title: nls.localize({ key: 'miSingleColumnEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Single")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsAction.ID,
            title: nls.localize({ key: 'miTwoColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Two Columns")
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeColumnsAction.ID,
            title: nls.localize({ key: 'miThreeColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&hree Columns")
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsAction.ID,
            title: nls.localize({ key: 'miTwoRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&wo Rows")
        },
        order: 5
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeRowsAction.ID,
            title: nls.localize({ key: 'miThreeRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "Three &&Rows")
        },
        order: 6
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoByTwoGridAction.ID,
            title: nls.localize({ key: 'miTwoByTwoGridEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Grid (2x2)")
        },
        order: 7
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsRightAction.ID,
            title: nls.localize({ key: 'miTwoRowsRightEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two R&&ows Right")
        },
        order: 8
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsBottomAction.ID,
            title: nls.localize({ key: 'miTwoColumnsBottomEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two &&Columns Bottom")
        },
        order: 9
    });
    // Main Menu Bar Contributions:
    // Forward/Back
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateBack',
            title: nls.localize({ key: 'miBack', comment: ['&& denotes a mnemonic'] }, "&&Back"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateBack')
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateForward',
            title: nls.localize({ key: 'miForward', comment: ['&& denotes a mnemonic'] }, "&&Forward"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateForward')
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateToLastEditLocation',
            title: nls.localize({ key: 'miLastEditLocation', comment: ['&& denotes a mnemonic'] }, "&&Last Edit Location"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateToLastEditLocation')
        },
        order: 3
    });
    // Switch Editor
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '1_any',
        command: {
            id: 'workbench.action.nextEditor',
            title: nls.localize({ key: 'miNextEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Editor")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '1_any',
        command: {
            id: 'workbench.action.previousEditor',
            title: nls.localize({ key: 'miPreviousEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditor',
            title: nls.localize({ key: 'miNextRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditor',
            title: nls.localize({ key: 'miPreviousRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '3_group',
        command: {
            id: 'workbench.action.nextEditorInGroup',
            title: nls.localize({ key: 'miNextEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Editor in Group")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '3_group',
        command: {
            id: 'workbench.action.previousEditorInGroup',
            title: nls.localize({ key: 'miPreviousEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor in Group")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditorInGroup',
            title: nls.localize({ key: 'miNextUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor in Group")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditorInGroup',
            title: nls.localize({ key: 'miPreviousUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor in Group")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: nls.localize({ key: 'miSwitchEditor', comment: ['&& denotes a mnemonic'] }, "Switch &&Editor"),
        submenu: actions_2.MenuId.MenubarSwitchEditorMenu,
        order: 1
    });
    // Switch Group
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFirstEditorGroup',
            title: nls.localize({ key: 'miFocusFirstGroup', comment: ['&& denotes a mnemonic'] }, "Group &&1")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusSecondEditorGroup',
            title: nls.localize({ key: 'miFocusSecondGroup', comment: ['&& denotes a mnemonic'] }, "Group &&2")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusThirdEditorGroup',
            title: nls.localize({ key: 'miFocusThirdGroup', comment: ['&& denotes a mnemonic'] }, "Group &&3"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFourthEditorGroup',
            title: nls.localize({ key: 'miFocusFourthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&4"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFifthEditorGroup',
            title: nls.localize({ key: 'miFocusFifthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&5"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 5
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusNextGroup',
            title: nls.localize({ key: 'miNextGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Group"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusPreviousGroup',
            title: nls.localize({ key: 'miPreviousGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Group"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusLeftGroup',
            title: nls.localize({ key: 'miFocusLeftGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Left"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusRightGroup',
            title: nls.localize({ key: 'miFocusRightGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Right"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusAboveGroup',
            title: nls.localize({ key: 'miFocusAboveGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Above"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusBelowGroup',
            title: nls.localize({ key: 'miFocusBelowGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Below"),
            precondition: contextkey_1.ContextKeyExpr.has('multipleEditorGroups')
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: nls.localize({ key: 'miSwitchGroup', comment: ['&& denotes a mnemonic'] }, "Switch &&Group"),
        submenu: actions_2.MenuId.MenubarSwitchGroupMenu,
        order: 2
    });
});
//# __sourceMappingURL=editor.contribution.js.map