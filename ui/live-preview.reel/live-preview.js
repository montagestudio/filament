/**
 * @module ui/live-preview.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class LivePreview
 * @extends Component
 */
exports.LivePreview = Component.specialize(/** @lends LivePreview# */ {

    iframe: {
        value: null
    },

    frameContainer: {
        value: null
    },

    _previewSizeId: {
        get: function () {
            return this.__previewSizeId;
        },
        set: function (id) {
            this.__previewSizeId = id;
            if (id == "1") {
                this._resizeFrame("100%", "100%");
            } else if (id == "2") {
                this._resizeFrame("650px", "450px");
            } else if (id == "3") {
                this._resizeFrame("250px", "500px");
            }
        }
    },

    _resizeFrame: {
        value: function (width, height) {
            var frameStyle = this.frameContainer.style;
                frameStyle.left = "calc(50% - " + parseFloat(width)/2 + width.replace(/\d+/, "") + ")";
                frameStyle.width = String(width);
                frameStyle.top = "calc(50% - " + parseFloat(height)/2 + height.replace(/\d+/, "") + ")";
                frameStyle.height = String(height);
        }
    },

    previewUrl: {
        get: function () {
            if (this.previewController) {
                return this.previewController.previewUrl;
            }
            return "";
        }
    },

    enterDocument: {
        value: function () {
            var self = this;

            this.addPathChangeListener("previewController.previewUrl", function () {
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
            });
            this.addOwnPropertyChangeListener("previewUrl", function (url) {
                if (url) {
                    self.iframe.src = url;
                }
            });

            this._previewSizeId = "1";
        }
    },

    // Event listeners

    handleRefreshButtonAction: {
        value: function () {
            this.iframe.src = "";
            this.iframe.src = this.previewUrl;
        }
    },

    handleNewTabButtonAction: {
        value: function (event) {
            // stop the browser from following the link
            event.preventDefault();

            var url = this.previewUrl;
            setTimeout(function() {
                this.projectController.environmentBridge.openHttpUrl(url).done();
                this.optionPressed = false;
                this.needsDraw = true;
            }.bind(this), 1);
        }
    }
});
