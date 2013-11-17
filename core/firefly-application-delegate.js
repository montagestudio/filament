var ApplicationDelegate = require("./application-delegate").ApplicationDelegate,
    Promise = require("montage/core/promise").Promise;

exports.FireflyApplicationDelegate = ApplicationDelegate.specialize({

    constructor: {
        value: function ApplicationDelegate () {
            this.super();
        }
    },

    isBareRepository: {
        value: null
    },

    isPreparingProjectWorkspace: {
        value: null
    },

    willLoadProject: {
        value: function () {
            return this.getEnvironmentBridge()
            .then(function(environmentBridge) {
                return environmentBridge.initializeProject();
//                return environmentBridge.isProjectEmpty()
//                .then(function(isProjectEmpty) {
//                    if (isProjectEmpty) {
//                        // Ask user if he wants to initialize it
//                    } else {
//                        return environmentBridge.initializeProject();
//                    }
//                });
            });
        }
    }
});
