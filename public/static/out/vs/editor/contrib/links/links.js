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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/contrib/gotoSymbol/link/clickLinkGesture", "vs/editor/contrib/links/getLinks", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/strings", "vs/css!./links"], function (require, exports, nls, async, cancellation_1, errors_1, htmlContent_1, lifecycle_1, platform, editorExtensions_1, textModel_1, modes_1, clickLinkGesture_1, getLinks_1, notification_1, opener_1, colorRegistry_1, themeService_1, uri_1, network_1, resources, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkDetector = void 0;
    function getHoverMessage(link, useMetaKey) {
        const executeCmd = link.url && /^command:/i.test(link.url.toString());
        const label = link.tooltip
            ? link.tooltip
            : executeCmd
                ? nls.localize('links.navigate.executeCmd', 'Execute command')
                : nls.localize('links.navigate.follow', 'Follow link');
        const kb = useMetaKey
            ? platform.isMacintosh
                ? nls.localize('links.navigate.kb.meta.mac', "cmd + click")
                : nls.localize('links.navigate.kb.meta', "ctrl + click")
            : platform.isMacintosh
                ? nls.localize('links.navigate.kb.alt.mac', "option + click")
                : nls.localize('links.navigate.kb.alt', "alt + click");
        if (link.url) {
            const hoverMessage = new htmlContent_1.MarkdownString('', true).appendMarkdown(`[${label}](${link.url.toString()}) (${kb})`);
            return hoverMessage;
        }
        else {
            return new htmlContent_1.MarkdownString().appendText(`${label} (${kb})`);
        }
    }
    const decoration = {
        general: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link'
        }),
        active: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link-active'
        })
    };
    class LinkOccurrence {
        constructor(link, decorationId) {
            this.link = link;
            this.decorationId = decorationId;
        }
        static decoration(link, useMetaKey) {
            return {
                range: link.range,
                options: LinkOccurrence._getOptions(link, useMetaKey, false)
            };
        }
        static _getOptions(link, useMetaKey, isActive) {
            const options = Object.assign({}, (isActive ? decoration.active : decoration.general));
            options.hoverMessage = getHoverMessage(link, useMetaKey);
            return options;
        }
        activate(changeAccessor, useMetaKey) {
            changeAccessor.changeDecorationOptions(this.decorationId, LinkOccurrence._getOptions(this.link, useMetaKey, true));
        }
        deactivate(changeAccessor, useMetaKey) {
            changeAccessor.changeDecorationOptions(this.decorationId, LinkOccurrence._getOptions(this.link, useMetaKey, false));
        }
    }
    let LinkDetector = class LinkDetector {
        constructor(editor, openerService, notificationService) {
            this.listenersToRemove = new lifecycle_1.DisposableStore();
            this.editor = editor;
            this.openerService = openerService;
            this.notificationService = notificationService;
            let clickLinkGesture = new clickLinkGesture_1.ClickLinkGesture(editor);
            this.listenersToRemove.add(clickLinkGesture);
            this.listenersToRemove.add(clickLinkGesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, keyboardEvent]) => {
                this._onEditorMouseMove(mouseEvent, keyboardEvent);
            }));
            this.listenersToRemove.add(clickLinkGesture.onExecute((e) => {
                this.onEditorMouseUp(e);
            }));
            this.listenersToRemove.add(clickLinkGesture.onCancel((e) => {
                this.cleanUpActiveLinkDecoration();
            }));
            this.enabled = editor.getOption(54 /* links */);
            this.listenersToRemove.add(editor.onDidChangeConfiguration((e) => {
                const enabled = editor.getOption(54 /* links */);
                if (this.enabled === enabled) {
                    // No change in our configuration option
                    return;
                }
                this.enabled = enabled;
                // Remove any links (for the getting disabled case)
                this.updateDecorations([]);
                // Stop any computation (for the getting disabled case)
                this.stop();
                // Start computing (for the getting enabled case)
                this.beginCompute();
            }));
            this.listenersToRemove.add(editor.onDidChangeModelContent((e) => this.onChange()));
            this.listenersToRemove.add(editor.onDidChangeModel((e) => this.onModelChanged()));
            this.listenersToRemove.add(editor.onDidChangeModelLanguage((e) => this.onModelModeChanged()));
            this.listenersToRemove.add(modes_1.LinkProviderRegistry.onDidChange((e) => this.onModelModeChanged()));
            this.timeout = new async.TimeoutTimer();
            this.computePromise = null;
            this.activeLinksList = null;
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            this.beginCompute();
        }
        static get(editor) {
            return editor.getContribution(LinkDetector.ID);
        }
        onModelChanged() {
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            this.stop();
            this.beginCompute();
        }
        onModelModeChanged() {
            this.stop();
            this.beginCompute();
        }
        onChange() {
            this.timeout.setIfNotSet(() => this.beginCompute(), LinkDetector.RECOMPUTE_TIME);
        }
        async beginCompute() {
            if (!this.editor.hasModel() || !this.enabled) {
                return;
            }
            const model = this.editor.getModel();
            if (!modes_1.LinkProviderRegistry.has(model)) {
                return;
            }
            if (this.activeLinksList) {
                this.activeLinksList.dispose();
                this.activeLinksList = null;
            }
            this.computePromise = async.createCancelablePromise(token => getLinks_1.getLinks(model, token));
            try {
                this.activeLinksList = await this.computePromise;
                this.updateDecorations(this.activeLinksList.links);
            }
            catch (err) {
                errors_1.onUnexpectedError(err);
            }
            finally {
                this.computePromise = null;
            }
        }
        updateDecorations(links) {
            const useMetaKey = (this.editor.getOption(61 /* multiCursorModifier */) === 'altKey');
            let oldDecorations = [];
            let keys = Object.keys(this.currentOccurrences);
            for (let i = 0, len = keys.length; i < len; i++) {
                let decorationId = keys[i];
                let occurance = this.currentOccurrences[decorationId];
                oldDecorations.push(occurance.decorationId);
            }
            let newDecorations = [];
            if (links) {
                // Not sure why this is sometimes null
                for (const link of links) {
                    newDecorations.push(LinkOccurrence.decoration(link, useMetaKey));
                }
            }
            let decorations = this.editor.deltaDecorations(oldDecorations, newDecorations);
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            for (let i = 0, len = decorations.length; i < len; i++) {
                let occurance = new LinkOccurrence(links[i], decorations[i]);
                this.currentOccurrences[occurance.decorationId] = occurance;
            }
        }
        _onEditorMouseMove(mouseEvent, withKey) {
            const useMetaKey = (this.editor.getOption(61 /* multiCursorModifier */) === 'altKey');
            if (this.isEnabled(mouseEvent, withKey)) {
                this.cleanUpActiveLinkDecoration(); // always remove previous link decoration as their can only be one
                const occurrence = this.getLinkOccurrence(mouseEvent.target.position);
                if (occurrence) {
                    this.editor.changeDecorations((changeAccessor) => {
                        occurrence.activate(changeAccessor, useMetaKey);
                        this.activeLinkDecorationId = occurrence.decorationId;
                    });
                }
            }
            else {
                this.cleanUpActiveLinkDecoration();
            }
        }
        cleanUpActiveLinkDecoration() {
            const useMetaKey = (this.editor.getOption(61 /* multiCursorModifier */) === 'altKey');
            if (this.activeLinkDecorationId) {
                const occurrence = this.currentOccurrences[this.activeLinkDecorationId];
                if (occurrence) {
                    this.editor.changeDecorations((changeAccessor) => {
                        occurrence.deactivate(changeAccessor, useMetaKey);
                    });
                }
                this.activeLinkDecorationId = null;
            }
        }
        onEditorMouseUp(mouseEvent) {
            if (!this.isEnabled(mouseEvent)) {
                return;
            }
            const occurrence = this.getLinkOccurrence(mouseEvent.target.position);
            if (!occurrence) {
                return;
            }
            this.openLinkOccurrence(occurrence, mouseEvent.hasSideBySideModifier, true /* from user gesture */);
        }
        openLinkOccurrence(occurrence, openToSide, fromUserGesture = false) {
            if (!this.openerService) {
                return;
            }
            const { link } = occurrence;
            link.resolve(cancellation_1.CancellationToken.None).then(uri => {
                // Support for relative file URIs of the shape file://./relativeFile.txt or file:///./relativeFile.txt
                if (typeof uri === 'string' && this.editor.hasModel()) {
                    const modelUri = this.editor.getModel().uri;
                    if (modelUri.scheme === network_1.Schemas.file && strings.startsWith(uri, 'file:')) {
                        const parsedUri = uri_1.URI.parse(uri);
                        if (parsedUri.scheme === network_1.Schemas.file) {
                            const fsPath = resources.originalFSPath(parsedUri);
                            let relativePath = null;
                            if (strings.startsWith(fsPath, '/./')) {
                                relativePath = `.${fsPath.substr(1)}`;
                            }
                            else if (strings.startsWith(fsPath, '//./')) {
                                relativePath = `.${fsPath.substr(2)}`;
                            }
                            if (relativePath) {
                                uri = resources.joinPath(modelUri, relativePath);
                            }
                        }
                    }
                }
                return this.openerService.open(uri, { openToSide, fromUserGesture });
            }, err => {
                const messageOrError = err instanceof Error ? err.message : err;
                // different error cases
                if (messageOrError === 'invalid') {
                    this.notificationService.warn(nls.localize('invalid.url', 'Failed to open this link because it is not well-formed: {0}', link.url.toString()));
                }
                else if (messageOrError === 'missing') {
                    this.notificationService.warn(nls.localize('missing.url', 'Failed to open this link because its target is missing.'));
                }
                else {
                    errors_1.onUnexpectedError(err);
                }
            });
        }
        getLinkOccurrence(position) {
            if (!this.editor.hasModel() || !position) {
                return null;
            }
            const decorations = this.editor.getModel().getDecorationsInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            }, 0, true);
            for (const decoration of decorations) {
                const currentOccurrence = this.currentOccurrences[decoration.id];
                if (currentOccurrence) {
                    return currentOccurrence;
                }
            }
            return null;
        }
        isEnabled(mouseEvent, withKey) {
            return Boolean((mouseEvent.target.type === 6 /* CONTENT_TEXT */)
                && (mouseEvent.hasTriggerModifier || (withKey && withKey.keyCodeIsTriggerKey)));
        }
        stop() {
            this.timeout.cancel();
            if (this.activeLinksList) {
                this.activeLinksList.dispose();
            }
            if (this.computePromise) {
                this.computePromise.cancel();
                this.computePromise = null;
            }
        }
        dispose() {
            this.listenersToRemove.dispose();
            this.stop();
            this.timeout.dispose();
        }
    };
    LinkDetector.ID = 'editor.linkDetector';
    LinkDetector.RECOMPUTE_TIME = 1000; // ms
    LinkDetector = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, notification_1.INotificationService)
    ], LinkDetector);
    exports.LinkDetector = LinkDetector;
    class OpenLinkAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.openLink',
                label: nls.localize('label', "Open Link"),
                alias: 'Open Link',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            let linkDetector = LinkDetector.get(editor);
            if (!linkDetector) {
                return;
            }
            if (!editor.hasModel()) {
                return;
            }
            let selections = editor.getSelections();
            for (let sel of selections) {
                let link = linkDetector.getLinkOccurrence(sel.getEndPosition());
                if (link) {
                    linkDetector.openLinkOccurrence(link, false);
                }
            }
        }
    }
    editorExtensions_1.registerEditorContribution(LinkDetector.ID, LinkDetector);
    editorExtensions_1.registerEditorAction(OpenLinkAction);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const activeLinkForeground = theme.getColor(colorRegistry_1.editorActiveLinkForeground);
        if (activeLinkForeground) {
            collector.addRule(`.monaco-editor .detected-link-active { color: ${activeLinkForeground} !important; }`);
        }
    });
});
//# __sourceMappingURL=links.js.map