var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.FileCell = Montage.create(Component, {

    projectController: {
        value: null
    },

    fileInfo: {
        value: null
    },

    iteration: {
        value: null
    },

    didCreate: {
        value: function () {
            this.addPathChangeListener("iteration", this);
            this.addPathChangeListener("fileInfo", this);
            this.addPathChangeListener("iteration.expanded", this, "handleExpandedChange");
        }
    },

    handlePathChange: {
        value: function () {
            if (this.fileInfo && this.iteration && this.fileInfo.root) {
                this.iteration.expanded = true;
            }
        }
    },

    handleExpandedChange: {
        value: function(newValue) {
            if (newValue && !this.fileInfo.children) {
                var self = this;
                this.projectController.filesAtUrl(this.fileInfo.fileUrl).then(function (fileDescriptors) {
                    self.fileInfo.children = fileDescriptors;
                });
            }
        }
    },

    handleOpenFileButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("openFile", true, true, {
                fileUrl: this.fileInfo.fileUrl
            });
        }
    }

});
