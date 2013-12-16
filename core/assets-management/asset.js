var Montage = require("montage/core/core").Montage,
    AssetTools = require("./asset-tools").AssetTools;

/**
 * @class Asset
 * @extends module:montage.Montage
 */
exports.Asset = Montage.specialize({

    constructor: {
        value: function Asset() {
            this.super();
        }
    },

    initWithFileDescriptor: {
        value: function (fileDescriptor) {
            if (!fileDescriptor || typeof fileDescriptor !== "object") {
                throw new Error("Cannot init Asset object the parameter FileDescriptor is missing");
            }

            var mimeType = fileDescriptor.mimeType;

            if (!AssetTools.isMimeTypeSupported(mimeType)) {
                throw new Error("Cannot init Asset object because the mime-type: " + mimeType + " is not supported");
            }

            this.fileUrl = fileDescriptor.fileUrl;
            this._mimeType = mimeType;
            this.size = fileDescriptor._stat.size;
            this.inode = fileDescriptor._stat.node ? fileDescriptor._stat.node.ino : stat.ino;
            this._category = AssetTools.findAssetCategoryFromMimeType(mimeType);

            return this;
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

    _mimeType: {
        value: null
    },

    mimeType: {
        get: function () {
            return this._mimeType;
        }
    },

    _category: {
        value: null
    },

    category: {
        get: function () {
            return this._category;
        }
    },

    _fileUrl: {
        value: null
    },

    fileUrl: {
        set: function (fileUrl) {
            var fileData = AssetTools.defineFileDataWithUrl(fileUrl);

            if (!fileData) {
                throw new Error("Cannot set the Asset's fileUrl because the file url is not valid");
            }

            this._fileName = fileData.fileName;
            this._name = fileData.name;
            this._extension = fileData.extension;
            this._fileUrl = fileUrl;
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
            if (AssetTools.isAFile(iconUrl)) {
                this._iconUrl = iconUrl;
            }
        },
        get: function () {
            return this._iconUrl;
        }
    },

    _size: {
        value: null
    },

    size: {
        set: function (size) {
            if (size && typeof size !== "number") {
                throw new Error("Cannot set the Asset's size because the given size is not a number");
            }

            this._size = size;
        },
        get: function () {
            return this._size;
        }
    },

    _inode: {
        value: null
    },

    inode: {
        set: function (inode) {
            if (inode && typeof inode !== "number") {
                throw new Error("Cannot set the Asset's inode because the given inode is not a number");
            }

            this._inode = inode;
        },
        get: function () {
            return this._inode;
        }
    }

});
