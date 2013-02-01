var Montage = require("montage/core/core").Montage,
    Extension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    libraryItems = require("library-items").libraryItems,
    libraryAdditions = require("library-items").libraryAdditions;

var Extension = exports.Extension = Montage.create(Extension, {

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
Extension.extensionRequire = require;
