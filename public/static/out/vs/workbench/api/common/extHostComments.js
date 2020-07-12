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
define(["require", "exports", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/modes", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "./extHost.protocol"], function (require, exports, async_1, decorators_1, event_1, lifecycle_1, uri_1, modes, extensions_1, extHostTypeConverter, types, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostCommentThread = exports.ExtHostComments = void 0;
    class ExtHostComments {
        constructor(mainContext, commands, _documents) {
            this._documents = _documents;
            this._commentControllers = new Map();
            this._commentControllersByExtension = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadComments);
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (arg && arg.$mid === 6) {
                        const commentController = this._commentControllers.get(arg.handle);
                        if (!commentController) {
                            return arg;
                        }
                        return commentController;
                    }
                    else if (arg && arg.$mid === 7) {
                        const commentController = this._commentControllers.get(arg.commentControlHandle);
                        if (!commentController) {
                            return arg;
                        }
                        const commentThread = commentController.getCommentThread(arg.commentThreadHandle);
                        if (!commentThread) {
                            return arg;
                        }
                        return commentThread;
                    }
                    else if (arg && arg.$mid === 8) {
                        const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                        if (!commentController) {
                            return arg;
                        }
                        const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                        if (!commentThread) {
                            return arg;
                        }
                        return {
                            thread: commentThread,
                            text: arg.text
                        };
                    }
                    else if (arg && arg.$mid === 9) {
                        const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                        if (!commentController) {
                            return arg;
                        }
                        const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                        if (!commentThread) {
                            return arg;
                        }
                        let commentUniqueId = arg.commentUniqueId;
                        let comment = commentThread.getCommentByUniqueId(commentUniqueId);
                        if (!comment) {
                            return arg;
                        }
                        return comment;
                    }
                    else if (arg && arg.$mid === 10) {
                        const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                        if (!commentController) {
                            return arg;
                        }
                        const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                        if (!commentThread) {
                            return arg;
                        }
                        let body = arg.text;
                        let commentUniqueId = arg.commentUniqueId;
                        let comment = commentThread.getCommentByUniqueId(commentUniqueId);
                        if (!comment) {
                            return arg;
                        }
                        comment.body = body;
                        return comment;
                    }
                    return arg;
                }
            });
        }
        createCommentController(extension, id, label) {
            const handle = ExtHostComments.handlePool++;
            const commentController = new ExtHostCommentController(extension, handle, this._proxy, id, label);
            this._commentControllers.set(commentController.handle, commentController);
            const commentControllers = this._commentControllersByExtension.get(extensions_1.ExtensionIdentifier.toKey(extension.identifier)) || [];
            commentControllers.push(commentController);
            this._commentControllersByExtension.set(extensions_1.ExtensionIdentifier.toKey(extension.identifier), commentControllers);
            return commentController;
        }
        $createCommentThreadTemplate(commentControllerHandle, uriComponents, range) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController) {
                return;
            }
            commentController.$createCommentThreadTemplate(uriComponents, range);
        }
        async $updateCommentThreadTemplate(commentControllerHandle, threadHandle, range) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController) {
                return;
            }
            commentController.$updateCommentThreadTemplate(threadHandle, range);
        }
        $deleteCommentThread(commentControllerHandle, commentThreadHandle) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (commentController) {
                commentController.$deleteCommentThread(commentThreadHandle);
            }
        }
        $provideCommentingRanges(commentControllerHandle, uriComponents, token) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController || !commentController.commentingRangeProvider) {
                return Promise.resolve(undefined);
            }
            const document = this._documents.getDocument(uri_1.URI.revive(uriComponents));
            return async_1.asPromise(() => {
                return commentController.commentingRangeProvider.provideCommentingRanges(document, token);
            }).then(ranges => ranges ? ranges.map(x => extHostTypeConverter.Range.from(x)) : undefined);
        }
        $toggleReaction(commentControllerHandle, threadHandle, uri, comment, reaction) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController || !commentController.reactionHandler) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => {
                const commentThread = commentController.getCommentThread(threadHandle);
                if (commentThread) {
                    const vscodeComment = commentThread.getCommentByUniqueId(comment.uniqueIdInThread);
                    if (commentController !== undefined && vscodeComment) {
                        if (commentController.reactionHandler) {
                            return commentController.reactionHandler(vscodeComment, convertFromReaction(reaction));
                        }
                    }
                }
                return Promise.resolve(undefined);
            });
        }
        dispose() {
        }
    }
    exports.ExtHostComments = ExtHostComments;
    ExtHostComments.handlePool = 0;
    class ExtHostCommentThread {
        constructor(_proxy, _commentController, _id, _uri, _range, _comments, extensionId) {
            this._proxy = _proxy;
            this._commentController = _commentController;
            this._id = _id;
            this._uri = _uri;
            this._range = _range;
            this._comments = _comments;
            this.handle = ExtHostCommentThread._handlePool++;
            this.commentHandle = 0;
            this.modifications = Object.create(null);
            this._onDidUpdateCommentThread = new event_1.Emitter();
            this.onDidUpdateCommentThread = this._onDidUpdateCommentThread.event;
            this._commentsMap = new Map();
            this._acceptInputDisposables = new lifecycle_1.MutableDisposable();
            this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
            if (this._id === undefined) {
                this._id = `${_commentController.id}.${this.handle}`;
            }
            this._proxy.$createCommentThread(this._commentController.handle, this.handle, this._id, this._uri, extHostTypeConverter.Range.from(this._range), extensionId);
            this._localDisposables = [];
            this._isDiposed = false;
            this._localDisposables.push(this.onDidUpdateCommentThread(() => {
                this.eventuallyUpdateCommentThread();
            }));
            // set up comments after ctor to batch update events.
            this.comments = _comments;
        }
        set threadId(id) {
            this._id = id;
        }
        get threadId() {
            return this._id;
        }
        get id() {
            return this._id;
        }
        get resource() {
            return this._uri;
        }
        get uri() {
            return this._uri;
        }
        set range(range) {
            if (!range.isEqual(this._range)) {
                this._range = range;
                this.modifications.range = range;
                this._onDidUpdateCommentThread.fire();
            }
        }
        get range() {
            return this._range;
        }
        get label() {
            return this._label;
        }
        set label(label) {
            this._label = label;
            this.modifications.label = label;
            this._onDidUpdateCommentThread.fire();
        }
        get contextValue() {
            return this._contextValue;
        }
        set contextValue(context) {
            this._contextValue = context;
            this.modifications.contextValue = context;
            this._onDidUpdateCommentThread.fire();
        }
        get comments() {
            return this._comments;
        }
        set comments(newComments) {
            this._comments = newComments;
            this.modifications.comments = newComments;
            this._onDidUpdateCommentThread.fire();
        }
        get collapsibleState() {
            return this._collapseState;
        }
        set collapsibleState(newState) {
            this._collapseState = newState;
            this.modifications.collapsibleState = newState;
            this._onDidUpdateCommentThread.fire();
        }
        get isDisposed() {
            return this._isDiposed;
        }
        eventuallyUpdateCommentThread() {
            if (this._isDiposed) {
                return;
            }
            if (!this._acceptInputDisposables.value) {
                this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
            }
            const modified = (value) => Object.prototype.hasOwnProperty.call(this.modifications, value);
            const formattedModifications = {};
            if (modified('range')) {
                formattedModifications.range = extHostTypeConverter.Range.from(this._range);
            }
            if (modified('label')) {
                formattedModifications.label = this.label;
            }
            if (modified('contextValue')) {
                formattedModifications.contextValue = this.contextValue;
            }
            if (modified('comments')) {
                formattedModifications.comments =
                    this._comments.map(cmt => convertToModeComment(this, this._commentController, cmt, this._commentsMap));
            }
            if (modified('collapsibleState')) {
                formattedModifications.collapseState = convertToCollapsibleState(this._collapseState);
            }
            this.modifications = {};
            this._proxy.$updateCommentThread(this._commentController.handle, this.handle, this._id, this._uri, formattedModifications);
        }
        getCommentByUniqueId(uniqueId) {
            for (let key of this._commentsMap) {
                let comment = key[0];
                let id = key[1];
                if (uniqueId === id) {
                    return comment;
                }
            }
            return;
        }
        dispose() {
            this._isDiposed = true;
            this._acceptInputDisposables.dispose();
            this._localDisposables.forEach(disposable => disposable.dispose());
            this._proxy.$deleteCommentThread(this._commentController.handle, this.handle);
        }
    }
    ExtHostCommentThread._handlePool = 0;
    __decorate([
        decorators_1.debounce(100)
    ], ExtHostCommentThread.prototype, "eventuallyUpdateCommentThread", null);
    exports.ExtHostCommentThread = ExtHostCommentThread;
    class ExtHostCommentController {
        constructor(_extension, _handle, _proxy, _id, _label) {
            this._extension = _extension;
            this._handle = _handle;
            this._proxy = _proxy;
            this._id = _id;
            this._label = _label;
            this._threads = new Map();
            this._proxy.$registerCommentController(this.handle, _id, _label);
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get handle() {
            return this._handle;
        }
        get reactionHandler() {
            return this._reactionHandler;
        }
        set reactionHandler(handler) {
            this._reactionHandler = handler;
            this._proxy.$updateCommentControllerFeatures(this.handle, { reactionHandler: !!handler });
        }
        get options() {
            return this._options;
        }
        set options(options) {
            this._options = options;
            this._proxy.$updateCommentControllerFeatures(this.handle, { options: this._options });
        }
        createCommentThread(arg0, arg1, arg2, arg3) {
            if (typeof arg0 === 'string') {
                const commentThread = new ExtHostCommentThread(this._proxy, this, arg0, arg1, arg2, arg3, this._extension.identifier);
                this._threads.set(commentThread.handle, commentThread);
                return commentThread;
            }
            else {
                const commentThread = new ExtHostCommentThread(this._proxy, this, undefined, arg0, arg1, arg2, this._extension.identifier);
                this._threads.set(commentThread.handle, commentThread);
                return commentThread;
            }
        }
        $createCommentThreadTemplate(uriComponents, range) {
            const commentThread = new ExtHostCommentThread(this._proxy, this, undefined, uri_1.URI.revive(uriComponents), extHostTypeConverter.Range.to(range), [], this._extension.identifier);
            commentThread.collapsibleState = modes.CommentThreadCollapsibleState.Expanded;
            this._threads.set(commentThread.handle, commentThread);
            return commentThread;
        }
        $updateCommentThreadTemplate(threadHandle, range) {
            let thread = this._threads.get(threadHandle);
            if (thread) {
                thread.range = extHostTypeConverter.Range.to(range);
            }
        }
        $deleteCommentThread(threadHandle) {
            let thread = this._threads.get(threadHandle);
            if (thread) {
                thread.dispose();
            }
            this._threads.delete(threadHandle);
        }
        getCommentThread(handle) {
            return this._threads.get(handle);
        }
        dispose() {
            this._threads.forEach(value => {
                value.dispose();
            });
            this._proxy.$unregisterCommentController(this.handle);
        }
    }
    function convertToModeComment(thread, commentController, vscodeComment, commentsMap) {
        let commentUniqueId = commentsMap.get(vscodeComment);
        if (!commentUniqueId) {
            commentUniqueId = ++thread.commentHandle;
            commentsMap.set(vscodeComment, commentUniqueId);
        }
        const iconPath = vscodeComment.author && vscodeComment.author.iconPath ? vscodeComment.author.iconPath.toString() : undefined;
        return {
            mode: vscodeComment.mode,
            contextValue: vscodeComment.contextValue,
            uniqueIdInThread: commentUniqueId,
            body: extHostTypeConverter.MarkdownString.from(vscodeComment.body),
            userName: vscodeComment.author.name,
            userIconPath: iconPath,
            label: vscodeComment.label,
            commentReactions: vscodeComment.reactions ? vscodeComment.reactions.map(reaction => convertToReaction(reaction)) : undefined
        };
    }
    function convertToReaction(reaction) {
        return {
            label: reaction.label,
            iconPath: reaction.iconPath ? extHostTypeConverter.pathOrURIToURI(reaction.iconPath) : undefined,
            count: reaction.count,
            hasReacted: reaction.authorHasReacted,
        };
    }
    function convertFromReaction(reaction) {
        return {
            label: reaction.label || '',
            count: reaction.count || 0,
            iconPath: reaction.iconPath ? uri_1.URI.revive(reaction.iconPath) : '',
            authorHasReacted: reaction.hasReacted || false
        };
    }
    function convertToCollapsibleState(kind) {
        if (kind !== undefined) {
            switch (kind) {
                case types.CommentThreadCollapsibleState.Expanded:
                    return modes.CommentThreadCollapsibleState.Expanded;
                case types.CommentThreadCollapsibleState.Collapsed:
                    return modes.CommentThreadCollapsibleState.Collapsed;
            }
        }
        return modes.CommentThreadCollapsibleState.Collapsed;
    }
});
//# __sourceMappingURL=extHostComments.js.map