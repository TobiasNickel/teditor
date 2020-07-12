/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.knownTermMappings = exports.knownAcronyms = exports.tocData = exports.commonlyUsedData = void 0;
    exports.commonlyUsedData = {
        id: 'commonlyUsed',
        label: nls_1.localize('commonlyUsed', "Commonly Used"),
        settings: ['files.autoSave', 'editor.fontSize', 'editor.fontFamily', 'editor.tabSize', 'editor.renderWhitespace', 'editor.cursorStyle', 'editor.multiCursorModifier', 'editor.insertSpaces', 'editor.wordWrap', 'files.exclude', 'files.associations']
    };
    exports.tocData = {
        id: 'root',
        label: 'root',
        children: [
            {
                id: 'editor',
                label: nls_1.localize('textEditor', "Text Editor"),
                settings: ['editor.*'],
                children: [
                    {
                        id: 'editor/cursor',
                        label: nls_1.localize('cursor', "Cursor"),
                        settings: ['editor.cursor*']
                    },
                    {
                        id: 'editor/find',
                        label: nls_1.localize('find', "Find"),
                        settings: ['editor.find.*']
                    },
                    {
                        id: 'editor/font',
                        label: nls_1.localize('font', "Font"),
                        settings: ['editor.font*']
                    },
                    {
                        id: 'editor/format',
                        label: nls_1.localize('formatting', "Formatting"),
                        settings: ['editor.format*']
                    },
                    {
                        id: 'editor/diffEditor',
                        label: nls_1.localize('diffEditor', "Diff Editor"),
                        settings: ['diffEditor.*']
                    },
                    {
                        id: 'editor/minimap',
                        label: nls_1.localize('minimap', "Minimap"),
                        settings: ['editor.minimap.*']
                    },
                    {
                        id: 'editor/suggestions',
                        label: nls_1.localize('suggestions', "Suggestions"),
                        settings: ['editor.*suggest*']
                    },
                    {
                        id: 'editor/files',
                        label: nls_1.localize('files', "Files"),
                        settings: ['files.*']
                    }
                ]
            },
            {
                id: 'workbench',
                label: nls_1.localize('workbench', "Workbench"),
                settings: ['workbench.*'],
                children: [
                    {
                        id: 'workbench/appearance',
                        label: nls_1.localize('appearance', "Appearance"),
                        settings: ['workbench.activityBar.*', 'workbench.*color*', 'workbench.fontAliasing', 'workbench.iconTheme', 'workbench.sidebar.location', 'workbench.*.visible', 'workbench.tips.enabled', 'workbench.tree.*', 'workbench.view.*']
                    },
                    {
                        id: 'workbench/breadcrumbs',
                        label: nls_1.localize('breadcrumbs', "Breadcrumbs"),
                        settings: ['breadcrumbs.*']
                    },
                    {
                        id: 'workbench/editor',
                        label: nls_1.localize('editorManagement', "Editor Management"),
                        settings: ['workbench.editor.*']
                    },
                    {
                        id: 'workbench/settings',
                        label: nls_1.localize('settings', "Settings Editor"),
                        settings: ['workbench.settings.*']
                    },
                    {
                        id: 'workbench/zenmode',
                        label: nls_1.localize('zenMode', "Zen Mode"),
                        settings: ['zenmode.*']
                    },
                    {
                        id: 'workbench/screencastmode',
                        label: nls_1.localize('screencastMode', "Screencast Mode"),
                        settings: ['screencastMode.*']
                    }
                ]
            },
            {
                id: 'window',
                label: nls_1.localize('window', "Window"),
                settings: ['window.*'],
                children: [
                    {
                        id: 'window/newWindow',
                        label: nls_1.localize('newWindow', "New Window"),
                        settings: ['window.*newwindow*']
                    }
                ]
            },
            {
                id: 'features',
                label: nls_1.localize('features', "Features"),
                children: [
                    {
                        id: 'features/explorer',
                        label: nls_1.localize('fileExplorer', "Explorer"),
                        settings: ['explorer.*', 'outline.*']
                    },
                    {
                        id: 'features/search',
                        label: nls_1.localize('search', "Search"),
                        settings: ['search.*']
                    },
                    {
                        id: 'features/debug',
                        label: nls_1.localize('debug', "Debug"),
                        settings: ['debug.*', 'launch']
                    },
                    {
                        id: 'features/scm',
                        label: nls_1.localize('scm', "SCM"),
                        settings: ['scm.*']
                    },
                    {
                        id: 'features/extensions',
                        label: nls_1.localize('extensions', "Extensions"),
                        settings: ['extensions.*']
                    },
                    {
                        id: 'features/terminal',
                        label: nls_1.localize('terminal', "Terminal"),
                        settings: ['terminal.*']
                    },
                    {
                        id: 'features/task',
                        label: nls_1.localize('task', "Task"),
                        settings: ['task.*']
                    },
                    {
                        id: 'features/problems',
                        label: nls_1.localize('problems', "Problems"),
                        settings: ['problems.*']
                    },
                    {
                        id: 'features/output',
                        label: nls_1.localize('output', "Output"),
                        settings: ['output.*']
                    },
                    {
                        id: 'features/comments',
                        label: nls_1.localize('comments', "Comments"),
                        settings: ['comments.*']
                    },
                    {
                        id: 'features/remote',
                        label: nls_1.localize('remote', "Remote"),
                        settings: ['remote.*']
                    },
                    {
                        id: 'features/timeline',
                        label: nls_1.localize('timeline', "Timeline"),
                        settings: ['timeline.*']
                    },
                    {
                        id: 'features/notebook',
                        label: nls_1.localize('notebook', 'Notebook'),
                        settings: ['notebook.*']
                    }
                ]
            },
            {
                id: 'application',
                label: nls_1.localize('application', "Application"),
                children: [
                    {
                        id: 'application/http',
                        label: nls_1.localize('proxy', "Proxy"),
                        settings: ['http.*']
                    },
                    {
                        id: 'application/keyboard',
                        label: nls_1.localize('keyboard', "Keyboard"),
                        settings: ['keyboard.*']
                    },
                    {
                        id: 'application/update',
                        label: nls_1.localize('update', "Update"),
                        settings: ['update.*']
                    },
                    {
                        id: 'application/telemetry',
                        label: nls_1.localize('telemetry', "Telemetry"),
                        settings: ['telemetry.*']
                    },
                    {
                        id: 'application/sync',
                        label: nls_1.localize('sync', "Sync"),
                        settings: ['sync.*']
                    }
                ]
            }
        ]
    };
    exports.knownAcronyms = new Set();
    [
        'css',
        'html',
        'scss',
        'less',
        'json',
        'js',
        'ts',
        'ie',
        'id',
        'php',
    ].forEach(str => exports.knownAcronyms.add(str));
    exports.knownTermMappings = new Map();
    exports.knownTermMappings.set('power shell', 'PowerShell');
    exports.knownTermMappings.set('powershell', 'PowerShell');
    exports.knownTermMappings.set('javascript', 'JavaScript');
    exports.knownTermMappings.set('typescript', 'TypeScript');
});
//# __sourceMappingURL=settingsLayout.js.map