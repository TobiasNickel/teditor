/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Memento = void 0;
    class Memento {
        constructor(id, storageService) {
            this.storageService = storageService;
            this.id = Memento.COMMON_PREFIX + id;
        }
        getMemento(scope) {
            // Scope by Workspace
            if (scope === 1 /* WORKSPACE */) {
                let workspaceMemento = Memento.workspaceMementos.get(this.id);
                if (!workspaceMemento) {
                    workspaceMemento = new ScopedMemento(this.id, scope, this.storageService);
                    Memento.workspaceMementos.set(this.id, workspaceMemento);
                }
                return workspaceMemento.getMemento();
            }
            // Scope Global
            let globalMemento = Memento.globalMementos.get(this.id);
            if (!globalMemento) {
                globalMemento = new ScopedMemento(this.id, scope, this.storageService);
                Memento.globalMementos.set(this.id, globalMemento);
            }
            return globalMemento.getMemento();
        }
        saveMemento() {
            // Workspace
            const workspaceMemento = Memento.workspaceMementos.get(this.id);
            if (workspaceMemento) {
                workspaceMemento.save();
            }
            // Global
            const globalMemento = Memento.globalMementos.get(this.id);
            if (globalMemento) {
                globalMemento.save();
            }
        }
    }
    exports.Memento = Memento;
    Memento.globalMementos = new Map();
    Memento.workspaceMementos = new Map();
    Memento.COMMON_PREFIX = 'memento/';
    class ScopedMemento {
        constructor(id, scope, storageService) {
            this.id = id;
            this.scope = scope;
            this.storageService = storageService;
            this.mementoObj = this.load();
        }
        getMemento() {
            return this.mementoObj;
        }
        load() {
            const memento = this.storageService.get(this.id, this.scope);
            if (memento) {
                return JSON.parse(memento);
            }
            return {};
        }
        save() {
            if (!types_1.isEmptyObject(this.mementoObj)) {
                this.storageService.store(this.id, JSON.stringify(this.mementoObj), this.scope);
            }
            else {
                this.storageService.remove(this.id, this.scope);
            }
        }
    }
});
//# __sourceMappingURL=memento.js.map