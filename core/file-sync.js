var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    md5 = require("md5-jkmyers");

exports.FileSyncService = Montage.specialize({
    intervalId: {
        value: null
    },

    document: {
        value: null
    },

    running: {
        value: null
    },

    constructor: {
        value: function(document) {
            this.document = document;
        }
    },

    _getDisplayedDocument: function () {
        var lines = [];
        for (var i = 0; i < this.document.codeMirrorDocument.children.length; i++) {
            var part = this.document.codeMirrorDocument.children[i];
            for (var j = 0; j < part.lines.length; j++) {
                lines.push(part.lines[j].text);
            }
        }
        return lines.join('\n');
    },

    _documentHasChanged: {
        value: function() {
            var result = (!this.document.isDirty && this._getDisplayedDocument() != this.document.content);
            return Promise.resolve(result);
        }
    },

    _run: {
        value: function () {
            var self = this;
            this._documentHasChanged().then(function(hasChanged) {
                if (hasChanged) {
                    self.document.isDirty = true;
                }
            });
        }
    },

    start: {
        value: function(timeout) {
            var self = this;
            this._run();
            this.intervalId = setInterval(function() {
                self._run();
            }, timeout);
            return Promise.resolve();
        }
    },

    stop: {
        value: function() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                if (this.running) {
                    return this.running;
                }
            }
            return Promise.resolve();
        }
    }
});