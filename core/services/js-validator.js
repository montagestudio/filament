var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    esprima = require("esprima");

exports.JsValidatorService = Montage.specialize({
    _running: {
        value: null
    },

    constructor: {
        value: function() {
        }
    },

    validate: {
        value: function (_document) {
            if (!this._running) {
                this._running = true;
                try {
                    esprima.parse(_document.codeMirrorDocument.getValue());
                } catch (err) {
                    return {
                        line: err.lineNumber - 1,
                        column: err.column,
                        message: err.description
                    };
                } finally {
                    this._running = false;
                }
            }
        }
    }
});