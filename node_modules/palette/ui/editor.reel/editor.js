/**
 @module "palette/ui/editor.reel"
 @requires montage
 @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 Description TODO
 @class module:"palette/ui/editor.reel".Editor
 @extends module:montage/ui/component.Component
 */
exports.Editor = Component.specialize(/** @lends module:"palette/ui/editor.reel".Editor# */ {

    constructor: {
        value: function Editor() {
            this.super();
        }
    },

    _currentDocument: {
        value: null
    },

    currentDocument: {
        get: function () {
            return this._currentDocument;
        }
    },

    openDocument: {
        value: Function.noop
    },

    /*
     * Load the document and register it so that it can be closed and tracked
     *
     */
    open: {
        value: function (document) {
            if (document !== this.currentDocument) {
                this.dispatchBeforeOwnPropertyChange("currentDocument", this._currentDocument);
                this._currentDocument = document;
                this.openDocument(document);
                this.dispatchOwnPropertyChange("currentDocument", document);
            } else {
                this.openDocument(document);
            }
            this.needsDraw = true;
        }
    },

    closeDocument: {
        value: function (document) {
            document.close();
        }
    },

    close: {
        value: function (document) {
            if (document === this.currentDocument) {
                this.dispatchBeforeOwnPropertyChange("currentDocument", this._currentDocument);
                this._currentDocument = null;
                this.closeDocument(document);
                this.dispatchOwnPropertyChange("currentDocument", null);
            } else {
                this.closeDocument(document);
            }
            this.needsDraw = true;
        }
    }

});
