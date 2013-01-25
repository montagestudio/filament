var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.FileCell = Montage.create(Component, {

    fileInfo: {
        value: null
    },

    handleOpenFileButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("openFile", true, true, {
                fileUrl: this.fileInfo.fileUrl
            });
        }
    }

});
