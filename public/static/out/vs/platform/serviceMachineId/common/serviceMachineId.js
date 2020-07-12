/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uuid", "vs/base/common/buffer"], function (require, exports, uuid_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getServiceMachineId = void 0;
    async function getServiceMachineId(environmentService, fileService, storageService) {
        let uuid = storageService ? storageService.get('storage.serviceMachineId', 0 /* GLOBAL */) || null : null;
        if (uuid) {
            return uuid;
        }
        try {
            const contents = await fileService.readFile(environmentService.serviceMachineIdResource);
            const value = contents.value.toString();
            uuid = uuid_1.isUUID(value) ? value : null;
        }
        catch (e) {
            uuid = null;
        }
        if (!uuid) {
            uuid = uuid_1.generateUuid();
            try {
                await fileService.writeFile(environmentService.serviceMachineIdResource, buffer_1.VSBuffer.fromString(uuid));
            }
            catch (error) {
                //noop
            }
        }
        if (storageService) {
            storageService.store('storage.serviceMachineId', uuid, 0 /* GLOBAL */);
        }
        return uuid;
    }
    exports.getServiceMachineId = getServiceMachineId;
});
//# __sourceMappingURL=serviceMachineId.js.map