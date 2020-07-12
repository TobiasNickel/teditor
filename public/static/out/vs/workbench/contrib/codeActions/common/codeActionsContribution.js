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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/contrib/codeAction/codeAction", "vs/editor/contrib/codeAction/types", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/editor/common/config/commonEditorConfig"], function (require, exports, arrays_1, event_1, lifecycle_1, codeAction_1, types_1, nls, configurationRegistry_1, keybinding_1, platform_1, commonEditorConfig_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionsContribution = exports.editorConfiguration = void 0;
    const codeActionsOnSaveDefaultProperties = Object.freeze({
        'source.fixAll': {
            type: 'boolean',
            description: nls.localize('codeActionsOnSave.fixAll', "Controls whether auto fix action should be run on file save.")
        }
    });
    const codeActionsOnSaveSchema = {
        oneOf: [
            {
                type: 'object',
                properties: codeActionsOnSaveDefaultProperties,
                additionalProperties: {
                    type: 'boolean'
                },
            },
            {
                type: 'array',
                items: { type: 'string' }
            }
        ],
        default: {},
        description: nls.localize('codeActionsOnSave', "Code action kinds to be run on save."),
        scope: 5 /* LANGUAGE_OVERRIDABLE */,
    };
    exports.editorConfiguration = Object.freeze(Object.assign(Object.assign({}, commonEditorConfig_1.editorConfigurationBaseNode), { properties: {
            'editor.codeActionsOnSave': codeActionsOnSaveSchema
        } }));
    let CodeActionsContribution = class CodeActionsContribution extends lifecycle_1.Disposable {
        constructor(codeActionsExtensionPoint, keybindingService) {
            super();
            this._contributedCodeActions = [];
            this._onDidChangeContributions = this._register(new event_1.Emitter());
            codeActionsExtensionPoint.setHandler(extensionPoints => {
                this._contributedCodeActions = arrays_1.flatten(extensionPoints.map(x => x.value));
                this.updateConfigurationSchema(this._contributedCodeActions);
                this._onDidChangeContributions.fire();
            });
            keybindingService.registerSchemaContribution({
                getSchemaAdditions: () => this.getSchemaAdditions(),
                onDidChange: this._onDidChangeContributions.event,
            });
        }
        updateConfigurationSchema(codeActionContributions) {
            const newProperties = Object.assign({}, codeActionsOnSaveDefaultProperties);
            for (const [sourceAction, props] of this.getSourceActions(codeActionContributions)) {
                newProperties[sourceAction] = {
                    type: 'boolean',
                    description: nls.localize('codeActionsOnSave.generic', "Controls whether '{0}' actions should be run on file save.", props.title)
                };
            }
            codeActionsOnSaveSchema.properties = newProperties;
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                .notifyConfigurationSchemaUpdated(exports.editorConfiguration);
        }
        getSourceActions(contributions) {
            const defaultKinds = Object.keys(codeActionsOnSaveDefaultProperties).map(value => new types_1.CodeActionKind(value));
            const sourceActions = new Map();
            for (const contribution of contributions) {
                for (const action of contribution.actions) {
                    const kind = new types_1.CodeActionKind(action.kind);
                    if (types_1.CodeActionKind.Source.contains(kind)
                        // Exclude any we already included by default
                        && !defaultKinds.some(defaultKind => defaultKind.contains(kind))) {
                        sourceActions.set(kind.value, action);
                    }
                }
            }
            return sourceActions;
        }
        getSchemaAdditions() {
            const conditionalSchema = (command, actions) => {
                return {
                    if: {
                        properties: {
                            'command': { const: command }
                        }
                    },
                    then: {
                        properties: {
                            'args': {
                                required: ['kind'],
                                properties: {
                                    'kind': {
                                        anyOf: [
                                            {
                                                enum: actions.map(action => action.kind),
                                                enumDescriptions: actions.map(action => { var _a; return (_a = action.description) !== null && _a !== void 0 ? _a : action.title; }),
                                            },
                                            { type: 'string' },
                                        ]
                                    }
                                }
                            }
                        }
                    }
                };
            };
            const getActions = (ofKind) => {
                const allActions = arrays_1.flatten(this._contributedCodeActions.map(desc => desc.actions.slice()));
                const out = new Map();
                for (const action of allActions) {
                    if (!out.has(action.kind) && ofKind.contains(new types_1.CodeActionKind(action.kind))) {
                        out.set(action.kind, action);
                    }
                }
                return Array.from(out.values());
            };
            return [
                conditionalSchema(codeAction_1.codeActionCommandId, getActions(types_1.CodeActionKind.Empty)),
                conditionalSchema(codeAction_1.refactorCommandId, getActions(types_1.CodeActionKind.Refactor)),
                conditionalSchema(codeAction_1.sourceActionCommandId, getActions(types_1.CodeActionKind.Source)),
            ];
        }
    };
    CodeActionsContribution = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], CodeActionsContribution);
    exports.CodeActionsContribution = CodeActionsContribution;
});
//# __sourceMappingURL=codeActionsContribution.js.map