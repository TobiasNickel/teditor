/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandTrackerAddon = exports.ScrollPosition = void 0;
    /**
     * The minimum size of the prompt in which to assume the line is a command.
     */
    const MINIMUM_PROMPT_LENGTH = 2;
    var Boundary;
    (function (Boundary) {
        Boundary[Boundary["Top"] = 0] = "Top";
        Boundary[Boundary["Bottom"] = 1] = "Bottom";
    })(Boundary || (Boundary = {}));
    var ScrollPosition;
    (function (ScrollPosition) {
        ScrollPosition[ScrollPosition["Top"] = 0] = "Top";
        ScrollPosition[ScrollPosition["Middle"] = 1] = "Middle";
    })(ScrollPosition = exports.ScrollPosition || (exports.ScrollPosition = {}));
    class CommandTrackerAddon {
        constructor() {
            this._currentMarker = Boundary.Bottom;
            this._selectionStart = null;
            this._isDisposable = false;
        }
        activate(terminal) {
            this._terminal = terminal;
            terminal.onKey(e => this._onKey(e.key));
        }
        dispose() {
        }
        _onKey(key) {
            if (key === '\x0d') {
                this._onEnter();
            }
            // Clear the current marker so successive focus/selection actions are performed from the
            // bottom of the buffer
            this._currentMarker = Boundary.Bottom;
            this._selectionStart = null;
        }
        _onEnter() {
            if (!this._terminal) {
                return;
            }
            if (this._terminal.buffer.active.cursorX >= MINIMUM_PROMPT_LENGTH) {
                this._terminal.registerMarker(0);
            }
        }
        scrollToPreviousCommand(scrollPosition = 0 /* Top */, retainSelection = false) {
            if (!this._terminal) {
                return;
            }
            if (!retainSelection) {
                this._selectionStart = null;
            }
            let markerIndex;
            const currentLineY = Math.min(this._getLine(this._terminal, this._currentMarker), this._terminal.buffer.active.baseY);
            const viewportY = this._terminal.buffer.active.viewportY;
            if (!retainSelection && currentLineY !== viewportY) {
                // The user has scrolled, find the line based on the current scroll position. This only
                // works when not retaining selection
                const markersBelowViewport = this._terminal.markers.filter(e => e.line >= viewportY).length;
                // -1 will scroll to the top
                markerIndex = this._terminal.markers.length - markersBelowViewport - 1;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                markerIndex = this._terminal.markers.length - 1;
            }
            else if (this._currentMarker === Boundary.Top) {
                markerIndex = -1;
            }
            else if (this._isDisposable) {
                markerIndex = this._findPreviousCommand(this._terminal);
                this._currentMarker.dispose();
                this._isDisposable = false;
            }
            else {
                markerIndex = this._terminal.markers.indexOf(this._currentMarker) - 1;
            }
            if (markerIndex < 0) {
                this._currentMarker = Boundary.Top;
                this._terminal.scrollToTop();
                return;
            }
            this._currentMarker = this._terminal.markers[markerIndex];
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        scrollToNextCommand(scrollPosition = 0 /* Top */, retainSelection = false) {
            if (!this._terminal) {
                return;
            }
            if (!retainSelection) {
                this._selectionStart = null;
            }
            let markerIndex;
            const currentLineY = Math.min(this._getLine(this._terminal, this._currentMarker), this._terminal.buffer.active.baseY);
            const viewportY = this._terminal.buffer.active.viewportY;
            if (!retainSelection && currentLineY !== viewportY) {
                // The user has scrolled, find the line based on the current scroll position. This only
                // works when not retaining selection
                const markersAboveViewport = this._terminal.markers.filter(e => e.line <= viewportY).length;
                // markers.length will scroll to the bottom
                markerIndex = markersAboveViewport;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                markerIndex = this._terminal.markers.length;
            }
            else if (this._currentMarker === Boundary.Top) {
                markerIndex = 0;
            }
            else if (this._isDisposable) {
                markerIndex = this._findNextCommand(this._terminal);
                this._currentMarker.dispose();
                this._isDisposable = false;
            }
            else {
                markerIndex = this._terminal.markers.indexOf(this._currentMarker) + 1;
            }
            if (markerIndex >= this._terminal.markers.length) {
                this._currentMarker = Boundary.Bottom;
                this._terminal.scrollToBottom();
                return;
            }
            this._currentMarker = this._terminal.markers[markerIndex];
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        _scrollToMarker(marker, position) {
            if (!this._terminal) {
                return;
            }
            let line = marker.line;
            if (position === 1 /* Middle */) {
                line = Math.max(line - Math.floor(this._terminal.rows / 2), 0);
            }
            this._terminal.scrollToLine(line);
        }
        selectToPreviousCommand() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToPreviousCommand(1 /* Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToNextCommand() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToNextCommand(1 /* Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToPreviousLine() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToPreviousLine(this._terminal, 1 /* Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToNextLine() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToNextLine(this._terminal, 1 /* Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        _selectLines(xterm, start, end) {
            if (end === null) {
                end = Boundary.Bottom;
            }
            let startLine = this._getLine(xterm, start);
            let endLine = this._getLine(xterm, end);
            if (startLine > endLine) {
                const temp = startLine;
                startLine = endLine;
                endLine = temp;
            }
            // Subtract a line as the marker is on the line the command run, we do not want the next
            // command in the selection for the current command
            endLine -= 1;
            xterm.selectLines(startLine, endLine);
        }
        _getLine(xterm, marker) {
            // Use the _second last_ row as the last row is likely the prompt
            if (marker === Boundary.Bottom) {
                return xterm.buffer.active.baseY + xterm.rows - 1;
            }
            if (marker === Boundary.Top) {
                return 0;
            }
            return marker.line;
        }
        scrollToPreviousLine(xterm, scrollPosition = 0 /* Top */, retainSelection = false) {
            if (!retainSelection) {
                this._selectionStart = null;
            }
            if (this._currentMarker === Boundary.Top) {
                xterm.scrollToTop();
                return;
            }
            if (this._currentMarker === Boundary.Bottom) {
                this._currentMarker = this._addMarkerOrThrow(xterm, this._getOffset(xterm) - 1);
            }
            else {
                const offset = this._getOffset(xterm);
                if (this._isDisposable) {
                    this._currentMarker.dispose();
                }
                this._currentMarker = this._addMarkerOrThrow(xterm, offset - 1);
            }
            this._isDisposable = true;
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        scrollToNextLine(xterm, scrollPosition = 0 /* Top */, retainSelection = false) {
            if (!retainSelection) {
                this._selectionStart = null;
            }
            if (this._currentMarker === Boundary.Bottom) {
                xterm.scrollToBottom();
                return;
            }
            if (this._currentMarker === Boundary.Top) {
                this._currentMarker = this._addMarkerOrThrow(xterm, this._getOffset(xterm) + 1);
            }
            else {
                const offset = this._getOffset(xterm);
                if (this._isDisposable) {
                    this._currentMarker.dispose();
                }
                this._currentMarker = this._addMarkerOrThrow(xterm, offset + 1);
            }
            this._isDisposable = true;
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        _addMarkerOrThrow(xterm, cursorYOffset) {
            const marker = xterm.addMarker(cursorYOffset);
            if (!marker) {
                throw new Error(`Could not create marker for ${cursorYOffset}`);
            }
            return marker;
        }
        _getOffset(xterm) {
            if (this._currentMarker === Boundary.Bottom) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Top) {
                return 0 - (xterm.buffer.active.baseY + xterm.buffer.active.cursorY);
            }
            else {
                let offset = this._getLine(xterm, this._currentMarker);
                offset -= xterm.buffer.active.baseY + xterm.buffer.active.cursorY;
                return offset;
            }
        }
        _findPreviousCommand(xterm) {
            if (this._currentMarker === Boundary.Top) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                return xterm.markers.length - 1;
            }
            let i;
            for (i = xterm.markers.length - 1; i >= 0; i--) {
                if (xterm.markers[i].line < this._currentMarker.line) {
                    return i;
                }
            }
            return -1;
        }
        _findNextCommand(xterm) {
            if (this._currentMarker === Boundary.Top) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                return xterm.markers.length - 1;
            }
            let i;
            for (i = 0; i < xterm.markers.length; i++) {
                if (xterm.markers[i].line > this._currentMarker.line) {
                    return i;
                }
            }
            return xterm.markers.length;
        }
    }
    exports.CommandTrackerAddon = CommandTrackerAddon;
});
//# __sourceMappingURL=commandTrackerAddon.js.map