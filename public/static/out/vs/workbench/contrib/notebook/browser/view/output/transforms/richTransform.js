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
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookRegistry", "vs/base/browser/dom", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/browser/widget/codeEditorWidget", "vs/base/common/uri", "vs/workbench/contrib/notebook/browser/view/renderers/mdRenderer", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/view/output/transforms/errorTransform"], function (require, exports, notebookCommon_1, notebookRegistry_1, DOM, types_1, instantiation_1, modelService_1, modeService_1, codeEditorWidget_1, uri_1, mdRenderer_1, themeService_1, errorTransform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOutputSimpleEditorOptions = void 0;
    let RichRenderer = class RichRenderer {
        constructor(notebookEditor, instantiationService, modelService, modeService, themeService) {
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.themeService = themeService;
            this._richMimeTypeRenderers = new Map();
            this._mdRenderer = instantiationService.createInstance(mdRenderer_1.MarkdownRenderer, undefined);
            this._richMimeTypeRenderers.set('application/json', this.renderJSON.bind(this));
            this._richMimeTypeRenderers.set('application/javascript', this.renderJavaScript.bind(this));
            this._richMimeTypeRenderers.set('text/html', this.renderHTML.bind(this));
            this._richMimeTypeRenderers.set('image/svg+xml', this.renderSVG.bind(this));
            this._richMimeTypeRenderers.set('text/markdown', this.renderMarkdown.bind(this));
            this._richMimeTypeRenderers.set('image/png', this.renderPNG.bind(this));
            this._richMimeTypeRenderers.set('image/jpeg', this.renderJavaScript.bind(this));
            this._richMimeTypeRenderers.set('text/plain', this.renderPlainText.bind(this));
            this._richMimeTypeRenderers.set('text/x-javascript', this.renderCode.bind(this));
        }
        render(output, container, preferredMimeType) {
            if (!output.data) {
                const contentNode = document.createElement('p');
                contentNode.innerText = `No data could be found for output.`;
                container.appendChild(contentNode);
                return {
                    hasDynamicHeight: false
                };
            }
            if (!preferredMimeType || !this._richMimeTypeRenderers.has(preferredMimeType)) {
                const contentNode = document.createElement('p');
                let mimeTypes = [];
                for (const property in output.data) {
                    mimeTypes.push(property);
                }
                let mimeTypesMessage = mimeTypes.join(', ');
                contentNode.innerText = `No renderer could be found for output. It has the following MIME types: ${mimeTypesMessage}`;
                container.appendChild(contentNode);
                return {
                    hasDynamicHeight: false
                };
            }
            let renderer = this._richMimeTypeRenderers.get(preferredMimeType);
            return renderer(output, container);
        }
        renderJSON(output, container) {
            let data = output.data['application/json'];
            let str = JSON.stringify(data, null, '\t');
            const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, container, Object.assign(Object.assign({}, getOutputSimpleEditorOptions()), { dimension: {
                    width: 0,
                    height: 0
                } }), {
                isSimpleWidget: true
            });
            let mode = this.modeService.create('json');
            let resource = uri_1.URI.parse(`notebook-output-${Date.now()}.json`);
            const textModel = this.modelService.createModel(str, mode, resource, false);
            editor.setModel(textModel);
            let width = this.notebookEditor.getLayoutInfo().width;
            let fontInfo = this.notebookEditor.getLayoutInfo().fontInfo;
            let height = Math.min(textModel.getLineCount(), 16) * (fontInfo.lineHeight || 18);
            editor.layout({
                height,
                width
            });
            container.style.height = `${height + 16}px`;
            return {
                hasDynamicHeight: true
            };
        }
        renderCode(output, container) {
            let data = output.data['text/x-javascript'];
            let str = types_1.isArray(data) ? data.join('') : data;
            const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, container, Object.assign(Object.assign({}, getOutputSimpleEditorOptions()), { dimension: {
                    width: 0,
                    height: 0
                } }), {
                isSimpleWidget: true
            });
            let mode = this.modeService.create('javascript');
            let resource = uri_1.URI.parse(`notebook-output-${Date.now()}.js`);
            const textModel = this.modelService.createModel(str, mode, resource, false);
            editor.setModel(textModel);
            let width = this.notebookEditor.getLayoutInfo().width;
            let fontInfo = this.notebookEditor.getLayoutInfo().fontInfo;
            let height = Math.min(textModel.getLineCount(), 16) * (fontInfo.lineHeight || 18);
            editor.layout({
                height,
                width
            });
            container.style.height = `${height + 16}px`;
            return {
                hasDynamicHeight: true
            };
        }
        renderJavaScript(output, container) {
            let data = output.data['application/javascript'];
            let str = types_1.isArray(data) ? data.join('') : data;
            let scriptVal = `<script type="application/javascript">${str}</script>`;
            return {
                shadowContent: scriptVal,
                hasDynamicHeight: false
            };
        }
        renderHTML(output, container) {
            let data = output.data['text/html'];
            let str = types_1.isArray(data) ? data.join('') : data;
            return {
                shadowContent: str,
                hasDynamicHeight: false
            };
        }
        renderSVG(output, container) {
            let data = output.data['image/svg+xml'];
            let str = types_1.isArray(data) ? data.join('') : data;
            return {
                shadowContent: str,
                hasDynamicHeight: false
            };
        }
        renderMarkdown(output, container) {
            let data = output.data['text/markdown'];
            const str = types_1.isArray(data) ? data.join('') : data;
            const mdOutput = document.createElement('div');
            mdOutput.appendChild(this._mdRenderer.render({ value: str, isTrusted: false, supportThemeIcons: true }).element);
            container.appendChild(mdOutput);
            return {
                hasDynamicHeight: true
            };
        }
        renderPNG(output, container) {
            const image = document.createElement('img');
            image.src = `data:image/png;base64,${output.data['image/png']}`;
            const display = document.createElement('div');
            DOM.addClasses(display, 'display');
            display.appendChild(image);
            container.appendChild(display);
            return {
                hasDynamicHeight: true
            };
        }
        renderJPEG(output, container) {
            const image = document.createElement('img');
            image.src = `data:image/jpeg;base64,${output.data['image/jpeg']}`;
            const display = document.createElement('div');
            DOM.addClasses(display, 'display');
            display.appendChild(image);
            container.appendChild(display);
            return {
                hasDynamicHeight: true
            };
        }
        renderPlainText(output, container) {
            let data = output.data['text/plain'];
            let str = types_1.isArray(data) ? data.join('') : data;
            const contentNode = DOM.$('.output-plaintext');
            contentNode.appendChild(errorTransform_1.handleANSIOutput(str, this.themeService));
            container.appendChild(contentNode);
            return {
                hasDynamicHeight: false
            };
        }
        dispose() {
        }
    };
    RichRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService),
        __param(4, themeService_1.IThemeService)
    ], RichRenderer);
    notebookRegistry_1.NotebookRegistry.registerOutputTransform('notebook.output.rich', notebookCommon_1.CellOutputKind.Rich, RichRenderer);
    function getOutputSimpleEditorOptions() {
        return {
            readOnly: true,
            wordWrap: 'on',
            overviewRulerLanes: 0,
            glyphMargin: false,
            selectOnLineNumbers: false,
            hideCursorInOverviewRuler: true,
            selectionHighlight: false,
            lineDecorationsWidth: 0,
            overviewRulerBorder: false,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
            minimap: {
                enabled: false
            },
            lineNumbers: 'off',
            scrollbar: {
                alwaysConsumeMouseWheel: false
            }
        };
    }
    exports.getOutputSimpleEditorOptions = getOutputSimpleEditorOptions;
});
//# __sourceMappingURL=richTransform.js.map