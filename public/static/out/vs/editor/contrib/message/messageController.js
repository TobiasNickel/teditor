/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/browser/ui/aria/aria", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/css!./messageController"], function (require, exports, nls, async_1, lifecycle_1, aria_1, range_1, editorExtensions_1, contextkey_1, themeService_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageController = void 0;
    let MessageController = class MessageController extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService) {
            super();
            this.closeTimeout = 3000; // close after 3s
            this._messageWidget = this._register(new lifecycle_1.MutableDisposable());
            this._messageListeners = this._register(new lifecycle_1.DisposableStore());
            this._editor = editor;
            this._visible = MessageController.MESSAGE_VISIBLE.bindTo(contextKeyService);
            this._register(this._editor.onDidAttemptReadOnlyEdit(() => this._onDidAttemptReadOnlyEdit()));
        }
        static get(editor) {
            return editor.getContribution(MessageController.ID);
        }
        dispose() {
            super.dispose();
            this._visible.reset();
        }
        isVisible() {
            return this._visible.get();
        }
        showMessage(message, position) {
            aria_1.alert(message);
            this._visible.set(true);
            this._messageWidget.clear();
            this._messageListeners.clear();
            this._messageWidget.value = new MessageWidget(this._editor, position, message);
            // close on blur, cursor, model change, dispose
            this._messageListeners.add(this._editor.onDidBlurEditorText(() => this.closeMessage()));
            this._messageListeners.add(this._editor.onDidChangeCursorPosition(() => this.closeMessage()));
            this._messageListeners.add(this._editor.onDidDispose(() => this.closeMessage()));
            this._messageListeners.add(this._editor.onDidChangeModel(() => this.closeMessage()));
            this._messageListeners.add(new async_1.TimeoutTimer(() => this.closeMessage(), this.closeTimeout));
            // close on mouse move
            let bounds;
            this._messageListeners.add(this._editor.onMouseMove(e => {
                // outside the text area
                if (!e.target.position) {
                    return;
                }
                if (!bounds) {
                    // define bounding box around position and first mouse occurance
                    bounds = new range_1.Range(position.lineNumber - 3, 1, e.target.position.lineNumber + 3, 1);
                }
                else if (!bounds.containsPosition(e.target.position)) {
                    // check if position is still in bounds
                    this.closeMessage();
                }
            }));
        }
        closeMessage() {
            this._visible.reset();
            this._messageListeners.clear();
            if (this._messageWidget.value) {
                this._messageListeners.add(MessageWidget.fadeOut(this._messageWidget.value));
            }
        }
        _onDidAttemptReadOnlyEdit() {
            if (this._editor.hasModel()) {
                this.showMessage(nls.localize('editor.readonly', "Cannot edit in read-only editor"), this._editor.getPosition());
            }
        }
    };
    MessageController.ID = 'editor.contrib.messageController';
    MessageController.MESSAGE_VISIBLE = new contextkey_1.RawContextKey('messageVisible', false);
    MessageController = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], MessageController);
    exports.MessageController = MessageController;
    const MessageCommand = editorExtensions_1.EditorCommand.bindToContribution(MessageController.get);
    editorExtensions_1.registerEditorCommand(new MessageCommand({
        id: 'leaveEditorMessage',
        precondition: MessageController.MESSAGE_VISIBLE,
        handler: c => c.closeMessage(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 30,
            primary: 9 /* Escape */
        }
    }));
    class MessageWidget {
        constructor(editor, { lineNumber, column }, text) {
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this._editor = editor;
            this._editor.revealLinesInCenterIfOutsideViewport(lineNumber, lineNumber, 0 /* Smooth */);
            this._position = { lineNumber, column: column - 1 };
            this._domNode = document.createElement('div');
            this._domNode.classList.add('monaco-editor-overlaymessage');
            const message = document.createElement('div');
            message.classList.add('message');
            message.textContent = text;
            this._domNode.appendChild(message);
            const anchor = document.createElement('div');
            anchor.classList.add('anchor');
            this._domNode.appendChild(anchor);
            this._editor.addContentWidget(this);
            this._domNode.classList.add('fadeIn');
        }
        static fadeOut(messageWidget) {
            let handle;
            const dispose = () => {
                messageWidget.dispose();
                clearTimeout(handle);
                messageWidget.getDomNode().removeEventListener('animationend', dispose);
            };
            handle = setTimeout(dispose, 110);
            messageWidget.getDomNode().addEventListener('animationend', dispose);
            messageWidget.getDomNode().classList.add('fadeOut');
            return { dispose };
        }
        dispose() {
            this._editor.removeContentWidget(this);
        }
        getId() {
            return 'messageoverlay';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return { position: this._position, preference: [1 /* ABOVE */, 2 /* BELOW */] };
        }
    }
    editorExtensions_1.registerEditorContribution(MessageController.ID, MessageController);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const border = theme.getColor(colorRegistry_1.inputValidationInfoBorder);
        if (border) {
            let borderWidth = theme.type === themeService_1.HIGH_CONTRAST ? 2 : 1;
            collector.addRule(`.monaco-editor .monaco-editor-overlaymessage .anchor { border-top-color: ${border}; }`);
            collector.addRule(`.monaco-editor .monaco-editor-overlaymessage .message { border: ${borderWidth}px solid ${border}; }`);
        }
        const background = theme.getColor(colorRegistry_1.inputValidationInfoBackground);
        if (background) {
            collector.addRule(`.monaco-editor .monaco-editor-overlaymessage .message { background-color: ${background}; }`);
        }
        const foreground = theme.getColor(colorRegistry_1.inputValidationInfoForeground);
        if (foreground) {
            collector.addRule(`.monaco-editor .monaco-editor-overlaymessage .message { color: ${foreground}; }`);
        }
    });
});
//# __sourceMappingURL=messageController.js.map