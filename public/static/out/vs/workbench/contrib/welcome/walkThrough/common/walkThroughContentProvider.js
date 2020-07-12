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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/base/common/marked/marked", "vs/base/common/network", "vs/editor/common/core/range", "vs/editor/common/model/textModel"], function (require, exports, resolverService_1, modelService_1, modeService_1, marked, network_1, range_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughSnippetContentProvider = exports.WalkThroughContentProvider = void 0;
    function requireToContent(resource) {
        if (!resource.query) {
            throw new Error('Welcome: invalid resource');
        }
        const query = JSON.parse(resource.query);
        if (!query.moduleId) {
            throw new Error('Welcome: invalid resource');
        }
        const content = new Promise((resolve, reject) => {
            require([query.moduleId], content => {
                try {
                    resolve(content.default());
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        return content;
    }
    let WalkThroughContentProvider = class WalkThroughContentProvider {
        constructor(textModelResolverService, modeService, modelService) {
            this.textModelResolverService = textModelResolverService;
            this.modeService = modeService;
            this.modelService = modelService;
            this.textModelResolverService.registerTextModelContentProvider(network_1.Schemas.walkThrough, this);
        }
        async provideTextContent(resource) {
            const content = await requireToContent(resource);
            let codeEditorModel = this.modelService.getModel(resource);
            if (!codeEditorModel) {
                codeEditorModel = this.modelService.createModel(content, this.modeService.createByFilepathOrFirstLine(resource), resource);
            }
            else {
                this.modelService.updateModel(codeEditorModel, content);
            }
            return codeEditorModel;
        }
    };
    WalkThroughContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, modeService_1.IModeService),
        __param(2, modelService_1.IModelService)
    ], WalkThroughContentProvider);
    exports.WalkThroughContentProvider = WalkThroughContentProvider;
    let WalkThroughSnippetContentProvider = class WalkThroughSnippetContentProvider {
        constructor(textModelResolverService, modeService, modelService) {
            this.textModelResolverService = textModelResolverService;
            this.modeService = modeService;
            this.modelService = modelService;
            this.textModelResolverService.registerTextModelContentProvider(network_1.Schemas.walkThroughSnippet, this);
        }
        async provideTextContent(resource) {
            const factory = textModel_1.createTextBufferFactory(await requireToContent(resource));
            let codeEditorModel = this.modelService.getModel(resource);
            if (!codeEditorModel) {
                const j = parseInt(resource.fragment);
                let codeSnippet = '';
                let languageName = '';
                let i = 0;
                const renderer = new marked.Renderer();
                renderer.code = (code, lang) => {
                    if (i++ === j) {
                        codeSnippet = code;
                        languageName = lang;
                    }
                    return '';
                };
                const textBuffer = factory.create(1 /* LF */);
                const lineCount = textBuffer.getLineCount();
                const range = new range_1.Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
                const markdown = textBuffer.getValueInRange(range, 0 /* TextDefined */);
                marked(markdown, { renderer });
                const languageId = this.modeService.getModeIdForLanguageName(languageName) || '';
                const languageSelection = this.modeService.create(languageId);
                codeEditorModel = this.modelService.createModel(codeSnippet, languageSelection, resource);
            }
            else {
                this.modelService.updateModel(codeEditorModel, factory);
            }
            return codeEditorModel;
        }
    };
    WalkThroughSnippetContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, modeService_1.IModeService),
        __param(2, modelService_1.IModelService)
    ], WalkThroughSnippetContentProvider);
    exports.WalkThroughSnippetContentProvider = WalkThroughSnippetContentProvider;
});
//# __sourceMappingURL=walkThroughContentProvider.js.map