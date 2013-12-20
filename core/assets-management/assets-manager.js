var FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    application = require("montage/core/application").application,
    AssetsConfig = require("./assets-config").AssetsConfig,
    AssetTools = require("./asset-tools").AssetTools,
    Montage = require("montage/core/core").Montage,
    ReelDocument = require("core/reel-document").ReelDocument,

    PACKAGE_LOCATION = require.location,
    Asset = require("./asset").Asset,

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

            var self = this,
                assetCategories = AssetsConfig.assetCategories;

            Object.keys(assetCategories).forEach(function (assetCategoryName) {

                var currentAssetCategory = assetCategories[assetCategoryName];
                currentAssetCategory.defaultIconUrl = PACKAGE_LOCATION + currentAssetCategory.defaultIconUrl;
                self.assetCategories[assetCategoryName] = assetCategoryName;
                self.assets[assetCategoryName] = [];
            });

            application.addEventListener("didOpenPackage", this);
            application.addEventListener("fileSystemChange", this);
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

    _projectController: {
        value: null
    },

    _projectUrl: {
        get: function () {
            if (this._projectController) {
                return this._projectController.projectUrl;
            }
        }
    },

    _currentDocument: {
        get: function () {
            if (this._projectController) {
                return this._projectController.currentDocument;
            }
        }
    },

    /**
     * Init the AssetManager with a reference to the Project Controller.
     * @function
     * @public
     * @param {Object} projectController - Project Controller.
     * @return {Object}
     */
    init: {
        value: function (projectController) {
            this._projectController = projectController;
            return this;
        }
    },

    /**
     * Scedules to populate the Asset Manager once the project has been opened.
     * @function
     * @public
     * @param {Object} event.
     */
    handleDidOpenPackage: {
        value: function (event) {
            if (this._projectController) {
                this._populateAssets().done();
            }
        }
    },

    /**
     * Schedules to populate the Asset Manager once the project has been opened.
     * @function
     * @public
     * @param {Object} event.
     * @return {Promise} a promise for the list of Assets.
     */
    _populateAssets: {
        value: function () {
            var self = this;

            return this._projectController.environmentBridge.listAssetAtUrl(this._projectController.projectUrl).then(function (fileDescriptors) {
                self.addAssetsWithFileDescriptors(fileDescriptors);
            });
        }
    },

    /**
     * Creates ans adds a list of assets from an array of FileDescriptors.
     * @function
     * @public
     * @param {Array.<FileDescriptor>} fileDescriptors - list of fileDescriptors.
     */
    addAssetsWithFileDescriptors: {
        value: function (fileDescriptors) {
            if (fileDescriptors && Array.isArray(fileDescriptors)) {
                var self = this;

                fileDescriptors.forEach(function (fileDescriptor) {
                    var createdAsset = self.createAssetWithFileDescriptor(fileDescriptor);
                    self.addAsset(createdAsset);
                });
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
     * @return {(Asset|null)} created Asset Object.
     */
    createAssetWithFileDescriptor: {
        value: function (fileDescriptor) {
            if (AssetTools.isAFile(fileDescriptor.fileUrl) && AssetTools.isMimeTypeSupported(fileDescriptor.mimeType)) {
                var createdAsset = Asset.create().initWithFileDescriptor(fileDescriptor);
                createdAsset.iconUrl =  this.getIconWithAsset(createdAsset);
                return createdAsset;
            }
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
     * Gets a relative project path for an Asset.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @param {String} asset.fileUrl - an Asset fileUrl.
     * @return {(String|undefined)} relative url.
     */
    getRelativePathWithAsset: {
        value: function (asset) {
            var projectUrl = this._projectUrl;

            if (projectUrl && AssetTools.isAssetValid(asset)) {
                var length = projectUrl.length;

                if (projectUrl.charAt(length - 1) !== '/') {
                    length++;  // projectUrl + trailing slash.
                }

                return asset.fileUrl.substring(length);
            }
        }
    },

    /**
     * Gets a relative project path for an Asset from a reel document.
     * @function
     * @public
     * @param {Object} asset - an Asset object.
     * @return {(String|undefined)} relative url.
     */
    getRelativePathWithAssetFromCurrentReelDocument: {
        value: function (asset) {
            var projectUrl = this._projectUrl,
                currentReelDocument = this._currentDocument;

            if (projectUrl && AssetTools.isAssetValid(asset) && currentReelDocument instanceof ReelDocument) {
                var reelDocumentRelativeUrl = currentReelDocument.url.substring(projectUrl.length);

                if (reelDocumentRelativeUrl) {
                    var relativeUrl = this.getRelativePathWithAsset(asset),
                        parts = reelDocumentRelativeUrl.split("/"),
                        parents = "";

                    parts.forEach(function (part) {
                        if (part.length > 0) {
                            parents += "../";
                        }
                    });

                    return parents + relativeUrl;
                }
            }
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
            if (AssetTools.isAFile(fileUrl)) {
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

            return -1;
        }
    },

    /**
     * Finds an Asset within the list of Assets in terms of a file url.
     * @function
     * @private
     * @param {String} property - an Asset property.
     * @param {String} value - a value.
     * @param {String} [category] - an Asset Category.
     * @return {(Object|null)} an Asset Object that has been found.
     */
    _findAssetWithPropertyAndValue: {
        value: function (property, value, assetCategory) {
            var assetFound = null;

            // If assetCategory is not undefined looks into the Asset category, in order to find an asset
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                var assetSet = this.assets[assetCategory];

                assetSet.some(function (asset) {
                    assetFound = asset[property] === value ? asset : null;
                    return !!assetFound;
                });

                return assetFound;
            }

            // If assetCategory is undefined looks into each Asset categories.
            var assetCategories = this.assetCategories,
                self = this;

            Object.keys(assetCategories).some(function (assetCategory) {
                assetFound = self._findAssetWithPropertyAndValue(property, value, assetCategory);
                return !!assetFound;
            });

            return assetFound;
        }
    },

    /**
     * Finds an Asset within the list of Assets in terms of a file url.
     * @function
     * @private
     * @param {String} fileUrl - a file Url.
     * @param {String} [category] - an Asset Category.
     * @return {(Object|null)} an Asset Object that has been found.
     */
    _findAssetWithFileUrl: {
        value: function (fileUrl, assetCategory) {
            if (AssetTools.isAFile(fileUrl)) {
                return this._findAssetWithPropertyAndValue("fileUrl", fileUrl, assetCategory);
            }

            return null;
        }
    },

    /**
     * Finds an Asset within the list of Assets in terms of an index node.
     * @function
     * @private
     * @param {String} fileUrl - an index node.
     * @param {String} [category] - an Asset Category.
     * @return {(Object|null)} an Asset Object that has been found.
     */
    _findAssetWithInode: {
        value: function (inode, assetCategory) {
            return this._findAssetWithPropertyAndValue("inode", inode, assetCategory);
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
     * Finds and Gets an Asset with a relative path.
     * @function
     * @public
     * @param {String} relativePath - a relative path.
     * @return {(Object|null)} Asset Object.
     */
    getAssetByRelativePath: {
        value: function (relativePath) {
            if (typeof relativePath === "string" && relativePath.length > 0 && this._projectUrl) {
                var relativePathCleaned = relativePath.replace(/\.\.\//g, ''),
                    projectUrl = this._projectUrl;

                if (projectUrl.charAt(length - 1) !== '/') {
                    projectUrl += '/';
                }

                if (relativePathCleaned.charAt(0) === '/') {
                    relativePathCleaned = relativePathCleaned.substring(1);
                }

                return this._findAssetWithFileUrl(projectUrl + relativePathCleaned);
            }
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
     * Tries to find an Asset Object from the deleted assets list,
     * by comparing data within a FileDescriptor Object.
     * Whether a Asset has been found, it will be updated and added to the assets list.
     * @function
     * @private
     * @param {Object} fileDescriptor - an FileDescriptor Object.
     * @param {number} fileDescriptor._stat - stats of an fileDescriptor.
     * @return {Boolean} if an asset has been revived.
     */
    _reviveAssetWithFileDescriptor: {
        value: function (fileDescriptor) {
            var asset = this._findAssetWithInode(fileDescriptor._stat.ino);

            if (asset && !asset.exist) {
                asset.exist = true;
                asset.updateWithFileDescriptor(fileDescriptor);
                return true;
            }

            return false;
        }
    },

    _detectMimeTypeWithFileUrl: {
        value: function (fileUrl) {
            return this._projectController.environmentBridge.detectMimeTypeAtUrl(fileUrl);
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

            if (this._projectController && fileChangeDetail && typeof fileChangeDetail === "object" && AssetTools.isAFile('fileUrl')) {
                var fileUrl = fileChangeDetail.fileUrl,
                    self = this;

                switch (fileChangeDetail.change) {

                case FILE_SYSTEM_CHANGES.CREATE:

                    /* When moving or renaming a file, trigger two events,
                     * a first an event with the "delete" change, then a second with the "create" change.
                     * So in order to avoid to make again a new thumbnail,
                     * we keep for a while the last Asset Objects which have been removed,
                     * and then we check if they can be "reused".
                     */

                    this._detectMimeTypeWithFileUrl(fileUrl).then(function (mimeType) {
                        if (AssetTools.isMimeTypeSupported(mimeType)) {
                            var fileDescriptor = FileDescriptor.create().initWithUrlAndStat(fileUrl, fileChangeDetail.currentStat);
                            fileDescriptor.mimeType = mimeType;

                            if (!self._reviveAssetWithFileDescriptor(fileDescriptor)) {
                                self.addAsset(self.createAssetWithFileDescriptor(fileDescriptor));
                            }
                        }
                    }).done();
                    break;

                case FILE_SYSTEM_CHANGES.DELETE:
                    var asset = this._findAssetWithFileUrl(fileUrl);

                    if (asset) {
                        asset.exist = false;
                    }
                    break;

                case FILE_SYSTEM_CHANGES.UPDATE:
                    var updatedAsset = this._findAssetWithFileUrl(fileUrl);

                    if (updatedAsset) {
                        this._detectMimeTypeWithFileUrl(fileUrl).then(function (mimeType) {
                            if (AssetTools.isMimeTypeSupported(mimeType)) {
                                var fileDescriptor = FileDescriptor.create().initWithUrlAndStat(fileUrl, fileChangeDetail.currentStat);
                                fileDescriptor.mimeType = mimeType;

                                // TODO once a thumbnail mechanism will has been implemented,
                                // trigger it and update the iconUrl property
                                updatedAsset.updateWithFileDescriptor(fileDescriptor);
                            }
                        }).done();
                    }
                    break;
                }
            }
        }
    }

});
