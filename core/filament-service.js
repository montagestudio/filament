var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application;

exports.FilamentService = Montage.specialize({

    constructor: {
        value: function FilamentService (applicationDelegate) {
            this._applicationDelegate = applicationDelegate;
        }
    },

    _applicationDelegate: {
        value: null
    },

    showNotification: {
        value: function(message) {
            // TODO: this is not an async activity but since we currently lack
            // a proper info bar we'll use this for now.
            application.dispatchEventNamed("asyncActivity", true, false, {
                promise: Promise.resolve(),
                title: message
            });
        }
    },

    dispatchAppEventNamed: {
        value: function(type, canBubble, cancelable, detail) {
            application.dispatchEventNamed(type, canBubble, cancelable, detail);
        }
    }
});
