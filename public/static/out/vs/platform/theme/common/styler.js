/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/colorRegistry"], function (require, exports, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.attachDialogStyler = exports.defaultDialogStyles = exports.attachMenuStyler = exports.defaultMenuStyles = exports.attachBreadcrumbsStyler = exports.defaultBreadcrumbsStyles = exports.attachStylerCallback = exports.attachProgressBarStyler = exports.attachLinkStyler = exports.attachButtonStyler = exports.defaultListStyles = exports.attachListStyler = exports.attachQuickInputStyler = exports.attachFindReplaceInputBoxStyler = exports.attachSelectBoxStyler = exports.attachInputBoxStyler = exports.attachBadgeStyler = exports.attachCheckboxStyler = exports.attachStyler = exports.computeStyles = void 0;
    function computeStyles(theme, styleMap) {
        const styles = Object.create(null);
        for (let key in styleMap) {
            const value = styleMap[key];
            if (value) {
                styles[key] = colorRegistry_1.resolveColorValue(value, theme);
            }
        }
        return styles;
    }
    exports.computeStyles = computeStyles;
    function attachStyler(themeService, styleMap, widgetOrCallback) {
        function applyStyles(theme) {
            const styles = computeStyles(themeService.getColorTheme(), styleMap);
            if (typeof widgetOrCallback === 'function') {
                widgetOrCallback(styles);
            }
            else {
                widgetOrCallback.style(styles);
            }
        }
        applyStyles(themeService.getColorTheme());
        return themeService.onDidColorThemeChange(applyStyles);
    }
    exports.attachStyler = attachStyler;
    function attachCheckboxStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            inputActiveOptionBorder: (style && style.inputActiveOptionBorderColor) || colorRegistry_1.inputActiveOptionBorder,
            inputActiveOptionForeground: (style && style.inputActiveOptionForegroundColor) || colorRegistry_1.inputActiveOptionForeground,
            inputActiveOptionBackground: (style && style.inputActiveOptionBackgroundColor) || colorRegistry_1.inputActiveOptionBackground
        }, widget);
    }
    exports.attachCheckboxStyler = attachCheckboxStyler;
    function attachBadgeStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            badgeBackground: (style && style.badgeBackground) || colorRegistry_1.badgeBackground,
            badgeForeground: (style && style.badgeForeground) || colorRegistry_1.badgeForeground,
            badgeBorder: colorRegistry_1.contrastBorder
        }, widget);
    }
    exports.attachBadgeStyler = attachBadgeStyler;
    function attachInputBoxStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            inputBackground: (style && style.inputBackground) || colorRegistry_1.inputBackground,
            inputForeground: (style && style.inputForeground) || colorRegistry_1.inputForeground,
            inputBorder: (style && style.inputBorder) || colorRegistry_1.inputBorder,
            inputValidationInfoBorder: (style && style.inputValidationInfoBorder) || colorRegistry_1.inputValidationInfoBorder,
            inputValidationInfoBackground: (style && style.inputValidationInfoBackground) || colorRegistry_1.inputValidationInfoBackground,
            inputValidationInfoForeground: (style && style.inputValidationInfoForeground) || colorRegistry_1.inputValidationInfoForeground,
            inputValidationWarningBorder: (style && style.inputValidationWarningBorder) || colorRegistry_1.inputValidationWarningBorder,
            inputValidationWarningBackground: (style && style.inputValidationWarningBackground) || colorRegistry_1.inputValidationWarningBackground,
            inputValidationWarningForeground: (style && style.inputValidationWarningForeground) || colorRegistry_1.inputValidationWarningForeground,
            inputValidationErrorBorder: (style && style.inputValidationErrorBorder) || colorRegistry_1.inputValidationErrorBorder,
            inputValidationErrorBackground: (style && style.inputValidationErrorBackground) || colorRegistry_1.inputValidationErrorBackground,
            inputValidationErrorForeground: (style && style.inputValidationErrorForeground) || colorRegistry_1.inputValidationErrorForeground
        }, widget);
    }
    exports.attachInputBoxStyler = attachInputBoxStyler;
    function attachSelectBoxStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            selectBackground: (style && style.selectBackground) || colorRegistry_1.selectBackground,
            selectListBackground: (style && style.selectListBackground) || colorRegistry_1.selectListBackground,
            selectForeground: (style && style.selectForeground) || colorRegistry_1.selectForeground,
            decoratorRightForeground: (style && style.pickerGroupForeground) || colorRegistry_1.pickerGroupForeground,
            selectBorder: (style && style.selectBorder) || colorRegistry_1.selectBorder,
            focusBorder: (style && style.focusBorder) || colorRegistry_1.focusBorder,
            listFocusBackground: (style && style.listFocusBackground) || colorRegistry_1.listFocusBackground,
            listFocusForeground: (style && style.listFocusForeground) || colorRegistry_1.listFocusForeground,
            listFocusOutline: (style && style.listFocusOutline) || colorRegistry_1.activeContrastBorder,
            listHoverBackground: (style && style.listHoverBackground) || colorRegistry_1.listHoverBackground,
            listHoverForeground: (style && style.listHoverForeground) || colorRegistry_1.listHoverForeground,
            listHoverOutline: (style && style.listFocusOutline) || colorRegistry_1.activeContrastBorder,
            selectListBorder: (style && style.selectListBorder) || colorRegistry_1.editorWidgetBorder
        }, widget);
    }
    exports.attachSelectBoxStyler = attachSelectBoxStyler;
    function attachFindReplaceInputBoxStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            inputBackground: (style && style.inputBackground) || colorRegistry_1.inputBackground,
            inputForeground: (style && style.inputForeground) || colorRegistry_1.inputForeground,
            inputBorder: (style && style.inputBorder) || colorRegistry_1.inputBorder,
            inputActiveOptionBorder: (style && style.inputActiveOptionBorder) || colorRegistry_1.inputActiveOptionBorder,
            inputActiveOptionForeground: (style && style.inputActiveOptionForeground) || colorRegistry_1.inputActiveOptionForeground,
            inputActiveOptionBackground: (style && style.inputActiveOptionBackground) || colorRegistry_1.inputActiveOptionBackground,
            inputValidationInfoBorder: (style && style.inputValidationInfoBorder) || colorRegistry_1.inputValidationInfoBorder,
            inputValidationInfoBackground: (style && style.inputValidationInfoBackground) || colorRegistry_1.inputValidationInfoBackground,
            inputValidationInfoForeground: (style && style.inputValidationInfoForeground) || colorRegistry_1.inputValidationInfoForeground,
            inputValidationWarningBorder: (style && style.inputValidationWarningBorder) || colorRegistry_1.inputValidationWarningBorder,
            inputValidationWarningBackground: (style && style.inputValidationWarningBackground) || colorRegistry_1.inputValidationWarningBackground,
            inputValidationWarningForeground: (style && style.inputValidationWarningForeground) || colorRegistry_1.inputValidationWarningForeground,
            inputValidationErrorBorder: (style && style.inputValidationErrorBorder) || colorRegistry_1.inputValidationErrorBorder,
            inputValidationErrorBackground: (style && style.inputValidationErrorBackground) || colorRegistry_1.inputValidationErrorBackground,
            inputValidationErrorForeground: (style && style.inputValidationErrorForeground) || colorRegistry_1.inputValidationErrorForeground
        }, widget);
    }
    exports.attachFindReplaceInputBoxStyler = attachFindReplaceInputBoxStyler;
    function attachQuickInputStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            foreground: (style && style.foreground) || colorRegistry_1.foreground,
            background: (style && style.background) || colorRegistry_1.editorBackground,
            borderColor: style && style.borderColor || colorRegistry_1.contrastBorder,
            widgetShadow: style && style.widgetShadow || colorRegistry_1.widgetShadow,
            progressBarBackground: style && style.progressBarBackground || colorRegistry_1.progressBarBackground,
            pickerGroupForeground: style && style.pickerGroupForeground || colorRegistry_1.pickerGroupForeground,
            pickerGroupBorder: style && style.pickerGroupBorder || colorRegistry_1.pickerGroupBorder,
            inputBackground: (style && style.inputBackground) || colorRegistry_1.inputBackground,
            inputForeground: (style && style.inputForeground) || colorRegistry_1.inputForeground,
            inputBorder: (style && style.inputBorder) || colorRegistry_1.inputBorder,
            inputValidationInfoBorder: (style && style.inputValidationInfoBorder) || colorRegistry_1.inputValidationInfoBorder,
            inputValidationInfoBackground: (style && style.inputValidationInfoBackground) || colorRegistry_1.inputValidationInfoBackground,
            inputValidationInfoForeground: (style && style.inputValidationInfoForeground) || colorRegistry_1.inputValidationInfoForeground,
            inputValidationWarningBorder: (style && style.inputValidationWarningBorder) || colorRegistry_1.inputValidationWarningBorder,
            inputValidationWarningBackground: (style && style.inputValidationWarningBackground) || colorRegistry_1.inputValidationWarningBackground,
            inputValidationWarningForeground: (style && style.inputValidationWarningForeground) || colorRegistry_1.inputValidationWarningForeground,
            inputValidationErrorBorder: (style && style.inputValidationErrorBorder) || colorRegistry_1.inputValidationErrorBorder,
            inputValidationErrorBackground: (style && style.inputValidationErrorBackground) || colorRegistry_1.inputValidationErrorBackground,
            inputValidationErrorForeground: (style && style.inputValidationErrorForeground) || colorRegistry_1.inputValidationErrorForeground,
            listFocusBackground: (style && style.listFocusBackground) || colorRegistry_1.listFocusBackground,
            listFocusForeground: (style && style.listFocusForeground) || colorRegistry_1.listFocusForeground,
            listActiveSelectionBackground: (style && style.listActiveSelectionBackground) || colorRegistry_1.darken(colorRegistry_1.listActiveSelectionBackground, 0.1),
            listActiveSelectionForeground: (style && style.listActiveSelectionForeground) || colorRegistry_1.listActiveSelectionForeground,
            listFocusAndSelectionBackground: style && style.listFocusAndSelectionBackground || colorRegistry_1.listActiveSelectionBackground,
            listFocusAndSelectionForeground: (style && style.listFocusAndSelectionForeground) || colorRegistry_1.listActiveSelectionForeground,
            listInactiveSelectionBackground: (style && style.listInactiveSelectionBackground) || colorRegistry_1.listInactiveSelectionBackground,
            listInactiveSelectionForeground: (style && style.listInactiveSelectionForeground) || colorRegistry_1.listInactiveSelectionForeground,
            listInactiveFocusBackground: (style && style.listInactiveFocusBackground) || colorRegistry_1.listInactiveFocusBackground,
            listHoverBackground: (style && style.listHoverBackground) || colorRegistry_1.listHoverBackground,
            listHoverForeground: (style && style.listHoverForeground) || colorRegistry_1.listHoverForeground,
            listDropBackground: (style && style.listDropBackground) || colorRegistry_1.listDropBackground,
            listFocusOutline: (style && style.listFocusOutline) || colorRegistry_1.activeContrastBorder,
            listSelectionOutline: (style && style.listSelectionOutline) || colorRegistry_1.activeContrastBorder,
            listHoverOutline: (style && style.listHoverOutline) || colorRegistry_1.activeContrastBorder
        }, widget);
    }
    exports.attachQuickInputStyler = attachQuickInputStyler;
    function attachListStyler(widget, themeService, overrides) {
        return attachStyler(themeService, Object.assign(Object.assign({}, exports.defaultListStyles), (overrides || {})), widget);
    }
    exports.attachListStyler = attachListStyler;
    exports.defaultListStyles = {
        listFocusBackground: colorRegistry_1.listFocusBackground,
        listFocusForeground: colorRegistry_1.listFocusForeground,
        listActiveSelectionBackground: colorRegistry_1.darken(colorRegistry_1.listActiveSelectionBackground, 0.1),
        listActiveSelectionForeground: colorRegistry_1.listActiveSelectionForeground,
        listFocusAndSelectionBackground: colorRegistry_1.listActiveSelectionBackground,
        listFocusAndSelectionForeground: colorRegistry_1.listActiveSelectionForeground,
        listInactiveSelectionBackground: colorRegistry_1.listInactiveSelectionBackground,
        listInactiveSelectionForeground: colorRegistry_1.listInactiveSelectionForeground,
        listInactiveFocusBackground: colorRegistry_1.listInactiveFocusBackground,
        listHoverBackground: colorRegistry_1.listHoverBackground,
        listHoverForeground: colorRegistry_1.listHoverForeground,
        listDropBackground: colorRegistry_1.listDropBackground,
        listFocusOutline: colorRegistry_1.activeContrastBorder,
        listSelectionOutline: colorRegistry_1.activeContrastBorder,
        listHoverOutline: colorRegistry_1.activeContrastBorder,
        listFilterWidgetBackground: colorRegistry_1.listFilterWidgetBackground,
        listFilterWidgetOutline: colorRegistry_1.listFilterWidgetOutline,
        listFilterWidgetNoMatchesOutline: colorRegistry_1.listFilterWidgetNoMatchesOutline,
        listMatchesShadow: colorRegistry_1.widgetShadow,
        treeIndentGuidesStroke: colorRegistry_1.treeIndentGuidesStroke
    };
    function attachButtonStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            buttonForeground: (style && style.buttonForeground) || colorRegistry_1.buttonForeground,
            buttonBackground: (style && style.buttonBackground) || colorRegistry_1.buttonBackground,
            buttonHoverBackground: (style && style.buttonHoverBackground) || colorRegistry_1.buttonHoverBackground,
            buttonSecondaryForeground: (style && style.buttonSecondaryForeground) || colorRegistry_1.buttonSecondaryForeground,
            buttonSecondaryBackground: (style && style.buttonSecondaryBackground) || colorRegistry_1.buttonSecondaryBackground,
            buttonSecondaryHoverBackground: (style && style.buttonSecondaryHoverBackground) || colorRegistry_1.buttonSecondaryHoverBackground,
            buttonBorder: colorRegistry_1.contrastBorder
        }, widget);
    }
    exports.attachButtonStyler = attachButtonStyler;
    function attachLinkStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            textLinkForeground: (style && style.textLinkForeground) || colorRegistry_1.textLinkForeground,
        }, widget);
    }
    exports.attachLinkStyler = attachLinkStyler;
    function attachProgressBarStyler(widget, themeService, style) {
        return attachStyler(themeService, {
            progressBarBackground: (style && style.progressBarBackground) || colorRegistry_1.progressBarBackground
        }, widget);
    }
    exports.attachProgressBarStyler = attachProgressBarStyler;
    function attachStylerCallback(themeService, colors, callback) {
        return attachStyler(themeService, colors, callback);
    }
    exports.attachStylerCallback = attachStylerCallback;
    exports.defaultBreadcrumbsStyles = {
        breadcrumbsBackground: colorRegistry_1.breadcrumbsBackground,
        breadcrumbsForeground: colorRegistry_1.breadcrumbsForeground,
        breadcrumbsHoverForeground: colorRegistry_1.breadcrumbsFocusForeground,
        breadcrumbsFocusForeground: colorRegistry_1.breadcrumbsFocusForeground,
        breadcrumbsFocusAndSelectionForeground: colorRegistry_1.breadcrumbsActiveSelectionForeground,
    };
    function attachBreadcrumbsStyler(widget, themeService, style) {
        return attachStyler(themeService, Object.assign(Object.assign({}, exports.defaultBreadcrumbsStyles), style), widget);
    }
    exports.attachBreadcrumbsStyler = attachBreadcrumbsStyler;
    exports.defaultMenuStyles = {
        shadowColor: colorRegistry_1.widgetShadow,
        borderColor: colorRegistry_1.menuBorder,
        foregroundColor: colorRegistry_1.menuForeground,
        backgroundColor: colorRegistry_1.menuBackground,
        selectionForegroundColor: colorRegistry_1.menuSelectionForeground,
        selectionBackgroundColor: colorRegistry_1.menuSelectionBackground,
        selectionBorderColor: colorRegistry_1.menuSelectionBorder,
        separatorColor: colorRegistry_1.menuSeparatorBackground
    };
    function attachMenuStyler(widget, themeService, style) {
        return attachStyler(themeService, Object.assign(Object.assign({}, exports.defaultMenuStyles), style), widget);
    }
    exports.attachMenuStyler = attachMenuStyler;
    exports.defaultDialogStyles = {
        dialogBackground: colorRegistry_1.editorWidgetBackground,
        dialogForeground: colorRegistry_1.editorWidgetForeground,
        dialogShadow: colorRegistry_1.widgetShadow,
        dialogBorder: colorRegistry_1.contrastBorder,
        buttonForeground: colorRegistry_1.buttonForeground,
        buttonBackground: colorRegistry_1.buttonBackground,
        buttonHoverBackground: colorRegistry_1.buttonHoverBackground,
        buttonBorder: colorRegistry_1.contrastBorder,
        checkboxBorder: colorRegistry_1.simpleCheckboxBorder,
        checkboxBackground: colorRegistry_1.simpleCheckboxBackground,
        checkboxForeground: colorRegistry_1.simpleCheckboxForeground,
        errorIconForeground: colorRegistry_1.problemsErrorIconForeground,
        warningIconForeground: colorRegistry_1.problemsWarningIconForeground,
        infoIconForeground: colorRegistry_1.problemsInfoIconForeground
    };
    function attachDialogStyler(widget, themeService, style) {
        return attachStyler(themeService, Object.assign(Object.assign({}, exports.defaultDialogStyles), style), widget);
    }
    exports.attachDialogStyler = attachDialogStyler;
});
//# __sourceMappingURL=styler.js.map