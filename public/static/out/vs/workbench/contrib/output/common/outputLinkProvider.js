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
define(["require", "exports", "vs/base/common/async", "vs/editor/common/services/modelService", "vs/editor/common/modes", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/output/common/output", "vs/editor/common/services/webWorker", "vs/base/common/lifecycle"], function (require, exports, async_1, modelService_1, modes_1, workspace_1, output_1, webWorker_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputLinkProvider = void 0;
    let OutputLinkProvider = class OutputLinkProvider {
        constructor(contextService, modelService) {
            this.contextService = contextService;
            this.modelService = modelService;
            this.disposeWorkerScheduler = new async_1.RunOnceScheduler(() => this.disposeWorker(), OutputLinkProvider.DISPOSE_WORKER_TIME);
            this.registerListeners();
            this.updateLinkProviderWorker();
        }
        registerListeners() {
            this.contextService.onDidChangeWorkspaceFolders(() => this.updateLinkProviderWorker());
        }
        updateLinkProviderWorker() {
            // Setup link provider depending on folders being opened or not
            const folders = this.contextService.getWorkspace().folders;
            if (folders.length > 0) {
                if (!this.linkProviderRegistration) {
                    this.linkProviderRegistration = modes_1.LinkProviderRegistry.register([{ language: output_1.OUTPUT_MODE_ID, scheme: '*' }, { language: output_1.LOG_MODE_ID, scheme: '*' }], {
                        provideLinks: async (model) => {
                            const links = await this.provideLinks(model.uri);
                            return links && { links };
                        }
                    });
                }
            }
            else {
                lifecycle_1.dispose(this.linkProviderRegistration);
                this.linkProviderRegistration = undefined;
            }
            // Dispose worker to recreate with folders on next provideLinks request
            this.disposeWorker();
            this.disposeWorkerScheduler.cancel();
        }
        getOrCreateWorker() {
            this.disposeWorkerScheduler.schedule();
            if (!this.worker) {
                const createData = {
                    workspaceFolders: this.contextService.getWorkspace().folders.map(folder => folder.uri.toString())
                };
                this.worker = webWorker_1.createWebWorker(this.modelService, {
                    moduleId: 'vs/workbench/contrib/output/common/outputLinkComputer',
                    createData,
                    label: 'outputLinkComputer'
                });
            }
            return this.worker;
        }
        async provideLinks(modelUri) {
            const linkComputer = await this.getOrCreateWorker().withSyncedResources([modelUri]);
            return linkComputer.computeLinks(modelUri.toString());
        }
        disposeWorker() {
            if (this.worker) {
                this.worker.dispose();
                this.worker = undefined;
            }
        }
    };
    OutputLinkProvider.DISPOSE_WORKER_TIME = 3 * 60 * 1000; // dispose worker after 3 minutes of inactivity
    OutputLinkProvider = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, modelService_1.IModelService)
    ], OutputLinkProvider);
    exports.OutputLinkProvider = OutputLinkProvider;
});
//# __sourceMappingURL=outputLinkProvider.js.map