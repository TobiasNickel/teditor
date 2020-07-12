/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/modes/modesRegistry", "vs/platform/files/common/files"], function (require, exports, network_1, resources_1, modesRegistry_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cssEscape = exports.detectModeId = exports.getIconClasses = void 0;
    function getIconClasses(modelService, modeService, resource, fileKind) {
        // we always set these base classes even if we do not have a path
        const classes = fileKind === files_1.FileKind.ROOT_FOLDER ? ['rootfolder-icon'] : fileKind === files_1.FileKind.FOLDER ? ['folder-icon'] : ['file-icon'];
        if (resource) {
            // Get the path and name of the resource. For data-URIs, we need to parse specially
            let name;
            if (resource.scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(resource);
                name = metadata.get(resources_1.DataUri.META_DATA_LABEL);
            }
            else {
                name = cssEscape(resources_1.basenameOrAuthority(resource).toLowerCase());
            }
            // Folders
            if (fileKind === files_1.FileKind.FOLDER) {
                classes.push(`${name}-name-folder-icon`);
            }
            // Files
            else {
                // Name & Extension(s)
                if (name) {
                    classes.push(`${name}-name-file-icon`);
                    const dotSegments = name.split('.');
                    for (let i = 1; i < dotSegments.length; i++) {
                        classes.push(`${dotSegments.slice(i).join('.')}-ext-file-icon`); // add each combination of all found extensions if more than one
                    }
                    classes.push(`ext-file-icon`); // extra segment to increase file-ext score
                }
                // Detected Mode
                const detectedModeId = detectModeId(modelService, modeService, resource);
                if (detectedModeId) {
                    classes.push(`${cssEscape(detectedModeId)}-lang-file-icon`);
                }
            }
        }
        return classes;
    }
    exports.getIconClasses = getIconClasses;
    function detectModeId(modelService, modeService, resource) {
        if (!resource) {
            return null; // we need a resource at least
        }
        let modeId = null;
        // Data URI: check for encoded metadata
        if (resource.scheme === network_1.Schemas.data) {
            const metadata = resources_1.DataUri.parseMetaData(resource);
            const mime = metadata.get(resources_1.DataUri.META_DATA_MIME);
            if (mime) {
                modeId = modeService.getModeId(mime);
            }
        }
        // Any other URI: check for model if existing
        else {
            const model = modelService.getModel(resource);
            if (model) {
                modeId = model.getModeId();
            }
        }
        // only take if the mode is specific (aka no just plain text)
        if (modeId && modeId !== modesRegistry_1.PLAINTEXT_MODE_ID) {
            return modeId;
        }
        // otherwise fallback to path based detection
        return modeService.getModeIdByFilepathOrFirstLine(resource);
    }
    exports.detectModeId = detectModeId;
    function cssEscape(val) {
        return val.replace(/\s/g, '\\$&'); // make sure to not introduce CSS classes from files that contain whitespace
    }
    exports.cssEscape = cssEscape;
});
//# __sourceMappingURL=getIconClasses.js.map