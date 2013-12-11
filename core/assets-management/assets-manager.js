var FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    AssetsConfig = require("./assets-config").AssetsConfig,
    AssetTools = require("./asset-tools").AssetTools,
    Montage = require("montage/core/core").Montage,
    PACKAGE_LOCATION = require.location,
    Asset = require("./asset").Asset,

    TIMEOUT_RELEASE_DELETED_ASSET_POOL = 5000,

    FILE_SYSTEM_CHANGES = {
        CREATE: "create",
        DELETE: "delete",
        UPDATE: "update"
    };

/**
 * @class AssetsManager
 * @extends module:montage.Montage
 */
exports.AssetsManager = Montage.specialize({

    constructor: {
        value: function AssetsManager() {
            this.super();
            this.assets = {};
            this.assetCategories = {};
            this._deletedAssetPool = [];

            this.addRangeAtPathChangeListener("_deletedAssetPool", this, "handleDeletedAssetPoolChange");

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

    _deletedAssetPool: {
        value: null
    },

    _programmedReleasePool: {
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
     * Creates an Asset Object with some information within an FileDescriptor Object.
     * @function
     * @public
     * @param {Object} fileDescriptor - a FileDescriptor Object.
     * @return {Asset} created Asset Object.
     */
    createAssetWithFileDescriptor: {
        value: function (fileDescriptor) {
            var createdAsset = Asset.create().initWithFileDescriptor(fileDescriptor);
            createdAsset.iconUrl =  this.getIconWithAsset(createdAsset);
            return createdAsset;
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
                    return true;
                }
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

            if (AssetTools.isFileUrlValid(fileUrl)) {

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
            }

            return assetFound;
        }
    },

    /**
     * Finds and Gets an Asset with a file url.
     * @function
     * @public
     * @param {String} fileUrl - a file Url.
     * @return {(Object|null)} Asset Object.
     */
    getAssetByFileUrl: {
        value: function (fileUrl) {
            return this._findAssetWithFileUrl(fileUrl);
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
     * Detach an Asset Object from the list with a file url.
     * @function
     * @private
     * @param {String} fileUrl - a file Url.
     * @return {(Object|null)} an Asset Object detached.
     */
    _detachAssetWithFileUrl: {
        value: function (fileUrl) {
            var asset = this._findAssetWithFileUrl(fileUrl);
            return this._detachAsset(asset);
        }
    },

    /**
     * Detach an Asset Object from the list.
     * @function
     * @private
     * @param {Object} asset - an Asset Object.
     * @param {String} asset.category - an Asset Category.
     * @return {(Object|null)} an Asset Object detached.
     */
    _detachAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                var index = this._findAssetIndex(asset);

                if (index >= 0) {
                    return this.assets[asset.category].splice(index, 1)[0];
                }
            }

            return null;
        }
    },

    /**
     * Tries to find an Asset Object from the deleted assets list.
     * @function
     * @private
     * @param {Object} asset - an Asset Object.
     * @param {String} asset.fileName - a fileName.
     * @param {String} asset.mimeType - a supported mime-type.
     * @param {number} asset.size - size of an asset.
     * @return {(Object|null)} a deleted Asset Object.
     */
    _findAssetFromDeletedAssetPool: {
        value: function (asset) {
            var deletedAsset  = null;

            this._deletedAssetPool.some(function (currentDeletedAsset) {

                //Todo improve this checking by using mtime.

                if (asset.fileName === currentDeletedAsset.fileName && asset.mimeType === currentDeletedAsset.mimeType &&
                    asset.size && currentDeletedAsset.size) {

                    deletedAsset = currentDeletedAsset;
                }

                return !!currentDeletedAsset;
            });

            return deletedAsset;
        }
    },

    /**
     * Programs to empty the deleted asset list.
     * @function
     * @private
     */
    _programReleasePool: {
        value: function () {
            if (this._programmedReleasePool) {
                clearTimeout(this._programmedReleasePool);
            }

            if (this._deletedAssetPool.length > 0) {
                var self = this;

                this._programmedReleasePool = setTimeout(function () {
                    self._deletedAssetPool = [];
                }, TIMEOUT_RELEASE_DELETED_ASSET_POOL);
            }
        }
    },

    /**
     * Programs to release the deletedAssetPool,
     * when an Asset Object has been added to it.
     * @function
     * @public
     */
    handleDeletedAssetPoolChange: {
        value: function (plus, minus, index) {
            if (plus) {
                this._programReleasePool();
            }
        }
    },

    /**
     * handles any changes of an asset from the file system.
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

                    /* When moving or renaming a file, trigger two events,
                     * a first an event with the "delete" change, then a second with the "create" change.
                     * So in order to avoid to make again a new thumbnail,
                     * we keep for a while the last Asset Objects which have been removed,
                     * and then we check if they can be "reused".
                     */

                    var createdAsset = this.createAssetWithFileDescriptor(fileDescriptor),
                        deletedAsset = this._findAssetFromDeletedAssetPool(createdAsset);

                    if (!deletedAsset) {
                        createdAsset.iconUrl = deletedAsset.iconUrl; // No thumbnail mechanism for now, kind of useless.
                    }

                    this.addAsset(createdAsset);

                    break;

                case FILE_SYSTEM_CHANGES.DELETE:
                    var detachedAsset = this._detachAssetWithFileUrl(fileUrl);
                    this._deletedAssetPool.push(detachedAsset);
                    break;

                case FILE_SYSTEM_CHANGES.UPDATE:
                    var updatedAsset = this.createAssetWithFileDescriptor(fileDescriptor),
                        index = this._findAssetIndex(updatedAsset);

                    if (index >= 0) {
                        // TODO once a thumbnail mechanism will has been implemented,
                        // trigger it and update the iconUrl property

                        var assetFound = this.assets[updatedAsset.category][index];
                        assetFound.size = updatedAsset.size;
                    }
                    break;

                }
            }
        }
    }

});
