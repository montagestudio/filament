var Bindings = require("montage/core/core").Bindings,
    Component = require("montage/ui/component").Component,
    repositoriesController = require("core/repositories-controller").repositoriesController,
    UserController = require("adaptor/client/core/user-controller").UserController;

exports.ProjectList = Component.specialize({

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

    repositoriesController: {
        value: null
    },

    historyProgress: {
        value: null
    },

    historyRefresh: {
        value: null
    },

    newAppDescription: {
        value: null
    },

    newAppName: {
        value: null
    },

    newAppError: {
        value: null
    },

    ownedRepositoriesNames: {
        value: null
    },

    createNewAppButton: {
        value: null
    },

    constructor: {
        value: function ProjectList() {
            this.super();

            this.repositoriesController = repositoriesController;
            Bindings.defineBinding(this, 'ownedRepositoriesNames', {'<-': 'this.repositoriesController.ownedRepositories.map{name}'});
            this.userController = new UserController().init();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var self = this;
            if (firstTime) {
                if (window.location.hash === "#new") {
                    this.showNewAppForm = true;
                }

                this._upkeepProgressBar();
                this._getWorkspaces();
                this.repositoriesController.loadOrganizations();

                // TODO: This could be a binding, but matte buttons (and by extension Native buttons) don't redraw
                // after the disabled/enabled property is changed.
                this.newAppName.addPathChangeListener("value", function(value) {
                    self.createNewAppButton.enabled = value != 0;
                    self.createNewAppButton.needsDraw = true;
                });
            }
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
                repositoriesController = this.repositoriesController,
                repositoriesCount = repositoriesController.repositoriesCount,
                processedRepositories = 0,
                self = this;

            setTimeout(function upkeep() {
                var newProcessedRepositories = repositoriesController.processedRepositories;

                if (repositoriesCount > 0 && repositoriesCount === newProcessedRepositories ||
                    // make sure we don't go to 100%
                    self.historyProgress.value >= (self.historyProgress.max - 1)) {
                    return;
                } else if (processedRepositories === newProcessedRepositories) {
                    self.historyProgress.value++;
                }

                processedRepositories = newProcessedRepositories;

                window.setTimeout(upkeep, UPKEEP_INTERVAL += UPKEEP_INCREASE);
            }, UPKEEP_INTERVAL);
        }
    },

    _getWorkspaces: {
        value: function () {
            var self = this;
            this.application.delegate.request({
                url: "/workspaces",
                subdomain: "api"
            })
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

    templateDidLoad: {
        value: function() {
            this.repositoriesController.organizationsController.addRangeAtPathChangeListener("selection", this, "handleSelectionChange");
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

    handleHistoryRefreshAction: {
        value: function () {
            var self = this;

            this.historyRefresh.disabled = true;
            this.repositoriesController.updateRepositories().finally(function () {
                self.historyRefresh.disabled = false;
            }).done();
        }
    },

    handleAuthorizePrivateAccessButtonAction: {
        value: function () {
            this.repositoriesController.clearCachedRepositories()
                .finally(function () {
                    window.location = "/auth/github/private";
                })
                .done();
        }
    },

    handleLogoutButtonAction: {
        value: function () {
            var self = this;
            this.repositoriesController.clearCachedRepositories()
                .finally(function () {
                    self.application.delegate.accessToken = undefined;
                    self.application.delegate.handleLocationChange();
                })
                .done();
        }
    },

    _createNewApplication: {
        value: function () {
            var name = this.newAppName.value,
                description = this.newAppDescription.value,
                self = this;

            return this.repositoriesController.createRepository(name, {
                    description: description
                })
                .then(function (repo) {
                    // Begin initialization, but don't hold up leaving this page
                    // Distribute the load across multiple screens
                    self.repositoriesController.initializeRepository(repo.owner.login, name).done();

                    self.showNewAppForm = false;
                    return repo;
                })
                .delay(600)
                .then(function(repo) {
                    self.repositoriesController.open(repo);
                }, function (error) {
                    // Use the shortMessage when available as it's more user friendly
                    self.newAppError.value = error.shortMessage || error.message;
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
            var repositoriesController = this.repositoriesController;
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
    },

    handleSelectionChange: {
        value: function(plus) {
            if (plus && plus.length > 0) {
                this.repositoriesController.selectOrganization(plus[0]);
            }
        }
    }

});
