var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    replaceDroppedTextPlain = require("ui/drag-and-drop").replaceDroppedTextPlain,
    Promise = require("montage/core/promise").Promise;

exports.BindingJig = Montage.create(Component, {

    enterDocument: {
        value: function () {
            this.templateObjects.sourcePath.element.addEventListener("drop", this, false);
        }
    },

    editingDocument: {
        value: null
    },

    bindingModel: {
        value: null
    },

    existingBinding: {
        value: null
    },

    handleDrop: {
        value: function (event) {
            if (event.dataTransfer.types.indexOf(MimeTypes.SERIALIZATION_OBJECT_LABEL) !== -1) {
                var element = this.inputEl;
                var plain = event.dataTransfer.getData("text/plain");
                var rich = "@" + event.dataTransfer.getData(MimeTypes.SERIALIZATION_OBJECT_LABEL);
                replaceDroppedTextPlain(plain, rich, this.templateObjects.sourcePath.element);
            }
        }
    },

    handleDefineBindingButtonAction: {
        value: function (evt) {
            evt.stop();
            var model = this.bindingModel,
                proxy = model.targetObject,
                targetPath = model.targetPath,
                oneway = model.oneway,
                sourcePath = model.sourcePath;

            if (this.existingBinding) {
                this.editingDocument.updateOwnedObjectBinding(proxy, this.existingBinding, targetPath, oneway, sourcePath);
            } else {
                this.editingDocument.defineOwnedObjectBinding(proxy, targetPath, oneway, sourcePath);
            }
            this.existingBinding = null;
            this.bindingModel = null;
             //TODO close the jig
        }
    },

    handleCancelButtonAction: {
        value: function (evt) {
            evt.stop();
            this.bindingModel = null;
            //TODO close the jig
        }
    }

});
