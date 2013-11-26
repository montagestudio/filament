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
                assetTypes = AssetsConfig.types;

            Object.keys(assetTypes).forEach(function (currentAssetType) {

                var currentAssetConfigType = assetTypes[currentAssetType];
                currentAssetConfigType.defaultIconUrl = PackageLocation + currentAssetConfigType.defaultIconUrl;
                self.assetTypes[currentAssetType] = currentAssetType;
                self.assets[currentAssetType] = [];

            });

            Application.addEventListener("fileSystemChange", this);
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

                filesList.forEach(function (currentFile) {
                    var assetType = self._defineAssetTypeWithFileDescriptor(currentFile);

                    if (assetType) { // If a type has been found, then the current file is an asset.
                        self.addAsset(currentFile.fileUrl, assetType);
                    }
                });
            }

            return this;
        }
    },

    _defineAssetTypeWithFileDescriptor: {
        value: function (currentFile) {
            if (currentFile && typeof currentFile === "object") {

                if (currentFile.isCollada) {
                    return this.assetTypes["3D"];
                } else if (currentFile.isImage) {
                    return this.assetTypes.IMAGE;
                }

            }
            return null;
        }
    },

    addAsset: {
        value: function (fileUrl, assetType, iconUrl) {
            if (AssetTools.isAssetUrlAndTypeValid(fileUrl, assetType)) {

                var assetCreated = Asset.create().initWithFileUrlAndAssetType(fileUrl, assetType);

                if (assetCreated) {
                    assetCreated.iconUrl = AssetTools.isFileUrlValid(iconUrl) ?
                        iconUrl : this.getIconWithFileUrlAndAssetType(fileUrl, assetType);

                    this.assets[assetType].push(assetCreated);

                    return assetCreated;
                }
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
                return AssetsConfig.types[assetType].defaultIconUrl;
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

    getAssetsListByType: {
        value: function (type) {
            if (AssetTools.isAssetTypeValid(type)) {
                return this.assets[type];
            }

            return [];
        }
    },

    handleFileSystemChange: {
        value: function (event) {
            var fileChangeDetail = event.detail;

            if (fileChangeDetail && typeof fileChangeDetail === "object" && fileChangeDetail.hasOwnProperty('fileUrl')) {
                var fileUrl = fileChangeDetail.fileUrl,
                    tmpFileDescriptor = FileDescriptor.create().initWithUrlAndStat(fileUrl, fileChangeDetail.currentStat),
                    assetType = this._defineAssetTypeWithFileDescriptor(tmpFileDescriptor);

                if (assetType) {
                    switch (fileChangeDetail.change) {
                        case FILE_SYSTEM_CHANGES.CREATE:
                            this.addAsset(fileUrl, assetType);
                            break;
                        case FILE_SYSTEM_CHANGES.DELETE:
                            this.removeAsset(fileUrl, assetType);
                            break;
                    }
                }
            }
        }
    }

});
