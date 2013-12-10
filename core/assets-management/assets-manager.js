var FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    Application = require("montage/core/application").application,
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

    assetCategories: {
        value: null
    },

    assets: {
        value: null
    },

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

    addAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                this.assets[asset.category].push(asset);
                return true;
            }

            return false;
        }
    },

    createAssetWithFileUrlAndMimeType: {
        value: function (fileUrl, mimeType) {
            var createdAsset = Asset.create().initWithFileUrlAndMimeType(fileUrl, mimeType);
            createdAsset.iconUrl =  this.getIconWithAsset(createdAsset);
            return createdAsset;
        }
    },

    createAssetWithFileDescriptor: {
        value: function (fileDescriptor) {
            return this.createAssetWithFileUrlAndMimeType(fileDescriptor.fileUrl, fileDescriptor.mimeType);
        }
    },

    getIconWithAsset: {
        value: function (asset) {
            if (AssetTools.isAssetValid(asset)) {
                //Todo implement a way to make a thumbnail for an asset.
                return this.getDefaultIconUrlByAssetCategory(asset.category);
            }

            return null;
        }
    },

    getDefaultIconUrlByAssetCategory: {
        value: function (assetCategory) {
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                return AssetsConfig.assetCategories[assetCategory].defaultIconUrl;
            }

            return null;
        }
    },

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

    removeAssetWithFileUrl: {
        value: function (fileUrl) {
            if (AssetTools.isFileUrlValid(fileUrl)) {
                var assetFound = this._findAssetWithFileUrl(fileUrl);
                return this.removeAsset(assetFound);
            }

            return false;
        }
    },

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

    _findAssetWithFileUrl: {
        value: function (fileUrl, assetCategory) {
            var assetFound = null;
            //debugger

            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                var assetSet = this.assets[assetCategory];

                assetSet.some(function (asset) {
                    assetFound = asset.fileUrl === fileUrl ? asset : null;
                    return !!assetFound;
                });

                return assetFound;
            }

            var assetCategories = this.assetCategories,
                self = this;

            Object.keys(assetCategories).some(function (assetCategory) {
                assetFound = self._findAssetWithFileUrl(fileUrl, assetCategory);
                return !!assetFound;
            });

            return assetFound;
        }
    },

    getAssetsByAssetCategory: {
        value: function (assetCategory) {
            if (AssetTools.isAssetCategoryValid(assetCategory)) {
                return this.assets[assetCategory];
            }

            return [];
        }
    },

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
