/* global __dirname, process */
var jasmine = require('jasmine-node');
var Q = require("q");

// allow promises to be returned from it blocks
jasmine.Block.prototype.execute = function (onComplete) {
    var spec = this.spec;
    try {
        var result = this.func.call(spec, onComplete);

        // It seems Jasmine likes to return the suite if you pass it anything.
        // So make sure it's a promise first.
        if (result && typeof result.then === "function") {
            Q.timeout(result, 5000).then(function () {
                onComplete();
            }, function (error) {
                spec.fail(error);
                onComplete();
            });
        } else if (this.func.length === 0) {
            onComplete();
        }
    } catch (error) {
        spec.fail(error);
        onComplete();
    }
};

jasmine.executeSpecsInFolder({
    specFolder: __dirname,
    regExpSpec: /backend-spec\.js$/i,
    showColors: true,
    // isVerbose: true,
    onComplete: function(runner, log){
        if (0 === runner.results().failedCount) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    }
});
