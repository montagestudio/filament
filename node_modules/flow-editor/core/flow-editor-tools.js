var Montage = require("montage").Montage,
    PenTools = require("ui/pen-tools"),
    Dict = require("collections/dict"),

    PREFIX_TOOL = "Tool";

exports.FlowEditorTools = Montage.specialize({

    constructor: {
        value: function () {
            this.super();

            this._cache = new Dict();
        }
    },

    _cache: {
        value: null
    },

    get: {
        value: function (key) {
            if (!this.has(key)) {
                return this._createTool(key);
            }

            return this._cache.get(key);
        }
    },

    has: {
        value: function (key) {
            return this._cache.has(key);
        }
    },

    delete: {
        value: function (key) {
            return this._cache.delete(key);
        }
    },

    _createTool: {
        value: function (key) {
            var toolName = key[0].toUpperCase() + key.slice(1) + PREFIX_TOOL,
                tool = null;

            if (PenTools[toolName]) {
                tool = PenTools[toolName].create();

                this._cache.set(key, tool);
            }

            return tool;
        }
    }
});
