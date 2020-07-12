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
define(["require", "exports", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/base/common/mime"], function (require, exports, editor_1, files_1, mime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BinaryEditorModel = void 0;
    /**
     * An editor model that just represents a resource that can be loaded.
     */
    let BinaryEditorModel = class BinaryEditorModel extends editor_1.EditorModel {
        constructor(resource, name, fileService) {
            super();
            this.resource = resource;
            this.name = name;
            this.fileService = fileService;
            this.resource = resource;
            this.name = name;
            this.mime = mime_1.MIME_BINARY;
        }
        /**
         * The name of the binary resource.
         */
        getName() {
            return this.name;
        }
        /**
         * The size of the binary resource if known.
         */
        getSize() {
            return this.size;
        }
        /**
         * The mime of the binary resource if known.
         */
        getMime() {
            return this.mime;
        }
        /**
         * The etag of the binary resource if known.
         */
        getETag() {
            return this.etag;
        }
        async load() {
            // Make sure to resolve up to date stat for file resources
            if (this.fileService.canHandleResource(this.resource)) {
                const stat = await this.fileService.resolve(this.resource, { resolveMetadata: true });
                this.etag = stat.etag;
                if (typeof stat.size === 'number') {
                    this.size = stat.size;
                }
            }
            return this;
        }
    };
    BinaryEditorModel = __decorate([
        __param(2, files_1.IFileService)
    ], BinaryEditorModel);
    exports.BinaryEditorModel = BinaryEditorModel;
});
//# __sourceMappingURL=binaryEditorModel.js.map