/**
 * @module ui/node-materials-item.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MIME_TYPES = require("core/mime-types");

/**
 * @class NodeMaterialsItem
 * @extends Component
 */
exports.NodeMaterialsItem = Component.specialize(/** @lends NodeMaterialsItem# */ {
    constructor: {
        value: function NodeMaterialsItem() {
            this.super();
        }
    },

    material: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, true);
            }
        }
    },

    captureDragstart: {
        value: function (event) {
            if (this.material) {
                var dataTransfer = event.dataTransfer;

                if (dataTransfer) {
                    dataTransfer.effectAllowed = 'copy';

                    dataTransfer.setData(MIME_TYPES.TEXT_PLAIN, this.material.id);
                }
            }
        }
    }

});
