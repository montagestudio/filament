/**
    @module "./template-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./template-explorer.reel".TemplateExplorer
    @extends module:montage/ui/component.Component
*/
exports.TemplateExplorer = Montage.create(Component, /** @lends module:"./template-explorer.reel".TemplateExplorer# */ {

    didCreate: {
        value: function () {
            this.addPathChangeListener("zoom", this, "scheduleDraw");
        }
    },

    templateObjectsController: {
        value: null
    },

    minZoomFactor: {
        value: 0
    },

    _zoomFactor: {
        value: 100
    },

    maxZoomFactor: {
        value: 200
    },

    zoomFactorStep: {
        value: 25
    },

    zoomFactor: {
        get: function () {
            return this._zoomFactor;
        },
        set: function (value) {

            if (value > this.maxZoomFactor) {
                value = this.maxZoomFactor;
            } else if (value < this.minZoomFactor) {
                value = this.minZoomFactor;
            }

            this._zoomFactor = value;
            this.zoom = Math.pow(2, (this._zoomFactor - 100)/50);
        }
    },

    zoom: {
        value: null
    },

    handleClearZoomFactorButtonAction: {
        value: function (evt) {
            this.zoomFactor = 100;
        }
    },

    handleDecreaseZoomFactorButtonAction: {
        value: function (evt) {
            this.zoomFactor = this.zoomFactor - this.zoomFactorStep;
        }
    },

    handleIncreaseZoomFactorButtonAction: {
        value: function (evt) {
            this.zoomFactor = this.zoomFactor + this.zoomFactorStep;
        }
    },

    scheduleDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            var z = this.zoom;
            this.schematicsElement.style.webkitTransform = "scale3d(" + [z, z, z] + ")";
        }
    }

});
