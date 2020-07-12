/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/extensions/common/extensions"], function (require, exports, strings_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMaliciousExtensionsSet = exports.BetterMergeId = exports.getGalleryExtensionTelemetryData = exports.getLocalExtensionTelemetryData = exports.groupByExtension = exports.getGalleryExtensionId = exports.adoptToGalleryExtensionId = exports.ExtensionIdentifierWithVersion = exports.areSameExtensions = void 0;
    function areSameExtensions(a, b) {
        if (a.uuid && b.uuid) {
            return a.uuid === b.uuid;
        }
        if (a.id === b.id) {
            return true;
        }
        return strings_1.compareIgnoreCase(a.id, b.id) === 0;
    }
    exports.areSameExtensions = areSameExtensions;
    class ExtensionIdentifierWithVersion {
        constructor(identifier, version) {
            this.identifier = identifier;
            this.version = version;
        }
        key() {
            return `${this.identifier.id}-${this.version}`;
        }
        equals(o) {
            if (!(o instanceof ExtensionIdentifierWithVersion)) {
                return false;
            }
            return areSameExtensions(this.identifier, o.identifier) && this.version === o.version;
        }
    }
    exports.ExtensionIdentifierWithVersion = ExtensionIdentifierWithVersion;
    function adoptToGalleryExtensionId(id) {
        return id.toLocaleLowerCase();
    }
    exports.adoptToGalleryExtensionId = adoptToGalleryExtensionId;
    function getGalleryExtensionId(publisher, name) {
        return `${publisher.toLocaleLowerCase()}.${name.toLocaleLowerCase()}`;
    }
    exports.getGalleryExtensionId = getGalleryExtensionId;
    function groupByExtension(extensions, getExtensionIdentifier) {
        const byExtension = [];
        const findGroup = (extension) => {
            for (const group of byExtension) {
                if (group.some(e => areSameExtensions(getExtensionIdentifier(e), getExtensionIdentifier(extension)))) {
                    return group;
                }
            }
            return null;
        };
        for (const extension of extensions) {
            const group = findGroup(extension);
            if (group) {
                group.push(extension);
            }
            else {
                byExtension.push([extension]);
            }
        }
        return byExtension;
    }
    exports.groupByExtension = groupByExtension;
    function getLocalExtensionTelemetryData(extension) {
        return {
            id: extension.identifier.id,
            name: extension.manifest.name,
            galleryId: null,
            publisherId: extension.publisherId,
            publisherName: extension.manifest.publisher,
            publisherDisplayName: extension.publisherDisplayName,
            dependencies: extension.manifest.extensionDependencies && extension.manifest.extensionDependencies.length > 0
        };
    }
    exports.getLocalExtensionTelemetryData = getLocalExtensionTelemetryData;
    /* __GDPR__FRAGMENT__
        "GalleryExtensionTelemetryData" : {
            "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "name": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "galleryId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherDisplayName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "dependencies": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
            "${include}": [
                "${GalleryExtensionTelemetryData2}"
            ]
        }
    */
    function getGalleryExtensionTelemetryData(extension) {
        return Object.assign({ id: extension.identifier.id, name: extension.name, galleryId: extension.identifier.uuid, publisherId: extension.publisherId, publisherName: extension.publisher, publisherDisplayName: extension.publisherDisplayName, dependencies: !!(extension.properties.dependencies && extension.properties.dependencies.length > 0) }, extension.telemetryData);
    }
    exports.getGalleryExtensionTelemetryData = getGalleryExtensionTelemetryData;
    exports.BetterMergeId = new extensions_1.ExtensionIdentifier('pprice.better-merge');
    function getMaliciousExtensionsSet(report) {
        const result = new Set();
        for (const extension of report) {
            if (extension.malicious) {
                result.add(extension.id.id);
            }
        }
        return result;
    }
    exports.getMaliciousExtensionsSet = getMaliciousExtensionsSet;
});
//# __sourceMappingURL=extensionManagementUtil.js.map