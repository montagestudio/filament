/* global lumieres */
var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;
var repositoriesController = require("../../core/repositories-controller").repositoriesController;
var userController = require("adaptor/client/core/user-controller").userController;

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
            userController.then(function(userController) {
                self.userController = userController;
            });
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            if (window.location.hash === "#new") {
                this.showNewAppForm = true;
            }
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
            var name = this.templateObjects.newAppName.value,
                description = this.templateObjects.newAppDescription.value,
                self = this;

            this.templateObjects.repositoriesController.createRepository(name, {
                description: description
            }).then(function() {
                self.showNewAppForm = false;
            }).done();
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
