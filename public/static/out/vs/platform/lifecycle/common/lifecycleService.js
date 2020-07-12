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
define(["require", "exports", "vs/base/common/event", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/performance"], function (require, exports, event_1, async_1, lifecycle_1, lifecycle_2, log_1, performance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractLifecycleService = void 0;
    let AbstractLifecycleService = class AbstractLifecycleService extends lifecycle_1.Disposable {
        constructor(logService) {
            super();
            this.logService = logService;
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this.onBeforeShutdown = this._onBeforeShutdown.event;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onShutdown = this._register(new event_1.Emitter());
            this.onShutdown = this._onShutdown.event;
            this._startupKind = 1 /* NewWindow */;
            this._phase = 1 /* Starting */;
            this.phaseWhen = new Map();
        }
        get startupKind() { return this._startupKind; }
        get phase() { return this._phase; }
        set phase(value) {
            if (value < this.phase) {
                throw new Error('Lifecycle cannot go backwards');
            }
            if (this._phase === value) {
                return;
            }
            this.logService.trace(`lifecycle: phase changed (value: ${value})`);
            this._phase = value;
            performance_1.mark(`LifecyclePhase/${lifecycle_2.LifecyclePhaseToString(value)}`);
            const barrier = this.phaseWhen.get(this._phase);
            if (barrier) {
                barrier.open();
                this.phaseWhen.delete(this._phase);
            }
        }
        async when(phase) {
            if (phase <= this._phase) {
                return;
            }
            let barrier = this.phaseWhen.get(phase);
            if (!barrier) {
                barrier = new async_1.Barrier();
                this.phaseWhen.set(phase, barrier);
            }
            await barrier.wait();
        }
    };
    AbstractLifecycleService = __decorate([
        __param(0, log_1.ILogService)
    ], AbstractLifecycleService);
    exports.AbstractLifecycleService = AbstractLifecycleService;
});
//# __sourceMappingURL=lifecycleService.js.map