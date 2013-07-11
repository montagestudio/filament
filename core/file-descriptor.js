/* jshint -W016 */
var Montage = require("montage").Montage;
var constants = {
    S_IFDIR: 16384,
    S_IFMT: 61440
};

exports.FileDescriptor = Montage.create(Montage, {

    initWithUrlAndStat: {
        value: function (url, stat) {
            this.fileUrl = url;

            this._stat = stat;

            var isDirectory = this.isDirectory;
            if (isDirectory && url.charAt(url.length -1) !== "/") {
                throw new Error("URLs for directories must have a trailing '/'");
            }

            var parts = url.split("/");
            // Directories have a trailing slash, and so the last part is empty
            this.name = this.isDirectory ? parts[parts.length - 2] : parts[parts.length - 1];

            return this;
        }
    },

    _stat: {
        value: null
    },

    fileUrl: {
        value: null
    },

    name: {
        value: null
    },

    isDirectory: {
        get: function () {
            return this._checkModeProperty(constants.S_IFDIR);
        }
    },

    isReel: {
        get: function () {
            return (this.isDirectory && (/\.reel$/).test(this.name));
        }
    },

    isPackage: {
        get: function () {
            return (!this.isDirectory && this.name === "package.json");
        }
    },

    isImage: {
        get: function () {
            return (!this.isDirectory && (/\.(png|jpe?g)$/).test(this.name));
        }
    },

    // more `is*` functions defined below

    associatedDocument: {
        value: null
    },

    _checkModeProperty: {
        value: function (property) {
            return ((this._stat.node.mode & constants.S_IFMT) === property);
        }
    }

});

// All of these `is*` functions just check that the FileDescriptor is a file,
// not a directory, and that the extension matches.
Object.map({
    Json: "json",
    Html: "html",
    Css: "css",
    JavaScript: "js"
}, function (extension, type) {
    var regex = new RegExp("\\." + extension + "$");
    Montage.defineProperty(exports.FileDescriptor.prototype, "is" + type, {
        get: function () {
            return (!this.isDirectory && regex.test(this.name));
        }
    });
});
