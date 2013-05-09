var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.BindingJig = Montage.create(Component, {

    editingDocument: {
        value: null
    },

    bindingModel: {
        value: null
    },

    existingBinding: {
        value: null
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
