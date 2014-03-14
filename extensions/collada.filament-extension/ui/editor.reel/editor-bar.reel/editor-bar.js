/**
 * @module ui/editor-bar.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class EditorBar
 * @extends Component
 */
exports.EditorBar = Component.specialize(/** @lends EditorBar# */ {

    constructor: {
        value: function EditorBar() {
            this.super();
        }
    },

    handleCloseEditorAction: {
        value: function (event) {
            event.stopImmediatePropagation();

            this.dispatchEventNamed("exitSceneEditor", true, true);
            this.dispatchEventNamed("exitModalEditor", true, true);
        }
    }

});
