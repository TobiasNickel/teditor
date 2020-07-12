/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/color", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, nls, color_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.overviewRulerInfo = exports.overviewRulerWarning = exports.overviewRulerError = exports.overviewRulerRangeHighlight = exports.editorUnnecessaryCodeOpacity = exports.editorUnnecessaryCodeBorder = exports.editorGutter = exports.editorOverviewRulerBackground = exports.editorOverviewRulerBorder = exports.editorBracketMatchBorder = exports.editorBracketMatchBackground = exports.editorCodeLensForeground = exports.editorRuler = exports.editorActiveLineNumber = exports.editorLineNumbers = exports.editorActiveIndentGuides = exports.editorIndentGuides = exports.editorWhitespaces = exports.editorCursorBackground = exports.editorCursorForeground = exports.editorSymbolHighlightBorder = exports.editorSymbolHighlight = exports.editorRangeHighlightBorder = exports.editorRangeHighlight = exports.editorLineHighlightBorder = exports.editorLineHighlight = void 0;
    /**
     * Definition of the editor colors
     */
    exports.editorLineHighlight = colorRegistry_1.registerColor('editor.lineHighlightBackground', { dark: null, light: null, hc: null }, nls.localize('lineHighlight', 'Background color for the highlight of line at the cursor position.'));
    exports.editorLineHighlightBorder = colorRegistry_1.registerColor('editor.lineHighlightBorder', { dark: '#282828', light: '#eeeeee', hc: '#f38518' }, nls.localize('lineHighlightBorderBox', 'Background color for the border around the line at the cursor position.'));
    exports.editorRangeHighlight = colorRegistry_1.registerColor('editor.rangeHighlightBackground', { dark: '#ffffff0b', light: '#fdff0033', hc: null }, nls.localize('rangeHighlight', 'Background color of highlighted ranges, like by quick open and find features. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorRangeHighlightBorder = colorRegistry_1.registerColor('editor.rangeHighlightBorder', { dark: null, light: null, hc: colorRegistry_1.activeContrastBorder }, nls.localize('rangeHighlightBorder', 'Background color of the border around highlighted ranges.'), true);
    exports.editorSymbolHighlight = colorRegistry_1.registerColor('editor.symbolHighlightBackground', { dark: colorRegistry_1.editorFindMatchHighlight, light: colorRegistry_1.editorFindMatchHighlight, hc: null }, nls.localize('symbolHighlight', 'Background color of highlighted symbol, like for go to definition or go next/previous symbol. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorSymbolHighlightBorder = colorRegistry_1.registerColor('editor.symbolHighlightBorder', { dark: null, light: null, hc: colorRegistry_1.activeContrastBorder }, nls.localize('symbolHighlightBorder', 'Background color of the border around highlighted symbols.'), true);
    exports.editorCursorForeground = colorRegistry_1.registerColor('editorCursor.foreground', { dark: '#AEAFAD', light: color_1.Color.black, hc: color_1.Color.white }, nls.localize('caret', 'Color of the editor cursor.'));
    exports.editorCursorBackground = colorRegistry_1.registerColor('editorCursor.background', null, nls.localize('editorCursorBackground', 'The background color of the editor cursor. Allows customizing the color of a character overlapped by a block cursor.'));
    exports.editorWhitespaces = colorRegistry_1.registerColor('editorWhitespace.foreground', { dark: '#e3e4e229', light: '#33333333', hc: '#e3e4e229' }, nls.localize('editorWhitespaces', 'Color of whitespace characters in the editor.'));
    exports.editorIndentGuides = colorRegistry_1.registerColor('editorIndentGuide.background', { dark: exports.editorWhitespaces, light: exports.editorWhitespaces, hc: exports.editorWhitespaces }, nls.localize('editorIndentGuides', 'Color of the editor indentation guides.'));
    exports.editorActiveIndentGuides = colorRegistry_1.registerColor('editorIndentGuide.activeBackground', { dark: exports.editorWhitespaces, light: exports.editorWhitespaces, hc: exports.editorWhitespaces }, nls.localize('editorActiveIndentGuide', 'Color of the active editor indentation guides.'));
    exports.editorLineNumbers = colorRegistry_1.registerColor('editorLineNumber.foreground', { dark: '#858585', light: '#237893', hc: color_1.Color.white }, nls.localize('editorLineNumbers', 'Color of editor line numbers.'));
    const deprecatedEditorActiveLineNumber = colorRegistry_1.registerColor('editorActiveLineNumber.foreground', { dark: '#c6c6c6', light: '#0B216F', hc: colorRegistry_1.activeContrastBorder }, nls.localize('editorActiveLineNumber', 'Color of editor active line number'), false, nls.localize('deprecatedEditorActiveLineNumber', 'Id is deprecated. Use \'editorLineNumber.activeForeground\' instead.'));
    exports.editorActiveLineNumber = colorRegistry_1.registerColor('editorLineNumber.activeForeground', { dark: deprecatedEditorActiveLineNumber, light: deprecatedEditorActiveLineNumber, hc: deprecatedEditorActiveLineNumber }, nls.localize('editorActiveLineNumber', 'Color of editor active line number'));
    exports.editorRuler = colorRegistry_1.registerColor('editorRuler.foreground', { dark: '#5A5A5A', light: color_1.Color.lightgrey, hc: color_1.Color.white }, nls.localize('editorRuler', 'Color of the editor rulers.'));
    exports.editorCodeLensForeground = colorRegistry_1.registerColor('editorCodeLens.foreground', { dark: '#999999', light: '#999999', hc: '#999999' }, nls.localize('editorCodeLensForeground', 'Foreground color of editor CodeLens'));
    exports.editorBracketMatchBackground = colorRegistry_1.registerColor('editorBracketMatch.background', { dark: '#0064001a', light: '#0064001a', hc: '#0064001a' }, nls.localize('editorBracketMatchBackground', 'Background color behind matching brackets'));
    exports.editorBracketMatchBorder = colorRegistry_1.registerColor('editorBracketMatch.border', { dark: '#888', light: '#B9B9B9', hc: colorRegistry_1.contrastBorder }, nls.localize('editorBracketMatchBorder', 'Color for matching brackets boxes'));
    exports.editorOverviewRulerBorder = colorRegistry_1.registerColor('editorOverviewRuler.border', { dark: '#7f7f7f4d', light: '#7f7f7f4d', hc: '#7f7f7f4d' }, nls.localize('editorOverviewRulerBorder', 'Color of the overview ruler border.'));
    exports.editorOverviewRulerBackground = colorRegistry_1.registerColor('editorOverviewRuler.background', null, nls.localize('editorOverviewRulerBackground', 'Background color of the editor overview ruler. Only used when the minimap is enabled and placed on the right side of the editor.'));
    exports.editorGutter = colorRegistry_1.registerColor('editorGutter.background', { dark: colorRegistry_1.editorBackground, light: colorRegistry_1.editorBackground, hc: colorRegistry_1.editorBackground }, nls.localize('editorGutter', 'Background color of the editor gutter. The gutter contains the glyph margins and the line numbers.'));
    exports.editorUnnecessaryCodeBorder = colorRegistry_1.registerColor('editorUnnecessaryCode.border', { dark: null, light: null, hc: color_1.Color.fromHex('#fff').transparent(0.8) }, nls.localize('unnecessaryCodeBorder', 'Border color of unnecessary (unused) source code in the editor.'));
    exports.editorUnnecessaryCodeOpacity = colorRegistry_1.registerColor('editorUnnecessaryCode.opacity', { dark: color_1.Color.fromHex('#000a'), light: color_1.Color.fromHex('#0007'), hc: null }, nls.localize('unnecessaryCodeOpacity', 'Opacity of unnecessary (unused) source code in the editor. For example, "#000000c0" will render the code with 75% opacity. For high contrast themes, use the  \'editorUnnecessaryCode.border\' theme color to underline unnecessary code instead of fading it out.'));
    const rulerRangeDefault = new color_1.Color(new color_1.RGBA(0, 122, 204, 0.6));
    exports.overviewRulerRangeHighlight = colorRegistry_1.registerColor('editorOverviewRuler.rangeHighlightForeground', { dark: rulerRangeDefault, light: rulerRangeDefault, hc: rulerRangeDefault }, nls.localize('overviewRulerRangeHighlight', 'Overview ruler marker color for range highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.overviewRulerError = colorRegistry_1.registerColor('editorOverviewRuler.errorForeground', { dark: new color_1.Color(new color_1.RGBA(255, 18, 18, 0.7)), light: new color_1.Color(new color_1.RGBA(255, 18, 18, 0.7)), hc: new color_1.Color(new color_1.RGBA(255, 50, 50, 1)) }, nls.localize('overviewRuleError', 'Overview ruler marker color for errors.'));
    exports.overviewRulerWarning = colorRegistry_1.registerColor('editorOverviewRuler.warningForeground', { dark: colorRegistry_1.editorWarningForeground, light: colorRegistry_1.editorWarningForeground, hc: colorRegistry_1.editorWarningBorder }, nls.localize('overviewRuleWarning', 'Overview ruler marker color for warnings.'));
    exports.overviewRulerInfo = colorRegistry_1.registerColor('editorOverviewRuler.infoForeground', { dark: colorRegistry_1.editorInfoForeground, light: colorRegistry_1.editorInfoForeground, hc: colorRegistry_1.editorInfoBorder }, nls.localize('overviewRuleInfo', 'Overview ruler marker color for infos.'));
    // contains all color rules that used to defined in editor/browser/widget/editor.css
    themeService_1.registerThemingParticipant((theme, collector) => {
        const background = theme.getColor(colorRegistry_1.editorBackground);
        if (background) {
            collector.addRule(`.monaco-editor, .monaco-editor-background, .monaco-editor .inputarea.ime-input { background-color: ${background}; }`);
        }
        const foreground = theme.getColor(colorRegistry_1.editorForeground);
        if (foreground) {
            collector.addRule(`.monaco-editor, .monaco-editor .inputarea.ime-input { color: ${foreground}; }`);
        }
        const gutter = theme.getColor(exports.editorGutter);
        if (gutter) {
            collector.addRule(`.monaco-editor .margin { background-color: ${gutter}; }`);
        }
        const rangeHighlight = theme.getColor(exports.editorRangeHighlight);
        if (rangeHighlight) {
            collector.addRule(`.monaco-editor .rangeHighlight { background-color: ${rangeHighlight}; }`);
        }
        const rangeHighlightBorder = theme.getColor(exports.editorRangeHighlightBorder);
        if (rangeHighlightBorder) {
            collector.addRule(`.monaco-editor .rangeHighlight { border: 1px ${theme.type === 'hc' ? 'dotted' : 'solid'} ${rangeHighlightBorder}; }`);
        }
        const symbolHighlight = theme.getColor(exports.editorSymbolHighlight);
        if (symbolHighlight) {
            collector.addRule(`.monaco-editor .symbolHighlight { background-color: ${symbolHighlight}; }`);
        }
        const symbolHighlightBorder = theme.getColor(exports.editorSymbolHighlightBorder);
        if (symbolHighlightBorder) {
            collector.addRule(`.monaco-editor .symbolHighlight { border: 1px ${theme.type === 'hc' ? 'dotted' : 'solid'} ${symbolHighlightBorder}; }`);
        }
        const invisibles = theme.getColor(exports.editorWhitespaces);
        if (invisibles) {
            collector.addRule(`.monaco-editor .mtkw { color: ${invisibles} !important; }`);
            collector.addRule(`.monaco-editor .mtkz { color: ${invisibles} !important; }`);
        }
    });
});
//# __sourceMappingURL=editorColorRegistry.js.map