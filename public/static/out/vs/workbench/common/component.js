/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/memento", "vs/platform/theme/common/themeService"], function (require, exports, memento_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Component = void 0;
    class Component extends themeService_1.Themable {
        constructor(id, themeService, storageService) {
            super(themeService);
            this.id = id;
            this.id = id;
            this.memento = new memento_1.Memento(this.id, storageService);
            this._register(storageService.onWillSaveState(() => {
                // Ask the component to persist state into the memento
                this.saveState();
                // Then save the memento into storage
                this.memento.saveMemento();
            }));
        }
        getId() {
            return this.id;
        }
        getMemento(scope) {
            return this.memento.getMemento(scope);
        }
        saveState() {
            // Subclasses to implement for storing state
        }
    }
    exports.Component = Component;
});
//# __sourceMappingURL=component.js.map