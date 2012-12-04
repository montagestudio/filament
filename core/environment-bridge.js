var Montage = require("montage/core/core").Montage;

exports.EnvironmentBridge = Montage.create(Montage, {

    mainComponentDidEnterEnvironment: {
        value: Function.noop
    },

    mainComponentDidExitEnvironment: {
        value: Function.noop
    },

    save: {
        value: Function.noop
    }

});
