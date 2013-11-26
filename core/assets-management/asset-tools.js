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
        return assetType && typeof assetType === 'string' && AssetsConfig.types.hasOwnProperty(assetType);
    },

    isAssetUrlAndTypeValid: function (fileUrl, assetType) {
        return this.isFileUrlValid(fileUrl) && this.isAssetTypeValid(assetType);
    }

};

exports.AssetTools = AssetTools;
