/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/component", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/types", "vs/css!./media/part"], function (require, exports, component_1, dom_1, event_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Part = void 0;
    /**
     * Parts are layed out in the workbench and have their own layout that
     * arranges an optional title and mandatory content area to show content.
     */
    class Part extends component_1.Component {
        constructor(id, options, themeService, storageService, layoutService) {
            super(id, themeService, storageService);
            this.options = options;
            this.layoutService = layoutService;
            this._onDidVisibilityChange = this._register(new event_1.Emitter());
            this.onDidVisibilityChange = this._onDidVisibilityChange.event;
            //#region ISerializableView
            this._onDidChange = this._register(new event_1.Emitter());
            layoutService.registerPart(this);
        }
        get dimension() { return this._dimension; }
        onThemeChange(theme) {
            // only call if our create() method has been called
            if (this.parent) {
                super.onThemeChange(theme);
            }
        }
        updateStyles() {
            super.updateStyles();
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Called to create title and content area of the part.
         */
        create(parent, options) {
            this.parent = parent;
            this.titleArea = this.createTitleArea(parent, options);
            this.contentArea = this.createContentArea(parent, options);
            this.partLayout = new PartLayout(this.options, this.contentArea);
            this.updateStyles();
        }
        /**
         * Returns the overall part container.
         */
        getContainer() {
            return this.parent;
        }
        /**
         * Subclasses override to provide a title area implementation.
         */
        createTitleArea(parent, options) {
            return undefined;
        }
        /**
         * Returns the title area container.
         */
        getTitleArea() {
            return this.titleArea;
        }
        /**
         * Subclasses override to provide a content area implementation.
         */
        createContentArea(parent, options) {
            return undefined;
        }
        /**
         * Returns the content area container.
         */
        getContentArea() {
            return this.contentArea;
        }
        /**
         * Layout title and content area in the given dimension.
         */
        layoutContents(width, height) {
            const partLayout = types_1.assertIsDefined(this.partLayout);
            return partLayout.layout(width, height);
        }
        get onDidChange() { return this._onDidChange.event; }
        layout(width, height) {
            this._dimension = new dom_1.Dimension(width, height);
        }
        setVisible(visible) {
            this._onDidVisibilityChange.fire(visible);
        }
    }
    exports.Part = Part;
    class PartLayout {
        constructor(options, contentArea) {
            this.options = options;
            this.contentArea = contentArea;
        }
        layout(width, height) {
            // Title Size: Width (Fill), Height (Variable)
            let titleSize;
            if (this.options && this.options.hasTitle) {
                titleSize = new dom_1.Dimension(width, Math.min(height, PartLayout.TITLE_HEIGHT));
            }
            else {
                titleSize = new dom_1.Dimension(0, 0);
            }
            let contentWidth = width;
            if (this.options && typeof this.options.borderWidth === 'function') {
                contentWidth -= this.options.borderWidth(); // adjust for border size
            }
            // Content Size: Width (Fill), Height (Variable)
            const contentSize = new dom_1.Dimension(contentWidth, height - titleSize.height);
            // Content
            if (this.contentArea) {
                dom_1.size(this.contentArea, contentSize.width, contentSize.height);
            }
            return { titleSize, contentSize };
        }
    }
    PartLayout.TITLE_HEIGHT = 35;
});
//# __sourceMappingURL=part.js.map