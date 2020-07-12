/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/platform/theme/common/colorRegistry", "vs/editor/common/view/editorColorRegistry"], function (require, exports, color_1, colorRegistry, editorColorRegistry) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertSettings = void 0;
    const settingToColorIdMapping = {};
    function addSettingMapping(settingId, colorId) {
        let colorIds = settingToColorIdMapping[settingId];
        if (!colorIds) {
            settingToColorIdMapping[settingId] = colorIds = [];
        }
        colorIds.push(colorId);
    }
    function convertSettings(oldSettings, result) {
        for (let rule of oldSettings) {
            result.textMateRules.push(rule);
            if (!rule.scope) {
                let settings = rule.settings;
                if (!settings) {
                    rule.settings = {};
                }
                else {
                    for (const settingKey in settings) {
                        const key = settingKey;
                        let mappings = settingToColorIdMapping[key];
                        if (mappings) {
                            let colorHex = settings[key];
                            if (typeof colorHex === 'string') {
                                let color = color_1.Color.fromHex(colorHex);
                                for (let colorId of mappings) {
                                    result.colors[colorId] = color;
                                }
                            }
                        }
                        if (key !== 'foreground' && key !== 'background' && key !== 'fontStyle') {
                            delete settings[key];
                        }
                    }
                }
            }
        }
    }
    exports.convertSettings = convertSettings;
    addSettingMapping('background', colorRegistry.editorBackground);
    addSettingMapping('foreground', colorRegistry.editorForeground);
    addSettingMapping('selection', colorRegistry.editorSelectionBackground);
    addSettingMapping('inactiveSelection', colorRegistry.editorInactiveSelection);
    addSettingMapping('selectionHighlightColor', colorRegistry.editorSelectionHighlight);
    addSettingMapping('findMatchHighlight', colorRegistry.editorFindMatchHighlight);
    addSettingMapping('currentFindMatchHighlight', colorRegistry.editorFindMatch);
    addSettingMapping('hoverHighlight', colorRegistry.editorHoverHighlight);
    addSettingMapping('wordHighlight', 'editor.wordHighlightBackground'); // inlined to avoid editor/contrib dependenies
    addSettingMapping('wordHighlightStrong', 'editor.wordHighlightStrongBackground');
    addSettingMapping('findRangeHighlight', colorRegistry.editorFindRangeHighlight);
    addSettingMapping('findMatchHighlight', 'peekViewResult.matchHighlightBackground');
    addSettingMapping('referenceHighlight', 'peekViewEditor.matchHighlightBackground');
    addSettingMapping('lineHighlight', editorColorRegistry.editorLineHighlight);
    addSettingMapping('rangeHighlight', editorColorRegistry.editorRangeHighlight);
    addSettingMapping('caret', editorColorRegistry.editorCursorForeground);
    addSettingMapping('invisibles', editorColorRegistry.editorWhitespaces);
    addSettingMapping('guide', editorColorRegistry.editorIndentGuides);
    addSettingMapping('activeGuide', editorColorRegistry.editorActiveIndentGuides);
    const ansiColorMap = ['ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow', 'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite',
        'ansiBrightBlack', 'ansiBrightRed', 'ansiBrightGreen', 'ansiBrightYellow', 'ansiBrightBlue', 'ansiBrightMagenta', 'ansiBrightCyan', 'ansiBrightWhite'
    ];
    for (const color of ansiColorMap) {
        addSettingMapping(color, 'terminal.' + color);
    }
});
//# __sourceMappingURL=themeCompatibility.js.map