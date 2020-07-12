/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/common/environmentVariableService", "vs/platform/instantiation/common/extensions"], function (require, exports, environmentVariable_1, environmentVariableService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(environmentVariable_1.IEnvironmentVariableService, environmentVariableService_1.EnvironmentVariableService, true);
});
//# __sourceMappingURL=environmentVariable.contribution.js.map