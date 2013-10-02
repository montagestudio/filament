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
                var listenerModel = Object.create(null),
                    listener = this.listenerInfo.listener;

                listenerModel.targetObject = this.targetObject;
                listenerModel.type = this.listenerInfo.type;
                listenerModel.useCapture = this.listenerInfo.useCapture;

                if (listener && listener.properties.has('handler') && listener.properties.has('action')) {
                    listenerModel.actionEventListener = listener;
                    listenerModel.listener = listener.properties.get('handler');
                    listenerModel.methodName = listener.properties.get('action');
                } else {
                    listenerModel.listener = listener;
                }

                this.dispatchEventNamed("editListenerForObject", true, false, {
                    listenerModel: listenerModel,
                    existingListener: this.listenerInfo
                });
            }
        }
    }

});
