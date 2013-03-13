var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.Indent = Montage.create(Component, {

    hasTemplate: { value: false },

    didCreate: {
        value: function () {
            this.depth = null;
            this.addOwnPropertyChangeListener("depth", this);
        }
    },

    canDraw: {
        value: function () {
            return this.depth !== null;
        }
    },

    handleDepthChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            this.element.style.paddingLeft = (2 * this.depth) + 'em';
        }
    }

});
