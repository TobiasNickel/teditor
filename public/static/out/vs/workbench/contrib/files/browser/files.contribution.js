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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/browser/viewlet", "vs/nls", "vs/base/common/path", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/editors/textFileEditorTracker", "vs/workbench/contrib/files/browser/editors/textFileSaveErrorHandler", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/contrib/files/browser/editors/binaryFileEditor", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/viewlet/browser/viewlet", "vs/base/common/platform", "vs/workbench/contrib/files/browser/explorerViewlet", "vs/workbench/browser/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/label/common/label", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/files/common/explorerService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/workbench/contrib/files/common/workspaceWatcher", "vs/editor/common/config/commonEditorConfig", "vs/workbench/contrib/files/common/dirtyFilesIndicator", "vs/base/common/resources"], function (require, exports, uri_1, viewlet_1, nls, path_1, actions_1, platform_1, configurationRegistry_1, actions_2, contributions_1, editor_1, files_1, files_2, textFileEditorTracker_1, textFileSaveErrorHandler_1, fileEditorInput_1, binaryFileEditor_1, descriptors_1, viewlet_2, platform, explorerViewlet_1, editor_2, editorService_1, editorGroupsService_1, label_1, layoutService_1, extensions_1, explorerService_1, textfiles_1, network_1, workspaceWatcher_1, commonEditorConfig_1, dirtyFilesIndicator_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenExplorerViewletAction = void 0;
    // Viewlet Action
    let OpenExplorerViewletAction = class OpenExplorerViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, files_2.VIEWLET_ID, viewletService, editorGroupService, layoutService);
        }
    };
    OpenExplorerViewletAction.ID = files_2.VIEWLET_ID;
    OpenExplorerViewletAction.LABEL = nls.localize('showExplorerViewlet', "Show Explorer");
    OpenExplorerViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenExplorerViewletAction);
    exports.OpenExplorerViewletAction = OpenExplorerViewletAction;
    let FileUriLabelContribution = class FileUriLabelContribution {
        constructor(labelService) {
            labelService.registerFormatter({
                scheme: network_1.Schemas.file,
                formatting: {
                    label: '${authority}${path}',
                    separator: path_1.sep,
                    tildify: !platform.isWindows,
                    normalizeDriveLetter: platform.isWindows,
                    authorityPrefix: path_1.sep + path_1.sep,
                    workspaceSuffix: ''
                }
            });
        }
    };
    FileUriLabelContribution = __decorate([
        __param(0, label_1.ILabelService)
    ], FileUriLabelContribution);
    extensions_1.registerSingleton(files_2.IExplorerService, explorerService_1.ExplorerService, true);
    const openViewletKb = {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 35 /* KEY_E */
    };
    // Register Action to Open Viewlet
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(OpenExplorerViewletAction, openViewletKb), 'View: Show Explorer', nls.localize('view', "View"));
    // Register file editors
    platform_1.Registry.as(editor_2.Extensions.Editors).registerEditor(editor_2.EditorDescriptor.create(binaryFileEditor_1.BinaryFileEditor, binaryFileEditor_1.BinaryFileEditor.ID, nls.localize('binaryFileEditor', "Binary File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
    // Register default file input factory
    platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).registerFileEditorInputFactory({
        createFileEditorInput: (resource, label, encoding, mode, instantiationService) => {
            return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, label, encoding, mode);
        },
        isFileEditorInput: (obj) => {
            return obj instanceof fileEditorInput_1.FileEditorInput;
        }
    });
    // Register Editor Input Factory
    class FileEditorInputFactory {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            const fileEditorInput = editorInput;
            const resource = fileEditorInput.resource;
            const label = fileEditorInput.getLabel();
            const serializedFileEditorInput = {
                resourceJSON: resource.toJSON(),
                labelJSON: resources_1.extUri.isEqual(resource, label) ? undefined : label,
                encoding: fileEditorInput.getEncoding(),
                modeId: fileEditorInput.getPreferredMode() // only using the preferred user associated mode here if available to not store redundant data
            };
            return JSON.stringify(serializedFileEditorInput);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.invokeFunction(accessor => {
                const serializedFileEditorInput = JSON.parse(serializedEditorInput);
                const resource = uri_1.URI.revive(serializedFileEditorInput.resourceJSON);
                const label = uri_1.URI.revive(serializedFileEditorInput.labelJSON);
                const encoding = serializedFileEditorInput.encoding;
                const mode = serializedFileEditorInput.modeId;
                const fileEditorInput = accessor.get(editorService_1.IEditorService).createEditorInput({ resource, encoding, mode, forceFile: true });
                if (label) {
                    fileEditorInput.setLabel(label);
                }
                return fileEditorInput;
            });
        }
    }
    platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).registerEditorInputFactory(files_2.FILE_EDITOR_INPUT_ID, FileEditorInputFactory);
    // Register Explorer views
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(explorerViewlet_1.ExplorerViewletViewsContribution, 1 /* Starting */);
    // Register Text File Editor Tracker
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(textFileEditorTracker_1.TextFileEditorTracker, 1 /* Starting */);
    // Register Text File Save Error Handler
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(textFileSaveErrorHandler_1.TextFileSaveErrorHandler, 1 /* Starting */);
    // Register uri display for file uris
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(FileUriLabelContribution, 1 /* Starting */);
    // Register Workspace Watcher
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(workspaceWatcher_1.WorkspaceWatcher, 3 /* Restored */);
    // Register Dirty Files Indicator
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(dirtyFilesIndicator_1.DirtyFilesIndicator, 1 /* Starting */);
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const hotExitConfiguration = platform.isNative ?
        {
            'type': 'string',
            'scope': 1 /* APPLICATION */,
            'enum': [files_1.HotExitConfiguration.OFF, files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE],
            'default': files_1.HotExitConfiguration.ON_EXIT,
            'markdownEnumDescriptions': [
                nls.localize('hotExit.off', 'Disable hot exit. A prompt will show when attempting to close a window with dirty files.'),
                nls.localize('hotExit.onExit', 'Hot exit will be triggered when the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu). All windows without folders opened will be restored upon next launch. A list of workspaces with unsaved files can be accessed via `File > Open Recent > More...`'),
                nls.localize('hotExit.onExitAndWindowClose', 'Hot exit will be triggered when the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu), and also for any window with a folder opened regardless of whether it\'s the last window. All windows without folders opened will be restored upon next launch. A list of workspaces with unsaved files can be accessed via `File > Open Recent > More...`')
            ],
            'description': nls.localize('hotExit', "Controls whether unsaved files are remembered between sessions, allowing the save prompt when exiting the editor to be skipped.", files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE)
        } : {
        'type': 'string',
        'scope': 1 /* APPLICATION */,
        'enum': [files_1.HotExitConfiguration.OFF, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE],
        'default': files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE,
        'markdownEnumDescriptions': [
            nls.localize('hotExit.off', 'Disable hot exit. A prompt will show when attempting to close a window with dirty files.'),
            nls.localize('hotExit.onExitAndWindowCloseBrowser', 'Hot exit will be triggered when the browser quits or the window or tab is closed.')
        ],
        'description': nls.localize('hotExit', "Controls whether unsaved files are remembered between sessions, allowing the save prompt when exiting the editor to be skipped.", files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE)
    };
    configurationRegistry.registerConfiguration({
        'id': 'files',
        'order': 9,
        'title': nls.localize('filesConfigurationTitle', "Files"),
        'type': 'object',
        'properties': {
            [files_1.FILES_EXCLUDE_CONFIG]: {
                'type': 'object',
                'markdownDescription': nls.localize('exclude', "Configure glob patterns for excluding files and folders. For example, the file Explorer decides which files and folders to show or hide based on this setting. Refer to the `#search.exclude#` setting to define search specific excludes. Read more about glob patterns [here](https://code.visualstudio.com/docs/editor/codebasics#_advanced-search-options)."),
                'default': { '**/.git': true, '**/.svn': true, '**/.hg': true, '**/CVS': true, '**/.DS_Store': true },
                'scope': 4 /* RESOURCE */,
                'additionalProperties': {
                    'anyOf': [
                        {
                            'type': 'boolean',
                            'description': nls.localize('files.exclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            'type': 'object',
                            'properties': {
                                'when': {
                                    'type': 'string',
                                    'pattern': '\\w*\\$\\(basename\\)\\w*',
                                    'default': '$(basename).ext',
                                    'description': nls.localize('files.exclude.when', "Additional check on the siblings of a matching file. Use $(basename) as variable for the matching file name.")
                                }
                            }
                        }
                    ]
                }
            },
            [files_1.FILES_ASSOCIATIONS_CONFIG]: {
                'type': 'object',
                'markdownDescription': nls.localize('associations', "Configure file associations to languages (e.g. `\"*.extension\": \"html\"`). These have precedence over the default associations of the languages installed."),
                'additionalProperties': {
                    'type': 'string'
                }
            },
            'files.encoding': {
                'type': 'string',
                'enum': Object.keys(textfiles_1.SUPPORTED_ENCODINGS),
                'default': 'utf8',
                'description': nls.localize('encoding', "The default character set encoding to use when reading and writing files. This setting can also be configured per language."),
                'scope': 5 /* LANGUAGE_OVERRIDABLE */,
                'enumDescriptions': Object.keys(textfiles_1.SUPPORTED_ENCODINGS).map(key => textfiles_1.SUPPORTED_ENCODINGS[key].labelLong),
                'included': Object.keys(textfiles_1.SUPPORTED_ENCODINGS).length > 1
            },
            'files.autoGuessEncoding': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('autoGuessEncoding', "When enabled, the editor will attempt to guess the character set encoding when opening files. This setting can also be configured per language."),
                'scope': 5 /* LANGUAGE_OVERRIDABLE */,
                'included': Object.keys(textfiles_1.SUPPORTED_ENCODINGS).length > 1
            },
            'files.eol': {
                'type': 'string',
                'enum': [
                    '\n',
                    '\r\n',
                    'auto'
                ],
                'enumDescriptions': [
                    nls.localize('eol.LF', "LF"),
                    nls.localize('eol.CRLF', "CRLF"),
                    nls.localize('eol.auto', "Uses operating system specific end of line character.")
                ],
                'default': 'auto',
                'description': nls.localize('eol', "The default end of line character."),
                'scope': 5 /* LANGUAGE_OVERRIDABLE */
            },
            'files.enableTrash': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('useTrash', "Moves files/folders to the OS trash (recycle bin on Windows) when deleting. Disabling this will delete files/folders permanently.")
            },
            'files.trimTrailingWhitespace': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('trimTrailingWhitespace', "When enabled, will trim trailing whitespace when saving a file."),
                'scope': 5 /* LANGUAGE_OVERRIDABLE */
            },
            'files.insertFinalNewline': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('insertFinalNewline', "When enabled, insert a final new line at the end of the file when saving it."),
                'scope': 5 /* LANGUAGE_OVERRIDABLE */
            },
            'files.trimFinalNewlines': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('trimFinalNewlines', "When enabled, will trim all new lines after the final new line at the end of the file when saving it."),
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
            },
            'files.autoSave': {
                'type': 'string',
                'enum': [files_1.AutoSaveConfiguration.OFF, files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE],
                'markdownEnumDescriptions': [
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.off' }, "A dirty editor is never automatically saved."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.afterDelay' }, "A dirty editor is automatically saved after the configured `#files.autoSaveDelay#`."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.onFocusChange' }, "A dirty editor is automatically saved when the editor loses focus."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.onWindowChange' }, "A dirty editor is automatically saved when the window loses focus.")
                ],
                'default': platform.isWeb ? files_1.AutoSaveConfiguration.AFTER_DELAY : files_1.AutoSaveConfiguration.OFF,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSave' }, "Controls auto save of dirty editors. Read more about autosave [here](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save).", files_1.AutoSaveConfiguration.OFF, files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE, files_1.AutoSaveConfiguration.AFTER_DELAY)
            },
            'files.autoSaveDelay': {
                'type': 'number',
                'default': 1000,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSaveDelay' }, "Controls the delay in ms after which a dirty editor is saved automatically. Only applies when `#files.autoSave#` is set to `{0}`.", files_1.AutoSaveConfiguration.AFTER_DELAY)
            },
            'files.watcherExclude': {
                'type': 'object',
                'default': platform.isWindows /* https://github.com/Microsoft/vscode/issues/23954 */ ? { '**/.git/objects/**': true, '**/.git/subtree-cache/**': true, '**/node_modules/*/**': true, '**/.hg/store/**': true } : { '**/.git/objects/**': true, '**/.git/subtree-cache/**': true, '**/node_modules/**': true, '**/.hg/store/**': true },
                'description': nls.localize('watcherExclude', "Configure glob patterns of file paths to exclude from file watching. Patterns must match on absolute paths (i.e. prefix with ** or the full path to match properly). Changing this setting requires a restart. When you experience Code consuming lots of CPU time on startup, you can exclude large folders to reduce the initial load."),
                'scope': 4 /* RESOURCE */
            },
            'files.hotExit': hotExitConfiguration,
            'files.defaultLanguage': {
                'type': 'string',
                'markdownDescription': nls.localize('defaultLanguage', "The default language mode that is assigned to new files. If configured to `${activeEditorLanguage}`, will use the language mode of the currently active text editor if any.")
            },
            'files.maxMemoryForLargeFilesMB': {
                'type': 'number',
                'default': 4096,
                'markdownDescription': nls.localize('maxMemoryForLargeFilesMB', "Controls the memory available to VS Code after restart when trying to open large files. Same effect as specifying `--max-memory=NEWSIZE` on the command line."),
                included: platform.isNative
            },
            'files.restoreUndoStack': {
                'type': 'boolean',
                'description': nls.localize('files.restoreUndoStack', "Restore the undo stack when a file is reopened."),
                'default': true
            },
            'files.saveConflictResolution': {
                'type': 'string',
                'enum': [
                    'askUser',
                    'overwriteFileOnDisk'
                ],
                'enumDescriptions': [
                    nls.localize('askUser', "Will refuse to save and ask for resolving the save conflict manually."),
                    nls.localize('overwriteFileOnDisk', "Will resolve the save conflict by overwriting the file on disk with the changes in the editor.")
                ],
                'description': nls.localize('files.saveConflictResolution', "A save conflict can occur when a file is saved to disk that was changed by another program in the meantime. To prevent data loss, the user is asked to compare the changes in the editor with the version on disk. This setting should only be changed if you frequently encounter save conflict errors and may result in data loss if used without caution."),
                'default': 'askUser',
                'scope': 5 /* LANGUAGE_OVERRIDABLE */
            },
            'files.simpleDialog.enable': {
                'type': 'boolean',
                'description': nls.localize('files.simpleDialog.enable', "Enables the simple file dialog. The simple file dialog replaces the system file dialog when enabled."),
                'default': false
            }
        }
    });
    configurationRegistry.registerConfiguration(Object.assign(Object.assign({}, commonEditorConfig_1.editorConfigurationBaseNode), { properties: {
            'editor.formatOnSave': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('formatOnSave', "Format a file on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down."),
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
            }
        } }));
    configurationRegistry.registerConfiguration({
        'id': 'explorer',
        'order': 10,
        'title': nls.localize('explorerConfigurationTitle', "File Explorer"),
        'type': 'object',
        'properties': {
            'explorer.openEditors.visible': {
                'type': 'number',
                'description': nls.localize({ key: 'openEditorsVisible', comment: ['Open is an adjective'] }, "Number of editors shown in the Open Editors pane."),
                'default': 9
            },
            'explorer.autoReveal': {
                'type': ['boolean', 'string'],
                'enum': [true, false, 'focusNoScroll'],
                'default': true,
                'enumDescriptions': [
                    nls.localize('autoReveal.on', 'Files will be revealed and selected.'),
                    nls.localize('autoReveal.off', 'Files will not be revealed and selected.'),
                    nls.localize('autoReveal.focusNoScroll', 'Files will not be scrolled into view, but will still be focused.'),
                ],
                'description': nls.localize('autoReveal', "Controls whether the explorer should automatically reveal and select files when opening them.")
            },
            'explorer.enableDragAndDrop': {
                'type': 'boolean',
                'description': nls.localize('enableDragAndDrop', "Controls whether the explorer should allow to move files and folders via drag and drop."),
                'default': true
            },
            'explorer.confirmDragAndDrop': {
                'type': 'boolean',
                'description': nls.localize('confirmDragAndDrop', "Controls whether the explorer should ask for confirmation to move files and folders via drag and drop."),
                'default': true
            },
            'explorer.confirmDelete': {
                'type': 'boolean',
                'description': nls.localize('confirmDelete', "Controls whether the explorer should ask for confirmation when deleting a file via the trash."),
                'default': true
            },
            'explorer.sortOrder': {
                'type': 'string',
                'enum': ["default" /* Default */, "mixed" /* Mixed */, "filesFirst" /* FilesFirst */, "type" /* Type */, "modified" /* Modified */],
                'default': "default" /* Default */,
                'enumDescriptions': [
                    nls.localize('sortOrder.default', 'Files and folders are sorted by their names, in alphabetical order. Folders are displayed before files.'),
                    nls.localize('sortOrder.mixed', 'Files and folders are sorted by their names, in alphabetical order. Files are interwoven with folders.'),
                    nls.localize('sortOrder.filesFirst', 'Files and folders are sorted by their names, in alphabetical order. Files are displayed before folders.'),
                    nls.localize('sortOrder.type', 'Files and folders are sorted by their extensions, in alphabetical order. Folders are displayed before files.'),
                    nls.localize('sortOrder.modified', 'Files and folders are sorted by last modified date, in descending order. Folders are displayed before files.')
                ],
                'description': nls.localize('sortOrder', "Controls sorting order of files and folders in the explorer.")
            },
            'explorer.decorations.colors': {
                type: 'boolean',
                description: nls.localize('explorer.decorations.colors', "Controls whether file decorations should use colors."),
                default: true
            },
            'explorer.decorations.badges': {
                type: 'boolean',
                description: nls.localize('explorer.decorations.badges', "Controls whether file decorations should use badges."),
                default: true
            },
            'explorer.incrementalNaming': {
                enum: ['simple', 'smart'],
                enumDescriptions: [
                    nls.localize('simple', "Appends the word \"copy\" at the end of the duplicated name potentially followed by a number"),
                    nls.localize('smart', "Adds a number at the end of the duplicated name. If some number is already part of the name, tries to increase that number")
                ],
                description: nls.localize('explorer.incrementalNaming', "Controls what naming strategy to use when a giving a new name to a duplicated explorer item on paste."),
                default: 'simple'
            },
            'explorer.compactFolders': {
                'type': 'boolean',
                'description': nls.localize('compressSingleChildFolders', "Controls whether the explorer should render folders in a compact form. In such a form, single child folders will be compressed in a combined tree element. Useful for Java package structures, for example."),
                'default': true
            },
        }
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '3_views',
        command: {
            id: files_2.VIEWLET_ID,
            title: nls.localize({ key: 'miViewExplorer', comment: ['&& denotes a mnemonic'] }, "&&Explorer")
        },
        order: 1
    });
});
//# __sourceMappingURL=files.contribution.js.map