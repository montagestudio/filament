/**
 @module "./schematics-container.reel"
 @requires montage
 @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
 Description TODO
 @class module:"./schematics-container.reel".SchematicsContainer
 @extends module:montage/ui/component.Component
 */
exports.SchematicsContainer = Montage.create(Component, /** @lends module:"./schematics-container.reel".SchematicsContainer# */ {

    didCreate: {
        value: function () {
            this.addPathChangeListener("zoom", this, "scheduleDraw");
            this.addPathChangeListener("offsetX", this, "scheduleDraw");
            this.addPathChangeListener("offsetY", this, "scheduleDraw");
        }
    },

    /*
     * Document being edited. Used to display errors
     */
    editingDocument: {
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
            this.dispatchBeforeOwnPropertyChange("roundedZoom", this.roundedZoom);
            this.zoom = Math.pow(2, (this._zoomFactor - 100) / 50);
            this.dispatchOwnPropertyChange("roundedZoom", this.roundedZoom);
        }
    },

    zoom: {
        value: 1
    },

    roundedZoom: {
        get: function () {
            return this.zoom.toFixed(2);
        }
    },

    offsetX: {
        value: 0
    },

    offsetY: {
        value: 0
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

    schematicsElement: {
        value: null
    },

    draw: {
        value: function () {
            var z = this.zoom;
            this.schematicsElement.style.webkitTransform = "scale3d(" + [z, z, z] + ") translate(" + this.offsetX + "px ," + this.offsetY + "px)";
        }
    },

    shouldStartPanning: {
        value: false
    },

    isPanning: {
        value: false
    },

    handleKeyPress: {
        value: function (evt) {
            if ("panningKeyComposer" === evt.identifier && !this.shouldStartPanning) {
                this.shouldStartPanning = true;
            }
        }
    },

    handleKeyRelease: {
        value: function (evt) {
            if ("panningKeyComposer" === evt.identifier && this.shouldStartPanning) {
                this.shouldStartPanning = false;
            }
        }
    },

    handleTranslateStart: {
        value: function (evt) {
            if (this.shouldStartPanning) {
                this.isPanning = true;
                this.templateObjects.panningComposer.translateX = this.offsetX;
                this.templateObjects.panningComposer.translateY = this.offsetY;
            }
        }
    },

    handleTranslateEnd: {
        value: function () {
            if (this.isPanning) {
                this.isPanning = false;
            }
        }
    },

    handleTranslate: {
        value: function (evt) {
            if (this.isPanning) {
                this.offsetX = evt.translateX;
                this.offsetY = evt.translateY;
            }
        }
    }

});
