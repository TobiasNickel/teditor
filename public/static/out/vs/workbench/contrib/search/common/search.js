/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/base/common/cancellation", "vs/platform/files/common/files", "vs/base/common/types"], function (require, exports, errors_1, workspace_1, editor_1, editorService_1, cancellation_1, files_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extractRangeFromFilter = exports.getOutOfWorkspaceEditorResources = exports.getWorkspaceSymbols = exports.WorkspaceSymbolProviderRegistry = void 0;
    var WorkspaceSymbolProviderRegistry;
    (function (WorkspaceSymbolProviderRegistry) {
        const _supports = [];
        function register(provider) {
            let support = provider;
            if (support) {
                _supports.push(support);
            }
            return {
                dispose() {
                    if (support) {
                        const idx = _supports.indexOf(support);
                        if (idx >= 0) {
                            _supports.splice(idx, 1);
                            support = undefined;
                        }
                    }
                }
            };
        }
        WorkspaceSymbolProviderRegistry.register = register;
        function all() {
            return _supports.slice(0);
        }
        WorkspaceSymbolProviderRegistry.all = all;
    })(WorkspaceSymbolProviderRegistry = exports.WorkspaceSymbolProviderRegistry || (exports.WorkspaceSymbolProviderRegistry = {}));
    function getWorkspaceSymbols(query, token = cancellation_1.CancellationToken.None) {
        const result = [];
        const promises = WorkspaceSymbolProviderRegistry.all().map(support => {
            return Promise.resolve(support.provideWorkspaceSymbols(query, token)).then(value => {
                if (Array.isArray(value)) {
                    result.push([support, value]);
                }
            }, errors_1.onUnexpectedError);
        });
        return Promise.all(promises).then(_ => result);
    }
    exports.getWorkspaceSymbols = getWorkspaceSymbols;
    /**
     * Helper to return all opened editors with resources not belonging to the currently opened workspace.
     */
    function getOutOfWorkspaceEditorResources(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const fileService = accessor.get(files_1.IFileService);
        const resources = editorService.editors
            .map(editor => editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }))
            .filter(resource => !!resource && !contextService.isInsideWorkspace(resource) && fileService.canHandleResource(resource));
        return resources;
    }
    exports.getOutOfWorkspaceEditorResources = getOutOfWorkspaceEditorResources;
    // Supports patterns of <path><#|:|(><line><#|:|,><col?>
    const LINE_COLON_PATTERN = /\s?[#:\(](?:line )?(\d*)(?:[#:,](\d*))?\)?\s*$/;
    function extractRangeFromFilter(filter, unless) {
        var _a, _b;
        if (!filter || (unless === null || unless === void 0 ? void 0 : unless.some(value => filter.indexOf(value) !== -1))) {
            return undefined;
        }
        let range = undefined;
        // Find Line/Column number from search value using RegExp
        const patternMatch = LINE_COLON_PATTERN.exec(filter);
        if (patternMatch) {
            const startLineNumber = parseInt((_a = patternMatch[1]) !== null && _a !== void 0 ? _a : '', 10);
            // Line Number
            if (types_1.isNumber(startLineNumber)) {
                range = {
                    startLineNumber: startLineNumber,
                    startColumn: 1,
                    endLineNumber: startLineNumber,
                    endColumn: 1
                };
                // Column Number
                const startColumn = parseInt((_b = patternMatch[2]) !== null && _b !== void 0 ? _b : '', 10);
                if (types_1.isNumber(startColumn)) {
                    range = {
                        startLineNumber: range.startLineNumber,
                        startColumn: startColumn,
                        endLineNumber: range.endLineNumber,
                        endColumn: startColumn
                    };
                }
            }
            // User has typed "something:" or "something#" without a line number, in this case treat as start of file
            else if (patternMatch[1] === '') {
                range = {
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1
                };
            }
        }
        if (patternMatch && range) {
            return {
                filter: filter.substr(0, patternMatch.index),
                range
            };
        }
        return undefined;
    }
    exports.extractRangeFromFilter = extractRangeFromFilter;
});
//# __sourceMappingURL=search.js.map