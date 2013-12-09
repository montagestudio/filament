var FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    Application = require("montage/core/application").application,
    AssetsConfig = require("./assets-config").AssetsConfig,
    AssetTools = require("./asset-tools").AssetTools,
    Montage = require("montage/core/core").Montage,
    PackageLocation = require.location,
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
            this.assetTypes = {};

            var self = this,
                assetTypes = AssetsConfig.assetTypes;

            Object.keys(assetTypes).forEach(function (assetTypeName) {

                var currentAssetType = assetTypes[assetTypeName];
                currentAssetType.defaultIconUrl = PackageLocation + currentAssetType.defaultIconUrl;
                self.assetTypes[assetTypeName] = assetTypeName;
                self.assets[assetTypeName] = [];
            });

        }
    },

    assetTypes: {
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
                    self.addAsset(fileDescriptor); // try to add an asset
                });
            }

            return this;
        }
    },

    assetsLength: {
        get:  function () {
            var assets = this.assets;

            if (assets) {
                var length = 0;

                Object.keys(assets).forEach(function (assetTypeName) {
                    length = length + assets[assetTypeName].length;
                });

                return length;
            }
        }
    },

    addAsset: {
        value: function (fileDescriptor, iconUrl) {
            var fileUrl = fileDescriptor.fileUrl,
                assetCreated = Asset.create().initWithFileUrlAndMimeType(fileUrl, fileDescriptor.mimeType);

            if (assetCreated) {
                var assetType = assetCreated.type;

                assetCreated.iconUrl = AssetTools.isFileUrlValid(iconUrl) ?
                    iconUrl : this.getIconWithFileUrlAndAssetType(fileUrl, assetType);

                this.assets[assetType].push(assetCreated);

                return assetCreated;
            }

            return null;
        }
    },

    getIconWithFileUrlAndAssetType: {
        value: function (fileUrl, assetType) {
            if (AssetTools.isAssetUrlAndTypeValid(fileUrl, assetType)) {
                //Todo implement a way to make a thumbnail for an asset.
                return this.getDefaultIconUrlByType(assetType);
            }

            return null;
        }
    },

    getDefaultIconUrlByType: {
        value: function (assetType) {
            if (AssetTools.isAssetTypeValid(assetType)) {
                return AssetsConfig.assetTypes[assetType].defaultIconUrl;
            }

            return null;
        }
    },

    removeAsset: {
        value: function (fileUrl, assetType) {
            if (AssetTools.isAssetUrlAndTypeValid(fileUrl, assetType)) {
                var index = this._findAssetIndex(fileUrl, assetType);

                if (index >= 0) {
                    this.assets[assetType].splice(index, 1);
                }

                return true;
            }
            return false;
        }
    },

    _findAssetIndex: {
        value: function (fileUrl, assetType) {
            if (AssetTools.isAssetUrlAndTypeValid(fileUrl, assetType)) {
                var assetsList = this.assets[assetType];

                for (var i = 0, length = assetsList.length; i < length; i++) {
                    var currentAsset = assetsList[i];

                    if (fileUrl === currentAsset.fileUrl) {
                        return i;
                    }
                }
            }

            return -1;
        }
    },

    getAssetsByAssetType: {
        value: function (assetTypeName) {
            if (AssetTools.isAssetTypeValid(assetTypeName)) {
                return this.assets[assetTypeName];
            }

            return [];
        }
    },

    getAssetsByMimeType: {
        value: function (mimeType) {
            var assetType = AssetTools.findAssetTypeFromMimeType(mimeType),
                assetsList = [];

            if (assetType) {
                this.assets[assetType].forEach(function (asset) {
                    if (asset.mimeType === mimeType) {
                        assetsList.push(asset);
                    }
                });
            }

            return assetsList;
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
                    this.addAsset(fileDescriptor);
                    break;

                case FILE_SYSTEM_CHANGES.DELETE:
                    if (AssetTools.isMimeTypeSupported(mimeType)) {
                        this.removeAsset(fileUrl);
                    }
                    break;
                }
            }
        }
    }

});
