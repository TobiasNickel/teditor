/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/resources", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/base/common/network", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, nls, uri_1, path_1, resources, debug_1, editorService_1, network_1, debugUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getUriFromSource = exports.Source = exports.UNKNOWN_SOURCE_LABEL = void 0;
    exports.UNKNOWN_SOURCE_LABEL = nls.localize('unknownSource', "Unknown Source");
    /**
     * Debug URI format
     *
     * a debug URI represents a Source object and the debug session where the Source comes from.
     *
     *       debug:arbitrary_path?session=123e4567-e89b-12d3-a456-426655440000&ref=1016
     *       \___/ \____________/ \__________________________________________/ \______/
     *         |          |                             |                          |
     *      scheme   source.path                    session id            source.reference
     *
     *
     */
    class Source {
        constructor(raw_, sessionId) {
            let path;
            if (raw_) {
                this.raw = raw_;
                path = this.raw.path || this.raw.name || '';
                this.available = true;
            }
            else {
                this.raw = { name: exports.UNKNOWN_SOURCE_LABEL };
                this.available = false;
                path = `${debug_1.DEBUG_SCHEME}:${exports.UNKNOWN_SOURCE_LABEL}`;
            }
            this.uri = getUriFromSource(this.raw, path, sessionId);
        }
        get name() {
            return this.raw.name || resources.basenameOrAuthority(this.uri);
        }
        get origin() {
            return this.raw.origin;
        }
        get presentationHint() {
            return this.raw.presentationHint;
        }
        get reference() {
            return this.raw.sourceReference;
        }
        get inMemory() {
            return this.uri.scheme === debug_1.DEBUG_SCHEME;
        }
        openInEditor(editorService, selection, preserveFocus, sideBySide, pinned) {
            return !this.available ? Promise.resolve(undefined) : editorService.openEditor({
                resource: this.uri,
                description: this.origin,
                options: {
                    preserveFocus,
                    selection,
                    revealIfOpened: true,
                    selectionRevealType: 1 /* CenterIfOutsideViewport */,
                    pinned: pinned || (!preserveFocus && !this.inMemory)
                }
            }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        static getEncodedDebugData(modelUri) {
            let path;
            let sourceReference;
            let sessionId;
            switch (modelUri.scheme) {
                case network_1.Schemas.file:
                    path = path_1.normalize(modelUri.fsPath);
                    break;
                case debug_1.DEBUG_SCHEME:
                    path = modelUri.path;
                    if (modelUri.query) {
                        const keyvalues = modelUri.query.split('&');
                        for (let keyvalue of keyvalues) {
                            const pair = keyvalue.split('=');
                            if (pair.length === 2) {
                                switch (pair[0]) {
                                    case 'session':
                                        sessionId = pair[1];
                                        break;
                                    case 'ref':
                                        sourceReference = parseInt(pair[1]);
                                        break;
                                }
                            }
                        }
                    }
                    break;
                default:
                    path = modelUri.toString();
                    break;
            }
            return {
                name: resources.basenameOrAuthority(modelUri),
                path,
                sourceReference,
                sessionId
            };
        }
    }
    exports.Source = Source;
    function getUriFromSource(raw, path, sessionId) {
        if (typeof raw.sourceReference === 'number' && raw.sourceReference > 0) {
            return uri_1.URI.from({
                scheme: debug_1.DEBUG_SCHEME,
                path,
                query: `session=${sessionId}&ref=${raw.sourceReference}`
            });
        }
        if (path && debugUtils_1.isUri(path)) { // path looks like a uri
            return uri_1.URI.parse(path);
        }
        // assume a filesystem path
        if (path && path_1.isAbsolute(path)) {
            return uri_1.URI.file(path);
        }
        // path is relative: since VS Code cannot deal with this by itself
        // create a debug url that will result in a DAP 'source' request when the url is resolved.
        return uri_1.URI.from({
            scheme: debug_1.DEBUG_SCHEME,
            path,
            query: `session=${sessionId}`
        });
    }
    exports.getUriFromSource = getUriFromSource;
});
//# __sourceMappingURL=debugSource.js.map