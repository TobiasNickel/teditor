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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfigurationService", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/platform/theme/common/themeService", "vs/workbench/common/editor/resourceEditorInput", "vs/base/common/uri", "vs/editor/common/services/resolverService", "vs/workbench/contrib/output/common/output", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, nls_1, path_1, telemetry_1, storage_1, textResourceConfigurationService_1, instantiation_1, textResourceEditor_1, themeService_1, resourceEditorInput_1, uri_1, resolverService_1, output_1, editorGroupsService_1, editorService_1, textfiles_1, files_1, label_1, filesConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogViewer = exports.LogViewerInput = void 0;
    let LogViewerInput = class LogViewerInput extends resourceEditorInput_1.ResourceEditorInput {
        constructor(outputChannelDescriptor, textModelResolverService, textFileService, editorService, editorGroupService, fileService, labelService, filesConfigurationService) {
            super(uri_1.URI.from({ scheme: output_1.LOG_SCHEME, path: outputChannelDescriptor.id }), path_1.basename(outputChannelDescriptor.file.path), path_1.dirname(outputChannelDescriptor.file.path), undefined, textModelResolverService, textFileService, editorService, editorGroupService, fileService, labelService, filesConfigurationService);
        }
        getTypeId() {
            return LogViewerInput.ID;
        }
    };
    LogViewerInput.ID = 'workbench.editorinputs.output';
    LogViewerInput = __decorate([
        __param(1, resolverService_1.ITextModelService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, editorService_1.IEditorService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, files_1.IFileService),
        __param(6, label_1.ILabelService),
        __param(7, filesConfigurationService_1.IFilesConfigurationService)
    ], LogViewerInput);
    exports.LogViewerInput = LogViewerInput;
    let LogViewer = class LogViewer extends textResourceEditor_1.AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService) {
            super(LogViewer.LOG_VIEWER_EDITOR_ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService);
        }
        getConfigurationOverrides() {
            const options = super.getConfigurationOverrides();
            options.wordWrap = 'off'; // all log viewers do not wrap
            options.folding = false;
            options.scrollBeyondLastLine = false;
            options.renderValidationDecorations = 'editable';
            return options;
        }
        getAriaLabel() {
            return nls_1.localize('logViewerAriaLabel', "Log viewer");
        }
    };
    LogViewer.LOG_VIEWER_EDITOR_ID = 'workbench.editors.logViewer';
    LogViewer = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, editorService_1.IEditorService)
    ], LogViewer);
    exports.LogViewer = LogViewer;
});
//# __sourceMappingURL=logViewer.js.map