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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/modes", "vs/editor/contrib/documentSymbols/outlineModel", "vs/platform/workspace/common/workspace", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/platform/files/common/files", "vs/base/common/types", "vs/editor/contrib/documentSymbols/outlineTree", "vs/editor/common/services/textResourceConfigurationService"], function (require, exports, arrays_1, async_1, cancellation_1, errors_1, event_1, lifecycle_1, resources_1, modes_1, outlineModel_1, workspace_1, network_1, configuration_1, breadcrumbs_1, files_1, types_1, outlineTree_1, textResourceConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorBreadcrumbsModel = exports.FileElement = void 0;
    class FileElement {
        constructor(uri, kind) {
            this.uri = uri;
            this.kind = kind;
        }
    }
    exports.FileElement = FileElement;
    let EditorBreadcrumbsModel = class EditorBreadcrumbsModel {
        constructor(_uri, _editor, _configurationService, _textResourceConfigurationService, workspaceService) {
            this._uri = _uri;
            this._editor = _editor;
            this._configurationService = _configurationService;
            this._textResourceConfigurationService = _textResourceConfigurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._outlineElements = [];
            this._outlineDisposables = new lifecycle_1.DisposableStore();
            this._onDidUpdate = new event_1.Emitter();
            this.onDidUpdate = this._onDidUpdate.event;
            this._cfgEnabled = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(_configurationService);
            this._cfgFilePath = breadcrumbs_1.BreadcrumbsConfig.FilePath.bindTo(_configurationService);
            this._cfgSymbolPath = breadcrumbs_1.BreadcrumbsConfig.SymbolPath.bindTo(_configurationService);
            this._disposables.add(this._cfgFilePath.onDidChange(_ => this._onDidUpdate.fire(this)));
            this._disposables.add(this._cfgSymbolPath.onDidChange(_ => this._onDidUpdate.fire(this)));
            this._fileInfo = EditorBreadcrumbsModel._initFilePathInfo(this._uri, workspaceService);
            this._bindToEditor();
            this._onDidUpdate.fire(this);
        }
        dispose() {
            this._cfgEnabled.dispose();
            this._cfgFilePath.dispose();
            this._cfgSymbolPath.dispose();
            this._outlineDisposables.dispose();
            this._disposables.dispose();
            this._onDidUpdate.dispose();
        }
        isRelative() {
            return Boolean(this._fileInfo.folder);
        }
        getElements() {
            let result = [];
            // file path elements
            if (this._cfgFilePath.getValue() === 'on') {
                result = result.concat(this._fileInfo.path);
            }
            else if (this._cfgFilePath.getValue() === 'last' && this._fileInfo.path.length > 0) {
                result = result.concat(this._fileInfo.path.slice(-1));
            }
            // symbol path elements
            if (this._cfgSymbolPath.getValue() === 'on') {
                result = result.concat(this._outlineElements);
            }
            else if (this._cfgSymbolPath.getValue() === 'last' && this._outlineElements.length > 0) {
                result = result.concat(this._outlineElements.slice(-1));
            }
            return result;
        }
        static _initFilePathInfo(uri, workspaceService) {
            if (uri.scheme === network_1.Schemas.untitled) {
                return {
                    folder: undefined,
                    path: []
                };
            }
            let info = {
                folder: types_1.withNullAsUndefined(workspaceService.getWorkspaceFolder(uri)),
                path: []
            };
            let uriPrefix = uri;
            while (uriPrefix && uriPrefix.path !== '/') {
                if (info.folder && resources_1.isEqual(info.folder.uri, uriPrefix)) {
                    break;
                }
                info.path.unshift(new FileElement(uriPrefix, info.path.length === 0 ? files_1.FileKind.FILE : files_1.FileKind.FOLDER));
                let prevPathLength = uriPrefix.path.length;
                uriPrefix = resources_1.dirname(uriPrefix);
                if (uriPrefix.path.length === prevPathLength) {
                    break;
                }
            }
            if (info.folder && workspaceService.getWorkbenchState() === 3 /* WORKSPACE */) {
                info.path.unshift(new FileElement(info.folder.uri, files_1.FileKind.ROOT_FOLDER));
            }
            return info;
        }
        _bindToEditor() {
            if (!this._editor) {
                return;
            }
            // update as language, model, providers changes
            this._disposables.add(modes_1.DocumentSymbolProviderRegistry.onDidChange(_ => this._updateOutline()));
            this._disposables.add(this._editor.onDidChangeModel(_ => this._updateOutline()));
            this._disposables.add(this._editor.onDidChangeModelLanguage(_ => this._updateOutline()));
            // update when config changes (re-render)
            this._disposables.add(this._configurationService.onDidChangeConfiguration(e => {
                if (!this._cfgEnabled.getValue()) {
                    // breadcrumbs might be disabled (also via a setting/config) and that is
                    // something we must check before proceeding.
                    return;
                }
                if (e.affectsConfiguration('breadcrumbs')) {
                    this._updateOutline(true);
                    return;
                }
                if (this._editor && this._editor.getModel()) {
                    const editorModel = this._editor.getModel();
                    const languageName = editorModel.getLanguageIdentifier().language;
                    // Checking for changes in the current language override config.
                    // We can't be more specific than this because the ConfigurationChangeEvent(e) only includes the first part of the root path
                    if (e.affectsConfiguration(`[${languageName}]`)) {
                        this._updateOutline(true);
                    }
                }
            }));
            // update soon'ish as model content change
            const updateSoon = new async_1.TimeoutTimer();
            this._disposables.add(updateSoon);
            this._disposables.add(this._editor.onDidChangeModelContent(_ => {
                const timeout = outlineModel_1.OutlineModel.getRequestDelay(this._editor.getModel());
                updateSoon.cancelAndSet(() => this._updateOutline(true), timeout);
            }));
            this._updateOutline();
            // stop when editor dies
            this._disposables.add(this._editor.onDidDispose(() => this._outlineDisposables.clear()));
        }
        _updateOutline(didChangeContent) {
            this._outlineDisposables.clear();
            if (!didChangeContent) {
                this._updateOutlineElements([]);
            }
            const editor = this._editor;
            const buffer = editor.getModel();
            if (!buffer || !modes_1.DocumentSymbolProviderRegistry.has(buffer) || !resources_1.isEqual(buffer.uri, this._uri)) {
                return;
            }
            const source = new cancellation_1.CancellationTokenSource();
            const versionIdThen = buffer.getVersionId();
            const timeout = new async_1.TimeoutTimer();
            this._outlineDisposables.add({
                dispose: () => {
                    source.dispose(true);
                    timeout.dispose();
                }
            });
            outlineModel_1.OutlineModel.create(buffer, source.token).then(model => {
                if (source.token.isCancellationRequested) {
                    // cancelled -> do nothing
                    return;
                }
                if (outlineModel_1.TreeElement.empty(model)) {
                    // empty -> no outline elements
                    this._updateOutlineElements([]);
                }
                else {
                    // copy the model
                    model = model.adopt();
                    this._updateOutlineElements(this._getOutlineElements(model, editor.getPosition()));
                    this._outlineDisposables.add(editor.onDidChangeCursorPosition(_ => {
                        timeout.cancelAndSet(() => {
                            if (!buffer.isDisposed() && versionIdThen === buffer.getVersionId() && editor.getModel()) {
                                this._updateOutlineElements(this._getOutlineElements(model, editor.getPosition()));
                            }
                        }, 150);
                    }));
                }
            }).catch(err => {
                this._updateOutlineElements([]);
                errors_1.onUnexpectedError(err);
            });
        }
        _getOutlineElements(model, position) {
            if (!model || !position) {
                return [];
            }
            let item = model.getItemEnclosingPosition(position);
            if (!item) {
                return this._getOutlineElementsRoot(model);
            }
            let chain = [];
            while (item) {
                chain.push(item);
                let parent = item.parent;
                if (parent instanceof outlineModel_1.OutlineModel) {
                    break;
                }
                if (parent instanceof outlineModel_1.OutlineGroup && parent.parent && parent.parent.children.size === 1) {
                    break;
                }
                item = parent;
            }
            let result = [];
            for (let i = chain.length - 1; i >= 0; i--) {
                let element = chain[i];
                if (this._isFiltered(element)) {
                    break;
                }
                result.push(element);
            }
            if (result.length === 0) {
                return this._getOutlineElementsRoot(model);
            }
            return result;
        }
        _getOutlineElementsRoot(model) {
            for (const child of model.children.values()) {
                if (!this._isFiltered(child)) {
                    return [model];
                }
            }
            return [];
        }
        _isFiltered(element) {
            if (element instanceof outlineModel_1.OutlineElement) {
                const key = `breadcrumbs.${outlineTree_1.OutlineFilter.kindToConfigName[element.symbol.kind]}`;
                let uri;
                if (this._editor && this._editor.getModel()) {
                    const model = this._editor.getModel();
                    uri = model.uri;
                }
                return !this._textResourceConfigurationService.getValue(uri, key);
            }
            return false;
        }
        _updateOutlineElements(elements) {
            if (!arrays_1.equals(elements, this._outlineElements, EditorBreadcrumbsModel._outlineElementEquals)) {
                this._outlineElements = elements;
                this._onDidUpdate.fire(this);
            }
        }
        static _outlineElementEquals(a, b) {
            if (a === b) {
                return true;
            }
            else if (!a || !b) {
                return false;
            }
            else {
                return a.id === b.id;
            }
        }
    };
    EditorBreadcrumbsModel = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], EditorBreadcrumbsModel);
    exports.EditorBreadcrumbsModel = EditorBreadcrumbsModel;
});
//# __sourceMappingURL=breadcrumbsModel.js.map