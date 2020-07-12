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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/browser/ui/tree/treeDefaults", "vs/editor/browser/editorBrowser", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/common/commentModel", "vs/workbench/contrib/comments/browser/commentsEditorContribution", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/labels", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/css!./media/panel"], function (require, exports, nls, dom, actions_1, treeDefaults_1, editorBrowser_1, instantiation_1, themeService_1, commentModel_1, commentsEditorContribution_1, commentService_1, editorService_1, commands_1, colorRegistry_1, labels_1, commentsTreeViewer_1, viewPaneContainer_1, views_1, configuration_1, contextkey_1, contextView_1, keybinding_1, opener_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsPanel = void 0;
    let CommentsPanel = class CommentsPanel extends viewPaneContainer_1.ViewPane {
        constructor(options, instantiationService, viewDescriptorService, editorService, configurationService, contextKeyService, contextMenuService, keybindingService, openerService, themeService, commentService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.commentService = commentService;
            this.onDidChangeVisibility = this.onDidChangeBodyVisibility;
        }
        renderBody(container) {
            super.renderBody(container);
            dom.addClass(container, 'comments-panel');
            let domContainer = dom.append(container, dom.$('.comments-panel-container'));
            this.treeContainer = dom.append(domContainer, dom.$('.tree-container'));
            this.commentsModel = new commentModel_1.CommentsModel();
            this.createTree();
            this.createMessageBox(domContainer);
            this._register(this.commentService.onDidSetAllCommentThreads(this.onAllCommentsChanged, this));
            this._register(this.commentService.onDidUpdateCommentThreads(this.onCommentsUpdated, this));
            const styleElement = dom.createStyleSheet(container);
            this.applyStyles(styleElement);
            this._register(this.themeService.onDidColorThemeChange(_ => this.applyStyles(styleElement)));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    this.refresh();
                }
            }));
            this.renderComments();
        }
        applyStyles(styleElement) {
            const content = [];
            const theme = this.themeService.getColorTheme();
            const linkColor = theme.getColor(colorRegistry_1.textLinkForeground);
            if (linkColor) {
                content.push(`.comments-panel .comments-panel-container a { color: ${linkColor}; }`);
            }
            const linkActiveColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
            if (linkActiveColor) {
                content.push(`.comments-panel .comments-panel-container a:hover, a:active { color: ${linkActiveColor}; }`);
            }
            const focusColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusColor) {
                content.push(`.comments-panel .commenst-panel-container a:focus { outline-color: ${focusColor}; }`);
            }
            const codeTextForegroundColor = theme.getColor(colorRegistry_1.textPreformatForeground);
            if (codeTextForegroundColor) {
                content.push(`.comments-panel .comments-panel-container .text code { color: ${codeTextForegroundColor}; }`);
            }
            styleElement.innerHTML = content.join('\n');
        }
        async renderComments() {
            dom.toggleClass(this.treeContainer, 'hidden', !this.commentsModel.hasCommentThreads());
            await this.tree.setInput(this.commentsModel);
            this.renderMessage();
        }
        getActions() {
            if (!this.collapseAllAction) {
                this.collapseAllAction = new actions_1.Action('vs.tree.collapse', nls.localize('collapseAll', "Collapse All"), 'collapse-all', true, () => this.tree ? new treeDefaults_1.CollapseAllAction(this.tree, true).run() : Promise.resolve());
                this._register(this.collapseAllAction);
            }
            return [this.collapseAllAction];
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        getTitle() {
            return commentsTreeViewer_1.COMMENTS_VIEW_TITLE;
        }
        createMessageBox(parent) {
            this.messageBoxContainer = dom.append(parent, dom.$('.message-box-container'));
            this.messageBox = dom.append(this.messageBoxContainer, dom.$('span'));
            this.messageBox.setAttribute('tabindex', '0');
        }
        renderMessage() {
            this.messageBox.textContent = this.commentsModel.getMessage();
            dom.toggleClass(this.messageBoxContainer, 'hidden', this.commentsModel.hasCommentThreads());
        }
        createTree() {
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            this.tree = this._register(this.instantiationService.createInstance(commentsTreeViewer_1.CommentsList, this.treeLabels, this.treeContainer, {
                overrideStyles: { listBackground: this.getBackgroundColor() },
                openOnFocus: true,
                accessibilityProvider: {
                    getAriaLabel(element) { return null; },
                    getWidgetAriaLabel() { return 'Comments'; }
                }
            }));
            this._register(this.tree.onDidOpen(e => {
                this.openFile(e.element, e.editorOptions.pinned, e.editorOptions.preserveFocus, e.sideBySide);
            }));
        }
        openFile(element, pinned, preserveFocus, sideBySide) {
            if (!element) {
                return false;
            }
            if (!(element instanceof commentModel_1.ResourceWithCommentThreads || element instanceof commentModel_1.CommentNode)) {
                return false;
            }
            const range = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].range : element.range;
            const activeEditor = this.editorService.activeEditor;
            let currentActiveResource = activeEditor ? activeEditor.resource : undefined;
            if (currentActiveResource && currentActiveResource.toString() === element.resource.toString()) {
                const threadToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].threadId : element.threadId;
                const commentToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].comment.uniqueIdInThread : element.comment.uniqueIdInThread;
                const control = this.editorService.activeTextEditorControl;
                if (threadToReveal && editorBrowser_1.isCodeEditor(control)) {
                    const controller = commentsEditorContribution_1.CommentController.get(control);
                    controller.revealCommentThread(threadToReveal, commentToReveal, false);
                }
                return true;
            }
            const threadToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].threadId : element.threadId;
            const commentToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].comment : element.comment;
            this.editorService.openEditor({
                resource: element.resource,
                options: {
                    pinned: pinned,
                    preserveFocus: preserveFocus,
                    selection: range
                }
            }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
                if (editor) {
                    const control = editor.getControl();
                    if (threadToReveal && editorBrowser_1.isCodeEditor(control)) {
                        const controller = commentsEditorContribution_1.CommentController.get(control);
                        controller.revealCommentThread(threadToReveal, commentToReveal.uniqueIdInThread, true);
                    }
                }
            });
            return true;
        }
        refresh() {
            if (this.isVisible()) {
                if (this.collapseAllAction) {
                    this.collapseAllAction.enabled = this.commentsModel.hasCommentThreads();
                }
                dom.toggleClass(this.treeContainer, 'hidden', !this.commentsModel.hasCommentThreads());
                this.tree.updateChildren().then(() => {
                    this.renderMessage();
                }, (e) => {
                    console.log(e);
                });
            }
        }
        onAllCommentsChanged(e) {
            this.commentsModel.setCommentThreads(e.ownerId, e.commentThreads);
            this.refresh();
        }
        onCommentsUpdated(e) {
            const didUpdate = this.commentsModel.updateCommentThreads(e);
            if (didUpdate) {
                this.refresh();
            }
        }
    };
    CommentsPanel = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, commentService_1.ICommentService),
        __param(11, telemetry_1.ITelemetryService)
    ], CommentsPanel);
    exports.CommentsPanel = CommentsPanel;
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.focusCommentsPanel',
        handler: async (accessor) => {
            const viewsService = accessor.get(views_1.IViewsService);
            viewsService.openView(commentsTreeViewer_1.COMMENTS_VIEW_ID, true);
        }
    });
});
//# __sourceMappingURL=commentsView.js.map