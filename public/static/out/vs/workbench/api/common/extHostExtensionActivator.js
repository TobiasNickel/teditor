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
define(["require", "exports", "vs/nls", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log"], function (require, exports, nls, extensions_1, extensions_2, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsActivator = exports.FailedExtension = exports.HostExtension = exports.EmptyExtension = exports.ActivatedExtension = exports.ExtensionActivationTimesBuilder = exports.ExtensionActivationTimes = void 0;
    const NO_OP_VOID_PROMISE = Promise.resolve(undefined);
    class ExtensionActivationTimes {
        constructor(startup, codeLoadingTime, activateCallTime, activateResolvedTime) {
            this.startup = startup;
            this.codeLoadingTime = codeLoadingTime;
            this.activateCallTime = activateCallTime;
            this.activateResolvedTime = activateResolvedTime;
        }
    }
    exports.ExtensionActivationTimes = ExtensionActivationTimes;
    ExtensionActivationTimes.NONE = new ExtensionActivationTimes(false, -1, -1, -1);
    class ExtensionActivationTimesBuilder {
        constructor(startup) {
            this._startup = startup;
            this._codeLoadingStart = -1;
            this._codeLoadingStop = -1;
            this._activateCallStart = -1;
            this._activateCallStop = -1;
            this._activateResolveStart = -1;
            this._activateResolveStop = -1;
        }
        _delta(start, stop) {
            if (start === -1 || stop === -1) {
                return -1;
            }
            return stop - start;
        }
        build() {
            return new ExtensionActivationTimes(this._startup, this._delta(this._codeLoadingStart, this._codeLoadingStop), this._delta(this._activateCallStart, this._activateCallStop), this._delta(this._activateResolveStart, this._activateResolveStop));
        }
        codeLoadingStart() {
            this._codeLoadingStart = Date.now();
        }
        codeLoadingStop() {
            this._codeLoadingStop = Date.now();
        }
        activateCallStart() {
            this._activateCallStart = Date.now();
        }
        activateCallStop() {
            this._activateCallStop = Date.now();
        }
        activateResolveStart() {
            this._activateResolveStart = Date.now();
        }
        activateResolveStop() {
            this._activateResolveStop = Date.now();
        }
    }
    exports.ExtensionActivationTimesBuilder = ExtensionActivationTimesBuilder;
    class ActivatedExtension {
        constructor(activationFailed, activationFailedError, activationTimes, module, exports, subscriptions) {
            this.activationFailed = activationFailed;
            this.activationFailedError = activationFailedError;
            this.activationTimes = activationTimes;
            this.module = module;
            this.exports = exports;
            this.subscriptions = subscriptions;
        }
    }
    exports.ActivatedExtension = ActivatedExtension;
    class EmptyExtension extends ActivatedExtension {
        constructor(activationTimes) {
            super(false, null, activationTimes, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    exports.EmptyExtension = EmptyExtension;
    class HostExtension extends ActivatedExtension {
        constructor() {
            super(false, null, ExtensionActivationTimes.NONE, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    exports.HostExtension = HostExtension;
    class FailedExtension extends ActivatedExtension {
        constructor(activationError) {
            super(true, activationError, ExtensionActivationTimes.NONE, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    exports.FailedExtension = FailedExtension;
    let ExtensionsActivator = class ExtensionsActivator {
        constructor(registry, resolvedExtensions, hostExtensions, host, _logService) {
            this._logService = _logService;
            this._registry = registry;
            this._resolvedExtensionsSet = new Set();
            resolvedExtensions.forEach((extensionId) => this._resolvedExtensionsSet.add(extensions_1.ExtensionIdentifier.toKey(extensionId)));
            this._hostExtensionsMap = new Map();
            hostExtensions.forEach((extensionId) => this._hostExtensionsMap.set(extensions_1.ExtensionIdentifier.toKey(extensionId), extensionId));
            this._host = host;
            this._activatingExtensions = new Map();
            this._activatedExtensions = new Map();
            this._alreadyActivatedEvents = Object.create(null);
        }
        isActivated(extensionId) {
            const extensionKey = extensions_1.ExtensionIdentifier.toKey(extensionId);
            return this._activatedExtensions.has(extensionKey);
        }
        getActivatedExtension(extensionId) {
            const extensionKey = extensions_1.ExtensionIdentifier.toKey(extensionId);
            const activatedExtension = this._activatedExtensions.get(extensionKey);
            if (!activatedExtension) {
                throw new Error('Extension `' + extensionId.value + '` is not known or not activated');
            }
            return activatedExtension;
        }
        activateByEvent(activationEvent, startup) {
            if (this._alreadyActivatedEvents[activationEvent]) {
                return NO_OP_VOID_PROMISE;
            }
            const activateExtensions = this._registry.getExtensionDescriptionsForActivationEvent(activationEvent);
            return this._activateExtensions(activateExtensions.map(e => ({
                id: e.identifier,
                reason: { startup, extensionId: e.identifier, activationEvent }
            }))).then(() => {
                this._alreadyActivatedEvents[activationEvent] = true;
            });
        }
        activateById(extensionId, reason) {
            const desc = this._registry.getExtensionDescription(extensionId);
            if (!desc) {
                throw new Error('Extension `' + extensionId + '` is not known');
            }
            return this._activateExtensions([{
                    id: desc.identifier,
                    reason
                }]);
        }
        /**
         * Handle semantics related to dependencies for `currentExtension`.
         * semantics: `redExtensions` must wait for `greenExtensions`.
         */
        _handleActivateRequest(currentActivation, greenExtensions, redExtensions) {
            if (this._hostExtensionsMap.has(extensions_1.ExtensionIdentifier.toKey(currentActivation.id))) {
                greenExtensions[extensions_1.ExtensionIdentifier.toKey(currentActivation.id)] = currentActivation;
                return;
            }
            const currentExtension = this._registry.getExtensionDescription(currentActivation.id);
            if (!currentExtension) {
                // Error condition 0: unknown extension
                this._host.onExtensionActivationError(currentActivation.id, new extensions_2.MissingDependencyError(currentActivation.id.value));
                const error = new Error(`Unknown dependency '${currentActivation.id.value}'`);
                this._activatedExtensions.set(extensions_1.ExtensionIdentifier.toKey(currentActivation.id), new FailedExtension(error));
                return;
            }
            const depIds = (typeof currentExtension.extensionDependencies === 'undefined' ? [] : currentExtension.extensionDependencies);
            let currentExtensionGetsGreenLight = true;
            for (let j = 0, lenJ = depIds.length; j < lenJ; j++) {
                const depId = depIds[j];
                if (this._resolvedExtensionsSet.has(extensions_1.ExtensionIdentifier.toKey(depId))) {
                    // This dependency is already resolved
                    continue;
                }
                const dep = this._activatedExtensions.get(extensions_1.ExtensionIdentifier.toKey(depId));
                if (dep && !dep.activationFailed) {
                    // the dependency is already activated OK
                    continue;
                }
                if (dep && dep.activationFailed) {
                    // Error condition 2: a dependency has already failed activation
                    this._host.onExtensionActivationError(currentExtension.identifier, nls.localize('failedDep1', "Cannot activate extension '{0}' because it depends on extension '{1}', which failed to activate.", currentExtension.displayName || currentExtension.identifier.value, depId));
                    const error = new Error(`Dependency ${depId} failed to activate`);
                    error.detail = dep.activationFailedError;
                    this._activatedExtensions.set(extensions_1.ExtensionIdentifier.toKey(currentExtension.identifier), new FailedExtension(error));
                    return;
                }
                if (this._hostExtensionsMap.has(extensions_1.ExtensionIdentifier.toKey(depId))) {
                    // must first wait for the dependency to activate
                    currentExtensionGetsGreenLight = false;
                    greenExtensions[extensions_1.ExtensionIdentifier.toKey(depId)] = {
                        id: this._hostExtensionsMap.get(extensions_1.ExtensionIdentifier.toKey(depId)),
                        reason: currentActivation.reason
                    };
                    continue;
                }
                const depDesc = this._registry.getExtensionDescription(depId);
                if (depDesc) {
                    // must first wait for the dependency to activate
                    currentExtensionGetsGreenLight = false;
                    greenExtensions[extensions_1.ExtensionIdentifier.toKey(depId)] = {
                        id: depDesc.identifier,
                        reason: currentActivation.reason
                    };
                    continue;
                }
                // Error condition 1: unknown dependency
                this._host.onExtensionActivationError(currentExtension.identifier, new extensions_2.MissingDependencyError(depId));
                const error = new Error(`Unknown dependency '${depId}'`);
                this._activatedExtensions.set(extensions_1.ExtensionIdentifier.toKey(currentExtension.identifier), new FailedExtension(error));
                return;
            }
            if (currentExtensionGetsGreenLight) {
                greenExtensions[extensions_1.ExtensionIdentifier.toKey(currentExtension.identifier)] = currentActivation;
            }
            else {
                redExtensions.push(currentActivation);
            }
        }
        _activateExtensions(extensions) {
            if (extensions.length === 0) {
                return Promise.resolve(undefined);
            }
            extensions = extensions.filter((p) => !this._activatedExtensions.has(extensions_1.ExtensionIdentifier.toKey(p.id)));
            if (extensions.length === 0) {
                return Promise.resolve(undefined);
            }
            const greenMap = Object.create(null), red = [];
            for (let i = 0, len = extensions.length; i < len; i++) {
                this._handleActivateRequest(extensions[i], greenMap, red);
            }
            // Make sure no red is also green
            for (let i = 0, len = red.length; i < len; i++) {
                const redExtensionKey = extensions_1.ExtensionIdentifier.toKey(red[i].id);
                if (greenMap[redExtensionKey]) {
                    delete greenMap[redExtensionKey];
                }
            }
            const green = Object.keys(greenMap).map(id => greenMap[id]);
            if (red.length === 0) {
                // Finally reached only leafs!
                return Promise.all(green.map((p) => this._activateExtension(p.id, p.reason))).then(_ => undefined);
            }
            return this._activateExtensions(green).then(_ => {
                return this._activateExtensions(red);
            });
        }
        _activateExtension(extensionId, reason) {
            const extensionKey = extensions_1.ExtensionIdentifier.toKey(extensionId);
            if (this._activatedExtensions.has(extensionKey)) {
                return Promise.resolve(undefined);
            }
            const currentlyActivatingExtension = this._activatingExtensions.get(extensionKey);
            if (currentlyActivatingExtension) {
                return currentlyActivatingExtension;
            }
            const newlyActivatingExtension = this._host.actualActivateExtension(extensionId, reason).then(undefined, (err) => {
                this._host.onExtensionActivationError(extensionId, nls.localize('activationError', "Activating extension '{0}' failed: {1}.", extensionId.value, err.message));
                this._logService.error(`Activating extension ${extensionId.value} failed due to an error:`);
                this._logService.error(err);
                // Treat the extension as being empty
                return new FailedExtension(err);
            }).then((x) => {
                this._activatedExtensions.set(extensionKey, x);
                this._activatingExtensions.delete(extensionKey);
            });
            this._activatingExtensions.set(extensionKey, newlyActivatingExtension);
            return newlyActivatingExtension;
        }
    };
    ExtensionsActivator = __decorate([
        __param(4, log_1.ILogService)
    ], ExtensionsActivator);
    exports.ExtensionsActivator = ExtensionsActivator;
});
//# __sourceMappingURL=extHostExtensionActivator.js.map