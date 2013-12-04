var AssetsConfig = require("./assets-config").AssetsConfig;

var AssetTools = {

    defineFileDataWithUrl: function (fileUrl) {
        if (this.isFileUrlValid(fileUrl)) {
            var fileData = /([^\/]+)\.([^\.]+)$/.exec(fileUrl);

            if (fileData && Array.isArray(fileData) && fileData.length === 3) {
                return fileData;
            }
        }

        return null;
    },

    isFileUrlValid: function (fileUrl, strict) {
        var urlValidity = fileUrl && typeof fileUrl === 'string' && fileUrl.length > 0 &&
            fileUrl.charAt(fileUrl.length-1) !== '/';

        return !!strict && urlValidity ? /\.([^\.]+)$/.test(fileUrl) : urlValidity;
    },

    isAssetTypeValid: function (assetType) {
        return assetType && typeof assetType === 'string' && AssetsConfig.assetTypes.hasOwnProperty(assetType);
    },

    isSubAssetTypeExist: function (subAssetTypeName, assetType) {
        if (this.isAssetTypeValid(assetType)) {
            return Object.keys(AssetsConfig.assetTypes[assetType].subAssetTypes).some(function (subTypeName) {
                return subAssetTypeName === subTypeName;
            });
        }

        var self = this;

        return Object.keys(AssetsConfig.assetTypes).some(function (assetType) {
            return self.isSubAssetTypeExist(subAssetTypeName, assetType);
        });
    },

    isMimeTypeValid: function (mimeType, assetTypeName) {
        if (this.isAssetTypeValid(assetTypeName)) {
            var subAssetTypes = AssetsConfig.assetTypes[assetTypeName].subAssetTypes;

            return Object.keys(subAssetTypes).some(function (subAssetTypeName) {
                return subAssetTypes[subAssetTypeName].mimeTypes.indexOf(mimeType) >= 0;
            });
        }

        assetTypeName = this.findAssetTypeFromMimeType(mimeType);

        return this.isAssetTypeValid(assetTypeName) ? this.isMimeTypeValid(mimeType, assetTypeName): false;
    },

    isAssetUrlAndTypeValid: function (fileUrl, assetType) {
        return this.isFileUrlValid(fileUrl) && this.isAssetTypeValid(assetType);
    },

    findSubAssetTypeFromMimeType: function (mimeType, assetTypeName) {
        if (this.isAssetTypeValid(assetTypeName)) {
            var subAssetTypes = AssetsConfig.assetTypes[assetTypeName].subAssetTypes,
                subAssetType = null,

                subAssetTypeFound = Object.keys(subAssetTypes).some(function (subAssetTypeName) {
                    subAssetType = subAssetTypeName;
                    return subAssetTypes[subAssetType].mimeTypes.indexOf(mimeType) >= 0 ? subAssetType : false;
                });

            return subAssetTypeFound ? subAssetType : void 0;
        }

        assetTypeName = this.findAssetTypeFromMimeType(mimeType);

        return this.isAssetTypeValid(assetTypeName) ? this.findSubAssetTypeFromMimeType(mimeType, assetTypeName): void 0;
    },

    findAssetTypeFromSubAssetType: function (subAssetTypeName) {
        var assetTypeFound = null;

        Object.keys(AssetsConfig.assetTypes).some(function (assetType) {
            assetTypeFound = AssetsConfig.assetTypes[assetType].subAssetTypes.hasOwnProperty(subAssetTypeName) ? assetType : null;
            return !!assetTypeFound;
        });

        return assetTypeFound;
    },

    findAssetTypeFromMimeType: function (mimeType) {
        if (mimeType && typeof mimeType === 'string') {
            var dataMimeType = mimeType.split('/');

            if (Array.isArray(dataMimeType) && dataMimeType.length === 2) {
                var assetTypeName = dataMimeType[0].toUpperCase();

                if (this.isAssetTypeValid(assetTypeName)) {
                    return assetTypeName;
                }
            }
        }
    }

};

exports.AssetTools = AssetTools;
