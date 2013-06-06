var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("ui/package-editor.reel").PackageEditor,
    Promise = require("montage/core/promise").Promise,
    Map = require("montage/collections/map");

exports.PackageDocument = Montage.create(EditingDocument, {

    // The documents can rely on the projectcontroller to provide information about dependencies within the project
    sharedProjectController: {
        value: null
    },

    _packageDescription: {
        value: null
    },

    init: {
        value: function (fileUrl, packageRequire) {
            var self = EditingDocument.init.call(this, fileUrl, packageRequire);
            this._packageDescription = packageRequire.packageDescription;

            this._dependencies = new Map(this._packageDescription.dependencies);
            //TODO combine information about expected dependencies and what is actually provided

            return self;
        }
    },

    packageName: {
        get: function () {
            return this._packageDescription.name;
        }
    },

    packageVersion: {
        get: function () {
            return this._packageDescription.version;
        }
    },

    dependencies: {
        get: function () {
            return this._dependencies;
        }
    }

}, {

    load: {
        value: function (fileUrl, packageUrl) {
            var self = this;

            return require.loadPackage(packageUrl).then(function (packageRequire) {
                return self.create().init(fileUrl, packageRequire);
            });
        }
    },

    editorType: {
        get: function () {
            return PackageEditor;
        }
    }

});
