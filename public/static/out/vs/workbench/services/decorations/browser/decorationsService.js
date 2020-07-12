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
define(["require", "exports", "vs/base/common/event", "./decorations", "vs/base/common/map", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/linkedList", "vs/base/browser/dom", "vs/platform/theme/common/themeService", "vs/base/common/strings", "vs/nls", "vs/base/common/errors", "vs/base/common/cancellation", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/base/common/hash"], function (require, exports, event_1, decorations_1, map_1, lifecycle_1, async_1, linkedList_1, dom_1, themeService_1, strings_1, nls_1, errors_1, cancellation_1, extensions_1, log_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationsService = void 0;
    class DecorationRule {
        constructor(data, key) {
            this._refCounter = 0;
            this.data = data;
            const suffix = hash_1.hash(key).toString(36);
            this.itemColorClassName = `${DecorationRule._classNamesPrefix}-itemColor-${suffix}`;
            this.itemBadgeClassName = `${DecorationRule._classNamesPrefix}-itemBadge-${suffix}`;
            this.bubbleBadgeClassName = `${DecorationRule._classNamesPrefix}-bubbleBadge-${suffix}`;
        }
        static keyOf(data) {
            if (Array.isArray(data)) {
                return data.map(DecorationRule.keyOf).join(',');
            }
            else {
                const { color, letter } = data;
                return `${color}/${letter}`;
            }
        }
        acquire() {
            this._refCounter += 1;
        }
        release() {
            return --this._refCounter === 0;
        }
        appendCSSRules(element, theme) {
            if (!Array.isArray(this.data)) {
                this._appendForOne(this.data, element, theme);
            }
            else {
                this._appendForMany(this.data, element, theme);
            }
        }
        _appendForOne(data, element, theme) {
            const { color, letter } = data;
            // label
            dom_1.createCSSRule(`.${this.itemColorClassName}`, `color: ${getColor(theme, color)};`, element);
            // letter
            if (letter) {
                dom_1.createCSSRule(`.${this.itemBadgeClassName}::after`, `content: "${letter}"; color: ${getColor(theme, color)};`, element);
            }
        }
        _appendForMany(data, element, theme) {
            // label
            const { color } = data[0];
            dom_1.createCSSRule(`.${this.itemColorClassName}`, `color: ${getColor(theme, color)};`, element);
            // badge
            const letters = data.filter(d => !strings_1.isFalsyOrWhitespace(d.letter)).map(d => d.letter);
            if (letters.length) {
                dom_1.createCSSRule(`.${this.itemBadgeClassName}::after`, `content: "${letters.join(', ')}"; color: ${getColor(theme, color)};`, element);
            }
            // bubble badge
            // TODO @misolori update bubble badge to use class name instead of unicode
            dom_1.createCSSRule(`.${this.bubbleBadgeClassName}::after`, `content: "\uea71"; color: ${getColor(theme, color)}; font-family: codicon; font-size: 14px; padding-right: 14px; opacity: 0.4;`, element);
        }
        removeCSSRules(element) {
            dom_1.removeCSSRulesContainingSelector(this.itemColorClassName, element);
            dom_1.removeCSSRulesContainingSelector(this.itemBadgeClassName, element);
            dom_1.removeCSSRulesContainingSelector(this.bubbleBadgeClassName, element);
        }
    }
    DecorationRule._classNamesPrefix = 'monaco-decoration';
    class DecorationStyles {
        constructor(_themeService) {
            this._themeService = _themeService;
            this._styleElement = dom_1.createStyleSheet();
            this._decorationRules = new Map();
            this._dispoables = new lifecycle_1.DisposableStore();
            this._themeService.onDidColorThemeChange(this._onThemeChange, this, this._dispoables);
        }
        dispose() {
            this._dispoables.dispose();
            this._styleElement.remove();
        }
        asDecoration(data, onlyChildren) {
            // sort by weight
            data.sort((a, b) => (b.weight || 0) - (a.weight || 0));
            let key = DecorationRule.keyOf(data);
            let rule = this._decorationRules.get(key);
            if (!rule) {
                // new css rule
                rule = new DecorationRule(data, key);
                this._decorationRules.set(key, rule);
                rule.appendCSSRules(this._styleElement, this._themeService.getColorTheme());
            }
            rule.acquire();
            let labelClassName = rule.itemColorClassName;
            let badgeClassName = rule.itemBadgeClassName;
            let tooltip = data.filter(d => !strings_1.isFalsyOrWhitespace(d.tooltip)).map(d => d.tooltip).join(' • ');
            if (onlyChildren) {
                // show items from its children only
                badgeClassName = rule.bubbleBadgeClassName;
                tooltip = nls_1.localize('bubbleTitle', "Contains emphasized items");
            }
            return {
                labelClassName,
                badgeClassName,
                tooltip,
                dispose: () => {
                    if (rule && rule.release()) {
                        this._decorationRules.delete(key);
                        rule.removeCSSRules(this._styleElement);
                        rule = undefined;
                    }
                }
            };
        }
        _onThemeChange() {
            this._decorationRules.forEach(rule => {
                rule.removeCSSRules(this._styleElement);
                rule.appendCSSRules(this._styleElement, this._themeService.getColorTheme());
            });
        }
    }
    class FileDecorationChangeEvent {
        constructor() {
            this._data = map_1.TernarySearchTree.forUris();
        }
        affectsResource(uri) {
            return this._data.get(uri) || this._data.findSuperstr(uri) !== undefined;
        }
        static debouncer(last, current) {
            if (!last) {
                last = new FileDecorationChangeEvent();
            }
            if (Array.isArray(current)) {
                // many
                for (const uri of current) {
                    last._data.set(uri, true);
                }
            }
            else {
                // one
                last._data.set(current, true);
            }
            return last;
        }
    }
    class DecorationDataRequest {
        constructor(source, thenable) {
            this.source = source;
            this.thenable = thenable;
        }
    }
    class DecorationProviderWrapper {
        constructor(provider, _uriEmitter, _flushEmitter) {
            this.provider = provider;
            this._uriEmitter = _uriEmitter;
            this._flushEmitter = _flushEmitter;
            this.data = map_1.TernarySearchTree.forUris();
            this._dispoable = this.provider.onDidChange(uris => {
                if (!uris) {
                    // flush event -> drop all data, can affect everything
                    this.data.clear();
                    this._flushEmitter.fire({ affectsResource() { return true; } });
                }
                else {
                    // selective changes -> drop for resource, fetch again, send event
                    // perf: the map stores thenables, decorations, or `null`-markers.
                    // we make us of that and ignore all uris in which we have never
                    // been interested.
                    for (const uri of uris) {
                        this._fetchData(uri);
                    }
                }
            });
        }
        dispose() {
            this._dispoable.dispose();
            this.data.clear();
        }
        knowsAbout(uri) {
            return Boolean(this.data.get(uri)) || Boolean(this.data.findSuperstr(uri));
        }
        getOrRetrieve(uri, includeChildren, callback) {
            let item = this.data.get(uri);
            if (item === undefined) {
                // unknown -> trigger request
                item = this._fetchData(uri);
            }
            if (item && !(item instanceof DecorationDataRequest)) {
                // found something (which isn't pending anymore)
                callback(item, false);
            }
            if (includeChildren) {
                // (resolved) children
                const iter = this.data.findSuperstr(uri);
                if (iter) {
                    for (let item = iter.next(); !item.done; item = iter.next()) {
                        if (item.value && !(item.value instanceof DecorationDataRequest)) {
                            callback(item.value, true);
                        }
                    }
                }
            }
        }
        _fetchData(uri) {
            // check for pending request and cancel it
            const pendingRequest = this.data.get(uri);
            if (pendingRequest instanceof DecorationDataRequest) {
                pendingRequest.source.cancel();
                this.data.delete(uri);
            }
            const source = new cancellation_1.CancellationTokenSource();
            const dataOrThenable = this.provider.provideDecorations(uri, source.token);
            if (!async_1.isThenable(dataOrThenable)) {
                // sync -> we have a result now
                return this._keepItem(uri, dataOrThenable);
            }
            else {
                // async -> we have a result soon
                const request = new DecorationDataRequest(source, Promise.resolve(dataOrThenable).then(data => {
                    if (this.data.get(uri) === request) {
                        this._keepItem(uri, data);
                    }
                }).catch(err => {
                    if (!errors_1.isPromiseCanceledError(err) && this.data.get(uri) === request) {
                        this.data.delete(uri);
                    }
                }));
                this.data.set(uri, request);
                return null;
            }
        }
        _keepItem(uri, data) {
            const deco = data ? data : null;
            const old = this.data.set(uri, deco);
            if (deco || old) {
                // only fire event when something changed
                this._uriEmitter.fire(uri);
            }
            return deco;
        }
    }
    let DecorationsService = class DecorationsService {
        constructor(themeService, _logService) {
            this._logService = _logService;
            this._data = new linkedList_1.LinkedList();
            this._onDidChangeDecorationsDelayed = new event_1.Emitter();
            this._onDidChangeDecorations = new event_1.Emitter();
            this.onDidChangeDecorations = event_1.Event.any(this._onDidChangeDecorations.event, event_1.Event.debounce(this._onDidChangeDecorationsDelayed.event, FileDecorationChangeEvent.debouncer, undefined, undefined, 500));
            this._decorationStyles = new DecorationStyles(themeService);
        }
        dispose() {
            this._decorationStyles.dispose();
            this._onDidChangeDecorations.dispose();
            this._onDidChangeDecorationsDelayed.dispose();
        }
        registerDecorationsProvider(provider) {
            const wrapper = new DecorationProviderWrapper(provider, this._onDidChangeDecorationsDelayed, this._onDidChangeDecorations);
            const remove = this._data.push(wrapper);
            this._onDidChangeDecorations.fire({
                // everything might have changed
                affectsResource() { return true; }
            });
            return lifecycle_1.toDisposable(() => {
                // fire event that says 'yes' for any resource
                // known to this provider. then dispose and remove it.
                remove();
                this._onDidChangeDecorations.fire({ affectsResource: uri => wrapper.knowsAbout(uri) });
                wrapper.dispose();
            });
        }
        getDecoration(uri, includeChildren) {
            let data = [];
            let containsChildren = false;
            for (let wrapper of this._data) {
                wrapper.getOrRetrieve(uri, includeChildren, (deco, isChild) => {
                    if (!isChild || deco.bubble) {
                        data.push(deco);
                        containsChildren = isChild || containsChildren;
                        this._logService.trace('DecorationsService#getDecoration#getOrRetrieve', wrapper.provider.label, deco, isChild, uri);
                    }
                });
            }
            return data.length === 0
                ? undefined
                : this._decorationStyles.asDecoration(data, containsChildren);
        }
    };
    DecorationsService = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, log_1.ILogService)
    ], DecorationsService);
    exports.DecorationsService = DecorationsService;
    function getColor(theme, color) {
        if (color) {
            const foundColor = theme.getColor(color);
            if (foundColor) {
                return foundColor;
            }
        }
        return 'inherit';
    }
    extensions_1.registerSingleton(decorations_1.IDecorationsService, DecorationsService, true);
});
//# __sourceMappingURL=decorationsService.js.map