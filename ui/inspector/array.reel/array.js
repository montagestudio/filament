/**
    @module "ui/array.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Bindings = require("montage/core/bindings").Bindings;

var converter = {
    convert: function(value) {
        var parsed;
        try {
            parsed = JSON.parse("[" + value + "]");
        } catch (e) {}

        if (parsed) {
            return parsed;
        }

        return null;
    },

    revert: function(value) {
        if (!value || !Array.isArray(value)) {
            return null;
        }

        return value.map(function(item) { return JSON.stringify(item); }).join(",\n");
    }
};

/**
    Description TODO
    @class module:"ui/array.reel".Array
    @extends module:montage/ui/component.Component
*/
exports.Array = Montage.create(Component, /** @lends module:"ui/array.reel".Array# */ {

    didCreate: {
        value: function() {
            this.defineBinding("array", {
                "<->": "string",
                converter: converter
            });
        }
    },

    _string: {
        value: null
    },
    string: {
        get: function() {
            return this._string;
        },
        set: function(value) {
            if (this._string === value) {
                return;
            }
            this._string = value;
            this.needsDraw = true;
        }
    },

    array: {
        value: null
    },

    handleChange: {
        value: function(event) {
            this.string = this._textareaEl.value;
        }
    },

    prepareForDraw: {
        value: function() {
            this._textareaEl.addEventListener("change", this, false);
        }
    },

    draw: {
        value: function() {
            this._textareaEl.value = this._string;
        }
    }


});
