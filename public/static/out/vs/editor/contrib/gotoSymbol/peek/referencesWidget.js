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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/peek/referencesTree", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/contrib/peekView/peekView", "../referencesModel", "vs/base/browser/ui/splitview/splitview", "vs/platform/undoRedo/common/undoRedo", "vs/css!./referencesWidget"], function (require, exports, dom, color_1, event_1, lifecycle_1, network_1, resources_1, embeddedCodeEditorWidget_1, range_1, textModel_1, resolverService_1, referencesTree_1, nls, instantiation_1, label_1, listService_1, colorRegistry_1, themeService_1, peekView, referencesModel_1, splitview_1, undoRedo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReferenceWidget = exports.LayoutData = void 0;
    class DecorationsManager {
        constructor(_editor, _model) {
            this._editor = _editor;
            this._model = _model;
            this._decorations = new Map();
            this._decorationIgnoreSet = new Set();
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._callOnModelChange = new lifecycle_1.DisposableStore();
            this._callOnDispose.add(this._editor.onDidChangeModel(() => this._onModelChanged()));
            this._onModelChanged();
        }
        dispose() {
            this._callOnModelChange.dispose();
            this._callOnDispose.dispose();
            this.removeDecorations();
        }
        _onModelChanged() {
            this._callOnModelChange.clear();
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            for (let ref of this._model.references) {
                if (ref.uri.toString() === model.uri.toString()) {
                    this._addDecorations(ref.parent);
                    return;
                }
            }
        }
        _addDecorations(reference) {
            if (!this._editor.hasModel()) {
                return;
            }
            this._callOnModelChange.add(this._editor.getModel().onDidChangeDecorations(() => this._onDecorationChanged()));
            const newDecorations = [];
            const newDecorationsActualIndex = [];
            for (let i = 0, len = reference.children.length; i < len; i++) {
                let oneReference = reference.children[i];
                if (this._decorationIgnoreSet.has(oneReference.id)) {
                    continue;
                }
                if (oneReference.uri.toString() !== this._editor.getModel().uri.toString()) {
                    continue;
                }
                newDecorations.push({
                    range: oneReference.range,
                    options: DecorationsManager.DecorationOptions
                });
                newDecorationsActualIndex.push(i);
            }
            const decorations = this._editor.deltaDecorations([], newDecorations);
            for (let i = 0; i < decorations.length; i++) {
                this._decorations.set(decorations[i], reference.children[newDecorationsActualIndex[i]]);
            }
        }
        _onDecorationChanged() {
            const toRemove = [];
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            for (let [decorationId, reference] of this._decorations) {
                const newRange = model.getDecorationRange(decorationId);
                if (!newRange) {
                    continue;
                }
                let ignore = false;
                if (range_1.Range.equalsRange(newRange, reference.range)) {
                    continue;
                }
                if (range_1.Range.spansMultipleLines(newRange)) {
                    ignore = true;
                }
                else {
                    const lineLength = reference.range.endColumn - reference.range.startColumn;
                    const newLineLength = newRange.endColumn - newRange.startColumn;
                    if (lineLength !== newLineLength) {
                        ignore = true;
                    }
                }
                if (ignore) {
                    this._decorationIgnoreSet.add(reference.id);
                    toRemove.push(decorationId);
                }
                else {
                    reference.range = newRange;
                }
            }
            for (let i = 0, len = toRemove.length; i < len; i++) {
                this._decorations.delete(toRemove[i]);
            }
            this._editor.deltaDecorations(toRemove, []);
        }
        removeDecorations() {
            this._editor.deltaDecorations([...this._decorations.keys()], []);
            this._decorations.clear();
        }
    }
    DecorationsManager.DecorationOptions = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'reference-decoration'
    });
    class LayoutData {
        constructor() {
            this.ratio = 0.7;
            this.heightInLines = 18;
        }
        static fromJSON(raw) {
            let ratio;
            let heightInLines;
            try {
                const data = JSON.parse(raw);
                ratio = data.ratio;
                heightInLines = data.heightInLines;
            }
            catch (_a) {
                //
            }
            return {
                ratio: ratio || 0.7,
                heightInLines: heightInLines || 18
            };
        }
    }
    exports.LayoutData = LayoutData;
    class ReferencesTree extends listService_1.WorkbenchAsyncDataTree {
    }
    /**
     * ZoneWidget that is shown inside the editor
     */
    let ReferenceWidget = class ReferenceWidget extends peekView.PeekViewWidget {
        constructor(editor, _defaultTreeKeyboardSupport, layoutData, themeService, _textModelResolverService, _instantiationService, _peekViewService, _uriLabel, _undoRedoService) {
            super(editor, { showFrame: false, showArrow: true, isResizeable: true, isAccessible: true });
            this._defaultTreeKeyboardSupport = _defaultTreeKeyboardSupport;
            this.layoutData = layoutData;
            this._textModelResolverService = _textModelResolverService;
            this._instantiationService = _instantiationService;
            this._peekViewService = _peekViewService;
            this._uriLabel = _uriLabel;
            this._undoRedoService = _undoRedoService;
            this._disposeOnNewModel = new lifecycle_1.DisposableStore();
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._onDidSelectReference = new event_1.Emitter();
            this.onDidSelectReference = this._onDidSelectReference.event;
            this._dim = { height: 0, width: 0 };
            this._applyTheme(themeService.getColorTheme());
            this._callOnDispose.add(themeService.onDidColorThemeChange(this._applyTheme.bind(this)));
            this._peekViewService.addExclusiveWidget(editor, this);
            this.create();
        }
        dispose() {
            this.setModel(undefined);
            this._callOnDispose.dispose();
            this._disposeOnNewModel.dispose();
            lifecycle_1.dispose(this._preview);
            lifecycle_1.dispose(this._previewNotAvailableMessage);
            lifecycle_1.dispose(this._tree);
            lifecycle_1.dispose(this._previewModelReference);
            this._splitView.dispose();
            super.dispose();
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
        show(where) {
            this.editor.revealRangeInCenterIfOutsideViewport(where, 0 /* Smooth */);
            super.show(where, this.layoutData.heightInLines || 18);
        }
        focusOnReferenceTree() {
            this._tree.domFocus();
        }
        focusOnPreviewEditor() {
            this._preview.focus();
        }
        isPreviewEditorFocused() {
            return this._preview.hasTextFocus();
        }
        _onTitleClick(e) {
            if (this._preview && this._preview.getModel()) {
                this._onDidSelectReference.fire({
                    element: this._getFocusedReference(),
                    kind: e.ctrlKey || e.metaKey || e.altKey ? 'side' : 'open',
                    source: 'title'
                });
            }
        }
        _fillBody(containerElement) {
            this.setCssClass('reference-zone-widget');
            // message pane
            this._messageContainer = dom.append(containerElement, dom.$('div.messages'));
            dom.hide(this._messageContainer);
            this._splitView = new splitview_1.SplitView(containerElement, { orientation: 1 /* HORIZONTAL */ });
            // editor
            this._previewContainer = dom.append(containerElement, dom.$('div.preview.inline'));
            let options = {
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
            this._preview = this._instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, this._previewContainer, options, this.editor);
            dom.hide(this._previewContainer);
            this._previewNotAvailableMessage = new textModel_1.TextModel(nls.localize('missingPreviewMessage', "no preview available"), textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, null, null, this._undoRedoService);
            // tree
            this._treeContainer = dom.append(containerElement, dom.$('div.ref-tree.inline'));
            const treeOptions = {
                keyboardSupport: this._defaultTreeKeyboardSupport,
                accessibilityProvider: new referencesTree_1.AccessibilityProvider(),
                keyboardNavigationLabelProvider: this._instantiationService.createInstance(referencesTree_1.StringRepresentationProvider),
                identityProvider: new referencesTree_1.IdentityProvider(),
                openOnSingleClick: true,
                openOnFocus: true,
                overrideStyles: {
                    listBackground: peekView.peekViewResultsBackground
                }
            };
            this._tree = this._instantiationService.createInstance(ReferencesTree, 'ReferencesWidget', this._treeContainer, new referencesTree_1.Delegate(), [
                this._instantiationService.createInstance(referencesTree_1.FileReferencesRenderer),
                this._instantiationService.createInstance(referencesTree_1.OneReferenceRenderer),
            ], this._instantiationService.createInstance(referencesTree_1.DataSource), treeOptions);
            // split stuff
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: this._previewContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._preview.layout({ height: this._dim.height, width });
                }
            }, splitview_1.Sizing.Distribute);
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: this._treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._treeContainer.style.height = `${this._dim.height}px`;
                    this._treeContainer.style.width = `${width}px`;
                    this._tree.layout(this._dim.height, width);
                }
            }, splitview_1.Sizing.Distribute);
            this._disposables.add(this._splitView.onDidSashChange(() => {
                if (this._dim.width) {
                    this.layoutData.ratio = this._splitView.getViewSize(0) / this._dim.width;
                }
            }, undefined));
            // listen on selection and focus
            let onEvent = (element, kind) => {
                if (element instanceof referencesModel_1.OneReference) {
                    if (kind === 'show') {
                        this._revealReference(element, false);
                    }
                    this._onDidSelectReference.fire({ element, kind, source: 'tree' });
                }
            };
            this._tree.onDidOpen(e => {
                if (e.sideBySide) {
                    onEvent(e.element, 'side');
                }
                else if (e.editorOptions.pinned) {
                    onEvent(e.element, 'goto');
                }
                else {
                    onEvent(e.element, 'show');
                }
            });
            dom.hide(this._treeContainer);
        }
        _onWidth(width) {
            if (this._dim) {
                this._doLayoutBody(this._dim.height, width);
            }
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            super._doLayoutBody(heightInPixel, widthInPixel);
            this._dim = { height: heightInPixel, width: widthInPixel };
            this.layoutData.heightInLines = this._viewZone ? this._viewZone.heightInLines : this.layoutData.heightInLines;
            this._splitView.layout(widthInPixel);
            this._splitView.resizeView(0, widthInPixel * this.layoutData.ratio);
        }
        setSelection(selection) {
            return this._revealReference(selection, true).then(() => {
                if (!this._model) {
                    // disposed
                    return;
                }
                // show in tree
                this._tree.setSelection([selection]);
                this._tree.setFocus([selection]);
            });
        }
        setModel(newModel) {
            // clean up
            this._disposeOnNewModel.clear();
            this._model = newModel;
            if (this._model) {
                return this._onNewModel();
            }
            return Promise.resolve();
        }
        _onNewModel() {
            if (!this._model) {
                return Promise.resolve(undefined);
            }
            if (this._model.isEmpty) {
                this.setTitle('');
                this._messageContainer.innerHTML = nls.localize('noResults', "No results");
                dom.show(this._messageContainer);
                return Promise.resolve(undefined);
            }
            dom.hide(this._messageContainer);
            this._decorationsManager = new DecorationsManager(this._preview, this._model);
            this._disposeOnNewModel.add(this._decorationsManager);
            // listen on model changes
            this._disposeOnNewModel.add(this._model.onDidChangeReferenceRange(reference => this._tree.rerender(reference)));
            // listen on editor
            this._disposeOnNewModel.add(this._preview.onMouseDown(e => {
                const { event, target } = e;
                if (event.detail !== 2) {
                    return;
                }
                const element = this._getFocusedReference();
                if (!element) {
                    return;
                }
                this._onDidSelectReference.fire({
                    element: { uri: element.uri, range: target.range },
                    kind: (event.ctrlKey || event.metaKey || event.altKey) ? 'side' : 'open',
                    source: 'editor'
                });
            }));
            // make sure things are rendered
            this.container.classList.add('results-loaded');
            dom.show(this._treeContainer);
            dom.show(this._previewContainer);
            this._splitView.layout(this._dim.width);
            this.focusOnReferenceTree();
            // pick input and a reference to begin with
            return this._tree.setInput(this._model.groups.length === 1 ? this._model.groups[0] : this._model);
        }
        _getFocusedReference() {
            const [element] = this._tree.getFocus();
            if (element instanceof referencesModel_1.OneReference) {
                return element;
            }
            else if (element instanceof referencesModel_1.FileReferences) {
                if (element.children.length > 0) {
                    return element.children[0];
                }
            }
            return undefined;
        }
        async _revealReference(reference, revealParent) {
            // check if there is anything to do...
            if (this._revealedReference === reference) {
                return;
            }
            this._revealedReference = reference;
            // Update widget header
            if (reference.uri.scheme !== network_1.Schemas.inMemory) {
                this.setTitle(resources_1.basenameOrAuthority(reference.uri), this._uriLabel.getUriLabel(resources_1.dirname(reference.uri)));
            }
            else {
                this.setTitle(nls.localize('peekView.alternateTitle', "References"));
            }
            const promise = this._textModelResolverService.createModelReference(reference.uri);
            if (this._tree.getInput() === reference.parent) {
                this._tree.reveal(reference);
            }
            else {
                if (revealParent) {
                    this._tree.reveal(reference.parent);
                }
                await this._tree.expand(reference.parent);
                this._tree.reveal(reference);
            }
            const ref = await promise;
            if (!this._model) {
                // disposed
                ref.dispose();
                return;
            }
            lifecycle_1.dispose(this._previewModelReference);
            // show in editor
            const model = ref.object;
            if (model) {
                const scrollType = this._preview.getModel() === model.textEditorModel ? 0 /* Smooth */ : 1 /* Immediate */;
                const sel = range_1.Range.lift(reference.range).collapseToStart();
                this._previewModelReference = ref;
                this._preview.setModel(model.textEditorModel);
                this._preview.setSelection(sel);
                this._preview.revealRangeInCenter(sel, scrollType);
            }
            else {
                this._preview.setModel(this._previewNotAvailableMessage);
                ref.dispose();
            }
        }
    };
    ReferenceWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, peekView.IPeekViewService),
        __param(7, label_1.ILabelService),
        __param(8, undoRedo_1.IUndoRedoService)
    ], ReferenceWidget);
    exports.ReferenceWidget = ReferenceWidget;
    // theming
    themeService_1.registerThemingParticipant((theme, collector) => {
        const findMatchHighlightColor = theme.getColor(peekView.peekViewResultsMatchHighlight);
        if (findMatchHighlightColor) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .referenceMatch .highlight { background-color: ${findMatchHighlightColor}; }`);
        }
        const referenceHighlightColor = theme.getColor(peekView.peekViewEditorMatchHighlight);
        if (referenceHighlightColor) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .reference-decoration { background-color: ${referenceHighlightColor}; }`);
        }
        const referenceHighlightBorder = theme.getColor(peekView.peekViewEditorMatchHighlightBorder);
        if (referenceHighlightBorder) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .reference-decoration { border: 2px solid ${referenceHighlightBorder}; box-sizing: border-box; }`);
        }
        const hcOutline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (hcOutline) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .referenceMatch .highlight { border: 1px dotted ${hcOutline}; box-sizing: border-box; }`);
        }
        const resultsBackground = theme.getColor(peekView.peekViewResultsBackground);
        if (resultsBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree { background-color: ${resultsBackground}; }`);
        }
        const resultsMatchForeground = theme.getColor(peekView.peekViewResultsMatchForeground);
        if (resultsMatchForeground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree { color: ${resultsMatchForeground}; }`);
        }
        const resultsFileForeground = theme.getColor(peekView.peekViewResultsFileForeground);
        if (resultsFileForeground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .reference-file { color: ${resultsFileForeground}; }`);
        }
        const resultsSelectedBackground = theme.getColor(peekView.peekViewResultsSelectionBackground);
        if (resultsSelectedBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { background-color: ${resultsSelectedBackground}; }`);
        }
        const resultsSelectedForeground = theme.getColor(peekView.peekViewResultsSelectionForeground);
        if (resultsSelectedForeground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .ref-tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { color: ${resultsSelectedForeground} !important; }`);
        }
        const editorBackground = theme.getColor(peekView.peekViewEditorBackground);
        if (editorBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .monaco-editor .monaco-editor-background,` +
                `.monaco-editor .reference-zone-widget .preview .monaco-editor .inputarea.ime-input {` +
                `	background-color: ${editorBackground};` +
                `}`);
        }
        const editorGutterBackground = theme.getColor(peekView.peekViewEditorGutterBackground);
        if (editorGutterBackground) {
            collector.addRule(`.monaco-editor .reference-zone-widget .preview .monaco-editor .margin {` +
                `	background-color: ${editorGutterBackground};` +
                `}`);
        }
    });
});
//# __sourceMappingURL=referencesWidget.js.map