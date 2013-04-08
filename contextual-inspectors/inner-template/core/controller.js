/**
    @module "controller"
    @requires montage
*/
var Montage = require("montage").Montage;

/**
    Description TODO
    @class module:"/controller".Controller
    @extends module:montage.Montage
*/
exports.Controller = Montage.create(Montage, /** @lends module:"/controller".Controller# */ {

    /**
     * Returns where the contextual inspector should be positioned. Must return
     * an object with `left` and `top` properties. By default these are relative
     * to the top, left of the object, but by including the optional boolean
     * `isAbsolute` property and setting to true it will be positioned absolutely
     * on the stage.
     * case the inspector is positioned
     * @type {Function}
     */
    getPosition: {
        value: function (stageWidth, stageHeight, objectWidth, objectHeight, objectLeft, objectTop, object) {
            return {left: 0, top: 0};
        }
    },

    inspectorComponent: {
        value: function () {
            return require.async("../ui/inner-template-inspector.reel").get("InnerTemplateInspector");
        }
    }

});
