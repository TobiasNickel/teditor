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
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/colorRegistry", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/views/explorerViewer"], function (require, exports, event_1, nls_1, workspace_1, colorRegistry_1, lifecycle_1, files_1, explorerViewer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerDecorationsProvider = exports.provideDecorations = void 0;
    function provideDecorations(fileStat) {
        if (fileStat.isRoot && fileStat.isError) {
            return {
                tooltip: nls_1.localize('canNotResolve', "Unable to resolve workspace folder"),
                letter: '!',
                color: colorRegistry_1.listInvalidItemForeground,
            };
        }
        if (fileStat.isSymbolicLink) {
            return {
                tooltip: nls_1.localize('symbolicLlink', "Symbolic Link"),
                letter: '\u2937'
            };
        }
        if (fileStat.isUnknown) {
            return {
                tooltip: nls_1.localize('unknown', "Unknown File Type"),
                letter: '?'
            };
        }
        if (fileStat.isExcluded) {
            return {
                color: colorRegistry_1.listDeemphasizedForeground,
            };
        }
        return undefined;
    }
    exports.provideDecorations = provideDecorations;
    let ExplorerDecorationsProvider = class ExplorerDecorationsProvider {
        constructor(explorerService, contextService) {
            this.explorerService = explorerService;
            this.label = nls_1.localize('label', "Explorer");
            this._onDidChange = new event_1.Emitter();
            this.toDispose = new lifecycle_1.DisposableStore();
            this.toDispose.add(this._onDidChange);
            this.toDispose.add(contextService.onDidChangeWorkspaceFolders(e => {
                this._onDidChange.fire(e.changed.concat(e.added).map(wf => wf.uri));
            }));
            this.toDispose.add(explorerViewer_1.explorerRootErrorEmitter.event((resource => {
                this._onDidChange.fire([resource]);
            })));
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        provideDecorations(resource) {
            const fileStat = this.explorerService.findClosest(resource);
            if (!fileStat) {
                return undefined;
            }
            return provideDecorations(fileStat);
        }
        dispose() {
            this.toDispose.dispose();
        }
    };
    ExplorerDecorationsProvider = __decorate([
        __param(0, files_1.IExplorerService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], ExplorerDecorationsProvider);
    exports.ExplorerDecorationsProvider = ExplorerDecorationsProvider;
});
//# __sourceMappingURL=explorerDecorationsProvider.js.map