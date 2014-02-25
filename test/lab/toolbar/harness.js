var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    mainMenu = require("adaptor/client/core/menu").defaultMenu;

var userController = {
    getUser: function () {
        return Promise.resolve({
            name: "Alice",
            avatarUrl: ""
        });
    }
};

var repositoryController = {
    getRepositoryUrl: function () {
        return Promise.resolve("http://example.com/user/repository");
    }
};

var environmentBridge = {
    userController: userController,
    repositoryController: repositoryController,
    mainMenu: Promise.resolve(mainMenu)
};

exports.Harness = Montage.specialize({

    constructor: {
        value: function Harness() {
            this.super();
        }
    },

    environmentBridge: {
        get: function () {
            return environmentBridge;
        }
    }

});
