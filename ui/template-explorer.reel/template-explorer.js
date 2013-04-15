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

    _zoomFactor: {
        value: 100
    },

    zoomFactor: {
        get: function () {
            return this._zoomFactor;
        },
        set: function (value) {
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
