/**
 * @module ui/spinner.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Spinner
 * @extends Component
 */
exports.Spinner = Component.specialize(/** @lends Spinner# */ {

    constructor: {
        value: function Spinner() {
            this.super();
        }
    },

    _loading: {
        value: false
    },

    loading: {
        get: function() {
            return this._loading;
        },
        set: function(isloading) {
            if (this._loading !== isloading) {
                this._loading = isloading;
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function() {
            var classList = this.element.classList,
                exists = classList.contains("animate");

            if (this.loading) {
                if (!exists) {
                    classList.add("animate");
                }
            } else {
                if (exists) {
                    classList.remove("animate");
                }

            }
        }
    }

});
