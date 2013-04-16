/**
    @module "./node-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./node-cell.reel".NodeCell
    @extends module:montage/ui/component.Component
*/
exports.NodeCell = Montage.create(Component, /** @lends module:"./node-cell.reel".NodeCell# */ {

    nodeInfo: {
        value: null
    },

    didCreate: {
        value: function () {
            this.addOwnPropertyChangeListener("nodeInfo.depth", this);
        }
    },

    handleDepthChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            this.element.style.paddingLeft = (20 * this.getPath("nodeInfo.depth")) + 'px';
        }
    }

});
