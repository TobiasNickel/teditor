/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentVariableMutatorType = exports.IEnvironmentVariableService = void 0;
    exports.IEnvironmentVariableService = instantiation_1.createDecorator('environmentVariableService');
    var EnvironmentVariableMutatorType;
    (function (EnvironmentVariableMutatorType) {
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Replace"] = 1] = "Replace";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Append"] = 2] = "Append";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Prepend"] = 3] = "Prepend";
    })(EnvironmentVariableMutatorType = exports.EnvironmentVariableMutatorType || (exports.EnvironmentVariableMutatorType = {}));
});
//# __sourceMappingURL=environmentVariable.js.map