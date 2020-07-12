/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/workbench/common/editor", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, network_1, uri_1, nls_1, editor_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsInput = void 0;
    class ExtensionsInput extends editor_1.EditorInput {
        constructor(extension) {
            super();
            this.extension = extension;
        }
        get resource() {
            return uri_1.URI.from({
                scheme: network_1.Schemas.extension,
                path: this.extension.identifier.id
            });
        }
        getTypeId() {
            return ExtensionsInput.ID;
        }
        getName() {
            return nls_1.localize('extensionsInputName', "Extension: {0}", this.extension.displayName);
        }
        supportsSplitEditor() {
            return false;
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            return other instanceof ExtensionsInput && extensionManagementUtil_1.areSameExtensions(this.extension.identifier, other.extension.identifier);
        }
    }
    exports.ExtensionsInput = ExtensionsInput;
    ExtensionsInput.ID = 'workbench.extensions.input2';
});
//# __sourceMappingURL=extensionsInput.js.map