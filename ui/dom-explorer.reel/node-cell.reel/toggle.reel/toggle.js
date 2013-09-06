/**
 * @module ui/toggle.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Toggle
 * @extends Component
 */
exports.Toggle = Component.specialize(/** @lends Toggle# */ {

    _isOpen: {
        value: false,
    },

    isOpen :{
        set: function (value) {
            this._isOpen = value;
        },
        get: function () {
            return this._isOpen;
        }
    },

    constructor: {
        value: function Toggle() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }
            this.element.addEventListener("click", this, false);

        }
    },

    handleClick: {
        value: function (evt){
            evt.preventDefault();
            this.isOpen = !this.isOpen;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            if (this.isOpen) {
                this.element.setAttribute("open");
            } else {
                this.element.removeAttribute("open");
            }
        }
    }

});
