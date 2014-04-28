var Component = require("montage/ui/component").Component;

exports.PreviewControlPanel = Component.specialize({

    constructor: {
        value: function PreviewControlPanel () {
            this.super();
        }
    },

    previewController: {
        value: null
    }

});
