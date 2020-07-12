/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDispatchConfig = exports.DispatchConfig = void 0;
    var DispatchConfig;
    (function (DispatchConfig) {
        DispatchConfig[DispatchConfig["Code"] = 0] = "Code";
        DispatchConfig[DispatchConfig["KeyCode"] = 1] = "KeyCode";
    })(DispatchConfig = exports.DispatchConfig || (exports.DispatchConfig = {}));
    function getDispatchConfig(configurationService) {
        const keyboard = configurationService.getValue('keyboard');
        const r = (keyboard ? keyboard.dispatch : null);
        return (r === 'keyCode' ? 1 /* KeyCode */ : 0 /* Code */);
    }
    exports.getDispatchConfig = getDispatchConfig;
});
//# __sourceMappingURL=dispatchConfig.js.map