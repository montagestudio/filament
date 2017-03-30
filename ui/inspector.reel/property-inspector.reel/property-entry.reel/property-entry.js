/**
    @module "./property-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./property-entry.reel".BindingEntry
    @extends module:montage/ui/component.Component
*/

exports.PropertyEntry = Component.specialize(/** @lends module:"./property-entry.reel".PropertyEntry# */ {
    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, false);
            }
        }
    },

    binding: {
        value: null
    },

    targetObject: {
        value: null
    },

    handlePress: {
        value: function (evt) {
            var bindingModel;
            if (this.targetObject && this.property) {
                if (typeof this.property.value === "object") {
                    return;
                }
                bindingModel = {
                    targetObject: this.targetObject,
                    targetPath: this.property.value.toString(),
                    oneway: this.property.oneway,
                    sourcePath: this.property.key,
                    converter: this.property.converter
                };
                this.dispatchEventNamed("addBinding", true, false, {
                    bindingModel: bindingModel,
                    existingBinding: this.property
                });
            }
        }
    }
});
