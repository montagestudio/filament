var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.BindingJig = Montage.create(Component, {

    editingDocument: {
        value: null
    },

    bindingModel: {
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

            this.editingDocument.defineOwnedObjectBinding(proxy, targetPath, oneway, sourcePath);
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
