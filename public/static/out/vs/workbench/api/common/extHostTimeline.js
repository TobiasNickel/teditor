/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostTypes"], function (require, exports, uri_1, instantiation_1, extHost_protocol_1, lifecycle_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTimeline = exports.IExtHostTimeline = void 0;
    exports.IExtHostTimeline = instantiation_1.createDecorator('IExtHostTimeline');
    class ExtHostTimeline {
        constructor(mainContext, commands) {
            this._providers = new Map();
            this._itemsBySourceAndUriMap = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTimeline);
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    var _a, _b;
                    if (arg && arg.$mid === 11) {
                        const uri = arg.uri === undefined ? undefined : uri_1.URI.revive(arg.uri);
                        return (_b = (_a = this._itemsBySourceAndUriMap.get(arg.source)) === null || _a === void 0 ? void 0 : _a.get(getUriKey(uri))) === null || _b === void 0 ? void 0 : _b.get(arg.handle);
                    }
                    return arg;
                }
            });
        }
        async $getTimeline(id, uri, options, token, internalOptions) {
            const provider = this._providers.get(id);
            return provider === null || provider === void 0 ? void 0 : provider.provideTimeline(uri_1.URI.revive(uri), options, token, internalOptions);
        }
        registerTimelineProvider(scheme, provider, _extensionId, commandConverter) {
            const timelineDisposables = new lifecycle_1.DisposableStore();
            const convertTimelineItem = this.convertTimelineItem(provider.id, commandConverter, timelineDisposables).bind(this);
            let disposable;
            if (provider.onDidChange) {
                disposable = provider.onDidChange(e => this._proxy.$emitTimelineChangeEvent(Object.assign(Object.assign({ uri: undefined, reset: true }, e), { id: provider.id })), this);
            }
            const itemsBySourceAndUriMap = this._itemsBySourceAndUriMap;
            return this.registerTimelineProviderCore(Object.assign(Object.assign({}, provider), { scheme: scheme, onDidChange: undefined, async provideTimeline(uri, options, token, internalOptions) {
                    var _a;
                    if (internalOptions === null || internalOptions === void 0 ? void 0 : internalOptions.resetCache) {
                        timelineDisposables.clear();
                        // For now, only allow the caching of a single Uri
                        // itemsBySourceAndUriMap.get(provider.id)?.get(getUriKey(uri))?.clear();
                        (_a = itemsBySourceAndUriMap.get(provider.id)) === null || _a === void 0 ? void 0 : _a.clear();
                    }
                    const result = await provider.provideTimeline(uri, options, token);
                    // Intentional == we don't know how a provider will respond
                    // eslint-disable-next-line eqeqeq
                    if (result == null) {
                        return undefined;
                    }
                    // TODO: Should we bother converting all the data if we aren't caching? Meaning it is being requested by an extension?
                    const convertItem = convertTimelineItem(uri, internalOptions);
                    return Object.assign(Object.assign({}, result), { source: provider.id, items: result.items.map(convertItem) });
                },
                dispose() {
                    var _a;
                    for (const sourceMap of itemsBySourceAndUriMap.values()) {
                        (_a = sourceMap.get(provider.id)) === null || _a === void 0 ? void 0 : _a.clear();
                    }
                    disposable === null || disposable === void 0 ? void 0 : disposable.dispose();
                    timelineDisposables.dispose();
                } }));
        }
        convertTimelineItem(source, commandConverter, disposables) {
            return (uri, options) => {
                let items;
                if (options === null || options === void 0 ? void 0 : options.cacheResults) {
                    let itemsByUri = this._itemsBySourceAndUriMap.get(source);
                    if (itemsByUri === undefined) {
                        itemsByUri = new Map();
                        this._itemsBySourceAndUriMap.set(source, itemsByUri);
                    }
                    const uriKey = getUriKey(uri);
                    items = itemsByUri.get(uriKey);
                    if (items === undefined) {
                        items = new Map();
                        itemsByUri.set(uriKey, items);
                    }
                }
                return (item) => {
                    var _a, _b;
                    const { iconPath } = item, props = __rest(item, ["iconPath"]);
                    const handle = `${source}|${(_a = item.id) !== null && _a !== void 0 ? _a : item.timestamp}`;
                    items === null || items === void 0 ? void 0 : items.set(handle, item);
                    let icon;
                    let iconDark;
                    let themeIcon;
                    if (item.iconPath) {
                        if (iconPath instanceof extHostTypes_1.ThemeIcon) {
                            themeIcon = { id: iconPath.id };
                        }
                        else if (uri_1.URI.isUri(iconPath)) {
                            icon = iconPath;
                            iconDark = iconPath;
                        }
                        else {
                            ({ light: icon, dark: iconDark } = iconPath);
                        }
                    }
                    return Object.assign(Object.assign({}, props), { id: (_b = props.id) !== null && _b !== void 0 ? _b : undefined, handle: handle, source: source, command: item.command ? commandConverter.toInternal(item.command, disposables) : undefined, icon: icon, iconDark: iconDark, themeIcon: themeIcon, accessibilityInformation: item.accessibilityInformation });
                };
            };
        }
        registerTimelineProviderCore(provider) {
            // console.log(`ExtHostTimeline#registerTimelineProvider: id=${provider.id}`);
            const existing = this._providers.get(provider.id);
            if (existing) {
                throw new Error(`Timeline Provider ${provider.id} already exists.`);
            }
            this._proxy.$registerTimelineProvider({
                id: provider.id,
                label: provider.label,
                scheme: provider.scheme
            });
            this._providers.set(provider.id, provider);
            return lifecycle_1.toDisposable(() => {
                var _a;
                for (const sourceMap of this._itemsBySourceAndUriMap.values()) {
                    (_a = sourceMap.get(provider.id)) === null || _a === void 0 ? void 0 : _a.clear();
                }
                this._providers.delete(provider.id);
                this._proxy.$unregisterTimelineProvider(provider.id);
                provider.dispose();
            });
        }
    }
    exports.ExtHostTimeline = ExtHostTimeline;
    function getUriKey(uri) {
        return uri === null || uri === void 0 ? void 0 : uri.toString();
    }
});
//# __sourceMappingURL=extHostTimeline.js.map