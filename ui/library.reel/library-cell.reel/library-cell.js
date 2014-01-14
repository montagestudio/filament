/**
    @module "ui/library-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
    Description TODO
    @class module:"ui/library-cell.reel".LibraryCell
    @extends module:montage/ui/component.Component
*/
exports.LibraryCell = Montage.create(Component, /** @lends module:"ui/library-cell.reel".LibraryCell# */ {

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, true);
                this._element.addEventListener("dragend", this, false);
                this._element.addEventListener("mouseover", this, true);
            }
        }
    },

    icon: {
        value: null
    },

    prototypeObject: {
        value: null
    },

    captureMouseover: {
        value: function () {
            var libraryItem = this.prototypeObject;

            if (!libraryItem.templateContent && libraryItem.require) {
                libraryItem.require.async(libraryItem.templateModuleId).then(function (result) {
                    libraryItem.templateContent = result.content;
                }).done();
            }
        }
    },

    captureDragstart: {
        value: function (event) {
            if (!this.prototypeObject.templateContent) {
                return;
            }

            event.dataTransfer.effectAllowed = "copyMove";

            var templateContent = this.prototypeObject.templateContent,
                doc,
                serializationElement,
                serializationFragment;

            if (1 === this.prototypeObject.moduleIds.length) {
                doc = document.implementation.createHTMLDocument("");
                doc.documentElement.innerHTML = templateContent;

                serializationElement = doc.querySelector("script[type='text/montage-serialization']");
                if (serializationElement && (serializationFragment = serializationElement.textContent)) {
                    event.dataTransfer.setData(MimeTypes.SERIALIZATION_FRAGMENT, serializationFragment);
                }
            }

            event.dataTransfer.setData(MimeTypes.TEMPLATE, templateContent);
            event.dataTransfer.setData(MimeTypes.TEXT_PLAIN, templateContent);

            var iconElement = this.icon.element;
            event.dataTransfer.setDragImage(
                iconElement,
                iconElement.width / 2,
                iconElement.height / 2
            );
        }
    },

    handleDragend: {
        value: function (evt) {
            this.dispatchEventNamed("templateObjectDragend", true);
        }
    },

    handlePrototypeButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addComponent", true, true, {
                prototypeObject: this.prototypeObject
            });
        }
    }

});
