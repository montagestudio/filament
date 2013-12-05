var Montage = require("montage/core/core").Montage,
    AssetTools = require("./asset-tools").AssetTools;

exports.Asset = Montage.specialize({

    constructor: {
        value: function Asset() {
            this.super();
        }
    },

    initWithFileUrlAndAssetType: {
        value: function (fileUrl, assetType) {
            this.type = assetType;
            this.fileUrl = fileUrl;

            if (this.type && this.fileUrl) {
                return this;
            }

            return null;
        }
    },

    _name: {
        value: null
    },

    name: {
        get: function () {
            return this._name;
        }
    },

    _extension: {
        value: null
    },

    extension: {
        get: function () {
            return this._extension;
        }
    },

    _fileName: {
        value: null
    },

    fileName: {
        get: function () {
            return this._fileName;
        }
    },

    _subAssetType: {
        value: null
    },

    subAssetType: {
        get: function () {
            return this._subAssetType;
        }
    },

    _mimeType: {
        value: null
    },

    mimeType: {
        set: function (mimeType) {
            if (this._type) {
                this._mimeType = AssetTools.isMimeTypeValid(mimeType, this._type) ? mimeType : null;

                if (this._mimeType) {
                    this._subAssetType = AssetTools.findSubAssetTypeFromMimeType(mimeType);
                }
            }
        },
        get: function () {
            return this._mimeType;
        }
    },

    _type: {
        value: null
    },

    type: {
        set: function (type) {
            this._type = AssetTools.isAssetTypeValid(type) ? type : null;
        },
        get: function () {
            return this._type;
        }
    },

    _fileUrl: {
        value: null
    },

    fileUrl: {
        set: function (fileUrl) {
            var fileData = AssetTools.defineFileDataWithUrl(fileUrl);

            if (fileData) {
                this._fileName = fileData.fileName;
                this._name = fileData.name;
                this._extension = fileData.extension;
                this._fileUrl = fileUrl;

            } else {
                this._fileUrl = null;
            }
        },
        get: function () {
            return this._fileUrl;
        }
    },

    _iconUrl: {
        value: null
    },

    iconUrl: {
        set: function (iconUrl) {
            if (AssetTools.isFileUrlValid(iconUrl)) {
                this._iconUrl = iconUrl;
            }
        },
        get: function () {
            return this._iconUrl;
        }
    }

});
