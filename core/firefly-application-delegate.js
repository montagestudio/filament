var ApplicationDelegate = require("./application-delegate").ApplicationDelegate,
    RepositoryController = require("core/repository-controller").RepositoryController,
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

    _deferredRepositoryIntialization: {
        value: null
    },

    willLoadProject: {
        value: function () {
            var populatedRepositoryPromise;

            if (this.isBareRepository) {
                this._deferredRepositoryIntialization = Promise.defer();
                populatedRepositoryPromise = this._deferredRepositoryIntialization.promise;
            } else {
                populatedRepositoryPromise = Promise.resolve();
            }

            return populatedRepositoryPromise;
        }
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
