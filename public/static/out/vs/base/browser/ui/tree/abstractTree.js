/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/ui/list/listWidget", "vs/base/browser/dom", "vs/base/common/event", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/tree/tree", "vs/base/browser/dnd", "vs/base/common/arrays", "vs/base/browser/ui/list/listView", "vs/base/browser/event", "vs/base/common/filters", "vs/base/browser/ui/tree/indexTreeModel", "vs/nls", "vs/base/common/async", "vs/base/common/platform", "vs/base/common/numbers", "vs/base/common/collections", "vs/base/browser/ui/tree/treeIcons", "vs/css!./media/tree"], function (require, exports, lifecycle_1, listWidget_1, dom_1, event_1, keyboardEvent_1, tree_1, dnd_1, arrays_1, listView_1, event_2, filters_1, indexTreeModel_1, nls_1, async_1, platform_1, numbers_1, collections_1, treeIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTree = exports.RenderIndentGuides = exports.ComposedTreeDelegate = void 0;
    class TreeElementsDragAndDropData extends listView_1.ElementsDragAndDropData {
        constructor(data) {
            super(data.elements.map(node => node.element));
            this.data = data;
        }
        set context(context) {
            this.data.context = context;
        }
        get context() {
            return this.data.context;
        }
    }
    function asTreeDragAndDropData(data) {
        if (data instanceof listView_1.ElementsDragAndDropData) {
            return new TreeElementsDragAndDropData(data);
        }
        return data;
    }
    class TreeNodeListDragAndDrop {
        constructor(modelProvider, dnd) {
            this.modelProvider = modelProvider;
            this.dnd = dnd;
            this.autoExpandDisposable = lifecycle_1.Disposable.None;
        }
        getDragURI(node) {
            return this.dnd.getDragURI(node.element);
        }
        getDragLabel(nodes, originalEvent) {
            if (this.dnd.getDragLabel) {
                return this.dnd.getDragLabel(nodes.map(node => node.element), originalEvent);
            }
            return undefined;
        }
        onDragStart(data, originalEvent) {
            if (this.dnd.onDragStart) {
                this.dnd.onDragStart(asTreeDragAndDropData(data), originalEvent);
            }
        }
        onDragOver(data, targetNode, targetIndex, originalEvent, raw = true) {
            const result = this.dnd.onDragOver(asTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, originalEvent);
            const didChangeAutoExpandNode = this.autoExpandNode !== targetNode;
            if (didChangeAutoExpandNode) {
                this.autoExpandDisposable.dispose();
                this.autoExpandNode = targetNode;
            }
            if (typeof targetNode === 'undefined') {
                return result;
            }
            if (didChangeAutoExpandNode && typeof result !== 'boolean' && result.autoExpand) {
                this.autoExpandDisposable = async_1.disposableTimeout(() => {
                    const model = this.modelProvider();
                    const ref = model.getNodeLocation(targetNode);
                    if (model.isCollapsed(ref)) {
                        model.setCollapsed(ref, false);
                    }
                    this.autoExpandNode = undefined;
                }, 500);
            }
            if (typeof result === 'boolean' || !result.accept || typeof result.bubble === 'undefined' || result.feedback) {
                if (!raw) {
                    const accept = typeof result === 'boolean' ? result : result.accept;
                    const effect = typeof result === 'boolean' ? undefined : result.effect;
                    return { accept, effect, feedback: [targetIndex] };
                }
                return result;
            }
            if (result.bubble === 1 /* Up */) {
                const model = this.modelProvider();
                const ref = model.getNodeLocation(targetNode);
                const parentRef = model.getParentNodeLocation(ref);
                const parentNode = model.getNode(parentRef);
                const parentIndex = parentRef && model.getListIndex(parentRef);
                return this.onDragOver(data, parentNode, parentIndex, originalEvent, false);
            }
            const model = this.modelProvider();
            const ref = model.getNodeLocation(targetNode);
            const start = model.getListIndex(ref);
            const length = model.getListRenderCount(ref);
            return Object.assign(Object.assign({}, result), { feedback: arrays_1.range(start, start + length) });
        }
        drop(data, targetNode, targetIndex, originalEvent) {
            this.autoExpandDisposable.dispose();
            this.autoExpandNode = undefined;
            this.dnd.drop(asTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, originalEvent);
        }
        onDragEnd(originalEvent) {
            if (this.dnd.onDragEnd) {
                this.dnd.onDragEnd(originalEvent);
            }
        }
    }
    function asListOptions(modelProvider, options) {
        return options && Object.assign(Object.assign({}, options), { identityProvider: options.identityProvider && {
                getId(el) {
                    return options.identityProvider.getId(el.element);
                }
            }, dnd: options.dnd && new TreeNodeListDragAndDrop(modelProvider, options.dnd), multipleSelectionController: options.multipleSelectionController && {
                isSelectionSingleChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionSingleChangeEvent(Object.assign(Object.assign({}, e), { element: e.element }));
                },
                isSelectionRangeChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionRangeChangeEvent(Object.assign(Object.assign({}, e), { element: e.element }));
                }
            }, accessibilityProvider: options.accessibilityProvider && Object.assign(Object.assign({}, options.accessibilityProvider), { getSetSize(node) {
                    const model = modelProvider();
                    const ref = model.getNodeLocation(node);
                    const parentRef = model.getParentNodeLocation(ref);
                    const parentNode = model.getNode(parentRef);
                    return parentNode.visibleChildrenCount;
                },
                getPosInSet(node) {
                    return node.visibleChildIndex + 1;
                }, isChecked: options.accessibilityProvider && options.accessibilityProvider.isChecked ? (node) => {
                    return options.accessibilityProvider.isChecked(node.element);
                } : undefined, getRole: options.accessibilityProvider && options.accessibilityProvider.getRole ? (node) => {
                    return options.accessibilityProvider.getRole(node.element);
                } : () => 'treeitem', getAriaLabel(e) {
                    return options.accessibilityProvider.getAriaLabel(e.element);
                },
                getWidgetAriaLabel() {
                    return options.accessibilityProvider.getWidgetAriaLabel();
                }, getWidgetRole: options.accessibilityProvider && options.accessibilityProvider.getWidgetRole ? () => options.accessibilityProvider.getWidgetRole() : () => 'tree', getAriaLevel(node) {
                    return node.depth;
                }, getActiveDescendantId: options.accessibilityProvider.getActiveDescendantId && (node => {
                    return options.accessibilityProvider.getActiveDescendantId(node.element);
                }) }), keyboardNavigationLabelProvider: options.keyboardNavigationLabelProvider && Object.assign(Object.assign({}, options.keyboardNavigationLabelProvider), { getKeyboardNavigationLabel(node) {
                    return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(node.element);
                } }), enableKeyboardNavigation: options.simpleKeyboardNavigation });
    }
    class ComposedTreeDelegate {
        constructor(delegate) {
            this.delegate = delegate;
        }
        getHeight(element) {
            return this.delegate.getHeight(element.element);
        }
        getTemplateId(element) {
            return this.delegate.getTemplateId(element.element);
        }
        hasDynamicHeight(element) {
            return !!this.delegate.hasDynamicHeight && this.delegate.hasDynamicHeight(element.element);
        }
        setDynamicHeight(element, height) {
            if (this.delegate.setDynamicHeight) {
                this.delegate.setDynamicHeight(element.element, height);
            }
        }
    }
    exports.ComposedTreeDelegate = ComposedTreeDelegate;
    var RenderIndentGuides;
    (function (RenderIndentGuides) {
        RenderIndentGuides["None"] = "none";
        RenderIndentGuides["OnHover"] = "onHover";
        RenderIndentGuides["Always"] = "always";
    })(RenderIndentGuides = exports.RenderIndentGuides || (exports.RenderIndentGuides = {}));
    class EventCollection {
        constructor(onDidChange, _elements = []) {
            this._elements = _elements;
            this.onDidChange = event_1.Event.forEach(onDidChange, elements => this._elements = elements);
        }
        get elements() {
            return this._elements;
        }
    }
    class TreeRenderer {
        constructor(renderer, modelProvider, onDidChangeCollapseState, activeNodes, options = {}) {
            this.renderer = renderer;
            this.modelProvider = modelProvider;
            this.activeNodes = activeNodes;
            this.renderedElements = new Map();
            this.renderedNodes = new Map();
            this.indent = TreeRenderer.DefaultIndent;
            this.hideTwistiesOfChildlessElements = false;
            this.shouldRenderIndentGuides = false;
            this.renderedIndentGuides = new collections_1.SetMap();
            this.activeIndentNodes = new Set();
            this.indentGuidesDisposable = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this.templateId = renderer.templateId;
            this.updateOptions(options);
            event_1.Event.map(onDidChangeCollapseState, e => e.node)(this.onDidChangeNodeTwistieState, this, this.disposables);
            if (renderer.onDidChangeTwistieState) {
                renderer.onDidChangeTwistieState(this.onDidChangeTwistieState, this, this.disposables);
            }
        }
        updateOptions(options = {}) {
            if (typeof options.indent !== 'undefined') {
                this.indent = numbers_1.clamp(options.indent, 0, 40);
            }
            if (typeof options.renderIndentGuides !== 'undefined') {
                const shouldRenderIndentGuides = options.renderIndentGuides !== RenderIndentGuides.None;
                if (shouldRenderIndentGuides !== this.shouldRenderIndentGuides) {
                    this.shouldRenderIndentGuides = shouldRenderIndentGuides;
                    this.indentGuidesDisposable.dispose();
                    if (shouldRenderIndentGuides) {
                        const disposables = new lifecycle_1.DisposableStore();
                        this.activeNodes.onDidChange(this._onDidChangeActiveNodes, this, disposables);
                        this.indentGuidesDisposable = disposables;
                        this._onDidChangeActiveNodes(this.activeNodes.elements);
                    }
                }
            }
            if (typeof options.hideTwistiesOfChildlessElements !== 'undefined') {
                this.hideTwistiesOfChildlessElements = options.hideTwistiesOfChildlessElements;
            }
        }
        renderTemplate(container) {
            const el = dom_1.append(container, dom_1.$('.monaco-tl-row'));
            const indent = dom_1.append(el, dom_1.$('.monaco-tl-indent'));
            const twistie = dom_1.append(el, dom_1.$('.monaco-tl-twistie'));
            const contents = dom_1.append(el, dom_1.$('.monaco-tl-contents'));
            const templateData = this.renderer.renderTemplate(contents);
            return { container, indent, twistie, indentGuidesDisposable: lifecycle_1.Disposable.None, templateData };
        }
        renderElement(node, index, templateData, height) {
            if (typeof height === 'number') {
                this.renderedNodes.set(node, { templateData, height });
                this.renderedElements.set(node.element, node);
            }
            const indent = TreeRenderer.DefaultIndent + (node.depth - 1) * this.indent;
            templateData.twistie.style.paddingLeft = `${indent}px`;
            templateData.indent.style.width = `${indent + this.indent - 16}px`;
            this.renderTwistie(node, templateData);
            if (typeof height === 'number') {
                this.renderIndentGuides(node, templateData);
            }
            this.renderer.renderElement(node, index, templateData.templateData, height);
        }
        disposeElement(node, index, templateData, height) {
            templateData.indentGuidesDisposable.dispose();
            if (this.renderer.disposeElement) {
                this.renderer.disposeElement(node, index, templateData.templateData, height);
            }
            if (typeof height === 'number') {
                this.renderedNodes.delete(node);
                this.renderedElements.delete(node.element);
            }
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.templateData);
        }
        onDidChangeTwistieState(element) {
            const node = this.renderedElements.get(element);
            if (!node) {
                return;
            }
            this.onDidChangeNodeTwistieState(node);
        }
        onDidChangeNodeTwistieState(node) {
            const data = this.renderedNodes.get(node);
            if (!data) {
                return;
            }
            this.renderTwistie(node, data.templateData);
            this._onDidChangeActiveNodes(this.activeNodes.elements);
            this.renderIndentGuides(node, data.templateData);
        }
        renderTwistie(node, templateData) {
            if (this.renderer.renderTwistie) {
                this.renderer.renderTwistie(node.element, templateData.twistie);
            }
            if (node.collapsible && (!this.hideTwistiesOfChildlessElements || node.visibleChildrenCount > 0)) {
                dom_1.addClasses(templateData.twistie, treeIcons_1.treeItemExpandedIcon.classNames, 'collapsible');
                dom_1.toggleClass(templateData.twistie, 'collapsed', node.collapsed);
            }
            else {
                dom_1.removeClasses(templateData.twistie, treeIcons_1.treeItemExpandedIcon.classNames, 'collapsible', 'collapsed');
            }
            if (node.collapsible) {
                templateData.container.setAttribute('aria-expanded', String(!node.collapsed));
            }
            else {
                templateData.container.removeAttribute('aria-expanded');
            }
        }
        renderIndentGuides(target, templateData) {
            dom_1.clearNode(templateData.indent);
            templateData.indentGuidesDisposable.dispose();
            if (!this.shouldRenderIndentGuides) {
                return;
            }
            const disposableStore = new lifecycle_1.DisposableStore();
            const model = this.modelProvider();
            let node = target;
            while (true) {
                const ref = model.getNodeLocation(node);
                const parentRef = model.getParentNodeLocation(ref);
                if (!parentRef) {
                    break;
                }
                const parent = model.getNode(parentRef);
                const guide = dom_1.$('.indent-guide', { style: `width: ${this.indent}px` });
                if (this.activeIndentNodes.has(parent)) {
                    dom_1.addClass(guide, 'active');
                }
                if (templateData.indent.childElementCount === 0) {
                    templateData.indent.appendChild(guide);
                }
                else {
                    templateData.indent.insertBefore(guide, templateData.indent.firstElementChild);
                }
                this.renderedIndentGuides.add(parent, guide);
                disposableStore.add(lifecycle_1.toDisposable(() => this.renderedIndentGuides.delete(parent, guide)));
                node = parent;
            }
            templateData.indentGuidesDisposable = disposableStore;
        }
        _onDidChangeActiveNodes(nodes) {
            if (!this.shouldRenderIndentGuides) {
                return;
            }
            const set = new Set();
            const model = this.modelProvider();
            nodes.forEach(node => {
                const ref = model.getNodeLocation(node);
                try {
                    const parentRef = model.getParentNodeLocation(ref);
                    if (node.collapsible && node.children.length > 0 && !node.collapsed) {
                        set.add(node);
                    }
                    else if (parentRef) {
                        set.add(model.getNode(parentRef));
                    }
                }
                catch (_a) {
                    // noop
                }
            });
            this.activeIndentNodes.forEach(node => {
                if (!set.has(node)) {
                    this.renderedIndentGuides.forEach(node, line => dom_1.removeClass(line, 'active'));
                }
            });
            set.forEach(node => {
                if (!this.activeIndentNodes.has(node)) {
                    this.renderedIndentGuides.forEach(node, line => dom_1.addClass(line, 'active'));
                }
            });
            this.activeIndentNodes = set;
        }
        dispose() {
            this.renderedNodes.clear();
            this.renderedElements.clear();
            this.indentGuidesDisposable.dispose();
            lifecycle_1.dispose(this.disposables);
        }
    }
    TreeRenderer.DefaultIndent = 8;
    class TypeFilter {
        constructor(tree, keyboardNavigationLabelProvider, _filter) {
            this.tree = tree;
            this.keyboardNavigationLabelProvider = keyboardNavigationLabelProvider;
            this._filter = _filter;
            this._totalCount = 0;
            this._matchCount = 0;
            this._pattern = '';
            this._lowercasePattern = '';
            this.disposables = new lifecycle_1.DisposableStore();
            tree.onWillRefilter(this.reset, this, this.disposables);
        }
        get totalCount() { return this._totalCount; }
        get matchCount() { return this._matchCount; }
        set pattern(pattern) {
            this._pattern = pattern;
            this._lowercasePattern = pattern.toLowerCase();
        }
        filter(element, parentVisibility) {
            if (this._filter) {
                const result = this._filter.filter(element, parentVisibility);
                if (this.tree.options.simpleKeyboardNavigation) {
                    return result;
                }
                let visibility;
                if (typeof result === 'boolean') {
                    visibility = result ? 1 /* Visible */ : 0 /* Hidden */;
                }
                else if (indexTreeModel_1.isFilterResult(result)) {
                    visibility = indexTreeModel_1.getVisibleState(result.visibility);
                }
                else {
                    visibility = result;
                }
                if (visibility === 0 /* Hidden */) {
                    return false;
                }
            }
            this._totalCount++;
            if (this.tree.options.simpleKeyboardNavigation || !this._pattern) {
                this._matchCount++;
                return { data: filters_1.FuzzyScore.Default, visibility: true };
            }
            const label = this.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(element);
            const labelStr = label && label.toString();
            if (typeof labelStr === 'undefined') {
                return { data: filters_1.FuzzyScore.Default, visibility: true };
            }
            const score = filters_1.fuzzyScore(this._pattern, this._lowercasePattern, 0, labelStr, labelStr.toLowerCase(), 0, true);
            if (!score) {
                if (this.tree.options.filterOnType) {
                    return 2 /* Recurse */;
                }
                else {
                    return { data: filters_1.FuzzyScore.Default, visibility: true };
                }
                // DEMO: smarter filter ?
                // return parentVisibility === TreeVisibility.Visible ? true : TreeVisibility.Recurse;
            }
            this._matchCount++;
            return { data: score, visibility: true };
        }
        reset() {
            this._totalCount = 0;
            this._matchCount = 0;
        }
        dispose() {
            lifecycle_1.dispose(this.disposables);
        }
    }
    class TypeFilterController {
        constructor(tree, model, view, filter, keyboardNavigationDelegate) {
            this.tree = tree;
            this.view = view;
            this.filter = filter;
            this.keyboardNavigationDelegate = keyboardNavigationDelegate;
            this._enabled = false;
            this._pattern = '';
            this._empty = false;
            this._onDidChangeEmptyState = new event_1.Emitter();
            this.onDidChangeEmptyState = event_1.Event.latch(this._onDidChangeEmptyState.event);
            this.positionClassName = 'ne';
            this.automaticKeyboardNavigation = true;
            this.triggered = false;
            this._onDidChangePattern = new event_1.Emitter();
            this.onDidChangePattern = this._onDidChangePattern.event;
            this.enabledDisposables = new lifecycle_1.DisposableStore();
            this.disposables = new lifecycle_1.DisposableStore();
            this.domNode = dom_1.$(`.monaco-list-type-filter.${this.positionClassName}`);
            this.domNode.draggable = true;
            event_2.domEvent(this.domNode, 'dragstart')(this.onDragStart, this, this.disposables);
            this.messageDomNode = dom_1.append(view.getHTMLElement(), dom_1.$(`.monaco-list-type-filter-message`));
            this.labelDomNode = dom_1.append(this.domNode, dom_1.$('span.label'));
            const controls = dom_1.append(this.domNode, dom_1.$('.controls'));
            this._filterOnType = !!tree.options.filterOnType;
            this.filterOnTypeDomNode = dom_1.append(controls, dom_1.$('input.filter'));
            this.filterOnTypeDomNode.type = 'checkbox';
            this.filterOnTypeDomNode.checked = this._filterOnType;
            this.filterOnTypeDomNode.tabIndex = -1;
            this.updateFilterOnTypeTitleAndIcon();
            event_2.domEvent(this.filterOnTypeDomNode, 'input')(this.onDidChangeFilterOnType, this, this.disposables);
            this.clearDomNode = dom_1.append(controls, dom_1.$('button.clear' + treeIcons_1.treeFilterClearIcon.cssSelector));
            this.clearDomNode.tabIndex = -1;
            this.clearDomNode.title = nls_1.localize('clear', "Clear");
            this.keyboardNavigationEventFilter = tree.options.keyboardNavigationEventFilter;
            model.onDidSplice(this.onDidSpliceModel, this, this.disposables);
            this.updateOptions(tree.options);
        }
        get enabled() { return this._enabled; }
        get pattern() { return this._pattern; }
        get filterOnType() { return this._filterOnType; }
        get empty() { return this._empty; }
        updateOptions(options) {
            if (options.simpleKeyboardNavigation) {
                this.disable();
            }
            else {
                this.enable();
            }
            if (typeof options.filterOnType !== 'undefined') {
                this._filterOnType = !!options.filterOnType;
                this.filterOnTypeDomNode.checked = this._filterOnType;
            }
            if (typeof options.automaticKeyboardNavigation !== 'undefined') {
                this.automaticKeyboardNavigation = options.automaticKeyboardNavigation;
            }
            this.tree.refilter();
            this.render();
            if (!this.automaticKeyboardNavigation) {
                this.onEventOrInput('');
            }
        }
        toggle() {
            this.triggered = !this.triggered;
            if (!this.triggered) {
                this.onEventOrInput('');
            }
        }
        enable() {
            if (this._enabled) {
                return;
            }
            const onKeyDown = event_1.Event.chain(event_2.domEvent(this.view.getHTMLElement(), 'keydown'))
                .filter(e => !isInputElement(e.target) || e.target === this.filterOnTypeDomNode)
                .filter(e => e.key !== 'Dead' && !/^Media/.test(e.key))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(this.keyboardNavigationEventFilter || (() => true))
                .filter(() => this.automaticKeyboardNavigation || this.triggered)
                .filter(e => (this.keyboardNavigationDelegate.mightProducePrintableCharacter(e) && !(e.keyCode === 18 /* DownArrow */ || e.keyCode === 16 /* UpArrow */ || e.keyCode === 15 /* LeftArrow */ || e.keyCode === 17 /* RightArrow */)) || ((this.pattern.length > 0 || this.triggered) && ((e.keyCode === 9 /* Escape */ || e.keyCode === 1 /* Backspace */) && !e.altKey && !e.ctrlKey && !e.metaKey) || (e.keyCode === 1 /* Backspace */ && (platform_1.isMacintosh ? (e.altKey && !e.metaKey) : e.ctrlKey) && !e.shiftKey)))
                .forEach(e => { e.stopPropagation(); e.preventDefault(); })
                .event;
            const onClear = event_2.domEvent(this.clearDomNode, 'click');
            event_1.Event.chain(event_1.Event.any(onKeyDown, onClear))
                .event(this.onEventOrInput, this, this.enabledDisposables);
            this.filter.pattern = '';
            this.tree.refilter();
            this.render();
            this._enabled = true;
            this.triggered = false;
        }
        disable() {
            if (!this._enabled) {
                return;
            }
            this.domNode.remove();
            this.enabledDisposables.clear();
            this.tree.refilter();
            this.render();
            this._enabled = false;
            this.triggered = false;
        }
        onEventOrInput(e) {
            if (typeof e === 'string') {
                this.onInput(e);
            }
            else if (e instanceof MouseEvent || e.keyCode === 9 /* Escape */ || (e.keyCode === 1 /* Backspace */ && (platform_1.isMacintosh ? e.altKey : e.ctrlKey))) {
                this.onInput('');
            }
            else if (e.keyCode === 1 /* Backspace */) {
                this.onInput(this.pattern.length === 0 ? '' : this.pattern.substr(0, this.pattern.length - 1));
            }
            else {
                this.onInput(this.pattern + e.browserEvent.key);
            }
        }
        onInput(pattern) {
            const container = this.view.getHTMLElement();
            if (pattern && !this.domNode.parentElement) {
                container.append(this.domNode);
            }
            else if (!pattern && this.domNode.parentElement) {
                this.domNode.remove();
                this.tree.domFocus();
            }
            this._pattern = pattern;
            this._onDidChangePattern.fire(pattern);
            this.filter.pattern = pattern;
            this.tree.refilter();
            if (pattern) {
                this.tree.focusNext(0, true, undefined, node => !filters_1.FuzzyScore.isDefault(node.filterData));
            }
            const focus = this.tree.getFocus();
            if (focus.length > 0) {
                const element = focus[0];
                if (this.tree.getRelativeTop(element) === null) {
                    this.tree.reveal(element, 0.5);
                }
            }
            this.render();
            if (!pattern) {
                this.triggered = false;
            }
        }
        onDragStart() {
            const container = this.view.getHTMLElement();
            const { left } = dom_1.getDomNodePagePosition(container);
            const containerWidth = container.clientWidth;
            const midContainerWidth = containerWidth / 2;
            const width = this.domNode.clientWidth;
            const disposables = new lifecycle_1.DisposableStore();
            let positionClassName = this.positionClassName;
            const updatePosition = () => {
                switch (positionClassName) {
                    case 'nw':
                        this.domNode.style.top = `4px`;
                        this.domNode.style.left = `4px`;
                        break;
                    case 'ne':
                        this.domNode.style.top = `4px`;
                        this.domNode.style.left = `${containerWidth - width - 6}px`;
                        break;
                }
            };
            const onDragOver = (event) => {
                event.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
                const x = event.screenX - left;
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'none';
                }
                if (x < midContainerWidth) {
                    positionClassName = 'nw';
                }
                else {
                    positionClassName = 'ne';
                }
                updatePosition();
            };
            const onDragEnd = () => {
                this.positionClassName = positionClassName;
                this.domNode.className = `monaco-list-type-filter ${this.positionClassName}`;
                this.domNode.style.top = '';
                this.domNode.style.left = '';
                lifecycle_1.dispose(disposables);
            };
            updatePosition();
            dom_1.removeClass(this.domNode, positionClassName);
            dom_1.addClass(this.domNode, 'dragging');
            disposables.add(lifecycle_1.toDisposable(() => dom_1.removeClass(this.domNode, 'dragging')));
            event_2.domEvent(document, 'dragover')(onDragOver, null, disposables);
            event_2.domEvent(this.domNode, 'dragend')(onDragEnd, null, disposables);
            dnd_1.StaticDND.CurrentDragAndDropData = new dnd_1.DragAndDropData('vscode-ui');
            disposables.add(lifecycle_1.toDisposable(() => dnd_1.StaticDND.CurrentDragAndDropData = undefined));
        }
        onDidSpliceModel() {
            if (!this._enabled || this.pattern.length === 0) {
                return;
            }
            this.tree.refilter();
            this.render();
        }
        onDidChangeFilterOnType() {
            this.tree.updateOptions({ filterOnType: this.filterOnTypeDomNode.checked });
            this.tree.refilter();
            this.tree.domFocus();
            this.render();
            this.updateFilterOnTypeTitleAndIcon();
        }
        updateFilterOnTypeTitleAndIcon() {
            if (this.filterOnType) {
                dom_1.removeClasses(this.filterOnTypeDomNode, treeIcons_1.treeFilterOnTypeOffIcon.classNames);
                dom_1.addClasses(this.filterOnTypeDomNode, treeIcons_1.treeFilterOnTypeOnIcon.classNames);
                this.filterOnTypeDomNode.title = nls_1.localize('disable filter on type', "Disable Filter on Type");
            }
            else {
                dom_1.removeClasses(this.filterOnTypeDomNode, treeIcons_1.treeFilterOnTypeOnIcon.classNames);
                dom_1.addClasses(this.filterOnTypeDomNode, treeIcons_1.treeFilterOnTypeOffIcon.classNames);
                this.filterOnTypeDomNode.title = nls_1.localize('enable filter on type', "Enable Filter on Type");
            }
        }
        render() {
            const noMatches = this.filter.totalCount > 0 && this.filter.matchCount === 0;
            if (this.pattern && this.tree.options.filterOnType && noMatches) {
                this.messageDomNode.textContent = nls_1.localize('empty', "No elements found");
                this._empty = true;
            }
            else {
                this.messageDomNode.innerHTML = '';
                this._empty = false;
            }
            dom_1.toggleClass(this.domNode, 'no-matches', noMatches);
            this.domNode.title = nls_1.localize('found', "Matched {0} out of {1} elements", this.filter.matchCount, this.filter.totalCount);
            this.labelDomNode.textContent = this.pattern.length > 16 ? '…' + this.pattern.substr(this.pattern.length - 16) : this.pattern;
            this._onDidChangeEmptyState.fire(this._empty);
        }
        shouldAllowFocus(node) {
            if (!this.enabled || !this.pattern || this.filterOnType) {
                return true;
            }
            if (this.filter.totalCount > 0 && this.filter.matchCount <= 1) {
                return true;
            }
            return !filters_1.FuzzyScore.isDefault(node.filterData);
        }
        dispose() {
            if (this._enabled) {
                this.domNode.remove();
                this.enabledDisposables.dispose();
                this._enabled = false;
                this.triggered = false;
            }
            this._onDidChangePattern.dispose();
            lifecycle_1.dispose(this.disposables);
        }
    }
    function isInputElement(e) {
        return e.tagName === 'INPUT' || e.tagName === 'TEXTAREA';
    }
    function asTreeMouseEvent(event) {
        let target = tree_1.TreeMouseEventTarget.Unknown;
        if (dom_1.hasParentWithClass(event.browserEvent.target, 'monaco-tl-twistie', 'monaco-tl-row')) {
            target = tree_1.TreeMouseEventTarget.Twistie;
        }
        else if (dom_1.hasParentWithClass(event.browserEvent.target, 'monaco-tl-contents', 'monaco-tl-row')) {
            target = tree_1.TreeMouseEventTarget.Element;
        }
        return {
            browserEvent: event.browserEvent,
            element: event.element ? event.element.element : null,
            target
        };
    }
    function asTreeContextMenuEvent(event) {
        return {
            element: event.element ? event.element.element : null,
            browserEvent: event.browserEvent,
            anchor: event.anchor
        };
    }
    function dfs(node, fn) {
        fn(node);
        node.children.forEach(child => dfs(child, fn));
    }
    /**
     * The trait concept needs to exist at the tree level, because collapsed
     * tree nodes will not be known by the list.
     */
    class Trait {
        constructor(identityProvider) {
            this.identityProvider = identityProvider;
            this.nodes = [];
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        get nodeSet() {
            if (!this._nodeSet) {
                this._nodeSet = this.createNodeSet();
            }
            return this._nodeSet;
        }
        set(nodes, browserEvent) {
            if (arrays_1.equals(this.nodes, nodes)) {
                return;
            }
            this._set(nodes, false, browserEvent);
        }
        _set(nodes, silent, browserEvent) {
            this.nodes = [...nodes];
            this.elements = undefined;
            this._nodeSet = undefined;
            if (!silent) {
                const that = this;
                this._onDidChange.fire({ get elements() { return that.get(); }, browserEvent });
            }
        }
        get() {
            if (!this.elements) {
                this.elements = this.nodes.map(node => node.element);
            }
            return [...this.elements];
        }
        getNodes() {
            return this.nodes;
        }
        has(node) {
            return this.nodeSet.has(node);
        }
        onDidModelSplice({ insertedNodes, deletedNodes }) {
            if (!this.identityProvider) {
                const set = this.createNodeSet();
                const visit = (node) => set.delete(node);
                deletedNodes.forEach(node => dfs(node, visit));
                this.set([...set.values()]);
                return;
            }
            const deletedNodesIdSet = new Set();
            const deletedNodesVisitor = (node) => deletedNodesIdSet.add(this.identityProvider.getId(node.element).toString());
            deletedNodes.forEach(node => dfs(node, deletedNodesVisitor));
            const insertedNodesMap = new Map();
            const insertedNodesVisitor = (node) => insertedNodesMap.set(this.identityProvider.getId(node.element).toString(), node);
            insertedNodes.forEach(node => dfs(node, insertedNodesVisitor));
            const nodes = [];
            for (const node of this.nodes) {
                const id = this.identityProvider.getId(node.element).toString();
                const wasDeleted = deletedNodesIdSet.has(id);
                if (!wasDeleted) {
                    nodes.push(node);
                }
                else {
                    const insertedNode = insertedNodesMap.get(id);
                    if (insertedNode) {
                        nodes.push(insertedNode);
                    }
                }
            }
            this._set(nodes, true);
        }
        createNodeSet() {
            const set = new Set();
            for (const node of this.nodes) {
                set.add(node);
            }
            return set;
        }
    }
    class TreeNodeListMouseController extends listWidget_1.MouseController {
        constructor(list, tree) {
            super(list);
            this.tree = tree;
        }
        onViewPointer(e) {
            if (isInputElement(e.browserEvent.target)) {
                return;
            }
            const node = e.element;
            if (!node) {
                return super.onViewPointer(e);
            }
            if (this.isSelectionRangeChangeEvent(e) || this.isSelectionSingleChangeEvent(e)) {
                return super.onViewPointer(e);
            }
            const onTwistie = dom_1.hasClass(e.browserEvent.target, 'monaco-tl-twistie');
            let expandOnlyOnTwistieClick = false;
            if (typeof this.tree.expandOnlyOnTwistieClick === 'function') {
                expandOnlyOnTwistieClick = this.tree.expandOnlyOnTwistieClick(node.element);
            }
            else {
                expandOnlyOnTwistieClick = !!this.tree.expandOnlyOnTwistieClick;
            }
            if (expandOnlyOnTwistieClick && !onTwistie) {
                return super.onViewPointer(e);
            }
            if (node.collapsible) {
                const model = this.tree.model; // internal
                const location = model.getNodeLocation(node);
                const recursive = e.browserEvent.altKey;
                model.setCollapsed(location, undefined, recursive);
                if (expandOnlyOnTwistieClick && onTwistie) {
                    return;
                }
            }
            super.onViewPointer(e);
        }
        onDoubleClick(e) {
            const onTwistie = dom_1.hasClass(e.browserEvent.target, 'monaco-tl-twistie');
            if (onTwistie) {
                return;
            }
            super.onDoubleClick(e);
        }
    }
    /**
     * We use this List subclass to restore selection and focus as nodes
     * get rendered in the list, possibly due to a node expand() call.
     */
    class TreeNodeList extends listWidget_1.List {
        constructor(user, container, virtualDelegate, renderers, focusTrait, selectionTrait, options) {
            super(user, container, virtualDelegate, renderers, options);
            this.focusTrait = focusTrait;
            this.selectionTrait = selectionTrait;
        }
        createMouseController(options) {
            return new TreeNodeListMouseController(this, options.tree);
        }
        splice(start, deleteCount, elements = []) {
            super.splice(start, deleteCount, elements);
            if (elements.length === 0) {
                return;
            }
            const additionalFocus = [];
            const additionalSelection = [];
            elements.forEach((node, index) => {
                if (this.focusTrait.has(node)) {
                    additionalFocus.push(start + index);
                }
                if (this.selectionTrait.has(node)) {
                    additionalSelection.push(start + index);
                }
            });
            if (additionalFocus.length > 0) {
                super.setFocus(arrays_1.distinctES6([...super.getFocus(), ...additionalFocus]));
            }
            if (additionalSelection.length > 0) {
                super.setSelection(arrays_1.distinctES6([...super.getSelection(), ...additionalSelection]));
            }
        }
        setFocus(indexes, browserEvent, fromAPI = false) {
            super.setFocus(indexes, browserEvent);
            if (!fromAPI) {
                this.focusTrait.set(indexes.map(i => this.element(i)), browserEvent);
            }
        }
        setSelection(indexes, browserEvent, fromAPI = false) {
            super.setSelection(indexes, browserEvent);
            if (!fromAPI) {
                this.selectionTrait.set(indexes.map(i => this.element(i)), browserEvent);
            }
        }
    }
    class AbstractTree {
        constructor(user, container, delegate, renderers, _options = {}) {
            this._options = _options;
            this.eventBufferer = new event_1.EventBufferer();
            this.disposables = new lifecycle_1.DisposableStore();
            this._onWillRefilter = new event_1.Emitter();
            this.onWillRefilter = this._onWillRefilter.event;
            this._onDidUpdateOptions = new event_1.Emitter();
            this.onDidUpdateOptions = this._onDidUpdateOptions.event;
            const treeDelegate = new ComposedTreeDelegate(delegate);
            const onDidChangeCollapseStateRelay = new event_1.Relay();
            const onDidChangeActiveNodes = new event_1.Relay();
            const activeNodes = new EventCollection(onDidChangeActiveNodes.event);
            this.renderers = renderers.map(r => new TreeRenderer(r, () => this.model, onDidChangeCollapseStateRelay.event, activeNodes, _options));
            for (let r of this.renderers) {
                this.disposables.add(r);
            }
            let filter;
            if (_options.keyboardNavigationLabelProvider) {
                filter = new TypeFilter(this, _options.keyboardNavigationLabelProvider, _options.filter);
                _options = Object.assign(Object.assign({}, _options), { filter: filter }); // TODO need typescript help here
                this.disposables.add(filter);
            }
            this.focus = new Trait(_options.identityProvider);
            this.selection = new Trait(_options.identityProvider);
            this.view = new TreeNodeList(user, container, treeDelegate, this.renderers, this.focus, this.selection, Object.assign(Object.assign({}, asListOptions(() => this.model, _options)), { tree: this }));
            this.model = this.createModel(user, this.view, _options);
            onDidChangeCollapseStateRelay.input = this.model.onDidChangeCollapseState;
            const onDidModelSplice = event_1.Event.forEach(this.model.onDidSplice, e => {
                this.eventBufferer.bufferEvents(() => {
                    this.focus.onDidModelSplice(e);
                    this.selection.onDidModelSplice(e);
                });
            });
            // Make sure the `forEach` always runs
            onDidModelSplice(() => null, null, this.disposables);
            // Active nodes can change when the model changes or when focus or selection change.
            // We debounce it with 0 delay since these events may fire in the same stack and we only
            // want to run this once. It also doesn't matter if it runs on the next tick since it's only
            // a nice to have UI feature.
            onDidChangeActiveNodes.input = event_1.Event.chain(event_1.Event.any(onDidModelSplice, this.focus.onDidChange, this.selection.onDidChange))
                .debounce(() => null, 0)
                .map(() => {
                const set = new Set();
                for (const node of this.focus.getNodes()) {
                    set.add(node);
                }
                for (const node of this.selection.getNodes()) {
                    set.add(node);
                }
                return [...set.values()];
            }).event;
            if (_options.keyboardSupport !== false) {
                const onKeyDown = event_1.Event.chain(this.view.onKeyDown)
                    .filter(e => !isInputElement(e.target))
                    .map(e => new keyboardEvent_1.StandardKeyboardEvent(e));
                onKeyDown.filter(e => e.keyCode === 15 /* LeftArrow */).on(this.onLeftArrow, this, this.disposables);
                onKeyDown.filter(e => e.keyCode === 17 /* RightArrow */).on(this.onRightArrow, this, this.disposables);
                onKeyDown.filter(e => e.keyCode === 10 /* Space */).on(this.onSpace, this, this.disposables);
            }
            if (_options.keyboardNavigationLabelProvider) {
                const delegate = _options.keyboardNavigationDelegate || listWidget_1.DefaultKeyboardNavigationDelegate;
                this.typeFilterController = new TypeFilterController(this, this.model, this.view, filter, delegate);
                this.focusNavigationFilter = node => this.typeFilterController.shouldAllowFocus(node);
                this.disposables.add(this.typeFilterController);
            }
            this.styleElement = dom_1.createStyleSheet(this.view.getHTMLElement());
            dom_1.toggleClass(this.getHTMLElement(), 'always', this._options.renderIndentGuides === RenderIndentGuides.Always);
        }
        get onDidScroll() { return this.view.onDidScroll; }
        get onDidChangeFocus() { return this.eventBufferer.wrapEvent(this.focus.onDidChange); }
        get onDidChangeSelection() { return this.eventBufferer.wrapEvent(this.selection.onDidChange); }
        get onMouseClick() { return event_1.Event.map(this.view.onMouseClick, asTreeMouseEvent); }
        get onMouseDblClick() { return event_1.Event.map(this.view.onMouseDblClick, asTreeMouseEvent); }
        get onContextMenu() { return event_1.Event.map(this.view.onContextMenu, asTreeContextMenuEvent); }
        get onTap() { return event_1.Event.map(this.view.onTap, asTreeMouseEvent); }
        get onPointer() { return event_1.Event.map(this.view.onPointer, asTreeMouseEvent); }
        get onKeyDown() { return this.view.onKeyDown; }
        get onKeyUp() { return this.view.onKeyUp; }
        get onKeyPress() { return this.view.onKeyPress; }
        get onDidFocus() { return this.view.onDidFocus; }
        get onDidBlur() { return this.view.onDidBlur; }
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        get onDidChangeRenderNodeCount() { return this.model.onDidChangeRenderNodeCount; }
        get filterOnType() { return !!this._options.filterOnType; }
        get onDidChangeTypeFilterPattern() { return this.typeFilterController ? this.typeFilterController.onDidChangePattern : event_1.Event.None; }
        get expandOnlyOnTwistieClick() { return typeof this._options.expandOnlyOnTwistieClick === 'undefined' ? false : this._options.expandOnlyOnTwistieClick; }
        get onDidDispose() { return this.view.onDidDispose; }
        updateOptions(optionsUpdate = {}) {
            this._options = Object.assign(Object.assign({}, this._options), optionsUpdate);
            for (const renderer of this.renderers) {
                renderer.updateOptions(optionsUpdate);
            }
            this.view.updateOptions({
                enableKeyboardNavigation: this._options.simpleKeyboardNavigation,
                automaticKeyboardNavigation: this._options.automaticKeyboardNavigation,
                smoothScrolling: this._options.smoothScrolling,
                horizontalScrolling: this._options.horizontalScrolling
            });
            if (this.typeFilterController) {
                this.typeFilterController.updateOptions(this._options);
            }
            this._onDidUpdateOptions.fire(this._options);
            dom_1.toggleClass(this.getHTMLElement(), 'always', this._options.renderIndentGuides === RenderIndentGuides.Always);
        }
        get options() {
            return this._options;
        }
        updateWidth(element) {
            const index = this.model.getListIndex(element);
            if (index === -1) {
                return;
            }
            this.view.updateWidth(index);
        }
        // Widget
        getHTMLElement() {
            return this.view.getHTMLElement();
        }
        get contentHeight() {
            if (this.typeFilterController && this.typeFilterController.filterOnType && this.typeFilterController.empty) {
                return 100;
            }
            return this.view.contentHeight;
        }
        get onDidChangeContentHeight() {
            let result = this.view.onDidChangeContentHeight;
            if (this.typeFilterController) {
                result = event_1.Event.any(result, event_1.Event.map(this.typeFilterController.onDidChangeEmptyState, () => this.contentHeight));
            }
            return result;
        }
        get scrollTop() {
            return this.view.scrollTop;
        }
        set scrollTop(scrollTop) {
            this.view.scrollTop = scrollTop;
        }
        get scrollLeft() {
            return this.view.scrollLeft;
        }
        set scrollLeft(scrollLeft) {
            this.view.scrollLeft = scrollLeft;
        }
        get scrollHeight() {
            return this.view.scrollHeight;
        }
        get renderHeight() {
            return this.view.renderHeight;
        }
        get firstVisibleElement() {
            const index = this.view.firstVisibleIndex;
            if (index < 0 || index >= this.view.length) {
                return undefined;
            }
            const node = this.view.element(index);
            return node.element;
        }
        get lastVisibleElement() {
            const index = this.view.lastVisibleIndex;
            const node = this.view.element(index);
            return node.element;
        }
        get ariaLabel() {
            return this.view.ariaLabel;
        }
        set ariaLabel(value) {
            this.view.ariaLabel = value;
        }
        domFocus() {
            this.view.domFocus();
        }
        isDOMFocused() {
            return this.getHTMLElement() === document.activeElement;
        }
        layout(height, width) {
            this.view.layout(height, width);
        }
        style(styles) {
            const suffix = `.${this.view.domId}`;
            const content = [];
            if (styles.treeIndentGuidesStroke) {
                content.push(`.monaco-list${suffix}:hover .monaco-tl-indent > .indent-guide, .monaco-list${suffix}.always .monaco-tl-indent > .indent-guide  { border-color: ${styles.treeIndentGuidesStroke.transparent(0.4)}; }`);
                content.push(`.monaco-list${suffix} .monaco-tl-indent > .indent-guide.active { border-color: ${styles.treeIndentGuidesStroke}; }`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.innerHTML) {
                this.styleElement.innerHTML = newStyles;
            }
            this.view.style(styles);
        }
        // Tree navigation
        getParentElement(location) {
            const parentRef = this.model.getParentNodeLocation(location);
            const parentNode = this.model.getNode(parentRef);
            return parentNode.element;
        }
        getFirstElementChild(location) {
            return this.model.getFirstElementChild(location);
        }
        // Tree
        getNode(location) {
            return this.model.getNode(location);
        }
        collapse(location, recursive = false) {
            return this.model.setCollapsed(location, true, recursive);
        }
        expand(location, recursive = false) {
            return this.model.setCollapsed(location, false, recursive);
        }
        toggleCollapsed(location, recursive = false) {
            return this.model.setCollapsed(location, undefined, recursive);
        }
        expandAll() {
            this.model.setCollapsed(this.model.rootRef, false, true);
        }
        collapseAll() {
            this.model.setCollapsed(this.model.rootRef, true, true);
        }
        isCollapsible(location) {
            return this.model.isCollapsible(location);
        }
        setCollapsible(location, collapsible) {
            return this.model.setCollapsible(location, collapsible);
        }
        isCollapsed(location) {
            return this.model.isCollapsed(location);
        }
        toggleKeyboardNavigation() {
            this.view.toggleKeyboardNavigation();
            if (this.typeFilterController) {
                this.typeFilterController.toggle();
            }
        }
        refilter() {
            this._onWillRefilter.fire(undefined);
            this.model.refilter();
        }
        setSelection(elements, browserEvent) {
            const nodes = elements.map(e => this.model.getNode(e));
            this.selection.set(nodes, browserEvent);
            const indexes = elements.map(e => this.model.getListIndex(e)).filter(i => i > -1);
            this.view.setSelection(indexes, browserEvent, true);
        }
        getSelection() {
            return this.selection.get();
        }
        setFocus(elements, browserEvent) {
            const nodes = elements.map(e => this.model.getNode(e));
            this.focus.set(nodes, browserEvent);
            const indexes = elements.map(e => this.model.getListIndex(e)).filter(i => i > -1);
            this.view.setFocus(indexes, browserEvent, true);
        }
        focusNext(n = 1, loop = false, browserEvent, filter = this.focusNavigationFilter) {
            this.view.focusNext(n, loop, browserEvent, filter);
        }
        focusPrevious(n = 1, loop = false, browserEvent, filter = this.focusNavigationFilter) {
            this.view.focusPrevious(n, loop, browserEvent, filter);
        }
        focusNextPage(browserEvent, filter = this.focusNavigationFilter) {
            this.view.focusNextPage(browserEvent, filter);
        }
        focusPreviousPage(browserEvent, filter = this.focusNavigationFilter) {
            this.view.focusPreviousPage(browserEvent, filter);
        }
        focusLast(browserEvent, filter = this.focusNavigationFilter) {
            this.view.focusLast(browserEvent, filter);
        }
        focusFirst(browserEvent, filter = this.focusNavigationFilter) {
            this.view.focusFirst(browserEvent, filter);
        }
        getFocus() {
            return this.focus.get();
        }
        reveal(location, relativeTop) {
            this.model.expandTo(location);
            const index = this.model.getListIndex(location);
            if (index === -1) {
                return;
            }
            this.view.reveal(index, relativeTop);
        }
        /**
         * Returns the relative position of an element rendered in the list.
         * Returns `null` if the element isn't *entirely* in the visible viewport.
         */
        getRelativeTop(location) {
            const index = this.model.getListIndex(location);
            if (index === -1) {
                return null;
            }
            return this.view.getRelativeTop(index);
        }
        // List
        onLeftArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            const nodes = this.view.getFocusedElements();
            if (nodes.length === 0) {
                return;
            }
            const node = nodes[0];
            const location = this.model.getNodeLocation(node);
            const didChange = this.model.setCollapsed(location, true);
            if (!didChange) {
                const parentLocation = this.model.getParentNodeLocation(location);
                if (!parentLocation) {
                    return;
                }
                const parentListIndex = this.model.getListIndex(parentLocation);
                this.view.reveal(parentListIndex);
                this.view.setFocus([parentListIndex]);
            }
        }
        onRightArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            const nodes = this.view.getFocusedElements();
            if (nodes.length === 0) {
                return;
            }
            const node = nodes[0];
            const location = this.model.getNodeLocation(node);
            const didChange = this.model.setCollapsed(location, false);
            if (!didChange) {
                if (!node.children.some(child => child.visible)) {
                    return;
                }
                const [focusedIndex] = this.view.getFocus();
                const firstChildIndex = focusedIndex + 1;
                this.view.reveal(firstChildIndex);
                this.view.setFocus([firstChildIndex]);
            }
        }
        onSpace(e) {
            e.preventDefault();
            e.stopPropagation();
            const nodes = this.view.getFocusedElements();
            if (nodes.length === 0) {
                return;
            }
            const node = nodes[0];
            const location = this.model.getNodeLocation(node);
            const recursive = e.browserEvent.altKey;
            this.model.setCollapsed(location, undefined, recursive);
        }
        navigate(start) {
            return new TreeNavigator(this.view, this.model, start);
        }
        dispose() {
            lifecycle_1.dispose(this.disposables);
            this.view.dispose();
        }
    }
    exports.AbstractTree = AbstractTree;
    class TreeNavigator {
        constructor(view, model, start) {
            this.view = view;
            this.model = model;
            if (start) {
                this.index = this.model.getListIndex(start);
            }
            else {
                this.index = -1;
            }
        }
        current() {
            if (this.index < 0 || this.index >= this.view.length) {
                return null;
            }
            return this.view.element(this.index).element;
        }
        previous() {
            this.index--;
            return this.current();
        }
        next() {
            this.index++;
            return this.current();
        }
        first() {
            this.index = 0;
            return this.current();
        }
        last() {
            this.index = this.view.length - 1;
            return this.current();
        }
    }
});
//# __sourceMappingURL=abstractTree.js.map