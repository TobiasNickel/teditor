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
define(["require", "exports", "vs/nls", "vs/base/common/filters", "vs/base/common/strings", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "./suggest", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/platform/storage/common/storage", "vs/editor/contrib/markdown/markdownRenderer", "vs/editor/common/services/modeService", "vs/platform/opener/common/opener", "vs/base/common/async", "vs/editor/common/modes", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/htmlContent", "vs/base/common/arrays", "vs/platform/actions/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/codicons", "vs/css!./media/suggest", "vs/css!./media/suggestStatusBar", "vs/base/browser/ui/codicons/codiconStyles", "vs/editor/contrib/documentSymbols/outlineTree"], function (require, exports, nls, filters_1, strings, event_1, errors_1, lifecycle_1, dom_1, listWidget_1, scrollableElement_1, keybinding_1, contextkey_1, suggest_1, telemetry_1, styler_1, themeService_1, colorRegistry_1, storage_1, markdownRenderer_1, modeService_1, opener_1, async_1, modes_1, iconLabel_1, getIconClasses_1, modelService_1, uri_1, instantiation_1, files_1, htmlContent_1, arrays_1, actions_1, actionbar_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestWidget = exports.editorSuggestWidgetHighlightForeground = exports.editorSuggestWidgetSelectedBackground = exports.editorSuggestWidgetForeground = exports.editorSuggestWidgetBorder = exports.editorSuggestWidgetBackground = void 0;
    const expandSuggestionDocsByDefault = false;
    const suggestMoreInfoIcon = codicons_1.registerIcon('suggest-more-info', codicons_1.Codicon.chevronRight);
    /**
     * Suggest widget colors
     */
    exports.editorSuggestWidgetBackground = colorRegistry_1.registerColor('editorSuggestWidget.background', { dark: colorRegistry_1.editorWidgetBackground, light: colorRegistry_1.editorWidgetBackground, hc: colorRegistry_1.editorWidgetBackground }, nls.localize('editorSuggestWidgetBackground', 'Background color of the suggest widget.'));
    exports.editorSuggestWidgetBorder = colorRegistry_1.registerColor('editorSuggestWidget.border', { dark: colorRegistry_1.editorWidgetBorder, light: colorRegistry_1.editorWidgetBorder, hc: colorRegistry_1.editorWidgetBorder }, nls.localize('editorSuggestWidgetBorder', 'Border color of the suggest widget.'));
    exports.editorSuggestWidgetForeground = colorRegistry_1.registerColor('editorSuggestWidget.foreground', { dark: colorRegistry_1.editorForeground, light: colorRegistry_1.editorForeground, hc: colorRegistry_1.editorForeground }, nls.localize('editorSuggestWidgetForeground', 'Foreground color of the suggest widget.'));
    exports.editorSuggestWidgetSelectedBackground = colorRegistry_1.registerColor('editorSuggestWidget.selectedBackground', { dark: colorRegistry_1.listFocusBackground, light: colorRegistry_1.listFocusBackground, hc: colorRegistry_1.listFocusBackground }, nls.localize('editorSuggestWidgetSelectedBackground', 'Background color of the selected entry in the suggest widget.'));
    exports.editorSuggestWidgetHighlightForeground = colorRegistry_1.registerColor('editorSuggestWidget.highlightForeground', { dark: colorRegistry_1.listHighlightForeground, light: colorRegistry_1.listHighlightForeground, hc: colorRegistry_1.listHighlightForeground }, nls.localize('editorSuggestWidgetHighlightForeground', 'Color of the match highlights in the suggest widget.'));
    const colorRegExp = /^(#([\da-f]{3}){1,2}|(rgb|hsl)a\(\s*(\d{1,3}%?\s*,\s*){3}(1|0?\.\d+)\)|(rgb|hsl)\(\s*\d{1,3}%?(\s*,\s*\d{1,3}%?){2}\s*\))$/i;
    function extractColor(item, out) {
        const label = typeof item.completion.label === 'string'
            ? item.completion.label
            : item.completion.label.name;
        if (label.match(colorRegExp)) {
            out[0] = label;
            return true;
        }
        if (typeof item.completion.documentation === 'string' && item.completion.documentation.match(colorRegExp)) {
            out[0] = item.completion.documentation;
            return true;
        }
        return false;
    }
    function canExpandCompletionItem(item) {
        if (!item) {
            return false;
        }
        const suggestion = item.completion;
        if (suggestion.documentation) {
            return true;
        }
        return (suggestion.detail && suggestion.detail !== suggestion.label);
    }
    function getAriaId(index) {
        return `suggest-aria-id:${index}`;
    }
    let ItemRenderer = class ItemRenderer {
        constructor(widget, editor, triggerKeybindingLabel, _modelService, _modeService, _themeService) {
            this.widget = widget;
            this.editor = editor;
            this.triggerKeybindingLabel = triggerKeybindingLabel;
            this._modelService = _modelService;
            this._modeService = _modeService;
            this._themeService = _themeService;
        }
        get templateId() {
            return 'suggestion';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.disposables = new lifecycle_1.DisposableStore();
            data.root = container;
            data.root.classList.add('show-file-icons');
            data.icon = dom_1.append(container, dom_1.$('.icon'));
            data.colorspan = dom_1.append(data.icon, dom_1.$('span.colorspan'));
            const text = dom_1.append(container, dom_1.$('.contents'));
            const main = dom_1.append(text, dom_1.$('.main'));
            data.iconContainer = dom_1.append(main, dom_1.$('.icon-label.codicon'));
            data.left = dom_1.append(main, dom_1.$('span.left'));
            data.right = dom_1.append(main, dom_1.$('span.right'));
            data.iconLabel = new iconLabel_1.IconLabel(data.left, { supportHighlights: true, supportCodicons: true });
            data.disposables.add(data.iconLabel);
            data.parametersLabel = dom_1.append(data.left, dom_1.$('span.signature-label'));
            data.qualifierLabel = dom_1.append(data.left, dom_1.$('span.qualifier-label'));
            data.detailsLabel = dom_1.append(data.right, dom_1.$('span.details-label'));
            data.readMore = dom_1.append(data.right, dom_1.$('span.readMore' + suggestMoreInfoIcon.cssSelector));
            data.readMore.title = nls.localize('readMore', "Read More ({0})", this.triggerKeybindingLabel);
            const configureFont = () => {
                const options = this.editor.getOptions();
                const fontInfo = options.get(36 /* fontInfo */);
                const fontFamily = fontInfo.fontFamily;
                const fontFeatureSettings = fontInfo.fontFeatureSettings;
                const fontSize = options.get(97 /* suggestFontSize */) || fontInfo.fontSize;
                const lineHeight = options.get(98 /* suggestLineHeight */) || fontInfo.lineHeight;
                const fontWeight = fontInfo.fontWeight;
                const fontSizePx = `${fontSize}px`;
                const lineHeightPx = `${lineHeight}px`;
                data.root.style.fontSize = fontSizePx;
                data.root.style.fontWeight = fontWeight;
                main.style.fontFamily = fontFamily;
                main.style.fontFeatureSettings = fontFeatureSettings;
                main.style.lineHeight = lineHeightPx;
                data.icon.style.height = lineHeightPx;
                data.icon.style.width = lineHeightPx;
                data.readMore.style.height = lineHeightPx;
                data.readMore.style.width = lineHeightPx;
            };
            configureFont();
            data.disposables.add(event_1.Event.chain(this.editor.onDidChangeConfiguration.bind(this.editor))
                .filter(e => e.hasChanged(36 /* fontInfo */) || e.hasChanged(97 /* suggestFontSize */) || e.hasChanged(98 /* suggestLineHeight */))
                .on(configureFont, null));
            return data;
        }
        renderElement(element, index, templateData) {
            const data = templateData;
            const suggestion = element.completion;
            const textLabel = typeof suggestion.label === 'string' ? suggestion.label : suggestion.label.name;
            data.root.id = getAriaId(index);
            data.colorspan.style.backgroundColor = '';
            const labelOptions = {
                labelEscapeNewLines: true,
                matches: filters_1.createMatches(element.score)
            };
            let color = [];
            if (suggestion.kind === 19 /* Color */ && extractColor(element, color)) {
                // special logic for 'color' completion items
                data.icon.className = 'icon customcolor';
                data.iconContainer.className = 'icon hide';
                data.colorspan.style.backgroundColor = color[0];
            }
            else if (suggestion.kind === 20 /* File */ && this._themeService.getFileIconTheme().hasFileIcons) {
                // special logic for 'file' completion items
                data.icon.className = 'icon hide';
                data.iconContainer.className = 'icon hide';
                const labelClasses = getIconClasses_1.getIconClasses(this._modelService, this._modeService, uri_1.URI.from({ scheme: 'fake', path: textLabel }), files_1.FileKind.FILE);
                const detailClasses = getIconClasses_1.getIconClasses(this._modelService, this._modeService, uri_1.URI.from({ scheme: 'fake', path: suggestion.detail }), files_1.FileKind.FILE);
                labelOptions.extraClasses = labelClasses.length > detailClasses.length ? labelClasses : detailClasses;
            }
            else if (suggestion.kind === 23 /* Folder */ && this._themeService.getFileIconTheme().hasFolderIcons) {
                // special logic for 'folder' completion items
                data.icon.className = 'icon hide';
                data.iconContainer.className = 'icon hide';
                labelOptions.extraClasses = arrays_1.flatten([
                    getIconClasses_1.getIconClasses(this._modelService, this._modeService, uri_1.URI.from({ scheme: 'fake', path: textLabel }), files_1.FileKind.FOLDER),
                    getIconClasses_1.getIconClasses(this._modelService, this._modeService, uri_1.URI.from({ scheme: 'fake', path: suggestion.detail }), files_1.FileKind.FOLDER)
                ]);
            }
            else {
                // normal icon
                data.icon.className = 'icon hide';
                data.iconContainer.className = '';
                dom_1.addClasses(data.iconContainer, `suggest-icon ${modes_1.completionKindToCssClass(suggestion.kind)}`);
            }
            if (suggestion.tags && suggestion.tags.indexOf(1 /* Deprecated */) >= 0) {
                labelOptions.extraClasses = (labelOptions.extraClasses || []).concat(['deprecated']);
                labelOptions.matches = [];
            }
            data.iconLabel.setLabel(textLabel, undefined, labelOptions);
            if (typeof suggestion.label === 'string') {
                data.parametersLabel.textContent = '';
                data.qualifierLabel.textContent = '';
                data.detailsLabel.textContent = (suggestion.detail || '').replace(/\n.*$/m, '');
                data.root.classList.add('string-label');
            }
            else {
                data.parametersLabel.textContent = (suggestion.label.parameters || '').replace(/\n.*$/m, '');
                data.qualifierLabel.textContent = (suggestion.label.qualifier || '').replace(/\n.*$/m, '');
                data.detailsLabel.textContent = (suggestion.label.type || '').replace(/\n.*$/m, '');
                data.root.classList.remove('string-label');
            }
            if (canExpandCompletionItem(element)) {
                data.right.classList.add('can-expand-details');
                dom_1.show(data.readMore);
                data.readMore.onmousedown = e => {
                    e.stopPropagation();
                    e.preventDefault();
                };
                data.readMore.onclick = e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.widget.toggleDetails();
                };
            }
            else {
                data.right.classList.remove('can-expand-details');
                dom_1.hide(data.readMore);
                data.readMore.onmousedown = null;
                data.readMore.onclick = null;
            }
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    ItemRenderer = __decorate([
        __param(3, modelService_1.IModelService),
        __param(4, modeService_1.IModeService),
        __param(5, themeService_1.IThemeService)
    ], ItemRenderer);
    var State;
    (function (State) {
        State[State["Hidden"] = 0] = "Hidden";
        State[State["Loading"] = 1] = "Loading";
        State[State["Empty"] = 2] = "Empty";
        State[State["Open"] = 3] = "Open";
        State[State["Frozen"] = 4] = "Frozen";
        State[State["Details"] = 5] = "Details";
    })(State || (State = {}));
    class SuggestionDetails {
        constructor(container, widget, editor, markdownRenderer, kbToggleDetails) {
            this.widget = widget;
            this.editor = editor;
            this.markdownRenderer = markdownRenderer;
            this.kbToggleDetails = kbToggleDetails;
            this.borderWidth = 1;
            this.disposables = new lifecycle_1.DisposableStore();
            this.el = dom_1.append(container, dom_1.$('.details'));
            this.disposables.add(lifecycle_1.toDisposable(() => container.removeChild(this.el)));
            this.body = dom_1.$('.body');
            this.scrollbar = new scrollableElement_1.DomScrollableElement(this.body, {});
            dom_1.append(this.el, this.scrollbar.getDomNode());
            this.disposables.add(this.scrollbar);
            this.header = dom_1.append(this.body, dom_1.$('.header'));
            this.close = dom_1.append(this.header, dom_1.$('span' + codicons_1.Codicon.close.cssSelector));
            this.close.title = nls.localize('readLess', "Read Less ({0})", this.kbToggleDetails);
            this.type = dom_1.append(this.header, dom_1.$('p.type'));
            this.docs = dom_1.append(this.body, dom_1.$('p.docs'));
            this.configureFont();
            event_1.Event.chain(this.editor.onDidChangeConfiguration.bind(this.editor))
                .filter(e => e.hasChanged(36 /* fontInfo */))
                .on(this.configureFont, this, this.disposables);
            markdownRenderer.onDidRenderCodeBlock(() => this.scrollbar.scanDomNode(), this, this.disposables);
        }
        get element() {
            return this.el;
        }
        renderLoading() {
            this.type.textContent = nls.localize('loading', "Loading...");
            this.docs.textContent = '';
        }
        renderItem(item, explainMode) {
            lifecycle_1.dispose(this.renderDisposeable);
            this.renderDisposeable = undefined;
            let { documentation, detail } = item.completion;
            // --- documentation
            if (explainMode) {
                let md = '';
                md += `score: ${item.score[0]}${item.word ? `, compared '${item.completion.filterText && (item.completion.filterText + ' (filterText)') || item.completion.label}' with '${item.word}'` : ' (no prefix)'}\n`;
                md += `distance: ${item.distance}, see localityBonus-setting\n`;
                md += `index: ${item.idx}, based on ${item.completion.sortText && `sortText: "${item.completion.sortText}"` || 'label'}\n`;
                documentation = new htmlContent_1.MarkdownString().appendCodeblock('empty', md);
                detail = `Provider: ${item.provider._debugDisplayName}`;
            }
            if (!explainMode && !canExpandCompletionItem(item)) {
                this.type.textContent = '';
                this.docs.textContent = '';
                this.el.classList.add('no-docs');
                return;
            }
            this.el.classList.remove('no-docs');
            if (typeof documentation === 'string') {
                this.docs.classList.remove('markdown-docs');
                this.docs.textContent = documentation;
            }
            else {
                this.docs.classList.add('markdown-docs');
                this.docs.innerHTML = '';
                const renderedContents = this.markdownRenderer.render(documentation);
                this.renderDisposeable = renderedContents;
                this.docs.appendChild(renderedContents.element);
            }
            // --- details
            if (detail) {
                this.type.innerText = detail;
                dom_1.show(this.type);
            }
            else {
                this.type.innerText = '';
                dom_1.hide(this.type);
            }
            this.el.style.height = this.header.offsetHeight + this.docs.offsetHeight + (this.borderWidth * 2) + 'px';
            this.el.style.userSelect = 'text';
            this.el.tabIndex = -1;
            this.close.onmousedown = e => {
                e.preventDefault();
                e.stopPropagation();
            };
            this.close.onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                this.widget.toggleDetails();
            };
            this.body.scrollTop = 0;
            this.scrollbar.scanDomNode();
        }
        scrollDown(much = 8) {
            this.body.scrollTop += much;
        }
        scrollUp(much = 8) {
            this.body.scrollTop -= much;
        }
        scrollTop() {
            this.body.scrollTop = 0;
        }
        scrollBottom() {
            this.body.scrollTop = this.body.scrollHeight;
        }
        pageDown() {
            this.scrollDown(80);
        }
        pageUp() {
            this.scrollUp(80);
        }
        setBorderWidth(width) {
            this.borderWidth = width;
        }
        configureFont() {
            const options = this.editor.getOptions();
            const fontInfo = options.get(36 /* fontInfo */);
            const fontFamily = fontInfo.fontFamily;
            const fontSize = options.get(97 /* suggestFontSize */) || fontInfo.fontSize;
            const lineHeight = options.get(98 /* suggestLineHeight */) || fontInfo.lineHeight;
            const fontWeight = fontInfo.fontWeight;
            const fontSizePx = `${fontSize}px`;
            const lineHeightPx = `${lineHeight}px`;
            this.el.style.fontSize = fontSizePx;
            this.el.style.fontWeight = fontWeight;
            this.el.style.fontFeatureSettings = fontInfo.fontFeatureSettings;
            this.type.style.fontFamily = fontFamily;
            this.close.style.height = lineHeightPx;
            this.close.style.width = lineHeightPx;
        }
        dispose() {
            this.disposables.dispose();
            lifecycle_1.dispose(this.renderDisposeable);
            this.renderDisposeable = undefined;
        }
    }
    let SuggestWidget = class SuggestWidget {
        constructor(editor, telemetryService, keybindingService, contextKeyService, themeService, storageService, modeService, openerService, menuService, instantiationService) {
            var _a, _b;
            this.editor = editor;
            this.telemetryService = telemetryService;
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this.state = 0 /* Hidden */;
            this.isAddedAsContentWidget = false;
            this.isAuto = false;
            this.loadingTimeout = lifecycle_1.Disposable.None;
            this.currentSuggestionDetails = null;
            this.ignoreFocusEvents = false;
            this.completionModel = null;
            this.showTimeout = new async_1.TimeoutTimer();
            this.toDispose = new lifecycle_1.DisposableStore();
            this.onDidSelectEmitter = new event_1.Emitter();
            this.onDidFocusEmitter = new event_1.Emitter();
            this.onDidHideEmitter = new event_1.Emitter();
            this.onDidShowEmitter = new event_1.Emitter();
            this.onDidSelect = this.onDidSelectEmitter.event;
            this.onDidFocus = this.onDidFocusEmitter.event;
            this.onDidHide = this.onDidHideEmitter.event;
            this.onDidShow = this.onDidShowEmitter.event;
            this.maxWidgetWidth = 660;
            this.listWidth = 330;
            this.firstFocusInCurrentList = false;
            this.preferDocPositionTop = false;
            this.docsPositionPreviousWidgetY = null;
            this.explainMode = false;
            this._onDetailsKeydown = new event_1.Emitter();
            this.onDetailsKeyDown = this._onDetailsKeydown.event;
            const markdownRenderer = this.toDispose.add(new markdownRenderer_1.MarkdownRenderer(editor, modeService, openerService));
            const kbToggleDetails = (_b = (_a = keybindingService.lookupKeybinding('toggleSuggestionDetails')) === null || _a === void 0 ? void 0 : _a.getLabel()) !== null && _b !== void 0 ? _b : '';
            this.isAuto = false;
            this.focusedItem = null;
            this.storageService = storageService;
            this.element = dom_1.$('.editor-widget.suggest-widget');
            this.toDispose.add(dom_1.addDisposableListener(this.element, 'click', e => {
                if (e.target === this.element) {
                    this.hideWidget();
                }
            }));
            this.messageElement = dom_1.append(this.element, dom_1.$('.message'));
            this.listElement = dom_1.append(this.element, dom_1.$('.tree'));
            const applyStatusBarStyle = () => this.element.classList.toggle('with-status-bar', this.editor.getOption(96 /* suggest */).statusBar.visible);
            applyStatusBarStyle();
            this.statusBarElement = dom_1.append(this.element, dom_1.$('.suggest-status-bar'));
            const actionViewItemProvider = (action => {
                const kb = keybindingService.lookupKeybindings(action.id);
                return new class extends actionbar_1.ActionViewItem {
                    constructor() {
                        super(undefined, action, { label: true, icon: false });
                    }
                    updateLabel() {
                        if (arrays_1.isFalsyOrEmpty(kb) || !this.label) {
                            return super.updateLabel();
                        }
                        const { label } = this.getAction();
                        this.label.textContent = /{\d}/.test(label)
                            ? strings.format(this.getAction().label, kb[0].getLabel())
                            : `${this.getAction().label} (${kb[0].getLabel()})`;
                    }
                };
            });
            const leftActions = new actionbar_1.ActionBar(this.statusBarElement, { actionViewItemProvider });
            const rightActions = new actionbar_1.ActionBar(this.statusBarElement, { actionViewItemProvider });
            const menu = menuService.createMenu(suggest_1.suggestWidgetStatusbarMenu, contextKeyService);
            const renderMenu = () => {
                const left = [];
                const right = [];
                for (let [group, actions] of menu.getActions()) {
                    if (group === 'left') {
                        left.push(...actions);
                    }
                    else {
                        right.push(...actions);
                    }
                }
                leftActions.clear();
                leftActions.push(left);
                rightActions.clear();
                rightActions.push(right);
            };
            this.toDispose.add(menu.onDidChange(() => renderMenu()));
            this.toDispose.add(menu);
            this.details = instantiationService.createInstance(SuggestionDetails, this.element, this, this.editor, markdownRenderer, kbToggleDetails);
            const applyIconStyle = () => this.element.classList.toggle('no-icons', !this.editor.getOption(96 /* suggest */).showIcons);
            applyIconStyle();
            let renderer = instantiationService.createInstance(ItemRenderer, this, this.editor, kbToggleDetails);
            this.list = new listWidget_1.List('SuggestWidget', this.listElement, this, [renderer], {
                useShadows: false,
                mouseSupport: false,
                accessibilityProvider: {
                    getRole: () => 'option',
                    getAriaLabel: (item) => {
                        const textLabel = typeof item.completion.label === 'string' ? item.completion.label : item.completion.label.name;
                        if (item.isResolved && this.expandDocsSettingFromStorage()) {
                            const { documentation, detail } = item.completion;
                            const docs = strings.format('{0}{1}', detail || '', documentation ? (typeof documentation === 'string' ? documentation : documentation.value) : '');
                            return nls.localize('ariaCurrenttSuggestionReadDetails', "Item {0}, docs: {1}", textLabel, docs);
                        }
                        else {
                            return textLabel;
                        }
                    },
                    getWidgetAriaLabel: () => nls.localize('suggest', "Suggest"),
                    getWidgetRole: () => 'listbox'
                }
            });
            this.toDispose.add(styler_1.attachListStyler(this.list, themeService, {
                listInactiveFocusBackground: exports.editorSuggestWidgetSelectedBackground,
                listInactiveFocusOutline: colorRegistry_1.activeContrastBorder
            }));
            this.toDispose.add(themeService.onDidColorThemeChange(t => this.onThemeChange(t)));
            this.toDispose.add(editor.onDidLayoutChange(() => this.onEditorLayoutChange()));
            this.toDispose.add(this.list.onMouseDown(e => this.onListMouseDownOrTap(e)));
            this.toDispose.add(this.list.onTap(e => this.onListMouseDownOrTap(e)));
            this.toDispose.add(this.list.onDidChangeSelection(e => this.onListSelection(e)));
            this.toDispose.add(this.list.onDidChangeFocus(e => this.onListFocus(e)));
            this.toDispose.add(this.editor.onDidChangeCursorSelection(() => this.onCursorSelectionChanged()));
            this.toDispose.add(this.editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(96 /* suggest */)) {
                    applyStatusBarStyle();
                    applyIconStyle();
                }
            }));
            this.ctxSuggestWidgetVisible = suggest_1.Context.Visible.bindTo(contextKeyService);
            this.ctxSuggestWidgetDetailsVisible = suggest_1.Context.DetailsVisible.bindTo(contextKeyService);
            this.ctxSuggestWidgetMultipleSuggestions = suggest_1.Context.MultipleSuggestions.bindTo(contextKeyService);
            this.onThemeChange(themeService.getColorTheme());
            this.toDispose.add(dom_1.addStandardDisposableListener(this.details.element, 'keydown', e => {
                this._onDetailsKeydown.fire(e);
            }));
            this.toDispose.add(this.editor.onMouseDown((e) => this.onEditorMouseDown(e)));
        }
        onEditorMouseDown(mouseEvent) {
            // Clicking inside details
            if (this.details.element.contains(mouseEvent.target.element)) {
                this.details.element.focus();
            }
            // Clicking outside details and inside suggest
            else {
                if (this.element.contains(mouseEvent.target.element)) {
                    this.editor.focus();
                }
            }
        }
        onCursorSelectionChanged() {
            if (this.state === 0 /* Hidden */) {
                return;
            }
            this.editor.layoutContentWidget(this);
        }
        onEditorLayoutChange() {
            if ((this.state === 3 /* Open */ || this.state === 5 /* Details */) && this.expandDocsSettingFromStorage()) {
                this.expandSideOrBelow();
            }
        }
        onListMouseDownOrTap(e) {
            if (typeof e.element === 'undefined' || typeof e.index === 'undefined') {
                return;
            }
            // prevent stealing browser focus from the editor
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this.select(e.element, e.index);
        }
        onListSelection(e) {
            if (!e.elements.length) {
                return;
            }
            this.select(e.elements[0], e.indexes[0]);
        }
        select(item, index) {
            const completionModel = this.completionModel;
            if (!completionModel) {
                return;
            }
            this.onDidSelectEmitter.fire({ item, index, model: completionModel });
            this.editor.focus();
        }
        onThemeChange(theme) {
            const backgroundColor = theme.getColor(exports.editorSuggestWidgetBackground);
            if (backgroundColor) {
                this.listElement.style.backgroundColor = backgroundColor.toString();
                this.statusBarElement.style.backgroundColor = backgroundColor.toString();
                this.details.element.style.backgroundColor = backgroundColor.toString();
                this.messageElement.style.backgroundColor = backgroundColor.toString();
            }
            const borderColor = theme.getColor(exports.editorSuggestWidgetBorder);
            if (borderColor) {
                this.listElement.style.borderColor = borderColor.toString();
                this.statusBarElement.style.borderColor = borderColor.toString();
                this.details.element.style.borderColor = borderColor.toString();
                this.messageElement.style.borderColor = borderColor.toString();
                this.detailsBorderColor = borderColor.toString();
            }
            const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusBorderColor) {
                this.detailsFocusBorderColor = focusBorderColor.toString();
            }
            this.details.setBorderWidth(theme.type === 'hc' ? 2 : 1);
        }
        onListFocus(e) {
            if (this.ignoreFocusEvents) {
                return;
            }
            if (!e.elements.length) {
                if (this.currentSuggestionDetails) {
                    this.currentSuggestionDetails.cancel();
                    this.currentSuggestionDetails = null;
                    this.focusedItem = null;
                }
                this.editor.setAriaOptions({ activeDescendant: undefined });
                return;
            }
            if (!this.completionModel) {
                return;
            }
            const item = e.elements[0];
            const index = e.indexes[0];
            this.firstFocusInCurrentList = !this.focusedItem;
            if (item !== this.focusedItem) {
                if (this.currentSuggestionDetails) {
                    this.currentSuggestionDetails.cancel();
                    this.currentSuggestionDetails = null;
                }
                this.focusedItem = item;
                this.list.reveal(index);
                this.currentSuggestionDetails = async_1.createCancelablePromise(async (token) => {
                    const loading = async_1.disposableTimeout(() => this.showDetails(true), 250);
                    token.onCancellationRequested(() => loading.dispose());
                    const result = await item.resolve(token);
                    loading.dispose();
                    return result;
                });
                this.currentSuggestionDetails.then(() => {
                    if (index >= this.list.length || item !== this.list.element(index)) {
                        return;
                    }
                    // item can have extra information, so re-render
                    this.ignoreFocusEvents = true;
                    this.list.splice(index, 1, [item]);
                    this.list.setFocus([index]);
                    this.ignoreFocusEvents = false;
                    if (this.expandDocsSettingFromStorage()) {
                        this.showDetails(false);
                    }
                    else {
                        this.element.classList.remove('docs-side');
                    }
                    this.editor.setAriaOptions({ activeDescendant: getAriaId(index) });
                }).catch(errors_1.onUnexpectedError);
            }
            // emit an event
            this.onDidFocusEmitter.fire({ item, index, model: this.completionModel });
        }
        setState(state) {
            if (!this.element) {
                return;
            }
            if (!this.isAddedAsContentWidget && state !== 0 /* Hidden */) {
                this.isAddedAsContentWidget = true;
                this.editor.addContentWidget(this);
            }
            const stateChanged = this.state !== state;
            this.state = state;
            this.element.classList.toggle('frozen', state === 4 /* Frozen */);
            switch (state) {
                case 0 /* Hidden */:
                    dom_1.hide(this.messageElement, this.details.element, this.listElement, this.statusBarElement);
                    this.hide();
                    this.listHeight = 0;
                    if (stateChanged) {
                        this.list.splice(0, this.list.length);
                    }
                    this.focusedItem = null;
                    break;
                case 1 /* Loading */:
                    this.messageElement.textContent = SuggestWidget.LOADING_MESSAGE;
                    dom_1.hide(this.listElement, this.details.element, this.statusBarElement);
                    dom_1.show(this.messageElement);
                    this.element.classList.remove('docs-side');
                    this.show();
                    this.focusedItem = null;
                    break;
                case 2 /* Empty */:
                    this.messageElement.textContent = SuggestWidget.NO_SUGGESTIONS_MESSAGE;
                    dom_1.hide(this.listElement, this.details.element, this.statusBarElement);
                    dom_1.show(this.messageElement);
                    this.element.classList.remove('docs-side');
                    this.show();
                    this.focusedItem = null;
                    break;
                case 3 /* Open */:
                    dom_1.hide(this.messageElement);
                    dom_1.show(this.listElement, this.statusBarElement);
                    this.show();
                    break;
                case 4 /* Frozen */:
                    dom_1.hide(this.messageElement);
                    dom_1.show(this.listElement);
                    this.show();
                    break;
                case 5 /* Details */:
                    dom_1.hide(this.messageElement);
                    dom_1.show(this.details.element, this.listElement, this.statusBarElement);
                    this.show();
                    break;
            }
        }
        showTriggered(auto, delay) {
            if (this.state !== 0 /* Hidden */) {
                return;
            }
            this.isAuto = !!auto;
            if (!this.isAuto) {
                this.loadingTimeout = async_1.disposableTimeout(() => this.setState(1 /* Loading */), delay);
            }
        }
        showSuggestions(completionModel, selectionIndex, isFrozen, isAuto) {
            this.preferDocPositionTop = false;
            this.docsPositionPreviousWidgetY = null;
            this.loadingTimeout.dispose();
            if (this.currentSuggestionDetails) {
                this.currentSuggestionDetails.cancel();
                this.currentSuggestionDetails = null;
            }
            if (this.completionModel !== completionModel) {
                this.completionModel = completionModel;
            }
            if (isFrozen && this.state !== 2 /* Empty */ && this.state !== 0 /* Hidden */) {
                this.setState(4 /* Frozen */);
                return;
            }
            let visibleCount = this.completionModel.items.length;
            const isEmpty = visibleCount === 0;
            this.ctxSuggestWidgetMultipleSuggestions.set(visibleCount > 1);
            if (isEmpty) {
                if (isAuto) {
                    this.setState(0 /* Hidden */);
                }
                else {
                    this.setState(2 /* Empty */);
                }
                this.completionModel = null;
            }
            else {
                if (this.state !== 3 /* Open */) {
                    const { stats } = this.completionModel;
                    stats['wasAutomaticallyTriggered'] = !!isAuto;
                    /* __GDPR__
                        "suggestWidget" : {
                            "wasAutomaticallyTriggered" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "${include}": [
                                "${ICompletionStats}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog('suggestWidget', Object.assign({}, stats));
                }
                this.focusedItem = null;
                this.list.splice(0, this.list.length, this.completionModel.items);
                if (isFrozen) {
                    this.setState(4 /* Frozen */);
                }
                else {
                    this.setState(3 /* Open */);
                }
                this.list.reveal(selectionIndex, 0);
                this.list.setFocus([selectionIndex]);
                // Reset focus border
                if (this.detailsBorderColor) {
                    this.details.element.style.borderColor = this.detailsBorderColor;
                }
            }
        }
        selectNextPage() {
            switch (this.state) {
                case 0 /* Hidden */:
                    return false;
                case 5 /* Details */:
                    this.details.pageDown();
                    return true;
                case 1 /* Loading */:
                    return !this.isAuto;
                default:
                    this.list.focusNextPage();
                    return true;
            }
        }
        selectNext() {
            switch (this.state) {
                case 0 /* Hidden */:
                    return false;
                case 1 /* Loading */:
                    return !this.isAuto;
                default:
                    this.list.focusNext(1, true);
                    return true;
            }
        }
        selectLast() {
            switch (this.state) {
                case 0 /* Hidden */:
                    return false;
                case 5 /* Details */:
                    this.details.scrollBottom();
                    return true;
                case 1 /* Loading */:
                    return !this.isAuto;
                default:
                    this.list.focusLast();
                    return true;
            }
        }
        selectPreviousPage() {
            switch (this.state) {
                case 0 /* Hidden */:
                    return false;
                case 5 /* Details */:
                    this.details.pageUp();
                    return true;
                case 1 /* Loading */:
                    return !this.isAuto;
                default:
                    this.list.focusPreviousPage();
                    return true;
            }
        }
        selectPrevious() {
            switch (this.state) {
                case 0 /* Hidden */:
                    return false;
                case 1 /* Loading */:
                    return !this.isAuto;
                default:
                    this.list.focusPrevious(1, true);
                    return false;
            }
        }
        selectFirst() {
            switch (this.state) {
                case 0 /* Hidden */:
                    return false;
                case 5 /* Details */:
                    this.details.scrollTop();
                    return true;
                case 1 /* Loading */:
                    return !this.isAuto;
                default:
                    this.list.focusFirst();
                    return true;
            }
        }
        getFocusedItem() {
            if (this.state !== 0 /* Hidden */
                && this.state !== 2 /* Empty */
                && this.state !== 1 /* Loading */
                && this.completionModel) {
                return {
                    item: this.list.getFocusedElements()[0],
                    index: this.list.getFocus()[0],
                    model: this.completionModel
                };
            }
            return undefined;
        }
        toggleDetailsFocus() {
            if (this.state === 5 /* Details */) {
                this.setState(3 /* Open */);
                if (this.detailsBorderColor) {
                    this.details.element.style.borderColor = this.detailsBorderColor;
                }
            }
            else if (this.state === 3 /* Open */ && this.expandDocsSettingFromStorage()) {
                this.setState(5 /* Details */);
                if (this.detailsFocusBorderColor) {
                    this.details.element.style.borderColor = this.detailsFocusBorderColor;
                }
            }
            this.telemetryService.publicLog2('suggestWidget:toggleDetailsFocus');
        }
        toggleDetails() {
            if (!canExpandCompletionItem(this.list.getFocusedElements()[0])) {
                return;
            }
            if (this.expandDocsSettingFromStorage()) {
                this.ctxSuggestWidgetDetailsVisible.set(false);
                this.updateExpandDocsSetting(false);
                dom_1.hide(this.details.element);
                this.element.classList.remove('docs-side', 'doc-below');
                this.editor.layoutContentWidget(this);
                this.telemetryService.publicLog2('suggestWidget:collapseDetails');
            }
            else {
                if (this.state !== 3 /* Open */ && this.state !== 5 /* Details */ && this.state !== 4 /* Frozen */) {
                    return;
                }
                this.ctxSuggestWidgetDetailsVisible.set(true);
                this.updateExpandDocsSetting(true);
                this.showDetails(false);
                this.telemetryService.publicLog2('suggestWidget:expandDetails');
            }
        }
        showDetails(loading) {
            if (!loading) {
                // When loading, don't re-layout docs, as item is not resolved yet #88731
                this.expandSideOrBelow();
            }
            dom_1.show(this.details.element);
            this.details.element.style.maxHeight = this.maxWidgetHeight + 'px';
            if (loading) {
                this.details.renderLoading();
            }
            else {
                this.details.renderItem(this.list.getFocusedElements()[0], this.explainMode);
            }
            // Reset margin-top that was set as Fix for #26416
            this.listElement.style.marginTop = '0px';
            // with docs showing up widget width/height may change, so reposition the widget
            this.editor.layoutContentWidget(this);
            this.adjustDocsPosition();
            this.editor.focus();
        }
        toggleExplainMode() {
            if (this.list.getFocusedElements()[0] && this.expandDocsSettingFromStorage()) {
                this.explainMode = !this.explainMode;
                this.showDetails(false);
            }
        }
        show() {
            const newHeight = this.updateListHeight();
            if (newHeight !== this.listHeight) {
                this.editor.layoutContentWidget(this);
                this.listHeight = newHeight;
            }
            this.ctxSuggestWidgetVisible.set(true);
            this.showTimeout.cancelAndSet(() => {
                this.element.classList.add('visible');
                this.onDidShowEmitter.fire(this);
            }, 100);
        }
        hide() {
            this.ctxSuggestWidgetVisible.reset();
            this.ctxSuggestWidgetMultipleSuggestions.reset();
            this.element.classList.remove('visible');
        }
        hideWidget() {
            this.loadingTimeout.dispose();
            this.setState(0 /* Hidden */);
            this.onDidHideEmitter.fire(this);
        }
        getPosition() {
            if (this.state === 0 /* Hidden */) {
                return null;
            }
            let preference = [2 /* BELOW */, 1 /* ABOVE */];
            if (this.preferDocPositionTop) {
                preference = [1 /* ABOVE */];
            }
            return {
                position: this.editor.getPosition(),
                preference: preference
            };
        }
        getDomNode() {
            return this.element;
        }
        getId() {
            return SuggestWidget.ID;
        }
        isFrozen() {
            return this.state === 4 /* Frozen */;
        }
        updateListHeight() {
            let height = 0;
            if (this.state === 2 /* Empty */ || this.state === 1 /* Loading */) {
                height = this.unfocusedHeight;
            }
            else {
                const suggestionCount = this.list.contentHeight / this.unfocusedHeight;
                const { maxVisibleSuggestions } = this.editor.getOption(96 /* suggest */);
                height = Math.min(suggestionCount, maxVisibleSuggestions) * this.unfocusedHeight;
            }
            this.element.style.lineHeight = `${this.unfocusedHeight}px`;
            this.listElement.style.height = `${height}px`;
            this.statusBarElement.style.top = `${height}px`;
            this.list.layout(height);
            return height;
        }
        /**
         * Adds the propert classes, margins when positioning the docs to the side
         */
        adjustDocsPosition() {
            if (!this.editor.hasModel()) {
                return;
            }
            const lineHeight = this.editor.getOption(51 /* lineHeight */);
            const cursorCoords = this.editor.getScrolledVisiblePosition(this.editor.getPosition());
            const editorCoords = dom_1.getDomNodePagePosition(this.editor.getDomNode());
            const cursorX = editorCoords.left + cursorCoords.left;
            const cursorY = editorCoords.top + cursorCoords.top + cursorCoords.height;
            const widgetCoords = dom_1.getDomNodePagePosition(this.element);
            const widgetX = widgetCoords.left;
            const widgetY = widgetCoords.top;
            // Fixes #27649
            // Check if the Y changed to the top of the cursor and keep the widget flagged to prefer top
            if (this.docsPositionPreviousWidgetY &&
                this.docsPositionPreviousWidgetY < widgetY &&
                !this.preferDocPositionTop) {
                this.preferDocPositionTop = true;
                this.adjustDocsPosition();
                return;
            }
            this.docsPositionPreviousWidgetY = widgetY;
            if (widgetX < cursorX - this.listWidth) {
                // Widget is too far to the left of cursor, swap list and docs
                this.element.classList.add('list-right');
            }
            else {
                this.element.classList.remove('list-right');
            }
            // Compare top of the cursor (cursorY - lineheight) with widgetTop to determine if
            // margin-top needs to be applied on list to make it appear right above the cursor
            // Cannot compare cursorY directly as it may be a few decimals off due to zoooming
            if (this.element.classList.contains('docs-side')
                && cursorY - lineHeight > widgetY
                && this.details.element.offsetHeight > this.listElement.offsetHeight) {
                // Fix for #26416
                // Docs is bigger than list and widget is above cursor, apply margin-top so that list appears right above cursor
                this.listElement.style.marginTop = `${this.details.element.offsetHeight - this.listElement.offsetHeight}px`;
            }
        }
        /**
         * Adds the proper classes for positioning the docs to the side or below depending on item
         */
        expandSideOrBelow() {
            if (!canExpandCompletionItem(this.focusedItem) && this.firstFocusInCurrentList) {
                this.element.classList.remove('docs-side', 'docs-below');
                return;
            }
            let matches = this.element.style.maxWidth.match(/(\d+)px/);
            if (!matches || Number(matches[1]) < this.maxWidgetWidth) {
                this.element.classList.add('docs-below');
                this.element.classList.remove('docs-side');
            }
            else if (canExpandCompletionItem(this.focusedItem)) {
                this.element.classList.add('docs-side');
                this.element.classList.remove('docs-below');
            }
        }
        // Heights
        get maxWidgetHeight() {
            return this.unfocusedHeight * this.editor.getOption(96 /* suggest */).maxVisibleSuggestions;
        }
        get unfocusedHeight() {
            const options = this.editor.getOptions();
            return options.get(98 /* suggestLineHeight */) || options.get(36 /* fontInfo */).lineHeight;
        }
        // IDelegate
        getHeight(element) {
            return this.unfocusedHeight;
        }
        getTemplateId(element) {
            return 'suggestion';
        }
        expandDocsSettingFromStorage() {
            return this.storageService.getBoolean('expandSuggestionDocs', 0 /* GLOBAL */, expandSuggestionDocsByDefault);
        }
        updateExpandDocsSetting(value) {
            this.storageService.store('expandSuggestionDocs', value, 0 /* GLOBAL */);
        }
        dispose() {
            this.details.dispose();
            this.list.dispose();
            this.toDispose.dispose();
            this.loadingTimeout.dispose();
            this.showTimeout.dispose();
            this.editor.removeContentWidget(this);
        }
    };
    SuggestWidget.ID = 'editor.widget.suggestWidget';
    SuggestWidget.LOADING_MESSAGE = nls.localize('suggestWidget.loading', "Loading...");
    SuggestWidget.NO_SUGGESTIONS_MESSAGE = nls.localize('suggestWidget.noSuggestions', "No suggestions.");
    SuggestWidget = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, modeService_1.IModeService),
        __param(7, opener_1.IOpenerService),
        __param(8, actions_1.IMenuService),
        __param(9, instantiation_1.IInstantiationService)
    ], SuggestWidget);
    exports.SuggestWidget = SuggestWidget;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const matchHighlight = theme.getColor(exports.editorSuggestWidgetHighlightForeground);
        if (matchHighlight) {
            collector.addRule(`.monaco-editor .suggest-widget .monaco-list .monaco-list-row .monaco-highlighted-label .highlight { color: ${matchHighlight}; }`);
        }
        const foreground = theme.getColor(exports.editorSuggestWidgetForeground);
        if (foreground) {
            collector.addRule(`.monaco-editor .suggest-widget { color: ${foreground}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-editor .suggest-widget a { color: ${link}; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.monaco-editor .suggest-widget code { background-color: ${codeBackground}; }`);
        }
    });
});
//# __sourceMappingURL=suggestWidget.js.map