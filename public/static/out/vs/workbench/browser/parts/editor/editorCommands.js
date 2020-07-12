/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/common/editorContextKeys", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/base/common/keyCodes", "vs/base/common/uri", "vs/platform/quickinput/common/quickInput", "vs/platform/list/browser/listService", "vs/base/browser/ui/list/listWidget", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/editor/editorQuickAccess"], function (require, exports, nls, types, keybindingsRegistry_1, editor_1, editorService_1, editorContextKeys_1, textDiffEditor_1, keyCodes_1, uri_1, quickInput_1, listService_1, listWidget_1, arrays_1, editorGroupsService_1, contextkey_1, configuration_1, commands_1, actions_1, editorQuickAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setup = exports.getMultiSelectedEditorContexts = exports.splitEditor = exports.mergeAllGroups = exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = exports.SPLIT_EDITOR_RIGHT = exports.SPLIT_EDITOR_LEFT = exports.SPLIT_EDITOR_DOWN = exports.SPLIT_EDITOR_UP = exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = exports.GOTO_PREVIOUS_CHANGE = exports.GOTO_NEXT_CHANGE = exports.TOGGLE_DIFF_SIDE_BY_SIDE = exports.UNPIN_EDITOR_COMMAND_ID = exports.PIN_EDITOR_COMMAND_ID = exports.SHOW_EDITORS_IN_GROUP = exports.KEEP_EDITOR_COMMAND_ID = exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_EDITOR_GROUP_COMMAND_ID = exports.CLOSE_EDITOR_COMMAND_ID = exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_SAVED_EDITORS_COMMAND_ID = void 0;
    exports.CLOSE_SAVED_EDITORS_COMMAND_ID = 'workbench.action.closeUnmodifiedEditors';
    exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeEditorsInGroup';
    exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = 'workbench.action.closeEditorsAndGroup';
    exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = 'workbench.action.closeEditorsToTheRight';
    exports.CLOSE_EDITOR_COMMAND_ID = 'workbench.action.closeActiveEditor';
    exports.CLOSE_EDITOR_GROUP_COMMAND_ID = 'workbench.action.closeGroup';
    exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeOtherEditors';
    exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = 'moveActiveEditor';
    exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = 'layoutEditorGroups';
    exports.KEEP_EDITOR_COMMAND_ID = 'workbench.action.keepEditor';
    exports.SHOW_EDITORS_IN_GROUP = 'workbench.action.showEditorsInGroup';
    exports.PIN_EDITOR_COMMAND_ID = 'workbench.action.pinEditor';
    exports.UNPIN_EDITOR_COMMAND_ID = 'workbench.action.unpinEditor';
    exports.TOGGLE_DIFF_SIDE_BY_SIDE = 'toggle.diff.renderSideBySide';
    exports.GOTO_NEXT_CHANGE = 'workbench.action.compareEditor.nextChange';
    exports.GOTO_PREVIOUS_CHANGE = 'workbench.action.compareEditor.previousChange';
    exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = 'toggle.diff.ignoreTrimWhitespace';
    exports.SPLIT_EDITOR_UP = 'workbench.action.splitEditorUp';
    exports.SPLIT_EDITOR_DOWN = 'workbench.action.splitEditorDown';
    exports.SPLIT_EDITOR_LEFT = 'workbench.action.splitEditorLeft';
    exports.SPLIT_EDITOR_RIGHT = 'workbench.action.splitEditorRight';
    exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = 'workbench.action.openEditorAtIndex';
    const isActiveEditorMoveArg = function (arg) {
        if (!types.isObject(arg)) {
            return false;
        }
        if (!types.isString(arg.to)) {
            return false;
        }
        if (!types.isUndefined(arg.by) && !types.isString(arg.by)) {
            return false;
        }
        if (!types.isUndefined(arg.value) && !types.isNumber(arg.value)) {
            return false;
        }
        return true;
    };
    function registerActiveEditorMoveCommand() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.MOVE_ACTIVE_EDITOR_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 0,
            handler: (accessor, args) => moveActiveEditor(args, accessor),
            description: {
                description: nls.localize('editorCommand.activeEditorMove.description', "Move the active editor by tabs or groups"),
                args: [
                    {
                        name: nls.localize('editorCommand.activeEditorMove.arg.name', "Active editor move argument"),
                        description: nls.localize('editorCommand.activeEditorMove.arg.description', "Argument Properties:\n\t* 'to': String value providing where to move.\n\t* 'by': String value providing the unit for move (by tab or by group).\n\t* 'value': Number value providing how many positions or an absolute position to move."),
                        constraint: isActiveEditorMoveArg,
                        schema: {
                            'type': 'object',
                            'required': ['to'],
                            'properties': {
                                'to': {
                                    'type': 'string',
                                    'enum': ['left', 'right']
                                },
                                'by': {
                                    'type': 'string',
                                    'enum': ['tab', 'group']
                                },
                                'value': {
                                    'type': 'number'
                                }
                            },
                        }
                    }
                ]
            }
        });
    }
    function moveActiveEditor(args = Object.create(null), accessor) {
        args.to = args.to || 'right';
        args.by = args.by || 'tab';
        args.value = typeof args.value === 'number' ? args.value : 1;
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane) {
            switch (args.by) {
                case 'tab':
                    return moveActiveTab(args, activeEditorPane, accessor);
                case 'group':
                    return moveActiveEditorToGroup(args, activeEditorPane, accessor);
            }
        }
    }
    function moveActiveTab(args, control, accessor) {
        const group = control.group;
        let index = group.getIndexOfEditor(control.input);
        switch (args.to) {
            case 'first':
                index = 0;
                break;
            case 'last':
                index = group.count - 1;
                break;
            case 'left':
                index = index - args.value;
                break;
            case 'right':
                index = index + args.value;
                break;
            case 'center':
                index = Math.round(group.count / 2) - 1;
                break;
            case 'position':
                index = args.value - 1;
                break;
        }
        index = index < 0 ? 0 : index >= group.count ? group.count - 1 : index;
        group.moveEditor(control.input, group, { index });
    }
    function moveActiveEditorToGroup(args, control, accessor) {
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const sourceGroup = control.group;
        let targetGroup;
        switch (args.to) {
            case 'left':
                targetGroup = editorGroupService.findGroup({ direction: 2 /* LEFT */ }, sourceGroup);
                if (!targetGroup) {
                    targetGroup = editorGroupService.addGroup(sourceGroup, 2 /* LEFT */);
                }
                break;
            case 'right':
                targetGroup = editorGroupService.findGroup({ direction: 3 /* RIGHT */ }, sourceGroup);
                if (!targetGroup) {
                    targetGroup = editorGroupService.addGroup(sourceGroup, 3 /* RIGHT */);
                }
                break;
            case 'up':
                targetGroup = editorGroupService.findGroup({ direction: 0 /* UP */ }, sourceGroup);
                if (!targetGroup) {
                    targetGroup = editorGroupService.addGroup(sourceGroup, 0 /* UP */);
                }
                break;
            case 'down':
                targetGroup = editorGroupService.findGroup({ direction: 1 /* DOWN */ }, sourceGroup);
                if (!targetGroup) {
                    targetGroup = editorGroupService.addGroup(sourceGroup, 1 /* DOWN */);
                }
                break;
            case 'first':
                targetGroup = editorGroupService.findGroup({ location: 0 /* FIRST */ }, sourceGroup);
                break;
            case 'last':
                targetGroup = editorGroupService.findGroup({ location: 1 /* LAST */ }, sourceGroup);
                break;
            case 'previous':
                targetGroup = editorGroupService.findGroup({ location: 3 /* PREVIOUS */ }, sourceGroup);
                break;
            case 'next':
                targetGroup = editorGroupService.findGroup({ location: 2 /* NEXT */ }, sourceGroup);
                if (!targetGroup) {
                    targetGroup = editorGroupService.addGroup(sourceGroup, editorGroupsService_1.preferredSideBySideGroupDirection(configurationService));
                }
                break;
            case 'center':
                targetGroup = editorGroupService.getGroups(2 /* GRID_APPEARANCE */)[(editorGroupService.count / 2) - 1];
                break;
            case 'position':
                targetGroup = editorGroupService.getGroups(2 /* GRID_APPEARANCE */)[args.value - 1];
                break;
        }
        if (targetGroup) {
            sourceGroup.moveEditor(control.input, targetGroup);
            targetGroup.focus();
        }
    }
    function registerEditorGroupsLayoutCommand() {
        commands_1.CommandsRegistry.registerCommand(exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID, (accessor, args) => {
            if (!args || typeof args !== 'object') {
                return;
            }
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.applyLayout(args);
        });
    }
    function mergeAllGroups(editorGroupService) {
        const target = editorGroupService.activeGroup;
        editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */).forEach(group => {
            if (group === target) {
                return; // keep target
            }
            editorGroupService.mergeGroup(group, target);
        });
    }
    exports.mergeAllGroups = mergeAllGroups;
    function registerDiffEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_NEXT_CHANGE,
            weight: 200 /* WorkbenchContrib */,
            when: editor_1.TextCompareEditorVisibleContext,
            primary: 512 /* Alt */ | 63 /* F5 */,
            handler: accessor => navigateInDiffEditor(accessor, true)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_PREVIOUS_CHANGE,
            weight: 200 /* WorkbenchContrib */,
            when: editor_1.TextCompareEditorVisibleContext,
            primary: 512 /* Alt */ | 1024 /* Shift */ | 63 /* F5 */,
            handler: accessor => navigateInDiffEditor(accessor, false)
        });
        function navigateInDiffEditor(accessor, next) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const candidates = [editorService.activeEditorPane, ...editorService.visibleEditorPanes].filter(editor => editor instanceof textDiffEditor_1.TextDiffEditor);
            if (candidates.length > 0) {
                const navigator = candidates[0].getDiffNavigator();
                if (navigator) {
                    next ? navigator.next() : navigator.previous();
                }
            }
        }
        function toggleDiffSideBySide(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.renderSideBySide');
            configurationService.updateValue('diffEditor.renderSideBySide', newValue, 1 /* USER */);
        }
        function toggleDiffIgnoreTrimWhitespace(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.ignoreTrimWhitespace');
            configurationService.updateValue('diffEditor.ignoreTrimWhitespace', newValue, 1 /* USER */);
        }
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffSideBySide(accessor)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
                title: {
                    value: nls.localize('toggleInlineView', "Toggle Inline View"),
                    original: 'Compare: Toggle Inline View'
                },
                category: nls.localize('compare', "Compare")
            },
            when: contextkey_1.ContextKeyExpr.has('textCompareEditorActive')
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffIgnoreTrimWhitespace(accessor)
        });
    }
    function registerOpenEditorAtIndexCommands() {
        const openEditorAtIndex = (accessor, editorIndex) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane) {
                const editor = activeEditorPane.group.getEditorByIndex(editorIndex);
                if (editor) {
                    editorService.openEditor(editor);
                }
            }
        };
        // This command takes in the editor index number to open as an argument
        commands_1.CommandsRegistry.registerCommand({
            id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID,
            handler: openEditorAtIndex
        });
        // Keybindings to focus a specific index in the tab folder if tabs are enabled
        for (let i = 0; i < 9; i++) {
            const editorIndex = i;
            const visibleIndex = i + 1;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID + visibleIndex,
                weight: 200 /* WorkbenchContrib */,
                when: undefined,
                primary: 512 /* Alt */ | toKeyCode(visibleIndex),
                mac: { primary: 256 /* WinCtrl */ | toKeyCode(visibleIndex) },
                handler: accessor => openEditorAtIndex(accessor, editorIndex)
            });
        }
        function toKeyCode(index) {
            switch (index) {
                case 0: return 21 /* KEY_0 */;
                case 1: return 22 /* KEY_1 */;
                case 2: return 23 /* KEY_2 */;
                case 3: return 24 /* KEY_3 */;
                case 4: return 25 /* KEY_4 */;
                case 5: return 26 /* KEY_5 */;
                case 6: return 27 /* KEY_6 */;
                case 7: return 28 /* KEY_7 */;
                case 8: return 29 /* KEY_8 */;
                case 9: return 30 /* KEY_9 */;
            }
            throw new Error('invalid index');
        }
    }
    function registerFocusEditorGroupAtIndexCommands() {
        // Keybindings to focus a specific group (2-8) in the editor area
        for (let groupIndex = 1; groupIndex < 8; groupIndex++) {
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: toCommandId(groupIndex),
                weight: 200 /* WorkbenchContrib */,
                when: undefined,
                primary: 2048 /* CtrlCmd */ | toKeyCode(groupIndex),
                handler: accessor => {
                    const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    // To keep backwards compatibility (pre-grid), allow to focus a group
                    // that does not exist as long as it is the next group after the last
                    // opened group. Otherwise we return.
                    if (groupIndex > editorGroupService.count) {
                        return;
                    }
                    // Group exists: just focus
                    const groups = editorGroupService.getGroups(2 /* GRID_APPEARANCE */);
                    if (groups[groupIndex]) {
                        return groups[groupIndex].focus();
                    }
                    // Group does not exist: create new by splitting the active one of the last group
                    const direction = editorGroupsService_1.preferredSideBySideGroupDirection(configurationService);
                    const lastGroup = editorGroupService.findGroup({ location: 1 /* LAST */ });
                    const newGroup = editorGroupService.addGroup(lastGroup, direction);
                    // Focus
                    newGroup.focus();
                }
            });
        }
        function toCommandId(index) {
            switch (index) {
                case 1: return 'workbench.action.focusSecondEditorGroup';
                case 2: return 'workbench.action.focusThirdEditorGroup';
                case 3: return 'workbench.action.focusFourthEditorGroup';
                case 4: return 'workbench.action.focusFifthEditorGroup';
                case 5: return 'workbench.action.focusSixthEditorGroup';
                case 6: return 'workbench.action.focusSeventhEditorGroup';
                case 7: return 'workbench.action.focusEighthEditorGroup';
            }
            throw new Error('Invalid index');
        }
        function toKeyCode(index) {
            switch (index) {
                case 1: return 23 /* KEY_2 */;
                case 2: return 24 /* KEY_3 */;
                case 3: return 25 /* KEY_4 */;
                case 4: return 26 /* KEY_5 */;
                case 5: return 27 /* KEY_6 */;
                case 6: return 28 /* KEY_7 */;
                case 7: return 29 /* KEY_8 */;
            }
            throw new Error('Invalid index');
        }
    }
    function splitEditor(editorGroupService, direction, context) {
        let sourceGroup;
        if (context && typeof context.groupId === 'number') {
            sourceGroup = editorGroupService.getGroup(context.groupId);
        }
        else {
            sourceGroup = editorGroupService.activeGroup;
        }
        if (!sourceGroup) {
            return;
        }
        // Add group
        const newGroup = editorGroupService.addGroup(sourceGroup, direction);
        // Split editor (if it can be split)
        let editorToCopy;
        if (context && typeof context.editorIndex === 'number') {
            editorToCopy = sourceGroup.getEditorByIndex(context.editorIndex);
        }
        else {
            editorToCopy = types.withNullAsUndefined(sourceGroup.activeEditor);
        }
        if (editorToCopy && editorToCopy.supportsSplitEditor()) {
            sourceGroup.copyEditor(editorToCopy, newGroup);
        }
        // Focus
        newGroup.focus();
    }
    exports.splitEditor = splitEditor;
    function registerSplitEditorCommands() {
        [
            { id: exports.SPLIT_EDITOR_UP, direction: 0 /* UP */ },
            { id: exports.SPLIT_EDITOR_DOWN, direction: 1 /* DOWN */ },
            { id: exports.SPLIT_EDITOR_LEFT, direction: 2 /* LEFT */ },
            { id: exports.SPLIT_EDITOR_RIGHT, direction: 3 /* RIGHT */ }
        ].forEach(({ id, direction }) => {
            commands_1.CommandsRegistry.registerCommand(id, function (accessor, resourceOrContext, context) {
                splitEditor(accessor.get(editorGroupsService_1.IEditorGroupsService), direction, getCommandsContext(resourceOrContext, context));
            });
        });
    }
    function registerCloseEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_SAVED_EDITORS_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 51 /* KEY_U */),
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const contexts = getMultiSelectedEditorContexts(getCommandsContext(resourceOrContext, context), accessor.get(listService_1.IListService), editorGroupService);
                const activeGroup = editorGroupService.activeGroup;
                if (contexts.length === 0) {
                    contexts.push({ groupId: activeGroup.id }); // active group as fallback
                }
                return Promise.all(arrays_1.distinct(contexts.map(c => c.groupId)).map(async (groupId) => {
                    const group = editorGroupService.getGroup(groupId);
                    if (group) {
                        return group.closeEditors({ savedOnly: true, excludeSticky: true });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 53 /* KEY_W */),
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const contexts = getMultiSelectedEditorContexts(getCommandsContext(resourceOrContext, context), accessor.get(listService_1.IListService), editorGroupService);
                const distinctGroupIds = arrays_1.distinct(contexts.map(c => c.groupId));
                if (distinctGroupIds.length === 0) {
                    distinctGroupIds.push(editorGroupService.activeGroup.id);
                }
                return Promise.all(distinctGroupIds.map(async (groupId) => {
                    const group = editorGroupService.getGroup(groupId);
                    if (group) {
                        return group.closeAllEditors({ excludeSticky: true });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: 2048 /* CtrlCmd */ | 53 /* KEY_W */,
            win: { primary: 2048 /* CtrlCmd */ | 62 /* F4 */, secondary: [2048 /* CtrlCmd */ | 53 /* KEY_W */] },
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const contexts = getMultiSelectedEditorContexts(getCommandsContext(resourceOrContext, context), accessor.get(listService_1.IListService), editorGroupService);
                const activeGroup = editorGroupService.activeGroup;
                if (contexts.length === 0 && activeGroup.activeEditor) {
                    contexts.push({ groupId: activeGroup.id, editorIndex: activeGroup.getIndexOfEditor(activeGroup.activeEditor) }); // active editor as fallback
                }
                const groupIds = arrays_1.distinct(contexts.map(context => context.groupId));
                return Promise.all(groupIds.map(async (groupId) => {
                    const group = editorGroupService.getGroup(groupId);
                    if (group) {
                        const editors = arrays_1.coalesce(contexts
                            .filter(context => context.groupId === groupId)
                            .map(context => typeof context.editorIndex === 'number' ? group.getEditorByIndex(context.editorIndex) : group.activeEditor));
                        return group.closeEditors(editors);
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_GROUP_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(editor_1.ActiveEditorGroupEmptyContext, editor_1.MultipleEditorGroupsContext),
            primary: 2048 /* CtrlCmd */ | 53 /* KEY_W */,
            win: { primary: 2048 /* CtrlCmd */ | 62 /* F4 */, secondary: [2048 /* CtrlCmd */ | 53 /* KEY_W */] },
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                let group;
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    group = editorGroupService.getGroup(commandsContext.groupId);
                }
                else {
                    group = editorGroupService.activeGroup;
                }
                if (group) {
                    editorGroupService.removeGroup(group);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 50 /* KEY_T */ },
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const contexts = getMultiSelectedEditorContexts(getCommandsContext(resourceOrContext, context), accessor.get(listService_1.IListService), editorGroupService);
                const activeGroup = editorGroupService.activeGroup;
                if (contexts.length === 0 && activeGroup.activeEditor) {
                    contexts.push({ groupId: activeGroup.id, editorIndex: activeGroup.getIndexOfEditor(activeGroup.activeEditor) }); // active editor as fallback
                }
                const groupIds = arrays_1.distinct(contexts.map(context => context.groupId));
                return Promise.all(groupIds.map(async (groupId) => {
                    const group = editorGroupService.getGroup(groupId);
                    if (group) {
                        const editors = contexts
                            .filter(context => context.groupId === groupId)
                            .map(context => typeof context.editorIndex === 'number' ? group.getEditorByIndex(context.editorIndex) : group.activeEditor);
                        const editorsToClose = group.getEditors(1 /* SEQUENTIAL */, { excludeSticky: true }).filter(editor => editors.indexOf(editor) === -1);
                        if (group.activeEditor) {
                            group.pinEditor(group.activeEditor);
                        }
                        return group.closeEditors(editorsToClose);
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    if (group.activeEditor) {
                        group.pinEditor(group.activeEditor);
                    }
                    return group.closeEditors({ direction: 1 /* RIGHT */, except: editor, excludeSticky: true });
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.KEEP_EDITOR_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 3 /* Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.pinEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.PIN_EDITOR_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(editor_1.EditorStickyContext.toNegated(), contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs')),
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 1024 /* Shift */ | 3 /* Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.stickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.UNPIN_EDITOR_COMMAND_ID,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(editor_1.EditorStickyContext, contextkey_1.ContextKeyExpr.has('config.workbench.editor.showTabs')),
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 1024 /* Shift */ | 3 /* Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.unstickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.SHOW_EDITORS_IN_GROUP,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    const group = editorGroupService.getGroup(commandsContext.groupId);
                    if (group) {
                        editorGroupService.activateGroup(group); // we need the group to be active
                    }
                }
                return quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, async (accessor, resourceOrContext, context) => {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (group) {
                await group.closeAllEditors();
                if (group.count === 0 && editorGroupService.getGroup(group.id) /* could be gone by now */) {
                    editorGroupService.removeGroup(group); // only remove group if it is now empty
                }
            }
        });
    }
    function getCommandsContext(resourceOrContext, context) {
        if (uri_1.URI.isUri(resourceOrContext)) {
            return context;
        }
        if (resourceOrContext && typeof resourceOrContext.groupId === 'number') {
            return resourceOrContext;
        }
        if (context && typeof context.groupId === 'number') {
            return context;
        }
        return undefined;
    }
    function resolveCommandsContext(editorGroupService, context) {
        // Resolve from context
        let group = context && typeof context.groupId === 'number' ? editorGroupService.getGroup(context.groupId) : undefined;
        let editor = group && context && typeof context.editorIndex === 'number' ? types.withNullAsUndefined(group.getEditorByIndex(context.editorIndex)) : undefined;
        // Fallback to active group as needed
        if (!group) {
            group = editorGroupService.activeGroup;
            editor = group.activeEditor;
        }
        return { group, editor };
    }
    function getMultiSelectedEditorContexts(editorContext, listService, editorGroupService) {
        // First check for a focused list to return the selected items from
        const list = listService.lastFocusedList;
        if (list instanceof listWidget_1.List && list.getHTMLElement() === document.activeElement) {
            const elementToContext = (element) => {
                if (isEditorGroup(element)) {
                    return { groupId: element.id, editorIndex: undefined };
                }
                const group = editorGroupService.getGroup(element.groupId);
                return { groupId: element.groupId, editorIndex: group ? group.getIndexOfEditor(element.editor) : -1 };
            };
            const onlyEditorGroupAndEditor = (e) => isEditorGroup(e) || isEditorIdentifier(e);
            const focusedElements = list.getFocusedElements().filter(onlyEditorGroupAndEditor);
            const focus = editorContext ? editorContext : focusedElements.length ? focusedElements.map(elementToContext)[0] : undefined; // need to take into account when editor context is { group: group }
            if (focus) {
                const selection = list.getSelectedElements().filter(onlyEditorGroupAndEditor);
                // Only respect selection if it contains focused element
                if (selection === null || selection === void 0 ? void 0 : selection.some(s => {
                    if (isEditorGroup(s)) {
                        return s.id === focus.groupId;
                    }
                    const group = editorGroupService.getGroup(s.groupId);
                    return s.groupId === focus.groupId && (group ? group.getIndexOfEditor(s.editor) : -1) === focus.editorIndex;
                })) {
                    return selection.map(elementToContext);
                }
                return [focus];
            }
        }
        // Otherwise go with passed in context
        return !!editorContext ? [editorContext] : [];
    }
    exports.getMultiSelectedEditorContexts = getMultiSelectedEditorContexts;
    function isEditorGroup(thing) {
        const group = thing;
        return group && typeof group.id === 'number' && Array.isArray(group.editors);
    }
    function isEditorIdentifier(thing) {
        const identifier = thing;
        return identifier && typeof identifier.groupId === 'number';
    }
    function setup() {
        registerActiveEditorMoveCommand();
        registerEditorGroupsLayoutCommand();
        registerDiffEditorCommands();
        registerOpenEditorAtIndexCommands();
        registerCloseEditorCommands();
        registerFocusEditorGroupAtIndexCommands();
        registerSplitEditorCommands();
    }
    exports.setup = setup;
});
//# __sourceMappingURL=editorCommands.js.map