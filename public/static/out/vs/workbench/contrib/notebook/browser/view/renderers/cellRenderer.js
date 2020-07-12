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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/ui/progressbar/progressbar", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/editor/common/modes/textToHtmlTokenizer", "vs/editor/common/services/modeService", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/contrib/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/renderers/cellMenus", "vs/workbench/contrib/notebook/browser/view/renderers/codeCell", "vs/workbench/contrib/notebook/browser/view/renderers/markdownCell", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/view/renderers/cellContextKeys", "vs/css!vs/workbench/contrib/notebook/browser/media/notebook"], function (require, exports, browser_1, DOM, event_1, progressbar_1, toolbar_1, async_1, codicons_1, color_1, event_2, lifecycle_1, objects_1, platform, codeEditorWidget_1, editorOptions_1, fontInfo_1, range_1, editorContextKeys_1, modes, textToHtmlTokenizer_1, modeService_1, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, keybinding_1, notification_1, constants_1, coreActions_1, notebookBrowser_1, cellMenus_1, codeCell_1, markdownCell_1, codeCellViewModel_1, notebookCommon_1, cellContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimerRenderer = exports.CodeCellRenderer = exports.CellLanguageStatusBarItem = exports.CellDragAndDropController = exports.MarkdownCellRenderer = exports.CellEditorOptions = exports.CodiconActionViewItem = exports.NotebookCellListDelegate = void 0;
    const $ = DOM.$;
    let NotebookCellListDelegate = class NotebookCellListDelegate {
        constructor(configurationService) {
            this.configurationService = configurationService;
            const editorOptions = this.configurationService.getValue('editor');
            this.lineHeight = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.getZoomLevel()).lineHeight;
        }
        getHeight(element) {
            return element.getHeight(this.lineHeight);
        }
        hasDynamicHeight(element) {
            return element.hasDynamicHeight();
        }
        getTemplateId(element) {
            if (element.cellKind === notebookCommon_1.CellKind.Markdown) {
                return MarkdownCellRenderer.TEMPLATE_ID;
            }
            else {
                return CodeCellRenderer.TEMPLATE_ID;
            }
        }
    };
    NotebookCellListDelegate = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], NotebookCellListDelegate);
    exports.NotebookCellListDelegate = NotebookCellListDelegate;
    class CodiconActionViewItem extends menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem {
        constructor(_action, keybindingService, notificationService, contextMenuService) {
            super(_action, keybindingService, notificationService, contextMenuService);
            this._action = _action;
        }
        updateLabel() {
            var _a;
            if (this.options.label && this.label) {
                this.label.innerHTML = codicons_1.renderCodicons((_a = this._commandAction.label) !== null && _a !== void 0 ? _a : '');
            }
        }
    }
    exports.CodiconActionViewItem = CodiconActionViewItem;
    class CellEditorOptions {
        constructor(configurationService, language) {
            this._onDidChange = new event_2.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.disposable = configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor')) {
                    this._value = computeEditorOptions();
                    this._onDidChange.fire(this.value);
                }
            });
            const computeEditorOptions = () => {
                const editorOptions = objects_1.deepClone(configurationService.getValue('editor', { overrideIdentifier: language }));
                return Object.assign(Object.assign({}, editorOptions), CellEditorOptions.fixedEditorOptions);
            };
            this._value = computeEditorOptions();
        }
        dispose() {
            this._onDidChange.dispose();
            this.disposable.dispose();
        }
        get value() {
            return this._value;
        }
        setGlyphMargin(gm) {
            if (gm !== this._value.glyphMargin) {
                this._value.glyphMargin = gm;
                this._onDidChange.fire(this.value);
            }
        }
    }
    exports.CellEditorOptions = CellEditorOptions;
    CellEditorOptions.fixedEditorOptions = {
        padding: {
            top: constants_1.EDITOR_TOP_PADDING,
            bottom: constants_1.EDITOR_BOTTOM_PADDING
        },
        scrollBeyondLastLine: false,
        scrollbar: {
            verticalScrollbarSize: 14,
            horizontal: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            alwaysConsumeMouseWheel: false
        },
        renderLineHighlightOnlyWhenFocus: true,
        overviewRulerLanes: 0,
        selectOnLineNumbers: false,
        lineNumbers: 'off',
        lineDecorationsWidth: 0,
        glyphMargin: false,
        fixedOverflowWidgets: true,
        minimap: { enabled: false },
        renderValidationDecorations: 'on'
    };
    class AbstractCellRenderer {
        constructor(instantiationService, notebookEditor, contextMenuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, language, dndController) {
            this.instantiationService = instantiationService;
            this.notebookEditor = notebookEditor;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextKeyServiceProvider = contextKeyServiceProvider;
            this.dndController = dndController;
            this.editorOptions = new CellEditorOptions(configurationService, language);
        }
        dispose() {
            this.editorOptions.dispose();
        }
        createBetweenCellToolbar(container, disposables, contextKeyService) {
            const toolbar = new toolbar_1.ToolBar(container, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new CodiconActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
                        return item;
                    }
                    return undefined;
                }
            });
            toolbar.getContainer().style.height = `${constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT}px`;
            container.style.height = `${constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT}px`;
            const cellMenu = this.instantiationService.createInstance(cellMenus_1.CellMenus);
            const menu = disposables.add(cellMenu.getCellInsertionMenu(contextKeyService));
            const actions = this.getCellToolbarActions(menu);
            toolbar.setActions(actions.primary, actions.secondary)();
            return toolbar;
        }
        setBetweenCellToolbarContext(templateData, element, context) {
            templateData.betweenCellToolbar.context = context;
            const container = templateData.bottomCellContainer;
            if (element instanceof codeCellViewModel_1.CodeCellViewModel) {
                const bottomToolbarOffset = element.layoutInfo.bottomToolbarOffset;
                container.style.top = `${bottomToolbarOffset}px`;
                templateData.elementDisposables.add(element.onDidChangeLayout(() => {
                    const bottomToolbarOffset = element.layoutInfo.bottomToolbarOffset;
                    container.style.top = `${bottomToolbarOffset}px`;
                }));
            }
            else {
                container.style.position = 'static';
                container.style.height = `${constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT}`;
            }
        }
        createToolbar(container) {
            const toolbar = new toolbar_1.ToolBar(container, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
                        return item;
                    }
                    return undefined;
                }
            });
            return toolbar;
        }
        getCellToolbarActions(menu) {
            const primary = [];
            const secondary = [];
            const actions = menu.getActions({ shouldForwardArgs: true });
            for (let [id, menuActions] of actions) {
                if (id === coreActions_1.CELL_TITLE_GROUP_ID) {
                    primary.push(...menuActions);
                }
                else {
                    secondary.push(...menuActions);
                }
            }
            return { primary, secondary };
        }
        setupCellToolbarActions(scopedContextKeyService, templateData, disposables) {
            const cellMenu = this.instantiationService.createInstance(cellMenus_1.CellMenus);
            const menu = disposables.add(cellMenu.getCellTitleMenu(scopedContextKeyService));
            const updateActions = () => {
                const actions = this.getCellToolbarActions(menu);
                const hadFocus = DOM.isAncestor(document.activeElement, templateData.toolbar.getContainer());
                templateData.toolbar.setActions(actions.primary, actions.secondary)();
                if (hadFocus) {
                    this.notebookEditor.focus();
                }
                if (templateData.focusIndicator) {
                    if (actions.primary.length || actions.secondary.length) {
                        templateData.container.classList.add('cell-has-toolbar-actions');
                        templateData.focusIndicator.style.top = `${constants_1.EDITOR_TOOLBAR_HEIGHT + constants_1.EDITOR_TOP_MARGIN}px`;
                    }
                    else {
                        templateData.container.classList.remove('cell-has-toolbar-actions');
                        templateData.focusIndicator.style.top = `${constants_1.EDITOR_TOP_MARGIN}px`;
                    }
                }
            };
            updateActions();
            disposables.add(menu.onDidChange(() => {
                if (this.notebookEditor.isDisposed) {
                    return;
                }
                updateActions();
            }));
        }
        commonRenderTemplate(templateData) {
            templateData.disposables.add(DOM.addDisposableListener(templateData.container, DOM.EventType.FOCUS, () => {
                if (templateData.currentRenderedCell) {
                    this.notebookEditor.selectElement(templateData.currentRenderedCell);
                }
            }, true));
        }
        commonRenderElement(element, index, templateData) {
            if (element.dragging) {
                templateData.container.classList.add(DRAGGING_CLASS);
            }
            else {
                templateData.container.classList.remove(DRAGGING_CLASS);
            }
        }
    }
    let MarkdownCellRenderer = class MarkdownCellRenderer extends AbstractCellRenderer {
        constructor(notebookEditor, dndController, renderedEditors, contextKeyServiceProvider, instantiationService, configurationService, contextMenuService, keybindingService, notificationService) {
            super(instantiationService, notebookEditor, contextMenuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, 'markdown', dndController);
            this.renderedEditors = renderedEditors;
        }
        get templateId() {
            return MarkdownCellRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            container.classList.add('markdown-cell-row');
            const disposables = new lifecycle_1.DisposableStore();
            const contextKeyService = disposables.add(this.contextKeyServiceProvider(container));
            const toolbar = disposables.add(this.createToolbar(container));
            const focusIndicator = DOM.append(container, DOM.$('.notebook-cell-focus-indicator'));
            focusIndicator.setAttribute('draggable', 'true');
            const codeInnerContent = DOM.append(container, $('.cell.code'));
            const editorPart = DOM.append(codeInnerContent, $('.cell-editor-part'));
            const editorContainer = DOM.append(editorPart, $('.cell-editor-container'));
            editorPart.style.display = 'none';
            const innerContent = DOM.append(container, $('.cell.markdown'));
            const foldingIndicator = DOM.append(focusIndicator, DOM.$('.notebook-folding-indicator'));
            const bottomCellContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
            DOM.append(bottomCellContainer, $('.separator'));
            const betweenCellToolbar = disposables.add(this.createBetweenCellToolbar(bottomCellContainer, disposables, contextKeyService));
            DOM.append(bottomCellContainer, $('.separator'));
            const statusBar = this.instantiationService.createInstance(CellEditorStatusBar, editorPart);
            const templateData = {
                contextKeyService,
                container,
                cellContainer: innerContent,
                editorPart,
                editorContainer,
                focusIndicator,
                foldingIndicator,
                disposables,
                elementDisposables: new lifecycle_1.DisposableStore(),
                toolbar,
                betweenCellToolbar,
                bottomCellContainer,
                statusBarContainer: statusBar.statusBarContainer,
                languageStatusBarItem: statusBar.languageStatusBarItem,
                toJSON: () => { return {}; }
            };
            this.dndController.registerDragHandle(templateData, () => this.getDragImage(templateData));
            this.commonRenderTemplate(templateData);
            return templateData;
        }
        getDragImage(templateData) {
            if (templateData.currentRenderedCell.editState === notebookBrowser_1.CellEditState.Editing) {
                return this.getEditDragImage(templateData);
            }
            else {
                return this.getMarkdownDragImage(templateData);
            }
        }
        getMarkdownDragImage(templateData) {
            const dragImageContainer = DOM.$('.cell-drag-image.monaco-list-row.focused.markdown-cell-row');
            dragImageContainer.innerHTML = templateData.container.innerHTML;
            // Remove all rendered content nodes after the
            const markdownContent = dragImageContainer.querySelector('.cell.markdown');
            const contentNodes = markdownContent.children[0].children;
            for (let i = contentNodes.length - 1; i >= 1; i--) {
                contentNodes.item(i).remove();
            }
            return dragImageContainer;
        }
        getEditDragImage(templateData) {
            return new CodeCellDragImageRenderer().getDragImage(templateData, templateData.currentEditor, 'markdown');
        }
        renderElement(element, index, templateData, height) {
            var _a;
            this.commonRenderElement(element, index, templateData);
            templateData.currentRenderedCell = element;
            templateData.currentEditor = undefined;
            templateData.editorPart.style.display = 'none';
            templateData.cellContainer.innerHTML = '';
            let renderedHTML = element.getHTML();
            if (renderedHTML) {
                templateData.cellContainer.appendChild(renderedHTML);
            }
            if (height === undefined) {
                return;
            }
            const elementDisposables = templateData.elementDisposables;
            elementDisposables.add(new cellContextKeys_1.CellContextKeyManager(templateData.contextKeyService, (_a = this.notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.notebookDocument, element));
            // render toolbar first
            this.setupCellToolbarActions(templateData.contextKeyService, templateData, elementDisposables);
            const toolbarContext = {
                cell: element,
                notebookEditor: this.notebookEditor,
                $mid: 12
            };
            templateData.toolbar.context = toolbarContext;
            this.setBetweenCellToolbarContext(templateData, element, toolbarContext);
            const markdownCell = this.instantiationService.createInstance(markdownCell_1.StatefullMarkdownCell, this.notebookEditor, element, templateData, this.editorOptions.value, this.renderedEditors);
            elementDisposables.add(this.editorOptions.onDidChange(newValue => markdownCell.updateEditorOptions(newValue)));
            elementDisposables.add(markdownCell);
            templateData.languageStatusBarItem.update(element, this.notebookEditor);
        }
        disposeTemplate(templateData) {
            templateData.disposables.clear();
        }
        disposeElement(element, index, templateData, height) {
            if (height) {
                templateData.elementDisposables.clear();
            }
        }
    };
    MarkdownCellRenderer.TEMPLATE_ID = 'markdown_cell';
    MarkdownCellRenderer = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, notification_1.INotificationService)
    ], MarkdownCellRenderer);
    exports.MarkdownCellRenderer = MarkdownCellRenderer;
    const DRAGGING_CLASS = 'cell-dragging';
    const GLOBAL_DRAG_CLASS = 'global-drag-active';
    class CellDragAndDropController extends lifecycle_1.Disposable {
        constructor(notebookEditor, insertionIndicatorContainer) {
            super();
            this.notebookEditor = notebookEditor;
            this.isScrolling = false;
            this.listInsertionIndicator = DOM.append(insertionIndicatorContainer, $('.cell-list-insertion-indicator'));
            this._register(event_1.domEvent(document.body, DOM.EventType.DRAG_START, true)(this.onGlobalDragStart.bind(this)));
            this._register(event_1.domEvent(document.body, DOM.EventType.DRAG_END, true)(this.onGlobalDragEnd.bind(this)));
            const addCellDragListener = (eventType, handler) => {
                this._register(DOM.addDisposableListener(notebookEditor.getDomNode(), eventType, e => {
                    const cellDragEvent = this.toCellDragEvent(e);
                    if (cellDragEvent) {
                        handler(cellDragEvent);
                    }
                }));
            };
            addCellDragListener(DOM.EventType.DRAG_OVER, event => {
                event.browserEvent.preventDefault();
                this.onCellDragover(event);
            });
            addCellDragListener(DOM.EventType.DROP, event => {
                event.browserEvent.preventDefault();
                this.onCellDrop(event);
            });
            addCellDragListener(DOM.EventType.DRAG_LEAVE, event => {
                event.browserEvent.preventDefault();
                this.onCellDragLeave(event);
            });
            this.scrollingDelayer = new async_1.Delayer(200);
        }
        setList(value) {
            this.list = value;
            this.list.onWillScroll(e => {
                if (!e.scrollTopChanged) {
                    return;
                }
                this.setInsertIndicatorVisibility(false);
                this.isScrolling = true;
                this.scrollingDelayer.trigger(() => {
                    this.isScrolling = false;
                });
            });
        }
        setInsertIndicatorVisibility(visible) {
            this.listInsertionIndicator.style.opacity = visible ? '1' : '0';
        }
        toCellDragEvent(event) {
            const targetTop = this.notebookEditor.getDomNode().getBoundingClientRect().top;
            const dragOffset = this.list.scrollTop + event.clientY - targetTop;
            const draggedOverCell = this.list.elementAt(dragOffset);
            if (!draggedOverCell) {
                return undefined;
            }
            const cellTop = this.list.getAbsoluteTopOfElement(draggedOverCell);
            const cellHeight = this.list.elementHeight(draggedOverCell);
            const dragPosInElement = dragOffset - cellTop;
            const dragPosRatio = dragPosInElement / cellHeight;
            return {
                browserEvent: event,
                draggedOverCell,
                cellTop,
                cellHeight,
                dragPosRatio
            };
        }
        clearGlobalDragState() {
            this.notebookEditor.getDomNode().classList.remove(GLOBAL_DRAG_CLASS);
        }
        onGlobalDragStart() {
            this.notebookEditor.getDomNode().classList.add(GLOBAL_DRAG_CLASS);
        }
        onGlobalDragEnd() {
            this.notebookEditor.getDomNode().classList.remove(GLOBAL_DRAG_CLASS);
        }
        onCellDragover(event) {
            if (!event.browserEvent.dataTransfer) {
                return;
            }
            if (!this.currentDraggedCell) {
                event.browserEvent.dataTransfer.dropEffect = 'none';
                return;
            }
            if (this.isScrolling || this.currentDraggedCell === event.draggedOverCell) {
                this.setInsertIndicatorVisibility(false);
                return;
            }
            const dropDirection = this.getDropInsertDirection(event);
            const insertionIndicatorAbsolutePos = dropDirection === 'above' ? event.cellTop : event.cellTop + event.cellHeight;
            const insertionIndicatorTop = insertionIndicatorAbsolutePos - this.list.scrollTop;
            if (insertionIndicatorTop >= 0) {
                this.listInsertionIndicator.style.top = `${insertionIndicatorAbsolutePos - this.list.scrollTop}px`;
                this.setInsertIndicatorVisibility(true);
            }
            else {
                this.setInsertIndicatorVisibility(false);
            }
        }
        getDropInsertDirection(event) {
            return event.dragPosRatio < 0.5 ? 'above' : 'below';
        }
        onCellDrop(event) {
            const draggedCell = this.currentDraggedCell;
            this.dragCleanup();
            const isCopy = (event.browserEvent.ctrlKey && !platform.isMacintosh) || (event.browserEvent.altKey && platform.isMacintosh);
            const dropDirection = this.getDropInsertDirection(event);
            const insertionIndicatorAbsolutePos = dropDirection === 'above' ? event.cellTop : event.cellTop + event.cellHeight;
            const insertionIndicatorTop = insertionIndicatorAbsolutePos - this.list.scrollTop;
            const editorHeight = this.notebookEditor.getDomNode().getBoundingClientRect().height;
            if (insertionIndicatorTop < 0 || insertionIndicatorTop > editorHeight) {
                // Ignore drop, insertion point is off-screen
                return;
            }
            if (isCopy) {
                this.copyCell(draggedCell, event.draggedOverCell, dropDirection);
            }
            else {
                this.moveCell(draggedCell, event.draggedOverCell, dropDirection);
            }
        }
        onCellDragLeave(event) {
            if (!event.browserEvent.relatedTarget || !DOM.isAncestor(event.browserEvent.relatedTarget, this.notebookEditor.getDomNode())) {
                this.setInsertIndicatorVisibility(false);
            }
        }
        dragCleanup() {
            if (this.currentDraggedCell) {
                this.currentDraggedCell.dragging = false;
                this.currentDraggedCell = undefined;
            }
            this.setInsertIndicatorVisibility(false);
        }
        registerDragHandle(templateData, dragImageProvider) {
            const container = templateData.container;
            const dragHandle = templateData.focusIndicator;
            templateData.disposables.add(event_1.domEvent(dragHandle, DOM.EventType.DRAG_END)(() => {
                // Note, templateData may have a different element rendered into it by now
                container.classList.remove(DRAGGING_CLASS);
                this.dragCleanup();
            }));
            templateData.disposables.add(event_1.domEvent(dragHandle, DOM.EventType.DRAG_START)(event => {
                if (!event.dataTransfer) {
                    return;
                }
                this.currentDraggedCell = templateData.currentRenderedCell;
                this.currentDraggedCell.dragging = true;
                const dragImage = dragImageProvider();
                container.parentElement.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, 0, 0);
                setTimeout(() => container.parentElement.removeChild(dragImage), 0); // Comment this out to debug drag image layout
                container.classList.add(DRAGGING_CLASS);
            }));
        }
        moveCell(draggedCell, ontoCell, direction) {
            const editState = draggedCell.editState;
            this.notebookEditor.moveCell(draggedCell, ontoCell, direction);
            this.notebookEditor.focusNotebookCell(draggedCell, editState === notebookBrowser_1.CellEditState.Editing ? 'editor' : 'container');
        }
        copyCell(draggedCell, ontoCell, direction) {
            const editState = draggedCell.editState;
            const newCell = this.notebookEditor.insertNotebookCell(ontoCell, draggedCell.cellKind, direction, draggedCell.getText());
            if (newCell) {
                this.notebookEditor.focusNotebookCell(newCell, editState === notebookBrowser_1.CellEditState.Editing ? 'editor' : 'container');
            }
        }
    }
    exports.CellDragAndDropController = CellDragAndDropController;
    let CellLanguageStatusBarItem = class CellLanguageStatusBarItem extends lifecycle_1.Disposable {
        constructor(container, modeService, instantiationService) {
            super();
            this.container = container;
            this.modeService = modeService;
            this.instantiationService = instantiationService;
            this.labelElement = DOM.append(container, $('.cell-language-picker'));
            this.labelElement.tabIndex = 0;
            this._register(DOM.addDisposableListener(this.labelElement, DOM.EventType.CLICK, () => {
                this.instantiationService.invokeFunction(accessor => {
                    new coreActions_1.ChangeCellLanguageAction().run(accessor, { notebookEditor: this.editor, cell: this.cell });
                });
            }));
            this._register(this.cellDisposables = new lifecycle_1.DisposableStore());
        }
        update(cell, editor) {
            this.cellDisposables.clear();
            this.cell = cell;
            this.editor = editor;
            this.render();
            this.cellDisposables.add(this.cell.model.onDidChangeLanguage(() => this.render()));
        }
        render() {
            this.labelElement.textContent = this.modeService.getLanguageName(this.cell.language);
        }
    };
    CellLanguageStatusBarItem = __decorate([
        __param(1, modeService_1.IModeService),
        __param(2, instantiation_1.IInstantiationService)
    ], CellLanguageStatusBarItem);
    exports.CellLanguageStatusBarItem = CellLanguageStatusBarItem;
    class EditorTextRenderer {
        getRichText(editor, modelRange) {
            const model = editor.getModel();
            if (!model) {
                return null;
            }
            const colorMap = this.getDefaultColorMap();
            const fontInfo = editor.getOptions().get(36 /* fontInfo */);
            const fontFamily = fontInfo.fontFamily === editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily ? fontInfo.fontFamily : `'${fontInfo.fontFamily}', ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`;
            return `<div style="`
                + `color: ${colorMap[1 /* DefaultForeground */]};`
                + `background-color: ${colorMap[2 /* DefaultBackground */]};`
                + `font-family: ${fontFamily};`
                + `font-weight: ${fontInfo.fontWeight};`
                + `font-size: ${fontInfo.fontSize}px;`
                + `line-height: ${fontInfo.lineHeight}px;`
                + `white-space: pre;`
                + `">`
                + this.getRichTextLines(model, modelRange, colorMap)
                + '</div>';
        }
        getRichTextLines(model, modelRange, colorMap) {
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = model.getOptions().tabSize;
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = model.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += textToHtmlTokenizer_1.tokenizeLineToHTML(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return result;
        }
        getDefaultColorMap() {
            let colorMap = modes.TokenizationRegistry.getColorMap();
            let result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
    }
    class CodeCellDragImageRenderer {
        getDragImage(templateData, editor, type) {
            let dragImage = this.getDragImageImpl(templateData, editor, type);
            if (!dragImage) {
                // TODO@roblourens I don't think this can happen
                dragImage = document.createElement('div');
                dragImage.textContent = '1 cell';
            }
            return dragImage;
        }
        getDragImageImpl(templateData, editor, type) {
            const dragImageContainer = DOM.$(`.cell-drag-image.monaco-list-row.focused.${type}-cell-row`);
            dragImageContainer.innerHTML = templateData.container.innerHTML;
            const editorContainer = dragImageContainer.querySelector('.cell-editor-container');
            if (!editorContainer) {
                return null;
            }
            const focusIndicator = dragImageContainer.querySelector('.notebook-cell-focus-indicator');
            if (focusIndicator) {
                focusIndicator.style.height = '40px';
            }
            const richEditorText = new EditorTextRenderer().getRichText(editor, new range_1.Range(1, 1, 1, 1000));
            if (!richEditorText) {
                return null;
            }
            editorContainer.innerHTML = richEditorText;
            return dragImageContainer;
        }
    }
    let CellEditorStatusBar = class CellEditorStatusBar {
        constructor(container, instantiationService) {
            this.statusBarContainer = DOM.append(container, $('.cell-statusbar-container'));
            const leftStatusBarItems = DOM.append(this.statusBarContainer, $('.cell-status-left'));
            const rightStatusBarItems = DOM.append(this.statusBarContainer, $('.cell-status-right'));
            this.cellRunStatusContainer = DOM.append(leftStatusBarItems, $('.cell-run-status'));
            this.durationContainer = DOM.append(leftStatusBarItems, $('.cell-run-duration'));
            this.cellStatusMessageContainer = DOM.append(leftStatusBarItems, $('.cell-status-message'));
            this.languageStatusBarItem = instantiationService.createInstance(CellLanguageStatusBarItem, rightStatusBarItems);
        }
    };
    CellEditorStatusBar = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], CellEditorStatusBar);
    let CodeCellRenderer = class CodeCellRenderer extends AbstractCellRenderer {
        constructor(notebookEditor, renderedEditors, dndController, contextKeyServiceProvider, contextMenuService, configurationService, instantiationService, keybindingService, notificationService) {
            super(instantiationService, notebookEditor, contextMenuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, 'python', dndController);
            this.notebookEditor = notebookEditor;
            this.renderedEditors = renderedEditors;
        }
        get templateId() {
            return CodeCellRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            container.classList.add('code-cell-row');
            const disposables = new lifecycle_1.DisposableStore();
            const contextKeyService = disposables.add(this.contextKeyServiceProvider(container));
            const toolbar = disposables.add(this.createToolbar(container));
            const focusIndicator = DOM.append(container, DOM.$('.notebook-cell-focus-indicator'));
            focusIndicator.setAttribute('draggable', 'true');
            const cellContainer = DOM.append(container, $('.cell.code'));
            const runButtonContainer = DOM.append(cellContainer, $('.run-button-container'));
            const runToolbar = this.createToolbar(runButtonContainer);
            disposables.add(runToolbar);
            const executionOrderLabel = DOM.append(runButtonContainer, $('div.execution-count-label'));
            // create a special context key service that set the inCompositeEditor-contextkey
            const editorContextKeyService = disposables.add(this.contextKeyServiceProvider(container));
            const editorInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorContextKeyService]));
            editorContextKeys_1.EditorContextKeys.inCompositeEditor.bindTo(editorContextKeyService).set(true);
            const editorPart = DOM.append(cellContainer, $('.cell-editor-part'));
            const editorContainer = DOM.append(editorPart, $('.cell-editor-container'));
            const editor = editorInstaService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, Object.assign(Object.assign({}, this.editorOptions.value), { dimension: {
                    width: 0,
                    height: 0
                } }), {});
            disposables.add(this.editorOptions.onDidChange(newValue => editor.updateOptions(newValue)));
            const progressBar = new progressbar_1.ProgressBar(editorPart);
            progressBar.hide();
            disposables.add(progressBar);
            const statusBar = this.instantiationService.createInstance(CellEditorStatusBar, editorPart);
            const timer = new TimerRenderer(statusBar.durationContainer);
            const outputContainer = DOM.append(container, $('.output'));
            const focusSinkElement = DOM.append(container, $('.cell-editor-focus-sink'));
            focusSinkElement.setAttribute('tabindex', '0');
            const bottomCellContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
            DOM.append(bottomCellContainer, $('.separator'));
            const betweenCellToolbar = this.createBetweenCellToolbar(bottomCellContainer, disposables, contextKeyService);
            DOM.append(bottomCellContainer, $('.separator'));
            const templateData = {
                contextKeyService,
                container,
                cellContainer,
                statusBarContainer: statusBar.statusBarContainer,
                cellRunStatusContainer: statusBar.cellRunStatusContainer,
                cellStatusMessageContainer: statusBar.cellStatusMessageContainer,
                languageStatusBarItem: statusBar.languageStatusBarItem,
                progressBar,
                focusIndicator,
                toolbar,
                betweenCellToolbar,
                focusSinkElement,
                runToolbar,
                runButtonContainer,
                executionOrderLabel,
                outputContainer,
                editor,
                disposables,
                elementDisposables: new lifecycle_1.DisposableStore(),
                bottomCellContainer,
                timer,
                toJSON: () => { return {}; }
            };
            this.dndController.registerDragHandle(templateData, () => new CodeCellDragImageRenderer().getDragImage(templateData, templateData.editor, 'code'));
            disposables.add(DOM.addDisposableListener(focusSinkElement, DOM.EventType.FOCUS, () => {
                if (templateData.currentRenderedCell && templateData.currentRenderedCell.outputs.length) {
                    this.notebookEditor.focusNotebookCell(templateData.currentRenderedCell, 'output');
                }
            }));
            this.commonRenderTemplate(templateData);
            return templateData;
        }
        updateForRunState(runState, templateData) {
            if (typeof runState === 'undefined') {
                runState = notebookCommon_1.NotebookCellRunState.Idle;
            }
            if (runState === notebookCommon_1.NotebookCellRunState.Running) {
                templateData.progressBar.infinite().show(500);
                templateData.runToolbar.setActions([
                    this.instantiationService.createInstance(coreActions_1.CancelCellAction)
                ])();
            }
            else {
                templateData.progressBar.hide();
                templateData.runToolbar.setActions([
                    this.instantiationService.createInstance(coreActions_1.ExecuteCellAction)
                ])();
            }
        }
        updateForOutputs(element, templateData) {
            if (element.outputs.length) {
                DOM.show(templateData.focusSinkElement);
            }
            else {
                DOM.hide(templateData.focusSinkElement);
            }
        }
        updateForMetadata(element, templateData) {
            const metadata = element.getEvaluatedMetadata(this.notebookEditor.viewModel.notebookDocument.metadata);
            DOM.toggleClass(templateData.cellContainer, 'runnable', !!metadata.runnable);
            this.updateExecutionOrder(metadata, templateData);
            templateData.cellStatusMessageContainer.textContent = (metadata === null || metadata === void 0 ? void 0 : metadata.statusMessage) || '';
            if (metadata.runState === notebookCommon_1.NotebookCellRunState.Success) {
                templateData.cellRunStatusContainer.innerHTML = codicons_1.renderCodicons('$(check)');
            }
            else if (metadata.runState === notebookCommon_1.NotebookCellRunState.Error) {
                templateData.cellRunStatusContainer.innerHTML = codicons_1.renderCodicons('$(error)');
            }
            else if (metadata.runState === notebookCommon_1.NotebookCellRunState.Running) {
                templateData.cellRunStatusContainer.innerHTML = codicons_1.renderCodicons('$(sync~spin)');
            }
            else {
                templateData.cellRunStatusContainer.innerHTML = '';
            }
            if (metadata.runState === notebookCommon_1.NotebookCellRunState.Running) {
                if (metadata.runStartTime) {
                    templateData.elementDisposables.add(templateData.timer.start(metadata.runStartTime));
                }
                else {
                    templateData.timer.clear();
                }
            }
            else if (typeof metadata.lastRunDuration === 'number') {
                templateData.timer.show(metadata.lastRunDuration);
            }
            else {
                templateData.timer.clear();
            }
            if (typeof metadata.breakpointMargin === 'boolean') {
                this.editorOptions.setGlyphMargin(metadata.breakpointMargin);
            }
            this.updateForRunState(metadata.runState, templateData);
        }
        updateExecutionOrder(metadata, templateData) {
            if (metadata.hasExecutionOrder) {
                const executionOrderLabel = typeof metadata.executionOrder === 'number' ?
                    `[${metadata.executionOrder}]` :
                    '[ ]';
                templateData.executionOrderLabel.innerText = executionOrderLabel;
            }
            else {
                templateData.executionOrderLabel.innerText = '';
            }
        }
        updateForHover(element, templateData) {
            DOM.toggleClass(templateData.container, 'cell-output-hover', element.outputIsHovered);
        }
        renderElement(element, index, templateData, height) {
            var _a;
            this.commonRenderElement(element, index, templateData);
            templateData.currentRenderedCell = element;
            if (height === undefined) {
                return;
            }
            templateData.outputContainer.innerHTML = '';
            const elementDisposables = templateData.elementDisposables;
            elementDisposables.add(this.instantiationService.createInstance(codeCell_1.CodeCell, this.notebookEditor, element, templateData));
            this.renderedEditors.set(element, templateData.editor);
            elementDisposables.add(new cellContextKeys_1.CellContextKeyManager(templateData.contextKeyService, (_a = this.notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.notebookDocument, element));
            templateData.focusIndicator.style.height = `${element.layoutInfo.indicatorHeight}px`;
            templateData.outputContainer.style.top = `${element.layoutInfo.outputContainerOffset}px`;
            elementDisposables.add(element.onDidChangeLayout(() => {
                templateData.focusIndicator.style.height = `${element.layoutInfo.indicatorHeight}px`;
                templateData.outputContainer.style.top = `${element.layoutInfo.outputContainerOffset}px`;
            }));
            this.updateForMetadata(element, templateData);
            elementDisposables.add(element.onDidChangeState((e) => {
                if (e.metadataChanged) {
                    this.updateForMetadata(element, templateData);
                }
                if (e.outputIsHoveredChanged) {
                    this.updateForHover(element, templateData);
                }
            }));
            this.updateForOutputs(element, templateData);
            elementDisposables.add(element.onDidChangeOutputs(_e => this.updateForOutputs(element, templateData)));
            this.setupCellToolbarActions(templateData.contextKeyService, templateData, elementDisposables);
            const toolbarContext = {
                cell: element,
                cellTemplate: templateData,
                notebookEditor: this.notebookEditor,
                $mid: 12
            };
            templateData.toolbar.context = toolbarContext;
            templateData.runToolbar.context = toolbarContext;
            this.setBetweenCellToolbarContext(templateData, element, toolbarContext);
            templateData.languageStatusBarItem.update(element, this.notebookEditor);
        }
        disposeTemplate(templateData) {
            templateData.disposables.clear();
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
            this.renderedEditors.delete(element);
            templateData.focusIndicator.style.height = 'initial';
        }
    };
    CodeCellRenderer.TEMPLATE_ID = 'code_cell';
    CodeCellRenderer = __decorate([
        __param(4, contextView_1.IContextMenuService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, notification_1.INotificationService)
    ], CodeCellRenderer);
    exports.CodeCellRenderer = CodeCellRenderer;
    class TimerRenderer {
        constructor(container) {
            this.container = container;
            DOM.hide(container);
        }
        start(startTime) {
            this.stop();
            DOM.show(this.container);
            const intervalTimer = setInterval(() => {
                const duration = Date.now() - startTime;
                this.container.textContent = this.formatDuration(duration);
            }, 100);
            this.intervalTimer = intervalTimer;
            return lifecycle_1.toDisposable(() => {
                clearInterval(intervalTimer);
            });
        }
        stop() {
            if (this.intervalTimer) {
                clearInterval(this.intervalTimer);
            }
        }
        show(duration) {
            this.stop();
            DOM.show(this.container);
            this.container.textContent = this.formatDuration(duration);
        }
        clear() {
            DOM.hide(this.container);
            this.stop();
            this.container.textContent = '';
        }
        formatDuration(duration) {
            const seconds = Math.floor(duration / 1000);
            const tenths = String(duration - seconds * 1000).charAt(0);
            return `${seconds}.${tenths}s`;
        }
    }
    exports.TimerRenderer = TimerRenderer;
});
//# __sourceMappingURL=cellRenderer.js.map