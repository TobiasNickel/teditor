/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "./viewsWelcomeExtensionPoint", "vs/platform/registry/common/platform", "vs/workbench/common/views"], function (require, exports, lifecycle_1, contextkey_1, viewsWelcomeExtensionPoint_1, platform_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewsWelcomeContribution = void 0;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    class ViewsWelcomeContribution extends lifecycle_1.Disposable {
        constructor(extensionPoint) {
            super();
            this.viewWelcomeContents = new Map();
            extensionPoint.setHandler((_, { added, removed }) => {
                var _a;
                for (const contribution of removed) {
                    for (const welcome of contribution.value) {
                        const disposable = this.viewWelcomeContents.get(welcome);
                        if (disposable) {
                            disposable.dispose();
                        }
                    }
                }
                for (const contribution of added) {
                    for (const welcome of contribution.value) {
                        const id = (_a = viewsWelcomeExtensionPoint_1.ViewIdentifierMap[welcome.view]) !== null && _a !== void 0 ? _a : welcome.view;
                        const disposable = viewsRegistry.registerViewWelcomeContent(id, {
                            content: welcome.contents,
                            when: contextkey_1.ContextKeyExpr.deserialize(welcome.when),
                            priority: contribution.description.isBuiltin ? views_1.ViewContentPriority.Low : views_1.ViewContentPriority.Lowest
                        });
                        this.viewWelcomeContents.set(welcome, disposable);
                    }
                }
            });
        }
    }
    exports.ViewsWelcomeContribution = ViewsWelcomeContribution;
});
//# __sourceMappingURL=viewsWelcomeContribution.js.map