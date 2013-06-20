var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.OwnerCell = Montage.create(Component, {

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            var icon = this.templateObjects.icon.element;
            icon.addEventListener("dragstart", this, false);
            icon.addEventListener("mousedown", this, false);
            icon.addEventListener("dragend", this, false);
        }
    },

    templateObject: {
        value: null
    },

    scheduleDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleMousedown: {
        value: function () {
            this.eventManager.claimPointer("mouse", this);
        }
    },

    surrenderPointer: {
        value: function (pointer, component) {
            return false;
        }
    },

    handleDragstart: {
        value: function (evt) {
            event.dataTransfer.setData("text/plain", "@" + this.templateObject.label);
        }
    },

    handleDragend: {
        value: function () {
            this.eventManager.forfeitAllPointers(this);
        }
    },

    handleBindButtonAction: {
        value: function(event) {
            var bindingModel = Object.create(null);
            bindingModel.targetObject = this.templateObject;
            bindingModel.targetPath = "";
            bindingModel.oneway = true;
            bindingModel.sourcePath = "";

            this.dispatchEventNamed("editBindingForObject", true, false, {
                bindingModel: bindingModel
            });
        }
    },

    handleListenButtonAction: {
        value: function(event) {
            var listenerModel = Object.create(null);
            listenerModel.targetObject = this.templateObject;

            this.dispatchEventNamed("addListenerForObject", true, false, {
                listenerModel: listenerModel
            });
        }
    },

    handlePress: {
        value: function () {
            this.dispatchEventNamed("select", true, true, {
                templateObject: this.templateObject
            });
        }
    }

});
