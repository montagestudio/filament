/**
 * @module ui/drawer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Drawer
 * @extends Component
 */
exports.Drawer = Component.specialize(/** @lends Drawer# */ {
    constructor: {
        value: function Drawer() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this.element.addEventListener("webkitAnimationEnd", this, false);
        }
    },

    handleWebkitAnimationEnd: {
        value: function (evt) {
            if (evt.animationName === "slideout") {
                this.classList.add("hide");
            }
        }
    },

    _isOpen: {
        value: false
    },

    isOpen: {
        get: function () {
            return this._isOpen;
        },
        set: function (value) {
            if (value) {
                this.classList.remove('hide');
            }
            this._isOpen = value;
        }
    }
});
