/**
    @module "ui/document-tab.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    Url = require("core/url");

/**
    Description TODO
    @class module:"ui/document-tab.reel".DocumentTab
    @extends module:montage/ui/component.Component
*/
exports.DocumentTab = Component.specialize({

    constructor: {
        value: function DocumentTab () {
            this.super();
            this.addPathChangeListener("document.url", this, "triggerRelativePathChange");
            this.addPathChangeListener("packageUrl", this, "triggerRelativePathChange");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, false);
                this._element.addEventListener("dragend", this, false);
            }
        }
    },

    _requestDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    document: {
        value: null
    },

    nextTarget: {
        get: function () {
            if (this.document) {
                return this.document.editor;
            }
        }
    },

    packageUrl: {
        value: null
    },

    _relativePath: {
        value: null
    },

    relativePath: {
        get: function () {
            return this._relativePath;
        }
    },

    triggerRelativePathChange: {
        value: function () {
            var documentUrl = this.document ? this.document.url : null;

            this.dispatchBeforeOwnPropertyChange("relativePath", this.relativePath);
            this._relativePath = documentUrl ? documentUrl.replace(this.packageUrl, "") : null;
            this.dispatchOwnPropertyChange("relativePath", this.relativePath);
            this.needsDraw = true;
        }
    },

    handleCloseButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("closeDocument", true, true, this.document);
        }
    },

    handlePress: {
        value: function (evt) {
            this.dispatchEventNamed("openUrl", true, true, this.document.url);
        }
    },

    handleLongPress: {
        value: function (evt) {
            var parentDirectory = Url.resolve(this.document.fileUrl, "..");
            this.dispatchEventNamed("expandTree", true, true, parentDirectory);
        }
    },

    handleDragstart:{
        value: function (evt) {
            evt.dataTransfer.setData(MimeTypes.URL, this.document.url);
            evt.dataTransfer.setData(MimeTypes.TEXT_PLAIN, this.document.url);
            // TODO: soft remove tab while dragging
        }
    },

    handleDragend:{
        value: function (evt) {
            this.dispatchEventNamed("tabmoveend", true, true, this.document);
            // TODO: Remove tab OR put it back on
        }
    },

    draw: {
        value: function () {
            if (this.relativePath) {
                this.element.setAttribute("title", this.relativePath);
            } else {
                this.element.removeAttribute("title");
            }
        }
    }

});
