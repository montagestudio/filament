var ApplicationDelegate = require("./application-delegate").ApplicationDelegate;

exports.FireflyApplicationDelegate = ApplicationDelegate.specialize({

    constructor: {
        value: function ApplicationDelegate () {
            this.super();
        }
    },

    isBareRepository: {
        value: false
    },

    isPreparingProjectWorkspace: {
        value: false
    },

    handleInitializeRepository: {
        value: function () {
            //TODO only if the repository exists, and is bare: go an initialize it with the result of minit create
            debugger
        }
    }

});
