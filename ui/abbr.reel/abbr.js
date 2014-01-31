/**
 * Expose to Montage an ABBR (abbreviation) tag
 * @module ui/abbr.reel
 * @requires montage/ui/component
 */
var Text = require("montage/ui/text.reel").Text;

/**
 * @class Abbr
 * @extends Component
 */
exports.Abbr = Text.specialize(/** @lends Abbr# */ {

    title: {
        value: ""
    },

    constructor: {
        value: function Abbr() {
            this.super();
        }
    },

    draw: {
        value: function () {
            this.super();
            this.element.setAttribute("title", this.title);
        }
    }
});
