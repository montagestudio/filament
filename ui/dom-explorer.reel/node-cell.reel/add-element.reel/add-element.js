/**
 * @module ui/add-element.reel
 * @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class AddElement
 * @extends module:montage/ui/component.Component
 */
exports.AddElement = Montage.create(Component, /** @lends AddElement# */ {

    type: {
        value: null
    },

    isDropTarget: {
        value: false
    },

    prepareForActivationEvents: {
        value: function () {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            this.super(firstTime);

            if (!firstTime) { return; }
            this.defineBinding("classList.has('AddElement--dropTarget')", {"<-": "isDropTarget"});

            var element = this.element.querySelector("div.AddElement-segment");
            element.addEventListener("dragover", this, false);
            element.addEventListener("dragenter", this, false);
            element.addEventListener("dragleave", this, false);
            element.addEventListener("drop", this, false);
        }
    },

    acceptsDrop: {
        value: function (evt) {
            return evt.dataTransfer.types &&
                (
                    evt.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1 ||
                    evt.dataTransfer.types.indexOf(MimeTypes.HTML_ELEMENT) !== -1
                );
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsDrop(evt)) {
                evt.preventDefault();
                evt.dataTransfer.dropEffect = "copy";
            } else {
                evt.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsDrop(evt)) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        value: function (evt) {
            if (this.acceptsDrop(evt)) {
                this.isDropTarget = false;
            }
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (evt) {
            evt.stop();

            if (evt.dataTransfer.types.indexOf(MimeTypes.HTML_ELEMENT) !== -1) {
                var html = evt.dataTransfer.getData(MimeTypes.HTML_ELEMENT);
                this.dispatchEventNamed("insertElementAction", true, true, {
                    htmlElement: html
                });
            } else {
                // TODO: security issues?
                var data = evt.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                    transferObject = JSON.parse(data);

                this.dispatchEventNamed("insertTemplateAction", true, true, {
                    transferObject: transferObject
                });
            }
            this.isDropTarget = false;
        }
    }
});