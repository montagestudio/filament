var FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    AssetsConfig = require("./assets-config").AssetsConfig,
    AssetTools = require("./asset-tools").AssetTools,
    Montage = require("montage/core/core").Montage,
    PACKAGE_LOCATION = require.location,
    Asset = require("./asset").Asset,

    FILE_SYSTEM_CHANGES = {
        CREATE: "create",
        DELETE: "delete",
        UPDATE: "update"
    };

exports.AssetsManager = Montage.specialize({

    constructor: {
        value: function AssetsManager() {
            this.super();
            this.assets = {};
            this.assetCategories = {};

            var self = this,
                assetCategories = AssetsConfig.assetCategories;

            Object.keys(assetCategories).forEach(function (assetCategoryName) {

                var currentAssetCategory = assetCategories[assetCategoryName];
                currentAssetCategory.defaultIconUrl = PACKAGE_LOCATION + currentAssetCategory.defaultIconUrl;
                self.assetCategories[assetCategoryName] = assetCategoryName;
                self.assets[assetCategoryName] = [];
            });

        }
    },

    /**
     * Contains all AssetCategories supported.
     * @public
     * @type {Array.<String>}
     */
    assetCategories: {
        value: null
    },

    /**
     * Contains all asset of the AssetManager, sorted by AssetCategory.
     * @public
     * @type {Object}
     */
    assets: {
        value: null
    },

    /**
     * Init the AssetManager with an Array of FileDescriptors.
     * @function
     * @public
     * @param {Array.<FileDescriptor>} filesList - an Array of FileDescriptors.
     * @return {Object}
     */
    init: {
        value: function (filesList) {
            if (filesList && Array.isArray(filesList)) {
                var self = this;

                filesList.forEach(function (fileDescriptor) {
                    if (AssetTools.isFileUrlValid(fileDescriptor.fileUrl) && AssetTools.isMimeTypeSupported(fileDescriptor.mimeType)) {
                        var createdAsset = self.createAssetWithFileDescriptor(fileDescriptor);
                        self.addAsset(createdAsset);
                    }
                });
            }

            return this;
        }
    },

    /**
     * Defines the number of assets within the AssetManager.
     * @public
     * @return {number}
     */
    assetsCount: {
        get:  function () {
            var assets = this.assets;

            if (assets) {
                return Object.keys(assets).reduce(function (count, assetCategory) {
                    return count + assets[assetCategory].length;
                }, 0);
            }
        }
    },

    /**
     * Adds an asset within the asset list of the AssetManager.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {Boolean}
     */
    addAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                this.assets[asset.category].push(asset);
                return true;
            }

            return false;
        }
    },

    /**
     * Creates an Asset Object with an url and a mime-type from an "asset" file.
     * @function
     * @public
     * @param {String} fileUrl - a file url.
     * @param {String} mimeType - a supported mime-type.
     * @return {Asset} created Asset Object.
     */
    createAssetWithFileUrlAndMimeType: {
        value: function (fileUrl, mimeType) {
            var createdAsset = Asset.create().initWithFileUrlAndMimeType(fileUrl, mimeType);
            createdAsset.iconUrl =  this.getIconWithAsset(createdAsset);
            return createdAsset;
        }
    },

    /**
     * Creates an Asset Object with some information within an FileDescriptor Object.
     * @function
     * @public
     * @param {Object} fileDescriptor - a FileDescriptor Object.
     * @param {String} fileDescriptor.fileUrl - a file url.
     * @param {String} fileDescriptor.mimeType - an supported mime-type.
     * @return {Asset} created Asset Object.
     */
    createAssetWithFileDescriptor: {
        value: function (fileDescriptor) {
            return this.createAssetWithFileUrlAndMimeType(fileDescriptor.fileUrl, fileDescriptor.mimeType);
        }
    },

    /**
     * Gets an iconUrl for an Asset Object.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {(String|null)} icon url.
     */
    getIconWithAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                //Todo implement a way to make a thumbnail for an asset.
                return this.getDefaultIconUrlByAssetCategory(asset.category);
            }

            return null;
        }
    },

    /**
     * Gets a default iconUrl for an Asset Category.
     * @function
     * @public
     * @param {String} assetCategory - an Asset Category.
     * @return {(String|null)} icon url.
     */
    getDefaultIconUrlByAssetCategory: {
        value: function (assetCategory) {
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                return AssetsConfig.assetCategories[assetCategory].defaultIconUrl;
            }

            return null;
        }
    },

    /**
     * Removes an Asset from the list of the AssetManager.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {Boolean}.
     */
    removeAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                var index = this._findAssetIndex(asset);

                if (index >= 0) {
                    this.assets[asset.category].splice(index, 1);
                }

                return true;
            }
            return false;
        }
    },

    /**
     * Removes an Asset from the list of the AssetManager,
     * with a file url.
     * @function
     * @public
     * @param {String} fileUrl - a file Url.
     * @return {Boolean}.
     */
    removeAssetWithFileUrl: {
        value: function (fileUrl) {
            if (AssetTools.isFileUrlValid(fileUrl)) {
                var assetFound = this._findAssetWithFileUrl(fileUrl);
                return this.removeAsset(assetFound);
            }

            return false;
        }
    },

    /**
     * Finds the "location" of an Asset with the list of Asset of the AssetManager.
     * @function
     * @private
     * @param {Object} asset - an Asset object.
     * @param {String} asset.category - an Asset Category.
     * @return {number}.
     */
    _findAssetIndex: {
        value: function (asset) {
            var assetsList = this.assets[asset.category],
                fileUrl = asset.fileUrl;

            for (var i = 0, length = assetsList.length; i < length; i++) {
                var currentAsset = assetsList[i];

                if (fileUrl === currentAsset.fileUrl) {
                    return i;
                }
            }

            return - 1;
        }
    },

    /**
     * Finds an Asset with the list of Asset of the AssetManager.
     * @function
     * @private
     * @param {String} fileUrl - a file Url.
     * @param {String} [category] - an Asset Category.
     * @return {(Object|null)} an Asset Object that has been found.
     */
    _findAssetWithFileUrl: {
        value: function (fileUrl, assetCategory) {
            var assetFound = null;

            // If assetCategory is not undefined looks into the Asset category, in order to find an asset
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                var assetSet = this.assets[assetCategory];

                assetSet.some(function (asset) {
                    assetFound = asset.fileUrl === fileUrl ? asset : null;
                    return !!assetFound;
                });

                return assetFound;
            }

            // If assetCategory is undefined looks into each Asset categories.
            var assetCategories = this.assetCategories,
                self = this;

            Object.keys(assetCategories).some(function (assetCategory) {
                assetFound = self._findAssetWithFileUrl(fileUrl, assetCategory);
                return !!assetFound;
            });

            return assetFound;
        }
    },

    /**
     * Gets an Assets list in term of an Asset Category.
     * @function
     * @public
     * @param {String} category - an Asset Category.
     * @return {Array.<Asset>} an Array of Assets Object.
     */
    getAssetsByAssetCategory: {
        value: function (assetCategory) {
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                return this.assets[assetCategory];
            }

            return [];
        }
    },

    /**
     * Gets an Assets list in term of a mime-type.
     * @function
     * @public
     * @param {String} mimeType - a supported mime-type.
     * @return {Array.<Asset>} an Array of Assets Object.
     */
    getAssetsByMimeType: {
        value: function (mimeType) {
            if (!AssetTools.isMimeTypeSupported(mimeType)) {
                throw new Error("Cannot get assets because the mime-type:" + mimeType + " is not supported");
            }

            var assetCategory = AssetTools.findAssetCategoryFromMimeType(mimeType),
                assetSet = this.assets[assetCategory];

            return assetSet.filter(function (asset) {
                return asset.mimeType === mimeType;
            });
        }
    },

    /**
     * handles any changes of an asset from the file system.
     * [! Not completely implemented yet !]
     * @function
     * @public
     * @param {Object} event - Event Object.
     * @param {Object} event.detail - Contains some information about the file changes;
     * @param {String} fileUrl - a file Url.
     */
    handleFileSystemChange: {
        value: function (event) {
            var fileChangeDetail = event.detail;

            if (fileChangeDetail && typeof fileChangeDetail === "object" && fileChangeDetail.hasOwnProperty('fileUrl')) {
                var fileUrl = fileChangeDetail.fileUrl,
                    mimeType = fileChangeDetail.mimeType,
                    fileDescriptor = FileDescriptor.create().init(fileUrl, fileChangeDetail.currentStat, mimeType);

                switch (fileChangeDetail.change) {

                case FILE_SYSTEM_CHANGES.CREATE:
                    var createdAsset = this.createAssetWithFileDescriptor(fileDescriptor);
                    this.addAsset(createdAsset);
                    break;

                case FILE_SYSTEM_CHANGES.DELETE:
                    this.removeAssetWithFileUrl(fileUrl);
                    break;
                }
            }
        }
    }

});
