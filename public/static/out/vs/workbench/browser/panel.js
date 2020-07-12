/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/browser/composite", "vs/base/common/types", "vs/workbench/browser/panecomposite"], function (require, exports, platform_1, composite_1, types_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = exports.PanelRegistry = exports.PanelDescriptor = exports.Panel = void 0;
    class Panel extends panecomposite_1.PaneComposite {
    }
    exports.Panel = Panel;
    /**
     * A panel descriptor is a leightweight descriptor of a panel in the workbench.
     */
    class PanelDescriptor extends composite_1.CompositeDescriptor {
        static create(ctor, id, name, cssClass, order, requestedIndex, _commandId) {
            return new PanelDescriptor(ctor, id, name, cssClass, order, requestedIndex, _commandId);
        }
        constructor(ctor, id, name, cssClass, order, requestedIndex, _commandId) {
            super(ctor, id, name, cssClass, order, requestedIndex, _commandId);
        }
    }
    exports.PanelDescriptor = PanelDescriptor;
    class PanelRegistry extends composite_1.CompositeRegistry {
        /**
         * Registers a panel to the platform.
         */
        registerPanel(descriptor) {
            super.registerComposite(descriptor);
        }
        /**
         * Deregisters a panel to the platform.
         */
        deregisterPanel(id) {
            super.deregisterComposite(id);
        }
        /**
         * Returns a panel by id.
         */
        getPanel(id) {
            return this.getComposite(id);
        }
        /**
         * Returns an array of registered panels known to the platform.
         */
        getPanels() {
            return this.getComposites();
        }
        /**
         * Sets the id of the panel that should open on startup by default.
         */
        setDefaultPanelId(id) {
            this.defaultPanelId = id;
        }
        /**
         * Gets the id of the panel that should open on startup by default.
         */
        getDefaultPanelId() {
            return types_1.assertIsDefined(this.defaultPanelId);
        }
        /**
         * Find out if a panel exists with the provided ID.
         */
        hasPanel(id) {
            return this.getPanels().some(panel => panel.id === id);
        }
    }
    exports.PanelRegistry = PanelRegistry;
    exports.Extensions = {
        Panels: 'workbench.contributions.panels'
    };
    platform_1.Registry.add(exports.Extensions.Panels, new PanelRegistry());
});
//# __sourceMappingURL=panel.js.map