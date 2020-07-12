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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/view/renderers/sizeObserver", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/browser/keyboardEvent"], function (require, exports, DOM, async_1, cancellation_1, lifecycle_1, modeService_1, nls, quickInput_1, constants_1, notebookBrowser_1, notebookService_1, sizeObserver_1, notebookCommon_1, keyboardEvent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCell = void 0;
    let CodeCell = class CodeCell extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, templateData, notebookService, quickInputService, _modeService) {
            var _a, _b;
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.notebookService = notebookService;
            this.quickInputService = quickInputService;
            this._modeService = _modeService;
            this.outputResizeListeners = new Map();
            this.outputElements = new Map();
            this._timer = null;
            const width = this.viewCell.layoutInfo.editorWidth;
            const lineNum = this.viewCell.lineCount;
            const lineHeight = ((_a = this.viewCell.layoutInfo.fontInfo) === null || _a === void 0 ? void 0 : _a.lineHeight) || 17;
            const totalHeight = this.viewCell.layoutInfo.editorHeight === 0
                ? lineNum * lineHeight + constants_1.EDITOR_TOP_PADDING + constants_1.EDITOR_BOTTOM_PADDING
                : this.viewCell.layoutInfo.editorHeight;
            this.layoutEditor({
                width: width,
                height: totalHeight
            });
            const cts = new cancellation_1.CancellationTokenSource();
            this._register({ dispose() { cts.dispose(true); } });
            async_1.raceCancellation(viewCell.resolveTextModel(), cts.token).then(model => {
                var _a, _b, _c;
                if (model && templateData.editor) {
                    templateData.editor.setModel(model);
                    viewCell.attachTextEditor(templateData.editor);
                    if (notebookEditor.getActiveCell() === viewCell && viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                        (_a = templateData.editor) === null || _a === void 0 ? void 0 : _a.focus();
                    }
                    const realContentHeight = (_b = templateData.editor) === null || _b === void 0 ? void 0 : _b.getContentHeight();
                    if (realContentHeight !== undefined && realContentHeight !== totalHeight) {
                        this.onCellHeightChange(realContentHeight);
                    }
                    if (this.notebookEditor.getActiveCell() === this.viewCell && viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                        (_c = templateData.editor) === null || _c === void 0 ? void 0 : _c.focus();
                    }
                }
            });
            const updateForFocusMode = () => {
                var _a;
                if (viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                    (_a = templateData.editor) === null || _a === void 0 ? void 0 : _a.focus();
                }
                DOM.toggleClass(templateData.container, 'cell-editor-focus', viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor);
            };
            this._register(viewCell.onDidChangeState((e) => {
                if (!e.focusModeChanged) {
                    return;
                }
                updateForFocusMode();
            }));
            updateForFocusMode();
            (_b = templateData.editor) === null || _b === void 0 ? void 0 : _b.updateOptions({ readOnly: !(viewCell.getEvaluatedMetadata(notebookEditor.viewModel.metadata).editable) });
            this._register(viewCell.onDidChangeState((e) => {
                var _a;
                if (e.metadataChanged) {
                    (_a = templateData.editor) === null || _a === void 0 ? void 0 : _a.updateOptions({ readOnly: !(viewCell.getEvaluatedMetadata(notebookEditor.viewModel.metadata).editable) });
                }
            }));
            this._register(viewCell.onDidChangeState((e) => {
                var _a, _b;
                if (!e.languageChanged) {
                    return;
                }
                const mode = this._modeService.create(viewCell.language);
                (_b = (_a = templateData.editor) === null || _a === void 0 ? void 0 : _a.getModel()) === null || _b === void 0 ? void 0 : _b.setMode(mode.languageIdentifier);
            }));
            this._register(viewCell.onDidChangeLayout((e) => {
                if (e.outerWidth === undefined) {
                    return;
                }
                const layoutInfo = templateData.editor.getLayoutInfo();
                if (layoutInfo.width !== viewCell.layoutInfo.editorWidth) {
                    this.onCellWidthChange();
                }
            }));
            this._register(templateData.editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged) {
                    if (this.viewCell.layoutInfo.editorHeight !== e.contentHeight) {
                        this.onCellHeightChange(e.contentHeight);
                    }
                }
            }));
            this._register(templateData.editor.onDidChangeCursorSelection((e) => {
                if (e.source === 'restoreState') {
                    // do not reveal the cell into view if this selection change was caused by restoring editors...
                    return;
                }
                const primarySelection = templateData.editor.getSelection();
                if (primarySelection) {
                    this.notebookEditor.revealLineInViewAsync(viewCell, primarySelection.positionLineNumber);
                }
            }));
            this._register(viewCell.onDidChangeOutputs((splices) => {
                if (!splices.length) {
                    return;
                }
                const previousOutputHeight = this.viewCell.layoutInfo.outputTotalHeight;
                if (this.viewCell.outputs.length) {
                    this.templateData.outputContainer.style.display = 'block';
                }
                else {
                    this.templateData.outputContainer.style.display = 'none';
                }
                let reversedSplices = splices.reverse();
                reversedSplices.forEach(splice => {
                    viewCell.spliceOutputHeights(splice[0], splice[1], splice[2].map(_ => 0));
                });
                let removedKeys = [];
                this.outputElements.forEach((value, key) => {
                    var _a, _b;
                    if (viewCell.outputs.indexOf(key) < 0) {
                        // already removed
                        removedKeys.push(key);
                        // remove element from DOM
                        (_b = (_a = this.templateData) === null || _a === void 0 ? void 0 : _a.outputContainer) === null || _b === void 0 ? void 0 : _b.removeChild(value);
                        this.notebookEditor.removeInset(key);
                    }
                });
                removedKeys.forEach(key => {
                    // remove element cache
                    this.outputElements.delete(key);
                    // remove elment resize listener if there is one
                    this.outputResizeListeners.delete(key);
                });
                let prevElement = undefined;
                [...this.viewCell.outputs].reverse().forEach(output => {
                    if (this.outputElements.has(output)) {
                        // already exist
                        prevElement = this.outputElements.get(output);
                        return;
                    }
                    // newly added element
                    let currIndex = this.viewCell.outputs.indexOf(output);
                    this.renderOutput(output, currIndex, prevElement);
                    prevElement = this.outputElements.get(output);
                });
                let editorHeight = templateData.editor.getContentHeight();
                viewCell.editorHeight = editorHeight;
                if (previousOutputHeight === 0 || this.viewCell.outputs.length === 0) {
                    // first execution or removing all outputs
                    this.relayoutCell();
                }
                else {
                    this.relayoutCellDebounced();
                }
            }));
            this._register(viewCell.onDidChangeLayout(() => {
                this.outputElements.forEach((value, key) => {
                    const index = viewCell.outputs.indexOf(key);
                    if (index >= 0) {
                        const top = this.viewCell.getOutputOffsetInContainer(index);
                        value.style.top = `${top}px`;
                    }
                });
            }));
            const updateFocusMode = () => viewCell.focusMode = templateData.editor.hasWidgetFocus() ? notebookBrowser_1.CellFocusMode.Editor : notebookBrowser_1.CellFocusMode.Container;
            this._register(templateData.editor.onDidFocusEditorWidget(() => {
                updateFocusMode();
            }));
            this._register(templateData.editor.onDidBlurEditorWidget(() => {
                updateFocusMode();
            }));
            updateFocusMode();
            if (viewCell.outputs.length > 0) {
                let layoutCache = false;
                if (this.viewCell.layoutInfo.totalHeight !== 0 && this.viewCell.layoutInfo.totalHeight > totalHeight) {
                    layoutCache = true;
                    this.relayoutCell();
                }
                this.templateData.outputContainer.style.display = 'block';
                // there are outputs, we need to calcualte their sizes and trigger relayout
                // @TODO@rebornix, if there is no resizable output, we should not check their height individually, which hurts the performance
                for (let index = 0; index < this.viewCell.outputs.length; index++) {
                    const currOutput = this.viewCell.outputs[index];
                    // always add to the end
                    this.renderOutput(currOutput, index, undefined);
                }
                viewCell.editorHeight = totalHeight;
                if (layoutCache) {
                    this.relayoutCellDebounced();
                }
                else {
                    this.relayoutCell();
                }
            }
            else {
                // noop
                viewCell.editorHeight = totalHeight;
                this.relayoutCell();
                this.templateData.outputContainer.style.display = 'none';
            }
        }
        layoutEditor(dimension) {
            var _a;
            (_a = this.templateData.editor) === null || _a === void 0 ? void 0 : _a.layout(dimension);
            this.templateData.statusBarContainer.style.width = `${dimension.width}px`;
        }
        onCellWidthChange() {
            const realContentHeight = this.templateData.editor.getContentHeight();
            this.layoutEditor({
                width: this.viewCell.layoutInfo.editorWidth,
                height: realContentHeight
            });
            this.viewCell.editorHeight = realContentHeight;
            this.relayoutCell();
        }
        onCellHeightChange(newHeight) {
            const viewLayout = this.templateData.editor.getLayoutInfo();
            this.layoutEditor({
                width: viewLayout.width,
                height: newHeight
            });
            this.viewCell.editorHeight = newHeight;
            this.relayoutCell();
        }
        renderOutput(currOutput, index, beforeElement) {
            var _a, _b;
            if (!this.outputResizeListeners.has(currOutput)) {
                this.outputResizeListeners.set(currOutput, new lifecycle_1.DisposableStore());
            }
            let outputItemDiv = document.createElement('div');
            let result = undefined;
            if (currOutput.outputKind === notebookCommon_1.CellOutputKind.Rich) {
                let transformedDisplayOutput = currOutput;
                if (transformedDisplayOutput.orderedMimeTypes.length > 1) {
                    outputItemDiv.style.position = 'relative';
                    const mimeTypePicker = DOM.$('.multi-mimetype-output');
                    DOM.addClasses(mimeTypePicker, 'codicon', 'codicon-code');
                    mimeTypePicker.tabIndex = 0;
                    mimeTypePicker.title = nls.localize('mimeTypePicker', "Choose a different output mimetype, available mimetypes: {0}", transformedDisplayOutput.orderedMimeTypes.map(mimeType => mimeType.mimeType).join(', '));
                    outputItemDiv.appendChild(mimeTypePicker);
                    this.outputResizeListeners.get(currOutput).add(DOM.addStandardDisposableListener(mimeTypePicker, 'mousedown', async (e) => {
                        if (e.leftButton) {
                            e.preventDefault();
                            e.stopPropagation();
                            await this.pickActiveMimeTypeRenderer(transformedDisplayOutput);
                        }
                    }));
                    this.outputResizeListeners.get(currOutput).add((DOM.addDisposableListener(mimeTypePicker, DOM.EventType.KEY_DOWN, async (e) => {
                        const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                        if ((event.equals(3 /* Enter */) || event.equals(10 /* Space */))) {
                            e.preventDefault();
                            e.stopPropagation();
                            await this.pickActiveMimeTypeRenderer(transformedDisplayOutput);
                        }
                    })));
                }
                let pickedMimeTypeRenderer = currOutput.orderedMimeTypes[currOutput.pickedMimeTypeIndex];
                const innerContainer = DOM.$('.output-inner-container');
                DOM.append(outputItemDiv, innerContainer);
                if (pickedMimeTypeRenderer.isResolved) {
                    // html
                    result = this.notebookEditor.getOutputRenderer().render({ outputKind: notebookCommon_1.CellOutputKind.Rich, data: { 'text/html': pickedMimeTypeRenderer.output } }, innerContainer, 'text/html');
                }
                else {
                    result = this.notebookEditor.getOutputRenderer().render(currOutput, innerContainer, pickedMimeTypeRenderer.mimeType);
                }
            }
            else {
                // for text and error, there is no mimetype
                const innerContainer = DOM.$('.output-inner-container');
                DOM.append(outputItemDiv, innerContainer);
                result = this.notebookEditor.getOutputRenderer().render(currOutput, innerContainer, undefined);
            }
            if (!result) {
                this.viewCell.updateOutputHeight(index, 0);
                return;
            }
            this.outputElements.set(currOutput, outputItemDiv);
            if (beforeElement) {
                (_a = this.templateData.outputContainer) === null || _a === void 0 ? void 0 : _a.insertBefore(outputItemDiv, beforeElement);
            }
            else {
                (_b = this.templateData.outputContainer) === null || _b === void 0 ? void 0 : _b.appendChild(outputItemDiv);
            }
            if (result.shadowContent) {
                this.viewCell.selfSizeMonitoring = true;
                this.notebookEditor.createInset(this.viewCell, currOutput, result.shadowContent, this.viewCell.getOutputOffset(index));
            }
            else {
                DOM.addClass(outputItemDiv, 'foreground');
                DOM.addClass(outputItemDiv, 'output-element');
                outputItemDiv.style.position = 'absolute';
            }
            let hasDynamicHeight = result.hasDynamicHeight;
            if (hasDynamicHeight) {
                let clientHeight = outputItemDiv.clientHeight;
                let dimension = {
                    width: this.viewCell.layoutInfo.editorWidth,
                    height: clientHeight
                };
                const elementSizeObserver = sizeObserver_1.getResizesObserver(outputItemDiv, dimension, () => {
                    if (this.templateData.outputContainer && document.body.contains(this.templateData.outputContainer)) {
                        let height = Math.ceil(elementSizeObserver.getHeight());
                        if (clientHeight === height) {
                            return;
                        }
                        const currIndex = this.viewCell.outputs.indexOf(currOutput);
                        if (currIndex < 0) {
                            return;
                        }
                        this.viewCell.updateOutputHeight(currIndex, height);
                        this.relayoutCell();
                    }
                });
                elementSizeObserver.startObserving();
                this.outputResizeListeners.get(currOutput).add(elementSizeObserver);
                this.viewCell.updateOutputHeight(index, clientHeight);
            }
            else {
                if (result.shadowContent) {
                    // webview
                    // noop
                }
                else {
                    // static output
                    let clientHeight = Math.ceil(outputItemDiv.clientHeight);
                    this.viewCell.updateOutputHeight(index, clientHeight);
                    const top = this.viewCell.getOutputOffsetInContainer(index);
                    outputItemDiv.style.top = `${top}px`;
                }
            }
        }
        generateRendererInfo(renderId) {
            if (renderId === undefined || renderId === notebookCommon_1.BUILTIN_RENDERER_ID) {
                return nls.localize('builtinRenderInfo', "built-in");
            }
            let renderInfo = this.notebookService.getRendererInfo(renderId);
            if (renderInfo) {
                return `${renderId} (${renderInfo.extensionId.value})`;
            }
            return nls.localize('builtinRenderInfo', "built-in");
        }
        async pickActiveMimeTypeRenderer(output) {
            var _a, _b, _c;
            let currIndex = output.pickedMimeTypeIndex;
            const items = output.orderedMimeTypes.map((mimeType, index) => ({
                label: mimeType.mimeType,
                id: mimeType.mimeType,
                index: index,
                picked: index === currIndex,
                detail: this.generateRendererInfo(mimeType.rendererId),
                description: index === currIndex ? nls.localize('curruentActiveMimeType', "Currently Active") : undefined
            }));
            const picker = this.quickInputService.createQuickPick();
            picker.items = items;
            picker.activeItems = items.filter(item => !!item.picked);
            picker.placeholder = nls.localize('promptChooseMimeType.placeHolder', "Select output mimetype to render for current output");
            const pick = await new Promise(resolve => {
                picker.onDidAccept(() => {
                    resolve(picker.selectedItems.length === 1 ? picker.selectedItems[0].index : undefined);
                    picker.dispose();
                });
                picker.show();
            });
            if (pick === undefined) {
                return;
            }
            if (pick !== currIndex) {
                // user chooses another mimetype
                let index = this.viewCell.outputs.indexOf(output);
                let nextElement = index + 1 < this.viewCell.outputs.length ? this.outputElements.get(this.viewCell.outputs[index + 1]) : undefined;
                (_a = this.outputResizeListeners.get(output)) === null || _a === void 0 ? void 0 : _a.clear();
                let element = this.outputElements.get(output);
                if (element) {
                    (_c = (_b = this.templateData) === null || _b === void 0 ? void 0 : _b.outputContainer) === null || _c === void 0 ? void 0 : _c.removeChild(element);
                    this.notebookEditor.removeInset(output);
                }
                output.pickedMimeTypeIndex = pick;
                if (!output.orderedMimeTypes[pick].isResolved && output.orderedMimeTypes[pick].rendererId !== notebookCommon_1.BUILTIN_RENDERER_ID) {
                    // since it's not build in renderer and not resolved yet
                    // let's see if we can activate the extension and then render
                    // await this.notebookService.transformSpliceOutputs(this.notebookEditor.textModel!, [[0, 0, output]])
                    const outputRet = await this.notebookService.transformSingleOutput(this.notebookEditor.textModel, output, output.orderedMimeTypes[pick].rendererId, output.orderedMimeTypes[pick].mimeType);
                    if (outputRet) {
                        output.orderedMimeTypes[pick] = outputRet;
                    }
                }
                this.renderOutput(output, index, nextElement);
                this.relayoutCell();
            }
        }
        relayoutCell() {
            if (this._timer !== null) {
                clearTimeout(this._timer);
            }
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        relayoutCellDebounced() {
            clearTimeout(this._timer);
            this._timer = setTimeout(() => {
                this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
                this._timer = null;
            }, 200);
        }
        dispose() {
            this.viewCell.detachTextEditor();
            this.outputResizeListeners.forEach((value) => {
                value.dispose();
            });
            this.templateData.focusIndicator.style.height = 'initial';
            super.dispose();
        }
    };
    CodeCell = __decorate([
        __param(3, notebookService_1.INotebookService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, modeService_1.IModeService)
    ], CodeCell);
    exports.CodeCell = CodeCell;
});
//# __sourceMappingURL=codeCell.js.map