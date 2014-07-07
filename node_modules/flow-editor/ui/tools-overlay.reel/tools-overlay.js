/**
 * @module ui/tools-overlay.reel
 * @requires montage/ui/component
 */
var Overlay = require("montage/ui/overlay.reel/").Overlay;

/**
 * @class ToolsOverlay
 * @extends Component
 */
exports.ToolsOverlay = Overlay.specialize(/** @lends ToolsOverlay# */ {

    constructor: {
        value: function ToolsOverlay() {
            this.super();
        }
    },

    items: {
        value: []
    },

    delegate: {
        value: null
    },

    _toolContainerCell: {
        value: null
    },

    showAtTarget: {
        value: function (toolContainerCell) {
            var toolCellPositions = toolContainerCell.element.getBoundingClientRect();

            this.position = {
                bottom: toolCellPositions.bottom - toolCellPositions.top,
                left: toolCellPositions.left
            };

            this.items = toolContainerCell.subTools;
            this._toolContainerCell = toolContainerCell;

            this.show();
        }
    },

    handleButtonAction: {
        value: function (event) {
            if (this.delegate && typeof this.delegate.handleSelectSubTool === "function") {
                this.delegate.handleSelectSubTool(event, this._toolContainerCell);
            }

            this.hide();
        }
    },

    position: {
        value: null
    },

    // Override the function _reposition in order to set the bottom property
    _reposition: {
        value: function() {
            var position = this._drawPosition;

            this.element.style.bottom = position.bottom + "px";
            this.element.style.left = position.left + "px";
        }
    }

});
