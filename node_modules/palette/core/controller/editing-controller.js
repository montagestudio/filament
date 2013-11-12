var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    Deserializer = require("montage/core/serialization").Deserializer;

/**
 * The EditingController manages altering the template backing a live component.
 * This facilify is used to update a live visual representation of a component;
 * the edits performed are not intended to be authoritative from an editing
 * standpoint. i.e. The live template should be be considered the model of what
 * is being edited.
 * @type {EditingController}
 * TODO rename this as TemplateController?
 */
exports.EditingController = Montage.create(Montage, {

    /**
     * The EditingFrame housing the template this EditingController is controlling
     */
    frame: {
        value: null
    },

    /**
     * The template being controlled by this EditingController
     */
    template: {
        value: null
    },

    /**
     * The require function that is used for locating modules within this template
     */
    ownerRequire: {
        get: function() {
            return this.template._require;
        }
    },

    /**
     * The instance of the owner component of the controlled template
     * TODO what to do if owner changes in the middle of adding a childComponent?
     * TODO should the owner be able to be changed?
     */
    owner: {
        value: null
    },

    /**
     * Adds the objects found within the sourceTemplate inside the controlled template
     * @param {Template} sourceTemplate The template detailing the objects to inject into the controlled template
     * @param {Element} stageElement The optional element to append components inside of in the template,
     * if none is provided the components are appended inside the owner's element
     * @return {Promise} A promise for the added objects
     */
    addObjectsFromTemplate: {
        value: function (sourceTemplate, stageElement) {

            var sourceContentRange,
                sourceContentFragment,
                sourceDocument = sourceTemplate.document,
                deserializer = Deserializer.create(),
                sourceSerializationString = sourceTemplate.getSerialization().getSerializationString(),
                self = this;

            stageElement = stageElement || this.owner.element;

            // Insert the expected markup into the document
            sourceContentRange = sourceDocument.createRange();
            sourceContentRange.selectNodeContents(sourceDocument.body);
            sourceContentFragment = sourceContentRange.cloneContents();
            stageElement.appendChild(sourceContentFragment);

            deserializer.init(sourceSerializationString, this.ownerRequire);
            return deserializer.deserialize(null, stageElement).then(function (objects) {
                var label,
                    object;

                for (label in objects) {
                    if (typeof objects.hasOwnProperty !== "function" || objects.hasOwnProperty(label)) {
                        object = objects[label];

                        var documentPart = self.owner._templateDocumentPart;

                        // Simulate loading a component from a template
                        if (object) {
                            if (typeof object._deserializedFromTemplate === "function") {
                                object._deserializedFromTemplate(self.owner, label, documentPart);
                            }
                            if (typeof object.deserializedFromTemplate === "function") {
                                object.deserializedFromTemplate(self.owner, label, documentPart);
                            }
                            if (typeof object.needsDraw !== "undefined") {
                                object.needsDraw = true;
                            }
                        }
                    }
                }
                return objects;
            });
        }
    },

    /**
     * Remove the specified object from the controlled template
     * @param {Object} object The object to remove from the controlled template
     * @return {Promise} A Promise for the removed object
     */
    removeObject: {
        value: function (object) {

            var element = object.element;

            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }

            //TODO well I'm sure there's more to this...
            return Promise.resolve(object);
        }
    }

});
