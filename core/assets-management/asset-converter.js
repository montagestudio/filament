var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    AssetsConfig = require("./assets-config").AssetsConfig,
    AssetTools = require("./asset-tools").AssetTools;

/**
 * @class AssetConverter
 * @extends module:montage.Montage
 */
exports.AssetConverter = Montage.specialize({

    constructor: {
        value: function Asset(projectController) {
            this.super();
            this._projectController = projectController;
        }
    },

    _projectController: {
        value: null
    },

    /**
     * Creates an Asset Object from another Asset Object and save it.
     * @function
     * @public
     * @param {Object} modelAsset - a 3D Asset to convert.
     * @param {String} location - the path where the new asset will be saved.
     * @return {Promise} for the created Asset Object.
     */
    convertModelToGlTFBundle: {
        value: function (modelAsset, location) {
            if (AssetTools.isAssetValid(modelAsset) && modelAsset.isTemplate) {
                var promise = null,
                    document = this._projectController.currentDocument;

                // Checks if the modelAsset is a 3D model that can be convert,
                // then it will create a new "glTF bundle asset" at the given location
                if (AssetsConfig.assetCategories.MODEL.templates.indexOf(modelAsset.mimeType) >= 0) {
                    promise = this._createGlTFBundle(modelAsset, location);
                }

                if (promise && document) {
                    document.dispatchEventNamed("asyncActivity", true, false, {
                        promise: promise,
                        status: modelAsset.fileName,
                        title: "Converting asset"
                    });

                    return promise;
                }
            }

            return Promise.reject("Can not create an asset with the given model");
        }
    },

    /**
     * Creates a glTF bundle Asset from a 3D asset and save it.
     * @function
     * @public
     * @param {Object} modelAsset - a 3D Asset to convert.
     * @param {String} location - the path where the new asset will be saved.
     * @return {Promise} for the created Asset Object.
     */
    _createGlTFBundle: {
        value: function (modelAsset, location) {
            return this._projectController.environmentBridge.convertColladaToGlTFBundle(modelAsset.fileUrl, location);
        }
    }

});
