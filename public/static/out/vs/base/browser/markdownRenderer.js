/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/formattedTextRenderer", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/idGenerator", "vs/base/common/marked/marked", "vs/base/common/insane/insane", "vs/base/common/marshalling", "vs/base/common/objects", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/codicons", "vs/base/common/resources"], function (require, exports, DOM, formattedTextRenderer_1, errors_1, htmlContent_1, idGenerator_1, marked, insane_1, marshalling_1, objects_1, strings_1, uri_1, network_1, codicons_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderMarkdown = void 0;
    /**
     * Create html nodes for the given content element.
     */
    function renderMarkdown(markdown, options = {}, markedOptions = {}) {
        const element = formattedTextRenderer_1.createElement(options);
        const _uriMassage = function (part) {
            let data;
            try {
                data = marshalling_1.parse(decodeURIComponent(part));
            }
            catch (e) {
                // ignore
            }
            if (!data) {
                return part;
            }
            data = objects_1.cloneAndChange(data, value => {
                if (markdown.uris && markdown.uris[value]) {
                    return uri_1.URI.revive(markdown.uris[value]);
                }
                else {
                    return undefined;
                }
            });
            return encodeURIComponent(JSON.stringify(data));
        };
        const _href = function (href, isDomUri) {
            const data = markdown.uris && markdown.uris[href];
            if (!data) {
                return href; // no uri exists
            }
            let uri = uri_1.URI.revive(data);
            if (uri_1.URI.parse(href).toString() === uri.toString()) {
                return href; // no tranformation performed
            }
            if (isDomUri) {
                // this URI will end up as "src"-attribute of a dom node
                // and because of that special rewriting needs to be done
                // so that the URI uses a protocol that's understood by
                // browsers (like http or https)
                return DOM.asDomUri(uri).toString(true);
            }
            if (uri.query) {
                uri = uri.with({ query: _uriMassage(uri.query) });
            }
            return uri.toString();
        };
        // signal to code-block render that the
        // element has been created
        let signalInnerHTML;
        const withInnerHTML = new Promise(c => signalInnerHTML = c);
        const renderer = new marked.Renderer();
        renderer.image = (href, title, text) => {
            let dimensions = [];
            let attributes = [];
            if (href) {
                ({ href, dimensions } = htmlContent_1.parseHrefAndDimensions(href));
                href = _href(href, true);
                try {
                    const hrefAsUri = uri_1.URI.parse(href);
                    if (options.baseUrl && hrefAsUri.scheme === network_1.Schemas.file) { // absolute or relative local path, or file: uri
                        href = resources_1.resolvePath(options.baseUrl, href).toString();
                    }
                }
                catch (err) { }
                attributes.push(`src="${href}"`);
            }
            if (text) {
                attributes.push(`alt="${text}"`);
            }
            if (title) {
                attributes.push(`title="${title}"`);
            }
            if (dimensions.length) {
                attributes = attributes.concat(dimensions);
            }
            return '<img ' + attributes.join(' ') + '>';
        };
        renderer.link = (href, title, text) => {
            // Remove markdown escapes. Workaround for https://github.com/chjj/marked/issues/829
            if (href === text) { // raw link case
                text = htmlContent_1.removeMarkdownEscapes(text);
            }
            href = _href(href, false);
            if (options.baseUrl) {
                const hasScheme = /^\w[\w\d+.-]*:/.test(href);
                if (!hasScheme) {
                    href = resources_1.resolvePath(options.baseUrl, href).toString();
                }
            }
            title = htmlContent_1.removeMarkdownEscapes(title);
            href = htmlContent_1.removeMarkdownEscapes(href);
            if (!href
                || href.match(/^data:|javascript:/i)
                || (href.match(/^command:/i) && !markdown.isTrusted)
                || href.match(/^command:(\/\/\/)?_workbench\.downloadResource/i)) {
                // drop the link
                return text;
            }
            else {
                // HTML Encode href
                href = href.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<a href="#" data-href="${href}" title="${title || href}">${text}</a>`;
            }
        };
        renderer.paragraph = (text) => {
            return `<p>${markdown.supportThemeIcons ? codicons_1.renderCodicons(text) : text}</p>`;
        };
        if (options.codeBlockRenderer) {
            renderer.code = (code, lang) => {
                const value = options.codeBlockRenderer(lang, code);
                // when code-block rendering is async we return sync
                // but update the node with the real result later.
                const id = idGenerator_1.defaultGenerator.nextId();
                const promise = Promise.all([value, withInnerHTML]).then(values => {
                    const strValue = values[0];
                    const span = element.querySelector(`div[data-code="${id}"]`);
                    if (span) {
                        span.innerHTML = strValue;
                    }
                }).catch(err => {
                    // ignore
                });
                if (options.codeBlockRenderCallback) {
                    promise.then(options.codeBlockRenderCallback);
                }
                return `<div class="code" data-code="${id}">${strings_1.escape(code)}</div>`;
            };
        }
        const actionHandler = options.actionHandler;
        if (actionHandler) {
            actionHandler.disposeables.add(DOM.addStandardDisposableListener(element, 'click', event => {
                let target = event.target;
                if (target.tagName !== 'A') {
                    target = target.parentElement;
                    if (!target || target.tagName !== 'A') {
                        return;
                    }
                }
                try {
                    const href = target.dataset['href'];
                    if (href) {
                        actionHandler.callback(href, event);
                    }
                }
                catch (err) {
                    errors_1.onUnexpectedError(err);
                }
                finally {
                    event.preventDefault();
                }
            }));
        }
        // Use our own sanitizer so that we can let through only spans.
        // Otherwise, we'd be letting all html be rendered.
        // If we want to allow markdown permitted tags, then we can delete sanitizer and sanitize.
        markedOptions.sanitizer = (html) => {
            const match = markdown.isTrusted ? html.match(/^(<span[^<]+>)|(<\/\s*span>)$/) : undefined;
            return match ? html : '';
        };
        markedOptions.sanitize = true;
        markedOptions.renderer = renderer;
        const allowedSchemes = [network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.mailto, network_1.Schemas.data, network_1.Schemas.file, network_1.Schemas.vscodeRemote, network_1.Schemas.vscodeRemoteResource];
        if (markdown.isTrusted) {
            allowedSchemes.push(network_1.Schemas.command);
        }
        const renderedMarkdown = marked.parse(markdown.supportThemeIcons
            ? codicons_1.markdownEscapeEscapedCodicons(markdown.value || '')
            : (markdown.value || ''), markedOptions);
        function filter(token) {
            if (token.tag === 'span' && markdown.isTrusted && (Object.keys(token.attrs).length === 1)) {
                if (token.attrs['style']) {
                    return !!token.attrs['style'].match(/^(color\:#[0-9a-fA-F]+;)?(background-color\:#[0-9a-fA-F]+;)?$/);
                }
                else if (token.attrs['class']) {
                    // The class should match codicon rendering in src\vs\base\common\codicons.ts
                    return !!token.attrs['class'].match(/^codicon codicon-[a-z\-]+( codicon-animation-[a-z\-]+)?$/);
                }
                return false;
            }
            return true;
        }
        element.innerHTML = insane_1.insane(renderedMarkdown, {
            allowedSchemes,
            // allowedTags should included everything that markdown renders to.
            // Since we have our own sanitize function for marked, it's possible we missed some tag so let insane make sure.
            // HTML tags that can result from markdown are from reading https://spec.commonmark.org/0.29/
            // HTML table tags that can result from markdown are from https://github.github.com/gfm/#tables-extension-
            allowedTags: ['ul', 'li', 'p', 'code', 'blockquote', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'em', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'del', 'a', 'strong', 'br', 'img', 'span'],
            allowedAttributes: {
                'a': ['href', 'name', 'target', 'data-href'],
                'img': ['src', 'title', 'alt', 'width', 'height'],
                'div': ['class', 'data-code'],
                'span': ['class', 'style'],
                // https://github.com/microsoft/vscode/issues/95937
                'th': ['align'],
                'td': ['align']
            },
            filter
        });
        signalInnerHTML();
        return element;
    }
    exports.renderMarkdown = renderMarkdown;
});
//# __sourceMappingURL=markdownRenderer.js.map