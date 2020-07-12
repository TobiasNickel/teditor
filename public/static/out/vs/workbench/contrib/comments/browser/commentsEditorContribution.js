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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/contrib/peekView/peekView", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/workbench/contrib/comments/browser/commentGlyphWidget", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentThreadWidget", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/css!./media/review"], function (require, exports, dom_1, actions_1, arrays_1, async_1, errors_1, lifecycle_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, range_1, textModel_1, modes, peekView_1, nls, commands_1, contextView_1, instantiation_1, keybindingsRegistry_1, quickInput_1, colorRegistry_1, themeService_1, theme_1, commentGlyphWidget_1, commentService_1, commentThreadWidget_1, simpleCommentEditor_1, editorService_1, embeddedCodeEditorWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getActiveEditor = exports.NextCommentThreadAction = exports.CommentController = exports.ReviewViewZone = exports.ID = void 0;
    exports.ID = 'editor.contrib.review';
    class ReviewViewZone {
        constructor(afterLineNumber, onDomNodeTop) {
            this.afterLineNumber = afterLineNumber;
            this.callback = onDomNodeTop;
            this.domNode = dom_1.$('.review-viewzone');
        }
        onDomNodeTop(top) {
            this.callback(top);
        }
    }
    exports.ReviewViewZone = ReviewViewZone;
    class CommentingRangeDecoration {
        constructor(_editor, _ownerId, _extensionId, _label, _range, commentingOptions, commentingRangesInfo) {
            this._editor = _editor;
            this._ownerId = _ownerId;
            this._extensionId = _extensionId;
            this._label = _label;
            this._range = _range;
            this.commentingRangesInfo = commentingRangesInfo;
            const startLineNumber = _range.startLineNumber;
            const endLineNumber = _range.endLineNumber;
            let commentingRangeDecorations = [{
                    range: {
                        startLineNumber: startLineNumber, startColumn: 1,
                        endLineNumber: endLineNumber, endColumn: 1
                    },
                    options: commentingOptions
                }];
            this._decorationId = this._editor.deltaDecorations([], commentingRangeDecorations)[0];
        }
        get id() {
            return this._decorationId;
        }
        getCommentAction() {
            return {
                extensionId: this._extensionId,
                label: this._label,
                ownerId: this._ownerId,
                commentingRangesInfo: this.commentingRangesInfo
            };
        }
        getOriginalRange() {
            return this._range;
        }
        getActiveRange() {
            return this._editor.getModel().getDecorationRange(this._decorationId);
        }
    }
    class CommentingRangeDecorator {
        constructor() {
            this.commentingRangeDecorations = [];
            const decorationOptions = {
                isWholeLine: true,
                linesDecorationsClassName: 'comment-range-glyph comment-diff-added'
            };
            this.decorationOptions = textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
        }
        update(editor, commentInfos) {
            let model = editor.getModel();
            if (!model) {
                return;
            }
            let commentingRangeDecorations = [];
            for (const info of commentInfos) {
                info.commentingRanges.ranges.forEach(range => {
                    commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, range, this.decorationOptions, info.commentingRanges));
                });
            }
            let oldDecorations = this.commentingRangeDecorations.map(decoration => decoration.id);
            editor.deltaDecorations(oldDecorations, []);
            this.commentingRangeDecorations = commentingRangeDecorations;
        }
        getMatchedCommentAction(line) {
            let result = [];
            for (const decoration of this.commentingRangeDecorations) {
                const range = decoration.getActiveRange();
                if (range && range.startLineNumber <= line && line <= range.endLineNumber) {
                    result.push(decoration.getCommentAction());
                }
            }
            return result;
        }
        dispose() {
            this.commentingRangeDecorations = [];
        }
    }
    let CommentController = class CommentController {
        constructor(editor, commentService, instantiationService, codeEditorService, contextMenuService, quickInputService) {
            this.commentService = commentService;
            this.instantiationService = instantiationService;
            this.codeEditorService = codeEditorService;
            this.contextMenuService = contextMenuService;
            this.quickInputService = quickInputService;
            this.globalToDispose = new lifecycle_1.DisposableStore();
            this.localToDispose = new lifecycle_1.DisposableStore();
            this.mouseDownInfo = null;
            this._commentingRangeSpaceReserved = false;
            this._emptyThreadsToAddQueue = [];
            this._commentInfos = [];
            this._commentWidgets = [];
            this._pendingCommentCache = {};
            this._computePromise = null;
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                return;
            }
            this.editor = editor;
            this._commentingRangeDecorator = new CommentingRangeDecorator();
            this.globalToDispose.add(this.commentService.onDidDeleteDataProvider(ownerId => {
                delete this._pendingCommentCache[ownerId];
                this.beginCompute();
            }));
            this.globalToDispose.add(this.commentService.onDidSetDataProvider(_ => this.beginCompute()));
            this.globalToDispose.add(this.commentService.onDidSetResourceCommentInfos(e => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (editorURI && editorURI.toString() === e.resource.toString()) {
                    this.setComments(e.commentInfos.filter(commentInfo => commentInfo !== null));
                }
            }));
            this.globalToDispose.add(this.editor.onDidChangeModel(e => this.onModelChanged(e)));
            this.codeEditorService.registerDecorationType(commentThreadWidget_1.COMMENTEDITOR_DECORATION_KEY, {});
            this.beginCompute();
        }
        beginCompute() {
            this._computePromise = async_1.createCancelablePromise(token => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (editorURI) {
                    return this.commentService.getComments(editorURI);
                }
                return Promise.resolve([]);
            });
            return this._computePromise.then(commentInfos => {
                this.setComments(arrays_1.coalesce(commentInfos));
                this._computePromise = null;
            }, error => console.log(error));
        }
        beginComputeCommentingRanges() {
            if (this._computeCommentingRangeScheduler) {
                if (this._computeCommentingRangePromise) {
                    this._computeCommentingRangePromise.cancel();
                    this._computeCommentingRangePromise = null;
                }
                this._computeCommentingRangeScheduler.trigger(() => {
                    const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                    if (editorURI) {
                        return this.commentService.getComments(editorURI);
                    }
                    return Promise.resolve([]);
                }).then(commentInfos => {
                    const meaningfulCommentInfos = arrays_1.coalesce(commentInfos);
                    this._commentingRangeDecorator.update(this.editor, meaningfulCommentInfos);
                }, (err) => {
                    errors_1.onUnexpectedError(err);
                    return null;
                });
            }
        }
        static get(editor) {
            return editor.getContribution(exports.ID);
        }
        revealCommentThread(threadId, commentUniqueId, fetchOnceIfNotExist) {
            const commentThreadWidget = this._commentWidgets.filter(widget => widget.commentThread.threadId === threadId);
            if (commentThreadWidget.length === 1) {
                commentThreadWidget[0].reveal(commentUniqueId);
            }
            else if (fetchOnceIfNotExist) {
                if (this._computePromise) {
                    this._computePromise.then(_ => {
                        this.revealCommentThread(threadId, commentUniqueId, false);
                    });
                }
                else {
                    this.beginCompute().then(_ => {
                        this.revealCommentThread(threadId, commentUniqueId, false);
                    });
                }
            }
        }
        nextCommentThread() {
            if (!this._commentWidgets.length || !this.editor.hasModel()) {
                return;
            }
            const after = this.editor.getSelection().getEndPosition();
            const sortedWidgets = this._commentWidgets.sort((a, b) => {
                if (a.commentThread.range.startLineNumber < b.commentThread.range.startLineNumber) {
                    return -1;
                }
                if (a.commentThread.range.startLineNumber > b.commentThread.range.startLineNumber) {
                    return 1;
                }
                if (a.commentThread.range.startColumn < b.commentThread.range.startColumn) {
                    return -1;
                }
                if (a.commentThread.range.startColumn > b.commentThread.range.startColumn) {
                    return 1;
                }
                return 0;
            });
            let idx = arrays_1.findFirstInSorted(sortedWidgets, widget => {
                if (widget.commentThread.range.startLineNumber > after.lineNumber) {
                    return true;
                }
                if (widget.commentThread.range.startLineNumber < after.lineNumber) {
                    return false;
                }
                if (widget.commentThread.range.startColumn > after.column) {
                    return true;
                }
                return false;
            });
            if (idx === this._commentWidgets.length) {
                this._commentWidgets[0].reveal();
                this.editor.setSelection(this._commentWidgets[0].commentThread.range);
            }
            else {
                sortedWidgets[idx].reveal();
                this.editor.setSelection(sortedWidgets[idx].commentThread.range);
            }
        }
        dispose() {
            this.globalToDispose.dispose();
            this.localToDispose.dispose();
            this._commentWidgets.forEach(widget => widget.dispose());
            this.editor = null; // Strict null override — nulling out in dispose
        }
        onModelChanged(e) {
            this.localToDispose.clear();
            this.removeCommentWidgetsAndStoreCache();
            this.localToDispose.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this.localToDispose.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            this._computeCommentingRangeScheduler = new async_1.Delayer(200);
            this.localToDispose.add({
                dispose: () => {
                    if (this._computeCommentingRangeScheduler) {
                        this._computeCommentingRangeScheduler.cancel();
                    }
                    this._computeCommentingRangeScheduler = null;
                }
            });
            this.localToDispose.add(this.editor.onDidChangeModelContent(async () => {
                this.beginComputeCommentingRanges();
            }));
            this.localToDispose.add(this.commentService.onDidUpdateCommentThreads(async (e) => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (!editorURI) {
                    return;
                }
                if (this._computePromise) {
                    await this._computePromise;
                }
                let commentInfo = this._commentInfos.filter(info => info.owner === e.owner);
                if (!commentInfo || !commentInfo.length) {
                    return;
                }
                let added = e.added.filter(thread => thread.resource && thread.resource.toString() === editorURI.toString());
                let removed = e.removed.filter(thread => thread.resource && thread.resource.toString() === editorURI.toString());
                let changed = e.changed.filter(thread => thread.resource && thread.resource.toString() === editorURI.toString());
                removed.forEach(thread => {
                    let matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.threadId === thread.threadId && zoneWidget.commentThread.threadId !== '');
                    if (matchedZones.length) {
                        let matchedZone = matchedZones[0];
                        let index = this._commentWidgets.indexOf(matchedZone);
                        this._commentWidgets.splice(index, 1);
                        matchedZone.dispose();
                    }
                });
                changed.forEach(thread => {
                    let matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.threadId === thread.threadId);
                    if (matchedZones.length) {
                        let matchedZone = matchedZones[0];
                        matchedZone.update(thread);
                    }
                });
                added.forEach(thread => {
                    let matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.threadId === thread.threadId);
                    if (matchedZones.length) {
                        return;
                    }
                    let matchedNewCommentThreadZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.commentThreadHandle === -1 && range_1.Range.equalsRange(zoneWidget.commentThread.range, thread.range));
                    if (matchedNewCommentThreadZones.length) {
                        matchedNewCommentThreadZones[0].update(thread);
                        return;
                    }
                    const pendingCommentText = this._pendingCommentCache[e.owner] && this._pendingCommentCache[e.owner][thread.threadId];
                    this.displayCommentThread(e.owner, thread, pendingCommentText);
                    this._commentInfos.filter(info => info.owner === e.owner)[0].threads.push(thread);
                });
            }));
            this.beginCompute();
        }
        displayCommentThread(owner, thread, pendingComment) {
            const zoneWidget = this.instantiationService.createInstance(commentThreadWidget_1.ReviewZoneWidget, this.editor, owner, thread, pendingComment);
            zoneWidget.display(thread.range.startLineNumber);
            this._commentWidgets.push(zoneWidget);
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range) {
                return;
            }
            if (!e.event.leftButton) {
                return;
            }
            if (e.target.type !== 4 /* GUTTER_LINE_DECORATIONS */) {
                return;
            }
            const data = e.target.detail;
            const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
            // don't collide with folding and git decorations
            if (gutterOffsetX > 14) {
                return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber };
        }
        onEditorMouseUp(e) {
            if (!this.mouseDownInfo) {
                return;
            }
            const { lineNumber } = this.mouseDownInfo;
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (e.target.type !== 4 /* GUTTER_LINE_DECORATIONS */) {
                return;
            }
            if (!e.target.element) {
                return;
            }
            if (e.target.element.className.indexOf('comment-diff-added') >= 0) {
                const lineNumber = e.target.position.lineNumber;
                this.addOrToggleCommentAtLine(lineNumber, e);
            }
        }
        async addOrToggleCommentAtLine(lineNumber, e) {
            // If an add is already in progress, queue the next add and process it after the current one finishes to
            // prevent empty comment threads from being added to the same line.
            if (!this._addInProgress) {
                this._addInProgress = true;
                // The widget's position is undefined until the widget has been displayed, so rely on the glyph position instead
                const existingCommentsAtLine = this._commentWidgets.filter(widget => widget.getGlyphPosition() === lineNumber);
                if (existingCommentsAtLine.length) {
                    existingCommentsAtLine.forEach(widget => widget.toggleExpand(lineNumber));
                    this.processNextThreadToAdd();
                    return;
                }
                else {
                    this.addCommentAtLine(lineNumber, e);
                }
            }
            else {
                this._emptyThreadsToAddQueue.push([lineNumber, e]);
            }
        }
        processNextThreadToAdd() {
            this._addInProgress = false;
            const info = this._emptyThreadsToAddQueue.shift();
            if (info) {
                this.addOrToggleCommentAtLine(info[0], info[1]);
            }
        }
        addCommentAtLine(lineNumber, e) {
            const newCommentInfos = this._commentingRangeDecorator.getMatchedCommentAction(lineNumber);
            if (!newCommentInfos.length || !this.editor.hasModel()) {
                return Promise.resolve();
            }
            if (newCommentInfos.length > 1) {
                if (e) {
                    const anchor = { x: e.event.posx, y: e.event.posy };
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => anchor,
                        getActions: () => this.getContextMenuActions(newCommentInfos, lineNumber),
                        getActionsContext: () => newCommentInfos.length ? newCommentInfos[0] : undefined,
                        onHide: () => { this._addInProgress = false; }
                    });
                    return Promise.resolve();
                }
                else {
                    const picks = this.getCommentProvidersQuickPicks(newCommentInfos);
                    return this.quickInputService.pick(picks, { placeHolder: nls.localize('pickCommentService', "Select Comment Provider"), matchOnDescription: true }).then(pick => {
                        if (!pick) {
                            return;
                        }
                        const commentInfos = newCommentInfos.filter(info => info.ownerId === pick.id);
                        if (commentInfos.length) {
                            const { ownerId } = commentInfos[0];
                            this.addCommentAtLine2(lineNumber, ownerId);
                        }
                    }).then(() => {
                        this._addInProgress = false;
                    });
                }
            }
            else {
                const { ownerId } = newCommentInfos[0];
                this.addCommentAtLine2(lineNumber, ownerId);
            }
            return Promise.resolve();
        }
        getCommentProvidersQuickPicks(commentInfos) {
            const picks = commentInfos.map((commentInfo) => {
                const { ownerId, extensionId, label } = commentInfo;
                return {
                    label: label || extensionId,
                    id: ownerId
                };
            });
            return picks;
        }
        getContextMenuActions(commentInfos, lineNumber) {
            const actions = [];
            commentInfos.forEach(commentInfo => {
                const { ownerId, extensionId, label } = commentInfo;
                actions.push(new actions_1.Action('addCommentThread', `${label || extensionId}`, undefined, true, () => {
                    this.addCommentAtLine2(lineNumber, ownerId);
                    return Promise.resolve();
                }));
            });
            return actions;
        }
        addCommentAtLine2(lineNumber, ownerId) {
            const range = new range_1.Range(lineNumber, 1, lineNumber, 1);
            this.commentService.createCommentThreadTemplate(ownerId, this.editor.getModel().uri, range);
            this.processNextThreadToAdd();
            return;
        }
        setComments(commentInfos) {
            if (!this.editor) {
                return;
            }
            this._commentInfos = commentInfos;
            let lineDecorationsWidth = this.editor.getLayoutInfo().decorationsWidth;
            if (this._commentInfos.some(info => Boolean(info.commentingRanges && (Array.isArray(info.commentingRanges) ? info.commentingRanges : info.commentingRanges.ranges).length))) {
                if (!this._commentingRangeSpaceReserved) {
                    this._commentingRangeSpaceReserved = true;
                    let extraEditorClassName = [];
                    const configuredExtraClassName = this.editor.getRawOptions().extraEditorClassName;
                    if (configuredExtraClassName) {
                        extraEditorClassName = configuredExtraClassName.split(' ');
                    }
                    const options = this.editor.getOptions();
                    if (options.get(31 /* folding */)) {
                        lineDecorationsWidth -= 16;
                    }
                    lineDecorationsWidth += 9;
                    extraEditorClassName.push('inline-comment');
                    this.editor.updateOptions({
                        extraEditorClassName: extraEditorClassName.join(' '),
                        lineDecorationsWidth: lineDecorationsWidth
                    });
                    // we only update the lineDecorationsWidth property but keep the width of the whole editor.
                    const originalLayoutInfo = this.editor.getLayoutInfo();
                    this.editor.layout({
                        width: originalLayoutInfo.width,
                        height: originalLayoutInfo.height
                    });
                }
            }
            // create viewzones
            this.removeCommentWidgetsAndStoreCache();
            this._commentInfos.forEach(info => {
                let providerCacheStore = this._pendingCommentCache[info.owner];
                info.threads = info.threads.filter(thread => !thread.isDisposed);
                info.threads.forEach(thread => {
                    let pendingComment = null;
                    if (providerCacheStore) {
                        pendingComment = providerCacheStore[thread.threadId];
                    }
                    if (pendingComment) {
                        thread.collapsibleState = modes.CommentThreadCollapsibleState.Expanded;
                    }
                    this.displayCommentThread(info.owner, thread, pendingComment);
                });
            });
            this._commentingRangeDecorator.update(this.editor, this._commentInfos);
        }
        closeWidget() {
            if (this._commentWidgets) {
                this._commentWidgets.forEach(widget => widget.hide());
            }
            this.editor.focus();
            this.editor.revealRangeInCenter(this.editor.getSelection());
        }
        removeCommentWidgetsAndStoreCache() {
            if (this._commentWidgets) {
                this._commentWidgets.forEach(zone => {
                    let pendingComment = zone.getPendingComment();
                    let providerCacheStore = this._pendingCommentCache[zone.owner];
                    if (pendingComment) {
                        if (!providerCacheStore) {
                            this._pendingCommentCache[zone.owner] = {};
                        }
                        this._pendingCommentCache[zone.owner][zone.commentThread.threadId] = pendingComment;
                    }
                    else {
                        if (providerCacheStore) {
                            delete providerCacheStore[zone.commentThread.threadId];
                        }
                    }
                    zone.dispose();
                });
            }
            this._commentWidgets = [];
        }
    };
    CommentController = __decorate([
        __param(1, commentService_1.ICommentService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, quickInput_1.IQuickInputService)
    ], CommentController);
    exports.CommentController = CommentController;
    class NextCommentThreadAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.nextCommentThreadAction',
                label: nls.localize('nextCommentThreadAction', "Go to Next Comment Thread"),
                alias: 'Go to Next Comment Thread',
                precondition: undefined,
            });
        }
        run(accessor, editor) {
            let controller = CommentController.get(editor);
            if (controller) {
                controller.nextCommentThread();
            }
        }
    }
    exports.NextCommentThreadAction = NextCommentThreadAction;
    editorExtensions_1.registerEditorContribution(exports.ID, CommentController);
    editorExtensions_1.registerEditorAction(NextCommentThreadAction);
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.addComment',
        handler: (accessor) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            const position = activeEditor.getPosition();
            return controller.addOrToggleCommentAtLine(position.lineNumber, undefined);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.submitComment',
        weight: 100 /* EditorContrib */,
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().submitComment();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.hideComment',
        weight: 100 /* EditorContrib */,
        primary: 9 /* Escape */,
        secondary: [1024 /* Shift */ | 9 /* Escape */],
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().collapse();
            }
        }
    });
    function getActiveEditor(accessor) {
        let activeTextEditorControl = accessor.get(editorService_1.IEditorService).activeTextEditorControl;
        if (editorBrowser_1.isDiffEditor(activeTextEditorControl)) {
            if (activeTextEditorControl.getOriginalEditor().hasTextFocus()) {
                activeTextEditorControl = activeTextEditorControl.getOriginalEditor();
            }
            else {
                activeTextEditorControl = activeTextEditorControl.getModifiedEditor();
            }
        }
        if (!editorBrowser_1.isCodeEditor(activeTextEditorControl) || !activeTextEditorControl.hasModel()) {
            return null;
        }
        return activeTextEditorControl;
    }
    exports.getActiveEditor = getActiveEditor;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const peekViewBackground = theme.getColor(peekView_1.peekViewResultsBackground);
        if (peekViewBackground) {
            collector.addRule(`.monaco-editor .review-widget,` +
                `.monaco-editor .review-widget {` +
                `	background-color: ${peekViewBackground};` +
                `}`);
        }
        const monacoEditorBackground = theme.getColor(peekView_1.peekViewTitleBackground);
        if (monacoEditorBackground) {
            collector.addRule(`.monaco-editor .review-widget .body .comment-form .review-thread-reply-button {` +
                `	background-color: ${monacoEditorBackground}` +
                `}`);
        }
        const monacoEditorForeground = theme.getColor(colorRegistry_1.editorForeground);
        if (monacoEditorForeground) {
            collector.addRule(`.monaco-editor .review-widget .body .monaco-editor {` +
                `	color: ${monacoEditorForeground}` +
                `}` +
                `.monaco-editor .review-widget .body .comment-form .review-thread-reply-button {` +
                `	color: ${monacoEditorForeground};` +
                `	font-size: inherit` +
                `}`);
        }
        const selectionBackground = theme.getColor(peekView_1.peekViewResultsSelectionBackground);
        if (selectionBackground) {
            collector.addRule(`@keyframes monaco-review-widget-focus {` +
                `	0% { background: ${selectionBackground}; }` +
                `	100% { background: transparent; }` +
                `}` +
                `.monaco-editor .review-widget .body .review-comment.focus {` +
                `	animation: monaco-review-widget-focus 3s ease 0s;` +
                `}`);
        }
        const commentingRangeForeground = theme.getColor(commentGlyphWidget_1.overviewRulerCommentingRangeForeground);
        if (commentingRangeForeground) {
            collector.addRule(`
			.monaco-editor .comment-diff-added {
				border-left: 3px solid ${commentingRangeForeground};
			}
			.monaco-editor .comment-diff-added:before {
				background: ${commentingRangeForeground};
			}
			.monaco-editor .comment-thread {
				border-left: 3px solid ${commentingRangeForeground};
			}
			.monaco-editor .comment-thread:before {
				background: ${commentingRangeForeground};
			}
		`);
        }
        const statusBarItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
        if (statusBarItemHoverBackground) {
            collector.addRule(`.monaco-editor .review-widget .body .review-comment .review-comment-contents .comment-reactions .action-item a.action-label.active:hover { background-color: ${statusBarItemHoverBackground};}`);
        }
        const statusBarItemActiveBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_ACTIVE_BACKGROUND);
        if (statusBarItemActiveBackground) {
            collector.addRule(`.monaco-editor .review-widget .body .review-comment .review-comment-contents .comment-reactions .action-item a.action-label:active { background-color: ${statusBarItemActiveBackground}; border: 1px solid transparent;}`);
        }
    });
});
//# __sourceMappingURL=commentsEditorContribution.js.map