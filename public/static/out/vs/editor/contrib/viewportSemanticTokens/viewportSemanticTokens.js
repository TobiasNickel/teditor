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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/editor/common/services/semanticTokensProviderStyling", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/editor/common/services/modelServiceImpl"], function (require, exports, async_1, lifecycle_1, editorExtensions_1, modes_1, modelService_1, semanticTokensProviderStyling_1, themeService_1, configuration_1, modelServiceImpl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ViewportSemanticTokensContribution = class ViewportSemanticTokensContribution extends lifecycle_1.Disposable {
        constructor(editor, _modelService, _themeService, _configurationService) {
            super();
            this._modelService = _modelService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._editor = editor;
            this._tokenizeViewport = new async_1.RunOnceScheduler(() => this._tokenizeViewportNow(), 100);
            this._outstandingRequests = [];
            this._register(this._editor.onDidScrollChange(() => {
                this._tokenizeViewport.schedule();
            }));
            this._register(this._editor.onDidChangeModel(() => {
                this._cancelAll();
                this._tokenizeViewport.schedule();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                this._cancelAll();
                this._tokenizeViewport.schedule();
            }));
            this._register(modes_1.DocumentRangeSemanticTokensProviderRegistry.onDidChange(() => {
                this._cancelAll();
                this._tokenizeViewport.schedule();
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(modelServiceImpl_1.SEMANTIC_HIGHLIGHTING_SETTING_ID)) {
                    this._cancelAll();
                    this._tokenizeViewport.schedule();
                }
            }));
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._cancelAll();
                this._tokenizeViewport.schedule();
            }));
        }
        static get(editor) {
            return editor.getContribution(ViewportSemanticTokensContribution.ID);
        }
        static _getSemanticColoringProvider(model) {
            const result = modes_1.DocumentRangeSemanticTokensProviderRegistry.ordered(model);
            return (result.length > 0 ? result[0] : null);
        }
        _cancelAll() {
            for (const request of this._outstandingRequests) {
                request.cancel();
            }
            this._outstandingRequests = [];
        }
        _removeOutstandingRequest(req) {
            for (let i = 0, len = this._outstandingRequests.length; i < len; i++) {
                if (this._outstandingRequests[i] === req) {
                    this._outstandingRequests.splice(i, 1);
                    return;
                }
            }
        }
        _tokenizeViewportNow() {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            if (model.hasSemanticTokens()) {
                return;
            }
            if (!modelServiceImpl_1.isSemanticColoringEnabled(model, this._themeService, this._configurationService)) {
                return;
            }
            const provider = ViewportSemanticTokensContribution._getSemanticColoringProvider(model);
            if (!provider) {
                return;
            }
            const styling = this._modelService.getSemanticTokensProviderStyling(provider);
            const visibleRanges = this._editor.getVisibleRangesPlusViewportAboveBelow();
            this._outstandingRequests = this._outstandingRequests.concat(visibleRanges.map(range => this._requestRange(model, range, provider, styling)));
        }
        _requestRange(model, range, provider, styling) {
            const requestVersionId = model.getVersionId();
            const request = async_1.createCancelablePromise(token => Promise.resolve(provider.provideDocumentRangeSemanticTokens(model, range, token)));
            request.then((r) => {
                if (!r || model.isDisposed() || model.getVersionId() !== requestVersionId) {
                    return;
                }
                model.setPartialSemanticTokens(range, semanticTokensProviderStyling_1.toMultilineTokens2(r, styling, model.getLanguageIdentifier()));
            }).then(() => this._removeOutstandingRequest(request), () => this._removeOutstandingRequest(request));
            return request;
        }
    };
    ViewportSemanticTokensContribution.ID = 'editor.contrib.viewportSemanticTokens';
    ViewportSemanticTokensContribution = __decorate([
        __param(1, modelService_1.IModelService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService)
    ], ViewportSemanticTokensContribution);
    editorExtensions_1.registerEditorContribution(ViewportSemanticTokensContribution.ID, ViewportSemanticTokensContribution);
});
//# __sourceMappingURL=viewportSemanticTokens.js.map