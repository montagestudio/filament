/**
 * @module ui/create-node-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class CreateTextNodeCell
 * @extends Component
 */
exports.CreateTextNodeCell = Component.specialize(/** @lends CreateTextNodeCell# */ {

    value: {
        value: ""
    },

    _defaultValue: {
        value: "Lorem ipsum"
    },

    constructor: {
        value: function CreateTextNodeCell() {
            this.super();
            this.reset();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this.element.addEventListener("dragstart", this);
        }
    },

    handleDragstart: {
        value: function (evt) {
            evt.dataTransfer.effectAllowed = "copyMove";
            evt.dataTransfer.setData(MimeTypes.HTML_TEXT_NODE, this.value);
        }
    },

    reset: {
        value: function () {
            this.value = this._defaultValue;
        }
    },

    draw: {
        value: function () {
            var draggable = !!(this.value && this.value.trim().length);
            this.nodeSegment.setAttribute("draggable", draggable.toString());
        }
    }
});
