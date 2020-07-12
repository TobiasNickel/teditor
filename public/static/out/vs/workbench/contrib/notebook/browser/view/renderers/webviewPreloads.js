/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preloadsScriptStr = void 0;
    function webviewPreloads() {
        const vscode = acquireVsCodeApi();
        const handleInnerClick = (event) => {
            if (!event || !event.view || !event.view.document) {
                return;
            }
            for (let node = event.target; node; node = node.parentNode) {
                if (node instanceof HTMLAnchorElement && node.href) {
                    if (node.href.startsWith('blob:')) {
                        handleBlobUrlClick(node.href, node.download);
                    }
                    event.preventDefault();
                    break;
                }
            }
        };
        const handleBlobUrlClick = async (url, downloadName) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    const data = reader.result;
                    vscode.postMessage({
                        __vscode_notebook_message: true,
                        type: 'clicked-data-url',
                        data,
                        downloadName
                    });
                });
                reader.readAsDataURL(blob);
            }
            catch (e) {
                console.error(e.message);
            }
        };
        document.body.addEventListener('click', handleInnerClick);
        const preservedScriptAttributes = [
            'type', 'src', 'nonce', 'noModule', 'async',
        ];
        // derived from https://github.com/jquery/jquery/blob/d0ce00cdfa680f1f0c38460bc51ea14079ae8b07/src/core/DOMEval.js
        const domEval = (container) => {
            const arr = Array.from(container.getElementsByTagName('script'));
            for (let n = 0; n < arr.length; n++) {
                let node = arr[n];
                let scriptTag = document.createElement('script');
                scriptTag.text = node.innerText;
                for (let key of preservedScriptAttributes) {
                    const val = node[key] || node.getAttribute && node.getAttribute(key);
                    if (val) {
                        scriptTag.setAttribute(key, val);
                    }
                }
                // TODO: should script with src not be removed?
                container.appendChild(scriptTag).parentNode.removeChild(scriptTag);
            }
        };
        let observers = [];
        const resizeObserve = (container, id) => {
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target.id === id && entry.contentRect) {
                        vscode.postMessage({
                            __vscode_notebook_message: true,
                            type: 'dimension',
                            id: id,
                            data: {
                                height: entry.contentRect.height + __outputNodePadding__ * 2
                            }
                        });
                    }
                }
            });
            resizeObserver.observe(container);
            observers.push(resizeObserver);
        };
        function scrollWillGoToParent(event) {
            for (let node = event.target; node; node = node.parentNode) {
                if (!(node instanceof Element) || node.id === 'container') {
                    return false;
                }
                if (event.deltaY < 0 && node.scrollTop > 0) {
                    return true;
                }
                if (event.deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight) {
                    return true;
                }
            }
            return false;
        }
        const handleWheel = (event) => {
            if (event.defaultPrevented || scrollWillGoToParent(event)) {
                return;
            }
            vscode.postMessage({
                __vscode_notebook_message: true,
                type: 'did-scroll-wheel',
                payload: {
                    deltaMode: event.deltaMode,
                    deltaX: event.deltaX,
                    deltaY: event.deltaY,
                    deltaZ: event.deltaZ,
                    detail: event.detail,
                    type: event.type
                }
            });
        };
        function focusFirstFocusableInCell(cellId) {
            const cellOutputContainer = document.getElementById(cellId);
            if (cellOutputContainer) {
                const focusableElement = cellOutputContainer.querySelector('[tabindex="0"], [href], button, input, option, select, textarea');
                focusableElement === null || focusableElement === void 0 ? void 0 : focusableElement.focus();
            }
        }
        function createFocusSink(cellId, outputId, focusNext) {
            const element = document.createElement('div');
            element.tabIndex = 0;
            element.addEventListener('focus', () => {
                vscode.postMessage({
                    __vscode_notebook_message: true,
                    type: 'focus-editor',
                    id: outputId,
                    focusNext
                });
                setTimeout(() => {
                    // Move focus off the focus sink - single use
                    focusFirstFocusableInCell(cellId);
                }, 50);
            });
            return element;
        }
        function addMouseoverListeners(element, outputId) {
            element.addEventListener('mouseenter', () => {
                vscode.postMessage({
                    __vscode_notebook_message: true,
                    type: 'mouseenter',
                    id: outputId,
                    data: {}
                });
            });
            element.addEventListener('mouseleave', () => {
                vscode.postMessage({
                    __vscode_notebook_message: true,
                    type: 'mouseleave',
                    id: outputId,
                    data: {}
                });
            });
        }
        const dontEmit = Symbol('dontEmit');
        function createEmitter(listenerChange = () => undefined) {
            const listeners = new Set();
            return {
                fire(data) {
                    for (const listener of [...listeners]) {
                        listener.fn.call(listener.thisArg, data);
                    }
                },
                event(fn, thisArg, disposables) {
                    const listenerObj = { fn, thisArg };
                    const disposable = {
                        dispose: () => {
                            listeners.delete(listenerObj);
                            listenerChange(listeners);
                        },
                    };
                    listeners.add(listenerObj);
                    listenerChange(listeners);
                    if (disposables instanceof Array) {
                        disposables.push(disposable);
                    }
                    else if (disposables) {
                        disposables.add(disposable);
                    }
                    return disposable;
                },
            };
        }
        // Maps the events in the given emitter, invoking mapFn on each one. mapFn can return
        // the dontEmit symbol to skip emission.
        function mapEmitter(emitter, mapFn) {
            let listener;
            const mapped = createEmitter(listeners => {
                if (listeners.size && !listener) {
                    listener = emitter.event(data => {
                        const v = mapFn(data);
                        if (v !== dontEmit) {
                            mapped.fire(v);
                        }
                    });
                }
                else if (listener && !listeners.size) {
                    listener.dispose();
                }
            });
            return mapped.event;
        }
        const onWillDestroyOutput = createEmitter();
        const onDidCreateOutput = createEmitter();
        const matchesNs = (namespace, query) => namespace === '*' || query === namespace || query === 'undefined';
        window.acquireNotebookRendererApi = (namespace) => {
            if (!namespace || typeof namespace !== 'string') {
                throw new Error(`acquireNotebookRendererApi should be called your renderer type as a string, got: ${namespace}.`);
            }
            return {
                postMessage: vscode.postMessage,
                setState(newState) {
                    vscode.setState(Object.assign(Object.assign({}, vscode.getState()), { [namespace]: newState }));
                },
                getState() {
                    const state = vscode.getState();
                    return typeof state === 'object' && state ? state[namespace] : undefined;
                },
                onWillDestroyOutput: mapEmitter(onWillDestroyOutput, ([ns, data]) => matchesNs(namespace, ns) ? data : dontEmit),
                onDidCreateOutput: mapEmitter(onDidCreateOutput, ([ns, data]) => matchesNs(namespace, ns) ? data : dontEmit),
            };
        };
        window.addEventListener('wheel', handleWheel);
        window.addEventListener('message', rawEvent => {
            var _a;
            const event = rawEvent;
            switch (event.data.type) {
                case 'html':
                    {
                        const id = event.data.id;
                        let cellOutputContainer = document.getElementById(id);
                        let outputId = event.data.outputId;
                        if (!cellOutputContainer) {
                            const container = document.getElementById('container');
                            const upperWrapperElement = createFocusSink(id, outputId);
                            container.appendChild(upperWrapperElement);
                            let newElement = document.createElement('div');
                            newElement.id = id;
                            container.appendChild(newElement);
                            cellOutputContainer = newElement;
                            const lowerWrapperElement = createFocusSink(id, outputId, true);
                            container.appendChild(lowerWrapperElement);
                        }
                        let outputNode = document.createElement('div');
                        outputNode.style.position = 'absolute';
                        outputNode.style.top = event.data.top + 'px';
                        outputNode.style.left = event.data.left + 'px';
                        outputNode.style.width = 'calc(100% - ' + event.data.left + 'px)';
                        outputNode.style.minHeight = '32px';
                        outputNode.id = outputId;
                        addMouseoverListeners(outputNode, outputId);
                        let content = event.data.content;
                        outputNode.innerHTML = content;
                        cellOutputContainer.appendChild(outputNode);
                        // eval
                        domEval(outputNode);
                        resizeObserve(outputNode, outputId);
                        onDidCreateOutput.fire([event.data.apiNamespace, { element: outputNode, outputId }]);
                        vscode.postMessage({
                            __vscode_notebook_message: true,
                            type: 'dimension',
                            id: outputId,
                            data: {
                                height: outputNode.clientHeight
                            }
                        });
                        // don't hide until after this step so that the height is right
                        cellOutputContainer.style.display = event.data.initiallyHidden ? 'none' : 'block';
                    }
                    break;
                case 'view-scroll':
                    {
                        // const date = new Date();
                        // console.log('----- will scroll ----  ', date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
                        for (let i = 0; i < event.data.widgets.length; i++) {
                            let widget = document.getElementById(event.data.widgets[i].id);
                            widget.style.top = event.data.widgets[i].top + 'px';
                            widget.parentElement.style.display = 'block';
                        }
                        break;
                    }
                case 'clear':
                    onWillDestroyOutput.fire([undefined, undefined]);
                    document.getElementById('container').innerHTML = '';
                    for (let i = 0; i < observers.length; i++) {
                        observers[i].disconnect();
                    }
                    observers = [];
                    break;
                case 'clearOutput':
                    {
                        const id = event.data.id;
                        onWillDestroyOutput.fire([event.data.apiNamespace, { outputId: id }]);
                        let output = document.getElementById(id);
                        if (output && output.parentNode) {
                            document.getElementById(id).parentNode.removeChild(output);
                        }
                        // @TODO remove observer
                    }
                    break;
                case 'hideOutput':
                    {
                        const container = (_a = document.getElementById(event.data.id)) === null || _a === void 0 ? void 0 : _a.parentElement;
                        if (container) {
                            container.style.display = 'none';
                        }
                    }
                    break;
                case 'showOutput':
                    {
                        let output = document.getElementById(event.data.id);
                        if (output) {
                            output.parentElement.style.display = 'block';
                            output.style.top = event.data.top + 'px';
                        }
                    }
                    break;
                case 'preload':
                    let resources = event.data.resources;
                    let preloadsContainer = document.getElementById('__vscode_preloads');
                    for (let i = 0; i < resources.length; i++) {
                        const { uri } = resources[i];
                        const scriptTag = document.createElement('script');
                        scriptTag.setAttribute('src', uri);
                        preloadsContainer.appendChild(scriptTag);
                    }
                    break;
                case 'focus-output':
                    {
                        focusFirstFocusableInCell(event.data.id);
                        break;
                    }
            }
        });
        vscode.postMessage({
            __vscode_notebook_message: true,
            type: 'initialized'
        });
    }
    exports.preloadsScriptStr = (outputNodePadding) => `(${webviewPreloads})()`.replace(/__outputNodePadding__/g, `${outputNodePadding}`);
});
//# __sourceMappingURL=webviewPreloads.js.map