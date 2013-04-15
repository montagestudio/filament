/**
    @module "./binding-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./binding-explorer.reel".BindingExplorer
    @extends module:montage/ui/component.Component
*/
exports.BindingExplorer = Montage.create(Component, /** @lends module:"./binding-explorer.reel".BindingExplorer# */ {

    didCreate: {
        value: function () {
            window.foo = this;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }
            // templateObjects.addButton
            this._defineBindingElements = this.templateObjects.defineBindingButton.map(function (component) {
                return component.element;
            });

            this._element.addEventListener("dragover", this, false);
            this._element.addEventListener("drop", this, false);
        }
    },

    templateObjectsController: {
        value: null
    },

    editingDocument: {
        value: null
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (
                this.templateObjects.defineBindingButton.indexOf(event.target.component) !== -1 &&
                event.dataTransfer.types.indexOf("text/plain") !== -1
            ) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },
    handleDrop: {
        value: function (evt) {
            var data = evt.dataTransfer.getData("text/plain");
            if (data.substr(0, 1) !== "@") { return; }

            var bindingModel = Object.create(null);
            bindingModel.targetObject = evt.target.component.detail.get("targetObject");
            bindingModel.sourcePath = data;
            this.templateObjects.bindingCreator.bindingModel = bindingModel;
        }
    },

    handleDefineBindingButtonAction: {
        value: function (evt) {
            //TODO not wipe out content if open/already has a bindingModel
            var bindingModel = Object.create(null);
            bindingModel.targetObject = evt.detail.get("targetObject");
            this.templateObjects.bindingCreator.bindingModel = bindingModel;
            //TODO reveal the creator
        }
    },

    handleCancelBindingButtonAction: {
        value: function (evt) {
            evt.stop();
            var targetObject = evt.detail.get("targetObject");
            var binding = evt.detail.get("binding");
            this.editingDocument.cancelOwnedObjectBinding(targetObject, binding);
        }
    }

});
