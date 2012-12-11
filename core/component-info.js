var Montage = require("montage").Montage;

exports.ComponentInfo = Montage.create(Montage, {

    initWithUrl: {
        value: function (url) {
            this.reelUrl = url;
            this.title = this.reelUrl.substring(this.reelUrl.lastIndexOf("/") + 1);

            return this;
        }
    },

    reelUrl: {
        value: null
    },

    title: {
        value: null
    }

});
