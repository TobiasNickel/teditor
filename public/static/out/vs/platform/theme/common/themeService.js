/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/event"], function (require, exports, instantiation_1, lifecycle_1, platform, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Themable = exports.registerThemingParticipant = exports.Extensions = exports.getThemeTypeSelector = exports.HIGH_CONTRAST = exports.LIGHT = exports.DARK = exports.FolderThemeIcon = exports.FileThemeIcon = exports.ThemeIcon = exports.themeColorFromId = exports.IThemeService = void 0;
    exports.IThemeService = instantiation_1.createDecorator('themeService');
    function themeColorFromId(id) {
        return { id };
    }
    exports.themeColorFromId = themeColorFromId;
    var ThemeIcon;
    (function (ThemeIcon) {
        function isThemeIcon(obj) {
            return obj && typeof obj === 'object' && typeof obj.id === 'string';
        }
        ThemeIcon.isThemeIcon = isThemeIcon;
        const _regexFromString = /^\$\(([a-z.]+\/)?([a-z-~]+)\)$/i;
        function fromString(str) {
            const match = _regexFromString.exec(str);
            if (!match) {
                return undefined;
            }
            let [, owner, name] = match;
            if (!owner) {
                owner = `codicon/`;
            }
            return { id: owner + name };
        }
        ThemeIcon.fromString = fromString;
        const _regexAsClassName = /^(codicon\/)?([a-z-]+)(~[a-z]+)?$/i;
        function asClassName(icon) {
            // todo@martin,joh -> this should go into the ThemeService
            const match = _regexAsClassName.exec(icon.id);
            if (!match) {
                return undefined;
            }
            let [, , name, modifier] = match;
            let className = `codicon codicon-${name}`;
            if (modifier) {
                className += ` ${modifier.substr(1)}`;
            }
            return className;
        }
        ThemeIcon.asClassName = asClassName;
    })(ThemeIcon = exports.ThemeIcon || (exports.ThemeIcon = {}));
    exports.FileThemeIcon = { id: 'file' };
    exports.FolderThemeIcon = { id: 'folder' };
    // base themes
    exports.DARK = 'dark';
    exports.LIGHT = 'light';
    exports.HIGH_CONTRAST = 'hc';
    function getThemeTypeSelector(type) {
        switch (type) {
            case exports.DARK: return 'vs-dark';
            case exports.HIGH_CONTRAST: return 'hc-black';
            default: return 'vs';
        }
    }
    exports.getThemeTypeSelector = getThemeTypeSelector;
    // static theming participant
    exports.Extensions = {
        ThemingContribution: 'base.contributions.theming'
    };
    class ThemingRegistry {
        constructor() {
            this.themingParticipants = [];
            this.themingParticipants = [];
            this.onThemingParticipantAddedEmitter = new event_1.Emitter();
        }
        onColorThemeChange(participant) {
            this.themingParticipants.push(participant);
            this.onThemingParticipantAddedEmitter.fire(participant);
            return lifecycle_1.toDisposable(() => {
                const idx = this.themingParticipants.indexOf(participant);
                this.themingParticipants.splice(idx, 1);
            });
        }
        get onThemingParticipantAdded() {
            return this.onThemingParticipantAddedEmitter.event;
        }
        getThemingParticipants() {
            return this.themingParticipants;
        }
    }
    let themingRegistry = new ThemingRegistry();
    platform.Registry.add(exports.Extensions.ThemingContribution, themingRegistry);
    function registerThemingParticipant(participant) {
        return themingRegistry.onColorThemeChange(participant);
    }
    exports.registerThemingParticipant = registerThemingParticipant;
    /**
     * Utility base class for all themable components.
     */
    class Themable extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
            this.theme = themeService.getColorTheme();
            // Hook up to theme changes
            this._register(this.themeService.onDidColorThemeChange(theme => this.onThemeChange(theme)));
        }
        onThemeChange(theme) {
            this.theme = theme;
            this.updateStyles();
        }
        updateStyles() {
            // Subclasses to override
        }
        getColor(id, modify) {
            let color = this.theme.getColor(id);
            if (color && modify) {
                color = modify(color, this.theme);
            }
            return color ? color.toString() : null;
        }
    }
    exports.Themable = Themable;
});
//# __sourceMappingURL=themeService.js.map