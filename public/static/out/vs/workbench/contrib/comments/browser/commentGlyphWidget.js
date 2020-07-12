/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/color", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, nls, color_1, model_1, textModel_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentGlyphWidget = exports.overviewRulerCommentingRangeForeground = void 0;
    const overviewRulerDefault = new color_1.Color(new color_1.RGBA(197, 197, 197, 1));
    exports.overviewRulerCommentingRangeForeground = colorRegistry_1.registerColor('editorGutter.commentRangeForeground', { dark: overviewRulerDefault, light: overviewRulerDefault, hc: overviewRulerDefault }, nls.localize('editorGutterCommentRangeForeground', 'Editor gutter decoration color for commenting ranges.'));
    class CommentGlyphWidget {
        constructor(editor, lineNumber) {
            this.commentsDecorations = [];
            this._commentsOptions = this.createDecorationOptions();
            this._editor = editor;
            this.setLineNumber(lineNumber);
        }
        createDecorationOptions() {
            const decorationOptions = {
                isWholeLine: true,
                overviewRuler: {
                    color: themeService_1.themeColorFromId(exports.overviewRulerCommentingRangeForeground),
                    position: model_1.OverviewRulerLane.Center
                },
                linesDecorationsClassName: `comment-range-glyph comment-thread`
            };
            return textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
        }
        setLineNumber(lineNumber) {
            this._lineNumber = lineNumber;
            let commentsDecorations = [{
                    range: {
                        startLineNumber: lineNumber, startColumn: 1,
                        endLineNumber: lineNumber, endColumn: 1
                    },
                    options: this._commentsOptions
                }];
            this.commentsDecorations = this._editor.deltaDecorations(this.commentsDecorations, commentsDecorations);
        }
        getPosition() {
            const range = this._editor.hasModel() && this.commentsDecorations && this.commentsDecorations.length
                ? this._editor.getModel().getDecorationRange(this.commentsDecorations[0])
                : null;
            return {
                position: {
                    lineNumber: range ? range.startLineNumber : this._lineNumber,
                    column: 1
                },
                preference: [0 /* EXACT */]
            };
        }
        dispose() {
            if (this.commentsDecorations) {
                this._editor.deltaDecorations(this.commentsDecorations, []);
            }
        }
    }
    exports.CommentGlyphWidget = CommentGlyphWidget;
});
//# __sourceMappingURL=commentGlyphWidget.js.map