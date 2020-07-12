define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyDeprecatedVariableMessage = void 0;
    function applyDeprecatedVariableMessage(schema) {
        schema.pattern = schema.pattern || '^(?!.*\\$\\{(env|config|command)\\.)';
        schema.patternErrorMessage = schema.patternErrorMessage ||
            nls.localize('deprecatedVariables', "'env.', 'config.' and 'command.' are deprecated, use 'env:', 'config:' and 'command:' instead.");
    }
    exports.applyDeprecatedVariableMessage = applyDeprecatedVariableMessage;
});
//# __sourceMappingURL=configurationResolverUtils.js.map