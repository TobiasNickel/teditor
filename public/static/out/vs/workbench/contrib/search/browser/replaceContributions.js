define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/search/common/replace", "vs/workbench/contrib/search/browser/replaceService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, extensions_1, replace_1, replaceService_1, platform_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerContributions = void 0;
    function registerContributions() {
        extensions_1.registerSingleton(replace_1.IReplaceService, replaceService_1.ReplaceService, true);
        platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(replaceService_1.ReplacePreviewContentProvider, 1 /* Starting */);
    }
    exports.registerContributions = registerContributions;
});
//# __sourceMappingURL=replaceContributions.js.map