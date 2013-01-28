var Montage = require("montage/core/core").Montage,
    Plugin = require("filament/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise,
    libraryItems = require("library-items").libraryItems,
    libraryAdditions = require("library-items").libraryAdditions;

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

            libraryAdditions.forEach(function (libraryItem) {
                projectController.registerLibraryItemForPackageName(libraryItem, "montage");
            });

            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController) {

            Object.keys(libraryItems).forEach(function (moduleId) {
                projectController.unregisterLibraryItemForModuleId(moduleId);
            });


            libraryAdditions.forEach(function (libraryItem) {
                projectController.unregisterLibraryItemForPackageName(libraryItem, "montage");
            });

            return Promise.resolve(this);
        }
    }

});