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
            var types = evt.dataTransfer.types;
            return types &&
                (
                    types.has(MimeTypes.TEMPLATE) ||
                    types.has(MimeTypes.TEXT_PLAIN) ||
                    types.has(MimeTypes.JSON_NODE)
                );
        }
    },

    acceptsMoveDrop: {
        value: function (evt) {
            var types = evt.dataTransfer.types;
            return types &&
                (
                    types.indexOf(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) !== -1 ||
                    types.indexOf(MimeTypes.MONTAGE_TEMPLATE_XPATH) !== -1
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
                evt.dataTransfer.dropEffect = "copy";
            } else {
                evt.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsInsertionDrop(evt) || this.acceptsMoveDrop(evt)) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        value: function (evt) {
            if (this.acceptsInsertionDrop(evt) || this.acceptsMoveDrop(evt)) {
                this.isDropTarget = false;
            }
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (evt) {
            var dataTransfer = evt.dataTransfer,
                types = dataTransfer.types;
            evt.stop();

            if (types.indexOf(MimeTypes.JSON_NODE) !== -1) {
                // insert new element from json
                var node = JSON.parse(dataTransfer.getData(MimeTypes.JSON_NODE));

                this.dispatchEventNamed("insertElementAction", true, true, {
                    jsonNode: node
                });
            } else if (types.has(MimeTypes.TEMPLATE)) {
                // insert new element from prototype
                var data = dataTransfer.getData(MimeTypes.TEMPLATE);

                this.dispatchEventNamed("insertTemplateAction", true, true, {
                    template: data
                });
            } else if (types.has(MimeTypes.TEXT_PLAIN)) {
                // insert new element from prototype (possibly html fragment)
                var textData = dataTransfer.getData(MimeTypes.TEXT_PLAIN);

                //TODO for now we're treating this the same as template, need to consider when/where we inspect the text data
                this.dispatchEventNamed("insertTemplateAction", true, true, {
                    template: textData
                });
            } else if (types.indexOf(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) !== -1) {
                // move a component
                var montageId = dataTransfer.getData(MimeTypes.MONTAGE_TEMPLATE_ELEMENT);
                this.dispatchEventNamed("moveTemplate", true, true, {
                    montageId: montageId
                });
            } else if (types.indexOf(MimeTypes.MONTAGE_TEMPLATE_XPATH) !== -1) {
                // move an HTML node
                var xpath = dataTransfer.getData(MimeTypes.MONTAGE_TEMPLATE_XPATH);
                this.dispatchEventNamed("moveTemplate", true, true, {
                    xpath: xpath
                });
            }
            this.isDropTarget = false;
            this.dispatchEventNamed("addelementout", true, true);
        }
    }
});
