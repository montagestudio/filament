var AssetsConfig = require("./assets-config").AssetsConfig;

var AssetTools = {

    defineFileDataWithUrl: function (fileUrl) {
        if (this.isFileUrlValid(fileUrl)) {
            var fileData = /([^\/]+)\.([^\.]+)$|([^\/]+)$/.exec(fileUrl);

            if (fileData && Array.isArray(fileData) && fileData.length === 4) {
                return {
                    fileName: fileData[0],
                    name: fileData[1] ? fileData[1] : fileData[0],
                    extension: fileData[2]
                };
            }
        }

        return null;
    },

    isFileUrlValid: function (fileUrl) {
        return typeof fileUrl === 'string' && fileUrl.length > 0 && fileUrl.charAt(fileUrl.length-1) !== '/';
    },

    isAssetTypeValid: function (assetType) {
        return typeof assetType === 'string' && assetType.length > 0 && AssetsConfig.assetTypes.hasOwnProperty(assetType);
    },

    isSubAssetTypeValid: function (subAssetTypeName, assetType) {
        if (this.isAssetTypeValid(assetType)) {
            return Object.keys(AssetsConfig.assetTypes[assetType].subAssetTypes).some(function (subTypeName) {
                return subAssetTypeName === subTypeName;
            });
        }

        var self = this;

        return Object.keys(AssetsConfig.assetTypes).some(function (assetType) {
            return self.isSubAssetTypeValid(subAssetTypeName, assetType);
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
                subAssetTypeFound = void 0;

            Object.keys(subAssetTypes).some(function (subAssetTypeName) {
                subAssetTypeFound = subAssetTypes[subAssetTypeName].mimeTypes.indexOf(mimeType) >= 0 ? subAssetTypeName : void 0;
                return !!subAssetTypeFound;
            });

            return subAssetTypeFound;
        }

        assetTypeName = this.findAssetTypeFromMimeType(mimeType);

        return this.isAssetTypeValid(assetTypeName) ? this.findSubAssetTypeFromMimeType(mimeType, assetTypeName): void 0;
    },

    findAssetTypeFromSubAssetType: function (subAssetTypeName) {
        var assetTypeFound = void 0;

        Object.keys(AssetsConfig.assetTypes).some(function (assetTypeName) {
            var assetType = AssetsConfig.assetTypes[assetTypeName];
            assetTypeFound = assetType.subAssetTypes.hasOwnProperty(subAssetTypeName) ? assetTypeName : void 0;
            return !!assetTypeFound;
        });

        return assetTypeFound;
    },

    findAssetTypeFromMimeType: function (mimeType) {
        if (typeof mimeType === 'string' && mimeType.length > 0) {
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
