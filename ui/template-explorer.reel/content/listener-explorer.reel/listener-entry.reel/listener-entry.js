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


    //TODO what are the target objects for? the card we are working on?
    targetObject: {
        value: null
    },

    handlePress: {
        value: function(evt) {
            if (this.listenerInfo) {
                // this.listenerInfo.targetObject = this.object;
                var listenerModel = Object.create(null);
                listenerModel.targetObject = this.targetObject;
                listenerModel.type = this.listenerInfo.type;
                listenerModel.listener = this.listenerInfo.listener;
                listenerModel.useCapture = this.listenerInfo.useCapture;
                // TODO why is targetObject null on listeners, is ti necesary what is it for?
                this.dispatchEventNamed("editListenerForObject", true, false, {
                    listenerModel: listenerModel,
                    existingListener: this.listenerInfo
                });
            }
        }
    }

});
