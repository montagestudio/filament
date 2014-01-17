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
        value: 18
    },

    indentUnit: {
        value: "px"
    },

    ignoreRoot: {
        value: false
    },

    draw: {
        value: function () {
            var depth = (this.ignoreRoot)? this.depth - 1 : this.depth;
            this.element.style.paddingLeft = (this.indentValue * depth) + this.indentUnit;
        }
    }

});
