var CoreExtension = require("filament-extension/core/extension").Extension;

exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    name: {
        get:function () {
            //TODO read the name from the package or something
            return "Build Download";
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
                    projectDocument.build.then(function (build) {
                        build.addChain("download",
                            "Download",
                            null,
                            [
                                {
                                    thisp: self,
                                    performBuildStep: self.archive
                                },
                                {
                                    thisp: self,
                                    performBuildStep: self.downloadArchive
                                }
                            ]);
                    }).done();
                }
            });
        }
    },

    deactivate: {
        value: function (application, projectController) {
            projectController.projectDocument.build.then(function(build) {
                build.removeChain("download");
            }).done();
            this.application = null;
            this.projectController = null;
        }
    },

    archive: {
        value: function(options) {
            // TODO: what is the right way to get the environment bridge?
            var bridge = this.application.delegate.environmentBridge;

            options.updateStatusMessage("Archiving...");
            return bridge.buildArchive();
        }
    },

    downloadArchive: {
        value: function() {
            // TODO: what is the right way to get the environment bridge?
            var bridge = this.application.delegate.environmentBridge;
            var repositoryController = bridge.repositoryController;
            var url = "/build/" + repositoryController.owner + "/" + repositoryController.repo + "/archive";

            return bridge.downloadFile(url);
        }
    }
});
