/**
    @module "./listener-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./listener-entry.reel".ListenerEntry
    @extends module:montage/ui/component.Component
*/
exports.ListenerEntry = Montage.create(Component, /** @lends module:"./listener-entry.reel".ListenerEntry# */ {

    listenerInfo: {
        value: null
    },

    targetObject: {
        value: null
    },

    handlePress: {
        value: function(evt) {
            if (this.listenerInfo) {
                var listenerModel = Object.create(null);
                listenerModel.targetObject = this.targetObject;
                listenerModel.type = this.listenerInfo.type;
                listenerModel.listener = this.listenerInfo.listener;
                listenerModel.useCapture = this.listenerInfo.useCapture;
                this.dispatchEventNamed("editListenerForObject", true, false, {
                    listenerModel: listenerModel,
                    existingListener: this.listenerInfo
                });
            }
        }
    }

});
