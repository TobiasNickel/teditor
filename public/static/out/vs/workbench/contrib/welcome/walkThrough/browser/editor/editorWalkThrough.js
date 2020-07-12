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
define(["require", "exports", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/base/common/actions", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/contrib/welcome/walkThrough/browser/walkThroughInput", "vs/base/common/network", "vs/workbench/contrib/welcome/walkThrough/browser/editor/vs_code_editor_walkthrough"], function (require, exports, nls_1, editorService_1, actions_1, instantiation_1, uri_1, walkThroughInput_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorWalkThroughInputFactory = exports.EditorWalkThroughAction = void 0;
    const typeId = 'workbench.editors.walkThroughInput';
    const inputOptions = {
        typeId,
        name: nls_1.localize('editorWalkThrough.title', "Interactive Playground"),
        resource: uri_1.URI.parse(require.toUrl('./vs_code_editor_walkthrough.md'))
            .with({
            scheme: network_1.Schemas.walkThrough,
            query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcome/walkThrough/browser/editor/vs_code_editor_walkthrough' })
        }),
        telemetryFrom: 'walkThrough'
    };
    let EditorWalkThroughAction = class EditorWalkThroughAction extends actions_1.Action {
        constructor(id, label, editorService, instantiationService) {
            super(id, label);
            this.editorService = editorService;
            this.instantiationService = instantiationService;
        }
        run() {
            const input = this.instantiationService.createInstance(walkThroughInput_1.WalkThroughInput, inputOptions);
            return this.editorService.openEditor(input, { pinned: true })
                .then(() => void (0));
        }
    };
    EditorWalkThroughAction.ID = 'workbench.action.showInteractivePlayground';
    EditorWalkThroughAction.LABEL = nls_1.localize('editorWalkThrough', "Interactive Playground");
    EditorWalkThroughAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService)
    ], EditorWalkThroughAction);
    exports.EditorWalkThroughAction = EditorWalkThroughAction;
    class EditorWalkThroughInputFactory {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return '{}';
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.createInstance(walkThroughInput_1.WalkThroughInput, inputOptions);
        }
    }
    exports.EditorWalkThroughInputFactory = EditorWalkThroughInputFactory;
    EditorWalkThroughInputFactory.ID = typeId;
});
//# __sourceMappingURL=editorWalkThrough.js.map