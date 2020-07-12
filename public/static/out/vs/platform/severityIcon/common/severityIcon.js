/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/common/codicons"], function (require, exports, severity_1, themeService_1, colorRegistry_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SeverityIcon = void 0;
    var SeverityIcon;
    (function (SeverityIcon) {
        function className(severity) {
            switch (severity) {
                case severity_1.default.Ignore:
                    return 'severity-ignore ' + codicons_1.Codicon.info.classNames;
                case severity_1.default.Info:
                    return codicons_1.Codicon.info.classNames;
                case severity_1.default.Warning:
                    return codicons_1.Codicon.warning.classNames;
                case severity_1.default.Error:
                    return codicons_1.Codicon.error.classNames;
            }
            return '';
        }
        SeverityIcon.className = className;
    })(SeverityIcon = exports.SeverityIcon || (exports.SeverityIcon = {}));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const errorIconForeground = theme.getColor(colorRegistry_1.problemsErrorIconForeground);
        if (errorIconForeground) {
            const errorCodiconSelector = codicons_1.Codicon.error.cssSelector;
            collector.addRule(`
			.monaco-editor .zone-widget ${errorCodiconSelector},
			.markers-panel .marker-icon${errorCodiconSelector},
			.extensions-viewlet > .extensions ${errorCodiconSelector} {
				color: ${errorIconForeground};
			}
		`);
        }
        const warningIconForeground = theme.getColor(colorRegistry_1.problemsWarningIconForeground);
        if (warningIconForeground) {
            const warningCodiconSelector = codicons_1.Codicon.warning.cssSelector;
            collector.addRule(`
			.monaco-editor .zone-widget ${warningCodiconSelector},
			.markers-panel .marker-icon${warningCodiconSelector},
			.extensions-viewlet > .extensions ${warningCodiconSelector},
			.extension-editor ${warningCodiconSelector} {
				color: ${warningIconForeground};
			}
		`);
        }
        const infoIconForeground = theme.getColor(colorRegistry_1.problemsInfoIconForeground);
        if (infoIconForeground) {
            const infoCodiconSelector = codicons_1.Codicon.info.cssSelector;
            collector.addRule(`
			.monaco-editor .zone-widget ${infoCodiconSelector},
			.markers-panel .marker-icon${infoCodiconSelector},
			.extensions-viewlet > .extensions ${infoCodiconSelector},
			.extension-editor ${infoCodiconSelector} {
				color: ${infoIconForeground};
			}
		`);
        }
    });
});
//# __sourceMappingURL=severityIcon.js.map