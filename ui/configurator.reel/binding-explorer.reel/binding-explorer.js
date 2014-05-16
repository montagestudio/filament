/**
 * @module ./binding-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    ObjectLabelConverter = require("core/object-label-converter").ObjectLabelConverter,
    MimeTypes = require("core/mime-types");


/**
 * @class BindingsExplorer
 * @extends Component
 */
exports.BindingExplorer = Component.specialize( /** @lends BindingsExplorer# */ {
    constructor: {
        value: function BindingExplorer() {
            this.super();
            this.defineBinding("_blueprintsMap", {
                "<-": "objectBlueprint.propertyBlueprints.map{[name, this]}.toMap()"
            });
            this.defineBinding("bindings", {
                "<-": "templateObject.bindings.filter{!^_blueprintsMap.get(targetPath).defined()}",
                source: this
            });
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (!firstTime) {
                return;
            }
            this.defineBinding("classList.has('AddElement--dropTarget')", {"<-": "isDropTarget"});

            var element = this.element;
            element.addEventListener("dragover", this, false);
            element.addEventListener("dragenter", this, false);
            element.addEventListener("dragleave", this, false);
            element.addEventListener("drop", this, false);

        }
    },

    isDropTarget: {
        value: false
    },

    objectBlueprint: {
        value: null
    },

    _templateObject: {
        value: null
    },
    templateObject: {
        get: function () {
            return this._templateObject;
        },
        set: function (value) {
            if (value === this._templateObject) {
                return;
            }

            var self = this;
            this._templateObject = value;
            this.objectBlueprint = null;
            if (value) {
                value.proxyBlueprint.then(function (blueprint) {
                    // Check if the inspected object is still the same.
                    if (self._templateObject === value) {
                        self.objectBlueprint = blueprint;
                    }
                }).done();
            }

            this.needsDraw = true;
        }
    },

    acceptsDrop: {
        value: function(event) {
            var availableTypes = event.dataTransfer.types,
                uuid = this._getMontageUUID(availableTypes);

            if (!availableTypes || !availableTypes.has(MimeTypes.MONTAGE_BINDING)) {
                return false;
            }
            return !(uuid && (uuid  === this.templateObject.uuid));
        }
    },

    acceptsBindingCopy: {
        value: function(event) {
            var addButton = this.element.querySelector("[data-montage-id=addButton]");

            return event.dataTransfer.types && event.dataTransfer.types.has(MimeTypes.MONTAGE_BINDING) && event.target === addButton;
        }
    },

    _getMontageUUID: {
        value: function (types) {
            if (!types) {
                return false;
            }
            var uuid = false;
            types.forEach(function (type, i) {
                if (type.startsWith("x-montage-uuid")) {
                    uuid = type.split("/")[1].toUpperCase();
                }
            });
            return uuid;
        }
    },

    handleDragover: {
        enumerable: false,
        value: function(event) {
            if (this.acceptsDrop(event)) {
                event.stop();

                if (this.acceptsBindingCopy(event)) {
                    event.dataTransfer.dropEffect = "copy";
                } else {
                    event.dataTransfer.dropEffect = "move";
                }
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function(event) {
            if (this.acceptsDrop(event)) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        enumerable: false,
        value: function(event) {
            this.isDropTarget = false;
            event.dataTransfer.dropEffect = "none";
        }
    },

    handleDrop: {
        enumerable: false,
        value: function(event) {
            if (!this.acceptsDrop(event)) {
                return;
            }
            var data = event.dataTransfer.getData(MimeTypes.MONTAGE_BINDING),
                targetObject = this.ownerComponent.templateObject,
                // TODO: security issues?
                transferObject = JSON.parse(data),
                editingDocument = this.ownerComponent.ownerComponent.editingDocument,
                self = this,
                objectLabelConverter = new ObjectLabelConverter(),
                converter;

            objectLabelConverter.editingDocument = editingDocument;
            if (transferObject.converterLabel) {
                converter = objectLabelConverter.revert(transferObject.converterLabel);
            }

            var move = !self.acceptsBindingCopy(event);
            if (move) {
                editingDocument.undoManager.openBatch("Move Binding");
            }

            editingDocument.defineOwnedObjectBinding(targetObject, transferObject.targetPath, transferObject.oneway, transferObject.sourcePath, converter);
            // TODO when bindings return promises, move this into the then to create a transactional-like undo
            if (move && transferObject.movedBindingIndex !== undefined && transferObject.movedBindingIndex > -1) {
                var fromTargetObject = objectLabelConverter.revert(transferObject.targeObjectLabel);
                if (fromTargetObject && fromTargetObject.bindings && fromTargetObject.bindings.length > transferObject.movedBindingIndex) {
                    var binding = fromTargetObject.bindings[transferObject.movedBindingIndex];
                    editingDocument.cancelOwnedObjectBinding(fromTargetObject, binding);
                }
            }

            if (move) {
                editingDocument.undoManager.closeBatch();
            }

            self.isDropTarget = false;
        }
    }
});