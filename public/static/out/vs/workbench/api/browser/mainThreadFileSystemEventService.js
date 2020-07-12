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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/workbench/services/textfile/common/textfiles", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/workbench/services/workingCopy/common/workingCopyFileService"], function (require, exports, lifecycle_1, files_1, extHostCustomers_1, extHost_protocol_1, textfiles_1, nls_1, configurationRegistry_1, platform_1, workingCopyFileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadFileSystemEventService = void 0;
    let MainThreadFileSystemEventService = class MainThreadFileSystemEventService {
        constructor(extHostContext, fileService, textFileService, workingCopyFileService) {
            this._listener = new lifecycle_1.DisposableStore();
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService);
            // file system events - (changes the editor and other make)
            const events = {
                created: [],
                changed: [],
                deleted: []
            };
            this._listener.add(fileService.onDidFilesChange(event => {
                for (let change of event.changes) {
                    switch (change.type) {
                        case 1 /* ADDED */:
                            events.created.push(change.resource);
                            break;
                        case 0 /* UPDATED */:
                            events.changed.push(change.resource);
                            break;
                        case 2 /* DELETED */:
                            events.deleted.push(change.resource);
                            break;
                    }
                }
                proxy.$onFileEvent(events);
                events.created.length = 0;
                events.changed.length = 0;
                events.deleted.length = 0;
            }));
            // BEFORE file operation
            workingCopyFileService.addFileOperationParticipant({
                participate: (target, source, operation, progress, timeout, token) => {
                    return proxy.$onWillRunFileOperation(operation, target, source, timeout, token);
                }
            });
            // AFTER file operation
            this._listener.add(textFileService.onDidCreateTextFile(e => proxy.$onDidRunFileOperation(0 /* CREATE */, e.resource, undefined)));
            this._listener.add(workingCopyFileService.onDidRunWorkingCopyFileOperation(e => proxy.$onDidRunFileOperation(e.operation, e.target, e.source)));
        }
        dispose() {
            this._listener.dispose();
        }
    };
    MainThreadFileSystemEventService = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, files_1.IFileService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService)
    ], MainThreadFileSystemEventService);
    exports.MainThreadFileSystemEventService = MainThreadFileSystemEventService;
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'files',
        properties: {
            'files.participants.timeout': {
                type: 'number',
                default: 5000,
                markdownDescription: nls_1.localize('files.participants.timeout', "Timeout in milliseconds after which file participants for create, rename, and delete are cancelled. Use `0` to disable participants."),
            }
        }
    });
});
//# __sourceMappingURL=mainThreadFileSystemEventService.js.map