/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme"], function (require, exports, nls, colorRegistry_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerColors = exports.ansiColorMap = exports.TERMINAL_BORDER_COLOR = exports.TERMINAL_SELECTION_BACKGROUND_COLOR = exports.TERMINAL_CURSOR_BACKGROUND_COLOR = exports.TERMINAL_CURSOR_FOREGROUND_COLOR = exports.TERMINAL_FOREGROUND_COLOR = exports.TERMINAL_BACKGROUND_COLOR = exports.ansiColorIdentifiers = void 0;
    /**
     * The color identifiers for the terminal's ansi colors. The index in the array corresponds to the index
     * of the color in the terminal color table.
     */
    exports.ansiColorIdentifiers = [];
    exports.TERMINAL_BACKGROUND_COLOR = colorRegistry_1.registerColor('terminal.background', null, nls.localize('terminal.background', 'The background color of the terminal, this allows coloring the terminal differently to the panel.'));
    exports.TERMINAL_FOREGROUND_COLOR = colorRegistry_1.registerColor('terminal.foreground', {
        light: '#333333',
        dark: '#CCCCCC',
        hc: '#FFFFFF'
    }, nls.localize('terminal.foreground', 'The foreground color of the terminal.'));
    exports.TERMINAL_CURSOR_FOREGROUND_COLOR = colorRegistry_1.registerColor('terminalCursor.foreground', null, nls.localize('terminalCursor.foreground', 'The foreground color of the terminal cursor.'));
    exports.TERMINAL_CURSOR_BACKGROUND_COLOR = colorRegistry_1.registerColor('terminalCursor.background', null, nls.localize('terminalCursor.background', 'The background color of the terminal cursor. Allows customizing the color of a character overlapped by a block cursor.'));
    exports.TERMINAL_SELECTION_BACKGROUND_COLOR = colorRegistry_1.registerColor('terminal.selectionBackground', {
        light: '#00000040',
        dark: '#FFFFFF40',
        hc: '#FFFFFF80'
    }, nls.localize('terminal.selectionBackground', 'The selection background color of the terminal.'));
    exports.TERMINAL_BORDER_COLOR = colorRegistry_1.registerColor('terminal.border', {
        dark: theme_1.PANEL_BORDER,
        light: theme_1.PANEL_BORDER,
        hc: theme_1.PANEL_BORDER
    }, nls.localize('terminal.border', 'The color of the border that separates split panes within the terminal. This defaults to panel.border.'));
    exports.ansiColorMap = {
        'terminal.ansiBlack': {
            index: 0,
            defaults: {
                light: '#000000',
                dark: '#000000',
                hc: '#000000'
            }
        },
        'terminal.ansiRed': {
            index: 1,
            defaults: {
                light: '#cd3131',
                dark: '#cd3131',
                hc: '#cd0000'
            }
        },
        'terminal.ansiGreen': {
            index: 2,
            defaults: {
                light: '#00BC00',
                dark: '#0DBC79',
                hc: '#00cd00'
            }
        },
        'terminal.ansiYellow': {
            index: 3,
            defaults: {
                light: '#949800',
                dark: '#e5e510',
                hc: '#cdcd00'
            }
        },
        'terminal.ansiBlue': {
            index: 4,
            defaults: {
                light: '#0451a5',
                dark: '#2472c8',
                hc: '#0000ee'
            }
        },
        'terminal.ansiMagenta': {
            index: 5,
            defaults: {
                light: '#bc05bc',
                dark: '#bc3fbc',
                hc: '#cd00cd'
            }
        },
        'terminal.ansiCyan': {
            index: 6,
            defaults: {
                light: '#0598bc',
                dark: '#11a8cd',
                hc: '#00cdcd'
            }
        },
        'terminal.ansiWhite': {
            index: 7,
            defaults: {
                light: '#555555',
                dark: '#e5e5e5',
                hc: '#e5e5e5'
            }
        },
        'terminal.ansiBrightBlack': {
            index: 8,
            defaults: {
                light: '#666666',
                dark: '#666666',
                hc: '#7f7f7f'
            }
        },
        'terminal.ansiBrightRed': {
            index: 9,
            defaults: {
                light: '#cd3131',
                dark: '#f14c4c',
                hc: '#ff0000'
            }
        },
        'terminal.ansiBrightGreen': {
            index: 10,
            defaults: {
                light: '#14CE14',
                dark: '#23d18b',
                hc: '#00ff00'
            }
        },
        'terminal.ansiBrightYellow': {
            index: 11,
            defaults: {
                light: '#b5ba00',
                dark: '#f5f543',
                hc: '#ffff00'
            }
        },
        'terminal.ansiBrightBlue': {
            index: 12,
            defaults: {
                light: '#0451a5',
                dark: '#3b8eea',
                hc: '#5c5cff'
            }
        },
        'terminal.ansiBrightMagenta': {
            index: 13,
            defaults: {
                light: '#bc05bc',
                dark: '#d670d6',
                hc: '#ff00ff'
            }
        },
        'terminal.ansiBrightCyan': {
            index: 14,
            defaults: {
                light: '#0598bc',
                dark: '#29b8db',
                hc: '#00ffff'
            }
        },
        'terminal.ansiBrightWhite': {
            index: 15,
            defaults: {
                light: '#a5a5a5',
                dark: '#e5e5e5',
                hc: '#ffffff'
            }
        }
    };
    function registerColors() {
        for (const id in exports.ansiColorMap) {
            const entry = exports.ansiColorMap[id];
            const colorName = id.substring(13);
            exports.ansiColorIdentifiers[entry.index] = colorRegistry_1.registerColor(id, entry.defaults, nls.localize('terminal.ansiColor', '\'{0}\' ANSI color in the terminal.', colorName));
        }
    }
    exports.registerColors = registerColors;
});
//# __sourceMappingURL=terminalColorRegistry.js.map