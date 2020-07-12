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
define(["require", "exports", "vs/base/common/comparers", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/contrib/documentSymbols/outlineModel", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsModel", "vs/editor/contrib/documentSymbols/outlineTree", "vs/platform/theme/common/themeService", "vs/editor/common/services/modeService", "vs/nls", "vs/css!./media/breadcrumbscontrol"], function (require, exports, comparers_1, errors_1, event_1, filters_1, glob, lifecycle_1, path_1, resources_1, uri_1, outlineModel_1, configuration_1, files_1, instantiation_1, listService_1, colorRegistry_1, workspace_1, labels_1, breadcrumbs_1, breadcrumbsModel_1, outlineTree_1, themeService_1, modeService_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsOutlinePicker = exports.BreadcrumbsFilePicker = exports.FileSorter = exports.BreadcrumbsPicker = exports.createBreadcrumbsPicker = void 0;
    function createBreadcrumbsPicker(instantiationService, parent, element) {
        return element instanceof breadcrumbsModel_1.FileElement
            ? instantiationService.createInstance(BreadcrumbsFilePicker, parent)
            : instantiationService.createInstance(BreadcrumbsOutlinePicker, parent);
    }
    exports.createBreadcrumbsPicker = createBreadcrumbsPicker;
    let BreadcrumbsPicker = class BreadcrumbsPicker {
        constructor(parent, _instantiationService, _themeService, _configurationService) {
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._fakeEvent = new UIEvent('fakeEvent');
            this._onDidPickElement = new event_1.Emitter();
            this.onDidPickElement = this._onDidPickElement.event;
            this._onDidFocusElement = new event_1.Emitter();
            this.onDidFocusElement = this._onDidFocusElement.event;
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-breadcrumbs-picker show-file-icons';
            parent.appendChild(this._domNode);
        }
        dispose() {
            this._disposables.dispose();
            this._onDidPickElement.dispose();
            this._onDidFocusElement.dispose();
            this._tree.dispose();
        }
        show(input, maxHeight, width, arrowSize, arrowOffset) {
            const theme = this._themeService.getColorTheme();
            const color = theme.getColor(colorRegistry_1.breadcrumbsPickerBackground);
            this._arrow = document.createElement('div');
            this._arrow.className = 'arrow';
            this._arrow.style.borderColor = `transparent transparent ${color ? color.toString() : ''}`;
            this._domNode.appendChild(this._arrow);
            this._treeContainer = document.createElement('div');
            this._treeContainer.style.background = color ? color.toString() : '';
            this._treeContainer.style.paddingTop = '2px';
            this._treeContainer.style.boxShadow = `0px 5px 8px ${this._themeService.getColorTheme().getColor(colorRegistry_1.widgetShadow)}`;
            this._domNode.appendChild(this._treeContainer);
            this._layoutInfo = { maxHeight, width, arrowSize, arrowOffset, inputHeight: 0 };
            this._tree = this._createTree(this._treeContainer);
            this._disposables.add(this._tree.onDidChangeSelection(e => {
                if (e.browserEvent !== this._fakeEvent) {
                    const target = this._getTargetFromEvent(e.elements[0]);
                    if (target) {
                        setTimeout(_ => {
                            this._onDidPickElement.fire({ target, browserEvent: e.browserEvent || new UIEvent('fake') });
                        }, 0);
                    }
                }
            }));
            this._disposables.add(this._tree.onDidChangeFocus(e => {
                const target = this._getTargetFromEvent(e.elements[0]);
                if (target) {
                    this._onDidFocusElement.fire({ target, browserEvent: e.browserEvent || new UIEvent('fake') });
                }
            }));
            this._disposables.add(this._tree.onDidChangeContentHeight(() => {
                this._layout();
            }));
            this._domNode.focus();
            this._setInput(input).then(() => {
                this._layout();
            }).catch(errors_1.onUnexpectedError);
        }
        _layout() {
            const headerHeight = 2 * this._layoutInfo.arrowSize;
            const treeHeight = Math.min(this._layoutInfo.maxHeight - headerHeight, this._tree.contentHeight);
            const totalHeight = treeHeight + headerHeight;
            this._domNode.style.height = `${totalHeight}px`;
            this._domNode.style.width = `${this._layoutInfo.width}px`;
            this._arrow.style.top = `-${2 * this._layoutInfo.arrowSize}px`;
            this._arrow.style.borderWidth = `${this._layoutInfo.arrowSize}px`;
            this._arrow.style.marginLeft = `${this._layoutInfo.arrowOffset}px`;
            this._treeContainer.style.height = `${treeHeight}px`;
            this._treeContainer.style.width = `${this._layoutInfo.width}px`;
            this._tree.layout(treeHeight, this._layoutInfo.width);
        }
        get useAltAsMultipleSelectionModifier() {
            return this._tree.useAltAsMultipleSelectionModifier;
        }
    };
    BreadcrumbsPicker = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService)
    ], BreadcrumbsPicker);
    exports.BreadcrumbsPicker = BreadcrumbsPicker;
    //#region - Files
    class FileVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return 'FileStat';
        }
    }
    class FileIdentityProvider {
        getId(element) {
            if (uri_1.URI.isUri(element)) {
                return element.toString();
            }
            else if (workspace_1.IWorkspace.isIWorkspace(element)) {
                return element.id;
            }
            else if (workspace_1.IWorkspaceFolder.isIWorkspaceFolder(element)) {
                return element.uri.toString();
            }
            else {
                return element.resource.toString();
            }
        }
    }
    let FileDataSource = class FileDataSource {
        constructor(_fileService) {
            this._fileService = _fileService;
            this._parents = new WeakMap();
        }
        hasChildren(element) {
            return uri_1.URI.isUri(element)
                || workspace_1.IWorkspace.isIWorkspace(element)
                || workspace_1.IWorkspaceFolder.isIWorkspaceFolder(element)
                || element.isDirectory;
        }
        getChildren(element) {
            if (workspace_1.IWorkspace.isIWorkspace(element)) {
                return Promise.resolve(element.folders).then(folders => {
                    for (let child of folders) {
                        this._parents.set(element, child);
                    }
                    return folders;
                });
            }
            let uri;
            if (workspace_1.IWorkspaceFolder.isIWorkspaceFolder(element)) {
                uri = element.uri;
            }
            else if (uri_1.URI.isUri(element)) {
                uri = element;
            }
            else {
                uri = element.resource;
            }
            return this._fileService.resolve(uri).then(stat => {
                for (const child of stat.children || []) {
                    this._parents.set(stat, child);
                }
                return stat.children || [];
            });
        }
    };
    FileDataSource = __decorate([
        __param(0, files_1.IFileService)
    ], FileDataSource);
    let FileRenderer = class FileRenderer {
        constructor(_labels, _configService) {
            this._labels = _labels;
            this._configService = _configService;
            this.templateId = 'FileStat';
        }
        renderTemplate(container) {
            return this._labels.create(container, { supportHighlights: true });
        }
        renderElement(node, index, templateData) {
            const fileDecorations = this._configService.getValue('explorer.decorations');
            const { element } = node;
            let resource;
            let fileKind;
            if (workspace_1.IWorkspaceFolder.isIWorkspaceFolder(element)) {
                resource = element.uri;
                fileKind = files_1.FileKind.ROOT_FOLDER;
            }
            else {
                resource = element.resource;
                fileKind = element.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            }
            templateData.setFile(resource, {
                fileKind,
                hidePath: true,
                fileDecorations: fileDecorations,
                matches: filters_1.createMatches(node.filterData),
                extraClasses: ['picker-item']
            });
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    };
    FileRenderer = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], FileRenderer);
    class FileNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.name;
        }
    }
    class FileAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls_1.localize('breadcrumbs', "Breadcrumbs");
        }
        getAriaLabel(element) {
            return element.name;
        }
    }
    let FileFilter = class FileFilter {
        constructor(_workspaceService, configService) {
            this._workspaceService = _workspaceService;
            this._cachedExpressions = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            const config = breadcrumbs_1.BreadcrumbsConfig.FileExcludes.bindTo(configService);
            const update = () => {
                _workspaceService.getWorkspace().folders.forEach(folder => {
                    const excludesConfig = config.getValue({ resource: folder.uri });
                    if (!excludesConfig) {
                        return;
                    }
                    // adjust patterns to be absolute in case they aren't
                    // free floating (**/)
                    const adjustedConfig = {};
                    for (const pattern in excludesConfig) {
                        if (typeof excludesConfig[pattern] !== 'boolean') {
                            continue;
                        }
                        let patternAbs = pattern.indexOf('**/') !== 0
                            ? path_1.posix.join(folder.uri.path, pattern)
                            : pattern;
                        adjustedConfig[patternAbs] = excludesConfig[pattern];
                    }
                    this._cachedExpressions.set(folder.uri.toString(), glob.parse(adjustedConfig));
                });
            };
            update();
            this._disposables.add(config);
            this._disposables.add(config.onDidChange(update));
            this._disposables.add(_workspaceService.onDidChangeWorkspaceFolders(update));
        }
        dispose() {
            this._disposables.dispose();
        }
        filter(element, _parentVisibility) {
            if (workspace_1.IWorkspaceFolder.isIWorkspaceFolder(element)) {
                // not a file
                return true;
            }
            const folder = this._workspaceService.getWorkspaceFolder(element.resource);
            if (!folder || !this._cachedExpressions.has(folder.uri.toString())) {
                // no folder or no filer
                return true;
            }
            const expression = this._cachedExpressions.get(folder.uri.toString());
            return !expression(element.resource.path, resources_1.basename(element.resource));
        }
    };
    FileFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService)
    ], FileFilter);
    class FileSorter {
        compare(a, b) {
            if (workspace_1.IWorkspaceFolder.isIWorkspaceFolder(a) && workspace_1.IWorkspaceFolder.isIWorkspaceFolder(b)) {
                return a.index - b.index;
            }
            if (a.isDirectory === b.isDirectory) {
                // same type -> compare on names
                return comparers_1.compareFileNames(a.name, b.name);
            }
            else if (a.isDirectory) {
                return -1;
            }
            else {
                return 1;
            }
        }
    }
    exports.FileSorter = FileSorter;
    let BreadcrumbsFilePicker = class BreadcrumbsFilePicker extends BreadcrumbsPicker {
        constructor(parent, instantiationService, themeService, configService, _workspaceService) {
            super(parent, instantiationService, themeService, configService);
            this._workspaceService = _workspaceService;
        }
        _createTree(container) {
            // tree icon theme specials
            this._treeContainer.classList.add('file-icon-themable-tree');
            this._treeContainer.classList.add('show-file-icons');
            const onFileIconThemeChange = (fileIconTheme) => {
                this._treeContainer.classList.toggle('align-icons-and-twisties', fileIconTheme.hasFileIcons && !fileIconTheme.hasFolderIcons);
                this._treeContainer.classList.toggle('hide-arrows', fileIconTheme.hidesExplorerArrows === true);
            };
            this._disposables.add(this._themeService.onDidFileIconThemeChange(onFileIconThemeChange));
            onFileIconThemeChange(this._themeService.getFileIconTheme());
            const labels = this._instantiationService.createInstance(labels_1.ResourceLabels, labels_1.DEFAULT_LABELS_CONTAINER /* TODO@Jo visibility propagation */);
            this._disposables.add(labels);
            return this._instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'BreadcrumbsFilePicker', container, new FileVirtualDelegate(), [this._instantiationService.createInstance(FileRenderer, labels)], this._instantiationService.createInstance(FileDataSource), {
                multipleSelectionSupport: false,
                sorter: new FileSorter(),
                filter: this._instantiationService.createInstance(FileFilter),
                identityProvider: new FileIdentityProvider(),
                keyboardNavigationLabelProvider: new FileNavigationLabelProvider(),
                accessibilityProvider: this._instantiationService.createInstance(FileAccessibilityProvider),
                overrideStyles: {
                    listBackground: colorRegistry_1.breadcrumbsPickerBackground
                },
            });
        }
        _setInput(element) {
            const { uri, kind } = element;
            let input;
            if (kind === files_1.FileKind.ROOT_FOLDER) {
                input = this._workspaceService.getWorkspace();
            }
            else {
                input = resources_1.dirname(uri);
            }
            const tree = this._tree;
            return tree.setInput(input).then(() => {
                let focusElement;
                for (const { element } of tree.getNode().children) {
                    if (workspace_1.IWorkspaceFolder.isIWorkspaceFolder(element) && resources_1.isEqual(element.uri, uri)) {
                        focusElement = element;
                        break;
                    }
                    else if (resources_1.isEqual(element.resource, uri)) {
                        focusElement = element;
                        break;
                    }
                }
                if (focusElement) {
                    tree.reveal(focusElement, 0.5);
                    tree.setFocus([focusElement], this._fakeEvent);
                }
                tree.domFocus();
            });
        }
        _getTargetFromEvent(element) {
            // todo@joh
            if (element && !workspace_1.IWorkspaceFolder.isIWorkspaceFolder(element) && !element.isDirectory) {
                return new breadcrumbsModel_1.FileElement(element.resource, files_1.FileKind.FILE);
            }
        }
    };
    BreadcrumbsFilePicker = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], BreadcrumbsFilePicker);
    exports.BreadcrumbsFilePicker = BreadcrumbsFilePicker;
    //#endregion
    //#region - Symbols
    let BreadcrumbsOutlinePicker = class BreadcrumbsOutlinePicker extends BreadcrumbsPicker {
        constructor(parent, instantiationService, themeService, configurationService, _modeService) {
            super(parent, instantiationService, themeService, configurationService);
            this._modeService = _modeService;
            this._symbolSortOrder = breadcrumbs_1.BreadcrumbsConfig.SymbolSortOrder.bindTo(this._configurationService);
            this._outlineComparator = new outlineTree_1.OutlineItemComparator();
        }
        _createTree(container) {
            return this._instantiationService.createInstance(listService_1.WorkbenchDataTree, 'BreadcrumbsOutlinePicker', container, new outlineTree_1.OutlineVirtualDelegate(), [new outlineTree_1.OutlineGroupRenderer(), this._instantiationService.createInstance(outlineTree_1.OutlineElementRenderer)], new outlineTree_1.OutlineDataSource(), {
                collapseByDefault: true,
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                sorter: this._outlineComparator,
                identityProvider: new outlineTree_1.OutlineIdentityProvider(),
                keyboardNavigationLabelProvider: new outlineTree_1.OutlineNavigationLabelProvider(),
                accessibilityProvider: new outlineTree_1.OutlineAccessibilityProvider(nls_1.localize('breadcrumbs', "Breadcrumbs")),
                filter: this._instantiationService.createInstance(outlineTree_1.OutlineFilter, 'breadcrumbs')
            });
        }
        dispose() {
            this._symbolSortOrder.dispose();
            super.dispose();
        }
        _setInput(input) {
            const element = input;
            const model = outlineModel_1.OutlineModel.get(element);
            const tree = this._tree;
            const overrideConfiguration = {
                resource: model.uri,
                overrideIdentifier: this._modeService.getModeIdByFilepathOrFirstLine(model.uri)
            };
            this._outlineComparator.type = this._getOutlineItemCompareType(overrideConfiguration);
            tree.setInput(model);
            if (element !== model) {
                tree.reveal(element, 0.5);
                tree.setFocus([element], this._fakeEvent);
            }
            tree.domFocus();
            return Promise.resolve();
        }
        _getTargetFromEvent(element) {
            if (element instanceof outlineModel_1.OutlineElement) {
                return element;
            }
        }
        _getOutlineItemCompareType(overrideConfiguration) {
            switch (this._symbolSortOrder.getValue(overrideConfiguration)) {
                case 'name':
                    return 1 /* ByName */;
                case 'type':
                    return 2 /* ByKind */;
                case 'position':
                default:
                    return 0 /* ByPosition */;
            }
        }
    };
    BreadcrumbsOutlinePicker = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, modeService_1.IModeService)
    ], BreadcrumbsOutlinePicker);
    exports.BreadcrumbsOutlinePicker = BreadcrumbsOutlinePicker;
});
//#endregion
//# __sourceMappingURL=breadcrumbsPicker.js.map