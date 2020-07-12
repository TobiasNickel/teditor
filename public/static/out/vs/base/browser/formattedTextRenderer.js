/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, DOM) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createElement = exports.renderFormattedText = exports.renderText = void 0;
    function renderText(text, options = {}) {
        const element = createElement(options);
        element.textContent = text;
        return element;
    }
    exports.renderText = renderText;
    function renderFormattedText(formattedText, options = {}) {
        const element = createElement(options);
        _renderFormattedText(element, parseFormattedText(formattedText), options.actionHandler);
        return element;
    }
    exports.renderFormattedText = renderFormattedText;
    function createElement(options) {
        const tagName = options.inline ? 'span' : 'div';
        const element = document.createElement(tagName);
        if (options.className) {
            element.className = options.className;
        }
        return element;
    }
    exports.createElement = createElement;
    class StringStream {
        constructor(source) {
            this.source = source;
            this.index = 0;
        }
        eos() {
            return this.index >= this.source.length;
        }
        next() {
            const next = this.peek();
            this.advance();
            return next;
        }
        peek() {
            return this.source[this.index];
        }
        advance() {
            this.index++;
        }
    }
    var FormatType;
    (function (FormatType) {
        FormatType[FormatType["Invalid"] = 0] = "Invalid";
        FormatType[FormatType["Root"] = 1] = "Root";
        FormatType[FormatType["Text"] = 2] = "Text";
        FormatType[FormatType["Bold"] = 3] = "Bold";
        FormatType[FormatType["Italics"] = 4] = "Italics";
        FormatType[FormatType["Action"] = 5] = "Action";
        FormatType[FormatType["ActionClose"] = 6] = "ActionClose";
        FormatType[FormatType["NewLine"] = 7] = "NewLine";
    })(FormatType || (FormatType = {}));
    function _renderFormattedText(element, treeNode, actionHandler) {
        let child;
        if (treeNode.type === 2 /* Text */) {
            child = document.createTextNode(treeNode.content || '');
        }
        else if (treeNode.type === 3 /* Bold */) {
            child = document.createElement('b');
        }
        else if (treeNode.type === 4 /* Italics */) {
            child = document.createElement('i');
        }
        else if (treeNode.type === 5 /* Action */ && actionHandler) {
            const a = document.createElement('a');
            a.href = '#';
            actionHandler.disposeables.add(DOM.addStandardDisposableListener(a, 'click', (event) => {
                actionHandler.callback(String(treeNode.index), event);
            }));
            child = a;
        }
        else if (treeNode.type === 7 /* NewLine */) {
            child = document.createElement('br');
        }
        else if (treeNode.type === 1 /* Root */) {
            child = element;
        }
        if (child && element !== child) {
            element.appendChild(child);
        }
        if (child && Array.isArray(treeNode.children)) {
            treeNode.children.forEach((nodeChild) => {
                _renderFormattedText(child, nodeChild, actionHandler);
            });
        }
    }
    function parseFormattedText(content) {
        const root = {
            type: 1 /* Root */,
            children: []
        };
        let actionViewItemIndex = 0;
        let current = root;
        const stack = [];
        const stream = new StringStream(content);
        while (!stream.eos()) {
            let next = stream.next();
            const isEscapedFormatType = (next === '\\' && formatTagType(stream.peek()) !== 0 /* Invalid */);
            if (isEscapedFormatType) {
                next = stream.next(); // unread the backslash if it escapes a format tag type
            }
            if (!isEscapedFormatType && isFormatTag(next) && next === stream.peek()) {
                stream.advance();
                if (current.type === 2 /* Text */) {
                    current = stack.pop();
                }
                const type = formatTagType(next);
                if (current.type === type || (current.type === 5 /* Action */ && type === 6 /* ActionClose */)) {
                    current = stack.pop();
                }
                else {
                    const newCurrent = {
                        type: type,
                        children: []
                    };
                    if (type === 5 /* Action */) {
                        newCurrent.index = actionViewItemIndex;
                        actionViewItemIndex++;
                    }
                    current.children.push(newCurrent);
                    stack.push(current);
                    current = newCurrent;
                }
            }
            else if (next === '\n') {
                if (current.type === 2 /* Text */) {
                    current = stack.pop();
                }
                current.children.push({
                    type: 7 /* NewLine */
                });
            }
            else {
                if (current.type !== 2 /* Text */) {
                    const textCurrent = {
                        type: 2 /* Text */,
                        content: next
                    };
                    current.children.push(textCurrent);
                    stack.push(current);
                    current = textCurrent;
                }
                else {
                    current.content += next;
                }
            }
        }
        if (current.type === 2 /* Text */) {
            current = stack.pop();
        }
        if (stack.length) {
            // incorrectly formatted string literal
        }
        return root;
    }
    function isFormatTag(char) {
        return formatTagType(char) !== 0 /* Invalid */;
    }
    function formatTagType(char) {
        switch (char) {
            case '*':
                return 3 /* Bold */;
            case '_':
                return 4 /* Italics */;
            case '[':
                return 5 /* Action */;
            case ']':
                return 6 /* ActionClose */;
            default:
                return 0 /* Invalid */;
        }
    }
});
//# __sourceMappingURL=formattedTextRenderer.js.map