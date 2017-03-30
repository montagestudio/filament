/**
 * @module ui/inspector.reel//property-inspector.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PropertyInspector
 * @extends Component
 */
exports.PropertyInspector = Component.specialize(/** @lends PropertyInspector# */ {

    showInstanceProperties: {
        value: true
    },

    showDefaultProperties: {
        value: true
    },

    templateDidLoad: {
        value: function () {
            this.addEventListener("addBinding", this, false);
        }
    },

    handleAddBinding: {
        value: function (evt) {
            var bindingModel = evt.detail.bindingModel,
                existingBinding = evt.detail.existingBinding,
                bindingJig = this.templateObjects.bindingCreator,
                overlay = this.templateObjects.bindingOverlay;

            // If the binding jig is already referring to this binding, leave what's already in the overlay in case user was editing
            if (bindingJig.existingBinding !== existingBinding) {
                bindingJig.bindingModel = bindingModel;
                bindingJig.existingBinding = existingBinding;
            }

//            overlay.anchor = evt.target.element; //TODO when anchoring works well inside this scrollview
            overlay.show();
        }
    },
});
