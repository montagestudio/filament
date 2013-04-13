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

    templateObjectsController: {
        value: null
    },

    editingDocument: {
        value: null
    },

    handleDefineBindingButtonAction: {
        value: function (evt) {
            // TODO bring up the UI for creating a binding on this object
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
