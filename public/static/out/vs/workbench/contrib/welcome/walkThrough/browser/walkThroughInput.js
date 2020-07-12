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
define(["require", "exports", "vs/base/common/strings", "vs/workbench/common/editor", "vs/editor/common/services/resolverService", "vs/base/common/marked/marked", "vs/base/common/network", "vs/base/common/resources"], function (require, exports, strings, editor_1, resolverService_1, marked, network_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughInput = exports.WalkThroughModel = void 0;
    class WalkThroughModel extends editor_1.EditorModel {
        constructor(mainRef, snippetRefs) {
            super();
            this.mainRef = mainRef;
            this.snippetRefs = snippetRefs;
        }
        get main() {
            return this.mainRef.object;
        }
        get snippets() {
            return this.snippetRefs.map(snippet => snippet.object);
        }
        dispose() {
            this.snippetRefs.forEach(ref => ref.dispose());
            this.mainRef.dispose();
            super.dispose();
        }
    }
    exports.WalkThroughModel = WalkThroughModel;
    let WalkThroughInput = class WalkThroughInput extends editor_1.EditorInput {
        constructor(options, textModelResolverService) {
            super();
            this.options = options;
            this.textModelResolverService = textModelResolverService;
            this.promise = null;
            this.maxTopScroll = 0;
            this.maxBottomScroll = 0;
        }
        get resource() { return this.options.resource; }
        getTypeId() {
            return this.options.typeId;
        }
        getName() {
            return this.options.name;
        }
        getDescription() {
            return this.options.description || '';
        }
        getTelemetryFrom() {
            return this.options.telemetryFrom;
        }
        getTelemetryDescriptor() {
            const descriptor = super.getTelemetryDescriptor();
            descriptor['target'] = this.getTelemetryFrom();
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "target" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return descriptor;
        }
        get onReady() {
            return this.options.onReady;
        }
        resolve() {
            if (!this.promise) {
                this.promise = this.textModelResolverService.createModelReference(this.options.resource)
                    .then(ref => {
                    if (strings.endsWith(this.resource.path, '.html')) {
                        return new WalkThroughModel(ref, []);
                    }
                    const snippets = [];
                    let i = 0;
                    const renderer = new marked.Renderer();
                    renderer.code = (code, lang) => {
                        const resource = this.options.resource.with({ scheme: network_1.Schemas.walkThroughSnippet, fragment: `${i++}.${lang}` });
                        snippets.push(this.textModelResolverService.createModelReference(resource));
                        return '';
                    };
                    const markdown = ref.object.textEditorModel.getValue(1 /* LF */);
                    marked(markdown, { renderer });
                    return Promise.all(snippets)
                        .then(refs => new WalkThroughModel(ref, refs));
                });
            }
            return this.promise;
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            if (otherInput instanceof WalkThroughInput) {
                let otherResourceEditorInput = otherInput;
                // Compare by properties
                return resources_1.isEqual(otherResourceEditorInput.options.resource, this.options.resource);
            }
            return false;
        }
        dispose() {
            if (this.promise) {
                this.promise.then(model => model.dispose());
                this.promise = null;
            }
            super.dispose();
        }
        relativeScrollPosition(topScroll, bottomScroll) {
            this.maxTopScroll = Math.max(this.maxTopScroll, topScroll);
            this.maxBottomScroll = Math.max(this.maxBottomScroll, bottomScroll);
        }
    };
    WalkThroughInput = __decorate([
        __param(1, resolverService_1.ITextModelService)
    ], WalkThroughInput);
    exports.WalkThroughInput = WalkThroughInput;
});
//# __sourceMappingURL=walkThroughInput.js.map