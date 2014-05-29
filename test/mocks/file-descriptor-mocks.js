var Montage = require("montage").Montage;

exports.FileDescriptor = Montage.specialize({
    initWithUrlAndStat: {
        value: function (url, stat) {
            this.fileUrl = url;

            this._stat = stat;

            var isDirectory = url.charAt(url.length -1) === "/";

            var parts = url.split("/");
            if (isDirectory) {
                // Directories have a trailing slash, and so the last part is empty
                this.name = decodeURI(parts[parts.length - 2]);
                this.children = [];
            } else {
                this.name =  decodeURI(parts[parts.length - 1]);
            }

            return this;
        }
    }

});
