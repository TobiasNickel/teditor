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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/cancellation", "vs/base/common/objects", "vs/workbench/contrib/comments/browser/commentMenus"], function (require, exports, instantiation_1, event_1, lifecycle_1, cancellation_1, objects_1, commentMenus_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentService = exports.ICommentService = void 0;
    exports.ICommentService = instantiation_1.createDecorator('commentService');
    let CommentService = class CommentService extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this._onDidSetDataProvider = this._register(new event_1.Emitter());
            this.onDidSetDataProvider = this._onDidSetDataProvider.event;
            this._onDidDeleteDataProvider = this._register(new event_1.Emitter());
            this.onDidDeleteDataProvider = this._onDidDeleteDataProvider.event;
            this._onDidSetResourceCommentInfos = this._register(new event_1.Emitter());
            this.onDidSetResourceCommentInfos = this._onDidSetResourceCommentInfos.event;
            this._onDidSetAllCommentThreads = this._register(new event_1.Emitter());
            this.onDidSetAllCommentThreads = this._onDidSetAllCommentThreads.event;
            this._onDidUpdateCommentThreads = this._register(new event_1.Emitter());
            this.onDidUpdateCommentThreads = this._onDidUpdateCommentThreads.event;
            this._onDidChangeActiveCommentThread = this._register(new event_1.Emitter());
            this.onDidChangeActiveCommentThread = this._onDidChangeActiveCommentThread.event;
            this._onDidChangeActiveCommentingRange = this._register(new event_1.Emitter());
            this.onDidChangeActiveCommentingRange = this._onDidChangeActiveCommentingRange.event;
            this._commentControls = new Map();
            this._commentMenus = new Map();
        }
        setActiveCommentThread(commentThread) {
            this._onDidChangeActiveCommentThread.fire(commentThread);
        }
        setDocumentComments(resource, commentInfos) {
            this._onDidSetResourceCommentInfos.fire({ resource, commentInfos });
        }
        setWorkspaceComments(owner, commentsByResource) {
            this._onDidSetAllCommentThreads.fire({ ownerId: owner, commentThreads: commentsByResource });
        }
        removeWorkspaceComments(owner) {
            this._onDidSetAllCommentThreads.fire({ ownerId: owner, commentThreads: [] });
        }
        registerCommentController(owner, commentControl) {
            this._commentControls.set(owner, commentControl);
            this._onDidSetDataProvider.fire();
        }
        unregisterCommentController(owner) {
            this._commentControls.delete(owner);
            this._onDidDeleteDataProvider.fire(owner);
        }
        getCommentController(owner) {
            return this._commentControls.get(owner);
        }
        createCommentThreadTemplate(owner, resource, range) {
            const commentController = this._commentControls.get(owner);
            if (!commentController) {
                return;
            }
            commentController.createCommentThreadTemplate(resource, range);
        }
        async updateCommentThreadTemplate(owner, threadHandle, range) {
            const commentController = this._commentControls.get(owner);
            if (!commentController) {
                return;
            }
            await commentController.updateCommentThreadTemplate(threadHandle, range);
        }
        disposeCommentThread(owner, threadId) {
            let controller = this.getCommentController(owner);
            if (controller) {
                controller.deleteCommentThreadMain(threadId);
            }
        }
        getCommentMenus(owner) {
            if (this._commentMenus.get(owner)) {
                return this._commentMenus.get(owner);
            }
            let menu = this.instantiationService.createInstance(commentMenus_1.CommentMenus);
            this._commentMenus.set(owner, menu);
            return menu;
        }
        updateComments(ownerId, event) {
            const evt = objects_1.assign({}, event, { owner: ownerId });
            this._onDidUpdateCommentThreads.fire(evt);
        }
        async toggleReaction(owner, resource, thread, comment, reaction) {
            const commentController = this._commentControls.get(owner);
            if (commentController) {
                return commentController.toggleReaction(resource, thread, comment, reaction, cancellation_1.CancellationToken.None);
            }
            else {
                throw new Error('Not supported');
            }
        }
        hasReactionHandler(owner) {
            const commentProvider = this._commentControls.get(owner);
            if (commentProvider) {
                return !!commentProvider.features.reactionHandler;
            }
            return false;
        }
        async getComments(resource) {
            let commentControlResult = [];
            this._commentControls.forEach(control => {
                commentControlResult.push(control.getDocumentComments(resource, cancellation_1.CancellationToken.None)
                    .catch(e => {
                    console.log(e);
                    return null;
                }));
            });
            return Promise.all(commentControlResult);
        }
        async getCommentingRanges(resource) {
            let commentControlResult = [];
            this._commentControls.forEach(control => {
                commentControlResult.push(control.getCommentingRanges(resource, cancellation_1.CancellationToken.None));
            });
            let ret = await Promise.all(commentControlResult);
            return ret.reduce((prev, curr) => { prev.push(...curr); return prev; }, []);
        }
    };
    CommentService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], CommentService);
    exports.CommentService = CommentService;
});
//# __sourceMappingURL=commentService.js.map