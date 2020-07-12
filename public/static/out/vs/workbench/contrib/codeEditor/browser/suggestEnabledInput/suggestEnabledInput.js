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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/editor/contrib/contextmenu/contextmenu", "vs/editor/contrib/snippet/snippetController2", "vs/editor/contrib/suggest/suggestController", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/browser/editorExtensions", "vs/workbench/browser/style", "vs/css!./suggestEnabledInput"], function (require, exports, dom_1, widget_1, event_1, objects_1, platform_1, uri_1, codeEditorWidget_1, editOperation_1, position_1, range_1, modes, modelService_1, contextmenu_1, snippetController2_1, suggestController_1, instantiation_1, colorRegistry_1, styler_1, themeService_1, menuPreventer_1, simpleEditorOptions_1, selectionClipboard_1, editorExtensions_1, style_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestEnabledInput = exports.attachSuggestEnabledInputBoxStyler = void 0;
    function attachSuggestEnabledInputBoxStyler(widget, themeService, style) {
        return styler_1.attachStyler(themeService, {
            inputBackground: (style && style.inputBackground) || colorRegistry_1.inputBackground,
            inputForeground: (style && style.inputForeground) || colorRegistry_1.inputForeground,
            inputBorder: (style && style.inputBorder) || colorRegistry_1.inputBorder,
            inputPlaceholderForeground: (style && style.inputPlaceholderForeground) || colorRegistry_1.inputPlaceholderForeground,
        }, widget);
    }
    exports.attachSuggestEnabledInputBoxStyler = attachSuggestEnabledInputBoxStyler;
    let SuggestEnabledInput = class SuggestEnabledInput extends widget_1.Widget {
        constructor(id, parent, suggestionProvider, ariaLabel, resourceHandle, options, instantiationService, modelService) {
            super();
            this._onShouldFocusResults = new event_1.Emitter();
            this.onShouldFocusResults = this._onShouldFocusResults.event;
            this._onEnter = new event_1.Emitter();
            this.onEnter = this._onEnter.event;
            this._onInputDidChange = new event_1.Emitter();
            this.onInputDidChange = this._onInputDidChange.event;
            this.stylingContainer = dom_1.append(parent, dom_1.$('.suggest-input-container'));
            this.placeholderText = dom_1.append(this.stylingContainer, dom_1.$('.suggest-input-placeholder', undefined, options.placeholderText || ''));
            const editorOptions = objects_1.mixin(simpleEditorOptions_1.getSimpleEditorOptions(), getSuggestEnabledInputOptions(ariaLabel));
            this.inputWidget = instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.stylingContainer, editorOptions, {
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    suggestController_1.SuggestController.ID,
                    snippetController2_1.SnippetController2.ID,
                    contextmenu_1.ContextMenuController.ID,
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                ]),
                isSimpleWidget: true,
            });
            this._register(this.inputWidget);
            let scopeHandle = uri_1.URI.parse(resourceHandle);
            this.inputModel = modelService.createModel('', null, scopeHandle, true);
            this.inputWidget.setModel(this.inputModel);
            this._register(this.inputWidget.onDidPaste(() => this.setValue(this.getValue()))); // setter cleanses
            this._register((this.inputWidget.onDidFocusEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(true);
                }
                dom_1.addClass(this.stylingContainer, 'synthetic-focus');
            })));
            this._register((this.inputWidget.onDidBlurEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(false);
                }
                dom_1.removeClass(this.stylingContainer, 'synthetic-focus');
            })));
            const onKeyDownMonaco = event_1.Event.chain(this.inputWidget.onKeyDown);
            this._register(onKeyDownMonaco.filter(e => e.keyCode === 3 /* Enter */).on(e => { e.preventDefault(); this._onEnter.fire(); }, this));
            this._register(onKeyDownMonaco.filter(e => e.keyCode === 18 /* DownArrow */ && (platform_1.isMacintosh ? e.metaKey : e.ctrlKey)).on(() => this._onShouldFocusResults.fire(), this));
            let preexistingContent = this.getValue();
            const inputWidgetModel = this.inputWidget.getModel();
            if (inputWidgetModel) {
                this._register(inputWidgetModel.onDidChangeContent(() => {
                    let content = this.getValue();
                    this.placeholderText.style.visibility = content ? 'hidden' : 'visible';
                    if (preexistingContent.trim() === content.trim()) {
                        return;
                    }
                    this._onInputDidChange.fire(undefined);
                    preexistingContent = content;
                }));
            }
            let validatedSuggestProvider = {
                provideResults: suggestionProvider.provideResults,
                sortKey: suggestionProvider.sortKey || (a => a),
                triggerCharacters: suggestionProvider.triggerCharacters || []
            };
            this.setValue(options.value || '');
            this._register(modes.CompletionProviderRegistry.register({ scheme: scopeHandle.scheme, pattern: '**/' + scopeHandle.path, hasAccessToAllModels: true }, {
                triggerCharacters: validatedSuggestProvider.triggerCharacters,
                provideCompletionItems: (model, position, _context) => {
                    let query = model.getValue();
                    const zeroIndexedColumn = position.column - 1;
                    let zeroIndexedWordStart = query.lastIndexOf(' ', zeroIndexedColumn - 1) + 1;
                    let alreadyTypedCount = zeroIndexedColumn - zeroIndexedWordStart;
                    // dont show suggestions if the user has typed something, but hasn't used the trigger character
                    if (alreadyTypedCount > 0 && validatedSuggestProvider.triggerCharacters.indexOf(query[zeroIndexedWordStart]) === -1) {
                        return { suggestions: [] };
                    }
                    return {
                        suggestions: suggestionProvider.provideResults(query).map(result => {
                            return {
                                label: result,
                                insertText: result,
                                range: range_1.Range.fromPositions(position.delta(0, -alreadyTypedCount), position),
                                sortText: validatedSuggestProvider.sortKey(result),
                                kind: 17 /* Keyword */
                            };
                        })
                    };
                }
            }));
        }
        updateAriaLabel(label) {
            this.inputWidget.updateOptions({ ariaLabel: label });
        }
        get onFocus() { return this.inputWidget.onDidFocusEditorText; }
        setValue(val) {
            val = val.replace(/\s/g, ' ');
            const fullRange = this.inputModel.getFullModelRange();
            this.inputWidget.executeEdits('suggestEnabledInput.setValue', [editOperation_1.EditOperation.replace(fullRange, val)]);
            this.inputWidget.setScrollTop(0);
            this.inputWidget.setPosition(new position_1.Position(1, val.length + 1));
        }
        getValue() {
            return this.inputWidget.getValue();
        }
        style(colors) {
            this.stylingContainer.style.backgroundColor = colors.inputBackground ? colors.inputBackground.toString() : '';
            this.stylingContainer.style.color = colors.inputForeground ? colors.inputForeground.toString() : '';
            this.placeholderText.style.color = colors.inputPlaceholderForeground ? colors.inputPlaceholderForeground.toString() : '';
            this.stylingContainer.style.borderWidth = '1px';
            this.stylingContainer.style.borderStyle = 'solid';
            this.stylingContainer.style.borderColor = colors.inputBorder ?
                colors.inputBorder.toString() :
                'transparent';
            const cursor = this.stylingContainer.getElementsByClassName('cursor')[0];
            if (cursor) {
                cursor.style.backgroundColor = colors.inputForeground ? colors.inputForeground.toString() : '';
            }
        }
        focus(selectAll) {
            this.inputWidget.focus();
            if (selectAll && this.inputWidget.getValue()) {
                this.selectAll();
            }
        }
        onHide() {
            this.inputWidget.onHide();
        }
        layout(dimension) {
            this.inputWidget.layout(dimension);
            this.placeholderText.style.width = `${dimension.width - 2}px`;
        }
        selectAll() {
            this.inputWidget.setSelection(new range_1.Range(1, 1, 1, this.getValue().length + 1));
        }
    };
    SuggestEnabledInput = __decorate([
        __param(6, instantiation_1.IInstantiationService),
        __param(7, modelService_1.IModelService)
    ], SuggestEnabledInput);
    exports.SuggestEnabledInput = SuggestEnabledInput;
    // Override styles in selections.ts
    themeService_1.registerThemingParticipant((theme, collector) => {
        let selectionColor = theme.getColor(colorRegistry_1.selectionBackground);
        if (selectionColor) {
            selectionColor = selectionColor.transparent(0.4);
        }
        else {
            selectionColor = theme.getColor(colorRegistry_1.editorSelectionBackground);
        }
        if (selectionColor) {
            collector.addRule(`.suggest-input-container .monaco-editor .focused .selected-text { background-color: ${selectionColor}; }`);
        }
        // Override inactive selection bg
        const inputBackgroundColor = theme.getColor(colorRegistry_1.inputBackground);
        if (inputBackgroundColor) {
            collector.addRule(`.suggest-input-container .monaco-editor .selected-text { background-color: ${inputBackgroundColor.transparent(0.4)}; }`);
        }
        // Override selected fg
        const inputForegroundColor = theme.getColor(colorRegistry_1.inputForeground);
        if (inputForegroundColor) {
            collector.addRule(`.suggest-input-container .monaco-editor .view-line span.inline-selected-text { color: ${inputForegroundColor}; }`);
        }
        const backgroundColor = theme.getColor(colorRegistry_1.inputBackground);
        if (backgroundColor) {
            collector.addRule(`.suggest-input-container .monaco-editor-background { background-color: ${backgroundColor}; } `);
        }
    });
    function getSuggestEnabledInputOptions(ariaLabel) {
        return {
            fontSize: 13,
            lineHeight: 20,
            wordWrap: 'off',
            scrollbar: { vertical: 'hidden', },
            roundedSelection: false,
            renderIndentGuides: false,
            cursorWidth: 1,
            fontFamily: style_1.DEFAULT_FONT_FAMILY,
            ariaLabel: ariaLabel || '',
            snippetSuggestions: 'none',
            suggest: { filterGraceful: false, showIcons: false },
            autoClosingBrackets: 'never'
        };
    }
});
//# __sourceMappingURL=suggestEnabledInput.js.map