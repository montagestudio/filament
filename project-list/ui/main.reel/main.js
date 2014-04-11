var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;
var repositoriesController = require("../../core/repositories-controller").repositoriesController;
var UserController = require("adaptor/client/core/user-controller").UserController;
var requestOk = require("core/request").requestOk;

exports.Main = Montage.create(Component, {

    version: {
        value: "X"
    },

    projects: {
        value: {}
    },

    isFirstRun: {
        value: true
    },

    workspaces: {
        value: []
    },

    constructor: {
        value: function Main() {
            this.super();

            this.templateObjects = {
                repositoriesController: repositoriesController
            };

            this.userController = new UserController().init();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            if (window.location.hash === "#new") {
                this.showNewAppForm = true;
            } else {
                if (localStorage && JSON.parse(localStorage.getItem("needsTutorial"))) {
                    repositoriesController.forkRepository("montagejs", "popcorn")
                        .then(function (forkedRepo) {
                            localStorage.setItem("needsTutorial", JSON.stringify(false));

                            return requestOk({
                                method: "POST",
                                url: "/api/" + forkedRepo.owner.login + "/" + forkedRepo.name + "/init_popcorn"
                            })
                            .then(function() {
                                return repositoriesController.open(forkedRepo);
                            });
                        })
                        .done();
                }
            }

            this._upkeepProgressBar();
            this._getWorkspaces();
        }
    },

    /**
     * This function makes sure that the progress bar gets updated every so
     * often, even if the projects haven't started being processed.
     */
    _upkeepProgressBar: {
        value: function() {
            var UPKEEP_INTERVAL = 500,
                UPKEEP_INCREASE = 100,
                historyProgress = this.templateObjects.historyProgress,
                repositoriesController = this.templateObjects.repositoriesController,
                totalDocuments = repositoriesController.totalDocuments,
                processedDocuments = 0;

            setTimeout(function upkeep() {
                var newProcessedDocuments = repositoriesController.processedDocuments;

                if (totalDocuments > 0 && totalDocuments === newProcessedDocuments ||
                    // make sure we don't go to 100%
                    historyProgress.value >= (historyProgress.max - 1)) {
                    return;
                } else if (processedDocuments === newProcessedDocuments) {
                    historyProgress.value++;
                }

                processedDocuments = newProcessedDocuments;

                window.setTimeout(upkeep, UPKEEP_INTERVAL += UPKEEP_INCREASE);
            }, UPKEEP_INTERVAL);
        }
    },

    _getWorkspaces: {
        value: function () {
            var self = this;
            requestOk("/api/workspaces")
            .then(function (response) {
                self.workspaces = JSON.parse(response.body);
            })
            .done();
        }
    },

    showNewAppForm: {
        value: false
    },

    userController: {
        value: null
    },

    templateObjects: {
        value: null
    },

    templateDidLoad: {
        value: function() {
        }
    },

    radioButtonController: {
        value: null
    },

    //TODO not show ui until we have an environment bridge
    //This would be a good case of the whole "custom loading scenario" idea
    environmentBridge: {
        value: null
    },

    handleOpenDocument: {
        value: function (evt) {
            this.environmentBridge.open(evt.detail.url).then(function () {
                window.close();
            }).done();
        }
    },

    handleOpenAppButtonAction: {
        value: function () {
            var self = this;
            this.environmentBridge.promptForOpen({canChooseDirectories: true}).then(function (url) {
                if (url) {
                    return self.environmentBridge.open(url).then(function () {
                        window.close();
                    });
                }
            }).done();
        }
    },

    handleNewAppButtonAction: {
        value: function () {
            this.showNewAppForm = true;
        }
    },

    handleCancelNewAppButtonAction: {
        value: function () {
            this.showNewAppForm = false;
        }
    },

    handleCreateNewAppButtonAction: {
        value: function () {
            this._createNewApplication().done();
        }
    },

    handleNewAppNameAction: {
        value: function () {
            this._createNewApplication().done();
        }
    },

    handleRemoveWorkspacesAction: {
        value: function () {
            var self = this;
            requestOk({
                method: "DELETE",
                url: "/api/workspaces"
            }).then(function (response) {
                self._getWorkspaces();
            })
            .done();
        }
    },

    _createNewApplication: {
        value: function () {
            var templateObjects = this.templateObjects,
                name = templateObjects.newAppName.value,
                description = templateObjects.newAppDescription.value,
                repositoriesController = templateObjects.repositoriesController,
                self = this;

            return repositoriesController.createRepository(name, {
                    description: description
                })
                .then(function (repo) {
                    // Begin initialization, but don't hold up leaving this page
                    // Distribute the load across multiple screens
                    repositoriesController.initializeRepository(repo.owner.login, name).done();

                    self.showNewAppForm = false;
                    return repo;
                })
                .delay(600)
                .then(function(repo) {
                    repositoriesController.open(repo);
                }, function (error) {
                    self.templateObjects.newAppError.value = error.message;
                    throw error;
                });
        }
    },

    handleAction: {
        value: function (evt) {
            var detail = evt.detail,
                owner = detail ? detail.get("owner") : null,
                repository = detail ? detail.get("repository") : null;

            if (owner && repository) {
                this._forkRepository(owner, repository).done();
            }
        }
    },

    _forkRepository: {
        value: function (owner, repoName) {
            var repositoriesController = this.templateObjects.repositoriesController;
            return repositoriesController.forkRepository(owner, repoName).then(function (forkedRepo) {
                return repositoriesController.open(forkedRepo);
            }, function (err) {
                console.error("failed to fork repository");
                throw err;
            });
        }
    },

    draw: {
        value: function () {
            if (this.isFirstRun) {
                this.element.classList.add("isFirstRun");
            } else {
                this.element.classList.remove("isFirstRun");
            }
        }
    }

});
