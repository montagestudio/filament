var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise;

exports.Test = Montage.specialize({

    handleCountdownAction: {
        value: function() {
            var deferred = Promise.defer(), count = 5;
            var countDown = function() {
                count--;
                if (count === 0) {
                    deferred.resolve("counted");
                } else {
                    deferred.notify(count);
                    setTimeout(countDown, 1000);
                }
            };
            this.infobar.addActivity(deferred.promise, "Count down", "counting...");
            countDown();
        }
    },

    handleCountdownFailAction: {
        value: function() {
            var deferred = Promise.defer(), count = 5;
            var countDown = function() {
                count--;
                if (count === 0) {
                    deferred.reject("fail counted");
                } else {
                    deferred.notify(count);
                    setTimeout(countDown, 1000);
                }
            };
            this.infobar.addActivity(deferred.promise, "Count down", "counting...");
            countDown();
        }
    },

    handleCompleteAction: {
        value: function() {
            this.infobar.addActivity(Promise.resolve("completed"), "Complete", "complete note");
        }
    },

    handleFailAction: {
        value: function() {
            this.infobar.addActivity(Promise.reject("failed"), "Fail", "fail note");
        }
    }

});
