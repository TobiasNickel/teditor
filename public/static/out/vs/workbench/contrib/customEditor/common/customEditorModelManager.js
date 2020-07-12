/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/functional"], function (require, exports, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorModelManager = void 0;
    class CustomEditorModelManager {
        constructor() {
            this._references = new Map();
        }
        async get(resource, viewType) {
            const key = this.key(resource, viewType);
            const entry = this._references.get(key);
            return entry === null || entry === void 0 ? void 0 : entry.model;
        }
        tryRetain(resource, viewType) {
            const key = this.key(resource, viewType);
            const entry = this._references.get(key);
            if (!entry) {
                return undefined;
            }
            entry.counter++;
            return entry.model.then(model => {
                return {
                    object: model,
                    dispose: functional_1.once(() => {
                        if (--entry.counter <= 0) {
                            entry.model.then(x => x.dispose());
                            this._references.delete(key);
                        }
                    }),
                };
            });
        }
        add(resource, viewType, model) {
            const key = this.key(resource, viewType);
            const existing = this._references.get(key);
            if (existing) {
                throw new Error('Model already exists');
            }
            this._references.set(key, { viewType, model, counter: 0 });
            return this.tryRetain(resource, viewType);
        }
        disposeAllModelsForView(viewType) {
            for (const [key, value] of this._references) {
                if (value.viewType === viewType) {
                    value.model.then(x => x.dispose());
                    this._references.delete(key);
                }
            }
        }
        key(resource, viewType) {
            return `${resource.toString()}@@@${viewType}`;
        }
    }
    exports.CustomEditorModelManager = CustomEditorModelManager;
});
//# __sourceMappingURL=customEditorModelManager.js.map