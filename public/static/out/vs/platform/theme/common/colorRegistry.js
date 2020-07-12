/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/base/common/color", "vs/base/common/event", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/async"], function (require, exports, platform, color_1, event_1, nls, jsonContributionRegistry_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.workbenchColorsSchemaId = exports.resolveColorValue = exports.oneOf = exports.transparent = exports.lighten = exports.darken = exports.problemsInfoIconForeground = exports.problemsWarningIconForeground = exports.problemsErrorIconForeground = exports.minimapSliderActiveBackground = exports.minimapSliderHoverBackground = exports.minimapSliderBackground = exports.minimapBackground = exports.minimapWarning = exports.minimapError = exports.minimapSelection = exports.minimapFindMatch = exports.overviewRulerSelectionHighlightForeground = exports.overviewRulerFindMatchForeground = exports.overviewRulerCommonContentForeground = exports.overviewRulerIncomingContentForeground = exports.overviewRulerCurrentContentForeground = exports.mergeBorder = exports.mergeCommonContentBackground = exports.mergeCommonHeaderBackground = exports.mergeIncomingContentBackground = exports.mergeIncomingHeaderBackground = exports.mergeCurrentContentBackground = exports.mergeCurrentHeaderBackground = exports.breadcrumbsPickerBackground = exports.breadcrumbsActiveSelectionForeground = exports.breadcrumbsFocusForeground = exports.breadcrumbsBackground = exports.breadcrumbsForeground = exports.snippetFinalTabstopHighlightBorder = exports.snippetFinalTabstopHighlightBackground = exports.snippetTabstopHighlightBorder = exports.snippetTabstopHighlightBackground = exports.menuSeparatorBackground = exports.menuSelectionBorder = exports.menuSelectionBackground = exports.menuSelectionForeground = exports.menuBackground = exports.menuForeground = exports.menuBorder = exports.listDeemphasizedForeground = exports.treeIndentGuidesStroke = exports.listFilterMatchHighlightBorder = exports.listFilterMatchHighlight = exports.listFilterWidgetNoMatchesOutline = exports.listFilterWidgetOutline = exports.listFilterWidgetBackground = exports.listWarningForeground = exports.listErrorForeground = exports.listInvalidItemForeground = exports.listHighlightForeground = exports.listDropBackground = exports.listHoverForeground = exports.listHoverBackground = exports.listInactiveFocusBackground = exports.listInactiveSelectionForeground = exports.listInactiveSelectionBackground = exports.listActiveSelectionForeground = exports.listActiveSelectionBackground = exports.listFocusForeground = exports.listFocusBackground = exports.diffDiagonalFill = exports.diffBorder = exports.diffRemovedOutline = exports.diffInsertedOutline = exports.diffRemoved = exports.diffInserted = exports.defaultRemoveColor = exports.defaultInsertColor = exports.editorLightBulbAutoFixForeground = exports.editorLightBulbForeground = exports.editorActiveLinkForeground = exports.editorHoverStatusBarBackground = exports.editorHoverBorder = exports.editorHoverForeground = exports.editorHoverBackground = exports.editorHoverHighlight = exports.searchEditorFindMatchBorder = exports.searchEditorFindMatch = exports.editorFindRangeHighlightBorder = exports.editorFindMatchHighlightBorder = exports.editorFindMatchBorder = exports.editorFindRangeHighlight = exports.editorFindMatchHighlight = exports.editorFindMatch = exports.editorSelectionHighlightBorder = exports.editorSelectionHighlight = exports.editorInactiveSelection = exports.editorSelectionForeground = exports.editorSelectionBackground = exports.pickerGroupBorder = exports.pickerGroupForeground = exports.quickInputTitleBackground = exports.quickInputForeground = exports.quickInputBackground = exports.editorWidgetResizeBorder = exports.editorWidgetBorder = exports.editorWidgetForeground = exports.editorWidgetBackground = exports.editorForeground = exports.editorBackground = exports.editorHintBorder = exports.editorHintForeground = exports.editorInfoBorder = exports.editorInfoForeground = exports.editorWarningBorder = exports.editorWarningForeground = exports.editorErrorBorder = exports.editorErrorForeground = exports.progressBarBackground = exports.scrollbarSliderActiveBackground = exports.scrollbarSliderHoverBackground = exports.scrollbarSliderBackground = exports.scrollbarShadow = exports.badgeForeground = exports.badgeBackground = exports.buttonSecondaryHoverBackground = exports.buttonSecondaryBackground = exports.buttonSecondaryForeground = exports.buttonHoverBackground = exports.buttonBackground = exports.buttonForeground = exports.simpleCheckboxBorder = exports.simpleCheckboxForeground = exports.simpleCheckboxBackground = exports.selectBorder = exports.selectForeground = exports.selectListBackground = exports.selectBackground = exports.inputValidationErrorBorder = exports.inputValidationErrorForeground = exports.inputValidationErrorBackground = exports.inputValidationWarningBorder = exports.inputValidationWarningForeground = exports.inputValidationWarningBackground = exports.inputValidationInfoBorder = exports.inputValidationInfoForeground = exports.inputValidationInfoBackground = exports.inputPlaceholderForeground = exports.inputActiveOptionForeground = exports.inputActiveOptionBackground = exports.inputActiveOptionBorder = exports.inputBorder = exports.inputForeground = exports.inputBackground = exports.widgetShadow = exports.textCodeBlockBackground = exports.textBlockQuoteBorder = exports.textBlockQuoteBackground = exports.textPreformatForeground = exports.textLinkActiveForeground = exports.textLinkForeground = exports.textSeparatorForeground = exports.selectionBackground = exports.activeContrastBorder = exports.contrastBorder = exports.focusBorder = exports.iconForeground = exports.descriptionForeground = exports.errorForeground = exports.foreground = exports.getColorRegistry = exports.registerColor = exports.Extensions = void 0;
    // color registry
    exports.Extensions = {
        ColorContribution: 'base.contributions.colors'
    };
    class ColorRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.colorSchema = { type: 'object', properties: {} };
            this.colorReferenceSchema = { type: 'string', enum: [], enumDescriptions: [] };
            this.colorsById = {};
        }
        registerColor(id, defaults, description, needsTransparency = false, deprecationMessage) {
            let colorContribution = { id, description, defaults, needsTransparency, deprecationMessage };
            this.colorsById[id] = colorContribution;
            let propertySchema = { type: 'string', description, format: 'color-hex', defaultSnippets: [{ body: '${1:#ff0000}' }] };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            this.colorSchema.properties[id] = propertySchema;
            this.colorReferenceSchema.enum.push(id);
            this.colorReferenceSchema.enumDescriptions.push(description);
            this._onDidChangeSchema.fire();
            return id;
        }
        deregisterColor(id) {
            delete this.colorsById[id];
            delete this.colorSchema.properties[id];
            const index = this.colorReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.colorReferenceSchema.enum.splice(index, 1);
                this.colorReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChangeSchema.fire();
        }
        getColors() {
            return Object.keys(this.colorsById).map(id => this.colorsById[id]);
        }
        resolveDefaultColor(id, theme) {
            const colorDesc = this.colorsById[id];
            if (colorDesc && colorDesc.defaults) {
                const colorValue = colorDesc.defaults[theme.type];
                return resolveColorValue(colorValue, theme);
            }
            return undefined;
        }
        getColorSchema() {
            return this.colorSchema;
        }
        getColorReferenceSchema() {
            return this.colorReferenceSchema;
        }
        toString() {
            let sorter = (a, b) => {
                let cat1 = a.indexOf('.') === -1 ? 0 : 1;
                let cat2 = b.indexOf('.') === -1 ? 0 : 1;
                if (cat1 !== cat2) {
                    return cat1 - cat2;
                }
                return a.localeCompare(b);
            };
            return Object.keys(this.colorsById).sort(sorter).map(k => `- \`${k}\`: ${this.colorsById[k].description}`).join('\n');
        }
    }
    const colorRegistry = new ColorRegistry();
    platform.Registry.add(exports.Extensions.ColorContribution, colorRegistry);
    function registerColor(id, defaults, description, needsTransparency, deprecationMessage) {
        return colorRegistry.registerColor(id, defaults, description, needsTransparency, deprecationMessage);
    }
    exports.registerColor = registerColor;
    function getColorRegistry() {
        return colorRegistry;
    }
    exports.getColorRegistry = getColorRegistry;
    // ----- base colors
    exports.foreground = registerColor('foreground', { dark: '#CCCCCC', light: '#616161', hc: '#FFFFFF' }, nls.localize('foreground', "Overall foreground color. This color is only used if not overridden by a component."));
    exports.errorForeground = registerColor('errorForeground', { dark: '#F48771', light: '#A1260D', hc: '#F48771' }, nls.localize('errorForeground', "Overall foreground color for error messages. This color is only used if not overridden by a component."));
    exports.descriptionForeground = registerColor('descriptionForeground', { light: '#717171', dark: transparent(exports.foreground, 0.7), hc: transparent(exports.foreground, 0.7) }, nls.localize('descriptionForeground', "Foreground color for description text providing additional information, for example for a label."));
    exports.iconForeground = registerColor('icon.foreground', { dark: '#C5C5C5', light: '#424242', hc: '#FFFFFF' }, nls.localize('iconForeground', "The default color for icons in the workbench."));
    exports.focusBorder = registerColor('focusBorder', { dark: '#007FD4', light: '#0090F1', hc: '#F38518' }, nls.localize('focusBorder', "Overall border color for focused elements. This color is only used if not overridden by a component."));
    exports.contrastBorder = registerColor('contrastBorder', { light: null, dark: null, hc: '#6FC3DF' }, nls.localize('contrastBorder', "An extra border around elements to separate them from others for greater contrast."));
    exports.activeContrastBorder = registerColor('contrastActiveBorder', { light: null, dark: null, hc: exports.focusBorder }, nls.localize('activeContrastBorder', "An extra border around active elements to separate them from others for greater contrast."));
    exports.selectionBackground = registerColor('selection.background', { light: null, dark: null, hc: null }, nls.localize('selectionBackground', "The background color of text selections in the workbench (e.g. for input fields or text areas). Note that this does not apply to selections within the editor."));
    // ------ text colors
    exports.textSeparatorForeground = registerColor('textSeparator.foreground', { light: '#0000002e', dark: '#ffffff2e', hc: color_1.Color.black }, nls.localize('textSeparatorForeground', "Color for text separators."));
    exports.textLinkForeground = registerColor('textLink.foreground', { light: '#006AB1', dark: '#3794FF', hc: '#3794FF' }, nls.localize('textLinkForeground', "Foreground color for links in text."));
    exports.textLinkActiveForeground = registerColor('textLink.activeForeground', { light: '#006AB1', dark: '#3794FF', hc: '#3794FF' }, nls.localize('textLinkActiveForeground', "Foreground color for links in text when clicked on and on mouse hover."));
    exports.textPreformatForeground = registerColor('textPreformat.foreground', { light: '#A31515', dark: '#D7BA7D', hc: '#D7BA7D' }, nls.localize('textPreformatForeground', "Foreground color for preformatted text segments."));
    exports.textBlockQuoteBackground = registerColor('textBlockQuote.background', { light: '#7f7f7f1a', dark: '#7f7f7f1a', hc: null }, nls.localize('textBlockQuoteBackground', "Background color for block quotes in text."));
    exports.textBlockQuoteBorder = registerColor('textBlockQuote.border', { light: '#007acc80', dark: '#007acc80', hc: color_1.Color.white }, nls.localize('textBlockQuoteBorder', "Border color for block quotes in text."));
    exports.textCodeBlockBackground = registerColor('textCodeBlock.background', { light: '#dcdcdc66', dark: '#0a0a0a66', hc: color_1.Color.black }, nls.localize('textCodeBlockBackground', "Background color for code blocks in text."));
    // ----- widgets
    exports.widgetShadow = registerColor('widget.shadow', { dark: '#000000', light: '#A8A8A8', hc: null }, nls.localize('widgetShadow', 'Shadow color of widgets such as find/replace inside the editor.'));
    exports.inputBackground = registerColor('input.background', { dark: '#3C3C3C', light: color_1.Color.white, hc: color_1.Color.black }, nls.localize('inputBoxBackground', "Input box background."));
    exports.inputForeground = registerColor('input.foreground', { dark: exports.foreground, light: exports.foreground, hc: exports.foreground }, nls.localize('inputBoxForeground', "Input box foreground."));
    exports.inputBorder = registerColor('input.border', { dark: null, light: null, hc: exports.contrastBorder }, nls.localize('inputBoxBorder', "Input box border."));
    exports.inputActiveOptionBorder = registerColor('inputOption.activeBorder', { dark: '#007ACC00', light: '#007ACC00', hc: exports.contrastBorder }, nls.localize('inputBoxActiveOptionBorder', "Border color of activated options in input fields."));
    exports.inputActiveOptionBackground = registerColor('inputOption.activeBackground', { dark: transparent(exports.focusBorder, 0.7), light: transparent(exports.focusBorder, 0.5), hc: color_1.Color.transparent }, nls.localize('inputOption.activeBackground', "Background color of activated options in input fields."));
    exports.inputActiveOptionForeground = registerColor('inputOption.activeForeground', { dark: '#FFFFFF', light: color_1.Color.black, hc: null }, nls.localize('inputOption.activeForeground', "Foreground color of activated options in input fields."));
    exports.inputPlaceholderForeground = registerColor('input.placeholderForeground', { light: transparent(exports.foreground, 0.5), dark: transparent(exports.foreground, 0.5), hc: transparent(exports.foreground, 0.7) }, nls.localize('inputPlaceholderForeground', "Input box foreground color for placeholder text."));
    exports.inputValidationInfoBackground = registerColor('inputValidation.infoBackground', { dark: '#063B49', light: '#D6ECF2', hc: color_1.Color.black }, nls.localize('inputValidationInfoBackground', "Input validation background color for information severity."));
    exports.inputValidationInfoForeground = registerColor('inputValidation.infoForeground', { dark: null, light: null, hc: null }, nls.localize('inputValidationInfoForeground', "Input validation foreground color for information severity."));
    exports.inputValidationInfoBorder = registerColor('inputValidation.infoBorder', { dark: '#007acc', light: '#007acc', hc: exports.contrastBorder }, nls.localize('inputValidationInfoBorder', "Input validation border color for information severity."));
    exports.inputValidationWarningBackground = registerColor('inputValidation.warningBackground', { dark: '#352A05', light: '#F6F5D2', hc: color_1.Color.black }, nls.localize('inputValidationWarningBackground', "Input validation background color for warning severity."));
    exports.inputValidationWarningForeground = registerColor('inputValidation.warningForeground', { dark: null, light: null, hc: null }, nls.localize('inputValidationWarningForeground', "Input validation foreground color for warning severity."));
    exports.inputValidationWarningBorder = registerColor('inputValidation.warningBorder', { dark: '#B89500', light: '#B89500', hc: exports.contrastBorder }, nls.localize('inputValidationWarningBorder', "Input validation border color for warning severity."));
    exports.inputValidationErrorBackground = registerColor('inputValidation.errorBackground', { dark: '#5A1D1D', light: '#F2DEDE', hc: color_1.Color.black }, nls.localize('inputValidationErrorBackground', "Input validation background color for error severity."));
    exports.inputValidationErrorForeground = registerColor('inputValidation.errorForeground', { dark: null, light: null, hc: null }, nls.localize('inputValidationErrorForeground', "Input validation foreground color for error severity."));
    exports.inputValidationErrorBorder = registerColor('inputValidation.errorBorder', { dark: '#BE1100', light: '#BE1100', hc: exports.contrastBorder }, nls.localize('inputValidationErrorBorder', "Input validation border color for error severity."));
    exports.selectBackground = registerColor('dropdown.background', { dark: '#3C3C3C', light: color_1.Color.white, hc: color_1.Color.black }, nls.localize('dropdownBackground', "Dropdown background."));
    exports.selectListBackground = registerColor('dropdown.listBackground', { dark: null, light: null, hc: color_1.Color.black }, nls.localize('dropdownListBackground', "Dropdown list background."));
    exports.selectForeground = registerColor('dropdown.foreground', { dark: '#F0F0F0', light: null, hc: color_1.Color.white }, nls.localize('dropdownForeground', "Dropdown foreground."));
    exports.selectBorder = registerColor('dropdown.border', { dark: exports.selectBackground, light: '#CECECE', hc: exports.contrastBorder }, nls.localize('dropdownBorder', "Dropdown border."));
    exports.simpleCheckboxBackground = registerColor('checkbox.background', { dark: exports.selectBackground, light: exports.selectBackground, hc: exports.selectBackground }, nls.localize('checkbox.background', "Background color of checkbox widget."));
    exports.simpleCheckboxForeground = registerColor('checkbox.foreground', { dark: exports.selectForeground, light: exports.selectForeground, hc: exports.selectForeground }, nls.localize('checkbox.foreground', "Foreground color of checkbox widget."));
    exports.simpleCheckboxBorder = registerColor('checkbox.border', { dark: exports.selectBorder, light: exports.selectBorder, hc: exports.selectBorder }, nls.localize('checkbox.border', "Border color of checkbox widget."));
    exports.buttonForeground = registerColor('button.foreground', { dark: color_1.Color.white, light: color_1.Color.white, hc: color_1.Color.white }, nls.localize('buttonForeground', "Button foreground color."));
    exports.buttonBackground = registerColor('button.background', { dark: '#0E639C', light: '#007ACC', hc: null }, nls.localize('buttonBackground', "Button background color."));
    exports.buttonHoverBackground = registerColor('button.hoverBackground', { dark: lighten(exports.buttonBackground, 0.2), light: darken(exports.buttonBackground, 0.2), hc: null }, nls.localize('buttonHoverBackground', "Button background color when hovering."));
    exports.buttonSecondaryForeground = registerColor('button.secondaryForeground', { dark: color_1.Color.white, light: color_1.Color.white, hc: color_1.Color.white }, nls.localize('buttonSecondaryForeground', "Secondary button foreground color."));
    exports.buttonSecondaryBackground = registerColor('button.secondaryBackground', { dark: '#3A3D41', light: '#5F6A79', hc: null }, nls.localize('buttonSecondaryBackground', "Secondary button background color."));
    exports.buttonSecondaryHoverBackground = registerColor('button.secondaryHoverBackground', { dark: lighten(exports.buttonSecondaryBackground, 0.2), light: darken(exports.buttonSecondaryBackground, 0.2), hc: null }, nls.localize('buttonSecondaryHoverBackground', "Secondary button background color when hovering."));
    exports.badgeBackground = registerColor('badge.background', { dark: '#4D4D4D', light: '#C4C4C4', hc: color_1.Color.black }, nls.localize('badgeBackground', "Badge background color. Badges are small information labels, e.g. for search results count."));
    exports.badgeForeground = registerColor('badge.foreground', { dark: color_1.Color.white, light: '#333', hc: color_1.Color.white }, nls.localize('badgeForeground', "Badge foreground color. Badges are small information labels, e.g. for search results count."));
    exports.scrollbarShadow = registerColor('scrollbar.shadow', { dark: '#000000', light: '#DDDDDD', hc: null }, nls.localize('scrollbarShadow', "Scrollbar shadow to indicate that the view is scrolled."));
    exports.scrollbarSliderBackground = registerColor('scrollbarSlider.background', { dark: color_1.Color.fromHex('#797979').transparent(0.4), light: color_1.Color.fromHex('#646464').transparent(0.4), hc: transparent(exports.contrastBorder, 0.6) }, nls.localize('scrollbarSliderBackground', "Scrollbar slider background color."));
    exports.scrollbarSliderHoverBackground = registerColor('scrollbarSlider.hoverBackground', { dark: color_1.Color.fromHex('#646464').transparent(0.7), light: color_1.Color.fromHex('#646464').transparent(0.7), hc: transparent(exports.contrastBorder, 0.8) }, nls.localize('scrollbarSliderHoverBackground', "Scrollbar slider background color when hovering."));
    exports.scrollbarSliderActiveBackground = registerColor('scrollbarSlider.activeBackground', { dark: color_1.Color.fromHex('#BFBFBF').transparent(0.4), light: color_1.Color.fromHex('#000000').transparent(0.6), hc: exports.contrastBorder }, nls.localize('scrollbarSliderActiveBackground', "Scrollbar slider background color when clicked on."));
    exports.progressBarBackground = registerColor('progressBar.background', { dark: color_1.Color.fromHex('#0E70C0'), light: color_1.Color.fromHex('#0E70C0'), hc: exports.contrastBorder }, nls.localize('progressBarBackground', "Background color of the progress bar that can show for long running operations."));
    exports.editorErrorForeground = registerColor('editorError.foreground', { dark: '#F48771', light: '#E51400', hc: null }, nls.localize('editorError.foreground', 'Foreground color of error squigglies in the editor.'));
    exports.editorErrorBorder = registerColor('editorError.border', { dark: null, light: null, hc: color_1.Color.fromHex('#E47777').transparent(0.8) }, nls.localize('errorBorder', 'Border color of error boxes in the editor.'));
    exports.editorWarningForeground = registerColor('editorWarning.foreground', { dark: '#CCA700', light: '#E9A700', hc: null }, nls.localize('editorWarning.foreground', 'Foreground color of warning squigglies in the editor.'));
    exports.editorWarningBorder = registerColor('editorWarning.border', { dark: null, light: null, hc: color_1.Color.fromHex('#FFCC00').transparent(0.8) }, nls.localize('warningBorder', 'Border color of warning boxes in the editor.'));
    exports.editorInfoForeground = registerColor('editorInfo.foreground', { dark: '#75BEFF', light: '#75BEFF', hc: null }, nls.localize('editorInfo.foreground', 'Foreground color of info squigglies in the editor.'));
    exports.editorInfoBorder = registerColor('editorInfo.border', { dark: null, light: null, hc: color_1.Color.fromHex('#75BEFF').transparent(0.8) }, nls.localize('infoBorder', 'Border color of info boxes in the editor.'));
    exports.editorHintForeground = registerColor('editorHint.foreground', { dark: color_1.Color.fromHex('#eeeeee').transparent(0.7), light: '#6c6c6c', hc: null }, nls.localize('editorHint.foreground', 'Foreground color of hint squigglies in the editor.'));
    exports.editorHintBorder = registerColor('editorHint.border', { dark: null, light: null, hc: color_1.Color.fromHex('#eeeeee').transparent(0.8) }, nls.localize('hintBorder', 'Border color of hint boxes in the editor.'));
    /**
     * Editor background color.
     * Because of bug https://monacotools.visualstudio.com/DefaultCollection/Monaco/_workitems/edit/13254
     * we are *not* using the color white (or #ffffff, rgba(255,255,255)) but something very close to white.
     */
    exports.editorBackground = registerColor('editor.background', { light: '#fffffe', dark: '#1E1E1E', hc: color_1.Color.black }, nls.localize('editorBackground', "Editor background color."));
    /**
     * Editor foreground color.
     */
    exports.editorForeground = registerColor('editor.foreground', { light: '#333333', dark: '#BBBBBB', hc: color_1.Color.white }, nls.localize('editorForeground', "Editor default foreground color."));
    /**
     * Editor widgets
     */
    exports.editorWidgetBackground = registerColor('editorWidget.background', { dark: '#252526', light: '#F3F3F3', hc: '#0C141F' }, nls.localize('editorWidgetBackground', 'Background color of editor widgets, such as find/replace.'));
    exports.editorWidgetForeground = registerColor('editorWidget.foreground', { dark: exports.foreground, light: exports.foreground, hc: exports.foreground }, nls.localize('editorWidgetForeground', 'Foreground color of editor widgets, such as find/replace.'));
    exports.editorWidgetBorder = registerColor('editorWidget.border', { dark: '#454545', light: '#C8C8C8', hc: exports.contrastBorder }, nls.localize('editorWidgetBorder', 'Border color of editor widgets. The color is only used if the widget chooses to have a border and if the color is not overridden by a widget.'));
    exports.editorWidgetResizeBorder = registerColor('editorWidget.resizeBorder', { light: null, dark: null, hc: null }, nls.localize('editorWidgetResizeBorder', "Border color of the resize bar of editor widgets. The color is only used if the widget chooses to have a resize border and if the color is not overridden by a widget."));
    /**
     * Quick pick widget
     */
    exports.quickInputBackground = registerColor('quickInput.background', { dark: exports.editorWidgetBackground, light: exports.editorWidgetBackground, hc: exports.editorWidgetBackground }, nls.localize('pickerBackground', "Quick picker background color. The quick picker widget is the container for pickers like the command palette."));
    exports.quickInputForeground = registerColor('quickInput.foreground', { dark: exports.editorWidgetForeground, light: exports.editorWidgetForeground, hc: exports.editorWidgetForeground }, nls.localize('pickerForeground', "Quick picker foreground color. The quick picker widget is the container for pickers like the command palette."));
    exports.quickInputTitleBackground = registerColor('quickInputTitle.background', { dark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.105)), light: new color_1.Color(new color_1.RGBA(0, 0, 0, 0.06)), hc: '#000000' }, nls.localize('pickerTitleBackground', "Quick picker title background color. The quick picker widget is the container for pickers like the command palette."));
    exports.pickerGroupForeground = registerColor('pickerGroup.foreground', { dark: '#3794FF', light: '#0066BF', hc: color_1.Color.white }, nls.localize('pickerGroupForeground', "Quick picker color for grouping labels."));
    exports.pickerGroupBorder = registerColor('pickerGroup.border', { dark: '#3F3F46', light: '#CCCEDB', hc: color_1.Color.white }, nls.localize('pickerGroupBorder', "Quick picker color for grouping borders."));
    /**
     * Editor selection colors.
     */
    exports.editorSelectionBackground = registerColor('editor.selectionBackground', { light: '#ADD6FF', dark: '#264F78', hc: '#f3f518' }, nls.localize('editorSelectionBackground', "Color of the editor selection."));
    exports.editorSelectionForeground = registerColor('editor.selectionForeground', { light: null, dark: null, hc: '#000000' }, nls.localize('editorSelectionForeground', "Color of the selected text for high contrast."));
    exports.editorInactiveSelection = registerColor('editor.inactiveSelectionBackground', { light: transparent(exports.editorSelectionBackground, 0.5), dark: transparent(exports.editorSelectionBackground, 0.5), hc: transparent(exports.editorSelectionBackground, 0.5) }, nls.localize('editorInactiveSelection', "Color of the selection in an inactive editor. The color must not be opaque so as not to hide underlying decorations."), true);
    exports.editorSelectionHighlight = registerColor('editor.selectionHighlightBackground', { light: lessProminent(exports.editorSelectionBackground, exports.editorBackground, 0.3, 0.6), dark: lessProminent(exports.editorSelectionBackground, exports.editorBackground, 0.3, 0.6), hc: null }, nls.localize('editorSelectionHighlight', 'Color for regions with the same content as the selection. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorSelectionHighlightBorder = registerColor('editor.selectionHighlightBorder', { light: null, dark: null, hc: exports.activeContrastBorder }, nls.localize('editorSelectionHighlightBorder', "Border color for regions with the same content as the selection."));
    /**
     * Editor find match colors.
     */
    exports.editorFindMatch = registerColor('editor.findMatchBackground', { light: '#A8AC94', dark: '#515C6A', hc: null }, nls.localize('editorFindMatch', "Color of the current search match."));
    exports.editorFindMatchHighlight = registerColor('editor.findMatchHighlightBackground', { light: '#EA5C0055', dark: '#EA5C0055', hc: null }, nls.localize('findMatchHighlight', "Color of the other search matches. The color must not be opaque so as not to hide underlying decorations."), true);
    exports.editorFindRangeHighlight = registerColor('editor.findRangeHighlightBackground', { dark: '#3a3d4166', light: '#b4b4b44d', hc: null }, nls.localize('findRangeHighlight', "Color of the range limiting the search. The color must not be opaque so as not to hide underlying decorations."), true);
    exports.editorFindMatchBorder = registerColor('editor.findMatchBorder', { light: null, dark: null, hc: exports.activeContrastBorder }, nls.localize('editorFindMatchBorder', "Border color of the current search match."));
    exports.editorFindMatchHighlightBorder = registerColor('editor.findMatchHighlightBorder', { light: null, dark: null, hc: exports.activeContrastBorder }, nls.localize('findMatchHighlightBorder', "Border color of the other search matches."));
    exports.editorFindRangeHighlightBorder = registerColor('editor.findRangeHighlightBorder', { dark: null, light: null, hc: transparent(exports.activeContrastBorder, 0.4) }, nls.localize('findRangeHighlightBorder', "Border color of the range limiting the search. The color must not be opaque so as not to hide underlying decorations."), true);
    /**
     * Search Editor query match colors.
     *
     * Distinct from normal editor find match to allow for better differentiation
     */
    exports.searchEditorFindMatch = registerColor('searchEditor.findMatchBackground', { light: transparent(exports.editorFindMatchHighlight, 0.66), dark: transparent(exports.editorFindMatchHighlight, 0.66), hc: exports.editorFindMatchHighlight }, nls.localize('searchEditor.queryMatch', "Color of the Search Editor query matches."));
    exports.searchEditorFindMatchBorder = registerColor('searchEditor.findMatchBorder', { light: transparent(exports.editorFindMatchHighlightBorder, 0.66), dark: transparent(exports.editorFindMatchHighlightBorder, 0.66), hc: exports.editorFindMatchHighlightBorder }, nls.localize('searchEditor.editorFindMatchBorder', "Border color of the Search Editor query matches."));
    /**
     * Editor hover
     */
    exports.editorHoverHighlight = registerColor('editor.hoverHighlightBackground', { light: '#ADD6FF26', dark: '#264f7840', hc: '#ADD6FF26' }, nls.localize('hoverHighlight', 'Highlight below the word for which a hover is shown. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorHoverBackground = registerColor('editorHoverWidget.background', { light: exports.editorWidgetBackground, dark: exports.editorWidgetBackground, hc: exports.editorWidgetBackground }, nls.localize('hoverBackground', 'Background color of the editor hover.'));
    exports.editorHoverForeground = registerColor('editorHoverWidget.foreground', { light: exports.editorWidgetForeground, dark: exports.editorWidgetForeground, hc: exports.editorWidgetForeground }, nls.localize('hoverForeground', 'Foreground color of the editor hover.'));
    exports.editorHoverBorder = registerColor('editorHoverWidget.border', { light: exports.editorWidgetBorder, dark: exports.editorWidgetBorder, hc: exports.editorWidgetBorder }, nls.localize('hoverBorder', 'Border color of the editor hover.'));
    exports.editorHoverStatusBarBackground = registerColor('editorHoverWidget.statusBarBackground', { dark: lighten(exports.editorHoverBackground, 0.2), light: darken(exports.editorHoverBackground, 0.05), hc: exports.editorWidgetBackground }, nls.localize('statusBarBackground', "Background color of the editor hover status bar."));
    /**
     * Editor link colors
     */
    exports.editorActiveLinkForeground = registerColor('editorLink.activeForeground', { dark: '#4E94CE', light: color_1.Color.blue, hc: color_1.Color.cyan }, nls.localize('activeLinkForeground', 'Color of active links.'));
    /**
     * Editor lighbulb icon colors
     */
    exports.editorLightBulbForeground = registerColor('editorLightBulb.foreground', { dark: '#FFCC00', light: '#DDB100', hc: '#FFCC00' }, nls.localize('editorLightBulbForeground', "The color used for the lightbulb actions icon."));
    exports.editorLightBulbAutoFixForeground = registerColor('editorLightBulbAutoFix.foreground', { dark: '#75BEFF', light: '#007ACC', hc: '#75BEFF' }, nls.localize('editorLightBulbAutoFixForeground', "The color used for the lightbulb auto fix actions icon."));
    /**
     * Diff Editor Colors
     */
    exports.defaultInsertColor = new color_1.Color(new color_1.RGBA(155, 185, 85, 0.2));
    exports.defaultRemoveColor = new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2));
    exports.diffInserted = registerColor('diffEditor.insertedTextBackground', { dark: exports.defaultInsertColor, light: exports.defaultInsertColor, hc: null }, nls.localize('diffEditorInserted', 'Background color for text that got inserted. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.diffRemoved = registerColor('diffEditor.removedTextBackground', { dark: exports.defaultRemoveColor, light: exports.defaultRemoveColor, hc: null }, nls.localize('diffEditorRemoved', 'Background color for text that got removed. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.diffInsertedOutline = registerColor('diffEditor.insertedTextBorder', { dark: null, light: null, hc: '#33ff2eff' }, nls.localize('diffEditorInsertedOutline', 'Outline color for the text that got inserted.'));
    exports.diffRemovedOutline = registerColor('diffEditor.removedTextBorder', { dark: null, light: null, hc: '#FF008F' }, nls.localize('diffEditorRemovedOutline', 'Outline color for text that got removed.'));
    exports.diffBorder = registerColor('diffEditor.border', { dark: null, light: null, hc: exports.contrastBorder }, nls.localize('diffEditorBorder', 'Border color between the two text editors.'));
    exports.diffDiagonalFill = registerColor('diffEditor.diagonalFill', { dark: '#cccccc33', light: '#22222233', hc: null }, nls.localize('diffDiagonalFill', "Color of the diff editor's diagonal fill. The diagonal fill is used in side-by-side diff views."));
    /**
     * List and tree colors
     */
    exports.listFocusBackground = registerColor('list.focusBackground', { dark: '#062F4A', light: '#D6EBFF', hc: null }, nls.localize('listFocusBackground', "List/Tree background color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listFocusForeground = registerColor('list.focusForeground', { dark: null, light: null, hc: null }, nls.localize('listFocusForeground', "List/Tree foreground color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listActiveSelectionBackground = registerColor('list.activeSelectionBackground', { dark: '#094771', light: '#0074E8', hc: null }, nls.localize('listActiveSelectionBackground', "List/Tree background color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listActiveSelectionForeground = registerColor('list.activeSelectionForeground', { dark: color_1.Color.white, light: color_1.Color.white, hc: null }, nls.localize('listActiveSelectionForeground', "List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveSelectionBackground = registerColor('list.inactiveSelectionBackground', { dark: '#37373D', light: '#E4E6F1', hc: null }, nls.localize('listInactiveSelectionBackground', "List/Tree background color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveSelectionForeground = registerColor('list.inactiveSelectionForeground', { dark: null, light: null, hc: null }, nls.localize('listInactiveSelectionForeground', "List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveFocusBackground = registerColor('list.inactiveFocusBackground', { dark: null, light: null, hc: null }, nls.localize('listInactiveFocusBackground', "List/Tree background color for the focused item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listHoverBackground = registerColor('list.hoverBackground', { dark: '#2A2D2E', light: '#F0F0F0', hc: null }, nls.localize('listHoverBackground', "List/Tree background when hovering over items using the mouse."));
    exports.listHoverForeground = registerColor('list.hoverForeground', { dark: null, light: null, hc: null }, nls.localize('listHoverForeground', "List/Tree foreground when hovering over items using the mouse."));
    exports.listDropBackground = registerColor('list.dropBackground', { dark: exports.listFocusBackground, light: exports.listFocusBackground, hc: null }, nls.localize('listDropBackground', "List/Tree drag and drop background when moving items around using the mouse."));
    exports.listHighlightForeground = registerColor('list.highlightForeground', { dark: '#0097fb', light: '#0066BF', hc: exports.focusBorder }, nls.localize('highlight', 'List/Tree foreground color of the match highlights when searching inside the list/tree.'));
    exports.listInvalidItemForeground = registerColor('list.invalidItemForeground', { dark: '#B89500', light: '#B89500', hc: '#B89500' }, nls.localize('invalidItemForeground', 'List/Tree foreground color for invalid items, for example an unresolved root in explorer.'));
    exports.listErrorForeground = registerColor('list.errorForeground', { dark: '#F88070', light: '#B01011', hc: null }, nls.localize('listErrorForeground', 'Foreground color of list items containing errors.'));
    exports.listWarningForeground = registerColor('list.warningForeground', { dark: '#CCA700', light: '#855F00', hc: null }, nls.localize('listWarningForeground', 'Foreground color of list items containing warnings.'));
    exports.listFilterWidgetBackground = registerColor('listFilterWidget.background', { light: '#efc1ad', dark: '#653723', hc: color_1.Color.black }, nls.localize('listFilterWidgetBackground', 'Background color of the type filter widget in lists and trees.'));
    exports.listFilterWidgetOutline = registerColor('listFilterWidget.outline', { dark: color_1.Color.transparent, light: color_1.Color.transparent, hc: '#f38518' }, nls.localize('listFilterWidgetOutline', 'Outline color of the type filter widget in lists and trees.'));
    exports.listFilterWidgetNoMatchesOutline = registerColor('listFilterWidget.noMatchesOutline', { dark: '#BE1100', light: '#BE1100', hc: exports.contrastBorder }, nls.localize('listFilterWidgetNoMatchesOutline', 'Outline color of the type filter widget in lists and trees, when there are no matches.'));
    exports.listFilterMatchHighlight = registerColor('list.filterMatchBackground', { dark: exports.editorFindMatchHighlight, light: exports.editorFindMatchHighlight, hc: null }, nls.localize('listFilterMatchHighlight', 'Background color of the filtered match.'));
    exports.listFilterMatchHighlightBorder = registerColor('list.filterMatchBorder', { dark: exports.editorFindMatchHighlightBorder, light: exports.editorFindMatchHighlightBorder, hc: exports.contrastBorder }, nls.localize('listFilterMatchHighlightBorder', 'Border color of the filtered match.'));
    exports.treeIndentGuidesStroke = registerColor('tree.indentGuidesStroke', { dark: '#585858', light: '#a9a9a9', hc: '#a9a9a9' }, nls.localize('treeIndentGuidesStroke', "Tree stroke color for the indentation guides."));
    exports.listDeemphasizedForeground = registerColor('list.deemphasizedForeground', { dark: '#8C8C8C', light: '#8E8E90', hc: '#A7A8A9' }, nls.localize('listDeemphasizedForeground', "List/Tree foreground color for items that are deemphasized. "));
    /**
     * Menu colors
     */
    exports.menuBorder = registerColor('menu.border', { dark: null, light: null, hc: exports.contrastBorder }, nls.localize('menuBorder', "Border color of menus."));
    exports.menuForeground = registerColor('menu.foreground', { dark: exports.selectForeground, light: exports.foreground, hc: exports.selectForeground }, nls.localize('menuForeground', "Foreground color of menu items."));
    exports.menuBackground = registerColor('menu.background', { dark: exports.selectBackground, light: exports.selectBackground, hc: exports.selectBackground }, nls.localize('menuBackground', "Background color of menu items."));
    exports.menuSelectionForeground = registerColor('menu.selectionForeground', { dark: exports.listActiveSelectionForeground, light: exports.listActiveSelectionForeground, hc: exports.listActiveSelectionForeground }, nls.localize('menuSelectionForeground', "Foreground color of the selected menu item in menus."));
    exports.menuSelectionBackground = registerColor('menu.selectionBackground', { dark: exports.listActiveSelectionBackground, light: exports.listActiveSelectionBackground, hc: exports.listActiveSelectionBackground }, nls.localize('menuSelectionBackground', "Background color of the selected menu item in menus."));
    exports.menuSelectionBorder = registerColor('menu.selectionBorder', { dark: null, light: null, hc: exports.activeContrastBorder }, nls.localize('menuSelectionBorder', "Border color of the selected menu item in menus."));
    exports.menuSeparatorBackground = registerColor('menu.separatorBackground', { dark: '#BBBBBB', light: '#888888', hc: exports.contrastBorder }, nls.localize('menuSeparatorBackground', "Color of a separator menu item in menus."));
    /**
     * Snippet placeholder colors
     */
    exports.snippetTabstopHighlightBackground = registerColor('editor.snippetTabstopHighlightBackground', { dark: new color_1.Color(new color_1.RGBA(124, 124, 124, 0.3)), light: new color_1.Color(new color_1.RGBA(10, 50, 100, 0.2)), hc: new color_1.Color(new color_1.RGBA(124, 124, 124, 0.3)) }, nls.localize('snippetTabstopHighlightBackground', "Highlight background color of a snippet tabstop."));
    exports.snippetTabstopHighlightBorder = registerColor('editor.snippetTabstopHighlightBorder', { dark: null, light: null, hc: null }, nls.localize('snippetTabstopHighlightBorder', "Highlight border color of a snippet tabstop."));
    exports.snippetFinalTabstopHighlightBackground = registerColor('editor.snippetFinalTabstopHighlightBackground', { dark: null, light: null, hc: null }, nls.localize('snippetFinalTabstopHighlightBackground', "Highlight background color of the final tabstop of a snippet."));
    exports.snippetFinalTabstopHighlightBorder = registerColor('editor.snippetFinalTabstopHighlightBorder', { dark: '#525252', light: new color_1.Color(new color_1.RGBA(10, 50, 100, 0.5)), hc: '#525252' }, nls.localize('snippetFinalTabstopHighlightBorder', "Highlight border color of the final stabstop of a snippet."));
    /**
     * Breadcrumb colors
     */
    exports.breadcrumbsForeground = registerColor('breadcrumb.foreground', { light: transparent(exports.foreground, 0.8), dark: transparent(exports.foreground, 0.8), hc: transparent(exports.foreground, 0.8) }, nls.localize('breadcrumbsFocusForeground', "Color of focused breadcrumb items."));
    exports.breadcrumbsBackground = registerColor('breadcrumb.background', { light: exports.editorBackground, dark: exports.editorBackground, hc: exports.editorBackground }, nls.localize('breadcrumbsBackground', "Background color of breadcrumb items."));
    exports.breadcrumbsFocusForeground = registerColor('breadcrumb.focusForeground', { light: darken(exports.foreground, 0.2), dark: lighten(exports.foreground, 0.1), hc: lighten(exports.foreground, 0.1) }, nls.localize('breadcrumbsFocusForeground', "Color of focused breadcrumb items."));
    exports.breadcrumbsActiveSelectionForeground = registerColor('breadcrumb.activeSelectionForeground', { light: darken(exports.foreground, 0.2), dark: lighten(exports.foreground, 0.1), hc: lighten(exports.foreground, 0.1) }, nls.localize('breadcrumbsSelectedForegound', "Color of selected breadcrumb items."));
    exports.breadcrumbsPickerBackground = registerColor('breadcrumbPicker.background', { light: exports.editorWidgetBackground, dark: exports.editorWidgetBackground, hc: exports.editorWidgetBackground }, nls.localize('breadcrumbsSelectedBackground', "Background color of breadcrumb item picker."));
    /**
     * Merge-conflict colors
     */
    const headerTransparency = 0.5;
    const currentBaseColor = color_1.Color.fromHex('#40C8AE').transparent(headerTransparency);
    const incomingBaseColor = color_1.Color.fromHex('#40A6FF').transparent(headerTransparency);
    const commonBaseColor = color_1.Color.fromHex('#606060').transparent(0.4);
    const contentTransparency = 0.4;
    const rulerTransparency = 1;
    exports.mergeCurrentHeaderBackground = registerColor('merge.currentHeaderBackground', { dark: currentBaseColor, light: currentBaseColor, hc: null }, nls.localize('mergeCurrentHeaderBackground', 'Current header background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeCurrentContentBackground = registerColor('merge.currentContentBackground', { dark: transparent(exports.mergeCurrentHeaderBackground, contentTransparency), light: transparent(exports.mergeCurrentHeaderBackground, contentTransparency), hc: transparent(exports.mergeCurrentHeaderBackground, contentTransparency) }, nls.localize('mergeCurrentContentBackground', 'Current content background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeIncomingHeaderBackground = registerColor('merge.incomingHeaderBackground', { dark: incomingBaseColor, light: incomingBaseColor, hc: null }, nls.localize('mergeIncomingHeaderBackground', 'Incoming header background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeIncomingContentBackground = registerColor('merge.incomingContentBackground', { dark: transparent(exports.mergeIncomingHeaderBackground, contentTransparency), light: transparent(exports.mergeIncomingHeaderBackground, contentTransparency), hc: transparent(exports.mergeIncomingHeaderBackground, contentTransparency) }, nls.localize('mergeIncomingContentBackground', 'Incoming content background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeCommonHeaderBackground = registerColor('merge.commonHeaderBackground', { dark: commonBaseColor, light: commonBaseColor, hc: null }, nls.localize('mergeCommonHeaderBackground', 'Common ancestor header background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeCommonContentBackground = registerColor('merge.commonContentBackground', { dark: transparent(exports.mergeCommonHeaderBackground, contentTransparency), light: transparent(exports.mergeCommonHeaderBackground, contentTransparency), hc: transparent(exports.mergeCommonHeaderBackground, contentTransparency) }, nls.localize('mergeCommonContentBackground', 'Common ancestor content background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeBorder = registerColor('merge.border', { dark: null, light: null, hc: '#C3DF6F' }, nls.localize('mergeBorder', 'Border color on headers and the splitter in inline merge-conflicts.'));
    exports.overviewRulerCurrentContentForeground = registerColor('editorOverviewRuler.currentContentForeground', { dark: transparent(exports.mergeCurrentHeaderBackground, rulerTransparency), light: transparent(exports.mergeCurrentHeaderBackground, rulerTransparency), hc: exports.mergeBorder }, nls.localize('overviewRulerCurrentContentForeground', 'Current overview ruler foreground for inline merge-conflicts.'));
    exports.overviewRulerIncomingContentForeground = registerColor('editorOverviewRuler.incomingContentForeground', { dark: transparent(exports.mergeIncomingHeaderBackground, rulerTransparency), light: transparent(exports.mergeIncomingHeaderBackground, rulerTransparency), hc: exports.mergeBorder }, nls.localize('overviewRulerIncomingContentForeground', 'Incoming overview ruler foreground for inline merge-conflicts.'));
    exports.overviewRulerCommonContentForeground = registerColor('editorOverviewRuler.commonContentForeground', { dark: transparent(exports.mergeCommonHeaderBackground, rulerTransparency), light: transparent(exports.mergeCommonHeaderBackground, rulerTransparency), hc: exports.mergeBorder }, nls.localize('overviewRulerCommonContentForeground', 'Common ancestor overview ruler foreground for inline merge-conflicts.'));
    exports.overviewRulerFindMatchForeground = registerColor('editorOverviewRuler.findMatchForeground', { dark: '#d186167e', light: '#d186167e', hc: '#AB5A00' }, nls.localize('overviewRulerFindMatchForeground', 'Overview ruler marker color for find matches. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.overviewRulerSelectionHighlightForeground = registerColor('editorOverviewRuler.selectionHighlightForeground', { dark: '#A0A0A0CC', light: '#A0A0A0CC', hc: '#A0A0A0CC' }, nls.localize('overviewRulerSelectionHighlightForeground', 'Overview ruler marker color for selection highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.minimapFindMatch = registerColor('minimap.findMatchHighlight', { light: '#d18616', dark: '#d18616', hc: '#AB5A00' }, nls.localize('minimapFindMatchHighlight', 'Minimap marker color for find matches.'), true);
    exports.minimapSelection = registerColor('minimap.selectionHighlight', { light: '#ADD6FF', dark: '#264F78', hc: '#ffffff' }, nls.localize('minimapSelectionHighlight', 'Minimap marker color for the editor selection.'), true);
    exports.minimapError = registerColor('minimap.errorHighlight', { dark: new color_1.Color(new color_1.RGBA(255, 18, 18, 0.7)), light: new color_1.Color(new color_1.RGBA(255, 18, 18, 0.7)), hc: new color_1.Color(new color_1.RGBA(255, 50, 50, 1)) }, nls.localize('minimapError', 'Minimap marker color for errors.'));
    exports.minimapWarning = registerColor('minimap.warningHighlight', { dark: exports.editorWarningForeground, light: exports.editorWarningForeground, hc: exports.editorWarningBorder }, nls.localize('overviewRuleWarning', 'Minimap marker color for warnings.'));
    exports.minimapBackground = registerColor('minimap.background', { dark: null, light: null, hc: null }, nls.localize('minimapBackground', "Minimap background color."));
    exports.minimapSliderBackground = registerColor('minimapSlider.background', { light: transparent(exports.scrollbarSliderBackground, 0.5), dark: transparent(exports.scrollbarSliderBackground, 0.5), hc: transparent(exports.scrollbarSliderBackground, 0.5) }, nls.localize('minimapSliderBackground', "Minimap slider background color."));
    exports.minimapSliderHoverBackground = registerColor('minimapSlider.hoverBackground', { light: transparent(exports.scrollbarSliderHoverBackground, 0.5), dark: transparent(exports.scrollbarSliderHoverBackground, 0.5), hc: transparent(exports.scrollbarSliderHoverBackground, 0.5) }, nls.localize('minimapSliderHoverBackground', "Minimap slider background color when hovering."));
    exports.minimapSliderActiveBackground = registerColor('minimapSlider.activeBackground', { light: transparent(exports.scrollbarSliderActiveBackground, 0.5), dark: transparent(exports.scrollbarSliderActiveBackground, 0.5), hc: transparent(exports.scrollbarSliderActiveBackground, 0.5) }, nls.localize('minimapSliderActiveBackground', "Minimap slider background color when clicked on."));
    exports.problemsErrorIconForeground = registerColor('problemsErrorIcon.foreground', { dark: exports.editorErrorForeground, light: exports.editorErrorForeground, hc: exports.editorErrorForeground }, nls.localize('problemsErrorIconForeground', "The color used for the problems error icon."));
    exports.problemsWarningIconForeground = registerColor('problemsWarningIcon.foreground', { dark: exports.editorWarningForeground, light: exports.editorWarningForeground, hc: exports.editorWarningForeground }, nls.localize('problemsWarningIconForeground', "The color used for the problems warning icon."));
    exports.problemsInfoIconForeground = registerColor('problemsInfoIcon.foreground', { dark: exports.editorInfoForeground, light: exports.editorInfoForeground, hc: exports.editorInfoForeground }, nls.localize('problemsInfoIconForeground', "The color used for the problems info icon."));
    // ----- color functions
    function darken(colorValue, factor) {
        return (theme) => {
            let color = resolveColorValue(colorValue, theme);
            if (color) {
                return color.darken(factor);
            }
            return undefined;
        };
    }
    exports.darken = darken;
    function lighten(colorValue, factor) {
        return (theme) => {
            let color = resolveColorValue(colorValue, theme);
            if (color) {
                return color.lighten(factor);
            }
            return undefined;
        };
    }
    exports.lighten = lighten;
    function transparent(colorValue, factor) {
        return (theme) => {
            let color = resolveColorValue(colorValue, theme);
            if (color) {
                return color.transparent(factor);
            }
            return undefined;
        };
    }
    exports.transparent = transparent;
    function oneOf(...colorValues) {
        return (theme) => {
            for (let colorValue of colorValues) {
                let color = resolveColorValue(colorValue, theme);
                if (color) {
                    return color;
                }
            }
            return undefined;
        };
    }
    exports.oneOf = oneOf;
    function lessProminent(colorValue, backgroundColorValue, factor, transparency) {
        return (theme) => {
            let from = resolveColorValue(colorValue, theme);
            if (from) {
                let backgroundColor = resolveColorValue(backgroundColorValue, theme);
                if (backgroundColor) {
                    if (from.isDarkerThan(backgroundColor)) {
                        return color_1.Color.getLighterColor(from, backgroundColor, factor).transparent(transparency);
                    }
                    return color_1.Color.getDarkerColor(from, backgroundColor, factor).transparent(transparency);
                }
                return from.transparent(factor * transparency);
            }
            return undefined;
        };
    }
    // ----- implementation
    /**
     * @param colorValue Resolve a color value in the context of a theme
     */
    function resolveColorValue(colorValue, theme) {
        if (colorValue === null) {
            return undefined;
        }
        else if (typeof colorValue === 'string') {
            if (colorValue[0] === '#') {
                return color_1.Color.fromHex(colorValue);
            }
            return theme.getColor(colorValue);
        }
        else if (colorValue instanceof color_1.Color) {
            return colorValue;
        }
        else if (typeof colorValue === 'function') {
            return colorValue(theme);
        }
        return undefined;
    }
    exports.resolveColorValue = resolveColorValue;
    exports.workbenchColorsSchemaId = 'vscode://schemas/workbench-colors';
    let schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.workbenchColorsSchemaId, colorRegistry.getColorSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.workbenchColorsSchemaId), 200);
    colorRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
// setTimeout(_ => console.log(colorRegistry.toString()), 5000);
//# __sourceMappingURL=colorRegistry.js.map