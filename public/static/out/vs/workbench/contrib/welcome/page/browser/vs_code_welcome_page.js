/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/nls"], function (require, exports, strings_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = () => `
<div class="welcomePageContainer">
	<div class="welcomePage" role="document">
		<div class="title">
			<h1 class="caption">${strings_1.escape(nls_1.localize('welcomePage.vscode', "Visual Studio Code"))}</h1>
			<p class="subtitle detail">${strings_1.escape(nls_1.localize({ key: 'welcomePage.editingEvolved', comment: ['Shown as subtitle on the Welcome page.'] }, "Editing evolved"))}</p>
		</div>
		<div class="row">
			<div class="splash">
				<div class="section start">
					<h2 class="caption">${strings_1.escape(nls_1.localize('welcomePage.start', "Start"))}</h2>
					<ul>
						<li><a href="command:workbench.action.files.newUntitledFile">${strings_1.escape(nls_1.localize('welcomePage.newFile', "New file"))}</a></li>
						<li class="mac-only"><a href="command:workbench.action.files.openFileFolder">${strings_1.escape(nls_1.localize('welcomePage.openFolder', "Open folder..."))}</a></li>
						<li class="windows-only linux-only"><a href="command:workbench.action.files.openFolder">${strings_1.escape(nls_1.localize('welcomePage.openFolder', "Open folder..."))}</a></li>
						<li><a href="command:workbench.action.addRootFolder">${strings_1.escape(nls_1.localize('welcomePage.addWorkspaceFolder', "Add workspace folder..."))}</a></li>
					</ul>
				</div>
				<div class="section recent">
					<h2 class="caption">${strings_1.escape(nls_1.localize('welcomePage.recent', "Recent"))}</h2>
					<ul class="list">
						<!-- Filled programmatically -->
						<li class="moreRecent"><a href="command:workbench.action.openRecent">${strings_1.escape(nls_1.localize('welcomePage.moreRecent', "More..."))}</a><span class="path detail if_shortcut" data-command="workbench.action.openRecent">(<span class="shortcut" data-command="workbench.action.openRecent"></span>)</span></li>
					</ul>
					<p class="none detail">${strings_1.escape(nls_1.localize('welcomePage.noRecentFolders', "No recent folders"))}</p>
				</div>
				<div class="section help">
					<h2 class="caption">${strings_1.escape(nls_1.localize('welcomePage.help', "Help"))}</h2>
					<ul>
						<li class="keybindingsReferenceLink"><a href="command:workbench.action.keybindingsReference">${strings_1.escape(nls_1.localize('welcomePage.keybindingsCheatsheet', "Printable keyboard cheatsheet"))}</a></li>
						<li><a href="command:workbench.action.openIntroductoryVideosUrl">${strings_1.escape(nls_1.localize('welcomePage.introductoryVideos', "Introductory videos"))}</a></li>
						<li><a href="command:workbench.action.openTipsAndTricksUrl">${strings_1.escape(nls_1.localize('welcomePage.tipsAndTricks', "Tips and Tricks"))}</a></li>
						<li><a href="command:workbench.action.openDocumentationUrl">${strings_1.escape(nls_1.localize('welcomePage.productDocumentation', "Product documentation"))}</a></li>
						<li><a href="https://github.com/Microsoft/vscode">${strings_1.escape(nls_1.localize('welcomePage.gitHubRepository', "GitHub repository"))}</a></li>
						<li><a href="http://stackoverflow.com/questions/tagged/vscode?sort=votes&pageSize=50">${strings_1.escape(nls_1.localize('welcomePage.stackOverflow', "Stack Overflow"))}</a></li>
						<li><a href="command:workbench.action.openNewsletterSignupUrl">${strings_1.escape(nls_1.localize('welcomePage.newsletterSignup', "Join our Newsletter"))}</a></li>
					</ul>
				</div>
				<p class="showOnStartup"><input type="checkbox" id="showOnStartup" class="checkbox"> <label class="caption" for="showOnStartup">${strings_1.escape(nls_1.localize('welcomePage.showOnStartup', "Show welcome page on startup"))}</label></p>
			</div>
			<div class="commands">
				<div class="section customize">
					<h2 class="caption">${strings_1.escape(nls_1.localize('welcomePage.customize', "Customize"))}</h2>
					<div class="list">
						<div class="item showLanguageExtensions"><button data-href="command:workbench.extensions.action.showLanguageExtensions"><h3 class="caption">${strings_1.escape(nls_1.localize('welcomePage.installExtensionPacks', "Tools and languages"))}</h3> <span class="detail">${strings_1.escape(nls_1.localize('welcomePage.installExtensionPacksDescription', "Install support for {0} and {1}"))
        .replace('{0}', `<span class="extensionPackList"></span>`)
        .replace('{1}', `<a href="command:workbench.extensions.action.showLanguageExtensions" title="${nls_1.localize('welcomePage.showLanguageExtensions', "Show more language extensions")}">${strings_1.escape(nls_1.localize('welcomePage.moreExtensions', "more"))}</a>`)}
						</span></button></div>
						<div class="item showRecommendedKeymapExtensions"><button data-href="command:workbench.extensions.action.showRecommendedKeymapExtensions"><h3 class="caption">${strings_1.escape(nls_1.localize('welcomePage.installKeymapDescription', "Settings and keybindings"))}</h3> <span class="detail">${strings_1.escape(nls_1.localize('welcomePage.installKeymapExtension', "Install the settings and keyboard shortcuts of {0} and {1}"))
        .replace('{0}', `<span class="keymapList"></span>`)
        .replace('{1}', `<a href="command:workbench.extensions.action.showRecommendedKeymapExtensions" title="${nls_1.localize('welcomePage.showKeymapExtensions', "Show other keymap extensions")}">${strings_1.escape(nls_1.localize('welcomePage.others', "others"))}</a>`)}
						</span></button></div>
						<div class="item selectTheme"><button data-href="command:workbench.action.selectTheme"><h3 class="caption">${strings_1.escape(nls_1.localize('welcomePage.colorTheme', "Color theme"))}</h3> <span class="detail">${strings_1.escape(nls_1.localize('welcomePage.colorThemeDescription', "Make the editor and your code look the way you love"))}</span></button></div>
					</div>
				</div>
				<div class="section learn">
					<h2 class="caption">${strings_1.escape(nls_1.localize('welcomePage.learn', "Learn"))}</h2>
					<div class="list">
						<div class="item showCommands"><button data-href="command:workbench.action.showCommands"><h3 class="caption">${strings_1.escape(nls_1.localize('welcomePage.showCommands', "Find and run all commands"))}</h3> <span class="detail">${strings_1.escape(nls_1.localize('welcomePage.showCommandsDescription', "Rapidly access and search commands from the Command Palette ({0})")).replace('{0}', '<span class="shortcut" data-command="workbench.action.showCommands"></span>')}</span></button></div>
						<div class="item showInterfaceOverview"><button data-href="command:workbench.action.showInterfaceOverview"><h3 class="caption">${strings_1.escape(nls_1.localize('welcomePage.interfaceOverview', "Interface overview"))}</h3> <span class="detail">${strings_1.escape(nls_1.localize('welcomePage.interfaceOverviewDescription', "Get a visual overlay highlighting the major components of the UI"))}</span></button></div>
						<div class="item showInteractivePlayground"><button data-href="command:workbench.action.showInteractivePlayground"><h3 class="caption">${strings_1.escape(nls_1.localize('welcomePage.interactivePlayground', "Interactive playground"))}</h3> <span class="detail">${strings_1.escape(nls_1.localize('welcomePage.interactivePlaygroundDescription', "Try out essential editor features in a short walkthrough"))}</span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
`;
});
//# __sourceMappingURL=vs_code_welcome_page.js.map