/**
    @module "./binding-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application;

/**
    Description TODO
    @class module:"./binding-entry.reel".BindingEntry
    @extends module:montage/ui/component.Component
*/
exports.BindingEntry = Montage.create(Component, /** @lends module:"./binding-entry.reel".BindingEntry# */ {


    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this.element.addEventListener("mouseup", this, false);
        }
    },

    binding: {
        value: null
    },

    targetObject: {
        value: null
    },

    handleMouseup: {
        value: function(evt) {
            if (this.targetObject && this.binding) {
                var bindingModel = Object.create(null);
                bindingModel.targetObject = this.targetObject;
                bindingModel.targetPath = this.binding.targetPath;
                bindingModel.oneway = this.binding.oneway;
                bindingModel.sourcePath = this.binding.sourcePath;

                this.dispatchEventNamed("editBindingForObject", true, false, {
                    bindingModel: bindingModel,
                    existingBinding: this.binding
                });
            }
        }
    }

});
