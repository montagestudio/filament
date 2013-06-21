var Montage = require("montage/core/core").Montage;

exports.EnvironmentBridge = Montage.specialize({

    constructor: {
        value: function EnvironmentBridge() {
            this.super();
        }
    },

    save: {
        value: Function.noop
    }

});
