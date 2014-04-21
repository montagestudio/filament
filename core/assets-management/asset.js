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
            this._fill(fileDescriptor);
            this.exist = true;
            this.isHidden = false;
            this.isTemplate = false;
            return this;
        }
    },

    _fill: {
        value: function (fileDescriptor) {
            var mimeType = fileDescriptor.mimeType,
                fileUrl = fileDescriptor.fileUrl;

            if (!fileDescriptor || typeof fileDescriptor !== "object") {
                throw new Error("Cannot init Asset object the parameter FileDescriptor is missing");
            }

            if (!AssetTools.isMimeTypeSupported(mimeType)) {
                throw new Error("Cannot init Asset object because the mime-type: " + mimeType + " is not supported");
            }

            if (fileUrl) {
                var fileData = AssetTools.defineFileDataWithUrl(fileUrl);

                if (!fileData) {
                    throw new Error("Cannot set the Asset's fileUrl because the file url is not valid");
                }

                this._fileName = fileData.fileName;
                this._extension = fileData.extension;

                this.dispatchBeforeOwnPropertyChange("name", this._name);
                this._name = fileData.name;
                this.dispatchOwnPropertyChange("name", fileData.name);

                this.dispatchBeforeOwnPropertyChange("fileUrl", this._fileUrl);
                this._fileUrl = fileUrl;
                this.dispatchOwnPropertyChange("fileUrl", fileUrl);
            }

            this._mimeType = mimeType;
            this._inode = fileDescriptor._stat.node ? fileDescriptor._stat.node.ino : fileDescriptor._stat.ino;
            this._category = AssetTools.findAssetCategoryFromMimeType(mimeType);
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

    /**
     * Define if an Asset is designed to create another asset from itself.
     * @public
     * @type {Boolean}
     */
    isTemplate: {
        value: null
    },

    isHidden: {
        value: null
    },

    isGlTFBundle: {
        value: function () {
            return (/\.glTF\/?$/).test(this._fileUrl);
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

    _inode: {
        value: null
    },

    inode: {
        get: function () {
            return this._inode;
        }
    },

    exist: {
        value: null
    },

    updateWithFileDescriptor: {
        value: function (fileDescriptor) {
            this._fill(fileDescriptor);
        }
    },

    toString: {
        value: function() {
            return this.fileName;
        }
    }

});
