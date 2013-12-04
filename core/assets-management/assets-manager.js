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
            this.subAssetTypes = {};

            var self = this,
                assetTypes = AssetsConfig.assetTypes;

            Object.keys(assetTypes).forEach(function (assetTypeName) {

                var currentAssetType = assetTypes[assetTypeName];
                currentAssetType.defaultIconUrl = PackageLocation + currentAssetType.defaultIconUrl;
                self.assetTypes[assetTypeName] = assetTypeName;
                self.assets[assetTypeName] = [];
                self._populateSubAssetTypes(currentAssetType.subAssetTypes);
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

    subAssetTypes: {
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

    _populateSubAssetTypes: {
        value: function (assetType) {
            if (assetType && typeof assetType === "object" && this.subAssetTypes) {
                var self = this;

                Object.keys(assetType).forEach(function (subAssetTypeName) {
                    self.subAssetTypes[subAssetTypeName] = assetType[subAssetTypeName];
                });
            }
        }
    },

    _defineAssetTypeWithFileDescriptor: {
        value: function (currentFile) {
            if (currentFile && typeof currentFile === "object") {

                if (currentFile.isCollada) {
                    return this.assetTypes.MODEL;
                } else if (currentFile.isImage) {
                    return this.assetTypes.IMAGE;
                } else if (currentFile.isAudio) {
                    return this.assetTypes.AUDIO;
                } else if (currentFile.isVideo) {
                    return this.assetTypes.VIDEO;
                }

            }
            return null;
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
            var assetType = this._defineAssetTypeWithFileDescriptor(fileDescriptor);

            if (assetType) { // If a type has been found, then the current file is an asset.
                var fileUrl = fileDescriptor.fileUrl;

                if (AssetTools.isAssetUrlAndTypeValid(fileUrl, assetType)) {
                    var assetCreated = Asset.create().initWithFileUrlAndAssetType(fileUrl, assetType);

                    if (assetCreated) {
                        assetCreated.iconUrl = AssetTools.isFileUrlValid(iconUrl) ?
                            iconUrl : this.getIconWithFileUrlAndAssetType(fileUrl, assetType);

                        assetCreated.mimeType = fileDescriptor.mimeType;

                        this.assets[assetType].push(assetCreated);

                        return assetCreated;
                    }
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

    _filterAssets: {
        value: function (property, condition, assetType) {
            var assetsList = [];

            this.assets[assetType].forEach(function (asset) {
                if (asset[property] === condition) {
                    assetsList.push(asset);
                }
            });

            return assetsList;
        }
    },

    getAssetsBySubAssetType: {
        value: function (subAssetTypeName) {
            if (this.subAssetTypes.hasOwnProperty(subAssetTypeName)) {
                var assetType = AssetTools.findAssetTypeFromSubAssetType(subAssetTypeName);
                return this._filterAssets("subAssetType", subAssetTypeName, assetType);
            }

            return [];
        }
    },

    getAssetsByMimeType: {
        value: function (mimeType) {
            if (AssetTools.isMimeTypeValid(mimeType)) {
                var assetType = AssetTools.findAssetTypeFromMimeType(mimeType);
                return this._filterAssets("mimeType", mimeType, assetType);
            }

            return [];
        }
    },

    handleFileSystemChange: {
        value: function (event) {
            var fileChangeDetail = event.detail;

            if (fileChangeDetail && typeof fileChangeDetail === "object" && fileChangeDetail.hasOwnProperty('fileUrl')) {
                var fileUrl = fileChangeDetail.fileUrl,
                    fileDescriptor = FileDescriptor.create().initWithUrlAndStat(fileUrl, fileChangeDetail.currentStat);

                switch (fileChangeDetail.change) {

                case FILE_SYSTEM_CHANGES.CREATE:
                    this.addAsset(fileDescriptor);
                    break;

                case FILE_SYSTEM_CHANGES.DELETE:
                    var assetType = this._defineAssetTypeWithFileDescriptor(fileDescriptor);

                    if (assetType) {
                        this.removeAsset(fileUrl, assetType);
                    }
                    break;
                }
            }
        }
    }

});
