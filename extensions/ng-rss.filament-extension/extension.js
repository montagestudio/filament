var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    libraryItems = require("library-items").libraryItems,
    libraryAdditions = require("library-items").libraryAdditions;

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    activate: {
        value: function (application, projectController) {

            Object.keys(libraryItems).forEach(function (moduleId) {
                projectController.registerLibraryItemForModuleId(libraryItems[moduleId], moduleId);
            });

            libraryAdditions.forEach(function (libraryItem) {
                projectController.registerLibraryItemForPackageName(libraryItem, "ng-rss");
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
                projectController.unregisterLibraryItemForPackageName(libraryItem, "ng-rss");
            });

            return Promise.resolve(this);
        }
    }

});