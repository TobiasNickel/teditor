/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/base/common/color"], function (require, exports, nls, colorRegistry_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WINDOW_INACTIVE_BORDER = exports.WINDOW_ACTIVE_BORDER = exports.NOTIFICATIONS_INFO_ICON_FOREGROUND = exports.NOTIFICATIONS_WARNING_ICON_FOREGROUND = exports.NOTIFICATIONS_ERROR_ICON_FOREGROUND = exports.NOTIFICATIONS_BORDER = exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND = exports.NOTIFICATIONS_CENTER_HEADER_FOREGROUND = exports.NOTIFICATIONS_LINKS = exports.NOTIFICATIONS_BACKGROUND = exports.NOTIFICATIONS_FOREGROUND = exports.NOTIFICATIONS_TOAST_BORDER = exports.NOTIFICATIONS_CENTER_BORDER = exports.MENUBAR_SELECTION_BORDER = exports.MENUBAR_SELECTION_BACKGROUND = exports.MENUBAR_SELECTION_FOREGROUND = exports.TITLE_BAR_BORDER = exports.TITLE_BAR_INACTIVE_BACKGROUND = exports.TITLE_BAR_ACTIVE_BACKGROUND = exports.TITLE_BAR_INACTIVE_FOREGROUND = exports.TITLE_BAR_ACTIVE_FOREGROUND = exports.SIDE_BAR_SECTION_HEADER_BORDER = exports.SIDE_BAR_SECTION_HEADER_FOREGROUND = exports.SIDE_BAR_SECTION_HEADER_BACKGROUND = exports.SIDE_BAR_DRAG_AND_DROP_BACKGROUND = exports.SIDE_BAR_TITLE_FOREGROUND = exports.SIDE_BAR_BORDER = exports.SIDE_BAR_FOREGROUND = exports.SIDE_BAR_BACKGROUND = exports.EXTENSION_BADGE_REMOTE_FOREGROUND = exports.EXTENSION_BADGE_REMOTE_BACKGROUND = exports.STATUS_BAR_HOST_NAME_FOREGROUND = exports.STATUS_BAR_HOST_NAME_BACKGROUND = exports.ACTIVITY_BAR_BADGE_FOREGROUND = exports.ACTIVITY_BAR_BADGE_BACKGROUND = exports.ACTIVITY_BAR_DRAG_AND_DROP_BORDER = exports.ACTIVITY_BAR_ACTIVE_BACKGROUND = exports.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER = exports.ACTIVITY_BAR_ACTIVE_BORDER = exports.ACTIVITY_BAR_BORDER = exports.ACTIVITY_BAR_INACTIVE_FOREGROUND = exports.ACTIVITY_BAR_FOREGROUND = exports.ACTIVITY_BAR_BACKGROUND = exports.STATUS_BAR_PROMINENT_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_PROMINENT_ITEM_BACKGROUND = exports.STATUS_BAR_PROMINENT_ITEM_FOREGROUND = exports.STATUS_BAR_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_ITEM_ACTIVE_BACKGROUND = exports.STATUS_BAR_NO_FOLDER_BORDER = exports.STATUS_BAR_BORDER = exports.STATUS_BAR_NO_FOLDER_BACKGROUND = exports.STATUS_BAR_BACKGROUND = exports.STATUS_BAR_NO_FOLDER_FOREGROUND = exports.STATUS_BAR_FOREGROUND = exports.PANEL_SECTION_BORDER = exports.PANEL_SECTION_HEADER_BORDER = exports.PANEL_SECTION_HEADER_FOREGROUND = exports.PANEL_SECTION_HEADER_BACKGROUND = exports.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND = exports.PANEL_DRAG_AND_DROP_BORDER = exports.PANEL_INPUT_BORDER = exports.PANEL_ACTIVE_TITLE_BORDER = exports.PANEL_INACTIVE_TITLE_FOREGROUND = exports.PANEL_ACTIVE_TITLE_FOREGROUND = exports.PANEL_BORDER = exports.PANEL_BACKGROUND = exports.IMAGE_PREVIEW_BORDER = exports.EDITOR_DRAG_AND_DROP_BACKGROUND = exports.EDITOR_GROUP_BORDER = exports.EDITOR_GROUP_HEADER_BORDER = exports.EDITOR_GROUP_HEADER_NO_TABS_BACKGROUND = exports.EDITOR_GROUP_HEADER_TABS_BORDER = exports.EDITOR_GROUP_HEADER_TABS_BACKGROUND = exports.EDITOR_GROUP_FOCUSED_EMPTY_BORDER = exports.EDITOR_GROUP_EMPTY_BACKGROUND = exports.EDITOR_PANE_BACKGROUND = exports.TAB_BORDER = exports.TAB_UNFOCUSED_INACTIVE_MODIFIED_BORDER = exports.TAB_UNFOCUSED_ACTIVE_MODIFIED_BORDER = exports.TAB_INACTIVE_MODIFIED_BORDER = exports.TAB_ACTIVE_MODIFIED_BORDER = exports.TAB_UNFOCUSED_HOVER_BORDER = exports.TAB_HOVER_BORDER = exports.TAB_UNFOCUSED_ACTIVE_BORDER_TOP = exports.TAB_ACTIVE_BORDER_TOP = exports.TAB_UNFOCUSED_ACTIVE_BORDER = exports.TAB_ACTIVE_BORDER = exports.TAB_UNFOCUSED_HOVER_FOREGROUND = exports.TAB_HOVER_FOREGROUND = exports.TAB_UNFOCUSED_HOVER_BACKGROUND = exports.TAB_HOVER_BACKGROUND = exports.TAB_UNFOCUSED_INACTIVE_FOREGROUND = exports.TAB_UNFOCUSED_ACTIVE_FOREGROUND = exports.TAB_INACTIVE_FOREGROUND = exports.TAB_ACTIVE_FOREGROUND = exports.TAB_UNFOCUSED_INACTIVE_BACKGROUND = exports.TAB_INACTIVE_BACKGROUND = exports.TAB_UNFOCUSED_ACTIVE_BACKGROUND = exports.TAB_ACTIVE_BACKGROUND = exports.WORKBENCH_BACKGROUND = void 0;
    // < --- Workbench (not customizable) --- >
    function WORKBENCH_BACKGROUND(theme) {
        switch (theme.type) {
            case 'dark':
                return color_1.Color.fromHex('#252526');
            case 'light':
                return color_1.Color.fromHex('#F3F3F3');
            default:
                return color_1.Color.fromHex('#000000');
        }
    }
    exports.WORKBENCH_BACKGROUND = WORKBENCH_BACKGROUND;
    // < --- Tabs --- >
    //#region Tab Background
    exports.TAB_ACTIVE_BACKGROUND = colorRegistry_1.registerColor('tab.activeBackground', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hc: colorRegistry_1.editorBackground
    }, nls.localize('tabActiveBackground', "Active tab background color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_BACKGROUND = colorRegistry_1.registerColor('tab.unfocusedActiveBackground', {
        dark: exports.TAB_ACTIVE_BACKGROUND,
        light: exports.TAB_ACTIVE_BACKGROUND,
        hc: exports.TAB_ACTIVE_BACKGROUND
    }, nls.localize('tabUnfocusedActiveBackground', "Active tab background color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_INACTIVE_BACKGROUND = colorRegistry_1.registerColor('tab.inactiveBackground', {
        dark: '#2D2D2D',
        light: '#ECECEC',
        hc: null
    }, nls.localize('tabInactiveBackground', "Inactive tab background color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_INACTIVE_BACKGROUND = colorRegistry_1.registerColor('tab.unfocusedInactiveBackground', {
        dark: exports.TAB_INACTIVE_BACKGROUND,
        light: exports.TAB_INACTIVE_BACKGROUND,
        hc: exports.TAB_INACTIVE_BACKGROUND
    }, nls.localize('tabUnfocusedInactiveBackground', "Inactive tab background color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Foreground
    exports.TAB_ACTIVE_FOREGROUND = colorRegistry_1.registerColor('tab.activeForeground', {
        dark: color_1.Color.white,
        light: '#333333',
        hc: color_1.Color.white
    }, nls.localize('tabActiveForeground', "Active tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_INACTIVE_FOREGROUND = colorRegistry_1.registerColor('tab.inactiveForeground', {
        dark: colorRegistry_1.transparent(exports.TAB_ACTIVE_FOREGROUND, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_ACTIVE_FOREGROUND, 0.7),
        hc: color_1.Color.white
    }, nls.localize('tabInactiveForeground', "Inactive tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_FOREGROUND = colorRegistry_1.registerColor('tab.unfocusedActiveForeground', {
        dark: colorRegistry_1.transparent(exports.TAB_ACTIVE_FOREGROUND, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_ACTIVE_FOREGROUND, 0.7),
        hc: color_1.Color.white
    }, nls.localize('tabUnfocusedActiveForeground', "Active tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_INACTIVE_FOREGROUND = colorRegistry_1.registerColor('tab.unfocusedInactiveForeground', {
        dark: colorRegistry_1.transparent(exports.TAB_INACTIVE_FOREGROUND, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_INACTIVE_FOREGROUND, 0.5),
        hc: color_1.Color.white
    }, nls.localize('tabUnfocusedInactiveForeground', "Inactive tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Hover Foreground/Background
    exports.TAB_HOVER_BACKGROUND = colorRegistry_1.registerColor('tab.hoverBackground', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('tabHoverBackground', "Tab background color when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_HOVER_BACKGROUND = colorRegistry_1.registerColor('tab.unfocusedHoverBackground', {
        dark: colorRegistry_1.transparent(exports.TAB_HOVER_BACKGROUND, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_HOVER_BACKGROUND, 0.7),
        hc: null
    }, nls.localize('tabUnfocusedHoverBackground', "Tab background color in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_HOVER_FOREGROUND = colorRegistry_1.registerColor('tab.hoverForeground', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('tabHoverForeground', "Tab foreground color when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_HOVER_FOREGROUND = colorRegistry_1.registerColor('tab.unfocusedHoverForeground', {
        dark: colorRegistry_1.transparent(exports.TAB_HOVER_FOREGROUND, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_HOVER_FOREGROUND, 0.5),
        hc: null
    }, nls.localize('tabUnfocusedHoverForeground', "Tab foreground color in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Borders
    exports.TAB_ACTIVE_BORDER = colorRegistry_1.registerColor('tab.activeBorder', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('tabActiveBorder', "Border on the bottom of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_BORDER = colorRegistry_1.registerColor('tab.unfocusedActiveBorder', {
        dark: colorRegistry_1.transparent(exports.TAB_ACTIVE_BORDER, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_ACTIVE_BORDER, 0.7),
        hc: null
    }, nls.localize('tabActiveUnfocusedBorder', "Border on the bottom of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_ACTIVE_BORDER_TOP = colorRegistry_1.registerColor('tab.activeBorderTop', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('tabActiveBorderTop', "Border to the top of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_BORDER_TOP = colorRegistry_1.registerColor('tab.unfocusedActiveBorderTop', {
        dark: colorRegistry_1.transparent(exports.TAB_ACTIVE_BORDER_TOP, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_ACTIVE_BORDER_TOP, 0.7),
        hc: null
    }, nls.localize('tabActiveUnfocusedBorderTop', "Border to the top of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_HOVER_BORDER = colorRegistry_1.registerColor('tab.hoverBorder', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('tabHoverBorder', "Border to highlight tabs when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_HOVER_BORDER = colorRegistry_1.registerColor('tab.unfocusedHoverBorder', {
        dark: colorRegistry_1.transparent(exports.TAB_HOVER_BORDER, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_HOVER_BORDER, 0.7),
        hc: null
    }, nls.localize('tabUnfocusedHoverBorder', "Border to highlight tabs in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Modified Border
    exports.TAB_ACTIVE_MODIFIED_BORDER = colorRegistry_1.registerColor('tab.activeModifiedBorder', {
        dark: '#3399CC',
        light: '#33AAEE',
        hc: null
    }, nls.localize('tabActiveModifiedBorder', "Border on the top of modified (dirty) active tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_INACTIVE_MODIFIED_BORDER = colorRegistry_1.registerColor('tab.inactiveModifiedBorder', {
        dark: colorRegistry_1.transparent(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.5),
        hc: color_1.Color.white
    }, nls.localize('tabInactiveModifiedBorder', "Border on the top of modified (dirty) inactive tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_MODIFIED_BORDER = colorRegistry_1.registerColor('tab.unfocusedActiveModifiedBorder', {
        dark: colorRegistry_1.transparent(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.7),
        hc: color_1.Color.white
    }, nls.localize('unfocusedActiveModifiedBorder', "Border on the top of modified (dirty) active tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_INACTIVE_MODIFIED_BORDER = colorRegistry_1.registerColor('tab.unfocusedInactiveModifiedBorder', {
        dark: colorRegistry_1.transparent(exports.TAB_INACTIVE_MODIFIED_BORDER, 0.5),
        light: colorRegistry_1.transparent(exports.TAB_INACTIVE_MODIFIED_BORDER, 0.5),
        hc: color_1.Color.white
    }, nls.localize('unfocusedINactiveModifiedBorder', "Border on the top of modified (dirty) inactive tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    exports.TAB_BORDER = colorRegistry_1.registerColor('tab.border', {
        dark: '#252526',
        light: '#F3F3F3',
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('tabBorder', "Border to separate tabs from each other. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    // < --- Editors --- >
    exports.EDITOR_PANE_BACKGROUND = colorRegistry_1.registerColor('editorPane.background', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hc: colorRegistry_1.editorBackground
    }, nls.localize('editorPaneBackground', "Background color of the editor pane visible on the left and right side of the centered editor layout."));
    colorRegistry_1.registerColor('editorGroup.background', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('editorGroupBackground', "Deprecated background color of an editor group."), false, nls.localize('deprecatedEditorGroupBackground', "Deprecated: Background color of an editor group is no longer being supported with the introduction of the grid editor layout. You can use editorGroup.emptyBackground to set the background color of empty editor groups."));
    exports.EDITOR_GROUP_EMPTY_BACKGROUND = colorRegistry_1.registerColor('editorGroup.emptyBackground', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('editorGroupEmptyBackground', "Background color of an empty editor group. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_FOCUSED_EMPTY_BORDER = colorRegistry_1.registerColor('editorGroup.focusedEmptyBorder', {
        dark: null,
        light: null,
        hc: colorRegistry_1.focusBorder
    }, nls.localize('editorGroupFocusedEmptyBorder', "Border color of an empty editor group that is focused. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_TABS_BACKGROUND = colorRegistry_1.registerColor('editorGroupHeader.tabsBackground', {
        dark: '#252526',
        light: '#F3F3F3',
        hc: null
    }, nls.localize('tabsContainerBackground', "Background color of the editor group title header when tabs are enabled. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_TABS_BORDER = colorRegistry_1.registerColor('editorGroupHeader.tabsBorder', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('tabsContainerBorder', "Border color of the editor group title header when tabs are enabled. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_NO_TABS_BACKGROUND = colorRegistry_1.registerColor('editorGroupHeader.noTabsBackground', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hc: colorRegistry_1.editorBackground
    }, nls.localize('editorGroupHeaderBackground', "Background color of the editor group title header when tabs are disabled (`\"workbench.editor.showTabs\": false`). Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_BORDER = colorRegistry_1.registerColor('editorGroupHeader.border', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('editorTitleContainerBorder', "Border color of the editor group title header. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_BORDER = colorRegistry_1.registerColor('editorGroup.border', {
        dark: '#444444',
        light: '#E7E7E7',
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('editorGroupBorder', "Color to separate multiple editor groups from each other. Editor groups are the containers of editors."));
    exports.EDITOR_DRAG_AND_DROP_BACKGROUND = colorRegistry_1.registerColor('editorGroup.dropBackground', {
        dark: color_1.Color.fromHex('#53595D').transparent(0.5),
        light: color_1.Color.fromHex('#2677CB').transparent(0.18),
        hc: null
    }, nls.localize('editorDragAndDropBackground', "Background color when dragging editors around. The color should have transparency so that the editor contents can still shine through."));
    // < --- Resource Viewer --- >
    exports.IMAGE_PREVIEW_BORDER = colorRegistry_1.registerColor('imagePreview.border', {
        dark: color_1.Color.fromHex('#808080').transparent(0.35),
        light: color_1.Color.fromHex('#808080').transparent(0.35),
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('imagePreviewBorder', "Border color for image in image preview."));
    // < --- Panels --- >
    exports.PANEL_BACKGROUND = colorRegistry_1.registerColor('panel.background', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hc: colorRegistry_1.editorBackground
    }, nls.localize('panelBackground', "Panel background color. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_BORDER = colorRegistry_1.registerColor('panel.border', {
        dark: color_1.Color.fromHex('#808080').transparent(0.35),
        light: color_1.Color.fromHex('#808080').transparent(0.35),
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('panelBorder', "Panel border color to separate the panel from the editor. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_ACTIVE_TITLE_FOREGROUND = colorRegistry_1.registerColor('panelTitle.activeForeground', {
        dark: '#E7E7E7',
        light: '#424242',
        hc: color_1.Color.white
    }, nls.localize('panelActiveTitleForeground', "Title color for the active panel. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_INACTIVE_TITLE_FOREGROUND = colorRegistry_1.registerColor('panelTitle.inactiveForeground', {
        dark: colorRegistry_1.transparent(exports.PANEL_ACTIVE_TITLE_FOREGROUND, 0.6),
        light: colorRegistry_1.transparent(exports.PANEL_ACTIVE_TITLE_FOREGROUND, 0.75),
        hc: color_1.Color.white
    }, nls.localize('panelInactiveTitleForeground', "Title color for the inactive panel. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_ACTIVE_TITLE_BORDER = colorRegistry_1.registerColor('panelTitle.activeBorder', {
        dark: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        light: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('panelActiveTitleBorder', "Border color for the active panel title. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_INPUT_BORDER = colorRegistry_1.registerColor('panelInput.border', {
        dark: null,
        light: color_1.Color.fromHex('#ddd'),
        hc: null
    }, nls.localize('panelInputBorder', "Input box border for inputs in the panel."));
    exports.PANEL_DRAG_AND_DROP_BORDER = colorRegistry_1.registerColor('panel.dropBorder', {
        dark: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        light: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        hc: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
    }, nls.localize('panelDragAndDropBorder', "Drag and drop feedback color for the panel titles. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND = colorRegistry_1.registerColor('panelSection.dropBackground', {
        dark: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        light: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        hc: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
    }, nls.localize('panelSectionDragAndDropBackground', "Drag and drop feedback color for the panel sections. The color should have transparency so that the panel sections can still shine through. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_SECTION_HEADER_BACKGROUND = colorRegistry_1.registerColor('panelSectionHeader.background', {
        dark: color_1.Color.fromHex('#808080').transparent(0.2),
        light: color_1.Color.fromHex('#808080').transparent(0.2),
        hc: null
    }, nls.localize('panelSectionHeaderBackground', "Panel section header background color. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_SECTION_HEADER_FOREGROUND = colorRegistry_1.registerColor('panelSectionHeader.foreground', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('panelSectionHeaderForeground', "Panel section header foreground color. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_SECTION_HEADER_BORDER = colorRegistry_1.registerColor('panelSectionHeader.border', {
        dark: colorRegistry_1.contrastBorder,
        light: colorRegistry_1.contrastBorder,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('panelSectionHeaderBorder', "Panel section header border color used when multiple views are stacked vertically in the panel. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_SECTION_BORDER = colorRegistry_1.registerColor('panelSection.border', {
        dark: exports.PANEL_BORDER,
        light: exports.PANEL_BORDER,
        hc: exports.PANEL_BORDER
    }, nls.localize('panelSectionBorder', "Panel section border color used when multiple views are stacked horizontally in the panel. Panels are shown below the editor area and contain views like output and integrated terminal."));
    // < --- Status --- >
    exports.STATUS_BAR_FOREGROUND = colorRegistry_1.registerColor('statusBar.foreground', {
        dark: '#FFFFFF',
        light: '#FFFFFF',
        hc: '#FFFFFF'
    }, nls.localize('statusBarForeground', "Status bar foreground color when a workspace is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_NO_FOLDER_FOREGROUND = colorRegistry_1.registerColor('statusBar.noFolderForeground', {
        dark: exports.STATUS_BAR_FOREGROUND,
        light: exports.STATUS_BAR_FOREGROUND,
        hc: exports.STATUS_BAR_FOREGROUND
    }, nls.localize('statusBarNoFolderForeground', "Status bar foreground color when no folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_BACKGROUND = colorRegistry_1.registerColor('statusBar.background', {
        dark: '#007ACC',
        light: '#007ACC',
        hc: null
    }, nls.localize('statusBarBackground', "Status bar background color when a workspace is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_NO_FOLDER_BACKGROUND = colorRegistry_1.registerColor('statusBar.noFolderBackground', {
        dark: '#68217A',
        light: '#68217A',
        hc: null
    }, nls.localize('statusBarNoFolderBackground', "Status bar background color when no folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_BORDER = colorRegistry_1.registerColor('statusBar.border', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('statusBarBorder', "Status bar border color separating to the sidebar and editor. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_NO_FOLDER_BORDER = colorRegistry_1.registerColor('statusBar.noFolderBorder', {
        dark: exports.STATUS_BAR_BORDER,
        light: exports.STATUS_BAR_BORDER,
        hc: exports.STATUS_BAR_BORDER
    }, nls.localize('statusBarNoFolderBorder', "Status bar border color separating to the sidebar and editor when no folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ITEM_ACTIVE_BACKGROUND = colorRegistry_1.registerColor('statusBarItem.activeBackground', {
        dark: color_1.Color.white.transparent(0.18),
        light: color_1.Color.white.transparent(0.18),
        hc: color_1.Color.white.transparent(0.18)
    }, nls.localize('statusBarItemActiveBackground', "Status bar item background color when clicking. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ITEM_HOVER_BACKGROUND = colorRegistry_1.registerColor('statusBarItem.hoverBackground', {
        dark: color_1.Color.white.transparent(0.12),
        light: color_1.Color.white.transparent(0.12),
        hc: color_1.Color.white.transparent(0.12)
    }, nls.localize('statusBarItemHoverBackground', "Status bar item background color when hovering. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_PROMINENT_ITEM_FOREGROUND = colorRegistry_1.registerColor('statusBarItem.prominentForeground', {
        dark: exports.STATUS_BAR_FOREGROUND,
        light: exports.STATUS_BAR_FOREGROUND,
        hc: exports.STATUS_BAR_FOREGROUND
    }, nls.localize('statusBarProminentItemForeground', "Status bar prominent items foreground color. Prominent items stand out from other status bar entries to indicate importance. Change mode `Toggle Tab Key Moves Focus` from command palette to see an example. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_PROMINENT_ITEM_BACKGROUND = colorRegistry_1.registerColor('statusBarItem.prominentBackground', {
        dark: color_1.Color.black.transparent(0.5),
        light: color_1.Color.black.transparent(0.5),
        hc: color_1.Color.black.transparent(0.5),
    }, nls.localize('statusBarProminentItemBackground', "Status bar prominent items background color. Prominent items stand out from other status bar entries to indicate importance. Change mode `Toggle Tab Key Moves Focus` from command palette to see an example. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_PROMINENT_ITEM_HOVER_BACKGROUND = colorRegistry_1.registerColor('statusBarItem.prominentHoverBackground', {
        dark: color_1.Color.black.transparent(0.3),
        light: color_1.Color.black.transparent(0.3),
        hc: color_1.Color.black.transparent(0.3),
    }, nls.localize('statusBarProminentItemHoverBackground', "Status bar prominent items background color when hovering. Prominent items stand out from other status bar entries to indicate importance. Change mode `Toggle Tab Key Moves Focus` from command palette to see an example. The status bar is shown in the bottom of the window."));
    // < --- Activity Bar --- >
    exports.ACTIVITY_BAR_BACKGROUND = colorRegistry_1.registerColor('activityBar.background', {
        dark: '#333333',
        light: '#2C2C2C',
        hc: '#000000'
    }, nls.localize('activityBarBackground', "Activity bar background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_FOREGROUND = colorRegistry_1.registerColor('activityBar.foreground', {
        dark: color_1.Color.white,
        light: color_1.Color.white,
        hc: color_1.Color.white
    }, nls.localize('activityBarForeground', "Activity bar item foreground color when it is active. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_INACTIVE_FOREGROUND = colorRegistry_1.registerColor('activityBar.inactiveForeground', {
        dark: colorRegistry_1.transparent(exports.ACTIVITY_BAR_FOREGROUND, 0.4),
        light: colorRegistry_1.transparent(exports.ACTIVITY_BAR_FOREGROUND, 0.4),
        hc: color_1.Color.white
    }, nls.localize('activityBarInActiveForeground', "Activity bar item foreground color when it is inactive. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_BORDER = colorRegistry_1.registerColor('activityBar.border', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('activityBarBorder', "Activity bar border color separating to the side bar. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_ACTIVE_BORDER = colorRegistry_1.registerColor('activityBar.activeBorder', {
        dark: exports.ACTIVITY_BAR_FOREGROUND,
        light: exports.ACTIVITY_BAR_FOREGROUND,
        hc: null
    }, nls.localize('activityBarActiveBorder', "Activity bar border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER = colorRegistry_1.registerColor('activityBar.activeFocusBorder', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('activityBarActiveFocusBorder', "Activity bar focus border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_ACTIVE_BACKGROUND = colorRegistry_1.registerColor('activityBar.activeBackground', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('activityBarActiveBackground', "Activity bar background color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_DRAG_AND_DROP_BORDER = colorRegistry_1.registerColor('activityBar.dropBorder', {
        dark: exports.ACTIVITY_BAR_FOREGROUND,
        light: exports.ACTIVITY_BAR_FOREGROUND,
        hc: exports.ACTIVITY_BAR_FOREGROUND,
    }, nls.localize('activityBarDragAndDropBorder', "Drag and drop feedback color for the activity bar items. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_BADGE_BACKGROUND = colorRegistry_1.registerColor('activityBarBadge.background', {
        dark: '#007ACC',
        light: '#007ACC',
        hc: '#000000'
    }, nls.localize('activityBarBadgeBackground', "Activity notification badge background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_BADGE_FOREGROUND = colorRegistry_1.registerColor('activityBarBadge.foreground', {
        dark: color_1.Color.white,
        light: color_1.Color.white,
        hc: color_1.Color.white
    }, nls.localize('activityBarBadgeForeground', "Activity notification badge foreground color. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    // < --- Remote --- >
    exports.STATUS_BAR_HOST_NAME_BACKGROUND = colorRegistry_1.registerColor('statusBarItem.remoteBackground', {
        dark: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        light: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        hc: exports.ACTIVITY_BAR_BADGE_BACKGROUND
    }, nls.localize('statusBarItemHostBackground', "Background color for the remote indicator on the status bar."));
    exports.STATUS_BAR_HOST_NAME_FOREGROUND = colorRegistry_1.registerColor('statusBarItem.remoteForeground', {
        dark: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        light: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        hc: exports.ACTIVITY_BAR_BADGE_FOREGROUND
    }, nls.localize('statusBarItemHostForeground', "Foreground color for the remote indicator on the status bar."));
    exports.EXTENSION_BADGE_REMOTE_BACKGROUND = colorRegistry_1.registerColor('extensionBadge.remoteBackground', {
        dark: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        light: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        hc: exports.ACTIVITY_BAR_BADGE_BACKGROUND
    }, nls.localize('extensionBadge.remoteBackground', "Background color for the remote badge in the extensions view."));
    exports.EXTENSION_BADGE_REMOTE_FOREGROUND = colorRegistry_1.registerColor('extensionBadge.remoteForeground', {
        dark: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        light: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        hc: exports.ACTIVITY_BAR_BADGE_FOREGROUND
    }, nls.localize('extensionBadge.remoteForeground', "Foreground color for the remote badge in the extensions view."));
    // < --- Side Bar --- >
    exports.SIDE_BAR_BACKGROUND = colorRegistry_1.registerColor('sideBar.background', {
        dark: '#252526',
        light: '#F3F3F3',
        hc: '#000000'
    }, nls.localize('sideBarBackground', "Side bar background color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_FOREGROUND = colorRegistry_1.registerColor('sideBar.foreground', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('sideBarForeground', "Side bar foreground color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_BORDER = colorRegistry_1.registerColor('sideBar.border', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('sideBarBorder', "Side bar border color on the side separating to the editor. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_TITLE_FOREGROUND = colorRegistry_1.registerColor('sideBarTitle.foreground', {
        dark: exports.SIDE_BAR_FOREGROUND,
        light: exports.SIDE_BAR_FOREGROUND,
        hc: exports.SIDE_BAR_FOREGROUND
    }, nls.localize('sideBarTitleForeground', "Side bar title foreground color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_DRAG_AND_DROP_BACKGROUND = colorRegistry_1.registerColor('sideBar.dropBackground', {
        dark: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        light: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        hc: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
    }, nls.localize('sideBarDragAndDropBackground', "Drag and drop feedback color for the side bar sections. The color should have transparency so that the side bar sections can still shine through. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_SECTION_HEADER_BACKGROUND = colorRegistry_1.registerColor('sideBarSectionHeader.background', {
        dark: color_1.Color.fromHex('#808080').transparent(0.2),
        light: color_1.Color.fromHex('#808080').transparent(0.2),
        hc: null
    }, nls.localize('sideBarSectionHeaderBackground', "Side bar section header background color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_SECTION_HEADER_FOREGROUND = colorRegistry_1.registerColor('sideBarSectionHeader.foreground', {
        dark: exports.SIDE_BAR_FOREGROUND,
        light: exports.SIDE_BAR_FOREGROUND,
        hc: exports.SIDE_BAR_FOREGROUND
    }, nls.localize('sideBarSectionHeaderForeground', "Side bar section header foreground color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_SECTION_HEADER_BORDER = colorRegistry_1.registerColor('sideBarSectionHeader.border', {
        dark: colorRegistry_1.contrastBorder,
        light: colorRegistry_1.contrastBorder,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('sideBarSectionHeaderBorder', "Side bar section header border color. The side bar is the container for views like explorer and search."));
    // < --- Title Bar --- >
    exports.TITLE_BAR_ACTIVE_FOREGROUND = colorRegistry_1.registerColor('titleBar.activeForeground', {
        dark: '#CCCCCC',
        light: '#333333',
        hc: '#FFFFFF'
    }, nls.localize('titleBarActiveForeground', "Title bar foreground when the window is active."));
    exports.TITLE_BAR_INACTIVE_FOREGROUND = colorRegistry_1.registerColor('titleBar.inactiveForeground', {
        dark: colorRegistry_1.transparent(exports.TITLE_BAR_ACTIVE_FOREGROUND, 0.6),
        light: colorRegistry_1.transparent(exports.TITLE_BAR_ACTIVE_FOREGROUND, 0.6),
        hc: null
    }, nls.localize('titleBarInactiveForeground', "Title bar foreground when the window is inactive."));
    exports.TITLE_BAR_ACTIVE_BACKGROUND = colorRegistry_1.registerColor('titleBar.activeBackground', {
        dark: '#3C3C3C',
        light: '#DDDDDD',
        hc: '#000000'
    }, nls.localize('titleBarActiveBackground', "Title bar background when the window is active."));
    exports.TITLE_BAR_INACTIVE_BACKGROUND = colorRegistry_1.registerColor('titleBar.inactiveBackground', {
        dark: colorRegistry_1.transparent(exports.TITLE_BAR_ACTIVE_BACKGROUND, 0.6),
        light: colorRegistry_1.transparent(exports.TITLE_BAR_ACTIVE_BACKGROUND, 0.6),
        hc: null
    }, nls.localize('titleBarInactiveBackground', "Title bar background when the window is inactive."));
    exports.TITLE_BAR_BORDER = colorRegistry_1.registerColor('titleBar.border', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('titleBarBorder', "Title bar border color."));
    // < --- Menubar --- >
    exports.MENUBAR_SELECTION_FOREGROUND = colorRegistry_1.registerColor('menubar.selectionForeground', {
        dark: exports.TITLE_BAR_ACTIVE_FOREGROUND,
        light: exports.TITLE_BAR_ACTIVE_FOREGROUND,
        hc: exports.TITLE_BAR_ACTIVE_FOREGROUND
    }, nls.localize('menubarSelectionForeground', "Foreground color of the selected menu item in the menubar."));
    exports.MENUBAR_SELECTION_BACKGROUND = colorRegistry_1.registerColor('menubar.selectionBackground', {
        dark: colorRegistry_1.transparent(color_1.Color.white, 0.1),
        light: colorRegistry_1.transparent(color_1.Color.black, 0.1),
        hc: null
    }, nls.localize('menubarSelectionBackground', "Background color of the selected menu item in the menubar."));
    exports.MENUBAR_SELECTION_BORDER = colorRegistry_1.registerColor('menubar.selectionBorder', {
        dark: null,
        light: null,
        hc: colorRegistry_1.activeContrastBorder
    }, nls.localize('menubarSelectionBorder', "Border color of the selected menu item in the menubar."));
    // < --- Notifications --- >
    exports.NOTIFICATIONS_CENTER_BORDER = colorRegistry_1.registerColor('notificationCenter.border', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('notificationCenterBorder', "Notifications center border color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_TOAST_BORDER = colorRegistry_1.registerColor('notificationToast.border', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('notificationToastBorder', "Notification toast border color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_FOREGROUND = colorRegistry_1.registerColor('notifications.foreground', {
        dark: colorRegistry_1.editorWidgetForeground,
        light: colorRegistry_1.editorWidgetForeground,
        hc: colorRegistry_1.editorWidgetForeground
    }, nls.localize('notificationsForeground', "Notifications foreground color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_BACKGROUND = colorRegistry_1.registerColor('notifications.background', {
        dark: colorRegistry_1.editorWidgetBackground,
        light: colorRegistry_1.editorWidgetBackground,
        hc: colorRegistry_1.editorWidgetBackground
    }, nls.localize('notificationsBackground', "Notifications background color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_LINKS = colorRegistry_1.registerColor('notificationLink.foreground', {
        dark: colorRegistry_1.textLinkForeground,
        light: colorRegistry_1.textLinkForeground,
        hc: colorRegistry_1.textLinkForeground
    }, nls.localize('notificationsLink', "Notification links foreground color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_CENTER_HEADER_FOREGROUND = colorRegistry_1.registerColor('notificationCenterHeader.foreground', {
        dark: null,
        light: null,
        hc: null
    }, nls.localize('notificationCenterHeaderForeground', "Notifications center header foreground color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND = colorRegistry_1.registerColor('notificationCenterHeader.background', {
        dark: colorRegistry_1.lighten(exports.NOTIFICATIONS_BACKGROUND, 0.3),
        light: colorRegistry_1.darken(exports.NOTIFICATIONS_BACKGROUND, 0.05),
        hc: exports.NOTIFICATIONS_BACKGROUND
    }, nls.localize('notificationCenterHeaderBackground', "Notifications center header background color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_BORDER = colorRegistry_1.registerColor('notifications.border', {
        dark: exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND,
        light: exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND,
        hc: exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND
    }, nls.localize('notificationsBorder', "Notifications border color separating from other notifications in the notifications center. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_ERROR_ICON_FOREGROUND = colorRegistry_1.registerColor('notificationsErrorIcon.foreground', {
        dark: colorRegistry_1.editorErrorForeground,
        light: colorRegistry_1.editorErrorForeground,
        hc: colorRegistry_1.editorErrorForeground
    }, nls.localize('notificationsErrorIconForeground', "The color used for the icon of error notifications. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_WARNING_ICON_FOREGROUND = colorRegistry_1.registerColor('notificationsWarningIcon.foreground', {
        dark: colorRegistry_1.editorWarningForeground,
        light: colorRegistry_1.editorWarningForeground,
        hc: colorRegistry_1.editorWarningForeground
    }, nls.localize('notificationsWarningIconForeground', "The color used for the icon of warning notifications. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_INFO_ICON_FOREGROUND = colorRegistry_1.registerColor('notificationsInfoIcon.foreground', {
        dark: colorRegistry_1.editorInfoForeground,
        light: colorRegistry_1.editorInfoForeground,
        hc: colorRegistry_1.editorInfoForeground
    }, nls.localize('notificationsInfoIconForeground', "The color used for the icon of info notifications. Notifications slide in from the bottom right of the window."));
    exports.WINDOW_ACTIVE_BORDER = colorRegistry_1.registerColor('window.activeBorder', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('windowActiveBorder', "The color used for the border of the window when it is active. Only supported in the desktop client when using the custom title bar."));
    exports.WINDOW_INACTIVE_BORDER = colorRegistry_1.registerColor('window.inactiveBorder', {
        dark: null,
        light: null,
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('windowInactiveBorder', "The color used for the border of the window when it is inactive. Only supported in the desktop client when using the custom title bar."));
});
//# __sourceMappingURL=theme.js.map