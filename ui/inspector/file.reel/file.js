/*global lumieres */

/**
    @module "ui/file.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise;

/**
    Description TODO
    @class module:"ui/file.reel".File
    @extends module:montage/ui/component.Component
*/
exports.File = Montage.create(Component, /** @lends module:"ui/file.reel".File# */ {

    value: {
        value: null
    },

    // FIXME: Move into its own Filament module
    _options: {
        value: {
            // whether to display as a roll down sheet
            displayAsSheet: false,
            // whether you can select files (otherwise just directories)
            canChooseFiles: true,
            // whether you can select directories (otherwise just files)
            canChooseDirectories: false,
            // can multiple files be selected
            allowMultipleSelection: false,
            // path of the directory to open on
            defaultDirectory: null,
            // array of file extensions/Uniform Type Identifiers
            fileTypes: null
        }
    },

    /**
     * Opens the open dialog for the user
     * @return {Promise<Array<string>>} A promise that is resolved with an
     * array of filenames.
     */
    open: {
        value: function() {
            var deferred = Promise.defer();

            // FIXME: Move into its own Filament module
            lumieres.openFileDialog(this._options, function(success, files) {
                console.log(success, files);
                if (!success) {
                    deferred.reject();
                    return;
                }

                if (!Array.isArray(files)) {
                    files = [files];
                }

                // We get "file://localhost" back from lumieres, change
                // to "fs://localhost/"
                // TODO: copy file into project
                for (var i = 0, len = files.length; i < len; i++) {
                    files[i] = files[i].replace(/^file:\/\/localhost/, "fs://localhost");
                }

                deferred.resolve(files);
            });

            return deferred.promise;
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this.templateObjects.choose.addEventListener("action", this, false);
        }
    },

    handleAction: {
        value: function(event) {
            var self = this;
            this.open().then(function(files) {
                self.value = files[0];
            });
        }
    }
});

