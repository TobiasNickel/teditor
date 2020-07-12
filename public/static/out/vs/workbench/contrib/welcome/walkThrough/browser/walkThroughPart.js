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
define(["require", "exports", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/touch", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/welcome/walkThrough/browser/walkThroughInput", "vs/platform/opener/common/opener", "vs/base/common/marked/marked", "vs/editor/common/services/modelService", "vs/editor/browser/widget/codeEditorWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/nls", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/base/common/types", "vs/platform/commands/common/commands", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/welcome/walkThrough/common/walkThroughUtils", "vs/base/common/keybindingLabels", "vs/base/common/platform", "vs/base/common/objects", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/event", "vs/css!./walkThroughPart"], function (require, exports, scrollableElement_1, touch_1, strings, uri_1, lifecycle_1, baseEditor_1, telemetry_1, walkThroughInput_1, opener_1, marked, modelService_1, codeEditorWidget_1, instantiation_1, keybinding_1, nls_1, storage_1, contextkey_1, configuration_1, event_1, types_1, commands_1, themeService_1, colorRegistry_1, walkThroughUtils_1, keybindingLabels_1, platform_1, objects_1, notification_1, dom_1, editorGroupsService_1, event_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.embeddedEditorBackground = exports.WalkThroughPart = exports.WALK_THROUGH_FOCUS = void 0;
    exports.WALK_THROUGH_FOCUS = new contextkey_1.RawContextKey('interactivePlaygroundFocus', false);
    const UNBOUND_COMMAND = nls_1.localize('walkThrough.unboundCommand', "unbound");
    const WALK_THROUGH_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'walkThroughEditorViewState';
    let WalkThroughPart = class WalkThroughPart extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, modelService, instantiationService, openerService, keybindingService, storageService, contextKeyService, configurationService, notificationService, editorGroupService) {
            super(WalkThroughPart.ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.keybindingService = keybindingService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.contentDisposables = [];
            this.editorFocus = exports.WALK_THROUGH_FOCUS.bindTo(this.contextKeyService);
            this.editorMemento = this.getEditorMemento(editorGroupService, WALK_THROUGH_EDITOR_VIEW_STATE_PREFERENCE_KEY);
        }
        createEditor(container) {
            this.content = document.createElement('div');
            this.content.tabIndex = 0;
            this.content.style.outlineStyle = 'none';
            this.scrollbar = new scrollableElement_1.DomScrollableElement(this.content, {
                horizontal: 1 /* Auto */,
                vertical: 1 /* Auto */
            });
            this.disposables.add(this.scrollbar);
            container.appendChild(this.scrollbar.getDomNode());
            this.registerFocusHandlers();
            this.registerClickHandler();
            this.disposables.add(this.scrollbar.onScroll(e => this.updatedScrollPosition()));
        }
        updatedScrollPosition() {
            const scrollDimensions = this.scrollbar.getScrollDimensions();
            const scrollPosition = this.scrollbar.getScrollPosition();
            const scrollHeight = scrollDimensions.scrollHeight;
            if (scrollHeight && this.input instanceof walkThroughInput_1.WalkThroughInput) {
                const scrollTop = scrollPosition.scrollTop;
                const height = scrollDimensions.height;
                this.input.relativeScrollPosition(scrollTop / scrollHeight, (scrollTop + height) / scrollHeight);
            }
        }
        onTouchChange(event) {
            event.preventDefault();
            event.stopPropagation();
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop - event.translationY });
        }
        addEventListener(element, type, listener, useCapture) {
            element.addEventListener(type, listener, useCapture);
            return lifecycle_1.toDisposable(() => { element.removeEventListener(type, listener, useCapture); });
        }
        registerFocusHandlers() {
            this.disposables.add(this.addEventListener(this.content, 'mousedown', e => {
                this.focus();
            }));
            this.disposables.add(this.addEventListener(this.content, 'focus', e => {
                this.editorFocus.set(true);
            }));
            this.disposables.add(this.addEventListener(this.content, 'blur', e => {
                this.editorFocus.reset();
            }));
            this.disposables.add(this.addEventListener(this.content, 'focusin', (e) => {
                // Work around scrolling as side-effect of setting focus on the offscreen zone widget (#18929)
                if (e.target instanceof HTMLElement && e.target.classList.contains('zone-widget-container')) {
                    const scrollPosition = this.scrollbar.getScrollPosition();
                    this.content.scrollTop = scrollPosition.scrollTop;
                    this.content.scrollLeft = scrollPosition.scrollLeft;
                }
                if (e.target instanceof HTMLElement) {
                    this.lastFocus = e.target;
                }
            }));
        }
        registerClickHandler() {
            this.content.addEventListener('click', event => {
                for (let node = event.target; node; node = node.parentNode) {
                    if (node instanceof HTMLAnchorElement && node.href) {
                        let baseElement = window.document.getElementsByTagName('base')[0] || window.location;
                        if (baseElement && node.href.indexOf(baseElement.href) >= 0 && node.hash) {
                            const scrollTarget = this.content.querySelector(node.hash);
                            const innerContent = this.content.firstElementChild;
                            if (scrollTarget && innerContent) {
                                const targetTop = scrollTarget.getBoundingClientRect().top - 20;
                                const containerTop = innerContent.getBoundingClientRect().top;
                                this.scrollbar.setScrollPosition({ scrollTop: targetTop - containerTop });
                            }
                        }
                        else {
                            this.open(uri_1.URI.parse(node.href));
                        }
                        event.preventDefault();
                        break;
                    }
                    else if (node instanceof HTMLButtonElement) {
                        const href = node.getAttribute('data-href');
                        if (href) {
                            this.open(uri_1.URI.parse(href));
                        }
                        break;
                    }
                    else if (node === event.currentTarget) {
                        break;
                    }
                }
            });
        }
        open(uri) {
            if (uri.scheme === 'command' && uri.path === 'git.clone' && !commands_1.CommandsRegistry.getCommand('git.clone')) {
                this.notificationService.info(nls_1.localize('walkThrough.gitNotFound', "It looks like Git is not installed on your system."));
                return;
            }
            this.openerService.open(this.addFrom(uri));
        }
        addFrom(uri) {
            if (uri.scheme !== 'command' || !(this.input instanceof walkThroughInput_1.WalkThroughInput)) {
                return uri;
            }
            const query = uri.query ? JSON.parse(uri.query) : {};
            query.from = this.input.getTelemetryFrom();
            return uri.with({ query: JSON.stringify(query) });
        }
        layout(dimension) {
            this.size = dimension;
            dom_1.size(this.content, dimension.width, dimension.height);
            this.updateSizeClasses();
            this.contentDisposables.forEach(disposable => {
                if (disposable instanceof codeEditorWidget_1.CodeEditorWidget) {
                    disposable.layout();
                }
            });
            this.scrollbar.scanDomNode();
        }
        updateSizeClasses() {
            const innerContent = this.content.firstElementChild;
            if (this.size && innerContent) {
                const classList = innerContent.classList;
                classList[this.size.height <= 685 ? 'add' : 'remove']('max-height-685px');
            }
        }
        focus() {
            let active = document.activeElement;
            while (active && active !== this.content) {
                active = active.parentElement;
            }
            if (!active) {
                (this.lastFocus || this.content).focus();
            }
            this.editorFocus.set(true);
        }
        arrowUp() {
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop - this.getArrowScrollHeight() });
        }
        arrowDown() {
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop + this.getArrowScrollHeight() });
        }
        getArrowScrollHeight() {
            let fontSize = this.configurationService.getValue('editor.fontSize');
            if (typeof fontSize !== 'number' || fontSize < 1) {
                fontSize = 12;
            }
            return 3 * fontSize;
        }
        pageUp() {
            const scrollDimensions = this.scrollbar.getScrollDimensions();
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop - scrollDimensions.height });
        }
        pageDown() {
            const scrollDimensions = this.scrollbar.getScrollDimensions();
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop + scrollDimensions.height });
        }
        setInput(input, options, token) {
            if (this.input instanceof walkThroughInput_1.WalkThroughInput) {
                this.saveTextEditorViewState(this.input);
            }
            this.contentDisposables = lifecycle_1.dispose(this.contentDisposables);
            this.content.innerHTML = '';
            return super.setInput(input, options, token)
                .then(() => {
                return input.resolve();
            })
                .then(model => {
                if (token.isCancellationRequested) {
                    return;
                }
                const content = model.main.textEditorModel.getValue(1 /* LF */);
                if (!strings.endsWith(input.resource.path, '.md')) {
                    this.content.innerHTML = content;
                    this.updateSizeClasses();
                    this.decorateContent();
                    this.contentDisposables.push(this.keybindingService.onDidUpdateKeybindings(() => this.decorateContent()));
                    if (input.onReady) {
                        input.onReady(this.content.firstElementChild);
                    }
                    this.scrollbar.scanDomNode();
                    this.loadTextEditorViewState(input);
                    this.updatedScrollPosition();
                    return;
                }
                let i = 0;
                const renderer = new marked.Renderer();
                renderer.code = (code, lang) => {
                    const id = `snippet-${model.snippets[i++].textEditorModel.uri.fragment}`;
                    return `<div id="${id}" class="walkThroughEditorContainer" ></div>`;
                };
                const innerContent = document.createElement('div');
                innerContent.classList.add('walkThroughContent'); // only for markdown files
                const markdown = this.expandMacros(content);
                innerContent.innerHTML = marked(markdown, { renderer });
                this.content.appendChild(innerContent);
                model.snippets.forEach((snippet, i) => {
                    const model = snippet.textEditorModel;
                    const id = `snippet-${model.uri.fragment}`;
                    const div = innerContent.querySelector(`#${id.replace(/[\\.]/g, '\\$&')}`);
                    const options = this.getEditorOptions(snippet.textEditorModel.getModeId());
                    const telemetryData = {
                        target: this.input instanceof walkThroughInput_1.WalkThroughInput ? this.input.getTelemetryFrom() : undefined,
                        snippet: i
                    };
                    const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, div, options, {
                        telemetryData: telemetryData
                    });
                    editor.setModel(model);
                    this.contentDisposables.push(editor);
                    const updateHeight = (initial) => {
                        const lineHeight = editor.getOption(51 /* lineHeight */);
                        const height = `${Math.max(model.getLineCount() + 1, 4) * lineHeight}px`;
                        if (div.style.height !== height) {
                            div.style.height = height;
                            editor.layout();
                            if (!initial) {
                                this.scrollbar.scanDomNode();
                            }
                        }
                    };
                    updateHeight(true);
                    this.contentDisposables.push(editor.onDidChangeModelContent(() => updateHeight(false)));
                    this.contentDisposables.push(editor.onDidChangeCursorPosition(e => {
                        const innerContent = this.content.firstElementChild;
                        if (innerContent) {
                            const targetTop = div.getBoundingClientRect().top;
                            const containerTop = innerContent.getBoundingClientRect().top;
                            const lineHeight = editor.getOption(51 /* lineHeight */);
                            const lineTop = (targetTop + (e.position.lineNumber - 1) * lineHeight) - containerTop;
                            const lineBottom = lineTop + lineHeight;
                            const scrollDimensions = this.scrollbar.getScrollDimensions();
                            const scrollPosition = this.scrollbar.getScrollPosition();
                            const scrollTop = scrollPosition.scrollTop;
                            const height = scrollDimensions.height;
                            if (scrollTop > lineTop) {
                                this.scrollbar.setScrollPosition({ scrollTop: lineTop });
                            }
                            else if (scrollTop < lineBottom - height) {
                                this.scrollbar.setScrollPosition({ scrollTop: lineBottom - height });
                            }
                        }
                    }));
                    this.contentDisposables.push(this.configurationService.onDidChangeConfiguration(() => {
                        if (snippet.textEditorModel) {
                            editor.updateOptions(this.getEditorOptions(snippet.textEditorModel.getModeId()));
                        }
                    }));
                    this.contentDisposables.push(event_1.Event.once(editor.onMouseDown)(() => {
                        this.telemetryService.publicLog2('walkThroughSnippetInteraction', {
                            from: this.input instanceof walkThroughInput_1.WalkThroughInput ? this.input.getTelemetryFrom() : undefined,
                            type: 'mouseDown',
                            snippet: i
                        });
                    }));
                    this.contentDisposables.push(event_1.Event.once(editor.onKeyDown)(() => {
                        this.telemetryService.publicLog2('walkThroughSnippetInteraction', {
                            from: this.input instanceof walkThroughInput_1.WalkThroughInput ? this.input.getTelemetryFrom() : undefined,
                            type: 'keyDown',
                            snippet: i
                        });
                    }));
                    this.contentDisposables.push(event_1.Event.once(editor.onDidChangeModelContent)(() => {
                        this.telemetryService.publicLog2('walkThroughSnippetInteraction', {
                            from: this.input instanceof walkThroughInput_1.WalkThroughInput ? this.input.getTelemetryFrom() : undefined,
                            type: 'changeModelContent',
                            snippet: i
                        });
                    }));
                });
                this.updateSizeClasses();
                this.multiCursorModifier();
                this.contentDisposables.push(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('editor.multiCursorModifier')) {
                        this.multiCursorModifier();
                    }
                }));
                if (input.onReady) {
                    input.onReady(innerContent);
                }
                this.scrollbar.scanDomNode();
                this.loadTextEditorViewState(input);
                this.updatedScrollPosition();
                this.contentDisposables.push(touch_1.Gesture.addTarget(innerContent));
                this.contentDisposables.push(event_2.domEvent(innerContent, touch_1.EventType.Change)(this.onTouchChange, this, this.disposables));
            });
        }
        getEditorOptions(language) {
            const config = objects_1.deepClone(this.configurationService.getValue('editor', { overrideIdentifier: language }));
            return Object.assign(Object.assign({}, types_1.isObject(config) ? config : Object.create(null)), { scrollBeyondLastLine: false, scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    alwaysConsumeMouseWheel: false
                }, overviewRulerLanes: 3, fixedOverflowWidgets: false, lineNumbersMinChars: 1, minimap: { enabled: false } });
        }
        expandMacros(input) {
            return input.replace(/kb\(([a-z.\d\-]+)\)/gi, (match, kb) => {
                const keybinding = this.keybindingService.lookupKeybinding(kb);
                const shortcut = keybinding ? keybinding.getLabel() || '' : UNBOUND_COMMAND;
                return `<span class="shortcut">${strings.escape(shortcut)}</span>`;
            });
        }
        decorateContent() {
            const keys = this.content.querySelectorAll('.shortcut[data-command]');
            Array.prototype.forEach.call(keys, (key) => {
                const command = key.getAttribute('data-command');
                const keybinding = command && this.keybindingService.lookupKeybinding(command);
                const label = keybinding ? keybinding.getLabel() || '' : UNBOUND_COMMAND;
                while (key.firstChild) {
                    key.removeChild(key.firstChild);
                }
                key.appendChild(document.createTextNode(label));
            });
            const ifkeys = this.content.querySelectorAll('.if_shortcut[data-command]');
            Array.prototype.forEach.call(ifkeys, (key) => {
                const command = key.getAttribute('data-command');
                const keybinding = command && this.keybindingService.lookupKeybinding(command);
                key.style.display = !keybinding ? 'none' : '';
            });
        }
        multiCursorModifier() {
            const labels = keybindingLabels_1.UILabelProvider.modifierLabels[platform_1.OS];
            const value = this.configurationService.getValue('editor.multiCursorModifier');
            const modifier = labels[value === 'ctrlCmd' ? (platform_1.OS === 2 /* Macintosh */ ? 'metaKey' : 'ctrlKey') : 'altKey'];
            const keys = this.content.querySelectorAll('.multi-cursor-modifier');
            Array.prototype.forEach.call(keys, (key) => {
                while (key.firstChild) {
                    key.removeChild(key.firstChild);
                }
                key.appendChild(document.createTextNode(modifier));
            });
        }
        saveTextEditorViewState(input) {
            const scrollPosition = this.scrollbar.getScrollPosition();
            if (this.group) {
                this.editorMemento.saveEditorState(this.group, input, {
                    viewState: {
                        scrollTop: scrollPosition.scrollTop,
                        scrollLeft: scrollPosition.scrollLeft
                    }
                });
            }
        }
        loadTextEditorViewState(input) {
            if (this.group) {
                const state = this.editorMemento.loadEditorState(this.group, input);
                if (state) {
                    this.scrollbar.setScrollPosition(state.viewState);
                }
            }
        }
        clearInput() {
            if (this.input instanceof walkThroughInput_1.WalkThroughInput) {
                this.saveTextEditorViewState(this.input);
            }
            super.clearInput();
        }
        saveState() {
            if (this.input instanceof walkThroughInput_1.WalkThroughInput) {
                this.saveTextEditorViewState(this.input);
            }
            super.saveState();
        }
        dispose() {
            this.editorFocus.reset();
            this.contentDisposables = lifecycle_1.dispose(this.contentDisposables);
            this.disposables.dispose();
            super.dispose();
        }
    };
    WalkThroughPart.ID = 'workbench.editor.walkThroughPart';
    WalkThroughPart = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, modelService_1.IModelService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, opener_1.IOpenerService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, storage_1.IStorageService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, notification_1.INotificationService),
        __param(10, editorGroupsService_1.IEditorGroupsService)
    ], WalkThroughPart);
    exports.WalkThroughPart = WalkThroughPart;
    // theming
    exports.embeddedEditorBackground = colorRegistry_1.registerColor('walkThrough.embeddedEditorBackground', { dark: null, light: null, hc: null }, nls_1.localize('walkThrough.embeddedEditorBackground', 'Background color for the embedded editors on the Interactive Playground.'));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const color = walkThroughUtils_1.getExtraColor(theme, exports.embeddedEditorBackground, { dark: 'rgba(0, 0, 0, .4)', extra_dark: 'rgba(200, 235, 255, .064)', light: '#f4f4f4', hc: null });
        if (color) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent .monaco-editor-background,
			.monaco-workbench .part.editor > .content .walkThroughContent .margin-view-overlays { background: ${color}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent a { color: ${link}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent a:hover,
			.monaco-workbench .part.editor > .content .walkThroughContent a:active { color: ${activeLink}; }`);
        }
        const focusColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent a:focus { outline-color: ${focusColor}; }`);
        }
        const shortcut = theme.getColor(colorRegistry_1.textPreformatForeground);
        if (shortcut) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent code,
			.monaco-workbench .part.editor > .content .walkThroughContent .shortcut { color: ${shortcut}; }`);
        }
        const border = theme.getColor(colorRegistry_1.contrastBorder);
        if (border) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent .monaco-editor { border-color: ${border}; }`);
        }
        const quoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
        if (quoteBackground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent blockquote { background: ${quoteBackground}; }`);
        }
        const quoteBorder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
        if (quoteBorder) {
            collector.addRule(`.monaco-workbench .part.editor > .content .walkThroughContent blockquote { border-color: ${quoteBorder}; }`);
        }
    });
});
//# __sourceMappingURL=walkThroughPart.js.map