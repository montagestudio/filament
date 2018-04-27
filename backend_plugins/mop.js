var Promise = require("montage/core/promise").Promise;
var optimize = require("mop");

exports.optimize = function(location, config) {
    var slice = Array.prototype.slice;

    var status = config.out.status;

    config.out.status = function() {
        // Translated from Q.fapply(status, slice.call(arguments));
        Promise.resolve(status.apply(void 0, slice.call(arguments)));
    };

    return optimize(location, config);
};
