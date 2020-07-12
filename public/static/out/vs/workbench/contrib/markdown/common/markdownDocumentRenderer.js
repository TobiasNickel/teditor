/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/marked/marked", "vs/editor/common/modes/textToHtmlTokenizer", "vs/editor/common/modes"], function (require, exports, marked, textToHtmlTokenizer_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderMarkdownDocument = void 0;
    /**
     * Renders a string of markdown as a document.
     *
     * Uses VS Code's syntax highlighting code blocks.
     */
    async function renderMarkdownDocument(text, extensionService, modeService) {
        const renderer = await getRenderer(text, extensionService, modeService);
        return marked(text, { renderer });
    }
    exports.renderMarkdownDocument = renderMarkdownDocument;
    async function getRenderer(text, extensionService, modeService) {
        let result = [];
        const renderer = new marked.Renderer();
        renderer.code = (_code, lang) => {
            const modeId = modeService.getModeIdForLanguageName(lang);
            if (modeId) {
                result.push(extensionService.whenInstalledExtensionsRegistered().then(() => {
                    modeService.triggerMode(modeId);
                    return modes_1.TokenizationRegistry.getPromise(modeId);
                }));
            }
            return '';
        };
        marked(text, { renderer });
        await Promise.all(result);
        renderer.code = (code, lang) => {
            const modeId = modeService.getModeIdForLanguageName(lang);
            return `<code>${textToHtmlTokenizer_1.tokenizeToString(code, modeId ? modes_1.TokenizationRegistry.get(modeId) : undefined)}</code>`;
        };
        return renderer;
    }
});
//# __sourceMappingURL=markdownDocumentRenderer.js.map