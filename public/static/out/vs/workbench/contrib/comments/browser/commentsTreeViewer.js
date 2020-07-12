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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/browser/markdownRenderer", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/workbench/contrib/comments/common/commentModel", "vs/platform/accessibility/common/accessibility", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources"], function (require, exports, dom, nls, markdownRenderer_1, errors_1, lifecycle_1, opener_1, commentModel_1, accessibility_1, keybinding_1, configuration_1, contextkey_1, listService_1, themeService_1, instantiation_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsList = exports.CommentNodeRenderer = exports.ResourceWithCommentsRenderer = exports.CommentsModelVirualDelegate = exports.CommentsAsyncDataSource = exports.COMMENTS_VIEW_TITLE = exports.COMMENTS_VIEW_ID = void 0;
    exports.COMMENTS_VIEW_ID = 'workbench.panel.comments';
    exports.COMMENTS_VIEW_TITLE = 'Comments';
    class CommentsAsyncDataSource {
        hasChildren(element) {
            return element instanceof commentModel_1.CommentsModel || element instanceof commentModel_1.ResourceWithCommentThreads || (element instanceof commentModel_1.CommentNode && !!element.replies.length);
        }
        getChildren(element) {
            if (element instanceof commentModel_1.CommentsModel) {
                return Promise.resolve(element.resourceCommentThreads);
            }
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return Promise.resolve(element.commentThreads);
            }
            if (element instanceof commentModel_1.CommentNode) {
                return Promise.resolve(element.replies);
            }
            return Promise.resolve([]);
        }
    }
    exports.CommentsAsyncDataSource = CommentsAsyncDataSource;
    class CommentsModelVirualDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return CommentsModelVirualDelegate.RESOURCE_ID;
            }
            if (element instanceof commentModel_1.CommentNode) {
                return CommentsModelVirualDelegate.COMMENT_ID;
            }
            return '';
        }
    }
    exports.CommentsModelVirualDelegate = CommentsModelVirualDelegate;
    CommentsModelVirualDelegate.RESOURCE_ID = 'resource-with-comments';
    CommentsModelVirualDelegate.COMMENT_ID = 'comment-node';
    class ResourceWithCommentsRenderer {
        constructor(labels) {
            this.labels = labels;
            this.templateId = 'resource-with-comments';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const labelContainer = dom.append(container, dom.$('.resource-container'));
            data.resourceLabel = this.labels.create(labelContainer);
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.resourceLabel.setFile(node.element.resource);
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
        }
    }
    exports.ResourceWithCommentsRenderer = ResourceWithCommentsRenderer;
    let CommentNodeRenderer = class CommentNodeRenderer {
        constructor(openerService) {
            this.openerService = openerService;
            this.templateId = 'comment-node';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const labelContainer = dom.append(container, dom.$('.comment-container'));
            data.userName = dom.append(labelContainer, dom.$('.user'));
            data.commentText = dom.append(labelContainer, dom.$('.text'));
            data.disposables = [];
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.userName.textContent = node.element.comment.userName;
            templateData.commentText.innerHTML = '';
            const disposables = new lifecycle_1.DisposableStore();
            templateData.disposables.push(disposables);
            const renderedComment = markdownRenderer_1.renderMarkdown(node.element.comment.body, {
                inline: true,
                actionHandler: {
                    callback: (content) => {
                        this.openerService.open(content).catch(errors_1.onUnexpectedError);
                    },
                    disposeables: disposables
                }
            });
            const images = renderedComment.getElementsByTagName('img');
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const textDescription = dom.$('');
                textDescription.textContent = image.alt ? nls.localize('imageWithLabel', "Image: {0}", image.alt) : nls.localize('image', "Image");
                image.parentNode.replaceChild(textDescription, image);
            }
            templateData.commentText.appendChild(renderedComment);
        }
        disposeTemplate(templateData) {
            templateData.disposables.forEach(disposeable => disposeable.dispose());
        }
    };
    CommentNodeRenderer = __decorate([
        __param(0, opener_1.IOpenerService)
    ], CommentNodeRenderer);
    exports.CommentNodeRenderer = CommentNodeRenderer;
    let CommentsList = class CommentsList extends listService_1.WorkbenchAsyncDataTree {
        constructor(labels, container, options, contextKeyService, listService, themeService, instantiationService, configurationService, keybindingService, accessibilityService) {
            const delegate = new CommentsModelVirualDelegate();
            const dataSource = new CommentsAsyncDataSource();
            const renderers = [
                instantiationService.createInstance(ResourceWithCommentsRenderer, labels),
                instantiationService.createInstance(CommentNodeRenderer)
            ];
            super('CommentsTree', container, delegate, renderers, dataSource, {
                accessibilityProvider: {
                    getAriaLabel(element) {
                        if (element instanceof commentModel_1.CommentsModel) {
                            return nls.localize('rootCommentsLabel', "Comments for current workspace");
                        }
                        if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                            return nls.localize('resourceWithCommentThreadsLabel', "Comments in {0}, full path {1}", resources_1.basename(element.resource), element.resource.fsPath);
                        }
                        if (element instanceof commentModel_1.CommentNode) {
                            return nls.localize('resourceWithCommentLabel', "Comment from ${0} at line {1} column {2} in {3}, source: {4}", element.comment.userName, element.range.startLineNumber, element.range.startColumn, resources_1.basename(element.resource), element.comment.body.value);
                        }
                        return '';
                    },
                    getWidgetAriaLabel() {
                        return exports.COMMENTS_VIEW_TITLE;
                    }
                },
                keyboardSupport: true,
                identityProvider: {
                    getId: (element) => {
                        if (element instanceof commentModel_1.CommentsModel) {
                            return 'root';
                        }
                        if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                            return `${element.owner}-${element.id}`;
                        }
                        if (element instanceof commentModel_1.CommentNode) {
                            return `${element.owner}-${element.resource.toString()}-${element.threadId}-${element.comment.uniqueIdInThread}` + (element.isRoot ? '-root' : '');
                        }
                        return '';
                    }
                },
                expandOnlyOnTwistieClick: (element) => {
                    if (element instanceof commentModel_1.CommentsModel || element instanceof commentModel_1.ResourceWithCommentThreads) {
                        return false;
                    }
                    return true;
                },
                collapseByDefault: () => {
                    return false;
                },
                overrideStyles: options.overrideStyles
            }, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService);
        }
    };
    CommentsList = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, listService_1.IListService),
        __param(5, themeService_1.IThemeService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, accessibility_1.IAccessibilityService)
    ], CommentsList);
    exports.CommentsList = CommentsList;
});
//# __sourceMappingURL=commentsTreeViewer.js.map