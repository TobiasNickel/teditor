/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/lifecycle", "vs/base/common/range", "vs/base/common/objects", "vs/css!./iconlabel"], function (require, exports, dom, highlightedLabel_1, lifecycle_1, range_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IconLabel = void 0;
    class FastLabelNode {
        constructor(_element) {
            this._element = _element;
        }
        get element() {
            return this._element;
        }
        set textContent(content) {
            if (this.disposed || content === this._textContent) {
                return;
            }
            this._textContent = content;
            this._element.textContent = content;
        }
        set className(className) {
            if (this.disposed || className === this._className) {
                return;
            }
            this._className = className;
            this._element.className = className;
        }
        set title(title) {
            if (this.disposed || title === this._title) {
                return;
            }
            this._title = title;
            if (this._title) {
                this._element.title = title;
            }
            else {
                this._element.removeAttribute('title');
            }
        }
        set empty(empty) {
            if (this.disposed || empty === this._empty) {
                return;
            }
            this._empty = empty;
            this._element.style.marginLeft = empty ? '0' : '';
        }
        dispose() {
            this.disposed = true;
        }
    }
    class IconLabel extends lifecycle_1.Disposable {
        constructor(container, options) {
            super();
            this.domNode = this._register(new FastLabelNode(dom.append(container, dom.$('.monaco-icon-label'))));
            const labelContainer = dom.append(this.domNode.element, dom.$('.monaco-icon-label-container'));
            const nameContainer = dom.append(labelContainer, dom.$('span.monaco-icon-name-container'));
            this.descriptionContainer = this._register(new FastLabelNode(dom.append(labelContainer, dom.$('span.monaco-icon-description-container'))));
            if (options === null || options === void 0 ? void 0 : options.supportHighlights) {
                this.nameNode = new LabelWithHighlights(nameContainer, !!options.supportCodicons);
            }
            else {
                this.nameNode = new Label(nameContainer);
            }
            if (options === null || options === void 0 ? void 0 : options.supportDescriptionHighlights) {
                this.descriptionNodeFactory = () => new highlightedLabel_1.HighlightedLabel(dom.append(this.descriptionContainer.element, dom.$('span.label-description')), !!options.supportCodicons);
            }
            else {
                this.descriptionNodeFactory = () => this._register(new FastLabelNode(dom.append(this.descriptionContainer.element, dom.$('span.label-description'))));
            }
        }
        get element() {
            return this.domNode.element;
        }
        setLabel(label, description, options) {
            const classes = ['monaco-icon-label'];
            if (options) {
                if (options.extraClasses) {
                    classes.push(...options.extraClasses);
                }
                if (options.italic) {
                    classes.push('italic');
                }
                if (options.strikethrough) {
                    classes.push('strikethrough');
                }
            }
            this.domNode.className = classes.join(' ');
            this.domNode.title = (options === null || options === void 0 ? void 0 : options.title) || '';
            this.nameNode.setLabel(label, options);
            if (description || this.descriptionNode) {
                if (!this.descriptionNode) {
                    this.descriptionNode = this.descriptionNodeFactory(); // description node is created lazily on demand
                }
                if (this.descriptionNode instanceof highlightedLabel_1.HighlightedLabel) {
                    this.descriptionNode.set(description || '', options ? options.descriptionMatches : undefined);
                    if (options === null || options === void 0 ? void 0 : options.descriptionTitle) {
                        this.descriptionNode.element.title = options.descriptionTitle;
                    }
                    else {
                        this.descriptionNode.element.removeAttribute('title');
                    }
                }
                else {
                    this.descriptionNode.textContent = description || '';
                    this.descriptionNode.title = (options === null || options === void 0 ? void 0 : options.descriptionTitle) || '';
                    this.descriptionNode.empty = !description;
                }
            }
        }
    }
    exports.IconLabel = IconLabel;
    class Label {
        constructor(container) {
            this.container = container;
            this.label = undefined;
            this.singleLabel = undefined;
        }
        setLabel(label, options) {
            if (this.label === label && objects_1.equals(this.options, options)) {
                return;
            }
            this.label = label;
            this.options = options;
            if (typeof label === 'string') {
                if (!this.singleLabel) {
                    this.container.innerHTML = '';
                    dom.removeClass(this.container, 'multiple');
                    this.singleLabel = dom.append(this.container, dom.$('a.label-name', { id: options === null || options === void 0 ? void 0 : options.domId }));
                }
                this.singleLabel.textContent = label;
            }
            else {
                this.container.innerHTML = '';
                dom.addClass(this.container, 'multiple');
                this.singleLabel = undefined;
                for (let i = 0; i < label.length; i++) {
                    const l = label[i];
                    const id = (options === null || options === void 0 ? void 0 : options.domId) && `${options === null || options === void 0 ? void 0 : options.domId}_${i}`;
                    dom.append(this.container, dom.$('a.label-name', { id, 'data-icon-label-count': label.length, 'data-icon-label-index': i, 'role': 'treeitem' }, l));
                    if (i < label.length - 1) {
                        dom.append(this.container, dom.$('span.label-separator', undefined, (options === null || options === void 0 ? void 0 : options.separator) || '/'));
                    }
                }
            }
        }
    }
    function splitMatches(labels, separator, matches) {
        if (!matches) {
            return undefined;
        }
        let labelStart = 0;
        return labels.map(label => {
            const labelRange = { start: labelStart, end: labelStart + label.length };
            const result = matches
                .map(match => range_1.Range.intersect(labelRange, match))
                .filter(range => !range_1.Range.isEmpty(range))
                .map(({ start, end }) => ({ start: start - labelStart, end: end - labelStart }));
            labelStart = labelRange.end + separator.length;
            return result;
        });
    }
    class LabelWithHighlights {
        constructor(container, supportCodicons) {
            this.container = container;
            this.supportCodicons = supportCodicons;
            this.label = undefined;
            this.singleLabel = undefined;
        }
        setLabel(label, options) {
            if (this.label === label && objects_1.equals(this.options, options)) {
                return;
            }
            this.label = label;
            this.options = options;
            if (typeof label === 'string') {
                if (!this.singleLabel) {
                    this.container.innerHTML = '';
                    dom.removeClass(this.container, 'multiple');
                    this.singleLabel = new highlightedLabel_1.HighlightedLabel(dom.append(this.container, dom.$('a.label-name', { id: options === null || options === void 0 ? void 0 : options.domId })), this.supportCodicons);
                }
                this.singleLabel.set(label, options === null || options === void 0 ? void 0 : options.matches, options === null || options === void 0 ? void 0 : options.title, options === null || options === void 0 ? void 0 : options.labelEscapeNewLines);
            }
            else {
                this.container.innerHTML = '';
                dom.addClass(this.container, 'multiple');
                this.singleLabel = undefined;
                const separator = (options === null || options === void 0 ? void 0 : options.separator) || '/';
                const matches = splitMatches(label, separator, options === null || options === void 0 ? void 0 : options.matches);
                for (let i = 0; i < label.length; i++) {
                    const l = label[i];
                    const m = matches ? matches[i] : undefined;
                    const id = (options === null || options === void 0 ? void 0 : options.domId) && `${options === null || options === void 0 ? void 0 : options.domId}_${i}`;
                    const name = dom.$('a.label-name', { id, 'data-icon-label-count': label.length, 'data-icon-label-index': i, 'role': 'treeitem' });
                    const highlightedLabel = new highlightedLabel_1.HighlightedLabel(dom.append(this.container, name), this.supportCodicons);
                    highlightedLabel.set(l, m, options === null || options === void 0 ? void 0 : options.title, options === null || options === void 0 ? void 0 : options.labelEscapeNewLines);
                    if (i < label.length - 1) {
                        dom.append(name, dom.$('span.label-separator', undefined, separator));
                    }
                }
            }
        }
    }
});
//# __sourceMappingURL=iconLabel.js.map