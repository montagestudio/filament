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

    isFileFormatExist: function (fileFormatName, assetType) {
        if (this.isAssetTypeValid(assetType)) {
            return Object.keys(AssetsConfig.assetTypes[assetType].fileFormats).some(function (subTypeName) {
                return fileFormatName === subTypeName;
            });
        }

        var self = this;

        return Object.keys(AssetsConfig.assetTypes).some(function (assetType) {
            return self.isFileFormatExist(fileFormatName, assetType);
        });
    },

    isMimeTypeValid: function (mimeType, assetTypeName) {
        if (this.isAssetTypeValid(assetTypeName)) {
            var fileFormats = AssetsConfig.assetTypes[assetTypeName].fileFormats;

            return Object.keys(fileFormats).some(function (fileFormatName) {
                return fileFormats[fileFormatName].mimeTypes.indexOf(mimeType) >= 0;
            });
        }

        assetTypeName = this.findAssetTypeFromMimeType(mimeType);

        return this.isAssetTypeValid(assetTypeName) ? this.isMimeTypeValid(mimeType, assetTypeName): false;
    },

    isAssetUrlAndTypeValid: function (fileUrl, assetType) {
        return this.isFileUrlValid(fileUrl) && this.isAssetTypeValid(assetType);
    },

    findFileFormatFromMimeType: function (mimeType, assetTypeName) {
        if (this.isAssetTypeValid(assetTypeName)) {
            var fileFormats = AssetsConfig.assetTypes[assetTypeName].fileFormats,
                fileFormat = null,

                fileFormatFound = Object.keys(fileFormats).some(function (fileFormatName) {
                    fileFormat = fileFormatName;
                    return fileFormats[fileFormat].mimeTypes.indexOf(mimeType) >= 0 ? fileFormat : false;
                });

            return fileFormatFound ? fileFormat : void 0;
        }

        assetTypeName = this.findAssetTypeFromMimeType(mimeType);

        return this.isAssetTypeValid(assetTypeName) ? this.findFileFormatFromMimeType(mimeType, assetTypeName): void 0;
    },

    findAssetTypeFromFileFormat: function (fileFormatName) {
        var assetTypeFound = null;

        Object.keys(AssetsConfig.assetTypes).some(function (assetType) {
            assetTypeFound = AssetsConfig.assetTypes[assetType].fileFormats.hasOwnProperty(fileFormatName) ? assetType : null;
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
