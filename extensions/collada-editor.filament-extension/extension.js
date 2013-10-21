var CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    ColladaDocument = require("core/collada-document").ColladaDocument;

exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    editorFileMatchFunction: {
        enumerable: false,
        value : function (fileUrl) {
            return (/\.dae\/?$/).test(fileUrl);
        }
    },

    /**
     * Asynchronously load the asset compiler from the specified
     * extensionUrl, returning a reference to the exported Asset Compiler.
     *
     * When called as a method on an instance of a ProjectController
     * the loadedAssetCompiler will be added to the instance's
     * loadedAssetCompilers collection automatically.
     *
     * @param {string} assetCompilerURL The extension package Url to load
     * @return {Promise} A promise for the exported Asset Compiler object
     */
    loadAssetCompiler: {
        enumerable: false,
        value: function (assetCompilerURL) {

            var self = this;

            // TODO npm install?
            return require.loadPackage(assetCompilerURL).then(function (packageRequire) {
                return packageRequire.async("asset-compiler");
            }).then(function (exports) {
                    var assetCompiler = exports.AssetCompiler;

                    if (!assetCompiler) {
                        throw new Error("Malformed asset compiler. Expected '" + assetCompilerURL + "' to export 'Asset Compiler'");
                    }

                    if (self.loadedAssetCompilers) {
                        self.loadedAssetCompilers.push(assetCompiler);
                    }
                    return assetCompiler;
                });
        }
    },


    assetCompiler:  {
        value: null
    },

    application:{
        value:null
    },

    projectController:{
        value:null
    },

    activate: {
        value: function (application, projectController, viewController) {
            var self = this;
            this.loadAssetCompiler("http://client/asset-compilers/collada.asset-compiler").then (
                function(assetCompiler) {
                    self.assetCompiler = assetCompiler;
                });

            this.application = application;
            this.projectController = projectController;

            application.addEventListener("didOpenDocument", this, false);
            application.addEventListener("willCloseDocument", this, false);

            projectController.registerUrlMatcherForDocumentType(this.editorFileMatchFunction, ColladaDocument);

            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {
            projectController.unregisterUrlMatcherForDocumentType(this.editorFileMatchFunction, ColladaDocument);
            return Promise.resolve(this);
        }
    },

    handleDidOpenDocument:{
        value:function (evt) {
            var self = this;
            var location = evt.detail.document.fileUrl;
            //consider using event.detail.isCurrentDocument
            if (evt.detail.alreadyOpened === false) {
                if (this.editorFileMatchFunction(location)) {
                    //console.log("convert file a location file location:"+location);
                    this.assetCompiler.convert(location).then(function(outputURL) {
                        self.projectController.currentDocument.compiledFileURL = outputURL;
                    }, function(e) {}).done();
                }
            }
        }
    },

    handleWillCloseDocument:{
        value:function (evt) {
            var location = evt.detail.url;
            var self = this;
            //consider using event.detail.isCurrentDocument
            if (this.editorFileMatchFunction(location)) {
                self.projectController.currentDocument.compiledFileURL = null;
            }
        }
    }

});
