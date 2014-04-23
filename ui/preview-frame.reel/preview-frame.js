var Component = require("montage/ui/component").Component;

exports.PreviewFrame = Component.specialize({

    constructor: {
        value: function PreviewFrame () {
            this.super();
        }
    },

    frameElement: {
        value: null
    },

    _previewUrl: {
        value: null
    },

    previewUrl: {
        get: function () {
            return this._previewUrl;
        },
        set: function (value) {
            if (value === this._previewUrl) {
                return;
            }

            this._previewUrl = value;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            var frameElement = this.frameElement,
                previewUrl = this.previewUrl;

            if (frameElement) {
                if (!previewUrl) {
                    frameElement.src = "";
                } else if (frameElement.src !== previewUrl) {
                    frameElement.src = previewUrl;
                }
            }
        }
    }

});
