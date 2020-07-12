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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/getIconClasses", "vs/base/common/fuzzyScorer", "vs/base/common/codicons", "vs/css!./media/editorquickaccess"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, editorGroupsService_1, editor_1, editorService_1, modelService_1, modeService_1, getIconClasses_1, fuzzyScorer_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AllEditorsByMostRecentlyUsedQuickAccess = exports.AllEditorsByAppearanceQuickAccess = exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = exports.BaseEditorQuickAccessProvider = void 0;
    let BaseEditorQuickAccessProvider = class BaseEditorQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(prefix, editorGroupService, editorService, modelService, modeService) {
            super(prefix, {
                canAcceptInBackground: true,
                noResultsPick: {
                    label: nls_1.localize('noViewResults', "No matching editors"),
                    groupId: -1
                }
            });
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.pickState = new class {
                constructor() {
                    this.scorerCache = Object.create(null);
                    this.isQuickNavigating = undefined;
                }
                reset(isQuickNavigating) {
                    // Caches
                    if (!isQuickNavigating) {
                        this.scorerCache = Object.create(null);
                    }
                    // Other
                    this.isQuickNavigating = isQuickNavigating;
                }
            };
        }
        provide(picker, token) {
            // Reset the pick state for this run
            this.pickState.reset(!!picker.quickNavigate);
            // Start picker
            return super.provide(picker, token);
        }
        getPicks(filter) {
            const query = fuzzyScorer_1.prepareQuery(filter);
            // Filtering
            const filteredEditorEntries = this.doGetEditorPickItems().filter(entry => {
                if (!query.normalized) {
                    return true;
                }
                // Score on label and description
                const itemScore = fuzzyScorer_1.scoreItemFuzzy(entry, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                if (!itemScore.score) {
                    return false;
                }
                // Apply highlights
                entry.highlights = { label: itemScore.labelMatch, description: itemScore.descriptionMatch };
                return true;
            });
            // Sorting
            if (query.normalized) {
                const groups = this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */).map(group => group.id);
                filteredEditorEntries.sort((entryA, entryB) => {
                    if (entryA.groupId !== entryB.groupId) {
                        return groups.indexOf(entryA.groupId) - groups.indexOf(entryB.groupId); // older groups first
                    }
                    return fuzzyScorer_1.compareItemsByFuzzyScore(entryA, entryB, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                });
            }
            // Grouping (for more than one group)
            const filteredEditorEntriesWithSeparators = [];
            if (this.editorGroupService.count > 1) {
                let lastGroupId = undefined;
                for (const entry of filteredEditorEntries) {
                    if (typeof lastGroupId !== 'number' || lastGroupId !== entry.groupId) {
                        const group = this.editorGroupService.getGroup(entry.groupId);
                        if (group) {
                            filteredEditorEntriesWithSeparators.push({ type: 'separator', label: group.label });
                        }
                        lastGroupId = entry.groupId;
                    }
                    filteredEditorEntriesWithSeparators.push(entry);
                }
            }
            else {
                filteredEditorEntriesWithSeparators.push(...filteredEditorEntries);
            }
            return filteredEditorEntriesWithSeparators;
        }
        doGetEditorPickItems() {
            const editors = this.doGetEditors();
            const mapGroupIdToGroupAriaLabel = new Map();
            for (const { groupId } of editors) {
                if (!mapGroupIdToGroupAriaLabel.has(groupId)) {
                    const group = this.editorGroupService.getGroup(groupId);
                    if (group) {
                        mapGroupIdToGroupAriaLabel.set(groupId, group.ariaLabel);
                    }
                }
            }
            return this.doGetEditors().map(({ editor, groupId }) => {
                var _a;
                const resource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                const isDirty = editor.isDirty() && !editor.isSaving();
                const description = editor.getDescription();
                const nameAndDescription = description ? `${editor.getName()} ${description}` : editor.getName();
                return {
                    groupId,
                    resource,
                    label: editor.getName(),
                    ariaLabel: (() => {
                        if (mapGroupIdToGroupAriaLabel.size > 1) {
                            return isDirty ?
                                nls_1.localize('entryAriaLabelWithGroupDirty', "{0}, dirty, {1}", nameAndDescription, mapGroupIdToGroupAriaLabel.get(groupId)) :
                                nls_1.localize('entryAriaLabelWithGroup', "{0}, {1}", nameAndDescription, mapGroupIdToGroupAriaLabel.get(groupId));
                        }
                        return isDirty ? nls_1.localize('entryAriaLabelDirty', "{0}, dirty", nameAndDescription) : nameAndDescription;
                    })(),
                    description: editor.getDescription(),
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource),
                    italic: !((_a = this.editorGroupService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.isPinned(editor)),
                    buttons: (() => {
                        return [
                            {
                                iconClass: isDirty ? ('dirty-editor ' + codicons_1.Codicon.closeDirty.classNames) : codicons_1.Codicon.close.classNames,
                                tooltip: nls_1.localize('closeEditor', "Close Editor"),
                                alwaysVisible: isDirty
                            }
                        ];
                    })(),
                    trigger: async () => {
                        const group = this.editorGroupService.getGroup(groupId);
                        if (group) {
                            await group.closeEditor(editor, { preserveFocus: true });
                            if (!group.isOpened(editor)) {
                                return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                            }
                        }
                        return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                    },
                    accept: (keyMods, event) => { var _a; return (_a = this.editorGroupService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.openEditor(editor, { preserveFocus: event.inBackground }); },
                };
            });
        }
    };
    BaseEditorQuickAccessProvider = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, editorService_1.IEditorService),
        __param(3, modelService_1.IModelService),
        __param(4, modeService_1.IModeService)
    ], BaseEditorQuickAccessProvider);
    exports.BaseEditorQuickAccessProvider = BaseEditorQuickAccessProvider;
    //#region Active Editor Group Editors by Most Recently Used
    let ActiveGroupEditorsByMostRecentlyUsedQuickAccess = class ActiveGroupEditorsByMostRecentlyUsedQuickAccess extends BaseEditorQuickAccessProvider {
        constructor(editorGroupService, editorService, modelService, modeService) {
            super(ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, editorGroupService, editorService, modelService, modeService);
        }
        doGetEditors() {
            const group = this.editorGroupService.activeGroup;
            return group.getEditors(0 /* MOST_RECENTLY_ACTIVE */).map(editor => ({ editor, groupId: group.id }));
        }
    };
    ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX = 'edt active ';
    ActiveGroupEditorsByMostRecentlyUsedQuickAccess = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService)
    ], ActiveGroupEditorsByMostRecentlyUsedQuickAccess);
    exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = ActiveGroupEditorsByMostRecentlyUsedQuickAccess;
    //#endregion
    //#region All Editors by Appearance
    let AllEditorsByAppearanceQuickAccess = class AllEditorsByAppearanceQuickAccess extends BaseEditorQuickAccessProvider {
        constructor(editorGroupService, editorService, modelService, modeService) {
            super(AllEditorsByAppearanceQuickAccess.PREFIX, editorGroupService, editorService, modelService, modeService);
        }
        doGetEditors() {
            const entries = [];
            for (const group of this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */)) {
                for (const editor of group.getEditors(1 /* SEQUENTIAL */)) {
                    entries.push({ editor, groupId: group.id });
                }
            }
            return entries;
        }
    };
    AllEditorsByAppearanceQuickAccess.PREFIX = 'edt ';
    AllEditorsByAppearanceQuickAccess = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService)
    ], AllEditorsByAppearanceQuickAccess);
    exports.AllEditorsByAppearanceQuickAccess = AllEditorsByAppearanceQuickAccess;
    //#endregion
    //#region All Editors by Most Recently Used
    let AllEditorsByMostRecentlyUsedQuickAccess = class AllEditorsByMostRecentlyUsedQuickAccess extends BaseEditorQuickAccessProvider {
        constructor(editorGroupService, editorService, modelService, modeService) {
            super(AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, editorGroupService, editorService, modelService, modeService);
        }
        doGetEditors() {
            const entries = [];
            for (const editor of this.editorService.getEditors(0 /* MOST_RECENTLY_ACTIVE */)) {
                entries.push(editor);
            }
            return entries;
        }
    };
    AllEditorsByMostRecentlyUsedQuickAccess.PREFIX = 'edt mru ';
    AllEditorsByMostRecentlyUsedQuickAccess = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService)
    ], AllEditorsByMostRecentlyUsedQuickAccess);
    exports.AllEditorsByMostRecentlyUsedQuickAccess = AllEditorsByMostRecentlyUsedQuickAccess;
});
//#endregion
//# __sourceMappingURL=editorQuickAccess.js.map