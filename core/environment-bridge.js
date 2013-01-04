var Montage = require("montage/core/core").Montage;

exports.EnvironmentBridge = Montage.create(Montage, {

    save: {
        value: Function.noop
    }

});
