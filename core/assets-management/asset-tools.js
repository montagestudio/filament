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

    isAssetUrlAndTypeValid: function (fileUrl, assetType) {
        return this.isFileUrlValid(fileUrl) && this.isAssetTypeValid(assetType);
    },

    isMimeTypeSupported: function (mimeType, assetTypeName) {
        var assetTypes =  AssetsConfig.assetTypes,
            self = this;

        if (this.isAssetTypeValid(assetTypeName)) {
            return assetTypes[assetTypeName].mimeTypes.indexOf(mimeType) >= 0;
        }

        return Object.keys(assetTypes).some(function (assetTypeName) {
            return self.isMimeTypeSupported(mimeType, assetTypeName);
        });
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
