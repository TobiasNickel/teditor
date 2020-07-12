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
define(["require", "exports", "vs/workbench/browser/dnd", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/editor", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/async", "vs/base/browser/dnd", "vs/base/common/buffer", "vs/platform/dialogs/common/dialogs", "vs/base/common/resources", "vs/workbench/services/editor/common/editorService", "vs/base/common/types", "vs/platform/notification/common/notification", "vs/nls", "vs/css!./media/editordroptarget"], function (require, exports, dnd_1, dom_1, editor_1, theme_1, themeService_1, colorRegistry_1, editor_2, platform_1, lifecycle_1, instantiation_1, async_1, dnd_2, buffer_1, dialogs_1, resources_1, editorService_1, types_1, notification_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorDropTarget = void 0;
    let DropOverlay = class DropOverlay extends themeService_1.Themable {
        constructor(accessor, groupView, themeService, instantiationService, fileDialogService, editorService, notificationService) {
            super(themeService);
            this.accessor = accessor;
            this.groupView = groupView;
            this.instantiationService = instantiationService;
            this.fileDialogService = fileDialogService;
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.editorTransfer = dnd_1.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_1.LocalSelectionTransfer.getInstance();
            this.cleanupOverlayScheduler = this._register(new async_1.RunOnceScheduler(() => this.dispose(), 300));
            this.create();
        }
        get disposed() {
            return !!this._disposed;
        }
        create() {
            const overlayOffsetHeight = this.getOverlayOffsetHeight();
            // Container
            const container = this.container = document.createElement('div');
            container.id = DropOverlay.OVERLAY_ID;
            container.style.top = `${overlayOffsetHeight}px`;
            // Parent
            this.groupView.element.appendChild(container);
            dom_1.addClass(this.groupView.element, 'dragged-over');
            this._register(lifecycle_1.toDisposable(() => {
                this.groupView.element.removeChild(container);
                dom_1.removeClass(this.groupView.element, 'dragged-over');
            }));
            // Overlay
            this.overlay = document.createElement('div');
            dom_1.addClass(this.overlay, 'editor-group-overlay-indicator');
            container.appendChild(this.overlay);
            // Overlay Event Handling
            this.registerListeners(container);
            // Styles
            this.updateStyles();
        }
        updateStyles() {
            const overlay = types_1.assertIsDefined(this.overlay);
            // Overlay drop background
            overlay.style.backgroundColor = this.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND) || '';
            // Overlay contrast border (if any)
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            overlay.style.outlineColor = activeContrastBorderColor || '';
            overlay.style.outlineOffset = activeContrastBorderColor ? '-2px' : '';
            overlay.style.outlineStyle = activeContrastBorderColor ? 'dashed' : '';
            overlay.style.outlineWidth = activeContrastBorderColor ? '2px' : '';
        }
        registerListeners(container) {
            this._register(new dnd_1.DragAndDropObserver(container, {
                onDragEnter: e => undefined,
                onDragOver: e => {
                    const isDraggingGroup = this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                    const isDraggingEditor = this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype);
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isDraggingEditor && !isDraggingGroup && e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                    // Find out if operation is valid
                    let isCopy = true;
                    if (isDraggingGroup) {
                        isCopy = this.isCopyOperation(e);
                    }
                    else if (isDraggingEditor) {
                        const data = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                        if (Array.isArray(data)) {
                            isCopy = this.isCopyOperation(e, data[0].identifier);
                        }
                    }
                    if (!isCopy) {
                        const sourceGroupView = this.findSourceGroupView();
                        if (sourceGroupView === this.groupView) {
                            if (isDraggingGroup || (isDraggingEditor && sourceGroupView.count < 2)) {
                                this.hideOverlay();
                                return; // do not allow to drop group/editor on itself if this results in an empty group
                            }
                        }
                    }
                    // Position overlay
                    this.positionOverlay(e.offsetX, e.offsetY, isDraggingGroup);
                    // Make sure to stop any running cleanup scheduler to remove the overlay
                    if (this.cleanupOverlayScheduler.isScheduled()) {
                        this.cleanupOverlayScheduler.cancel();
                    }
                },
                onDragLeave: e => this.dispose(),
                onDragEnd: e => this.dispose(),
                onDrop: e => {
                    dom_1.EventHelper.stop(e, true);
                    // Dispose overlay
                    this.dispose();
                    // Handle drop if we have a valid operation
                    if (this.currentDropOperation) {
                        this.handleDrop(e, this.currentDropOperation.splitDirection);
                    }
                }
            }));
            this._register(dom_1.addDisposableListener(container, dom_1.EventType.MOUSE_OVER, () => {
                // Under some circumstances we have seen reports where the drop overlay is not being
                // cleaned up and as such the editor area remains under the overlay so that you cannot
                // type into the editor anymore. This seems related to using VMs and DND via host and
                // guest OS, though some users also saw it without VMs.
                // To protect against this issue we always destroy the overlay as soon as we detect a
                // mouse event over it. The delay is used to guarantee we are not interfering with the
                // actual DROP event that can also trigger a mouse over event.
                if (!this.cleanupOverlayScheduler.isScheduled()) {
                    this.cleanupOverlayScheduler.schedule();
                }
            }));
        }
        findSourceGroupView() {
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.accessor.getGroup(data[0].identifier);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.accessor.getGroup(data[0].identifier.groupId);
                }
            }
            return undefined;
        }
        handleDrop(event, splitDirection) {
            var _a;
            // Determine target group
            const ensureTargetGroup = () => {
                let targetGroup;
                if (typeof splitDirection === 'number') {
                    targetGroup = this.accessor.addGroup(this.groupView, splitDirection);
                }
                else {
                    targetGroup = this.groupView;
                }
                return targetGroup;
            };
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const draggedEditorGroup = data[0].identifier;
                    // Return if the drop is a no-op
                    const sourceGroup = this.accessor.getGroup(draggedEditorGroup);
                    if (sourceGroup) {
                        if (typeof splitDirection !== 'number' && sourceGroup === this.groupView) {
                            return;
                        }
                        // Split to new group
                        let targetGroup;
                        if (typeof splitDirection === 'number') {
                            if (this.isCopyOperation(event)) {
                                targetGroup = this.accessor.copyGroup(sourceGroup, this.groupView, splitDirection);
                            }
                            else {
                                targetGroup = this.accessor.moveGroup(sourceGroup, this.groupView, splitDirection);
                            }
                        }
                        // Merge into existing group
                        else {
                            if (this.isCopyOperation(event)) {
                                targetGroup = this.accessor.mergeGroup(sourceGroup, this.groupView, { mode: 0 /* COPY_EDITORS */ });
                            }
                            else {
                                targetGroup = this.accessor.mergeGroup(sourceGroup, this.groupView);
                            }
                        }
                        if (targetGroup) {
                            this.accessor.activateGroup(targetGroup);
                        }
                    }
                    this.groupTransfer.clearData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    const draggedEditor = data[0].identifier;
                    const targetGroup = ensureTargetGroup();
                    // Return if the drop is a no-op
                    const sourceGroup = this.accessor.getGroup(draggedEditor.groupId);
                    if (sourceGroup) {
                        if (sourceGroup === targetGroup) {
                            return;
                        }
                        // Open in target group
                        const options = editor_1.getActiveTextEditorOptions(sourceGroup, draggedEditor.editor, editor_2.EditorOptions.create({
                            pinned: true,
                            sticky: sourceGroup.isSticky(draggedEditor.editor) // preserve sticky state
                        }));
                        targetGroup.openEditor(draggedEditor.editor, options);
                        // Ensure target has focus
                        targetGroup.focus();
                        // Close in source group unless we copy
                        const copyEditor = this.isCopyOperation(event, draggedEditor);
                        if (!copyEditor) {
                            sourceGroup.closeEditor(draggedEditor.editor);
                        }
                    }
                    this.editorTransfer.clearData(dnd_1.DraggedEditorIdentifier.prototype);
                }
            }
            // Web: check for file transfer
            else if (platform_1.isWeb && dnd_1.containsDragType(event, dnd_2.DataTransfers.FILES)) {
                let targetGroup = undefined;
                const files = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.files;
                if (files) {
                    for (let i = 0; i < files.length; i++) {
                        const file = files.item(i);
                        if (file) {
                            // Skip for very large files because this operation is unbuffered
                            if (file.size > DropOverlay.MAX_FILE_UPLOAD_SIZE) {
                                this.notificationService.warn(nls_1.localize('fileTooLarge', "File is too large to open as untitled editor. Please upload it first into the file explorer and then try again."));
                                continue;
                            }
                            // Read file fully and open as untitled editor
                            const reader = new FileReader();
                            reader.readAsArrayBuffer(file);
                            reader.onload = async (event) => {
                                var _a;
                                const name = file.name;
                                if (typeof name === 'string' && ((_a = event.target) === null || _a === void 0 ? void 0 : _a.result) instanceof ArrayBuffer) {
                                    // Try to come up with a good file path for the untitled
                                    // editor by asking the file dialog service for the default
                                    let proposedFilePath = undefined;
                                    const defaultFilePath = this.fileDialogService.defaultFilePath();
                                    if (defaultFilePath) {
                                        proposedFilePath = resources_1.joinPath(defaultFilePath, name);
                                    }
                                    // Open as untitled file with the provided contents
                                    const untitledEditor = this.editorService.createEditorInput({
                                        resource: proposedFilePath,
                                        forceUntitled: true,
                                        contents: buffer_1.VSBuffer.wrap(new Uint8Array(event.target.result)).toString()
                                    });
                                    if (!targetGroup) {
                                        targetGroup = ensureTargetGroup();
                                    }
                                    await targetGroup.openEditor(untitledEditor);
                                }
                            };
                        }
                    }
                }
            }
            // Check for URI transfer
            else {
                const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: true /* open workspace instead of file if dropped */ });
                dropHandler.handleDrop(event, () => ensureTargetGroup(), targetGroup => {
                    if (targetGroup) {
                        targetGroup.focus();
                    }
                });
            }
        }
        isCopyOperation(e, draggedEditor) {
            if ((draggedEditor === null || draggedEditor === void 0 ? void 0 : draggedEditor.editor) instanceof editor_2.EditorInput && !draggedEditor.editor.supportsSplitEditor()) {
                return false;
            }
            return (e.ctrlKey && !platform_1.isMacintosh) || (e.altKey && platform_1.isMacintosh);
        }
        positionOverlay(mousePosX, mousePosY, isDraggingGroup) {
            const preferSplitVertically = this.accessor.partOptions.openSideBySideDirection === 'right';
            const editorControlWidth = this.groupView.element.clientWidth;
            const editorControlHeight = this.groupView.element.clientHeight - this.getOverlayOffsetHeight();
            let edgeWidthThresholdFactor;
            if (isDraggingGroup) {
                edgeWidthThresholdFactor = preferSplitVertically ? 0.3 : 0.1; // give larger threshold when dragging group depending on preferred split direction
            }
            else {
                edgeWidthThresholdFactor = 0.1; // 10% threshold to split if dragging editors
            }
            let edgeHeightThresholdFactor;
            if (isDraggingGroup) {
                edgeHeightThresholdFactor = preferSplitVertically ? 0.1 : 0.3; // give larger threshold when dragging group depending on preferred split direction
            }
            else {
                edgeHeightThresholdFactor = 0.1; // 10% threshold to split if dragging editors
            }
            const edgeWidthThreshold = editorControlWidth * edgeWidthThresholdFactor;
            const edgeHeightThreshold = editorControlHeight * edgeHeightThresholdFactor;
            const splitWidthThreshold = editorControlWidth / 3; // offer to split left/right at 33%
            const splitHeightThreshold = editorControlHeight / 3; // offer to split up/down at 33%
            // Enable to debug the drop threshold square
            // let child = this.overlay.children.item(0) as HTMLElement || this.overlay.appendChild(document.createElement('div'));
            // child.style.backgroundColor = 'red';
            // child.style.position = 'absolute';
            // child.style.width = (groupViewWidth - (2 * edgeWidthThreshold)) + 'px';
            // child.style.height = (groupViewHeight - (2 * edgeHeightThreshold)) + 'px';
            // child.style.left = edgeWidthThreshold + 'px';
            // child.style.top = edgeHeightThreshold + 'px';
            // No split if mouse is above certain threshold in the center of the view
            let splitDirection;
            if (mousePosX > edgeWidthThreshold && mousePosX < editorControlWidth - edgeWidthThreshold &&
                mousePosY > edgeHeightThreshold && mousePosY < editorControlHeight - edgeHeightThreshold) {
                splitDirection = undefined;
            }
            // Offer to split otherwise
            else {
                // User prefers to split vertically: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |		|		SPLIT UP		|			|
                // | SPLIT 	|-----------------------|	SPLIT	|
                // |		|		  MERGE			|			|
                // | LEFT	|-----------------------|	RIGHT	|
                // |		|		SPLIT DOWN		|			|
                // ----------------------------------------------
                if (preferSplitVertically) {
                    if (mousePosX < splitWidthThreshold) {
                        splitDirection = 2 /* LEFT */;
                    }
                    else if (mousePosX > splitWidthThreshold * 2) {
                        splitDirection = 3 /* RIGHT */;
                    }
                    else if (mousePosY < editorControlHeight / 2) {
                        splitDirection = 0 /* UP */;
                    }
                    else {
                        splitDirection = 1 /* DOWN */;
                    }
                }
                // User prefers to split horizontally: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |				SPLIT UP					|
                // |--------------------------------------------|
                // |  SPLIT LEFT  |	   MERGE	|  SPLIT RIGHT  |
                // |--------------------------------------------|
                // |				SPLIT DOWN					|
                // ----------------------------------------------
                else {
                    if (mousePosY < splitHeightThreshold) {
                        splitDirection = 0 /* UP */;
                    }
                    else if (mousePosY > splitHeightThreshold * 2) {
                        splitDirection = 1 /* DOWN */;
                    }
                    else if (mousePosX < editorControlWidth / 2) {
                        splitDirection = 2 /* LEFT */;
                    }
                    else {
                        splitDirection = 3 /* RIGHT */;
                    }
                }
            }
            // Draw overlay based on split direction
            switch (splitDirection) {
                case 0 /* UP */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '50%' });
                    break;
                case 1 /* DOWN */:
                    this.doPositionOverlay({ top: '50%', left: '0', width: '100%', height: '50%' });
                    break;
                case 2 /* LEFT */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '50%', height: '100%' });
                    break;
                case 3 /* RIGHT */:
                    this.doPositionOverlay({ top: '0', left: '50%', width: '50%', height: '100%' });
                    break;
                default:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
            }
            // Make sure the overlay is visible now
            const overlay = types_1.assertIsDefined(this.overlay);
            overlay.style.opacity = '1';
            // Enable transition after a timeout to prevent initial animation
            setTimeout(() => dom_1.addClass(overlay, 'overlay-move-transition'), 0);
            // Remember as current split direction
            this.currentDropOperation = { splitDirection };
        }
        doPositionOverlay(options) {
            const [container, overlay] = types_1.assertAllDefined(this.container, this.overlay);
            // Container
            const offsetHeight = this.getOverlayOffsetHeight();
            if (offsetHeight) {
                container.style.height = `calc(100% - ${offsetHeight}px)`;
            }
            else {
                container.style.height = '100%';
            }
            // Overlay
            overlay.style.top = options.top;
            overlay.style.left = options.left;
            overlay.style.width = options.width;
            overlay.style.height = options.height;
        }
        getOverlayOffsetHeight() {
            if (!this.groupView.isEmpty && this.accessor.partOptions.showTabs) {
                return editor_1.EDITOR_TITLE_HEIGHT; // show overlay below title if group shows tabs
            }
            return 0;
        }
        hideOverlay() {
            const overlay = types_1.assertIsDefined(this.overlay);
            // Reset overlay
            this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
            overlay.style.opacity = '0';
            dom_1.removeClass(overlay, 'overlay-move-transition');
            // Reset current operation
            this.currentDropOperation = undefined;
        }
        contains(element) {
            return element === this.container || element === this.overlay;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    };
    DropOverlay.OVERLAY_ID = 'monaco-workbench-editor-drop-overlay';
    DropOverlay.MAX_FILE_UPLOAD_SIZE = 100 * 1024 * 1024; // 100mb
    DropOverlay = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, editorService_1.IEditorService),
        __param(6, notification_1.INotificationService)
    ], DropOverlay);
    let EditorDropTarget = class EditorDropTarget extends themeService_1.Themable {
        constructor(accessor, container, delegate, themeService, instantiationService) {
            super(themeService);
            this.accessor = accessor;
            this.container = container;
            this.delegate = delegate;
            this.instantiationService = instantiationService;
            this.counter = 0;
            this.editorTransfer = dnd_1.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_1.LocalSelectionTransfer.getInstance();
            this.registerListeners();
        }
        get overlay() {
            if (this._overlay && !this._overlay.disposed) {
                return this._overlay;
            }
            return undefined;
        }
        registerListeners() {
            this._register(dom_1.addDisposableListener(this.container, dom_1.EventType.DRAG_ENTER, e => this.onDragEnter(e)));
            this._register(dom_1.addDisposableListener(this.container, dom_1.EventType.DRAG_LEAVE, () => this.onDragLeave()));
            [this.container, window].forEach(node => this._register(dom_1.addDisposableListener(node, dom_1.EventType.DRAG_END, () => this.onDragEnd())));
        }
        onDragEnter(event) {
            this.counter++;
            // Validate transfer
            if (!this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype) &&
                !this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype) &&
                event.dataTransfer && !event.dataTransfer.types.length // see https://github.com/Microsoft/vscode/issues/25789
            ) {
                event.dataTransfer.dropEffect = 'none';
                return; // unsupported transfer
            }
            // Signal DND start
            this.updateContainer(true);
            const target = event.target;
            if (target) {
                // Somehow we managed to move the mouse quickly out of the current overlay, so destroy it
                if (this.overlay && !this.overlay.contains(target)) {
                    this.disposeOverlay();
                }
                // Create overlay over target
                if (!this.overlay) {
                    const targetGroupView = this.findTargetGroupView(target);
                    if (targetGroupView) {
                        this._overlay = this.instantiationService.createInstance(DropOverlay, this.accessor, targetGroupView);
                    }
                }
            }
        }
        onDragLeave() {
            this.counter--;
            if (this.counter === 0) {
                this.updateContainer(false);
            }
        }
        onDragEnd() {
            this.counter = 0;
            this.updateContainer(false);
            this.disposeOverlay();
        }
        findTargetGroupView(child) {
            const groups = this.accessor.groups;
            return groups.find(groupView => { var _a, _b; return dom_1.isAncestor(child, groupView.element) || ((_b = (_a = this.delegate).containsGroup) === null || _b === void 0 ? void 0 : _b.call(_a, groupView)); });
        }
        updateContainer(isDraggedOver) {
            dom_1.toggleClass(this.container, 'dragged-over', isDraggedOver);
        }
        dispose() {
            super.dispose();
            this.disposeOverlay();
        }
        disposeOverlay() {
            if (this.overlay) {
                this.overlay.dispose();
                this._overlay = undefined;
            }
        }
    };
    EditorDropTarget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, instantiation_1.IInstantiationService)
    ], EditorDropTarget);
    exports.EditorDropTarget = EditorDropTarget;
});
//# __sourceMappingURL=editorDropTarget.js.map