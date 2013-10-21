/**
    @module "./binding-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");


/**
    Description TODO
    @class module:"./binding-entry.reel".BindingEntry
    @extends module:montage/ui/component.Component
*/
exports.BindingEntry = Montage.create(Component, /** @lends module:"./binding-entry.reel".BindingEntry# */ {
    
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
        value: function(evt) {
            if (this.targetObject && this.binding) {
                var bindingModel = Object.create(null);
                bindingModel.targetObject = this.targetObject;
                bindingModel.targetPath = this.binding.targetPath;
                bindingModel.oneway = this.binding.oneway;
                bindingModel.sourcePath = this.binding.sourcePath;
                bindingModel.converter = this.binding.converter;

                this.dispatchEventNamed("editBindingForObject", true, false, {
                    bindingModel: bindingModel,
                    existingBinding: this.binding
                });
            }
        }
    },

    handleDragstart: {
        value: function (event) {
            event.dataTransfer.effectAllowed = 'all';

            if (this.targetObject && this.binding) {
                var bindingModel = Object.create(null);
                bindingModel.targetPath = this.binding.targetPath;
                bindingModel.oneway = this.binding.oneway;
                bindingModel.sourcePath = this.binding.sourcePath;
                // cant send converter TODO circular references
                if (this.binding.converter) {
                    bindingModel.converterLabel = this.binding.converter.label;
                }
                event.dataTransfer.setData(MimeTypes.MONTAGE_BINDING, JSON.stringify(bindingModel));
            }
        }
    }

});
