/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/editor/common/config/editorOptions", "vs/editor/common/config/editorZoom"], function (require, exports, platform, editorOptions_1, editorZoom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FontInfo = exports.BareFontInfo = void 0;
    /**
     * Determined from empirical observations.
     * @internal
     */
    const GOLDEN_LINE_HEIGHT_RATIO = platform.isMacintosh ? 1.5 : 1.35;
    /**
     * @internal
     */
    const MINIMUM_LINE_HEIGHT = 8;
    class BareFontInfo {
        /**
         * @internal
         */
        constructor(opts) {
            this.zoomLevel = opts.zoomLevel;
            this.fontFamily = String(opts.fontFamily);
            this.fontWeight = String(opts.fontWeight);
            this.fontSize = opts.fontSize;
            this.fontFeatureSettings = opts.fontFeatureSettings;
            this.lineHeight = opts.lineHeight | 0;
            this.letterSpacing = opts.letterSpacing;
        }
        /**
         * @internal
         */
        static createFromValidatedSettings(options, zoomLevel, ignoreEditorZoom) {
            const fontFamily = options.get(35 /* fontFamily */);
            const fontWeight = options.get(39 /* fontWeight */);
            const fontSize = options.get(38 /* fontSize */);
            const fontFeatureSettings = options.get(37 /* fontLigatures */);
            const lineHeight = options.get(51 /* lineHeight */);
            const letterSpacing = options.get(48 /* letterSpacing */);
            return BareFontInfo._create(fontFamily, fontWeight, fontSize, fontFeatureSettings, lineHeight, letterSpacing, zoomLevel, ignoreEditorZoom);
        }
        /**
         * @internal
         */
        static createFromRawSettings(opts, zoomLevel, ignoreEditorZoom = false) {
            const fontFamily = editorOptions_1.EditorOptions.fontFamily.validate(opts.fontFamily);
            const fontWeight = editorOptions_1.EditorOptions.fontWeight.validate(opts.fontWeight);
            const fontSize = editorOptions_1.EditorOptions.fontSize.validate(opts.fontSize);
            const fontFeatureSettings = editorOptions_1.EditorOptions.fontLigatures2.validate(opts.fontLigatures);
            const lineHeight = editorOptions_1.EditorOptions.lineHeight.validate(opts.lineHeight);
            const letterSpacing = editorOptions_1.EditorOptions.letterSpacing.validate(opts.letterSpacing);
            return BareFontInfo._create(fontFamily, fontWeight, fontSize, fontFeatureSettings, lineHeight, letterSpacing, zoomLevel, ignoreEditorZoom);
        }
        /**
         * @internal
         */
        static _create(fontFamily, fontWeight, fontSize, fontFeatureSettings, lineHeight, letterSpacing, zoomLevel, ignoreEditorZoom) {
            if (lineHeight === 0) {
                lineHeight = Math.round(GOLDEN_LINE_HEIGHT_RATIO * fontSize);
            }
            else if (lineHeight < MINIMUM_LINE_HEIGHT) {
                lineHeight = MINIMUM_LINE_HEIGHT;
            }
            const editorZoomLevelMultiplier = 1 + (ignoreEditorZoom ? 0 : editorZoom_1.EditorZoom.getZoomLevel() * 0.1);
            fontSize *= editorZoomLevelMultiplier;
            lineHeight *= editorZoomLevelMultiplier;
            return new BareFontInfo({
                zoomLevel: zoomLevel,
                fontFamily: fontFamily,
                fontWeight: fontWeight,
                fontSize: fontSize,
                fontFeatureSettings: fontFeatureSettings,
                lineHeight: lineHeight,
                letterSpacing: letterSpacing
            });
        }
        /**
         * @internal
         */
        getId() {
            return this.zoomLevel + '-' + this.fontFamily + '-' + this.fontWeight + '-' + this.fontSize + '-' + this.fontFeatureSettings + '-' + this.lineHeight + '-' + this.letterSpacing;
        }
        /**
         * @internal
         */
        getMassagedFontFamily() {
            if (/[,"']/.test(this.fontFamily)) {
                // Looks like the font family might be already escaped
                return this.fontFamily;
            }
            if (/[+ ]/.test(this.fontFamily)) {
                // Wrap a font family using + or <space> with quotes
                return `"${this.fontFamily}"`;
            }
            return this.fontFamily;
        }
    }
    exports.BareFontInfo = BareFontInfo;
    class FontInfo extends BareFontInfo {
        /**
         * @internal
         */
        constructor(opts, isTrusted) {
            super(opts);
            this.isTrusted = isTrusted;
            this.isMonospace = opts.isMonospace;
            this.typicalHalfwidthCharacterWidth = opts.typicalHalfwidthCharacterWidth;
            this.typicalFullwidthCharacterWidth = opts.typicalFullwidthCharacterWidth;
            this.canUseHalfwidthRightwardsArrow = opts.canUseHalfwidthRightwardsArrow;
            this.spaceWidth = opts.spaceWidth;
            this.middotWidth = opts.middotWidth;
            this.wsmiddotWidth = opts.wsmiddotWidth;
            this.maxDigitWidth = opts.maxDigitWidth;
        }
        /**
         * @internal
         */
        equals(other) {
            return (this.fontFamily === other.fontFamily
                && this.fontWeight === other.fontWeight
                && this.fontSize === other.fontSize
                && this.fontFeatureSettings === other.fontFeatureSettings
                && this.lineHeight === other.lineHeight
                && this.letterSpacing === other.letterSpacing
                && this.typicalHalfwidthCharacterWidth === other.typicalHalfwidthCharacterWidth
                && this.typicalFullwidthCharacterWidth === other.typicalFullwidthCharacterWidth
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.spaceWidth === other.spaceWidth
                && this.middotWidth === other.middotWidth
                && this.wsmiddotWidth === other.wsmiddotWidth
                && this.maxDigitWidth === other.maxDigitWidth);
        }
    }
    exports.FontInfo = FontInfo;
});
//# __sourceMappingURL=fontInfo.js.map