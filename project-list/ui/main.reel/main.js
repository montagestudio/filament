/* global lumieres */
var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;
var repositoriesController = require("../../core/repositories-controller").repositoriesController;


exports.Main = Montage.create(Component, {

    version: {
        value: "X"
    },

    recentDocuments: {
        value: null
    },

    isFirstRun: {
        value: true
    },

    constructor: {
        value: function Main() {
            this.super();

            var self = this;
            require.async("adaptor/client/core/browser-bridge").then(function (exported) {
                self.environmentBridge = exported.BrowserBridge.create();

            });
            this.templateObjects = {
                repositoriesController: repositoriesController
            };
        }
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

    /**
     * An empty repository doesn't have branches.
     */
    _isEmptyRepository: {
        value: function(repo) {
            return this._githubApi.listBranches(repo.owner.login, repo.name)
            .then(function(branches) {
                return branches.length === 0;
            });
        }
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
            this.templateObjects.newAppFormCondition.condition = true;
        }
    },

    handleCancelNewAppButtonAction: {
        value: function () {
            this.templateObjects.newAppFormCondition.condition = false;
        }
    },

    handleCreateNewAppButtonAction: {
        value: function () {
            var name = this.templateObjects.newAppName.value,
                description = this.templateObjects.newAppDescription.value,
                self = this;

            this._githubApi.createRepository(name, {
                description: description
            }).then(function(repo) {
                repo.pushed_at = +new Date(repo.pushed_at);
                self.recentDocuments.push(repo);
                self.templateObjects.newAppFormCondition.condition = false;
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
