/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/config/charWidthReader", "vs/editor/browser/config/elementSizeObserver", "vs/editor/common/config/commonEditorConfig", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo"], function (require, exports, browser, event_1, lifecycle_1, platform, charWidthReader_1, elementSizeObserver_1, commonEditorConfig_1, editorOptions_1, fontInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Configuration = exports.serializeFontInfo = exports.restoreFontInfo = exports.readFontInfo = exports.clearAllFontInfos = void 0;
    class CSSBasedConfigurationCache {
        constructor() {
            this._keys = Object.create(null);
            this._values = Object.create(null);
        }
        has(item) {
            const itemId = item.getId();
            return !!this._values[itemId];
        }
        get(item) {
            const itemId = item.getId();
            return this._values[itemId];
        }
        put(item, value) {
            const itemId = item.getId();
            this._keys[itemId] = item;
            this._values[itemId] = value;
        }
        remove(item) {
            const itemId = item.getId();
            delete this._keys[itemId];
            delete this._values[itemId];
        }
        getValues() {
            return Object.keys(this._keys).map(id => this._values[id]);
        }
    }
    function clearAllFontInfos() {
        CSSBasedConfiguration.INSTANCE.clearCache();
    }
    exports.clearAllFontInfos = clearAllFontInfos;
    function readFontInfo(bareFontInfo) {
        return CSSBasedConfiguration.INSTANCE.readConfiguration(bareFontInfo);
    }
    exports.readFontInfo = readFontInfo;
    function restoreFontInfo(fontInfo) {
        CSSBasedConfiguration.INSTANCE.restoreFontInfo(fontInfo);
    }
    exports.restoreFontInfo = restoreFontInfo;
    function serializeFontInfo() {
        const fontInfo = CSSBasedConfiguration.INSTANCE.saveFontInfo();
        if (fontInfo.length > 0) {
            return fontInfo;
        }
        return null;
    }
    exports.serializeFontInfo = serializeFontInfo;
    class CSSBasedConfiguration extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._cache = new CSSBasedConfigurationCache();
            this._evictUntrustedReadingsTimeout = -1;
        }
        dispose() {
            if (this._evictUntrustedReadingsTimeout !== -1) {
                clearTimeout(this._evictUntrustedReadingsTimeout);
                this._evictUntrustedReadingsTimeout = -1;
            }
            super.dispose();
        }
        clearCache() {
            this._cache = new CSSBasedConfigurationCache();
            this._onDidChange.fire();
        }
        _writeToCache(item, value) {
            this._cache.put(item, value);
            if (!value.isTrusted && this._evictUntrustedReadingsTimeout === -1) {
                // Try reading again after some time
                this._evictUntrustedReadingsTimeout = setTimeout(() => {
                    this._evictUntrustedReadingsTimeout = -1;
                    this._evictUntrustedReadings();
                }, 5000);
            }
        }
        _evictUntrustedReadings() {
            const values = this._cache.getValues();
            let somethingRemoved = false;
            for (let i = 0, len = values.length; i < len; i++) {
                const item = values[i];
                if (!item.isTrusted) {
                    somethingRemoved = true;
                    this._cache.remove(item);
                }
            }
            if (somethingRemoved) {
                this._onDidChange.fire();
            }
        }
        saveFontInfo() {
            // Only save trusted font info (that has been measured in this running instance)
            return this._cache.getValues().filter(item => item.isTrusted);
        }
        restoreFontInfo(savedFontInfos) {
            // Take all the saved font info and insert them in the cache without the trusted flag.
            // The reason for this is that a font might have been installed on the OS in the meantime.
            for (let i = 0, len = savedFontInfos.length; i < len; i++) {
                const savedFontInfo = savedFontInfos[i];
                // compatibility with older versions of VS Code which did not store this...
                savedFontInfo.fontFeatureSettings = savedFontInfo.fontFeatureSettings || editorOptions_1.EditorFontLigatures.OFF;
                savedFontInfo.middotWidth = savedFontInfo.middotWidth || savedFontInfo.spaceWidth;
                savedFontInfo.wsmiddotWidth = savedFontInfo.wsmiddotWidth || savedFontInfo.spaceWidth;
                const fontInfo = new fontInfo_1.FontInfo(savedFontInfo, false);
                this._writeToCache(fontInfo, fontInfo);
            }
        }
        readConfiguration(bareFontInfo) {
            if (!this._cache.has(bareFontInfo)) {
                let readConfig = CSSBasedConfiguration._actualReadConfiguration(bareFontInfo);
                if (readConfig.typicalHalfwidthCharacterWidth <= 2 || readConfig.typicalFullwidthCharacterWidth <= 2 || readConfig.spaceWidth <= 2 || readConfig.maxDigitWidth <= 2) {
                    // Hey, it's Bug 14341 ... we couldn't read
                    readConfig = new fontInfo_1.FontInfo({
                        zoomLevel: browser.getZoomLevel(),
                        fontFamily: readConfig.fontFamily,
                        fontWeight: readConfig.fontWeight,
                        fontSize: readConfig.fontSize,
                        fontFeatureSettings: readConfig.fontFeatureSettings,
                        lineHeight: readConfig.lineHeight,
                        letterSpacing: readConfig.letterSpacing,
                        isMonospace: readConfig.isMonospace,
                        typicalHalfwidthCharacterWidth: Math.max(readConfig.typicalHalfwidthCharacterWidth, 5),
                        typicalFullwidthCharacterWidth: Math.max(readConfig.typicalFullwidthCharacterWidth, 5),
                        canUseHalfwidthRightwardsArrow: readConfig.canUseHalfwidthRightwardsArrow,
                        spaceWidth: Math.max(readConfig.spaceWidth, 5),
                        middotWidth: Math.max(readConfig.middotWidth, 5),
                        wsmiddotWidth: Math.max(readConfig.wsmiddotWidth, 5),
                        maxDigitWidth: Math.max(readConfig.maxDigitWidth, 5),
                    }, false);
                }
                this._writeToCache(bareFontInfo, readConfig);
            }
            return this._cache.get(bareFontInfo);
        }
        static createRequest(chr, type, all, monospace) {
            const result = new charWidthReader_1.CharWidthRequest(chr, type);
            all.push(result);
            if (monospace) {
                monospace.push(result);
            }
            return result;
        }
        static _actualReadConfiguration(bareFontInfo) {
            const all = [];
            const monospace = [];
            const typicalHalfwidthCharacter = this.createRequest('n', 0 /* Regular */, all, monospace);
            const typicalFullwidthCharacter = this.createRequest('\uff4d', 0 /* Regular */, all, null);
            const space = this.createRequest(' ', 0 /* Regular */, all, monospace);
            const digit0 = this.createRequest('0', 0 /* Regular */, all, monospace);
            const digit1 = this.createRequest('1', 0 /* Regular */, all, monospace);
            const digit2 = this.createRequest('2', 0 /* Regular */, all, monospace);
            const digit3 = this.createRequest('3', 0 /* Regular */, all, monospace);
            const digit4 = this.createRequest('4', 0 /* Regular */, all, monospace);
            const digit5 = this.createRequest('5', 0 /* Regular */, all, monospace);
            const digit6 = this.createRequest('6', 0 /* Regular */, all, monospace);
            const digit7 = this.createRequest('7', 0 /* Regular */, all, monospace);
            const digit8 = this.createRequest('8', 0 /* Regular */, all, monospace);
            const digit9 = this.createRequest('9', 0 /* Regular */, all, monospace);
            // monospace test: used for whitespace rendering
            const rightwardsArrow = this.createRequest('→', 0 /* Regular */, all, monospace);
            const halfwidthRightwardsArrow = this.createRequest('￫', 0 /* Regular */, all, null);
            // U+00B7 - MIDDLE DOT
            const middot = this.createRequest('·', 0 /* Regular */, all, monospace);
            // U+2E31 - WORD SEPARATOR MIDDLE DOT
            const wsmiddotWidth = this.createRequest(String.fromCharCode(0x2E31), 0 /* Regular */, all, null);
            // monospace test: some characters
            this.createRequest('|', 0 /* Regular */, all, monospace);
            this.createRequest('/', 0 /* Regular */, all, monospace);
            this.createRequest('-', 0 /* Regular */, all, monospace);
            this.createRequest('_', 0 /* Regular */, all, monospace);
            this.createRequest('i', 0 /* Regular */, all, monospace);
            this.createRequest('l', 0 /* Regular */, all, monospace);
            this.createRequest('m', 0 /* Regular */, all, monospace);
            // monospace italic test
            this.createRequest('|', 1 /* Italic */, all, monospace);
            this.createRequest('_', 1 /* Italic */, all, monospace);
            this.createRequest('i', 1 /* Italic */, all, monospace);
            this.createRequest('l', 1 /* Italic */, all, monospace);
            this.createRequest('m', 1 /* Italic */, all, monospace);
            this.createRequest('n', 1 /* Italic */, all, monospace);
            // monospace bold test
            this.createRequest('|', 2 /* Bold */, all, monospace);
            this.createRequest('_', 2 /* Bold */, all, monospace);
            this.createRequest('i', 2 /* Bold */, all, monospace);
            this.createRequest('l', 2 /* Bold */, all, monospace);
            this.createRequest('m', 2 /* Bold */, all, monospace);
            this.createRequest('n', 2 /* Bold */, all, monospace);
            charWidthReader_1.readCharWidths(bareFontInfo, all);
            const maxDigitWidth = Math.max(digit0.width, digit1.width, digit2.width, digit3.width, digit4.width, digit5.width, digit6.width, digit7.width, digit8.width, digit9.width);
            let isMonospace = (bareFontInfo.fontFeatureSettings === editorOptions_1.EditorFontLigatures.OFF);
            const referenceWidth = monospace[0].width;
            for (let i = 1, len = monospace.length; isMonospace && i < len; i++) {
                const diff = referenceWidth - monospace[i].width;
                if (diff < -0.001 || diff > 0.001) {
                    isMonospace = false;
                    break;
                }
            }
            let canUseHalfwidthRightwardsArrow = true;
            if (isMonospace && halfwidthRightwardsArrow.width !== referenceWidth) {
                // using a halfwidth rightwards arrow would break monospace...
                canUseHalfwidthRightwardsArrow = false;
            }
            if (halfwidthRightwardsArrow.width > rightwardsArrow.width) {
                // using a halfwidth rightwards arrow would paint a larger arrow than a regular rightwards arrow
                canUseHalfwidthRightwardsArrow = false;
            }
            // let's trust the zoom level only 2s after it was changed.
            const canTrustBrowserZoomLevel = (browser.getTimeSinceLastZoomLevelChanged() > 2000);
            return new fontInfo_1.FontInfo({
                zoomLevel: browser.getZoomLevel(),
                fontFamily: bareFontInfo.fontFamily,
                fontWeight: bareFontInfo.fontWeight,
                fontSize: bareFontInfo.fontSize,
                fontFeatureSettings: bareFontInfo.fontFeatureSettings,
                lineHeight: bareFontInfo.lineHeight,
                letterSpacing: bareFontInfo.letterSpacing,
                isMonospace: isMonospace,
                typicalHalfwidthCharacterWidth: typicalHalfwidthCharacter.width,
                typicalFullwidthCharacterWidth: typicalFullwidthCharacter.width,
                canUseHalfwidthRightwardsArrow: canUseHalfwidthRightwardsArrow,
                spaceWidth: space.width,
                middotWidth: middot.width,
                wsmiddotWidth: wsmiddotWidth.width,
                maxDigitWidth: maxDigitWidth
            }, canTrustBrowserZoomLevel);
        }
    }
    CSSBasedConfiguration.INSTANCE = new CSSBasedConfiguration();
    class Configuration extends commonEditorConfig_1.CommonEditorConfiguration {
        constructor(isSimpleWidget, options, referenceDomElement = null, accessibilityService) {
            super(isSimpleWidget, options);
            this.accessibilityService = accessibilityService;
            this._elementSizeObserver = this._register(new elementSizeObserver_1.ElementSizeObserver(referenceDomElement, options.dimension, () => this._onReferenceDomElementSizeChanged()));
            this._register(CSSBasedConfiguration.INSTANCE.onDidChange(() => this._onCSSBasedConfigurationChanged()));
            if (this._validatedOptions.get(9 /* automaticLayout */)) {
                this._elementSizeObserver.startObserving();
            }
            this._register(browser.onDidChangeZoomLevel(_ => this._recomputeOptions()));
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => this._recomputeOptions()));
            this._recomputeOptions();
        }
        static applyFontInfoSlow(domNode, fontInfo) {
            domNode.style.fontFamily = fontInfo.getMassagedFontFamily();
            domNode.style.fontWeight = fontInfo.fontWeight;
            domNode.style.fontSize = fontInfo.fontSize + 'px';
            domNode.style.fontFeatureSettings = fontInfo.fontFeatureSettings;
            domNode.style.lineHeight = fontInfo.lineHeight + 'px';
            domNode.style.letterSpacing = fontInfo.letterSpacing + 'px';
        }
        static applyFontInfo(domNode, fontInfo) {
            domNode.setFontFamily(fontInfo.getMassagedFontFamily());
            domNode.setFontWeight(fontInfo.fontWeight);
            domNode.setFontSize(fontInfo.fontSize);
            domNode.setFontFeatureSettings(fontInfo.fontFeatureSettings);
            domNode.setLineHeight(fontInfo.lineHeight);
            domNode.setLetterSpacing(fontInfo.letterSpacing);
        }
        _onReferenceDomElementSizeChanged() {
            this._recomputeOptions();
        }
        _onCSSBasedConfigurationChanged() {
            this._recomputeOptions();
        }
        observeReferenceElement(dimension) {
            this._elementSizeObserver.observe(dimension);
        }
        dispose() {
            super.dispose();
        }
        _getExtraEditorClassName() {
            let extra = '';
            if (!browser.isSafari && !browser.isWebkitWebView) {
                // Use user-select: none in all browsers except Safari and native macOS WebView
                extra += 'no-user-select ';
            }
            if (platform.isMacintosh) {
                extra += 'mac ';
            }
            return extra;
        }
        _getEnvConfiguration() {
            return {
                extraEditorClassName: this._getExtraEditorClassName(),
                outerWidth: this._elementSizeObserver.getWidth(),
                outerHeight: this._elementSizeObserver.getHeight(),
                emptySelectionClipboard: browser.isWebKit || browser.isFirefox,
                pixelRatio: browser.getPixelRatio(),
                zoomLevel: browser.getZoomLevel(),
                accessibilitySupport: (this.accessibilityService.isScreenReaderOptimized()
                    ? 2 /* Enabled */
                    : this.accessibilityService.getAccessibilitySupport())
            };
        }
        readConfiguration(bareFontInfo) {
            return CSSBasedConfiguration.INSTANCE.readConfiguration(bareFontInfo);
        }
    }
    exports.Configuration = Configuration;
});
//# __sourceMappingURL=configuration.js.map