var CoreExtension = require("filament-extension/core/extension").Extension;

var GITHUB_PAGES_DOMAIN = "github.io";

exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    name: {
        get:function () {
            //TODO read the name from the package or something
            return "Build Github Pages";
        }
    },

    application: {
        value:null
    },

    projectController: {
        value:null
    },

    activate: {
        value: function (application, projectController) {
            var self = this;
            this.application = application;
            this.projectController = projectController;

            projectController.addPathChangeListener("projectDocument", function(projectDocument) {
                if (projectDocument) {
                    projectDocument.build.then(function(build) {
                        build.addChain("gh-pages",
                            "Publish to Github Pages",
                            null,
                            [{
                                thisp: self,
                                performBuildStep: self.publishToGithubPages
                            }]);
                    }).done();
                }
            });
        }
    },

    deactivate: {
        value: function (application, projectController) {
            projectController.projectDocument.build.then(function(build) {
                build.removeChain("gh-pages");
            }).done();
            this.application = null;
            this.projectController = null;
        }
    },

    publishToGithubPages: {
        value: function(options) {
            // TODO: what is the right way to get the environment bridge?
            var bridge = this.application.delegate.environmentBridge;

            options.updateStatusMessage("Publishing...");
            return bridge.buildPublishToGithubPages()
            .then(function(githubPagesUrl) {
                return '<a href="' + githubPagesUrl + '" style="color: white" target="_blank">' + githubPagesUrl + '</a>';
            });
        }
    },

    openGithubPages: {
        value: function() {
            var bridge = this.application.delegate.environmentBridge;
            var repositoryController = bridge.repositoryController;

            var url = "http://" + repositoryController.owner + "." + GITHUB_PAGES_DOMAIN + "/" + repositoryController.repo;

            return bridge.openHttpUrl(url);
        }
    }
});
