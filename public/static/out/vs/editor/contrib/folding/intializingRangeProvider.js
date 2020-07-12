/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/contrib/folding/syntaxRangeProvider"], function (require, exports, syntaxRangeProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InitializingRangeProvider = exports.ID_INIT_PROVIDER = void 0;
    exports.ID_INIT_PROVIDER = 'init';
    class InitializingRangeProvider {
        constructor(editorModel, initialRanges, onTimeout, timeoutTime) {
            this.editorModel = editorModel;
            this.id = exports.ID_INIT_PROVIDER;
            if (initialRanges.length) {
                let toDecorationRange = (range) => {
                    return {
                        range: {
                            startLineNumber: range.startLineNumber,
                            startColumn: 0,
                            endLineNumber: range.endLineNumber,
                            endColumn: editorModel.getLineLength(range.endLineNumber)
                        },
                        options: {
                            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */
                        }
                    };
                };
                this.decorationIds = editorModel.deltaDecorations([], initialRanges.map(toDecorationRange));
                this.timeout = setTimeout(onTimeout, timeoutTime);
            }
        }
        dispose() {
            if (this.decorationIds) {
                this.editorModel.deltaDecorations(this.decorationIds, []);
                this.decorationIds = undefined;
            }
            if (typeof this.timeout === 'number') {
                clearTimeout(this.timeout);
                this.timeout = undefined;
            }
        }
        compute(cancelationToken) {
            let foldingRangeData = [];
            if (this.decorationIds) {
                for (let id of this.decorationIds) {
                    let range = this.editorModel.getDecorationRange(id);
                    if (range) {
                        foldingRangeData.push({ start: range.startLineNumber, end: range.endLineNumber, rank: 1 });
                    }
                }
            }
            return Promise.resolve(syntaxRangeProvider_1.sanitizeRanges(foldingRangeData, Number.MAX_VALUE));
        }
    }
    exports.InitializingRangeProvider = InitializingRangeProvider;
});
//# __sourceMappingURL=intializingRangeProvider.js.map