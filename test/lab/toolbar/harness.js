var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    mainMenu = require("adaptor/client/core/menu").defaultMenu;

var userController = {
    getUser: function () {
        return Promise.resolve({
            name: "Alice",
            // This is actually the identicon for the username "alice": https://identicons.github.com/alice.png
            avatarUrl: "data:image/png;base64,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"
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

var ProjectDocument = Montage.specialize({

    constructor: {
        value: function ProjectDocument() {
            this.super();
        }
    },

    init: {
        value: function (packageRequire, bridge) {
            return this;
        }
    },

    currentBranch: {
        get: function () {
            return {name: "master"};
        }
    }

});

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
    },

    _projectDocument: {
        value: null
    },

    projectDocument: {
        get: function () {
            if (!this._projectDocument) {
                this._projectDocument = new ProjectDocument().init(require, this.environmentBridge);
            }

            return this._projectDocument;
        }
    }

});
