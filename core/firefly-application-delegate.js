var ApplicationDelegate = require("./application-delegate").ApplicationDelegate;
var RepositoryController = require("core/repository-controller").RepositoryController;

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
            //TODO there should be some functions to give the owner/repo
            var paths = window.location.pathname.split("/"),
                owner = paths[1],
                repo = paths[2];

            var repositoryController = new RepositoryController().init(owner, repo);
            repositoryController.initializeRepositoryWorkspace().done();
        }
    }

});
