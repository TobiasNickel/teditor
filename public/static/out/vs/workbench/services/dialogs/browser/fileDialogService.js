/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/workbench/services/dialogs/browser/abstractFileDialogService", "vs/base/common/network"], function (require, exports, dialogs_1, extensions_1, abstractFileDialogService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDialogService = void 0;
    class FileDialogService extends abstractFileDialogService_1.AbstractFileDialogService {
        async pickFileFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFilePath(schema);
            }
            return this.pickFileFolderAndOpenSimplified(schema, options, false);
        }
        async pickFileAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFilePath(schema);
            }
            return this.pickFileAndOpenSimplified(schema, options, false);
        }
        async pickFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFolderPath(schema);
            }
            return this.pickFolderAndOpenSimplified(schema, options);
        }
        async pickWorkspaceAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultWorkspacePath(schema);
            }
            return this.pickWorkspaceAndOpenSimplified(schema, options);
        }
        async pickFileToSave(defaultUri, availableFileSystems) {
            const schema = this.getFileSystemSchema({ defaultUri, availableFileSystems });
            return this.pickFileToSaveSimplified(schema, this.getPickFileToSaveDialogOptions(defaultUri, availableFileSystems));
        }
        async showSaveDialog(options) {
            const schema = this.getFileSystemSchema(options);
            return this.showSaveDialogSimplified(schema, options);
        }
        async showOpenDialog(options) {
            const schema = this.getFileSystemSchema(options);
            return this.showOpenDialogSimplified(schema, options);
        }
        addFileSchemaIfNeeded(schema) {
            return schema === network_1.Schemas.untitled ? [network_1.Schemas.file] : [schema];
        }
    }
    exports.FileDialogService = FileDialogService;
    extensions_1.registerSingleton(dialogs_1.IFileDialogService, FileDialogService, true);
});
//# __sourceMappingURL=fileDialogService.js.map