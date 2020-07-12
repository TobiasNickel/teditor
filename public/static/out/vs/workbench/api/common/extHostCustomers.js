/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostCustomersRegistry = exports.extHostCustomer = exports.extHostNamedCustomer = void 0;
    function extHostNamedCustomer(id) {
        return function (ctor) {
            ExtHostCustomersRegistryImpl.INSTANCE.registerNamedCustomer(id, ctor);
        };
    }
    exports.extHostNamedCustomer = extHostNamedCustomer;
    function extHostCustomer(ctor) {
        ExtHostCustomersRegistryImpl.INSTANCE.registerCustomer(ctor);
    }
    exports.extHostCustomer = extHostCustomer;
    var ExtHostCustomersRegistry;
    (function (ExtHostCustomersRegistry) {
        function getNamedCustomers() {
            return ExtHostCustomersRegistryImpl.INSTANCE.getNamedCustomers();
        }
        ExtHostCustomersRegistry.getNamedCustomers = getNamedCustomers;
        function getCustomers() {
            return ExtHostCustomersRegistryImpl.INSTANCE.getCustomers();
        }
        ExtHostCustomersRegistry.getCustomers = getCustomers;
    })(ExtHostCustomersRegistry = exports.ExtHostCustomersRegistry || (exports.ExtHostCustomersRegistry = {}));
    class ExtHostCustomersRegistryImpl {
        constructor() {
            this._namedCustomers = [];
            this._customers = [];
        }
        registerNamedCustomer(id, ctor) {
            const entry = [id, ctor];
            this._namedCustomers.push(entry);
        }
        getNamedCustomers() {
            return this._namedCustomers;
        }
        registerCustomer(ctor) {
            this._customers.push(ctor);
        }
        getCustomers() {
            return this._customers;
        }
    }
    ExtHostCustomersRegistryImpl.INSTANCE = new ExtHostCustomersRegistryImpl();
});
//# __sourceMappingURL=extHostCustomers.js.map