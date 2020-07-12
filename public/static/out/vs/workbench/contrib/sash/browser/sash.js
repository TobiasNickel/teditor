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
define(["require", "exports", "vs/base/common/numbers", "vs/base/browser/dom", "vs/base/browser/ui/sash/sash", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration"], function (require, exports, numbers_1, dom_1, sash_1, event_1, lifecycle_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SashSizeController = exports.maxSize = exports.minSize = void 0;
    exports.minSize = 4;
    exports.maxSize = 20; // see also https://ux.stackexchange.com/questions/39023/what-is-the-optimum-button-size-of-touch-screen-applications
    let SashSizeController = class SashSizeController extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
            this.configurationName = 'workbench.sash.size';
            this.stylesheet = dom_1.createStyleSheet();
            this._register(lifecycle_1.toDisposable(() => this.stylesheet.remove()));
            const onDidChangeSizeConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration(this.configurationName));
            this._register(onDidChangeSizeConfiguration(this.onDidChangeSizeConfiguration, this));
            this.onDidChangeSizeConfiguration();
        }
        onDidChangeSizeConfiguration() {
            var _a;
            const size = numbers_1.clamp((_a = this.configurationService.getValue(this.configurationName)) !== null && _a !== void 0 ? _a : exports.minSize, exports.minSize, exports.maxSize);
            // Update styles
            this.stylesheet.innerHTML = `
			.monaco-sash.vertical { cursor: ew-resize; top: 0; width: ${size}px; height: 100%; }
			.monaco-sash.horizontal { cursor: ns-resize; left: 0; width: 100%; height: ${size}px; }
			.monaco-sash:not(.disabled).orthogonal-start::before, .monaco-sash:not(.disabled).orthogonal-end::after { content: ' '; height: ${size * 2}px; width: ${size * 2}px; z-index: 100; display: block; cursor: all-scroll; position: absolute; }
			.monaco-sash.orthogonal-start.vertical::before { left: -${size / 2}px; top: -${size}px; }
			.monaco-sash.orthogonal-end.vertical::after { left: -${size / 2}px; bottom: -${size}px; }
			.monaco-sash.orthogonal-start.horizontal::before { top: -${size / 2}px; left: -${size}px; }
			.monaco-sash.orthogonal-end.horizontal::after { top: -${size / 2}px; right: -${size}px; }`;
            // Update behavor
            sash_1.setGlobalSashSize(size);
        }
    };
    SashSizeController = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], SashSizeController);
    exports.SashSizeController = SashSizeController;
});
//# __sourceMappingURL=sash.js.map