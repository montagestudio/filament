/**
 * @module ui/create-node-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class CreateNodeCell
 * @extends Component
 */
exports.CreateNodeCell = Component.specialize(/** @lends CreateNodeCell# */ {

    nodeSegment: {
        value: null
    },

    _montageId: {
        value: null
    },

    montageId: {
        set: function (value) {
            this._montageId = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._montageId;
        }
    },

    _montageArg: {
        value: null
    },

    montageArg: {
        set: function (value) {
            this._montageArg = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._montageArg;
        }
    },

    _montageParam: {
        value: null
    },

    montageParam: {
        set: function (value) {
            this._montageParam = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._montageParam;
        }
    },

    _tagName: {
        value: null
    },

    tagName: {
        set: function (value) {
            this._tagName = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._tagName;
        }
    },

    constructor: {
        value: function CreateNodeCell() {
            this.super();
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
            if (!this.tagName) {return;}

            evt.dataTransfer.effectAllowed = "all";
            var element = document.createElement(this.tagName);
            if (this.montageArg){
                element.dataset.arg = this.montageArg;
            }
            if (this.montageParam){
                element.dataset.param = this.montageParam;
            }
            if (this.montageId){
                element.dataset.montageId = this.montageId;
            }

            evt.dataTransfer.setData(MimeTypes.HTML_ELEMENT, element.outerHTML);
        }
    },

    reset: {
        value: function () {
            this.tagName = null;
            this.montageId = null;
            this.montageArg = null;
        }
    },

    handleResetNodeButtonAction: {
        value: function (evt) {
            this.reset();
        }
    },

    draw: {
        value: function () {
            var draggable = !!(this.tagName && this.tagName.trim().length);
            this.nodeSegment.setAttribute("draggable", draggable.toString());
        }
    }
});
