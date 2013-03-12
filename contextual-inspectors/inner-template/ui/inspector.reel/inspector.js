/**
    @module "ui//inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Inspector = require("contextual-inspectors/base/ui/inspector.reel").Inspector;

/**
    Description TODO
    @class module:"ui//inspector.reel".Inspector
    @extends module:montage/ui/component.Component
*/
exports.Inspector = Montage.create(Inspector, /** @lends module:"ui//inspector.reel".Inspector# */ {

    willDraw: {
        value: function() {
            if (!(this.object.stageObject && this.object.stageObject.element)) {
                this._top = this._left = this._height = this._width = 0;
                return;
            }

            var object = this.object.stageObject,
                el = "element" in object ? object.element : object;

            var rect = this._getBounds(el);

            this._top = rect.top;
            this._left = rect.left;
            this._height = rect.bottom - rect.top;
            this._width = rect.right - rect.left;
        }
    },

    draw: {
        value: function() {
            this._element.style.position = "absolute";
            this._element.style.top = this._top + "px";
            this._element.style.left = this._left + "px";
            this._element.style.height = this._height + "px";
            this._element.style.width = this._width + "px";
        }
    },

});
