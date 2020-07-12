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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/modes", "vs/editor/contrib/codeAction/types", "vs/platform/contextkey/common/contextkey"], function (require, exports, lifecycle_1, modes, types_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionDocumentationContribution = void 0;
    let CodeActionDocumentationContribution = class CodeActionDocumentationContribution extends lifecycle_1.Disposable {
        constructor(extensionPoint, contextKeyService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contributions = [];
            this.emptyCodeActionsList = {
                actions: [],
                dispose: () => { }
            };
            this._register(modes.CodeActionProviderRegistry.register('*', this));
            extensionPoint.setHandler(points => {
                this.contributions = [];
                for (const documentation of points) {
                    if (!documentation.value.refactoring) {
                        continue;
                    }
                    for (const contribution of documentation.value.refactoring) {
                        const precondition = contextkey_1.ContextKeyExpr.deserialize(contribution.when);
                        if (!precondition) {
                            continue;
                        }
                        this.contributions.push({
                            title: contribution.title,
                            when: precondition,
                            command: contribution.command
                        });
                    }
                }
            });
        }
        async provideCodeActions(_model, _range, context, _token) {
            return this.emptyCodeActionsList;
        }
        _getAdditionalMenuItems(context, actions) {
            if (context.only !== types_1.CodeActionKind.Refactor.value) {
                if (!actions.some(action => action.kind && types_1.CodeActionKind.Refactor.contains(new types_1.CodeActionKind(action.kind)))) {
                    return [];
                }
            }
            return this.contributions
                .filter(contribution => this.contextKeyService.contextMatchesRules(contribution.when))
                .map(contribution => {
                return {
                    id: contribution.command,
                    title: contribution.title
                };
            });
        }
    };
    CodeActionDocumentationContribution = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], CodeActionDocumentationContribution);
    exports.CodeActionDocumentationContribution = CodeActionDocumentationContribution;
});
//# __sourceMappingURL=documentationContribution.js.map