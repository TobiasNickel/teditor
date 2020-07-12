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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modeService", "vs/platform/notification/common/notification", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/services/textMate/common/TMHelper", "vs/workbench/services/textMate/common/textMateService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/cancellation", "vs/platform/theme/common/tokenClassificationRegistry", "vs/platform/configuration/common/configuration", "vs/css!./inspectEditorTokens"], function (require, exports, nls, dom, color_1, lifecycle_1, strings_1, editorExtensions_1, range_1, modes_1, modeService_1, notification_1, colorRegistry_1, themeService_1, TMHelper_1, textMateService_1, workbenchThemeService_1, cancellation_1, tokenClassificationRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InspectEditorTokensController = class InspectEditorTokensController extends lifecycle_1.Disposable {
        constructor(editor, textMateService, modeService, themeService, notificationService, configurationService) {
            super();
            this._editor = editor;
            this._textMateService = textMateService;
            this._themeService = themeService;
            this._modeService = modeService;
            this._notificationService = notificationService;
            this._configurationService = configurationService;
            this._widget = null;
            this._register(this._editor.onDidChangeModel((e) => this.stop()));
            this._register(this._editor.onDidChangeModelLanguage((e) => this.stop()));
            this._register(this._editor.onKeyUp((e) => e.keyCode === 9 /* Escape */ && this.stop()));
        }
        static get(editor) {
            return editor.getContribution(InspectEditorTokensController.ID);
        }
        dispose() {
            this.stop();
            super.dispose();
        }
        launch() {
            if (this._widget) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            this._widget = new InspectEditorTokensWidget(this._editor, this._textMateService, this._modeService, this._themeService, this._notificationService, this._configurationService);
        }
        stop() {
            if (this._widget) {
                this._widget.dispose();
                this._widget = null;
            }
        }
        toggle() {
            if (!this._widget) {
                this.launch();
            }
            else {
                this.stop();
            }
        }
    };
    InspectEditorTokensController.ID = 'editor.contrib.inspectEditorTokens';
    InspectEditorTokensController = __decorate([
        __param(1, textMateService_1.ITextMateService),
        __param(2, modeService_1.IModeService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, notification_1.INotificationService),
        __param(5, configuration_1.IConfigurationService)
    ], InspectEditorTokensController);
    class InspectEditorTokens extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inspectTMScopes',
                label: nls.localize('inspectEditorTokens', "Developer: Inspect Editor Tokens and Scopes"),
                alias: 'Developer: Inspect Editor Tokens and Scopes',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            let controller = InspectEditorTokensController.get(editor);
            if (controller) {
                controller.toggle();
            }
        }
    }
    function renderTokenText(tokenText) {
        if (tokenText.length > 40) {
            tokenText = tokenText.substr(0, 20) + '…' + tokenText.substr(tokenText.length - 20);
        }
        let result = '';
        for (let charIndex = 0, len = tokenText.length; charIndex < len; charIndex++) {
            let charCode = tokenText.charCodeAt(charIndex);
            switch (charCode) {
                case 9 /* Tab */:
                    result += '&rarr;';
                    break;
                case 32 /* Space */:
                    result += '&middot;';
                    break;
                case 60 /* LessThan */:
                    result += '&lt;';
                    break;
                case 62 /* GreaterThan */:
                    result += '&gt;';
                    break;
                case 38 /* Ampersand */:
                    result += '&amp;';
                    break;
                default:
                    result += String.fromCharCode(charCode);
            }
        }
        return result;
    }
    class InspectEditorTokensWidget extends lifecycle_1.Disposable {
        constructor(editor, textMateService, modeService, themeService, notificationService, configurationService) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._isDisposed = false;
            this._editor = editor;
            this._modeService = modeService;
            this._themeService = themeService;
            this._textMateService = textMateService;
            this._notificationService = notificationService;
            this._configurationService = configurationService;
            this._model = this._editor.getModel();
            this._domNode = document.createElement('div');
            this._domNode.className = 'token-inspect-widget';
            this._currentRequestCancellationTokenSource = new cancellation_1.CancellationTokenSource();
            this._beginCompute(this._editor.getPosition());
            this._register(this._editor.onDidChangeCursorPosition((e) => this._beginCompute(this._editor.getPosition())));
            this._register(themeService.onDidColorThemeChange(_ => this._beginCompute(this._editor.getPosition())));
            this._register(configurationService.onDidChangeConfiguration(e => e.affectsConfiguration('editor.semanticHighlighting.enabled') && this._beginCompute(this._editor.getPosition())));
            this._editor.addContentWidget(this);
        }
        dispose() {
            this._isDisposed = true;
            this._editor.removeContentWidget(this);
            this._currentRequestCancellationTokenSource.cancel();
            super.dispose();
        }
        getId() {
            return InspectEditorTokensWidget._ID;
        }
        _beginCompute(position) {
            const grammar = this._textMateService.createGrammar(this._model.getLanguageIdentifier().language);
            const semanticTokens = this._computeSemanticTokens(position);
            dom.clearNode(this._domNode);
            this._domNode.appendChild(document.createTextNode(nls.localize('inspectTMScopesWidget.loading', "Loading...")));
            Promise.all([grammar, semanticTokens]).then(([grammar, semanticTokens]) => {
                if (this._isDisposed) {
                    return;
                }
                let text = this._compute(grammar, semanticTokens, position);
                this._domNode.innerHTML = text;
                this._domNode.style.maxWidth = `${Math.max(this._editor.getLayoutInfo().width * 0.66, 500)}px`;
                this._editor.layoutContentWidget(this);
            }, (err) => {
                this._notificationService.warn(err);
                setTimeout(() => {
                    InspectEditorTokensController.get(this._editor).stop();
                });
            });
        }
        _isSemanticColoringEnabled() {
            if (!this._themeService.getColorTheme().semanticHighlighting) {
                return false;
            }
            const options = this._configurationService.getValue('editor.semanticHighlighting', { overrideIdentifier: this._model.getLanguageIdentifier().language, resource: this._model.uri });
            return options && options.enabled;
        }
        _compute(grammar, semanticTokens, position) {
            var _a;
            const textMateTokenInfo = grammar && this._getTokensAtPosition(grammar, position);
            const semanticTokenInfo = semanticTokens && this._getSemanticTokenAtPosition(semanticTokens, position);
            if (!textMateTokenInfo && !semanticTokenInfo) {
                return 'No grammar or semantic tokens available.';
            }
            let tmMetadata = textMateTokenInfo === null || textMateTokenInfo === void 0 ? void 0 : textMateTokenInfo.metadata;
            let semMetadata = semanticTokenInfo === null || semanticTokenInfo === void 0 ? void 0 : semanticTokenInfo.metadata;
            const semTokenText = semanticTokenInfo && renderTokenText(this._model.getValueInRange(semanticTokenInfo.range));
            const tmTokenText = textMateTokenInfo && renderTokenText(this._model.getLineContent(position.lineNumber).substring(textMateTokenInfo.token.startIndex, textMateTokenInfo.token.endIndex));
            const tokenText = semTokenText || tmTokenText || '';
            let result = '';
            result += `<h2 class="tiw-token">${tokenText}<span class="tiw-token-length">(${tokenText.length} ${tokenText.length === 1 ? 'char' : 'chars'})</span></h2>`;
            result += `<hr class="tiw-metadata-separator" style="clear:both"/>`;
            result += `<table class="tiw-metadata-table"><tbody>`;
            result += `<tr><td class="tiw-metadata-key">language</td><td class="tiw-metadata-value">${strings_1.escape((tmMetadata === null || tmMetadata === void 0 ? void 0 : tmMetadata.languageIdentifier.language) || '')}</td></tr>`;
            result += `<tr><td class="tiw-metadata-key">standard token type</td><td class="tiw-metadata-value">${this._tokenTypeToString((tmMetadata === null || tmMetadata === void 0 ? void 0 : tmMetadata.tokenType) || 0 /* Other */)}</td></tr>`;
            result += this._formatMetadata(semMetadata, tmMetadata);
            result += `</tbody></table>`;
            if (semanticTokenInfo) {
                result += `<hr class="tiw-metadata-separator"/>`;
                result += `<table class="tiw-metadata-table"><tbody>`;
                result += `<tr><td class="tiw-metadata-key">semantic token type</td><td class="tiw-metadata-value">${semanticTokenInfo.type}</td></tr>`;
                if (semanticTokenInfo.modifiers.length) {
                    result += `<tr><td class="tiw-metadata-key">modifiers</td><td class="tiw-metadata-value">${semanticTokenInfo.modifiers.join(' ')}</td></tr>`;
                }
                if (semanticTokenInfo.metadata) {
                    const properties = ['foreground', 'bold', 'italic', 'underline'];
                    const propertiesByDefValue = {};
                    const allDefValues = []; // remember the order
                    // first collect to detect when the same rule is used for multiple properties
                    for (let property of properties) {
                        if (semanticTokenInfo.metadata[property] !== undefined) {
                            const definition = semanticTokenInfo.definitions[property];
                            const defValue = this._renderTokenStyleDefinition(definition, property);
                            let properties = propertiesByDefValue[defValue];
                            if (!properties) {
                                propertiesByDefValue[defValue] = properties = [];
                                allDefValues.push(defValue);
                            }
                            properties.push(property);
                        }
                    }
                    for (let defValue of allDefValues) {
                        result += `<tr><td class="tiw-metadata-key">${propertiesByDefValue[defValue].join(', ')}</td><td class="tiw-metadata-value">${defValue}</td></tr>`;
                    }
                }
                result += `</tbody></table>`;
            }
            if (textMateTokenInfo) {
                let theme = this._themeService.getColorTheme();
                result += `<hr class="tiw-metadata-separator"/>`;
                result += `<table class="tiw-metadata-table"><tbody>`;
                if (tmTokenText && tmTokenText !== tokenText) {
                    result += `<tr><td class="tiw-metadata-key">textmate token</td><td class="tiw-metadata-value">${tmTokenText} (${tmTokenText.length})</td></tr>`;
                }
                let scopes = '';
                for (let i = textMateTokenInfo.token.scopes.length - 1; i >= 0; i--) {
                    scopes += strings_1.escape(textMateTokenInfo.token.scopes[i]);
                    if (i > 0) {
                        scopes += '<br>';
                    }
                }
                result += `<tr><td class="tiw-metadata-key">textmate scopes</td><td class="tiw-metadata-value tiw-metadata-scopes">${scopes}</td></tr>`;
                let matchingRule = TMHelper_1.findMatchingThemeRule(theme, textMateTokenInfo.token.scopes, false);
                const semForeground = (_a = semanticTokenInfo === null || semanticTokenInfo === void 0 ? void 0 : semanticTokenInfo.metadata) === null || _a === void 0 ? void 0 : _a.foreground;
                if (matchingRule) {
                    let defValue = `<code class="tiw-theme-selector">${matchingRule.rawSelector}\n${JSON.stringify(matchingRule.settings, null, '\t')}</code>`;
                    if (semForeground !== textMateTokenInfo.metadata.foreground) {
                        if (semForeground) {
                            defValue = `<s>${defValue}</s>`;
                        }
                        result += `<tr><td class="tiw-metadata-key">foreground</td><td class="tiw-metadata-value">${defValue}</td></tr>`;
                    }
                }
                else if (!semForeground) {
                    result += `<tr><td class="tiw-metadata-key">foreground</td><td class="tiw-metadata-value">No theme selector</td></tr>`;
                }
                result += `</tbody></table>`;
            }
            return result;
        }
        _formatMetadata(semantic, tm) {
            let result = '';
            function render(property) {
                let value = (semantic === null || semantic === void 0 ? void 0 : semantic[property]) || (tm === null || tm === void 0 ? void 0 : tm[property]);
                if (value !== undefined) {
                    const semanticStyle = (semantic === null || semantic === void 0 ? void 0 : semantic[property]) ? 'tiw-metadata-semantic' : '';
                    result += `<tr><td class="tiw-metadata-key">${property}</td><td class="tiw-metadata-value ${semanticStyle}">${value}</td></tr>`;
                }
                return value;
            }
            const foreground = render('foreground');
            const background = render('background');
            if (foreground && background) {
                const backgroundColor = color_1.Color.fromHex(background), foregroundColor = color_1.Color.fromHex(foreground);
                if (backgroundColor.isOpaque()) {
                    result += `<tr><td class="tiw-metadata-key">contrast ratio</td><td class="tiw-metadata-value">${backgroundColor.getContrastRatio(foregroundColor.makeOpaque(backgroundColor)).toFixed(2)}</td></tr>`;
                }
                else {
                    result += '<tr><td class="tiw-metadata-key">Contrast ratio cannot be precise for background colors that use transparency</td><td class="tiw-metadata-value"></td></tr>';
                }
            }
            let fontStyleLabels = [];
            function addStyle(key) {
                if (semantic && semantic[key]) {
                    fontStyleLabels.push(`<span class='tiw-metadata-semantic'>${key}</span>`);
                }
                else if (tm && tm[key]) {
                    fontStyleLabels.push(key);
                }
            }
            addStyle('bold');
            addStyle('italic');
            addStyle('underline');
            if (fontStyleLabels.length) {
                result += `<tr><td class="tiw-metadata-key">font style</td><td class="tiw-metadata-value">${fontStyleLabels.join(' ')}</td></tr>`;
            }
            return result;
        }
        _decodeMetadata(metadata) {
            let colorMap = this._themeService.getColorTheme().tokenColorMap;
            let languageId = modes_1.TokenMetadata.getLanguageId(metadata);
            let tokenType = modes_1.TokenMetadata.getTokenType(metadata);
            let fontStyle = modes_1.TokenMetadata.getFontStyle(metadata);
            let foreground = modes_1.TokenMetadata.getForeground(metadata);
            let background = modes_1.TokenMetadata.getBackground(metadata);
            return {
                languageIdentifier: this._modeService.getLanguageIdentifier(languageId),
                tokenType: tokenType,
                bold: (fontStyle & 2 /* Bold */) ? true : undefined,
                italic: (fontStyle & 1 /* Italic */) ? true : undefined,
                underline: (fontStyle & 4 /* Underline */) ? true : undefined,
                foreground: colorMap[foreground],
                background: colorMap[background]
            };
        }
        _tokenTypeToString(tokenType) {
            switch (tokenType) {
                case 0 /* Other */: return 'Other';
                case 1 /* Comment */: return 'Comment';
                case 2 /* String */: return 'String';
                case 4 /* RegEx */: return 'RegEx';
            }
            return '??';
        }
        _getTokensAtPosition(grammar, position) {
            const lineNumber = position.lineNumber;
            let stateBeforeLine = this._getStateBeforeLine(grammar, lineNumber);
            let tokenizationResult1 = grammar.tokenizeLine(this._model.getLineContent(lineNumber), stateBeforeLine);
            let tokenizationResult2 = grammar.tokenizeLine2(this._model.getLineContent(lineNumber), stateBeforeLine);
            let token1Index = 0;
            for (let i = tokenizationResult1.tokens.length - 1; i >= 0; i--) {
                let t = tokenizationResult1.tokens[i];
                if (position.column - 1 >= t.startIndex) {
                    token1Index = i;
                    break;
                }
            }
            let token2Index = 0;
            for (let i = (tokenizationResult2.tokens.length >>> 1); i >= 0; i--) {
                if (position.column - 1 >= tokenizationResult2.tokens[(i << 1)]) {
                    token2Index = i;
                    break;
                }
            }
            return {
                token: tokenizationResult1.tokens[token1Index],
                metadata: this._decodeMetadata(tokenizationResult2.tokens[(token2Index << 1) + 1])
            };
        }
        _getStateBeforeLine(grammar, lineNumber) {
            let state = null;
            for (let i = 1; i < lineNumber; i++) {
                let tokenizationResult = grammar.tokenizeLine(this._model.getLineContent(i), state);
                state = tokenizationResult.ruleStack;
            }
            return state;
        }
        isSemanticTokens(token) {
            return token && token.data;
        }
        async _computeSemanticTokens(position) {
            if (!this._isSemanticColoringEnabled()) {
                return null;
            }
            const tokenProviders = modes_1.DocumentSemanticTokensProviderRegistry.ordered(this._model);
            if (tokenProviders.length) {
                const provider = tokenProviders[0];
                const tokens = await Promise.resolve(provider.provideDocumentSemanticTokens(this._model, null, this._currentRequestCancellationTokenSource.token));
                if (this.isSemanticTokens(tokens)) {
                    return { tokens, legend: provider.getLegend() };
                }
            }
            const rangeTokenProviders = modes_1.DocumentRangeSemanticTokensProviderRegistry.ordered(this._model);
            if (rangeTokenProviders.length) {
                const provider = rangeTokenProviders[0];
                const lineNumber = position.lineNumber;
                const range = new range_1.Range(lineNumber, 1, lineNumber, this._model.getLineMaxColumn(lineNumber));
                const tokens = await Promise.resolve(provider.provideDocumentRangeSemanticTokens(this._model, range, this._currentRequestCancellationTokenSource.token));
                if (this.isSemanticTokens(tokens)) {
                    return { tokens, legend: provider.getLegend() };
                }
            }
            return null;
        }
        _getSemanticTokenAtPosition(semanticTokens, pos) {
            const tokenData = semanticTokens.tokens.data;
            const defaultLanguage = this._model.getLanguageIdentifier().language;
            let lastLine = 0;
            let lastCharacter = 0;
            const posLine = pos.lineNumber - 1, posCharacter = pos.column - 1; // to 0-based position
            for (let i = 0; i < tokenData.length; i += 5) {
                const lineDelta = tokenData[i], charDelta = tokenData[i + 1], len = tokenData[i + 2], typeIdx = tokenData[i + 3], modSet = tokenData[i + 4];
                const line = lastLine + lineDelta; // 0-based
                const character = lineDelta === 0 ? lastCharacter + charDelta : charDelta; // 0-based
                if (posLine === line && character <= posCharacter && posCharacter < character + len) {
                    const type = semanticTokens.legend.tokenTypes[typeIdx] || 'not in legend (ignored)';
                    const modifiers = [];
                    let modifierSet = modSet;
                    for (let modifierIndex = 0; modifierSet > 0 && modifierIndex < semanticTokens.legend.tokenModifiers.length; modifierIndex++) {
                        if (modifierSet & 1) {
                            modifiers.push(semanticTokens.legend.tokenModifiers[modifierIndex]);
                        }
                        modifierSet = modifierSet >> 1;
                    }
                    if (modifierSet > 0) {
                        modifiers.push('not in legend (ignored)');
                    }
                    const range = new range_1.Range(line + 1, character + 1, line + 1, character + 1 + len);
                    const definitions = {};
                    const colorMap = this._themeService.getColorTheme().tokenColorMap;
                    const theme = this._themeService.getColorTheme();
                    const tokenStyle = theme.getTokenStyleMetadata(type, modifiers, defaultLanguage, true, definitions);
                    let metadata = undefined;
                    if (tokenStyle) {
                        metadata = {
                            languageIdentifier: this._modeService.getLanguageIdentifier(0 /* Null */),
                            tokenType: 0 /* Other */,
                            bold: tokenStyle === null || tokenStyle === void 0 ? void 0 : tokenStyle.bold,
                            italic: tokenStyle === null || tokenStyle === void 0 ? void 0 : tokenStyle.italic,
                            underline: tokenStyle === null || tokenStyle === void 0 ? void 0 : tokenStyle.underline,
                            foreground: colorMap[(tokenStyle === null || tokenStyle === void 0 ? void 0 : tokenStyle.foreground) || 0 /* None */]
                        };
                    }
                    return { type, modifiers, range, metadata, definitions };
                }
                lastLine = line;
                lastCharacter = character;
            }
            return null;
        }
        _renderTokenStyleDefinition(definition, property) {
            if (definition === undefined) {
                return '';
            }
            const theme = this._themeService.getColorTheme();
            if (Array.isArray(definition)) {
                const scopesDefinition = {};
                theme.resolveScopes(definition, scopesDefinition);
                const matchingRule = scopesDefinition[property];
                if (matchingRule && scopesDefinition.scope) {
                    const strScopes = Array.isArray(matchingRule.scope) ? matchingRule.scope.join(', ') : String(matchingRule.scope);
                    return `${strings_1.escape(scopesDefinition.scope.join(' '))}<br><code class="tiw-theme-selector">${strScopes}\n${JSON.stringify(matchingRule.settings, null, '\t')}</code>`;
                }
                return '';
            }
            else if (tokenClassificationRegistry_1.SemanticTokenRule.is(definition)) {
                const scope = theme.getTokenStylingRuleScope(definition);
                if (scope === 'setting') {
                    return `User settings: ${definition.selector.id} - ${this._renderStyleProperty(definition.style, property)}`;
                }
                else if (scope === 'theme') {
                    return `Color theme: ${definition.selector.id} - ${this._renderStyleProperty(definition.style, property)}`;
                }
                return '';
            }
            else {
                const style = theme.resolveTokenStyleValue(definition);
                return `Default: ${style ? this._renderStyleProperty(style, property) : ''}`;
            }
        }
        _renderStyleProperty(style, property) {
            switch (property) {
                case 'foreground': return style.foreground ? color_1.Color.Format.CSS.formatHexA(style.foreground, true) : '';
                default: return style[property] !== undefined ? String(style[property]) : '';
            }
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                position: this._editor.getPosition(),
                preference: [2 /* BELOW */, 1 /* ABOVE */]
            };
        }
    }
    InspectEditorTokensWidget._ID = 'editor.contrib.inspectEditorTokensWidget';
    editorExtensions_1.registerEditorContribution(InspectEditorTokensController.ID, InspectEditorTokensController);
    editorExtensions_1.registerEditorAction(InspectEditorTokens);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const border = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (border) {
            let borderWidth = theme.type === themeService_1.HIGH_CONTRAST ? 2 : 1;
            collector.addRule(`.monaco-editor .token-inspect-widget { border: ${borderWidth}px solid ${border}; }`);
            collector.addRule(`.monaco-editor .token-inspect-widget .tiw-metadata-separator { background-color: ${border}; }`);
        }
        const background = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (background) {
            collector.addRule(`.monaco-editor .token-inspect-widget { background-color: ${background}; }`);
        }
    });
});
//# __sourceMappingURL=inspectEditorTokens.js.map