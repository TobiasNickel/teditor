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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/list", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/common/core/range", "vs/editor/common/viewModel/prefixSumComputer", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/numbers", "vs/workbench/contrib/notebook/browser/constants"], function (require, exports, DOM, list_1, event_1, lifecycle_1, platform_1, range_1, prefixSumComputer_1, configuration_1, keybinding_1, listService_1, themeService_1, notebookBrowser_1, notebookCommon_1, numbers_1, constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellList = void 0;
    let NotebookCellList = class NotebookCellList extends listService_1.WorkbenchList {
        constructor(listUser, container, delegate, renderers, contextKeyService, options, listService, themeService, configurationService, keybindingService) {
            super(listUser, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService);
            this.listUser = listUser;
            this._previousFocusedElements = [];
            this._localDisposableStore = new lifecycle_1.DisposableStore();
            this._viewModelStore = new lifecycle_1.DisposableStore();
            this._onDidRemoveOutput = new event_1.Emitter();
            this.onDidRemoveOutput = this._onDidRemoveOutput.event;
            this._onDidHideOutput = new event_1.Emitter();
            this.onDidHideOutput = this._onDidHideOutput.event;
            this._viewModel = null;
            this._hiddenRangeIds = [];
            this.hiddenRangesPrefixSum = null;
            this._previousFocusedElements = this.getFocusedElements();
            this._localDisposableStore.add(this.onDidChangeFocus((e) => {
                this._previousFocusedElements.forEach(element => {
                    if (e.elements.indexOf(element) < 0) {
                        element.onDeselect();
                    }
                });
                this._previousFocusedElements = e.elements;
                if (document.activeElement && document.activeElement.classList.contains('webview')) {
                    super.domFocus();
                }
            }));
            const notebookEditorCursorAtBoundaryContext = notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.bindTo(contextKeyService);
            notebookEditorCursorAtBoundaryContext.set('none');
            let cursorSelectionListener = null;
            let textEditorAttachListener = null;
            const recomputeContext = (element) => {
                switch (element.cursorAtBoundary()) {
                    case notebookBrowser_1.CursorAtBoundary.Both:
                        notebookEditorCursorAtBoundaryContext.set('both');
                        break;
                    case notebookBrowser_1.CursorAtBoundary.Top:
                        notebookEditorCursorAtBoundaryContext.set('top');
                        break;
                    case notebookBrowser_1.CursorAtBoundary.Bottom:
                        notebookEditorCursorAtBoundaryContext.set('bottom');
                        break;
                    default:
                        notebookEditorCursorAtBoundaryContext.set('none');
                        break;
                }
                return;
            };
            // Cursor Boundary context
            this._localDisposableStore.add(this.onDidChangeFocus((e) => {
                if (e.elements.length) {
                    cursorSelectionListener === null || cursorSelectionListener === void 0 ? void 0 : cursorSelectionListener.dispose();
                    textEditorAttachListener === null || textEditorAttachListener === void 0 ? void 0 : textEditorAttachListener.dispose();
                    // we only validate the first focused element
                    const focusedElement = e.elements[0];
                    cursorSelectionListener = focusedElement.onDidChangeState((e) => {
                        if (e.selectionChanged) {
                            recomputeContext(focusedElement);
                        }
                    });
                    textEditorAttachListener = focusedElement.onDidChangeEditorAttachState(() => {
                        if (focusedElement.editorAttached) {
                            recomputeContext(focusedElement);
                        }
                    });
                    recomputeContext(focusedElement);
                    return;
                }
                // reset context
                notebookEditorCursorAtBoundaryContext.set('none');
            }));
            this._localDisposableStore.add(this.view.onMouseDblClick(() => {
                const focus = this.getFocusedElements()[0];
                if (focus && focus.cellKind === notebookCommon_1.CellKind.Markdown) {
                    focus.editState = notebookBrowser_1.CellEditState.Editing;
                    focus.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                }
            }));
        }
        get onWillScroll() { return this.view.onWillScroll; }
        get rowsContainer() {
            return this.view.containerDomNode;
        }
        elementAt(position) {
            if (!this.view.length) {
                return undefined;
            }
            const idx = this.view.indexAt(position);
            const clamped = numbers_1.clamp(idx, 0, this.view.length - 1);
            return this.element(clamped);
        }
        elementHeight(element) {
            let index = this._getViewIndexUpperBound(element);
            if (index === undefined || index < 0 || index >= this.length) {
                this._getViewIndexUpperBound(element);
                throw new list_1.ListError(this.listUser, `Invalid index ${index}`);
            }
            return this.view.elementHeight(index);
        }
        detachViewModel() {
            this._viewModelStore.clear();
            this._viewModel = null;
            this.hiddenRangesPrefixSum = null;
        }
        attachViewModel(model) {
            this._viewModel = model;
            this._viewModelStore.add(model.onDidChangeViewCells((e) => {
                const currentRanges = this._hiddenRangeIds.map(id => this._viewModel.getTrackedRange(id)).filter(range => range !== null);
                const newVisibleViewCells = notebookBrowser_1.getVisibleCells(this._viewModel.viewCells, currentRanges);
                const oldVisibleViewCells = [];
                const oldViewCellMapping = new Set();
                for (let i = 0; i < this.length; i++) {
                    oldVisibleViewCells.push(this.element(i));
                    oldViewCellMapping.add(this.element(i).uri.toString());
                }
                const viewDiffs = notebookCommon_1.diff(oldVisibleViewCells, newVisibleViewCells, a => {
                    return oldViewCellMapping.has(a.uri.toString());
                });
                if (e.synchronous) {
                    viewDiffs.reverse().forEach((diff) => {
                        // remove output in the webview
                        const hideOutputs = [];
                        const deletedOutputs = [];
                        for (let i = diff.start; i < diff.start + diff.deleteCount; i++) {
                            const cell = this.element(i);
                            if (this._viewModel.hasCell(cell.handle)) {
                                hideOutputs.push(...cell === null || cell === void 0 ? void 0 : cell.model.outputs);
                            }
                            else {
                                deletedOutputs.push(...cell === null || cell === void 0 ? void 0 : cell.model.outputs);
                            }
                        }
                        this.splice2(diff.start, diff.deleteCount, diff.toInsert);
                        hideOutputs.forEach(output => this._onDidHideOutput.fire(output));
                        deletedOutputs.forEach(output => this._onDidRemoveOutput.fire(output));
                    });
                }
                else {
                    DOM.scheduleAtNextAnimationFrame(() => {
                        viewDiffs.reverse().forEach((diff) => {
                            const hideOutputs = [];
                            const deletedOutputs = [];
                            for (let i = diff.start; i < diff.start + diff.deleteCount; i++) {
                                const cell = this.element(i);
                                if (this._viewModel.hasCell(cell.handle)) {
                                    hideOutputs.push(...cell === null || cell === void 0 ? void 0 : cell.model.outputs);
                                }
                                else {
                                    deletedOutputs.push(...cell === null || cell === void 0 ? void 0 : cell.model.outputs);
                                }
                            }
                            this.splice2(diff.start, diff.deleteCount, diff.toInsert);
                            hideOutputs.forEach(output => this._onDidHideOutput.fire(output));
                            deletedOutputs.forEach(output => this._onDidRemoveOutput.fire(output));
                        });
                    });
                }
            }));
            this._viewModelStore.add(model.onDidChangeSelection(() => {
                // convert model selections to view selections
                const viewSelections = model.selectionHandles.map(handle => {
                    return model.getCellByHandle(handle);
                }).filter(cell => !!cell).map(cell => this._getViewIndexUpperBound(cell));
                this.setFocus(viewSelections, undefined, true);
            }));
            const hiddenRanges = model.getHiddenRanges();
            this.setHiddenAreas(hiddenRanges, false);
            const newRanges = notebookBrowser_1.reduceCellRanges(hiddenRanges);
            const viewCells = model.viewCells.slice(0);
            newRanges.reverse().forEach(range => {
                viewCells.splice(range.start, range.end - range.start + 1);
            });
            this.splice2(0, 0, viewCells);
        }
        clear() {
            super.splice(0, this.length);
        }
        setHiddenAreas(_ranges, triggerViewUpdate) {
            if (!this._viewModel) {
                return false;
            }
            const newRanges = notebookBrowser_1.reduceCellRanges(_ranges);
            // delete old tracking ranges
            const oldRanges = this._hiddenRangeIds.map(id => this._viewModel.getTrackedRange(id)).filter(range => range !== null);
            if (newRanges.length === oldRanges.length) {
                let hasDifference = false;
                for (let i = 0; i < newRanges.length; i++) {
                    if (!(newRanges[i].start === oldRanges[i].start && newRanges[i].end === oldRanges[i].end)) {
                        hasDifference = true;
                        break;
                    }
                }
                if (!hasDifference) {
                    return false;
                }
            }
            this._hiddenRangeIds.forEach(id => this._viewModel.setTrackedRange(id, null, 3 /* GrowsOnlyWhenTypingAfter */));
            const hiddenAreaIds = newRanges.map(range => this._viewModel.setTrackedRange(null, range, 3 /* GrowsOnlyWhenTypingAfter */)).filter(id => id !== null);
            this._hiddenRangeIds = hiddenAreaIds;
            // set hidden ranges prefix sum
            let start = 0;
            let index = 0;
            let ret = [];
            while (index < newRanges.length) {
                for (let j = start; j < newRanges[index].start - 1; j++) {
                    ret.push(1);
                }
                ret.push(newRanges[index].end - newRanges[index].start + 1 + 1);
                start = newRanges[index].end + 1;
                index++;
            }
            for (let i = start; i < this._viewModel.length; i++) {
                ret.push(1);
            }
            const values = new Uint32Array(ret.length);
            for (let i = 0; i < ret.length; i++) {
                values[i] = ret[i];
            }
            this.hiddenRangesPrefixSum = new prefixSumComputer_1.PrefixSumComputer(values);
            if (triggerViewUpdate) {
                this.updateHiddenAreasInView(oldRanges, newRanges);
            }
            return true;
        }
        /**
         * oldRanges and newRanges are all reduced and sorted.
         */
        updateHiddenAreasInView(oldRanges, newRanges) {
            const oldViewCellEntries = notebookBrowser_1.getVisibleCells(this._viewModel.viewCells, oldRanges);
            const oldViewCellMapping = new Set();
            oldViewCellEntries.forEach(cell => {
                oldViewCellMapping.add(cell.uri.toString());
            });
            const newViewCellEntries = notebookBrowser_1.getVisibleCells(this._viewModel.viewCells, newRanges);
            const viewDiffs = notebookCommon_1.diff(oldViewCellEntries, newViewCellEntries, a => {
                return oldViewCellMapping.has(a.uri.toString());
            });
            viewDiffs.reverse().forEach((diff) => {
                // remove output in the webview
                const hideOutputs = [];
                const deletedOutputs = [];
                for (let i = diff.start; i < diff.start + diff.deleteCount; i++) {
                    const cell = this.element(i);
                    if (this._viewModel.hasCell(cell.handle)) {
                        hideOutputs.push(...cell === null || cell === void 0 ? void 0 : cell.model.outputs);
                    }
                    else {
                        deletedOutputs.push(...cell === null || cell === void 0 ? void 0 : cell.model.outputs);
                    }
                }
                this.splice2(diff.start, diff.deleteCount, diff.toInsert);
                hideOutputs.forEach(output => this._onDidHideOutput.fire(output));
                deletedOutputs.forEach(output => this._onDidRemoveOutput.fire(output));
            });
        }
        splice2(start, deleteCount, elements = []) {
            // we need to convert start and delete count based on hidden ranges
            super.splice(start, deleteCount, elements);
            const selectionsLeft = [];
            this._viewModel.selectionHandles.forEach(handle => {
                if (this._viewModel.hasCell(handle)) {
                    selectionsLeft.push(handle);
                }
            });
            if (!selectionsLeft.length && this._viewModel.viewCells.length) {
                // after splice, the selected cells are deleted
                this._viewModel.selectionHandles = [this._viewModel.viewCells[0].handle];
            }
        }
        getViewIndex(cell) {
            const modelIndex = this._viewModel.getCellIndex(cell);
            if (!this.hiddenRangesPrefixSum) {
                return modelIndex;
            }
            const viewIndexInfo = this.hiddenRangesPrefixSum.getIndexOf(modelIndex);
            if (viewIndexInfo.remainder !== 0) {
                return undefined;
            }
            else {
                return viewIndexInfo.index;
            }
        }
        _getViewIndexUpperBound(cell) {
            const modelIndex = this._viewModel.getCellIndex(cell);
            if (!this.hiddenRangesPrefixSum) {
                return modelIndex;
            }
            const viewIndexInfo = this.hiddenRangesPrefixSum.getIndexOf(modelIndex);
            return viewIndexInfo.index;
        }
        focusElement(cell) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                this.setFocus([index]);
            }
        }
        selectElement(cell) {
            if (this._viewModel) {
                this._viewModel.selectionHandles = [cell.handle];
            }
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                this.setSelection([index]);
                this.setFocus([index]);
            }
        }
        setFocus(indexes, browserEvent, ignoreTextModelUpdate) {
            if (!indexes.length) {
                return;
            }
            if (this._viewModel && !ignoreTextModelUpdate) {
                this._viewModel.selectionHandles = indexes.map(index => this.element(index)).map(cell => cell.handle);
            }
            super.setFocus(indexes, browserEvent);
        }
        revealElementInView(cell) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                this._revealInView(index);
            }
        }
        revealElementInCenterIfOutsideViewport(cell) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                this._revealInCenterIfOutsideViewport(index);
            }
        }
        revealElementInCenter(cell) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                this._revealInCenter(index);
            }
        }
        async revealElementLineInViewAsync(cell, line) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                return this._revealLineInViewAsync(index, line);
            }
        }
        async revealElementLineInCenterAsync(cell, line) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                return this._revealLineInCenterAsync(index, line);
            }
        }
        async revealElementLineInCenterIfOutsideViewportAsync(cell, line) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                return this._revealLineInCenterIfOutsideViewportAsync(index, line);
            }
        }
        async revealElementRangeInViewAsync(cell, range) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                return this._revealRangeInView(index, range);
            }
        }
        async revealElementRangeInCenterAsync(cell, range) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                return this._revealRangeInCenterAsync(index, range);
            }
        }
        async revealElementRangeInCenterIfOutsideViewportAsync(cell, range) {
            const index = this._getViewIndexUpperBound(cell);
            if (index !== undefined) {
                return this._revealRangeInCenterIfOutsideViewportAsync(index, range);
            }
        }
        domElementOfElement(element) {
            const index = this._getViewIndexUpperBound(element);
            if (index !== undefined) {
                return this.view.domElement(index);
            }
            return null;
        }
        focusView() {
            this.view.domNode.focus();
        }
        getAbsoluteTopOfElement(element) {
            let index = this._getViewIndexUpperBound(element);
            if (index === undefined || index < 0 || index >= this.length) {
                this._getViewIndexUpperBound(element);
                throw new list_1.ListError(this.listUser, `Invalid index ${index}`);
            }
            return this.view.elementTop(index);
        }
        triggerScrollFromMouseWheelEvent(browserEvent) {
            this.view.triggerScrollFromMouseWheelEvent(browserEvent);
        }
        updateElementHeight2(element, size) {
            const index = this._getViewIndexUpperBound(element);
            if (index === undefined) {
                return;
            }
            const focused = this.getFocus();
            this.view.updateElementHeight(index, size, focused.length ? focused[0] : null);
        }
        // override
        domFocus() {
            const focused = this.getFocusedElements()[0];
            const focusedDomElement = this.domElementOfElement(focused);
            if (document.activeElement && focusedDomElement && focusedDomElement.contains(document.activeElement)) {
                // for example, when focus goes into monaco editor, if we refocus the list view, the editor will lose focus.
                return;
            }
            if (!platform_1.isMacintosh && document.activeElement && isContextMenuFocused()) {
                return;
            }
            super.domFocus();
        }
        getViewScrollTop() {
            return this.view.getScrollTop();
        }
        getViewScrollBottom() {
            return this.getViewScrollTop() + this.view.renderHeight - constants_1.SCROLLABLE_ELEMENT_PADDING_TOP;
        }
        _revealRange(viewIndex, range, revealType, newlyCreated, alignToBottom) {
            const element = this.view.element(viewIndex);
            const scrollTop = this.getViewScrollTop();
            const wrapperBottom = this.getViewScrollBottom();
            const positionOffset = element.getPositionScrollTopOffset(range.startLineNumber, range.startColumn);
            const elementTop = this.view.elementTop(viewIndex);
            const positionTop = elementTop + positionOffset;
            // TODO@rebornix 30 ---> line height * 1.5
            if (positionTop < scrollTop) {
                this.view.setScrollTop(positionTop - 30);
            }
            else if (positionTop > wrapperBottom) {
                this.view.setScrollTop(scrollTop + positionTop - wrapperBottom + 30);
            }
            else if (newlyCreated) {
                // newly scrolled into view
                if (alignToBottom) {
                    // align to the bottom
                    this.view.setScrollTop(scrollTop + positionTop - wrapperBottom + 30);
                }
                else {
                    // align to to top
                    this.view.setScrollTop(positionTop - 30);
                }
            }
            if (revealType === notebookBrowser_1.CellRevealType.Range) {
                element.revealRangeInCenter(range);
            }
        }
        // List items have real dynamic heights, which means after we set `scrollTop` based on the `elementTop(index)`, the element at `index` might still be removed from the view once all relayouting tasks are done.
        // For example, we scroll item 10 into the view upwards, in the first round, items 7, 8, 9, 10 are all in the viewport. Then item 7 and 8 resize themselves to be larger and finally item 10 is removed from the view.
        // To ensure that item 10 is always there, we need to scroll item 10 to the top edge of the viewport.
        async _revealRangeInternalAsync(viewIndex, range, revealType) {
            const scrollTop = this.getViewScrollTop();
            const wrapperBottom = this.getViewScrollBottom();
            const elementTop = this.view.elementTop(viewIndex);
            const element = this.view.element(viewIndex);
            if (element.editorAttached) {
                this._revealRange(viewIndex, range, revealType, false, false);
            }
            else {
                const elementHeight = this.view.elementHeight(viewIndex);
                let upwards = false;
                if (elementTop + elementHeight < scrollTop) {
                    // scroll downwards
                    this.view.setScrollTop(elementTop);
                    upwards = false;
                }
                else if (elementTop > wrapperBottom) {
                    // scroll upwards
                    this.view.setScrollTop(elementTop - this.view.renderHeight / 2);
                    upwards = true;
                }
                const editorAttachedPromise = new Promise((resolve, reject) => {
                    element.onDidChangeEditorAttachState(() => {
                        element.editorAttached ? resolve() : reject();
                    });
                });
                return editorAttachedPromise.then(() => {
                    this._revealRange(viewIndex, range, revealType, true, upwards);
                });
            }
        }
        async _revealLineInViewAsync(viewIndex, line) {
            return this._revealRangeInternalAsync(viewIndex, new range_1.Range(line, 1, line, 1), notebookBrowser_1.CellRevealType.Line);
        }
        async _revealRangeInView(viewIndex, range) {
            return this._revealRangeInternalAsync(viewIndex, range, notebookBrowser_1.CellRevealType.Range);
        }
        async _revealRangeInCenterInternalAsync(viewIndex, range, revealType) {
            const reveal = (viewIndex, range, revealType) => {
                const element = this.view.element(viewIndex);
                let positionOffset = element.getPositionScrollTopOffset(range.startLineNumber, range.startColumn);
                let positionOffsetInView = this.view.elementTop(viewIndex) + positionOffset;
                this.view.setScrollTop(positionOffsetInView - this.view.renderHeight / 2);
                if (revealType === notebookBrowser_1.CellRevealType.Range) {
                    element.revealRangeInCenter(range);
                }
            };
            const elementTop = this.view.elementTop(viewIndex);
            const viewItemOffset = elementTop;
            this.view.setScrollTop(viewItemOffset - this.view.renderHeight / 2);
            const element = this.view.element(viewIndex);
            if (!element.editorAttached) {
                return getEditorAttachedPromise(element).then(() => reveal(viewIndex, range, revealType));
            }
            else {
                reveal(viewIndex, range, revealType);
            }
        }
        async _revealLineInCenterAsync(viewIndex, line) {
            return this._revealRangeInCenterInternalAsync(viewIndex, new range_1.Range(line, 1, line, 1), notebookBrowser_1.CellRevealType.Line);
        }
        _revealRangeInCenterAsync(viewIndex, range) {
            return this._revealRangeInCenterInternalAsync(viewIndex, range, notebookBrowser_1.CellRevealType.Range);
        }
        async _revealRangeInCenterIfOutsideViewportInternalAsync(viewIndex, range, revealType) {
            const reveal = (viewIndex, range, revealType) => {
                const element = this.view.element(viewIndex);
                let positionOffset = element.getPositionScrollTopOffset(range.startLineNumber, range.startColumn);
                let positionOffsetInView = this.view.elementTop(viewIndex) + positionOffset;
                this.view.setScrollTop(positionOffsetInView - this.view.renderHeight / 2);
                if (revealType === notebookBrowser_1.CellRevealType.Range) {
                    element.revealRangeInCenter(range);
                }
            };
            const scrollTop = this.getViewScrollTop();
            const wrapperBottom = this.getViewScrollBottom();
            const elementTop = this.view.elementTop(viewIndex);
            const viewItemOffset = elementTop;
            const element = this.view.element(viewIndex);
            const positionOffset = viewItemOffset + element.getPositionScrollTopOffset(range.startLineNumber, range.startColumn);
            if (positionOffset < scrollTop || positionOffset > wrapperBottom) {
                // let it render
                this.view.setScrollTop(positionOffset - this.view.renderHeight / 2);
                // after rendering, it might be pushed down due to markdown cell dynamic height
                const elementTop = this.view.elementTop(viewIndex);
                this.view.setScrollTop(elementTop - this.view.renderHeight / 2);
                // reveal editor
                if (!element.editorAttached) {
                    return getEditorAttachedPromise(element).then(() => reveal(viewIndex, range, revealType));
                }
                else {
                    // for example markdown
                }
            }
            else {
                if (element.editorAttached) {
                    element.revealRangeInCenter(range);
                }
                else {
                    // for example, markdown cell in preview mode
                    return getEditorAttachedPromise(element).then(() => reveal(viewIndex, range, revealType));
                }
            }
        }
        async _revealLineInCenterIfOutsideViewportAsync(viewIndex, line) {
            return this._revealRangeInCenterIfOutsideViewportInternalAsync(viewIndex, new range_1.Range(line, 1, line, 1), notebookBrowser_1.CellRevealType.Line);
        }
        async _revealRangeInCenterIfOutsideViewportAsync(viewIndex, range) {
            return this._revealRangeInCenterIfOutsideViewportInternalAsync(viewIndex, range, notebookBrowser_1.CellRevealType.Range);
        }
        _revealInternal(viewIndex, ignoreIfInsideViewport, revealPosition) {
            if (viewIndex >= this.view.length) {
                return;
            }
            const scrollTop = this.getViewScrollTop();
            const wrapperBottom = this.getViewScrollBottom();
            const elementTop = this.view.elementTop(viewIndex);
            if (ignoreIfInsideViewport && elementTop >= scrollTop && elementTop < wrapperBottom) {
                // inside the viewport
                return;
            }
            // first render
            const viewItemOffset = revealPosition === notebookBrowser_1.CellRevealPosition.Top ? elementTop : (elementTop - this.view.renderHeight / 2);
            this.view.setScrollTop(viewItemOffset);
            // second scroll as markdown cell is dynamic
            const newElementTop = this.view.elementTop(viewIndex);
            const newViewItemOffset = revealPosition === notebookBrowser_1.CellRevealPosition.Top ? newElementTop : (newElementTop - this.view.renderHeight / 2);
            this.view.setScrollTop(newViewItemOffset);
        }
        _revealInView(viewIndex) {
            this._revealInternal(viewIndex, true, notebookBrowser_1.CellRevealPosition.Top);
        }
        _revealInCenter(viewIndex) {
            this._revealInternal(viewIndex, false, notebookBrowser_1.CellRevealPosition.Center);
        }
        _revealInCenterIfOutsideViewport(viewIndex) {
            this._revealInternal(viewIndex, true, notebookBrowser_1.CellRevealPosition.Center);
        }
        setCellSelection(cell, range) {
            const element = cell;
            if (element.editorAttached) {
                element.setSelection(range);
            }
            else {
                getEditorAttachedPromise(element).then(() => { element.setSelection(range); });
            }
        }
        style(styles) {
            const selectorSuffix = this.view.domId;
            if (!this.styleElement) {
                this.styleElement = DOM.createStyleSheet(this.view.domNode);
            }
            const suffix = selectorSuffix && `.${selectorSuffix}`;
            const content = [];
            if (styles.listBackground) {
                if (styles.listBackground.isOpaque()) {
                    content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows { background: ${styles.listBackground}; }`);
                }
                else if (!platform_1.isMacintosh) { // subpixel AA doesn't exist in macOS
                    console.warn(`List with id '${selectorSuffix}' was styled with a non-opaque background color. This will break sub-pixel antialiasing.`);
                }
            }
            if (styles.listFocusBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveFocusBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list${suffix}:not(.drop-target) > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { background-color:  ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { color:  ${styles.listHoverForeground}; }`);
            }
            if (styles.listSelectionOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listFocusOutline) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
			`);
            }
            if (styles.listInactiveFocusOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            if (styles.listDropBackground) {
                content.push(`
				.monaco-list${suffix}.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-row.drop-target { background-color: ${styles.listDropBackground} !important; color: inherit !important; }
			`);
            }
            if (styles.listFilterWidgetBackground) {
                content.push(`.monaco-list-type-filter { background-color: ${styles.listFilterWidgetBackground} }`);
            }
            if (styles.listFilterWidgetOutline) {
                content.push(`.monaco-list-type-filter { border: 1px solid ${styles.listFilterWidgetOutline}; }`);
            }
            if (styles.listFilterWidgetNoMatchesOutline) {
                content.push(`.monaco-list-type-filter.no-matches { border: 1px solid ${styles.listFilterWidgetNoMatchesOutline}; }`);
            }
            if (styles.listMatchesShadow) {
                content.push(`.monaco-list-type-filter { box-shadow: 1px 1px 1px ${styles.listMatchesShadow}; }`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.innerHTML) {
                this.styleElement.innerHTML = newStyles;
            }
        }
        dispose() {
            this._viewModelStore.dispose();
            this._localDisposableStore.dispose();
            super.dispose();
        }
    };
    NotebookCellList = __decorate([
        __param(6, listService_1.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], NotebookCellList);
    exports.NotebookCellList = NotebookCellList;
    function getEditorAttachedPromise(element) {
        return new Promise((resolve, reject) => {
            event_1.Event.once(element.onDidChangeEditorAttachState)(() => element.editorAttached ? resolve() : reject());
        });
    }
    function isContextMenuFocused() {
        return !!DOM.findParentWithClass(document.activeElement, 'context-view');
    }
});
//# __sourceMappingURL=notebookCellList.js.map