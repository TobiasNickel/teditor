/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHostTypes", "./extHost.protocol", "vs/nls", "vs/base/common/lifecycle"], function (require, exports, extHostTypes_1, extHost_protocol_1, nls_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostStatusBar = exports.ExtHostStatusBarEntry = void 0;
    class ExtHostStatusBarEntry {
        constructor(proxy, commands, id, name, alignment = extHostTypes_1.StatusBarAlignment.Left, priority, accessibilityInformation) {
            this._disposed = false;
            this._visible = false;
            this._text = '';
            this._internalCommandRegistration = new lifecycle_1.DisposableStore();
            this._id = ExtHostStatusBarEntry.ID_GEN++;
            this._proxy = proxy;
            this._commands = commands;
            this._statusId = id;
            this._statusName = name;
            this._alignment = alignment;
            this._priority = priority;
            this._accessibilityInformation = accessibilityInformation;
        }
        get id() {
            return this._id;
        }
        get alignment() {
            return this._alignment;
        }
        get priority() {
            return this._priority;
        }
        get text() {
            return this._text;
        }
        get tooltip() {
            return this._tooltip;
        }
        get color() {
            return this._color;
        }
        get command() {
            var _a;
            return (_a = this._command) === null || _a === void 0 ? void 0 : _a.fromApi;
        }
        get accessibilityInformation() {
            return this._accessibilityInformation;
        }
        set text(text) {
            this._text = text;
            this.update();
        }
        set tooltip(tooltip) {
            this._tooltip = tooltip;
            this.update();
        }
        set color(color) {
            this._color = color;
            this.update();
        }
        set command(command) {
            var _a;
            if (((_a = this._command) === null || _a === void 0 ? void 0 : _a.fromApi) === command) {
                return;
            }
            this._internalCommandRegistration.clear();
            if (typeof command === 'string') {
                this._command = {
                    fromApi: command,
                    internal: this._commands.toInternal({ title: '', command }, this._internalCommandRegistration),
                };
            }
            else if (command) {
                this._command = {
                    fromApi: command,
                    internal: this._commands.toInternal(command, this._internalCommandRegistration),
                };
            }
            else {
                this._command = undefined;
            }
            this.update();
        }
        show() {
            this._visible = true;
            this.update();
        }
        hide() {
            clearTimeout(this._timeoutHandle);
            this._visible = false;
            this._proxy.$dispose(this.id);
        }
        update() {
            if (this._disposed || !this._visible) {
                return;
            }
            clearTimeout(this._timeoutHandle);
            // Defer the update so that multiple changes to setters dont cause a redraw each
            this._timeoutHandle = setTimeout(() => {
                var _a;
                this._timeoutHandle = undefined;
                // Set to status bar
                this._proxy.$setEntry(this.id, this._statusId, this._statusName, this.text, this.tooltip, (_a = this._command) === null || _a === void 0 ? void 0 : _a.internal, this.color, this._alignment === extHostTypes_1.StatusBarAlignment.Left ? 0 /* LEFT */ : 1 /* RIGHT */, this._priority, this._accessibilityInformation);
            }, 0);
        }
        dispose() {
            this.hide();
            this._disposed = true;
        }
    }
    exports.ExtHostStatusBarEntry = ExtHostStatusBarEntry;
    ExtHostStatusBarEntry.ID_GEN = 0;
    class StatusBarMessage {
        constructor(statusBar) {
            this._messages = [];
            this._item = statusBar.createStatusBarEntry('status.extensionMessage', nls_1.localize('status.extensionMessage', "Extension Status"), extHostTypes_1.StatusBarAlignment.Left, Number.MIN_VALUE);
        }
        dispose() {
            this._messages.length = 0;
            this._item.dispose();
        }
        setMessage(message) {
            const data = { message }; // use object to not confuse equal strings
            this._messages.unshift(data);
            this._update();
            return new extHostTypes_1.Disposable(() => {
                const idx = this._messages.indexOf(data);
                if (idx >= 0) {
                    this._messages.splice(idx, 1);
                    this._update();
                }
            });
        }
        _update() {
            if (this._messages.length > 0) {
                this._item.text = this._messages[0].message;
                this._item.show();
            }
            else {
                this._item.hide();
            }
        }
    }
    class ExtHostStatusBar {
        constructor(mainContext, commands) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadStatusBar);
            this._commands = commands;
            this._statusMessage = new StatusBarMessage(this);
        }
        createStatusBarEntry(id, name, alignment, priority, accessibilityInformation) {
            return new ExtHostStatusBarEntry(this._proxy, this._commands, id, name, alignment, priority, accessibilityInformation);
        }
        setStatusBarMessage(text, timeoutOrThenable) {
            const d = this._statusMessage.setMessage(text);
            let handle;
            if (typeof timeoutOrThenable === 'number') {
                handle = setTimeout(() => d.dispose(), timeoutOrThenable);
            }
            else if (typeof timeoutOrThenable !== 'undefined') {
                timeoutOrThenable.then(() => d.dispose(), () => d.dispose());
            }
            return new extHostTypes_1.Disposable(() => {
                d.dispose();
                clearTimeout(handle);
            });
        }
    }
    exports.ExtHostStatusBar = ExtHostStatusBar;
});
//# __sourceMappingURL=extHostStatusBar.js.map