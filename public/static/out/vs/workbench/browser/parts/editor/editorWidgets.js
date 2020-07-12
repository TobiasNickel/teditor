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
define(["require", "exports", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/base/browser/dom", "vs/platform/theme/common/styler", "vs/platform/theme/common/colorRegistry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/host/browser/host", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/base/common/lifecycle", "vs/nls", "vs/base/common/resources", "vs/platform/files/common/files"], function (require, exports, widget_1, event_1, keybinding_1, themeService_1, dom_1, styler_1, colorRegistry_1, instantiation_1, host_1, workspace_1, workspaces_1, lifecycle_1, nls_1, resources_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenWorkspaceButtonContribution = exports.FloatingClickWidget = void 0;
    let FloatingClickWidget = class FloatingClickWidget extends widget_1.Widget {
        constructor(editor, label, keyBindingAction, keybindingService, themeService) {
            super();
            this.editor = editor;
            this.label = label;
            this.themeService = themeService;
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._domNode = dom_1.$('.floating-click-widget');
            if (keyBindingAction) {
                const keybinding = keybindingService.lookupKeybinding(keyBindingAction);
                if (keybinding) {
                    this.label += ` (${keybinding.getLabel()})`;
                }
            }
        }
        getId() {
            return 'editor.overlayWidget.floatingClickWidget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                preference: 1 /* BOTTOM_RIGHT_CORNER */
            };
        }
        render() {
            dom_1.clearNode(this._domNode);
            this._register(styler_1.attachStylerCallback(this.themeService, { buttonBackground: colorRegistry_1.buttonBackground, buttonForeground: colorRegistry_1.buttonForeground, editorBackground: colorRegistry_1.editorBackground, editorForeground: colorRegistry_1.editorForeground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                const backgroundColor = colors.buttonBackground ? colors.buttonBackground : colors.editorBackground;
                if (backgroundColor) {
                    this._domNode.style.backgroundColor = backgroundColor.toString();
                }
                const foregroundColor = colors.buttonForeground ? colors.buttonForeground : colors.editorForeground;
                if (foregroundColor) {
                    this._domNode.style.color = foregroundColor.toString();
                }
                const borderColor = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                this._domNode.style.borderWidth = borderColor ? '1px' : '';
                this._domNode.style.borderStyle = borderColor ? 'solid' : '';
                this._domNode.style.borderColor = borderColor;
            }));
            dom_1.append(this._domNode, dom_1.$('')).textContent = this.label;
            this.onclick(this._domNode, e => this._onClick.fire());
            this.editor.addOverlayWidget(this);
        }
        dispose() {
            this.editor.removeOverlayWidget(this);
            super.dispose();
        }
    };
    FloatingClickWidget = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, themeService_1.IThemeService)
    ], FloatingClickWidget);
    exports.FloatingClickWidget = FloatingClickWidget;
    let OpenWorkspaceButtonContribution = class OpenWorkspaceButtonContribution extends lifecycle_1.Disposable {
        constructor(editor, instantiationService, hostService, contextService, fileService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.hostService = hostService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.update();
            this.registerListeners();
        }
        static get(editor) {
            return editor.getContribution(OpenWorkspaceButtonContribution.ID);
        }
        registerListeners() {
            this._register(this.editor.onDidChangeModel(e => this.update()));
        }
        update() {
            if (!this.shouldShowButton(this.editor)) {
                this.disposeOpenWorkspaceWidgetRenderer();
                return;
            }
            this.createOpenWorkspaceWidgetRenderer();
        }
        shouldShowButton(editor) {
            const model = editor.getModel();
            if (!model) {
                return false; // we need a model
            }
            if (!workspaces_1.hasWorkspaceFileExtension(model.uri)) {
                return false; // we need a workspace file
            }
            if (!this.fileService.canHandleResource(model.uri)) {
                return false; // needs to be backed by a file service
            }
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const workspaceConfiguration = this.contextService.getWorkspace().configuration;
                if (workspaceConfiguration && resources_1.isEqual(workspaceConfiguration, model.uri)) {
                    return false; // already inside workspace
                }
            }
            return true;
        }
        createOpenWorkspaceWidgetRenderer() {
            if (!this.openWorkspaceButton) {
                this.openWorkspaceButton = this.instantiationService.createInstance(FloatingClickWidget, this.editor, nls_1.localize('openWorkspace', "Open Workspace"), null);
                this._register(this.openWorkspaceButton.onClick(() => {
                    const model = this.editor.getModel();
                    if (model) {
                        this.hostService.openWindow([{ workspaceUri: model.uri }]);
                    }
                }));
                this.openWorkspaceButton.render();
            }
        }
        disposeOpenWorkspaceWidgetRenderer() {
            lifecycle_1.dispose(this.openWorkspaceButton);
            this.openWorkspaceButton = undefined;
        }
        dispose() {
            this.disposeOpenWorkspaceWidgetRenderer();
            super.dispose();
        }
    };
    OpenWorkspaceButtonContribution.ID = 'editor.contrib.openWorkspaceButton';
    OpenWorkspaceButtonContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, host_1.IHostService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, files_1.IFileService)
    ], OpenWorkspaceButtonContribution);
    exports.OpenWorkspaceButtonContribution = OpenWorkspaceButtonContribution;
});
//# __sourceMappingURL=editorWidgets.js.map