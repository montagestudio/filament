/**
 * @module ./binding-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class BindingsExplorer
 * @extends Component
 */
exports.BindingExplorer = Component.specialize(/** @lends BindingsExplorer# */ {
    constructor: {
        value: function BindingExplorer() {
            this.super();
        }
    }
});
