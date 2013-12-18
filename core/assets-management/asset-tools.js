var AssetsConfig = require("./assets-config").AssetsConfig;

// Provides some functions to the Asset Management.
var AssetTools = {

    /**
     * Decomposes a string (a file url),
     * in order to get its filename, its name and its extension
     * ex: /a/b/c/foo.bar => {filename: foo.bar, name: foo, extension: bar}
     * @function
     * @public
     * @param {String} fileUrl - a file Url.
     * @return {Object}
     */
    defineFileDataWithUrl: function (fileUrl) {
        if (this.isAFile(fileUrl)) {
            var fileData = /([^\/]+)\.([^\.]+)$|(?:[^\/]+)$/.exec(fileUrl);

            if (fileData && Array.isArray(fileData) && fileData.length === 3) {
                return {
                    fileName: fileData[0],
                    name: fileData[1] ? fileData[1] : fileData[0],
                    extension: fileData[2]
                };
            }
        }

        return null;
    },

    /**
     * Checks if a string is an url valid.
     * @function
     * @public
     * @param {String} fileUrl - a file Url.
     * @return {Boolean}
     */
    isAFile: function (fileUrl) {
        return typeof fileUrl === 'string' && fileUrl.length > 0 && fileUrl.charAt(fileUrl.length-1) !== '/';
    },

    /**
     * Checks if an Asset Category is supported.
     * @function
     * @public
     * @param {String} assetCategory - a supported Asset Category.
     * @return {Boolean}
     */
    isAssetCategoryValid: function (assetCategory) {
        return typeof assetCategory === 'string' && assetCategory.length > 0 && AssetsConfig.assetCategories.hasOwnProperty(assetCategory);
    },

    /**
     * Checks if a mime-type is supported.
     * @function
     * @public
     * @param {String} mimeType - a supported mime-type.
     * @param {String} [assetCategory] - an Asset Category.
     * @return {Boolean}
     */
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

    /**
     * Checks if an Asset Object is valid,
     * or in other words its file url and its mime-type.
     * @function
     * @public
     * @param {Object} asset - an Asset Object.
     * @param {Object} asset.fileUrl - a file Url.
     * @param {Object} asset.mimeType - a supported mime-type.
     * @return {Boolean}
     */
    isAssetValid: function (asset) {
        return asset && typeof asset && this.isAFile(asset.fileUrl) && this.isMimeTypeSupported(asset.mimeType);
    },

    /**
     * Checks if a mime-type is supported.
     * @function
     * @public
     * @param {String} mimeType - a supported mime-type.
     * @return {Object}
     */
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
