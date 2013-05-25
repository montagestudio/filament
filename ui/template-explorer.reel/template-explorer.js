/**
    @module "./template-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    RangeController = require("montage/core/range-controller").RangeController;

/**
    Description TODO
    @class module:"./template-explorer.reel".TemplateExplorer
    @extends module:montage/ui/component.Component
*/
exports.TemplateExplorer = Montage.create(Component, /** @lends module:"./template-explorer.reel".TemplateExplorer# */ {

    constructor: {
        value: function TemplateExplorer() {
            this.super();
            this.addPathChangeListener("zoom", this, "scheduleDraw");
            this.addPathChangeListener("offsetX", this, "scheduleDraw");
            this.addPathChangeListener("offsetY", this, "scheduleDraw");

            this.templateObjectsControllerWithoutOwner = RangeController.create();
            this.templateObjectsControllerWithoutOwner.defineBinding("content", {"<-": "templateObjectsController.organizedContent.filter{label != 'owner'}", source: this});
            this.templateObjectsControllerWithoutOwner.defineBinding("selection", {"<->": "templateObjectsController.selection", source: this});
        }
    },

    editingDocument: {
        value: null
    },

    templateObjectsController: {
        value: null
    },

    templateObjectsControllerWithoutOwner: {
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
            this.zoom = Math.pow(2, (this._zoomFactor - 100)/50);
            this.dispatchOwnPropertyChange("roundedZoom", this.roundedZoom);
        }
    },

    zoom: {
        value: 1
    },

    roundedZoom: {
        get: function() {
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
        value: function() {
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
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            this._element.addEventListener("dragover", this, false);
            this._element.addEventListener("drop", this, false);
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (event.dataTransfer.types && event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (event) {
            // TODO: security issues?
            var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                transferObject = JSON.parse(data);

            this.editingDocument.addLibraryItemFragments(transferObject.serializationFragment).done();
        }
    }

});
