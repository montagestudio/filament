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

    acceptsInsertionDrop: {
        value: function (evt) {
            return evt.dataTransfer.types &&
                (
                    evt.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1 ||
                    evt.dataTransfer.types.indexOf(MimeTypes.HTML_ELEMENT) !== -1
                );
        }
    },

    acceptsMoveDrop: {
        value: function (evt) {
            return evt.dataTransfer.types &&
                (
                    evt.dataTransfer.types.indexOf(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) !== -1 ||
                    evt.dataTransfer.types.indexOf(MimeTypes.MONTAGE_TEMPLATE_XPATH) !== -1
                );
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsInsertionDrop(evt)) {
                evt.preventDefault();
                evt.dataTransfer.dropEffect = "copy";
            } else if (this.acceptsMoveDrop(evt)) {
                evt.preventDefault();
                evt.dataTransfer.dropEffect = "move";
            } else {
                evt.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsInsertionDrop(evt)) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        value: function (evt) {
            if (this.acceptsInsertionDrop(evt)) {
                this.isDropTarget = false;
            }
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (evt) {
            evt.stop();

            if (evt.dataTransfer.types.indexOf(MimeTypes.HTML_ELEMENT) !== -1) {
                // insert new element from html string
                var html = evt.dataTransfer.getData(MimeTypes.HTML_ELEMENT);
                this.dispatchEventNamed("insertElementAction", true, true, {
                    htmlElement: html
                });
            } else {
                // TODO: security issues?
                // insert new element from
                var data = evt.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                    transferObject = JSON.parse(data);

                this.dispatchEventNamed("insertTemplateAction", true, true, {
                    transferObject: transferObject
                });
            }
            this.isDropTarget = false;
            this.dispatchEventNamed("addelementout", true, true);
        }
    }
});