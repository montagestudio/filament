/**
    @module "ui/selection/selection.reel"
    @requires montage
    @requires montage/ui/component
*/
var Selection = require("../selection.reel").Selection;

/**
    Description TODO
    @class module:"ui/selection/selection.reel".Selection
    @extends module:montage/ui/component.Component
*/
exports.Highlight = Selection.specialize(/** @lends Selection# */ {
    constructor: {
        value: function Selection() {
            this.super();
        }
    },

    willDraw: {
        value: function() {
            if (!(this.object)) {
                this._top = this._left = this._height = this._width = 0;
                return;
            }
            var rect = this._getBounds(this.object);

            this._top = rect.top;
            this._left = rect.left;
            this._height = rect.bottom - rect.top;
            this._width = rect.right - rect.left;
        }
    }
});
