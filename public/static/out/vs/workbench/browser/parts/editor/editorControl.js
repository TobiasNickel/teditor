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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/browser/parts/editor/editor", "vs/base/common/event", "vs/base/common/types"], function (require, exports, lifecycle_1, dom_1, platform_1, editor_1, layoutService_1, instantiation_1, progress_1, editor_2, event_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorControl = void 0;
    let EditorControl = class EditorControl extends lifecycle_1.Disposable {
        constructor(parent, groupView, layoutService, instantiationService, editorProgressService) {
            super();
            this.parent = parent;
            this.groupView = groupView;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this.editorProgressService = editorProgressService;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidSizeConstraintsChange = this._register(new event_1.Emitter());
            this.onDidSizeConstraintsChange = this._onDidSizeConstraintsChange.event;
            this._activeEditorPane = null;
            this.editorPanes = [];
            this.activeEditorPaneDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorOperation = this._register(new progress_1.LongRunningOperation(this.editorProgressService));
        }
        get minimumWidth() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.minimumWidth) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get minimumHeight() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.minimumHeight) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumWidth() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.maximumWidth) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get maximumHeight() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.maximumHeight) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get activeEditorPane() { return this._activeEditorPane; }
        async openEditor(editor, options) {
            // Editor pane
            const descriptor = platform_1.Registry.as(editor_1.Extensions.Editors).getEditor(editor);
            if (!descriptor) {
                throw new Error(`No editor descriptor found for input id ${editor.getTypeId()}`);
            }
            const editorPane = this.doShowEditorPane(descriptor);
            // Set input
            const editorChanged = await this.doSetInput(editorPane, editor, options);
            return { editorPane, editorChanged };
        }
        doShowEditorPane(descriptor) {
            // Return early if the currently active editor pane can handle the input
            if (this._activeEditorPane && descriptor.describes(this._activeEditorPane)) {
                return this._activeEditorPane;
            }
            // Hide active one first
            this.doHideActiveEditorPane();
            // Create editor pane
            const editorPane = this.doCreateEditorPane(descriptor);
            // Set editor as active
            this.doSetActiveEditorPane(editorPane);
            // Show editor
            const container = types_1.assertIsDefined(editorPane.getContainer());
            this.parent.appendChild(container);
            dom_1.show(container);
            // Indicate to editor that it is now visible
            editorPane.setVisible(true, this.groupView);
            // Layout
            if (this.dimension) {
                editorPane.layout(this.dimension);
            }
            return editorPane;
        }
        doCreateEditorPane(descriptor) {
            // Instantiate editor
            const editorPane = this.doInstantiateEditorPane(descriptor);
            // Create editor container as needed
            if (!editorPane.getContainer()) {
                const editorPaneContainer = document.createElement('div');
                dom_1.addClass(editorPaneContainer, 'editor-instance');
                editorPaneContainer.setAttribute('data-editor-id', descriptor.getId());
                editorPane.create(editorPaneContainer);
            }
            return editorPane;
        }
        doInstantiateEditorPane(descriptor) {
            // Return early if already instantiated
            const existingEditorPane = this.editorPanes.find(editorPane => descriptor.describes(editorPane));
            if (existingEditorPane) {
                return existingEditorPane;
            }
            // Otherwise instantiate new
            const editorPane = this._register(descriptor.instantiate(this.instantiationService));
            this.editorPanes.push(editorPane);
            return editorPane;
        }
        doSetActiveEditorPane(editorPane) {
            this._activeEditorPane = editorPane;
            // Clear out previous active editor pane listeners
            this.activeEditorPaneDisposables.clear();
            // Listen to editor pane changes
            if (editorPane) {
                this.activeEditorPaneDisposables.add(editorPane.onDidSizeConstraintsChange(e => this._onDidSizeConstraintsChange.fire(e)));
                this.activeEditorPaneDisposables.add(editorPane.onDidFocus(() => this._onDidFocus.fire()));
            }
            // Indicate that size constraints could have changed due to new editor
            this._onDidSizeConstraintsChange.fire(undefined);
        }
        async doSetInput(editorPane, editor, options) {
            // If the input did not change, return early and only apply the options
            // unless the options instruct us to force open it even if it is the same
            const forceReload = options === null || options === void 0 ? void 0 : options.forceReload;
            const inputMatches = editorPane.input && editorPane.input.matches(editor);
            if (inputMatches && !forceReload) {
                // Forward options
                editorPane.setOptions(options);
                // Still focus as needed
                const focus = !options || !options.preserveFocus;
                if (focus) {
                    editorPane.focus();
                }
                return false;
            }
            // Show progress while setting input after a certain timeout. If the workbench is opening
            // be more relaxed about progress showing by increasing the delay a little bit to reduce flicker.
            const operation = this.editorOperation.start(this.layoutService.isRestored() ? 800 : 3200);
            // Call into editor pane
            const editorWillChange = !inputMatches;
            try {
                await editorPane.setInput(editor, options, operation.token);
                // Focus (unless prevented or another operation is running)
                if (operation.isCurrent()) {
                    const focus = !options || !options.preserveFocus;
                    if (focus) {
                        editorPane.focus();
                    }
                }
                return editorWillChange;
            }
            finally {
                operation.stop();
            }
        }
        doHideActiveEditorPane() {
            if (!this._activeEditorPane) {
                return;
            }
            // Stop any running operation
            this.editorOperation.stop();
            // Indicate to editor pane before removing the editor from
            // the DOM to give a chance to persist certain state that
            // might depend on still being the active DOM element.
            this._activeEditorPane.clearInput();
            this._activeEditorPane.setVisible(false, this.groupView);
            // Remove editor pane from parent
            const editorPaneContainer = this._activeEditorPane.getContainer();
            if (editorPaneContainer) {
                this.parent.removeChild(editorPaneContainer);
                dom_1.hide(editorPaneContainer);
            }
            // Clear active editor pane
            this.doSetActiveEditorPane(null);
        }
        closeEditor(editor) {
            if (this._activeEditorPane && editor.matches(this._activeEditorPane.input)) {
                this.doHideActiveEditorPane();
            }
        }
        setVisible(visible) {
            var _a;
            (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.setVisible(visible, this.groupView);
        }
        layout(dimension) {
            var _a;
            this.dimension = dimension;
            (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.layout(dimension);
        }
    };
    EditorControl = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, progress_1.IEditorProgressService)
    ], EditorControl);
    exports.EditorControl = EditorControl;
});
//# __sourceMappingURL=editorControl.js.map