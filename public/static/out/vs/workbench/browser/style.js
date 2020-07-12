/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/base/common/platform", "vs/base/browser/dom", "vs/base/browser/browser", "vs/css!./media/style"], function (require, exports, themeService_1, colorRegistry_1, theme_1, platform_1, dom_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_FONT_FAMILY = void 0;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Foreground
        const windowForeground = theme.getColor(colorRegistry_1.foreground);
        if (windowForeground) {
            collector.addRule(`.monaco-workbench { color: ${windowForeground}; }`);
        }
        // Background (We need to set the workbench background color so that on Windows we get subpixel-antialiasing)
        const workbenchBackground = theme_1.WORKBENCH_BACKGROUND(theme);
        collector.addRule(`.monaco-workbench { background-color: ${workbenchBackground}; }`);
        // Icon defaults
        const iconForegroundColor = theme.getColor(colorRegistry_1.iconForeground);
        if (iconForegroundColor) {
            collector.addRule(`.monaco-workbench .codicon { color: ${iconForegroundColor}; }`);
        }
        // Selection
        const windowSelectionBackground = theme.getColor(colorRegistry_1.selectionBackground);
        if (windowSelectionBackground) {
            collector.addRule(`.monaco-workbench ::selection { background-color: ${windowSelectionBackground}; }`);
        }
        // Input placeholder
        const placeholderForeground = theme.getColor(colorRegistry_1.inputPlaceholderForeground);
        if (placeholderForeground) {
            collector.addRule(`
			.monaco-workbench input::placeholder { color: ${placeholderForeground}; }
			.monaco-workbench input::-webkit-input-placeholder  { color: ${placeholderForeground}; }
			.monaco-workbench input::-moz-placeholder { color: ${placeholderForeground}; }
		`);
            collector.addRule(`
			.monaco-workbench textarea::placeholder { color: ${placeholderForeground}; }
			.monaco-workbench textarea::-webkit-input-placeholder { color: ${placeholderForeground}; }
			.monaco-workbench textarea::-moz-placeholder { color: ${placeholderForeground}; }
		`);
        }
        // List highlight
        const listHighlightForegroundColor = theme.getColor(colorRegistry_1.listHighlightForeground);
        if (listHighlightForegroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-list .monaco-list-row .monaco-highlighted-label .highlight {
				color: ${listHighlightForegroundColor};
			}
		`);
        }
        // Scrollbars
        const scrollbarShadowColor = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (scrollbarShadowColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .shadow.top {
				box-shadow: ${scrollbarShadowColor} 0 6px 6px -6px inset;
			}

			.monaco-workbench .monaco-scrollable-element > .shadow.left {
				box-shadow: ${scrollbarShadowColor} 6px 0 6px -6px inset;
			}

			.monaco-workbench .monaco-scrollable-element > .shadow.top.left {
				box-shadow: ${scrollbarShadowColor} 6px 6px 6px -6px inset;
			}
		`);
        }
        const scrollbarSliderBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderBackground);
        if (scrollbarSliderBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .scrollbar > .slider {
				background: ${scrollbarSliderBackgroundColor};
			}
		`);
        }
        const scrollbarSliderHoverBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderHoverBackground);
        if (scrollbarSliderHoverBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .scrollbar > .slider:hover {
				background: ${scrollbarSliderHoverBackgroundColor};
			}
		`);
        }
        const scrollbarSliderActiveBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderActiveBackground);
        if (scrollbarSliderActiveBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .scrollbar > .slider.active {
				background: ${scrollbarSliderActiveBackgroundColor};
			}
		`);
        }
        // Focus outline
        const focusOutline = theme.getColor(colorRegistry_1.focusBorder);
        if (focusOutline) {
            collector.addRule(`
		.monaco-workbench [tabindex="0"]:focus,
		.monaco-workbench [tabindex="-1"]:focus,
		.monaco-workbench .synthetic-focus,
		.monaco-workbench select:focus,
		.monaco-workbench .monaco-list:not(.element-focused):focus:before,
		.monaco-workbench input[type="button"]:focus,
		.monaco-workbench input[type="text"]:focus,
		.monaco-workbench button:focus,
		.monaco-workbench textarea:focus,
		.monaco-workbench input[type="search"]:focus,
		.monaco-workbench input[type="checkbox"]:focus {
			outline-color: ${focusOutline};
		}
		`);
        }
        // High Contrast theme overwrites for outline
        if (theme.type === themeService_1.HIGH_CONTRAST) {
            collector.addRule(`
		.hc-black [tabindex="0"]:focus,
		.hc-black [tabindex="-1"]:focus,
		.hc-black .synthetic-focus,
		.hc-black select:focus,
		.hc-black input[type="button"]:focus,
		.hc-black input[type="text"]:focus,
		.hc-black textarea:focus,
		.hc-black input[type="checkbox"]:focus {
			outline-style: solid;
			outline-width: 1px;
		}

		.hc-black .synthetic-focus input {
			background: transparent; /* Search input focus fix when in high contrast */
		}
		`);
        }
        // Update <meta name="theme-color" content=""> based on selected theme
        if (platform_1.isWeb) {
            const titleBackground = theme.getColor(theme_1.TITLE_BAR_ACTIVE_BACKGROUND);
            if (titleBackground) {
                const metaElementId = 'monaco-workbench-meta-theme-color';
                let metaElement = document.getElementById(metaElementId);
                if (!metaElement) {
                    metaElement = dom_1.createMetaElement();
                    metaElement.name = 'theme-color';
                    metaElement.id = metaElementId;
                }
                metaElement.content = titleBackground.toString();
            }
        }
        // We disable user select on the root element, however on Safari this seems
        // to prevent any text selection in the monaco editor. As a workaround we
        // allow to select text in monaco editor instances.
        if (browser_1.isSafari) {
            collector.addRule(`
			body.web {
				touch-action: none;
			}
			.monaco-workbench .monaco-editor .view-lines {
				user-select: text;
				-webkit-user-select: text;
			}
		`);
        }
        // Update body background color to ensure the home indicator area looks similar to the workbench
        if (platform_1.isIOS && browser_1.isStandalone) {
            collector.addRule(`body { background-color: ${workbenchBackground}; }`);
        }
    });
    /**
     * The best font-family to be used in CSS based on the platform:
     * - Windows: Segoe preferred, fallback to sans-serif
     * - macOS: standard system font, fallback to sans-serif
     * - Linux: standard system font preferred, fallback to Ubuntu fonts
     *
     * Note: this currently does not adjust for different locales.
     */
    exports.DEFAULT_FONT_FAMILY = platform_1.isWindows ? '"Segoe WPC", "Segoe UI", sans-serif' : platform_1.isMacintosh ? '-apple-system, BlinkMacSystemFont, sans-serif' : 'system-ui, "Ubuntu", "Droid Sans", sans-serif';
});
//# __sourceMappingURL=style.js.map