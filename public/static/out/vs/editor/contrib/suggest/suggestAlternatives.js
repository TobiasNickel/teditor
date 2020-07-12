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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey"], function (require, exports, lifecycle_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestAlternatives = void 0;
    let SuggestAlternatives = class SuggestAlternatives {
        constructor(_editor, contextKeyService) {
            this._editor = _editor;
            this._index = 0;
            this._ckOtherSuggestions = SuggestAlternatives.OtherSuggestions.bindTo(contextKeyService);
        }
        dispose() {
            this.reset();
        }
        reset() {
            this._ckOtherSuggestions.reset();
            lifecycle_1.dispose(this._listener);
            this._model = undefined;
            this._acceptNext = undefined;
            this._ignore = false;
        }
        set({ model, index }, acceptNext) {
            // no suggestions -> nothing to do
            if (model.items.length === 0) {
                this.reset();
                return;
            }
            // no alternative suggestions -> nothing to do
            let nextIndex = SuggestAlternatives._moveIndex(true, model, index);
            if (nextIndex === index) {
                this.reset();
                return;
            }
            this._acceptNext = acceptNext;
            this._model = model;
            this._index = index;
            this._listener = this._editor.onDidChangeCursorPosition(() => {
                if (!this._ignore) {
                    this.reset();
                }
            });
            this._ckOtherSuggestions.set(true);
        }
        static _moveIndex(fwd, model, index) {
            let newIndex = index;
            while (true) {
                newIndex = (newIndex + model.items.length + (fwd ? +1 : -1)) % model.items.length;
                if (newIndex === index) {
                    break;
                }
                if (!model.items[newIndex].completion.additionalTextEdits) {
                    break;
                }
            }
            return newIndex;
        }
        next() {
            this._move(true);
        }
        prev() {
            this._move(false);
        }
        _move(fwd) {
            if (!this._model) {
                // nothing to reason about
                return;
            }
            try {
                this._ignore = true;
                this._index = SuggestAlternatives._moveIndex(fwd, this._model, this._index);
                this._acceptNext({ index: this._index, item: this._model.items[this._index], model: this._model });
            }
            finally {
                this._ignore = false;
            }
        }
    };
    SuggestAlternatives.OtherSuggestions = new contextkey_1.RawContextKey('hasOtherSuggestions', false);
    SuggestAlternatives = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], SuggestAlternatives);
    exports.SuggestAlternatives = SuggestAlternatives;
});
//# __sourceMappingURL=suggestAlternatives.js.map