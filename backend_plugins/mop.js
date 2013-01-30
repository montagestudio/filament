var Q = require("Q");
var build = require("mop/lib/build");

exports.build = build;

// exports.build = function(location, config) {
//     var a = Q.defer();

//     // TODO move this to promise progress notifications when
//     // available over Q-Connection
//     var progress = config.progress;
//     delete config.progress;
//     Q.fcall(progress, "fcall");

//     setTimeout(function() {
//         a.resolve("done");
//     }, 1000);

//     return a.promise;
// };
