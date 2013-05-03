/**
    @module "./listener-jig.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./listener-jig.reel".ListenerJig
    @extends module:montage/ui/component.Component
*/
exports.ListenerJig = Montage.create(Component, /** @lends module:"./listener-jig.reel".ListenerJig# */ {

    editingDocument: {
        value: null
    },

    listenerModel: {
        value: null
    },

    handleAddListenerButtonAction: {
        value: function (evt) {
            evt.stop();
            var model = this.listenerModel,
                target = model.targetObject,
                type = model.type,
                listener = model.listener,
                useCapture = model.useCapture;

            //TODO provide support for updating an listener entry
            this.editingDocument.addOwnedObjectEventListener(target, type, listener, useCapture);
            this.listenerModel = null;
        }
    },

    handleCancelButtonAction: {
        value: function (evt) {
            evt.stop();
            this.listenerModel = null;
        }
    }

});
