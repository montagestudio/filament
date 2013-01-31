var Q = require("Q");
var optimize = require("mop");

exports.optimize = function(location, config) {
    var slice = Array.prototype.slice;

    var status = config.out.status;

    config.out.status = function() {
        Q.fapply(status, slice.call(arguments));
    };

    return optimize(location, config);
};
