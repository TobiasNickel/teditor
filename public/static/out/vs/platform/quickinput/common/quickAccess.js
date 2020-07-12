/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/base/common/arrays", "vs/base/common/lifecycle"], function (require, exports, platform_1, arrays_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessRegistry = exports.Extensions = exports.DefaultQuickAccessFilterValue = void 0;
    var DefaultQuickAccessFilterValue;
    (function (DefaultQuickAccessFilterValue) {
        /**
         * Keep the value as it is given to quick access.
         */
        DefaultQuickAccessFilterValue[DefaultQuickAccessFilterValue["PRESERVE"] = 0] = "PRESERVE";
        /**
         * Use the value that was used last time something was accepted from the picker.
         */
        DefaultQuickAccessFilterValue[DefaultQuickAccessFilterValue["LAST"] = 1] = "LAST";
    })(DefaultQuickAccessFilterValue = exports.DefaultQuickAccessFilterValue || (exports.DefaultQuickAccessFilterValue = {}));
    exports.Extensions = {
        Quickaccess: 'workbench.contributions.quickaccess'
    };
    class QuickAccessRegistry {
        constructor() {
            this.providers = [];
            this.defaultProvider = undefined;
        }
        registerQuickAccessProvider(provider) {
            // Extract the default provider when no prefix is present
            if (provider.prefix.length === 0) {
                this.defaultProvider = provider;
            }
            else {
                this.providers.push(provider);
            }
            // sort the providers by decreasing prefix length, such that longer
            // prefixes take priority: 'ext' vs 'ext install' - the latter should win
            this.providers.sort((providerA, providerB) => providerB.prefix.length - providerA.prefix.length);
            return lifecycle_1.toDisposable(() => {
                this.providers.splice(this.providers.indexOf(provider), 1);
                if (this.defaultProvider === provider) {
                    this.defaultProvider = undefined;
                }
            });
        }
        getQuickAccessProviders() {
            return arrays_1.coalesce([this.defaultProvider, ...this.providers]);
        }
        getQuickAccessProvider(prefix) {
            const result = prefix ? (this.providers.find(provider => prefix.startsWith(provider.prefix)) || undefined) : undefined;
            return result || this.defaultProvider;
        }
        clear() {
            const providers = [...this.providers];
            const defaultProvider = this.defaultProvider;
            this.providers = [];
            this.defaultProvider = undefined;
            return () => {
                this.providers = providers;
                this.defaultProvider = defaultProvider;
            };
        }
    }
    exports.QuickAccessRegistry = QuickAccessRegistry;
    platform_1.Registry.add(exports.Extensions.Quickaccess, new QuickAccessRegistry());
});
//# __sourceMappingURL=quickAccess.js.map