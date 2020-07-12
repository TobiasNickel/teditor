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
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorService", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/base/common/actions"], function (require, exports, nls, editorExtensions_1, keybinding_1, editorService_1, platform_1, actions_1, actions_2, actions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InspectKeyMap extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.inspectKeyMappings',
                label: nls.localize('workbench.action.inspectKeyMap', "Developer: Inspect Key Mappings"),
                alias: 'Developer: Inspect Key Mappings',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ contents: keybindingService._dumpDebugInfo(), options: { pinned: true } });
        }
    }
    editorExtensions_1.registerEditorAction(InspectKeyMap);
    let InspectKeyMapJSON = class InspectKeyMapJSON extends actions_3.Action {
        constructor(id, label, _keybindingService, _editorService) {
            super(id, label);
            this._keybindingService = _keybindingService;
            this._editorService = _editorService;
        }
        run() {
            return this._editorService.openEditor({ contents: this._keybindingService._dumpDebugInfoJSON(), options: { pinned: true } });
        }
    };
    InspectKeyMapJSON.ID = 'workbench.action.inspectKeyMappingsJSON';
    InspectKeyMapJSON.LABEL = nls.localize('workbench.action.inspectKeyMapJSON', "Inspect Key Mappings (JSON)");
    InspectKeyMapJSON = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, editorService_1.IEditorService)
    ], InspectKeyMapJSON);
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(InspectKeyMapJSON), 'Developer: Inspect Key Mappings (JSON)', nls.localize('developer', "Developer"));
});
//# __sourceMappingURL=inspectKeybindings.js.map