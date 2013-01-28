var Montage = require("montage").Montage;

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
    }

});
