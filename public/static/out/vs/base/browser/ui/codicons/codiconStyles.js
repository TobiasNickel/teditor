/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/browser/dom", "vs/base/common/async", "vs/css!./codicon/codicon", "vs/css!./codicon/codicon-modifications", "vs/css!./codicon/codicon-animations"], function (require, exports, codicons_1, dom_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function initialize() {
        let codiconStyleSheet = dom_1.createStyleSheet();
        codiconStyleSheet.id = 'codiconStyles';
        function updateAll() {
            const rules = [];
            for (let c of codicons_1.iconRegistry.all) {
                rules.push(formatRule(c));
            }
            codiconStyleSheet.innerHTML = rules.join('\n');
        }
        const delayer = new async_1.RunOnceScheduler(updateAll, 0);
        codicons_1.iconRegistry.onDidRegister(() => delayer.schedule());
        delayer.schedule();
    }
    function formatRule(c) {
        let def = c.definition;
        while (def instanceof codicons_1.Codicon) {
            def = def.definition;
        }
        return `.codicon-${c.id}:before { content: '${def.character}'; }`;
    }
    initialize();
});
//# __sourceMappingURL=codiconStyles.js.map