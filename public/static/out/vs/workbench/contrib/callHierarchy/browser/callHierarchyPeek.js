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
define(["require", "exports", "vs/editor/contrib/peekView/peekView", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/workbench/contrib/callHierarchy/browser/callHierarchyTree", "vs/nls", "vs/editor/common/core/range", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/editor/common/model", "vs/platform/theme/common/themeService", "vs/base/common/actions", "vs/platform/storage/common/storage", "vs/base/common/color", "vs/base/browser/ui/tree/tree", "vs/css!./media/callHierarchy"], function (require, exports, peekView, instantiation_1, listService_1, callHTree, nls_1, range_1, splitview_1, event_1, editorService_1, embeddedCodeEditorWidget_1, resolverService_1, lifecycle_1, model_1, themeService_1, actions_1, storage_1, color_1, tree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallHierarchyTreePeekWidget = void 0;
    var State;
    (function (State) {
        State["Loading"] = "loading";
        State["Message"] = "message";
        State["Data"] = "data";
    })(State || (State = {}));
    class ChangeHierarchyDirectionAction extends actions_1.Action {
        constructor(getDirection, toggleDirection) {
            super('', undefined, '', true, () => {
                toggleDirection();
                update();
                return Promise.resolve();
            });
            const update = () => {
                if (getDirection() === 2 /* CallsFrom */) {
                    this.label = nls_1.localize('toggle.from', "Show Incoming Calls");
                    this.class = 'codicon codicon-call-incoming';
                }
                else {
                    this.label = nls_1.localize('toggle.to', "Showing Outgoing Calls");
                    this.class = 'codicon codicon-call-outgoing';
                }
            };
            update();
        }
    }
    class LayoutInfo {
        constructor(ratio, height) {
            this.ratio = ratio;
            this.height = height;
        }
        static store(info, storageService) {
            storageService.store('callHierarchyPeekLayout', JSON.stringify(info), 0 /* GLOBAL */);
        }
        static retrieve(storageService) {
            const value = storageService.get('callHierarchyPeekLayout', 0 /* GLOBAL */, '{}');
            const defaultInfo = { ratio: 0.7, height: 17 };
            try {
                return Object.assign(Object.assign({}, defaultInfo), JSON.parse(value));
            }
            catch (_a) {
                return defaultInfo;
            }
        }
    }
    class CallHierarchyTree extends listService_1.WorkbenchAsyncDataTree {
    }
    let CallHierarchyTreePeekWidget = class CallHierarchyTreePeekWidget extends peekView.PeekViewWidget {
        constructor(editor, _where, _direction, themeService, _peekViewService, _editorService, _textModelService, _storageService, _instantiationService) {
            super(editor, { showFrame: true, showArrow: true, isResizeable: true, isAccessible: true });
            this._where = _where;
            this._direction = _direction;
            this._peekViewService = _peekViewService;
            this._editorService = _editorService;
            this._textModelService = _textModelService;
            this._storageService = _storageService;
            this._instantiationService = _instantiationService;
            this._treeViewStates = new Map();
            this._previewDisposable = new lifecycle_1.DisposableStore();
            this.create();
            this._peekViewService.addExclusiveWidget(editor, this);
            this._applyTheme(themeService.getColorTheme());
            this._disposables.add(themeService.onDidColorThemeChange(this._applyTheme, this));
            this._disposables.add(this._previewDisposable);
        }
        dispose() {
            LayoutInfo.store(this._layoutInfo, this._storageService);
            this._splitView.dispose();
            this._tree.dispose();
            this._editor.dispose();
            super.dispose();
        }
        get direction() {
            return this._direction;
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(peekView.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: theme.getColor(peekView.peekViewTitleBackground) || color_1.Color.transparent,
                primaryHeadingColor: theme.getColor(peekView.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView.peekViewTitleInfoForeground)
            });
        }
        _getActionBarOptions() {
            return {
                orientation: 1 /* HORIZONTAL_REVERSE */
            };
        }
        _fillBody(parent) {
            this._layoutInfo = LayoutInfo.retrieve(this._storageService);
            this._dim = { height: 0, width: 0 };
            this._parent = parent;
            parent.classList.add('call-hierarchy');
            const message = document.createElement('div');
            message.classList.add('message');
            parent.appendChild(message);
            this._message = message;
            this._message.tabIndex = 0;
            const container = document.createElement('div');
            container.classList.add('results');
            parent.appendChild(container);
            this._splitView = new splitview_1.SplitView(container, { orientation: 1 /* HORIZONTAL */ });
            // editor stuff
            const editorContainer = document.createElement('div');
            editorContainer.classList.add('editor');
            container.appendChild(editorContainer);
            let editorOptions = {
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    alwaysConsumeMouseWheel: false
                },
                overviewRulerLanes: 2,
                fixedOverflowWidgets: true,
                minimap: {
                    enabled: false
                }
            };
            this._editor = this._instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, editorContainer, editorOptions, this.editor);
            // tree stuff
            const treeContainer = document.createElement('div');
            treeContainer.classList.add('tree');
            container.appendChild(treeContainer);
            const options = {
                sorter: new callHTree.Sorter(),
                accessibilityProvider: new callHTree.AccessibilityProvider(() => this._direction),
                identityProvider: new callHTree.IdentityProvider(() => this._direction),
                expandOnlyOnTwistieClick: true,
                overrideStyles: {
                    listBackground: peekView.peekViewResultsBackground
                }
            };
            this._tree = this._instantiationService.createInstance(CallHierarchyTree, 'CallHierarchyPeek', treeContainer, new callHTree.VirtualDelegate(), [this._instantiationService.createInstance(callHTree.CallRenderer)], this._instantiationService.createInstance(callHTree.DataSource, () => this._direction), options);
            // split stuff
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: editorContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    if (this._dim.height) {
                        this._editor.layout({ height: this._dim.height, width });
                    }
                }
            }, splitview_1.Sizing.Distribute);
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    if (this._dim.height) {
                        this._tree.layout(this._dim.height, width);
                    }
                }
            }, splitview_1.Sizing.Distribute);
            this._disposables.add(this._splitView.onDidSashChange(() => {
                if (this._dim.width) {
                    this._layoutInfo.ratio = this._splitView.getViewSize(0) / this._dim.width;
                }
            }));
            // update editor
            this._disposables.add(this._tree.onDidChangeFocus(this._updatePreview, this));
            this._disposables.add(this._editor.onMouseDown(e => {
                const { event, target } = e;
                if (event.detail !== 2) {
                    return;
                }
                const [focus] = this._tree.getFocus();
                if (!focus) {
                    return;
                }
                this.dispose();
                this._editorService.openEditor({
                    resource: focus.item.uri,
                    options: { selection: target.range }
                });
            }));
            this._disposables.add(this._tree.onMouseDblClick(e => {
                if (e.target === tree_1.TreeMouseEventTarget.Twistie) {
                    return;
                }
                if (e.element) {
                    this.dispose();
                    this._editorService.openEditor({
                        resource: e.element.item.uri,
                        options: { selection: e.element.item.selectionRange }
                    });
                }
            }));
            this._disposables.add(this._tree.onDidChangeSelection(e => {
                const [element] = e.elements;
                // don't close on click
                if (element && e.browserEvent instanceof KeyboardEvent) {
                    this.dispose();
                    this._editorService.openEditor({
                        resource: element.item.uri,
                        options: { selection: element.item.selectionRange }
                    });
                }
            }));
        }
        async _updatePreview() {
            const [element] = this._tree.getFocus();
            if (!element) {
                return;
            }
            this._previewDisposable.clear();
            // update: editor and editor highlights
            const options = {
                stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
                className: 'call-decoration',
                overviewRuler: {
                    color: themeService_1.themeColorFromId(peekView.peekViewEditorMatchHighlight),
                    position: model_1.OverviewRulerLane.Center
                },
            };
            let previewUri;
            if (this._direction === 2 /* CallsFrom */) {
                // outgoing calls: show caller and highlight focused calls
                previewUri = element.parent ? element.parent.item.uri : element.model.root.uri;
            }
            else {
                // incoming calls: show caller and highlight focused calls
                previewUri = element.item.uri;
            }
            const value = await this._textModelService.createModelReference(previewUri);
            this._editor.setModel(value.object.textEditorModel);
            // set decorations for caller ranges (if in the same file)
            let decorations = [];
            let fullRange;
            let locations = element.locations;
            if (!locations) {
                locations = [{ uri: element.item.uri, range: element.item.selectionRange }];
            }
            for (const loc of locations) {
                if (loc.uri.toString() === previewUri.toString()) {
                    decorations.push({ range: loc.range, options });
                    fullRange = !fullRange ? loc.range : range_1.Range.plusRange(loc.range, fullRange);
                }
            }
            if (fullRange) {
                this._editor.revealRangeInCenter(fullRange, 1 /* Immediate */);
                const ids = this._editor.deltaDecorations([], decorations);
                this._previewDisposable.add(lifecycle_1.toDisposable(() => this._editor.deltaDecorations(ids, [])));
            }
            this._previewDisposable.add(value);
            // update: title
            const title = this._direction === 2 /* CallsFrom */
                ? nls_1.localize('callFrom', "Calls from '{0}'", element.model.root.name)
                : nls_1.localize('callsTo', "Callers of '{0}'", element.model.root.name);
            this.setTitle(title);
        }
        showLoading() {
            this._parent.dataset['state'] = "loading" /* Loading */;
            this.setTitle(nls_1.localize('title.loading', "Loading..."));
            this._show();
        }
        showMessage(message) {
            this._parent.dataset['state'] = "message" /* Message */;
            this.setTitle('');
            this.setMetaTitle('');
            this._message.innerText = message;
            this._show();
            this._message.focus();
        }
        async showModel(model) {
            this._show();
            const viewState = this._treeViewStates.get(this._direction);
            await this._tree.setInput(model, viewState);
            const root = this._tree.getNode(model).children[0];
            await this._tree.expand(root.element);
            if (root.children.length === 0) {
                //
                this.showMessage(this._direction === 2 /* CallsFrom */
                    ? nls_1.localize('empt.callsFrom', "No calls from '{0}'", model.root.name)
                    : nls_1.localize('empt.callsTo', "No callers of '{0}'", model.root.name));
            }
            else {
                this._parent.dataset['state'] = "data" /* Data */;
                if (!viewState || this._tree.getFocus().length === 0) {
                    this._tree.setFocus([root.children[0].element]);
                }
                this._tree.domFocus();
                this._updatePreview();
            }
            if (!this._changeDirectionAction) {
                this._changeDirectionAction = new ChangeHierarchyDirectionAction(() => this._direction, () => this.toggleDirection());
                this._disposables.add(this._changeDirectionAction);
                this._actionbarWidget.push(this._changeDirectionAction, { icon: true, label: false });
            }
        }
        getModel() {
            return this._tree.getInput();
        }
        getFocused() {
            return this._tree.getFocus()[0];
        }
        async toggleDirection() {
            const model = this._tree.getInput();
            if (model) {
                const newDirection = this._direction === 1 /* CallsTo */ ? 2 /* CallsFrom */ : 1 /* CallsTo */;
                this._treeViewStates.set(this._direction, this._tree.getViewState());
                this._direction = newDirection;
                await this.showModel(model);
            }
        }
        _show() {
            if (!this._isShowing) {
                this.editor.revealLineInCenterIfOutsideViewport(this._where.lineNumber, 0 /* Smooth */);
                super.show(range_1.Range.fromPositions(this._where), this._layoutInfo.height);
            }
        }
        _onWidth(width) {
            if (this._dim) {
                this._doLayoutBody(this._dim.height, width);
            }
        }
        _doLayoutBody(height, width) {
            if (this._dim.height !== height || this._dim.width !== width) {
                super._doLayoutBody(height, width);
                this._dim = { height, width };
                this._layoutInfo.height = this._viewZone ? this._viewZone.heightInLines : this._layoutInfo.height;
                this._splitView.layout(width);
                this._splitView.resizeView(0, width * this._layoutInfo.ratio);
            }
        }
    };
    CallHierarchyTreePeekWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, peekView.IPeekViewService),
        __param(5, editorService_1.IEditorService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, storage_1.IStorageService),
        __param(8, instantiation_1.IInstantiationService)
    ], CallHierarchyTreePeekWidget);
    exports.CallHierarchyTreePeekWidget = CallHierarchyTreePeekWidget;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const referenceHighlightColor = theme.getColor(peekView.peekViewEditorMatchHighlight);
        if (referenceHighlightColor) {
            collector.addRule(`.monaco-editor .call-hierarchy .call-decoration { background-color: ${referenceHighlightColor}; }`);
        }
        const referenceHighlightBorder = theme.getColor(peekView.peekViewEditorMatchHighlightBorder);
        if (referenceHighlightBorder) {
            collector.addRule(`.monaco-editor .call-hierarchy .call-decoration { border: 2px solid ${referenceHighlightBorder}; box-sizing: border-box; }`);
        }
        const resultsBackground = theme.getColor(peekView.peekViewResultsBackground);
        if (resultsBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree { background-color: ${resultsBackground}; }`);
        }
        const resultsMatchForeground = theme.getColor(peekView.peekViewResultsFileForeground);
        if (resultsMatchForeground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree { color: ${resultsMatchForeground}; }`);
        }
        const resultsSelectedBackground = theme.getColor(peekView.peekViewResultsSelectionBackground);
        if (resultsSelectedBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { background-color: ${resultsSelectedBackground}; }`);
        }
        const resultsSelectedForeground = theme.getColor(peekView.peekViewResultsSelectionForeground);
        if (resultsSelectedForeground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { color: ${resultsSelectedForeground} !important; }`);
        }
        const editorBackground = theme.getColor(peekView.peekViewEditorBackground);
        if (editorBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .editor .monaco-editor .monaco-editor-background,` +
                `.monaco-editor .call-hierarchy .editor .monaco-editor .inputarea.ime-input {` +
                `	background-color: ${editorBackground};` +
                `}`);
        }
        const editorGutterBackground = theme.getColor(peekView.peekViewEditorGutterBackground);
        if (editorGutterBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .editor .monaco-editor .margin {` +
                `	background-color: ${editorGutterBackground};` +
                `}`);
        }
    });
});
//# __sourceMappingURL=callHierarchyPeek.js.map