var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.BindingJig = Montage.create(Component, {

    selectedObject: {
        value: null
    },

    editingDocument: {
        value: null
    },

    //TODO we need to also be able to edit an existing binding, the API should accommodate creation or editing
    //TODO handle converters

    boundObject: {
        value: null
    },

    boundObjectPropertyPath: {
        value: null
    },

    sourceObject: {
        value: null
    },

    sourceObjectPropertyPath: {
        value: null
    },

    handleSetBoundObjectButtonAction: {
        value: function (evt) {
            if (!this.selectedObjects) {
                return;
            }

            this.boundObject = this.getPath("selectedObjects.0");
        }
    },

    handleSetSourceObjectButtonAction: {
        value: function (evt) {
            if (!this.selectedObjects) {
                return;
            }

            this.sourceObject = this.getPath("selectedObjects.0");
        }
    },

    oneWay: {
        value: false
    },

    handleDefineBindingButtonAction: {
        value: function (evt) {
            this.editingDocument.defineBinding(this.sourceObject, this.sourceObjectPropertyPath, this.boundObject, this.boundObjectPropertyPath, this.oneWay);
        }
    },
    
    
    // TODO: Proper implementation, probably as an own component
    prepareForDraw: {
        value: function() {
            
            var BindingJigContent = document.getElementById('BindingJigContent'),
                BindingJigToggle = document.getElementById('BindingJigToggle');
            
            BindingJigToggle.onclick = function() {
                BindingJigToggle.classList.toggle('selected');
                BindingJigContent.classList.toggle('show');
            }
                        
        }
    }

});
