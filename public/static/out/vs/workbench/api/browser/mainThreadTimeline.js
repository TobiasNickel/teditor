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
define(["require", "exports", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/workbench/contrib/timeline/common/timeline"], function (require, exports, event_1, log_1, extHost_protocol_1, extHostCustomers_1, timeline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTimeline = void 0;
    let MainThreadTimeline = class MainThreadTimeline {
        constructor(context, logService, _timelineService) {
            this.logService = logService;
            this._timelineService = _timelineService;
            this._providerEmitters = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTimeline);
        }
        $registerTimelineProvider(provider) {
            this.logService.trace(`MainThreadTimeline#registerTimelineProvider: id=${provider.id}`);
            const proxy = this._proxy;
            const emitters = this._providerEmitters;
            let onDidChange = emitters.get(provider.id);
            if (onDidChange === undefined) {
                onDidChange = new event_1.Emitter();
                emitters.set(provider.id, onDidChange);
            }
            this._timelineService.registerTimelineProvider(Object.assign(Object.assign({}, provider), { onDidChange: onDidChange.event, provideTimeline(uri, options, token, internalOptions) {
                    return proxy.$getTimeline(provider.id, uri, options, token, internalOptions);
                },
                dispose() {
                    emitters.delete(provider.id);
                    onDidChange === null || onDidChange === void 0 ? void 0 : onDidChange.dispose();
                } }));
        }
        $unregisterTimelineProvider(id) {
            this.logService.trace(`MainThreadTimeline#unregisterTimelineProvider: id=${id}`);
            this._timelineService.unregisterTimelineProvider(id);
        }
        $emitTimelineChangeEvent(e) {
            var _a;
            this.logService.trace(`MainThreadTimeline#emitChangeEvent: id=${e.id}, uri=${(_a = e.uri) === null || _a === void 0 ? void 0 : _a.toString(true)}`);
            const emitter = this._providerEmitters.get(e.id);
            emitter === null || emitter === void 0 ? void 0 : emitter.fire(e);
        }
        dispose() {
            // noop
        }
    };
    MainThreadTimeline = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadTimeline),
        __param(1, log_1.ILogService),
        __param(2, timeline_1.ITimelineService)
    ], MainThreadTimeline);
    exports.MainThreadTimeline = MainThreadTimeline;
});
//# __sourceMappingURL=mainThreadTimeline.js.map