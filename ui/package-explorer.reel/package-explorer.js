var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.PackageExplorer = Montage.create(Component, {

    enterDocument: {
        value: function () {
            // there is no action event built into the montage anchor.reel
            this.templateObjects.previewLink.element.identifier = "previewLink";
            this.templateObjects.previewLink.element.addEventListener("click", this, false);
        }
    },

    projectController: {
        value: null
    },

    previewController: {
        value: null
    },

    fileTreeController: {
        value: null
    },

    packageDescription: {
        value: null
    },

    files: {
        value: null
    },

    handlePreviewLinkClick: {
        value: function (event) {
            // stop the browser from following the link
            event.preventDefault();
            this.projectController.environmentBridge.openHttpUrl(this.previewController.previewUrl).done();
        }
    },

    handleAddFileButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addFile", true, true);
        }
    },

    handleAddModuleButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addModule", true, true);
        }
    }

});
