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

    isAssetCategoryValid: function (assetCategory) {
        return typeof assetCategory === 'string' && assetCategory.length > 0 && AssetsConfig.assetCategories.hasOwnProperty(assetCategory);
    },

    isMimeTypeSupported: function (mimeType, assetCategory) {
        var assetCategories =  AssetsConfig.assetCategories,
            self = this;

        if (this.isAssetCategoryValid(assetCategory)) {
            return assetCategories[assetCategory].mimeTypes.indexOf(mimeType) >= 0;
        }

        return Object.keys(assetCategories).some(function (assetCategory) {
            return self.isMimeTypeSupported(mimeType, assetCategory);
        });
    },

    isAssetValid: function (asset) {
        return asset && typeof asset && this.isFileUrlValid(asset.fileUrl) && this.isMimeTypeSupported(asset.mimeType);
    },

    findAssetCategoryFromMimeType: function (mimeType) {
        if (typeof mimeType === 'string' && mimeType.length > 0) {
            var dataMimeType = mimeType.split('/');

            if (Array.isArray(dataMimeType) && dataMimeType.length === 2) {
                var assetCategory = dataMimeType[0].toUpperCase();

                if (this.isAssetCategoryValid(assetCategory)) {
                    return assetCategory;
                }
            }
        }
    }

};

exports.AssetTools = AssetTools;
