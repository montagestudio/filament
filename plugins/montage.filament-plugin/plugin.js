var Montage = require("montage/core/core").Montage,
    Plugin = require("filament-plugin/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise,
    libraryItems = require("library-items").libraryItems,
    libraryAdditions = require("library-items").libraryAdditions;

var Plugin = exports.Plugin = Montage.create(Plugin, {

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
Plugin.pluginRequire = require;