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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/editor/common/modes", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/editor/common/core/selection", "vs/base/common/event", "vs/platform/notification/common/notification", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/dropdown/dropdown", "./reactionsAction", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/comments/browser/commentFormActions", "vs/base/browser/ui/mouseCursor/mouseCursor"], function (require, exports, nls, dom, modes, actionbar_1, actions_1, lifecycle_1, uri_1, modelService_1, modeService_1, instantiation_1, themeService_1, commentService_1, simpleCommentEditor_1, selection_1, event_1, notification_1, toolbar_1, contextView_1, dropdown_1, reactionsAction_1, actions_2, menuEntryActionViewItem_1, keybinding_1, contextkey_1, commentFormActions_1, mouseCursor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentNode = void 0;
    let CommentNode = class CommentNode extends lifecycle_1.Disposable {
        constructor(commentThread, comment, owner, resource, parentEditor, parentThread, markdownRenderer, themeService, instantiationService, commentService, modelService, modeService, keybindingService, notificationService, contextMenuService, contextKeyService) {
            super();
            this.commentThread = commentThread;
            this.comment = comment;
            this.owner = owner;
            this.resource = resource;
            this.parentEditor = parentEditor;
            this.parentThread = parentThread;
            this.markdownRenderer = markdownRenderer;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.commentService = commentService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
            this._editAction = null;
            this._commentEditContainer = null;
            this._commentEditor = null;
            this._commentEditorDisposables = [];
            this._commentEditorModel = null;
            this._commentFormActions = null;
            this._onDidClick = new event_1.Emitter();
            this.isEditing = false;
            this._domNode = dom.$('div.review-comment');
            this._contextKeyService = contextKeyService.createScoped(this._domNode);
            this._commentContextValue = this._contextKeyService.createKey('comment', comment.contextValue);
            this._domNode.tabIndex = -1;
            const avatar = dom.append(this._domNode, dom.$('div.avatar-container'));
            if (comment.userIconPath) {
                const img = dom.append(avatar, dom.$('img.avatar'));
                img.src = comment.userIconPath.toString();
                img.onerror = _ => img.remove();
            }
            this._commentDetailsContainer = dom.append(this._domNode, dom.$('.review-comment-contents'));
            this.createHeader(this._commentDetailsContainer);
            this._body = dom.append(this._commentDetailsContainer, dom.$(`div.comment-body.${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`));
            this._md = this.markdownRenderer.render(comment.body).element;
            this._body.appendChild(this._md);
            if (this.comment.commentReactions && this.comment.commentReactions.length && this.comment.commentReactions.filter(reaction => !!reaction.count).length) {
                this.createReactionsContainer(this._commentDetailsContainer);
            }
            this._domNode.setAttribute('aria-label', `${comment.userName}, ${comment.body.value}`);
            this._domNode.setAttribute('role', 'treeitem');
            this._clearTimeout = null;
            this._register(dom.addDisposableListener(this._domNode, dom.EventType.CLICK, () => this.isEditing || this._onDidClick.fire(this)));
        }
        get domNode() {
            return this._domNode;
        }
        get onDidClick() {
            return this._onDidClick.event;
        }
        createHeader(commentDetailsContainer) {
            const header = dom.append(commentDetailsContainer, dom.$(`div.comment-title.${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`));
            const author = dom.append(header, dom.$('strong.author'));
            author.innerText = this.comment.userName;
            this._isPendingLabel = dom.append(header, dom.$('span.isPending'));
            if (this.comment.label) {
                this._isPendingLabel.innerText = this.comment.label;
            }
            else {
                this._isPendingLabel.innerText = '';
            }
            this._actionsToolbarContainer = dom.append(header, dom.$('.comment-actions.hidden'));
            this.createActionsToolbar();
        }
        getToolbarActions(menu) {
            const contributedActions = menu.getActions({ shouldForwardArgs: true });
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            fillInActions(contributedActions, result, false, g => /^inline/.test(g));
            return result;
        }
        createToolbar() {
            this.toolbar = new toolbar_1.ToolBar(this._actionsToolbarContainer, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                        return new dropdown_1.DropdownMenuActionViewItem(action, action.menuActions, this.contextMenuService, action => {
                            return this.actionViewItemProvider(action);
                        }, this.actionRunner, undefined, 'toolbar-toggle-pickReactions codicon codicon-reactions', () => { return 1 /* RIGHT */; });
                    }
                    return this.actionViewItemProvider(action);
                },
                orientation: 0 /* HORIZONTAL */
            });
            this.toolbar.context = {
                thread: this.commentThread,
                commentUniqueId: this.comment.uniqueIdInThread,
                $mid: 9
            };
            this.registerActionBarListeners(this._actionsToolbarContainer);
            this._register(this.toolbar);
        }
        createActionsToolbar() {
            const actions = [];
            let hasReactionHandler = this.commentService.hasReactionHandler(this.owner);
            if (hasReactionHandler) {
                let toggleReactionAction = this.createReactionPicker(this.comment.commentReactions || []);
                actions.push(toggleReactionAction);
            }
            let commentMenus = this.commentService.getCommentMenus(this.owner);
            const menu = commentMenus.getCommentTitleActions(this.comment, this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(e => {
                const { primary, secondary } = this.getToolbarActions(menu);
                if (!this.toolbar && (primary.length || secondary.length)) {
                    this.createToolbar();
                }
                this.toolbar.setActions(primary, secondary)();
            }));
            const { primary, secondary } = this.getToolbarActions(menu);
            actions.push(...primary);
            if (actions.length || secondary.length) {
                this.createToolbar();
                this.toolbar.setActions(actions, secondary)();
            }
        }
        actionViewItemProvider(action) {
            let options = {};
            if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                options = { label: false, icon: true };
            }
            else {
                options = { label: false, icon: true };
            }
            if (action.id === reactionsAction_1.ReactionAction.ID) {
                let item = new reactionsAction_1.ReactionActionViewItem(action);
                return item;
            }
            else if (action instanceof actions_2.MenuItemAction) {
                let item = new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
                return item;
            }
            else {
                let item = new actionbar_1.ActionViewItem({}, action, options);
                return item;
            }
        }
        createReactionPicker(reactionGroup) {
            let toggleReactionActionViewItem;
            let toggleReactionAction = this._register(new reactionsAction_1.ToggleReactionsAction(() => {
                if (toggleReactionActionViewItem) {
                    toggleReactionActionViewItem.show();
                }
            }, nls.localize('commentToggleReaction', "Toggle Reaction")));
            let reactionMenuActions = [];
            if (reactionGroup && reactionGroup.length) {
                reactionMenuActions = reactionGroup.map((reaction) => {
                    return new actions_1.Action(`reaction.command.${reaction.label}`, `${reaction.label}`, '', true, async () => {
                        try {
                            await this.commentService.toggleReaction(this.owner, this.resource, this.commentThread, this.comment, reaction);
                        }
                        catch (e) {
                            const error = e.message
                                ? nls.localize('commentToggleReactionError', "Toggling the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentToggleReactionDefaultError', "Toggling the comment reaction failed");
                            this.notificationService.error(error);
                        }
                    });
                });
            }
            toggleReactionAction.menuActions = reactionMenuActions;
            toggleReactionActionViewItem = new dropdown_1.DropdownMenuActionViewItem(toggleReactionAction, toggleReactionAction.menuActions, this.contextMenuService, action => {
                if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                    return toggleReactionActionViewItem;
                }
                return this.actionViewItemProvider(action);
            }, this.actionRunner, undefined, 'toolbar-toggle-pickReactions', () => { return 1 /* RIGHT */; });
            return toggleReactionAction;
        }
        createReactionsContainer(commentDetailsContainer) {
            this._reactionActionsContainer = dom.append(commentDetailsContainer, dom.$('div.comment-reactions'));
            this._reactionsActionBar = new actionbar_1.ActionBar(this._reactionActionsContainer, {
                actionViewItemProvider: action => {
                    if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                        return new dropdown_1.DropdownMenuActionViewItem(action, action.menuActions, this.contextMenuService, action => {
                            return this.actionViewItemProvider(action);
                        }, this.actionRunner, undefined, 'toolbar-toggle-pickReactions', () => { return 1 /* RIGHT */; });
                    }
                    return this.actionViewItemProvider(action);
                }
            });
            this._register(this._reactionsActionBar);
            let hasReactionHandler = this.commentService.hasReactionHandler(this.owner);
            this.comment.commentReactions.filter(reaction => !!reaction.count).map(reaction => {
                let action = new reactionsAction_1.ReactionAction(`reaction.${reaction.label}`, `${reaction.label}`, reaction.hasReacted && (reaction.canEdit || hasReactionHandler) ? 'active' : '', (reaction.canEdit || hasReactionHandler), async () => {
                    try {
                        await this.commentService.toggleReaction(this.owner, this.resource, this.commentThread, this.comment, reaction);
                    }
                    catch (e) {
                        let error;
                        if (reaction.hasReacted) {
                            error = e.message
                                ? nls.localize('commentDeleteReactionError', "Deleting the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentDeleteReactionDefaultError', "Deleting the comment reaction failed");
                        }
                        else {
                            error = e.message
                                ? nls.localize('commentAddReactionError', "Deleting the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentAddReactionDefaultError', "Deleting the comment reaction failed");
                        }
                        this.notificationService.error(error);
                    }
                }, reaction.iconPath, reaction.count);
                if (this._reactionsActionBar) {
                    this._reactionsActionBar.push(action, { label: true, icon: true });
                }
            });
            if (hasReactionHandler) {
                let toggleReactionAction = this.createReactionPicker(this.comment.commentReactions || []);
                this._reactionsActionBar.push(toggleReactionAction, { label: false, icon: true });
            }
        }
        createCommentEditor(editContainer) {
            const container = dom.append(editContainer, dom.$('.edit-textarea'));
            this._commentEditor = this.instantiationService.createInstance(simpleCommentEditor_1.SimpleCommentEditor, container, simpleCommentEditor_1.SimpleCommentEditor.getEditorOptions(), this.parentEditor, this.parentThread);
            const resource = uri_1.URI.parse(`comment:commentinput-${this.comment.uniqueIdInThread}-${Date.now()}.md`);
            this._commentEditorModel = this.modelService.createModel('', this.modeService.createByFilepathOrFirstLine(resource), resource, false);
            this._commentEditor.setModel(this._commentEditorModel);
            this._commentEditor.setValue(this.comment.body.value);
            this._commentEditor.layout({ width: container.clientWidth - 14, height: 90 });
            this._commentEditor.focus();
            dom.scheduleAtNextAnimationFrame(() => {
                this._commentEditor.layout({ width: container.clientWidth - 14, height: 90 });
                this._commentEditor.focus();
            });
            const lastLine = this._commentEditorModel.getLineCount();
            const lastColumn = this._commentEditorModel.getLineContent(lastLine).length + 1;
            this._commentEditor.setSelection(new selection_1.Selection(lastLine, lastColumn, lastLine, lastColumn));
            let commentThread = this.commentThread;
            commentThread.input = {
                uri: this._commentEditor.getModel().uri,
                value: this.comment.body.value
            };
            this.commentService.setActiveCommentThread(commentThread);
            this._commentEditorDisposables.push(this._commentEditor.onDidFocusEditorWidget(() => {
                commentThread.input = {
                    uri: this._commentEditor.getModel().uri,
                    value: this.comment.body.value
                };
                this.commentService.setActiveCommentThread(commentThread);
            }));
            this._commentEditorDisposables.push(this._commentEditor.onDidChangeModelContent(e => {
                if (commentThread.input && this._commentEditor && this._commentEditor.getModel().uri === commentThread.input.uri) {
                    let newVal = this._commentEditor.getValue();
                    if (newVal !== commentThread.input.value) {
                        let input = commentThread.input;
                        input.value = newVal;
                        commentThread.input = input;
                        this.commentService.setActiveCommentThread(commentThread);
                    }
                }
            }));
            this._register(this._commentEditor);
            this._register(this._commentEditorModel);
        }
        removeCommentEditor() {
            this.isEditing = false;
            if (this._editAction) {
                this._editAction.enabled = true;
            }
            this._body.classList.remove('hidden');
            if (this._commentEditorModel) {
                this._commentEditorModel.dispose();
            }
            this._commentEditorDisposables.forEach(dispose => dispose.dispose());
            this._commentEditorDisposables = [];
            if (this._commentEditor) {
                this._commentEditor.dispose();
                this._commentEditor = null;
            }
            this._commentEditContainer.remove();
        }
        switchToEditMode() {
            if (this.isEditing) {
                return;
            }
            this.isEditing = true;
            this._body.classList.add('hidden');
            this._commentEditContainer = dom.append(this._commentDetailsContainer, dom.$('.edit-container'));
            this.createCommentEditor(this._commentEditContainer);
            const formActions = dom.append(this._commentEditContainer, dom.$('.form-actions'));
            const menus = this.commentService.getCommentMenus(this.owner);
            const menu = menus.getCommentActions(this.comment, this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(() => {
                if (this._commentFormActions) {
                    this._commentFormActions.setActions(menu);
                }
            }));
            this._commentFormActions = new commentFormActions_1.CommentFormActions(formActions, (action) => {
                let text = this._commentEditor.getValue();
                action.run({
                    thread: this.commentThread,
                    commentUniqueId: this.comment.uniqueIdInThread,
                    text: text,
                    $mid: 10
                });
                this.removeCommentEditor();
            }, this.themeService);
            this._commentFormActions.setActions(menu);
        }
        setFocus(focused, visible = false) {
            var _a;
            if (focused) {
                this._domNode.focus();
                this._actionsToolbarContainer.classList.remove('hidden');
                this._actionsToolbarContainer.classList.add('tabfocused');
                this._domNode.tabIndex = 0;
                if (this.comment.mode === modes.CommentMode.Editing) {
                    (_a = this._commentEditor) === null || _a === void 0 ? void 0 : _a.focus();
                }
            }
            else {
                if (this._actionsToolbarContainer.classList.contains('tabfocused') && !this._actionsToolbarContainer.classList.contains('mouseover')) {
                    this._actionsToolbarContainer.classList.add('hidden');
                    this._domNode.tabIndex = -1;
                }
                this._actionsToolbarContainer.classList.remove('tabfocused');
            }
        }
        registerActionBarListeners(actionsContainer) {
            this._register(dom.addDisposableListener(this._domNode, 'mouseenter', () => {
                actionsContainer.classList.remove('hidden');
                actionsContainer.classList.add('mouseover');
            }));
            this._register(dom.addDisposableListener(this._domNode, 'mouseleave', () => {
                if (actionsContainer.classList.contains('mouseover') && !actionsContainer.classList.contains('tabfocused')) {
                    actionsContainer.classList.add('hidden');
                }
                actionsContainer.classList.remove('mouseover');
            }));
        }
        update(newComment) {
            if (newComment.body !== this.comment.body) {
                this._body.removeChild(this._md);
                this._md = this.markdownRenderer.render(newComment.body).element;
                this._body.appendChild(this._md);
            }
            if (newComment.mode !== undefined && newComment.mode !== this.comment.mode) {
                if (newComment.mode === modes.CommentMode.Editing) {
                    this.switchToEditMode();
                }
                else {
                    this.removeCommentEditor();
                }
            }
            this.comment = newComment;
            if (newComment.label) {
                this._isPendingLabel.innerText = newComment.label;
            }
            else {
                this._isPendingLabel.innerText = '';
            }
            // update comment reactions
            if (this._reactionActionsContainer) {
                this._reactionActionsContainer.remove();
            }
            if (this._reactionsActionBar) {
                this._reactionsActionBar.clear();
            }
            if (this.comment.commentReactions && this.comment.commentReactions.some(reaction => !!reaction.count)) {
                this.createReactionsContainer(this._commentDetailsContainer);
            }
            if (this.comment.contextValue) {
                this._commentContextValue.set(this.comment.contextValue);
            }
            else {
                this._commentContextValue.reset();
            }
        }
        focus() {
            this.domNode.focus();
            if (!this._clearTimeout) {
                dom.addClass(this.domNode, 'focus');
                this._clearTimeout = setTimeout(() => {
                    dom.removeClass(this.domNode, 'focus');
                }, 3000);
            }
        }
    };
    CommentNode = __decorate([
        __param(7, themeService_1.IThemeService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, commentService_1.ICommentService),
        __param(10, modelService_1.IModelService),
        __param(11, modeService_1.IModeService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, notification_1.INotificationService),
        __param(14, contextView_1.IContextMenuService),
        __param(15, contextkey_1.IContextKeyService)
    ], CommentNode);
    exports.CommentNode = CommentNode;
    function fillInActions(groups, target, useAlternativeActions, isPrimaryGroup = group => group === 'navigation') {
        for (let tuple of groups) {
            let [group, actions] = tuple;
            if (useAlternativeActions) {
                actions = actions.map(a => (a instanceof actions_2.MenuItemAction) && !!a.alt ? a.alt : a);
            }
            if (isPrimaryGroup(group)) {
                const to = Array.isArray(target) ? target : target.primary;
                to.unshift(...actions);
            }
            else {
                const to = Array.isArray(target) ? target : target.secondary;
                if (to.length > 0) {
                    to.push(new actionbar_1.Separator());
                }
                to.push(...actions);
            }
        }
    }
});
//# __sourceMappingURL=commentNode.js.map