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
define(["require", "exports", "vs/base/common/uri", "vs/platform/storage/common/storage", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, uri_1, storage_1, debugModel_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugStorage = void 0;
    const DEBUG_BREAKPOINTS_KEY = 'debug.breakpoint';
    const DEBUG_FUNCTION_BREAKPOINTS_KEY = 'debug.functionbreakpoint';
    const DEBUG_DATA_BREAKPOINTS_KEY = 'debug.databreakpoint';
    const DEBUG_EXCEPTION_BREAKPOINTS_KEY = 'debug.exceptionbreakpoint';
    const DEBUG_WATCH_EXPRESSIONS_KEY = 'debug.watchexpressions';
    let DebugStorage = class DebugStorage {
        constructor(storageService, textFileService) {
            this.storageService = storageService;
            this.textFileService = textFileService;
        }
        loadBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((breakpoint) => {
                    return new debugModel_1.Breakpoint(uri_1.URI.parse(breakpoint.uri.external || breakpoint.source.uri.external), breakpoint.lineNumber, breakpoint.column, breakpoint.enabled, breakpoint.condition, breakpoint.hitCondition, breakpoint.logMessage, breakpoint.adapterData, this.textFileService);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadFunctionBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_FUNCTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((fb) => {
                    return new debugModel_1.FunctionBreakpoint(fb.name, fb.enabled, fb.hitCondition, fb.condition, fb.logMessage);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadExceptionBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_EXCEPTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((exBreakpoint) => {
                    return new debugModel_1.ExceptionBreakpoint(exBreakpoint.filter, exBreakpoint.label, exBreakpoint.enabled);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadDataBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_DATA_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((dbp) => {
                    return new debugModel_1.DataBreakpoint(dbp.description, dbp.dataId, true, dbp.enabled, dbp.hitCondition, dbp.condition, dbp.logMessage, dbp.accessTypes);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadWatchExpressions() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_WATCH_EXPRESSIONS_KEY, 1 /* WORKSPACE */, '[]')).map((watchStoredData) => {
                    return new debugModel_1.Expression(watchStoredData.name, watchStoredData.id);
                });
            }
            catch (e) { }
            return result || [];
        }
        storeWatchExpressions(watchExpressions) {
            if (watchExpressions.length) {
                this.storageService.store(DEBUG_WATCH_EXPRESSIONS_KEY, JSON.stringify(watchExpressions.map(we => ({ name: we.name, id: we.getId() }))), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_WATCH_EXPRESSIONS_KEY, 1 /* WORKSPACE */);
            }
        }
        storeBreakpoints(debugModel) {
            const breakpoints = debugModel.getBreakpoints();
            if (breakpoints.length) {
                this.storageService.store(DEBUG_BREAKPOINTS_KEY, JSON.stringify(breakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
            const functionBreakpoints = debugModel.getFunctionBreakpoints();
            if (functionBreakpoints.length) {
                this.storageService.store(DEBUG_FUNCTION_BREAKPOINTS_KEY, JSON.stringify(functionBreakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_FUNCTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
            const dataBreakpoints = debugModel.getDataBreakpoints().filter(dbp => dbp.canPersist);
            if (dataBreakpoints.length) {
                this.storageService.store(DEBUG_DATA_BREAKPOINTS_KEY, JSON.stringify(dataBreakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_DATA_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
            const exceptionBreakpoints = debugModel.getExceptionBreakpoints();
            if (exceptionBreakpoints.length) {
                this.storageService.store(DEBUG_EXCEPTION_BREAKPOINTS_KEY, JSON.stringify(exceptionBreakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_EXCEPTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
        }
    };
    DebugStorage = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, textfiles_1.ITextFileService)
    ], DebugStorage);
    exports.DebugStorage = DebugStorage;
});
//# __sourceMappingURL=debugStorage.js.map