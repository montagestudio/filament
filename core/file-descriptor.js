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
            // TODO improve name detection
            this.name = url.substring(url.lastIndexOf("/") + 1);

            //TODO have accessors for hidden directory, children etc.

            this._stat = stat;

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

    _checkModeProperty: {
        value: function (property) {
            return ((this._stat.node.mode & constants.S_IFMT) === property);
        }
    }

});
