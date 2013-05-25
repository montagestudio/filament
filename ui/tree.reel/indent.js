var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.Indent = Montage.create(Component, {

    hasTemplate: { value: false },

    constructor: {
        value: function Indent() {
            this.super();
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

    iteration: {
        value: null
    },

    depth: {
        value: 0
    },

    object: {
        value: null
    },

    indentValue: {
        value: 20
    },

    indentUnit: {
        value: "px"
    },

    draw: {
        value: function () {
            this.element.style.paddingLeft = (this.indentValue * this.depth) + this.indentUnit;
        }
    }

});
