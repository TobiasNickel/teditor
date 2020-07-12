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
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookRegistry", "vs/base/browser/dom", "vs/base/common/color", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, notebookCommon_1, notebookRegistry_1, DOM, color_1, terminalColorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.calcANSI8bitColor = exports.appendStylizedStringToContainer = exports.handleANSIOutput = void 0;
    let ErrorTransform = class ErrorTransform {
        constructor(editor, themeService) {
            this.editor = editor;
            this.themeService = themeService;
        }
        render(output, container) {
            const header = document.createElement('div');
            const headerMessage = output.ename && output.evalue
                ? `${output.ename}: ${output.evalue}`
                : output.ename || output.evalue;
            if (headerMessage) {
                header.innerText = headerMessage;
                container.appendChild(header);
            }
            const traceback = document.createElement('pre');
            DOM.addClasses(traceback, 'traceback');
            if (output.traceback) {
                for (let j = 0; j < output.traceback.length; j++) {
                    traceback.appendChild(handleANSIOutput(output.traceback[j], this.themeService));
                }
            }
            container.appendChild(traceback);
            DOM.addClasses(container, 'error');
            return {
                hasDynamicHeight: false
            };
        }
        dispose() {
        }
    };
    ErrorTransform = __decorate([
        __param(1, themeService_1.IThemeService)
    ], ErrorTransform);
    notebookRegistry_1.NotebookRegistry.registerOutputTransform('notebook.output.error', notebookCommon_1.CellOutputKind.Error, ErrorTransform);
    /**
     * @param text The content to stylize.
     * @returns An {@link HTMLSpanElement} that contains the potentially stylized text.
     */
    function handleANSIOutput(text, themeService) {
        const root = document.createElement('span');
        const textLength = text.length;
        let styleNames = [];
        let customFgColor;
        let customBgColor;
        let currentPos = 0;
        let buffer = '';
        while (currentPos < textLength) {
            let sequenceFound = false;
            // Potentially an ANSI escape sequence.
            // See http://ascii-table.com/ansi-escape-sequences.php & https://en.wikipedia.org/wiki/ANSI_escape_code
            if (text.charCodeAt(currentPos) === 27 && text.charAt(currentPos + 1) === '[') {
                const startPos = currentPos;
                currentPos += 2; // Ignore 'Esc[' as it's in every sequence.
                let ansiSequence = '';
                while (currentPos < textLength) {
                    const char = text.charAt(currentPos);
                    ansiSequence += char;
                    currentPos++;
                    // Look for a known sequence terminating character.
                    if (char.match(/^[ABCDHIJKfhmpsu]$/)) {
                        sequenceFound = true;
                        break;
                    }
                }
                if (sequenceFound) {
                    // Flush buffer with previous styles.
                    appendStylizedStringToContainer(root, buffer, styleNames, customFgColor, customBgColor);
                    buffer = '';
                    /*
                     * Certain ranges that are matched here do not contain real graphics rendition sequences. For
                     * the sake of having a simpler expression, they have been included anyway.
                     */
                    if (ansiSequence.match(/^(?:[34][0-8]|9[0-7]|10[0-7]|[013]|4|[34]9)(?:;[349][0-7]|10[0-7]|[013]|[245]|[34]9)?(?:;[012]?[0-9]?[0-9])*;?m$/)) {
                        const styleCodes = ansiSequence.slice(0, -1) // Remove final 'm' character.
                            .split(';') // Separate style codes.
                            .filter(elem => elem !== '') // Filter empty elems as '34;m' -> ['34', ''].
                            .map(elem => parseInt(elem, 10)); // Convert to numbers.
                        if (styleCodes[0] === 38 || styleCodes[0] === 48) {
                            // Advanced color code - can't be combined with formatting codes like simple colors can
                            // Ignores invalid colors and additional info beyond what is necessary
                            const colorType = (styleCodes[0] === 38) ? 'foreground' : 'background';
                            if (styleCodes[1] === 5) {
                                set8BitColor(styleCodes, colorType);
                            }
                            else if (styleCodes[1] === 2) {
                                set24BitColor(styleCodes, colorType);
                            }
                        }
                        else {
                            setBasicFormatters(styleCodes);
                        }
                    }
                    else {
                        // Unsupported sequence so simply hide it.
                    }
                }
                else {
                    currentPos = startPos;
                }
            }
            if (sequenceFound === false) {
                buffer += text.charAt(currentPos);
                currentPos++;
            }
        }
        // Flush remaining text buffer if not empty.
        if (buffer) {
            appendStylizedStringToContainer(root, buffer, styleNames, customFgColor, customBgColor);
        }
        return root;
        /**
         * Change the foreground or background color by clearing the current color
         * and adding the new one.
         * @param colorType If `'foreground'`, will change the foreground color, if
         * 	`'background'`, will change the background color.
         * @param color Color to change to. If `undefined` or not provided,
         * will clear current color without adding a new one.
         */
        function changeColor(colorType, color) {
            if (colorType === 'foreground') {
                customFgColor = color;
            }
            else if (colorType === 'background') {
                customBgColor = color;
            }
            styleNames = styleNames.filter(style => style !== `code-${colorType}-colored`);
            if (color !== undefined) {
                styleNames.push(`code-${colorType}-colored`);
            }
        }
        /**
         * Calculate and set basic ANSI formatting. Supports bold, italic, underline,
         * normal foreground and background colors, and bright foreground and
         * background colors. Not to be used for codes containing advanced colors.
         * Will ignore invalid codes.
         * @param styleCodes Array of ANSI basic styling numbers, which will be
         * applied in order. New colors and backgrounds clear old ones; new formatting
         * does not.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code }
         */
        function setBasicFormatters(styleCodes) {
            for (let code of styleCodes) {
                switch (code) {
                    case 0: {
                        styleNames = [];
                        customFgColor = undefined;
                        customBgColor = undefined;
                        break;
                    }
                    case 1: {
                        styleNames.push('code-bold');
                        break;
                    }
                    case 3: {
                        styleNames.push('code-italic');
                        break;
                    }
                    case 4: {
                        styleNames.push('code-underline');
                        break;
                    }
                    case 39: {
                        changeColor('foreground', undefined);
                        break;
                    }
                    case 49: {
                        changeColor('background', undefined);
                        break;
                    }
                    default: {
                        setBasicColor(code);
                        break;
                    }
                }
            }
        }
        /**
         * Calculate and set styling for complicated 24-bit ANSI color codes.
         * @param styleCodes Full list of integer codes that make up the full ANSI
         * sequence, including the two defining codes and the three RGB codes.
         * @param colorType If `'foreground'`, will set foreground color, if
         * `'background'`, will set background color.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#24-bit }
         */
        function set24BitColor(styleCodes, colorType) {
            if (styleCodes.length >= 5 &&
                styleCodes[2] >= 0 && styleCodes[2] <= 255 &&
                styleCodes[3] >= 0 && styleCodes[3] <= 255 &&
                styleCodes[4] >= 0 && styleCodes[4] <= 255) {
                const customColor = new color_1.RGBA(styleCodes[2], styleCodes[3], styleCodes[4]);
                changeColor(colorType, customColor);
            }
        }
        /**
         * Calculate and set styling for advanced 8-bit ANSI color codes.
         * @param styleCodes Full list of integer codes that make up the ANSI
         * sequence, including the two defining codes and the one color code.
         * @param colorType If `'foreground'`, will set foreground color, if
         * `'background'`, will set background color.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit }
         */
        function set8BitColor(styleCodes, colorType) {
            let colorNumber = styleCodes[2];
            const color = calcANSI8bitColor(colorNumber);
            if (color) {
                changeColor(colorType, color);
            }
            else if (colorNumber >= 0 && colorNumber <= 15) {
                // Need to map to one of the four basic color ranges (30-37, 90-97, 40-47, 100-107)
                colorNumber += 30;
                if (colorNumber >= 38) {
                    // Bright colors
                    colorNumber += 52;
                }
                if (colorType === 'background') {
                    colorNumber += 10;
                }
                setBasicColor(colorNumber);
            }
        }
        /**
         * Calculate and set styling for basic bright and dark ANSI color codes. Uses
         * theme colors if available. Automatically distinguishes between foreground
         * and background colors; does not support color-clearing codes 39 and 49.
         * @param styleCode Integer color code on one of the following ranges:
         * [30-37, 90-97, 40-47, 100-107]. If not on one of these ranges, will do
         * nothing.
         */
        function setBasicColor(styleCode) {
            const theme = themeService.getColorTheme();
            let colorType;
            let colorIndex;
            if (styleCode >= 30 && styleCode <= 37) {
                colorIndex = styleCode - 30;
                colorType = 'foreground';
            }
            else if (styleCode >= 90 && styleCode <= 97) {
                colorIndex = (styleCode - 90) + 8; // High-intensity (bright)
                colorType = 'foreground';
            }
            else if (styleCode >= 40 && styleCode <= 47) {
                colorIndex = styleCode - 40;
                colorType = 'background';
            }
            else if (styleCode >= 100 && styleCode <= 107) {
                colorIndex = (styleCode - 100) + 8; // High-intensity (bright)
                colorType = 'background';
            }
            if (colorIndex !== undefined && colorType) {
                const colorName = terminalColorRegistry_1.ansiColorIdentifiers[colorIndex];
                const color = theme.getColor(colorName);
                if (color) {
                    changeColor(colorType, color.rgba);
                }
            }
        }
    }
    exports.handleANSIOutput = handleANSIOutput;
    /**
     * @param root The {@link HTMLElement} to append the content to.
     * @param stringContent The text content to be appended.
     * @param cssClasses The list of CSS styles to apply to the text content.
     * @param linkDetector The {@link LinkDetector} responsible for generating links from {@param stringContent}.
     * @param customTextColor If provided, will apply custom color with inline style.
     * @param customBackgroundColor If provided, will apply custom color with inline style.
     */
    function appendStylizedStringToContainer(root, stringContent, cssClasses, customTextColor, customBackgroundColor) {
        if (!root || !stringContent) {
            return;
        }
        const container = linkify(stringContent, true);
        container.className = cssClasses.join(' ');
        if (customTextColor) {
            container.style.color =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customTextColor));
        }
        if (customBackgroundColor) {
            container.style.backgroundColor =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customBackgroundColor));
        }
        root.appendChild(container);
    }
    exports.appendStylizedStringToContainer = appendStylizedStringToContainer;
    function linkify(text, splitLines) {
        if (splitLines) {
            const lines = text.split('\n');
            for (let i = 0; i < lines.length - 1; i++) {
                lines[i] = lines[i] + '\n';
            }
            if (!lines[lines.length - 1]) {
                // Remove the last element ('') that split added.
                lines.pop();
            }
            const elements = lines.map(line => linkify(line));
            if (elements.length === 1) {
                // Do not wrap single line with extra span.
                return elements[0];
            }
            const container = document.createElement('span');
            elements.forEach(e => container.appendChild(e));
            return container;
        }
        const container = document.createElement('span');
        container.appendChild(document.createTextNode(text));
        return container;
    }
    /**
     * Calculate the color from the color set defined in the ANSI 8-bit standard.
     * Standard and high intensity colors are not defined in the standard as specific
     * colors, so these and invalid colors return `undefined`.
     * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit } for info.
     * @param colorNumber The number (ranging from 16 to 255) referring to the color
     * desired.
     */
    function calcANSI8bitColor(colorNumber) {
        if (colorNumber % 1 !== 0) {
            // Should be integer
            // {{SQL CARBON EDIT}} @todo anthonydresser 4/12/19 this is necessary because we don't use strict null checks
            return undefined;
        }
        if (colorNumber >= 16 && colorNumber <= 231) {
            // Converts to one of 216 RGB colors
            colorNumber -= 16;
            let blue = colorNumber % 6;
            colorNumber = (colorNumber - blue) / 6;
            let green = colorNumber % 6;
            colorNumber = (colorNumber - green) / 6;
            let red = colorNumber;
            // red, green, blue now range on [0, 5], need to map to [0,255]
            const convFactor = 255 / 5;
            blue = Math.round(blue * convFactor);
            green = Math.round(green * convFactor);
            red = Math.round(red * convFactor);
            return new color_1.RGBA(red, green, blue);
        }
        else if (colorNumber >= 232 && colorNumber <= 255) {
            // Converts to a grayscale value
            colorNumber -= 232;
            const colorLevel = Math.round(colorNumber / 23 * 255);
            return new color_1.RGBA(colorLevel, colorLevel, colorLevel);
        }
        else {
            // {{SQL CARBON EDIT}} @todo anthonydresser 4/12/19 this is necessary because we don't use strict null checks
            return undefined;
        }
    }
    exports.calcANSI8bitColor = calcANSI8bitColor;
});
//# __sourceMappingURL=errorTransform.js.map