var Montage = require("montage").Montage;

var Rollbar = Montage.specialize({

    configure: {
        value: Function.noop
    }

});

exports.rollbarMock = function (options) {
    var rollbar = new Rollbar();

    Object.keys(options || {}).forEach(function (key) {
        rollbar [key] = options[key];
    });

    return rollbar ;
};
