/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/async"], function (require, exports, instantiation_1, lifecycle_1, platform_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = void 0;
    var Extensions;
    (function (Extensions) {
        Extensions.Workbench = 'workbench.contributions.kind';
    })(Extensions = exports.Extensions || (exports.Extensions = {}));
    class WorkbenchContributionsRegistry {
        constructor() {
            this.toBeInstantiated = new Map();
        }
        registerWorkbenchContribution(ctor, phase = 1 /* Starting */) {
            // Instantiate directly if we are already matching the provided phase
            if (this.instantiationService && this.lifecycleService && this.lifecycleService.phase >= phase) {
                this.instantiationService.createInstance(ctor);
            }
            // Otherwise keep contributions by lifecycle phase
            else {
                let toBeInstantiated = this.toBeInstantiated.get(phase);
                if (!toBeInstantiated) {
                    toBeInstantiated = [];
                    this.toBeInstantiated.set(phase, toBeInstantiated);
                }
                toBeInstantiated.push(ctor);
            }
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const lifecycleService = this.lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
            [1 /* Starting */, 2 /* Ready */, 3 /* Restored */, 4 /* Eventually */].forEach(phase => {
                this.instantiateByPhase(instantiationService, lifecycleService, phase);
            });
        }
        instantiateByPhase(instantiationService, lifecycleService, phase) {
            // Instantiate contributions directly when phase is already reached
            if (lifecycleService.phase >= phase) {
                this.doInstantiateByPhase(instantiationService, phase);
            }
            // Otherwise wait for phase to be reached
            else {
                lifecycleService.when(phase).then(() => this.doInstantiateByPhase(instantiationService, phase));
            }
        }
        doInstantiateByPhase(instantiationService, phase) {
            const toBeInstantiated = this.toBeInstantiated.get(phase);
            if (toBeInstantiated) {
                this.toBeInstantiated.delete(phase);
                if (phase !== 4 /* Eventually */) {
                    // instantiate everything synchronously and blocking
                    for (const ctor of toBeInstantiated) {
                        this.safeCreateInstance(instantiationService, ctor); // catch error so that other contributions are still considered
                    }
                }
                else {
                    // for the Eventually-phase we instantiate contributions
                    // only when idle. this might take a few idle-busy-cycles
                    // but will finish within the timeouts
                    let forcedTimeout = 3000;
                    let i = 0;
                    let instantiateSome = (idle) => {
                        while (i < toBeInstantiated.length) {
                            const ctor = toBeInstantiated[i++];
                            this.safeCreateInstance(instantiationService, ctor); // catch error so that other contributions are still considered
                            if (idle.timeRemaining() < 1) {
                                // time is up -> reschedule
                                async_1.runWhenIdle(instantiateSome, forcedTimeout);
                                break;
                            }
                        }
                    };
                    async_1.runWhenIdle(instantiateSome, forcedTimeout);
                }
            }
        }
        safeCreateInstance(instantiationService, ctor) {
            try {
                instantiationService.createInstance(ctor);
            }
            catch (error) {
                console.error(`Unable to instantiate workbench contribution ${ctor.name}.`, error);
            }
        }
    }
    platform_1.Registry.add(Extensions.Workbench, new WorkbenchContributionsRegistry());
});
//# __sourceMappingURL=contributions.js.map