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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/editor/common/core/range", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/editor/common/model/textModel", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/list/browser/listService", "vs/base/common/arrays", "vs/workbench/contrib/debug/browser/variablesView", "vs/editor/common/modes", "vs/base/common/cancellation"], function (require, exports, nls, lifecycle, dom, range_1, instantiation_1, debug_1, debugModel_1, baseDebugView_1, scrollableElement_1, styler_1, themeService_1, colorRegistry_1, textModel_1, debugUtils_1, listService_1, arrays_1, variablesView_1, modes_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugHoverWidget = exports.findExpressionInStackFrame = void 0;
    const $ = dom.$;
    const MAX_TREE_HEIGHT = 324;
    async function doFindExpression(container, namesToFind) {
        if (!container) {
            return Promise.resolve(null);
        }
        const children = await container.getChildren();
        // look for our variable in the list. First find the parents of the hovered variable if there are any.
        const filtered = children.filter(v => namesToFind[0] === v.name);
        if (filtered.length !== 1) {
            return null;
        }
        if (namesToFind.length === 1) {
            return filtered[0];
        }
        else {
            return doFindExpression(filtered[0], namesToFind.slice(1));
        }
    }
    async function findExpressionInStackFrame(stackFrame, namesToFind) {
        const scopes = await stackFrame.getScopes();
        const nonExpensive = scopes.filter(s => !s.expensive);
        const expressions = arrays_1.coalesce(await Promise.all(nonExpensive.map(scope => doFindExpression(scope, namesToFind))));
        // only show if all expressions found have the same value
        return expressions.length > 0 && expressions.every(e => e.value === expressions[0].value) ? expressions[0] : undefined;
    }
    exports.findExpressionInStackFrame = findExpressionInStackFrame;
    let DebugHoverWidget = class DebugHoverWidget {
        constructor(editor, debugService, instantiationService, themeService) {
            this.editor = editor;
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            // editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.toDispose = [];
            this._isVisible = false;
            this.showAtPosition = null;
            this.highlightDecorations = [];
        }
        create() {
            this.domNode = $('.debug-hover-widget');
            this.complexValueContainer = dom.append(this.domNode, $('.complex-value'));
            this.complexValueTitle = dom.append(this.complexValueContainer, $('.title'));
            this.treeContainer = dom.append(this.complexValueContainer, $('.debug-hover-tree'));
            this.treeContainer.setAttribute('role', 'tree');
            const dataSource = new DebugHoverDataSource();
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'DebugHover', this.treeContainer, new DebugHoverDelegate(), [this.instantiationService.createInstance(variablesView_1.VariablesRenderer)], dataSource, {
                accessibilityProvider: new DebugHoverAccessibilityProvider(),
                mouseSupport: false,
                horizontalScrolling: true,
                useShadows: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.editorHoverBackground
                }
            });
            this.valueContainer = $('.value');
            this.valueContainer.tabIndex = 0;
            this.valueContainer.setAttribute('role', 'tooltip');
            this.scrollbar = new scrollableElement_1.DomScrollableElement(this.valueContainer, { horizontal: 2 /* Hidden */ });
            this.domNode.appendChild(this.scrollbar.getDomNode());
            this.toDispose.push(this.scrollbar);
            this.editor.applyFontInfo(this.domNode);
            this.toDispose.push(styler_1.attachStylerCallback(this.themeService, { editorHoverBackground: colorRegistry_1.editorHoverBackground, editorHoverBorder: colorRegistry_1.editorHoverBorder, editorHoverForeground: colorRegistry_1.editorHoverForeground }, colors => {
                if (colors.editorHoverBackground) {
                    this.domNode.style.backgroundColor = colors.editorHoverBackground.toString();
                }
                else {
                    this.domNode.style.backgroundColor = '';
                }
                if (colors.editorHoverBorder) {
                    this.domNode.style.border = `1px solid ${colors.editorHoverBorder}`;
                }
                else {
                    this.domNode.style.border = '';
                }
                if (colors.editorHoverForeground) {
                    this.domNode.style.color = colors.editorHoverForeground.toString();
                }
                else {
                    this.domNode.style.color = '';
                }
            }));
            this.toDispose.push(this.tree.onDidChangeContentHeight(() => this.layoutTreeAndContainer()));
            this.registerListeners();
            this.editor.addContentWidget(this);
        }
        registerListeners() {
            this.toDispose.push(dom.addStandardDisposableListener(this.domNode, 'keydown', (e) => {
                if (e.equals(9 /* Escape */)) {
                    this.hide();
                }
            }));
            this.toDispose.push(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(36 /* fontInfo */)) {
                    this.editor.applyFontInfo(this.domNode);
                }
            }));
        }
        isHovered() {
            return this.domNode.matches(':hover');
        }
        isVisible() {
            return this._isVisible;
        }
        getId() {
            return DebugHoverWidget.ID;
        }
        getDomNode() {
            return this.domNode;
        }
        async showAt(range, focus) {
            const session = this.debugService.getViewModel().focusedSession;
            if (!session || !this.editor.hasModel()) {
                return Promise.resolve(this.hide());
            }
            const model = this.editor.getModel();
            const pos = range.getStartPosition();
            let rng = undefined;
            let matchingExpression;
            if (modes_1.EvaluatableExpressionProviderRegistry.has(model)) {
                const supports = modes_1.EvaluatableExpressionProviderRegistry.ordered(model);
                const promises = supports.map(support => {
                    return Promise.resolve(support.provideEvaluatableExpression(model, pos, cancellation_1.CancellationToken.None)).then(expression => {
                        return expression;
                    }, err => {
                        //onUnexpectedExternalError(err);
                        return undefined;
                    });
                });
                const results = await Promise.all(promises).then(arrays_1.coalesce);
                if (results.length > 0) {
                    matchingExpression = results[0].expression;
                    rng = results[0].range;
                    if (!matchingExpression) {
                        const lineContent = model.getLineContent(pos.lineNumber);
                        matchingExpression = lineContent.substring(rng.startColumn - 1, rng.endColumn - 1);
                    }
                }
            }
            else { // old one-size-fits-all strategy
                const lineContent = model.getLineContent(pos.lineNumber);
                const { start, end } = debugUtils_1.getExactExpressionStartAndEnd(lineContent, range.startColumn, range.endColumn);
                // use regex to extract the sub-expression #9821
                matchingExpression = lineContent.substring(start - 1, end);
                rng = new range_1.Range(pos.lineNumber, start, pos.lineNumber, start + matchingExpression.length);
            }
            if (!matchingExpression) {
                return Promise.resolve(this.hide());
            }
            let expression;
            if (session.capabilities.supportsEvaluateForHovers) {
                expression = new debugModel_1.Expression(matchingExpression);
                await expression.evaluate(session, this.debugService.getViewModel().focusedStackFrame, 'hover');
            }
            else {
                const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                if (focusedStackFrame) {
                    expression = await findExpressionInStackFrame(focusedStackFrame, arrays_1.coalesce(matchingExpression.split('.').map(word => word.trim())));
                }
            }
            if (!expression || (expression instanceof debugModel_1.Expression && !expression.available)) {
                this.hide();
                return;
            }
            if (rng) {
                this.highlightDecorations = this.editor.deltaDecorations(this.highlightDecorations, [{
                        range: rng,
                        options: DebugHoverWidget._HOVER_HIGHLIGHT_DECORATION_OPTIONS
                    }]);
            }
            return this.doShow(pos, expression, focus);
        }
        async doShow(position, expression, focus, forceValueHover = false) {
            if (!this.domNode) {
                this.create();
            }
            this.showAtPosition = position;
            this._isVisible = true;
            if (!expression.hasChildren || forceValueHover) {
                this.complexValueContainer.hidden = true;
                this.valueContainer.hidden = false;
                baseDebugView_1.renderExpressionValue(expression, this.valueContainer, {
                    showChanged: false,
                    colorize: true
                });
                this.valueContainer.title = '';
                this.editor.layoutContentWidget(this);
                this.scrollbar.scanDomNode();
                if (focus) {
                    this.editor.render();
                    this.valueContainer.focus();
                }
                return Promise.resolve(undefined);
            }
            this.valueContainer.hidden = true;
            await this.tree.setInput(expression);
            this.complexValueTitle.textContent = expression.value;
            this.complexValueTitle.title = expression.value;
            this.layoutTreeAndContainer();
            this.editor.layoutContentWidget(this);
            this.scrollbar.scanDomNode();
            this.tree.scrollTop = 0;
            this.tree.scrollLeft = 0;
            this.complexValueContainer.hidden = false;
            if (focus) {
                this.editor.render();
                this.tree.domFocus();
            }
        }
        layoutTreeAndContainer() {
            const scrollBarHeight = 8;
            const treeHeight = Math.min(MAX_TREE_HEIGHT, this.tree.contentHeight + scrollBarHeight);
            this.treeContainer.style.height = `${treeHeight}px`;
            this.tree.layout(treeHeight, 324);
        }
        hide() {
            if (!this._isVisible) {
                return;
            }
            if (dom.isAncestor(document.activeElement, this.domNode)) {
                this.editor.focus();
            }
            this._isVisible = false;
            this.editor.deltaDecorations(this.highlightDecorations, []);
            this.highlightDecorations = [];
            this.editor.layoutContentWidget(this);
        }
        getPosition() {
            return this._isVisible ? {
                position: this.showAtPosition,
                preference: [
                    1 /* ABOVE */,
                    2 /* BELOW */
                ]
            } : null;
        }
        dispose() {
            this.toDispose = lifecycle.dispose(this.toDispose);
        }
    };
    DebugHoverWidget.ID = 'debug.hoverWidget';
    DebugHoverWidget._HOVER_HIGHLIGHT_DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
        className: 'hoverHighlight'
    });
    DebugHoverWidget = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService)
    ], DebugHoverWidget);
    exports.DebugHoverWidget = DebugHoverWidget;
    class DebugHoverAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize('treeAriaLabel', "Debug Hover");
        }
        getAriaLabel(element) {
            return nls.localize({ key: 'variableAriaLabel', comment: ['Do not translate placholders. Placeholders are name and value of a variable.'] }, "{0}, value {1}, variables, debug", element.name, element.value);
        }
    }
    class DebugHoverDataSource {
        hasChildren(element) {
            return element.hasChildren;
        }
        getChildren(element) {
            return element.getChildren();
        }
    }
    class DebugHoverDelegate {
        getHeight(element) {
            return 18;
        }
        getTemplateId(element) {
            return variablesView_1.VariablesRenderer.ID;
        }
    }
});
//# __sourceMappingURL=debugHover.js.map