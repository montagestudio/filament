var Montage = require("montage").Montage;

var ApplicationDelegate = Montage.specialize({

    updateStatusMessage: {
        value: Function.noop
    }

});

exports.applicationDelegateMock = function (options) {
    var applicationDelegate = new ApplicationDelegate();

    Object.keys(options || {}).forEach(function (key) {
        applicationDelegate[key] = options[key];
    });

    return applicationDelegate;
};
