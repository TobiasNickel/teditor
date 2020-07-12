/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/json", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/jsonErrorMessages", "vs/base/browser/dom"], function (require, exports, uri_1, nls, Paths, resources, Json, workbenchThemeService_1, jsonErrorMessages_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileIconThemeData = void 0;
    const PERSISTED_FILE_ICON_THEME_STORAGE_KEY = 'iconThemeData';
    class FileIconThemeData {
        constructor(id, label, settingsId) {
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
            this.hasFileIcons = false;
            this.hasFolderIcons = false;
            this.hidesExplorerArrows = false;
        }
        ensureLoaded(fileService) {
            return !this.isLoaded ? this.load(fileService) : Promise.resolve(this.styleSheetContent);
        }
        reload(fileService) {
            return this.load(fileService);
        }
        load(fileService) {
            if (!this.location) {
                return Promise.resolve(this.styleSheetContent);
            }
            return _loadIconThemeDocument(fileService, this.location).then(iconThemeDocument => {
                const result = _processIconThemeDocument(this.id, this.location, iconThemeDocument);
                this.styleSheetContent = result.content;
                this.hasFileIcons = result.hasFileIcons;
                this.hasFolderIcons = result.hasFolderIcons;
                this.hidesExplorerArrows = result.hidesExplorerArrows;
                this.isLoaded = true;
                return this.styleSheetContent;
            });
        }
        static fromExtensionTheme(iconTheme, iconThemeLocation, extensionData) {
            const id = extensionData.extensionId + '-' + iconTheme.id;
            const label = iconTheme.label || Paths.basename(iconTheme.path);
            const settingsId = iconTheme.id;
            const themeData = new FileIconThemeData(id, label, settingsId);
            themeData.description = iconTheme.description;
            themeData.location = iconThemeLocation;
            themeData.extensionData = extensionData;
            themeData.watch = iconTheme._watch;
            themeData.isLoaded = false;
            return themeData;
        }
        static get noIconTheme() {
            let themeData = FileIconThemeData._noIconTheme;
            if (!themeData) {
                themeData = FileIconThemeData._noIconTheme = new FileIconThemeData('', '', null);
                themeData.hasFileIcons = false;
                themeData.hasFolderIcons = false;
                themeData.hidesExplorerArrows = false;
                themeData.isLoaded = true;
                themeData.extensionData = undefined;
                themeData.watch = false;
            }
            return themeData;
        }
        static createUnloadedTheme(id) {
            const themeData = new FileIconThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.hasFileIcons = false;
            themeData.hasFolderIcons = false;
            themeData.hidesExplorerArrows = false;
            themeData.extensionData = undefined;
            themeData.watch = false;
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(PERSISTED_FILE_ICON_THEME_STORAGE_KEY, 0 /* GLOBAL */);
            if (!input) {
                return undefined;
            }
            try {
                let data = JSON.parse(input);
                const theme = new FileIconThemeData('', '', null);
                for (let key in data) {
                    switch (key) {
                        case 'id':
                        case 'label':
                        case 'description':
                        case 'settingsId':
                        case 'styleSheetContent':
                        case 'hasFileIcons':
                        case 'hidesExplorerArrows':
                        case 'hasFolderIcons':
                        case 'watch':
                            theme[key] = data[key];
                            break;
                        case 'location':
                            theme.location = uri_1.URI.revive(data.location);
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        toStorage(storageService) {
            var _a;
            const data = JSON.stringify({
                id: this.id,
                label: this.label,
                description: this.description,
                settingsId: this.settingsId,
                location: (_a = this.location) === null || _a === void 0 ? void 0 : _a.toJSON(),
                styleSheetContent: this.styleSheetContent,
                hasFileIcons: this.hasFileIcons,
                hasFolderIcons: this.hasFolderIcons,
                hidesExplorerArrows: this.hidesExplorerArrows,
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
                watch: this.watch
            });
            storageService.store(PERSISTED_FILE_ICON_THEME_STORAGE_KEY, data, 0 /* GLOBAL */);
        }
    }
    exports.FileIconThemeData = FileIconThemeData;
    FileIconThemeData._noIconTheme = null;
    function _loadIconThemeDocument(fileService, location) {
        return fileService.readFile(location).then((content) => {
            let errors = [];
            let contentValue = Json.parse(content.value.toString(), errors);
            if (errors.length > 0) {
                return Promise.reject(new Error(nls.localize('error.cannotparseicontheme', "Problems parsing file icons file: {0}", errors.map(e => jsonErrorMessages_1.getParseErrorMessage(e.error)).join(', '))));
            }
            else if (Json.getNodeType(contentValue) !== 'object') {
                return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for file icons theme file: Object expected.")));
            }
            return Promise.resolve(contentValue);
        });
    }
    function _processIconThemeDocument(id, iconThemeDocumentLocation, iconThemeDocument) {
        const result = { content: '', hasFileIcons: false, hasFolderIcons: false, hidesExplorerArrows: !!iconThemeDocument.hidesExplorerArrows };
        if (!iconThemeDocument.iconDefinitions) {
            return result;
        }
        let selectorByDefinitionId = {};
        const iconThemeDocumentLocationDirname = resources.dirname(iconThemeDocumentLocation);
        function resolvePath(path) {
            return resources.joinPath(iconThemeDocumentLocationDirname, path);
        }
        function collectSelectors(associations, baseThemeClassName) {
            function addSelector(selector, defId) {
                if (defId) {
                    let list = selectorByDefinitionId[defId];
                    if (!list) {
                        list = selectorByDefinitionId[defId] = [];
                    }
                    list.push(selector);
                }
            }
            if (associations) {
                let qualifier = '.show-file-icons';
                if (baseThemeClassName) {
                    qualifier = baseThemeClassName + ' ' + qualifier;
                }
                const expanded = '.monaco-tl-twistie.collapsible:not(.collapsed) + .monaco-tl-contents';
                if (associations.folder) {
                    addSelector(`${qualifier} .folder-icon::before`, associations.folder);
                    result.hasFolderIcons = true;
                }
                if (associations.folderExpanded) {
                    addSelector(`${qualifier} ${expanded} .folder-icon::before`, associations.folderExpanded);
                    result.hasFolderIcons = true;
                }
                let rootFolder = associations.rootFolder || associations.folder;
                let rootFolderExpanded = associations.rootFolderExpanded || associations.folderExpanded;
                if (rootFolder) {
                    addSelector(`${qualifier} .rootfolder-icon::before`, rootFolder);
                    result.hasFolderIcons = true;
                }
                if (rootFolderExpanded) {
                    addSelector(`${qualifier} ${expanded} .rootfolder-icon::before`, rootFolderExpanded);
                    result.hasFolderIcons = true;
                }
                if (associations.file) {
                    addSelector(`${qualifier} .file-icon::before`, associations.file);
                    result.hasFileIcons = true;
                }
                let folderNames = associations.folderNames;
                if (folderNames) {
                    for (let folderName in folderNames) {
                        addSelector(`${qualifier} .${escapeCSS(folderName.toLowerCase())}-name-folder-icon.folder-icon::before`, folderNames[folderName]);
                        result.hasFolderIcons = true;
                    }
                }
                let folderNamesExpanded = associations.folderNamesExpanded;
                if (folderNamesExpanded) {
                    for (let folderName in folderNamesExpanded) {
                        addSelector(`${qualifier} ${expanded} .${escapeCSS(folderName.toLowerCase())}-name-folder-icon.folder-icon::before`, folderNamesExpanded[folderName]);
                        result.hasFolderIcons = true;
                    }
                }
                let languageIds = associations.languageIds;
                if (languageIds) {
                    if (!languageIds.jsonc && languageIds.json) {
                        languageIds.jsonc = languageIds.json;
                    }
                    for (let languageId in languageIds) {
                        addSelector(`${qualifier} .${escapeCSS(languageId)}-lang-file-icon.file-icon::before`, languageIds[languageId]);
                        result.hasFileIcons = true;
                    }
                }
                let fileExtensions = associations.fileExtensions;
                if (fileExtensions) {
                    for (let fileExtension in fileExtensions) {
                        let selectors = [];
                        let segments = fileExtension.toLowerCase().split('.');
                        if (segments.length) {
                            for (let i = 0; i < segments.length; i++) {
                                selectors.push(`.${escapeCSS(segments.slice(i).join('.'))}-ext-file-icon`);
                            }
                            selectors.push('.ext-file-icon'); // extra segment to increase file-ext score
                        }
                        addSelector(`${qualifier} ${selectors.join('')}.file-icon::before`, fileExtensions[fileExtension]);
                        result.hasFileIcons = true;
                    }
                }
                let fileNames = associations.fileNames;
                if (fileNames) {
                    for (let fileName in fileNames) {
                        let selectors = [];
                        fileName = fileName.toLowerCase();
                        selectors.push(`.${escapeCSS(fileName)}-name-file-icon`);
                        let segments = fileName.split('.');
                        if (segments.length) {
                            for (let i = 1; i < segments.length; i++) {
                                selectors.push(`.${escapeCSS(segments.slice(i).join('.'))}-ext-file-icon`);
                            }
                            selectors.push('.ext-file-icon'); // extra segment to increase file-ext score
                        }
                        addSelector(`${qualifier} ${selectors.join('')}.file-icon::before`, fileNames[fileName]);
                        result.hasFileIcons = true;
                    }
                }
            }
        }
        collectSelectors(iconThemeDocument);
        collectSelectors(iconThemeDocument.light, '.vs');
        collectSelectors(iconThemeDocument.highContrast, '.hc-black');
        if (!result.hasFileIcons && !result.hasFolderIcons) {
            return result;
        }
        let cssRules = [];
        let fonts = iconThemeDocument.fonts;
        if (Array.isArray(fonts)) {
            fonts.forEach(font => {
                let src = font.src.map(l => `${dom_1.asCSSUrl(resolvePath(l.path))} format('${l.format}')`).join(', ');
                cssRules.push(`@font-face { src: ${src}; font-family: '${font.id}'; font-weight: ${font.weight}; font-style: ${font.style}; }`);
            });
            cssRules.push(`.show-file-icons .file-icon::before, .show-file-icons .folder-icon::before, .show-file-icons .rootfolder-icon::before { font-family: '${fonts[0].id}'; font-size: ${fonts[0].size || '150%'}}`);
        }
        for (let defId in selectorByDefinitionId) {
            let selectors = selectorByDefinitionId[defId];
            let definition = iconThemeDocument.iconDefinitions[defId];
            if (definition) {
                if (definition.iconPath) {
                    cssRules.push(`${selectors.join(', ')} { content: ' '; background-image: ${dom_1.asCSSUrl(resolvePath(definition.iconPath))}; }`);
                }
                if (definition.fontCharacter || definition.fontColor) {
                    let body = '';
                    if (definition.fontColor) {
                        body += ` color: ${definition.fontColor};`;
                    }
                    if (definition.fontCharacter) {
                        body += ` content: '${definition.fontCharacter}';`;
                    }
                    if (definition.fontSize) {
                        body += ` font-size: ${definition.fontSize};`;
                    }
                    if (definition.fontId) {
                        body += ` font-family: ${definition.fontId};`;
                    }
                    cssRules.push(`${selectors.join(', ')} { ${body} }`);
                }
            }
        }
        result.content = cssRules.join('\n');
        return result;
    }
    function escapeCSS(str) {
        return window['CSS'].escape(str);
    }
});
//# __sourceMappingURL=fileIconThemeData.js.map