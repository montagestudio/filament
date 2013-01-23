var Montage = require("montage/core/core").Montage,
    Plugin = require("filament/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise,
    libraryItems = require("library-items").libraryItems;

exports.Plugin = Montage.create(Plugin, {

    name: {
        get: function () {
            //TODO read the name from the package or something
            return "Montage";
        }
    },

    activate: {
        value: function (application, projectController) {

            Object.keys(libraryItems).forEach(function (moduleId) {
                projectController.registerLibraryItemForModuleId(libraryItems[moduleId], moduleId);
            });

            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController) {

            Object.keys(libraryItems).forEach(function (moduleId) {
                projectController.unregisterLibraryItemForModuleId(moduleId);
            });

            return Promise.resolve(this);
        }
    }

});