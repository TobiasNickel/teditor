/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/titleControl", "vs/workbench/browser/labels", "vs/workbench/common/theme", "vs/base/browser/touch", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/editor", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/color", "vs/base/common/types", "vs/css!./media/notabstitlecontrol"], function (require, exports, editor_1, titleControl_1, labels_1, theme_1, touch_1, dom_1, editor_2, editorCommands_1, color_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoTabsTitleControl = void 0;
    class NoTabsTitleControl extends titleControl_1.TitleControl {
        constructor() {
            super(...arguments);
            this.activeLabel = Object.create(null);
        }
        create(parent) {
            const titleContainer = this.titleContainer = parent;
            titleContainer.draggable = true;
            //Container listeners
            this.registerContainerListeners(titleContainer);
            // Gesture Support
            this._register(touch_1.Gesture.addTarget(titleContainer));
            const labelContainer = document.createElement('div');
            dom_1.addClass(labelContainer, 'label-container');
            titleContainer.appendChild(labelContainer);
            // Editor Label
            this.editorLabel = this._register(this.instantiationService.createInstance(labels_1.ResourceLabel, labelContainer, undefined)).element;
            this._register(dom_1.addDisposableListener(this.editorLabel.element, dom_1.EventType.CLICK, e => this.onTitleLabelClick(e)));
            // Breadcrumbs
            this.createBreadcrumbsControl(labelContainer, { showFileIcons: false, showSymbolIcons: true, showDecorationColors: false, breadcrumbsBackground: () => color_1.Color.transparent });
            dom_1.toggleClass(titleContainer, 'breadcrumbs', Boolean(this.breadcrumbsControl));
            this._register({ dispose: () => dom_1.removeClass(titleContainer, 'breadcrumbs') }); // import to remove because the container is a shared dom node
            // Right Actions Container
            const actionsContainer = document.createElement('div');
            dom_1.addClass(actionsContainer, 'title-actions');
            titleContainer.appendChild(actionsContainer);
            // Editor actions toolbar
            this.createEditorActionsToolBar(actionsContainer);
        }
        registerContainerListeners(titleContainer) {
            // Group dragging
            this.enableGroupDragging(titleContainer);
            // Pin on double click
            this._register(dom_1.addDisposableListener(titleContainer, dom_1.EventType.DBLCLICK, (e) => this.onTitleDoubleClick(e)));
            // Detect mouse click
            this._register(dom_1.addDisposableListener(titleContainer, dom_1.EventType.MOUSE_UP, (e) => this.onTitleClick(e)));
            // Detect touch
            this._register(dom_1.addDisposableListener(titleContainer, touch_1.EventType.Tap, (e) => this.onTitleClick(e)));
            // Context Menu
            this._register(dom_1.addDisposableListener(titleContainer, dom_1.EventType.CONTEXT_MENU, (e) => {
                if (this.group.activeEditor) {
                    this.onContextMenu(this.group.activeEditor, e, titleContainer);
                }
            }));
            this._register(dom_1.addDisposableListener(titleContainer, touch_1.EventType.Contextmenu, (e) => {
                if (this.group.activeEditor) {
                    this.onContextMenu(this.group.activeEditor, e, titleContainer);
                }
            }));
        }
        onTitleLabelClick(e) {
            dom_1.EventHelper.stop(e, false);
            // delayed to let the onTitleClick() come first which can cause a focus change which can close quick access
            setTimeout(() => this.quickInputService.quickAccess.show());
        }
        onTitleDoubleClick(e) {
            dom_1.EventHelper.stop(e);
            this.group.pinEditor();
        }
        onTitleClick(e) {
            if (e instanceof MouseEvent) {
                // Close editor on middle mouse click
                if (e.button === 1 /* Middle Button */) {
                    dom_1.EventHelper.stop(e, true /* for https://github.com/Microsoft/vscode/issues/56715 */);
                    if (this.group.activeEditor) {
                        this.group.closeEditor(this.group.activeEditor);
                    }
                }
            }
            else {
                // TODO@rebornix
                // gesture tap should open the quick access
                // editorGroupView will focus on the editor again when there are mouse/pointer/touch down events
                // we need to wait a bit as `GesureEvent.Tap` is generated from `touchstart` and then `touchend` evnets, which are not an atom event.
                setTimeout(() => this.quickInputService.quickAccess.show(), 50);
            }
        }
        getPreferredHeight() {
            return editor_2.EDITOR_TITLE_HEIGHT;
        }
        openEditor(editor) {
            const activeEditorChanged = this.ifActiveEditorChanged(() => this.redraw());
            if (!activeEditorChanged) {
                this.ifActiveEditorPropertiesChanged(() => this.redraw());
            }
        }
        closeEditor(editor) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        closeEditors(editors) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        moveEditor(editor, fromIndex, targetIndex) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        pinEditor(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        stickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        unstickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        setActive(isActive) {
            this.redraw();
        }
        updateEditorLabel(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        updateEditorLabels() {
            if (this.group.activeEditor) {
                this.updateEditorLabel(this.group.activeEditor); // we only have the active one to update
            }
        }
        updateEditorDirty(editor) {
            this.ifEditorIsActive(editor, () => {
                const titleContainer = types_1.assertIsDefined(this.titleContainer);
                // Signal dirty (unless saving)
                if (editor.isDirty() && !editor.isSaving()) {
                    dom_1.addClass(titleContainer, 'dirty');
                }
                // Otherwise, clear dirty
                else {
                    dom_1.removeClass(titleContainer, 'dirty');
                }
            });
        }
        updateOptions(oldOptions, newOptions) {
            if (oldOptions.labelFormat !== newOptions.labelFormat) {
                this.redraw();
            }
        }
        updateStyles() {
            this.redraw();
        }
        handleBreadcrumbsEnablementChange() {
            const titleContainer = types_1.assertIsDefined(this.titleContainer);
            dom_1.toggleClass(titleContainer, 'breadcrumbs', Boolean(this.breadcrumbsControl));
            this.redraw();
        }
        ifActiveEditorChanged(fn) {
            if (!this.activeLabel.editor && this.group.activeEditor || // active editor changed from null => editor
                this.activeLabel.editor && !this.group.activeEditor || // active editor changed from editor => null
                (!this.activeLabel.editor || !this.group.isActive(this.activeLabel.editor)) // active editor changed from editorA => editorB
            ) {
                fn();
                return true;
            }
            return false;
        }
        ifActiveEditorPropertiesChanged(fn) {
            if (!this.activeLabel.editor || !this.group.activeEditor) {
                return; // need an active editor to check for properties changed
            }
            if (this.activeLabel.pinned !== this.group.isPinned(this.group.activeEditor)) {
                fn(); // only run if pinned state has changed
            }
        }
        ifEditorIsActive(editor, fn) {
            if (this.group.isActive(editor)) {
                fn(); // only run if editor is current active
            }
        }
        redraw() {
            const editor = types_1.withNullAsUndefined(this.group.activeEditor);
            const isEditorPinned = editor ? this.group.isPinned(editor) : false;
            const isGroupActive = this.accessor.activeGroup === this.group;
            this.activeLabel = { editor, pinned: isEditorPinned };
            // Update Breadcrumbs
            if (this.breadcrumbsControl) {
                if (isGroupActive) {
                    this.breadcrumbsControl.update();
                    dom_1.toggleClass(this.breadcrumbsControl.domNode, 'preview', !isEditorPinned);
                }
                else {
                    this.breadcrumbsControl.hide();
                }
            }
            // Clear if there is no editor
            const [titleContainer, editorLabel] = types_1.assertAllDefined(this.titleContainer, this.editorLabel);
            if (!editor) {
                dom_1.removeClass(titleContainer, 'dirty');
                editorLabel.clear();
                this.clearEditorActionsToolbar();
            }
            // Otherwise render it
            else {
                // Dirty state
                this.updateEditorDirty(editor);
                // Editor Label
                const { labelFormat } = this.accessor.partOptions;
                let description;
                if (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden()) {
                    description = ''; // hide description when showing breadcrumbs
                }
                else if (labelFormat === 'default' && !isGroupActive) {
                    description = ''; // hide description when group is not active and style is 'default'
                }
                else {
                    description = editor.getDescription(this.getVerbosity(labelFormat)) || '';
                }
                let title = editor.getTitle(2 /* LONG */);
                if (description === title) {
                    title = ''; // dont repeat what is already shown
                }
                editorLabel.setResource({
                    resource: editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }),
                    name: editor.getName(),
                    description
                }, {
                    title,
                    italic: !isEditorPinned,
                    extraClasses: ['no-tabs', 'title-label']
                });
                if (isGroupActive) {
                    editorLabel.element.style.color = this.getColor(theme_1.TAB_ACTIVE_FOREGROUND) || '';
                }
                else {
                    editorLabel.element.style.color = this.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_FOREGROUND) || '';
                }
                // Update Editor Actions Toolbar
                this.updateEditorActionsToolbar();
            }
        }
        getVerbosity(style) {
            switch (style) {
                case 'short': return 0 /* SHORT */;
                case 'long': return 2 /* LONG */;
                default: return 1 /* MEDIUM */;
            }
        }
        prepareEditorActions(editorActions) {
            const isGroupActive = this.accessor.activeGroup === this.group;
            // Group active: show all actions
            if (isGroupActive) {
                return super.prepareEditorActions(editorActions);
            }
            // Group inactive: only show close action
            return { primaryEditorActions: editorActions.primary.filter(action => action.id === editorCommands_1.CLOSE_EDITOR_COMMAND_ID), secondaryEditorActions: [] };
        }
        layout(dimension) {
            if (this.breadcrumbsControl) {
                this.breadcrumbsControl.layout(undefined);
            }
        }
    }
    exports.NoTabsTitleControl = NoTabsTitleControl;
});
//# __sourceMappingURL=noTabsTitleControl.js.map