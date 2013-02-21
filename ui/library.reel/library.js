var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Library = Montage.create(Component, {

    groups: {
        value: null
    },

    groupsController: {
        value: null
    },

    _visible: {
        value: false
    },
    visible: {
        get: function () {
            return this._visible;
        },
        set: function (value) {
            value = !!value;
            if (value !== this._visible) {
                this._visible = value;
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {
            // Note: Panel--hidden === !this._visible
            this._element.classList[(this._visible) ? "remove" : "add"]("Panel--hidden");
        }
    }

});
