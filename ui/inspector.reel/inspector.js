/**
 * @module ui/inspector.reel
 */
var Component = require("montage/ui/component").Component,
    ListenerInspector = require("./listener-inspector.reel").ListenerInspector,
    MethodInspector = require("./method-inspector.reel").MethodInspector,
    PropertyInspector = require("./property-inspector.reel").PropertyInspector,
    StyleInspector = require("./style-inspector.reel").StyleInspector;

/**
 * @class Inspector
 * @extends Component
 */
exports.Inspector = Component.specialize(/** @lends Inspector# */ {

    currentTab: {
        value: "properties"
    }
});
