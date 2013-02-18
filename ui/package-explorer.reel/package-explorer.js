var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.PackageExplorer = Montage.create(Component, {

    packageDescription: {
        value: null
    },

    files: {
        value: null
    },

    handleAddFileButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addFile", true, true);
        }
    }

});
