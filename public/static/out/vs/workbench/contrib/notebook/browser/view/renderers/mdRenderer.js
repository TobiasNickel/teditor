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
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/platform/opener/common/opener", "vs/editor/common/services/modeService", "vs/base/common/errors", "vs/editor/common/modes/textToHtmlTokenizer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/modes"], function (require, exports, markdownRenderer_1, opener_1, modeService_1, errors_1, textToHtmlTokenizer_1, event_1, lifecycle_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownRenderer = void 0;
    let MarkdownRenderer = class MarkdownRenderer extends lifecycle_1.Disposable {
        constructor(_baseUrl, _modeService, _openerService) {
            super();
            this._baseUrl = _baseUrl;
            this._modeService = _modeService;
            this._openerService = _openerService;
            this._onDidUpdateRender = this._register(new event_1.Emitter());
            this.onDidUpdateRender = this._onDidUpdateRender.event;
        }
        getOptions(disposeables) {
            return {
                baseUrl: this._baseUrl,
                codeBlockRenderer: (languageAlias, value) => {
                    // In markdown,
                    // it is possible that we stumble upon language aliases (e.g.js instead of javascript)
                    // it is possible no alias is given in which case we fall back to the current editor lang
                    let modeId = null;
                    modeId = this._modeService.getModeIdForLanguageName(languageAlias || '');
                    this._modeService.triggerMode(modeId || '');
                    return Promise.resolve(true).then(_ => {
                        const promise = modes_1.TokenizationRegistry.getPromise(modeId || '');
                        if (promise) {
                            return promise.then(support => textToHtmlTokenizer_1.tokenizeToString(value, support));
                        }
                        return textToHtmlTokenizer_1.tokenizeToString(value, undefined);
                    }).then(code => {
                        return `<span>${code}</span>`;
                    });
                },
                codeBlockRenderCallback: () => this._onDidUpdateRender.fire(),
                actionHandler: {
                    callback: (content) => {
                        this._openerService.open(content, { fromUserGesture: true }).catch(errors_1.onUnexpectedError);
                    },
                    disposeables
                }
            };
        }
        render(markdown) {
            const disposeables = new lifecycle_1.DisposableStore();
            let element;
            if (!markdown) {
                element = document.createElement('span');
            }
            else {
                element = markdownRenderer_1.renderMarkdown(markdown, this.getOptions(disposeables), { gfm: true });
            }
            return {
                element,
                dispose: () => disposeables.dispose()
            };
        }
    };
    MarkdownRenderer = __decorate([
        __param(1, modeService_1.IModeService),
        __param(2, opener_1.IOpenerService)
    ], MarkdownRenderer);
    exports.MarkdownRenderer = MarkdownRenderer;
});
//# __sourceMappingURL=mdRenderer.js.map