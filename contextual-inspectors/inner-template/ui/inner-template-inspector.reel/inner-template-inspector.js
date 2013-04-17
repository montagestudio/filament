/**
    @module "ui//inner-template-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/

var Montage = require("montage").Montage,
    Inspector = require("contextual-inspectors/base/ui/inspector.reel").Inspector,
    Promise = require("montage/core/promise").Promise;

var Template = require("montage/core/template").Template;
var MimeTypes = require("core/mime-types");

/**
    Description TODO
    @class module:"ui//inner-template-inspector.reel".InnerTemplateInspector
    @extends module:montage/ui/component.Component
*/
exports.InnerTemplateInspector = Montage.create(Inspector, /** @lends module:"ui//inner-template-inspector.reel".InnerTemplateInspector# */ {

    _object: {
        value: null
    },
    object: {
        get: function() {
            return this._object;
        },
        set: function(value) {
            if (this._object === value) {
                return;
            }

            if (this._object) {
                this._object.properties.removeMapChangeListener(this, "object");
                this._object.bindings.removeRangeChangeListener(this, "object");
            }
            this._object = value;
            if (value) {
                this._instantiateInnerTemplate();
                value.properties.addMapChangeListener(this, "object");
                value.bindings.addRangeChangeListener(this, "object");
            }
        }
    },

    _selectedObject: {
        value: null
    },
    selectedObject: {
        get: function() {
            return this._selectedObject;
        },
        set: function(value) {
            if (this._selectedObject === value) {
                return;
            }

            if (this._selectedObject) {
                this._selectedObject.properties.removeMapChangeListener(this, "object");
                this._selectedObject.bindings.removeRangeChangeListener(this, "object");
            }
            this._selectedObject = value;
            if (value) {
                value.properties.addMapChangeListener(this, "object");
                value.bindings.addRangeChangeListener(this, "object");
                this.documentEditor.editingDocument.addEventListener("objectRemoved", this, false);
            }
        }
    },

    showForChildComponents: {
        value: true
    },

    _instantiateInnerTemplate: {
        value: function () {
            if (!this.templateObjects || !this._object) {
                return;
            }

            var self = this;
            var object = this._object.stageObject;

            // Convert the inner template to use the Application Window object
            var innerTemplate = Template.clone.call(object.innerTemplate);
            // Use the package require that has a reference to the application
            // window
            innerTemplate._require = this.documentEditor.editingDocument.packageRequire;

            innerTemplate.instantiate(document).then(function (part) {
                part.childComponents.forEach(function (component) {
                    self.templateObjects.innerTemplate.addChildComponent(component);
                });
                if (self.selectedObject && self.selectedObject.label in part.objects) {
                    self.selectedObject.stageObject = part.objects[self.selectedObject.label];
                }
                return part.loadComponentTree().then(function() {
                    self.part = part;
                    self.needsDraw = true;
                });
            }).done();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.addEventListener("mousedown", this, false);

                this.templateObjects.innerTemplate.element.addEventListener("dragover", this, false);
                this.templateObjects.innerTemplate.element.addEventListener("drop", this, false);
            }
        }
    },

    handleMousedown: {
        value: function (event) {
            var selectionCandidate = event.target;

            this.dispatchEventNamed("select", true, true, {
                candidate: selectionCandidate,
                addToSelection: false,
                expandToSelection: false,
                removeFromSelection: false,
                retractFromSelection: false
            });
        }
    },

    handleDragover: {
        value: function (event) {
            if (event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDrop: {
        value: function (event) {
            var self = this;
            var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                transferObject = JSON.parse(data);

            this.documentEditor.editingDocument.addLibraryItemFragments(
                transferObject.serializationFragment,
                transferObject.htmlFragment,
                self.object,
                self.templateObjects.innerTemplate.element
            )
            .then(function () {
                return self.updateInnerTemplate();
            })
            .done();
        }
    },

    handleObjectMapChange: {
        value: function () {
            // need to wait until the next tick so that the serialization
            // can be rebuilt
            var self = this;
            Promise.nextTick(function () {
                self.updateInnerTemplate();
            });
        }
    },

    handleObjectRangeChange: {
        value: function () {
            // need to wait until the next tick so that the serialization
            // can be rebuilt
            var self = this;
            Promise.nextTick(function () {
                self.updateInnerTemplate();
            });
        }
    },

    handleObjectRemoved: {
        value: function (event) {
            if (event.detail.proxy === this._selectedObject) {
                // need to wait until the next tick so that the serialization
                // can be rebuilt
                var self = this;
                Promise.nextTick(function () {
                    self.updateInnerTemplate();
                });
            }
        }
    },

    updateInnerTemplate: {
        value: function () {
            var self = this;
            // Make sure we don't try to update the inner template when an
            // update is already in progress.
            // Queue up another call to this function when the previous update
            // has completed.
            if (this._templateInitPromise) {
                if (!this._queuedUpdate) {
                    this._queuedUpdate = true;
                    this._templateInitPromise.then(function () {
                        self._queuedUpdate = false;
                        self.updateInnerTemplate();
                    });
                }
                return;
            }

            // adapted from montage/ui/component.js innerTemplate.get
            var ownerDocumentPart,
                ownerTemplate,
                elementId,
                serialization,
                externalObjectLabels,
                ownerTemplateObjects,
                externalObjects;

            var oldObject = this.object.stageObject;

            var ownerDocument = oldObject.element.ownerDocument;
            ownerDocumentPart = oldObject._ownerDocumentPart;
            ownerTemplate = this.documentEditor.editingDocument._template;

            elementId = oldObject.getElementId();

            // SLIGHT HACK:
            // We need a new template with the Template prototype from the
            // stage so that it uses the stage Window object.
            // Originally this was doing a .call on ownerDocumentPart.template.createTemplateFromElement
            // however this can breaks in a hard to detect way if that method
            // calls another method, because it will use the prototype of the
            // this, the incorrect prototype.
            // Hence it is safer to swap out the __proto__.
            // NOTE: taking the __proto__ directly off of ownerDocumentPart.template
            // is also slightly dangerous because it might not be the Template
            // object, and instead an instance prototype. However this is
            // a) still safer than the .call method, and
            // b) unlikely that the instance proto is going to override any
            //    of the 'static-ish' methods that we are using.
            //jshint -W103, -W106
            var oldProto = ownerTemplate.__proto__;
            ownerTemplate.__proto__ = ownerDocumentPart.template.__proto__;
            var outerTemplate = ownerTemplate.createTemplateFromElement(elementId);
            ownerTemplate.__proto__ = oldProto;
            //jshint +W103, +W106

            // ownerTemplate._templateFromElementContentsCache = void 0;
            // Also need to make sure we're using the Stage require
            outerTemplate._require = ownerDocumentPart.template._require;

            serialization = outerTemplate.getSerialization();
            externalObjectLabels = serialization.getExternalObjectLabels();
            ownerTemplateObjects = ownerDocumentPart.objects;
            externalObjects = Object.create(null);

            for (var i = 0, label; (label = externalObjectLabels[i]); i++) {
                externalObjects[label] = ownerTemplateObjects[label];
            }
            outerTemplate.setInstances(externalObjects);

            this._templateInitPromise = outerTemplate.instantiate(ownerDocument).then(function (part) {
                if (!oldObject.element.parentNode) {
                    console.warn("Stage object does not have a parent, aborting inner template update");
                    return;
                }

                oldObject.detachFromParentComponent();

                var ownerObjects = oldObject.ownerComponent._templateDocumentPart.objects;
                var newObjects = part.objects;
                var newObject = newObjects[self.object.label];

                // Add new instances to the owner objects
                for (var newObjectLabel in newObjects) {
                    if (!(newObjectLabel in ownerObjects) || newObjectLabel === self.object.label) {
                        ownerObjects[newObjectLabel] = newObjects[newObjectLabel];
                    }
                }

                // Replace the existing element with the newly instantiated one
                oldObject.element.parentNode.replaceChild(newObject.element, oldObject.element);
                newObject.attachToParentComponent();

                self.object.stageObject = newObject;

                return newObject.loadComponentTree();
            }).then(function () {
                self._templateInitPromise = null;
            });
            this._templateInitPromise.done();
        }
    },

    templateDidLoad: {
        value: function () {
            this._instantiateInnerTemplate();
        }
    },

    willDraw: {
        value: function() {
            if (!(this.object.stageObject && this.object.stageObject.element)) {
                this._top = this._left = this._height = this._width = 0;
                return;
            }

            var object = this.object.stageObject,
                el = "element" in object ? object.element : object;

            var rect = this._getBounds(el);

            this._top = rect.top;
            this._left = rect.left;
            this._width = rect.right - rect.left;
        }
    },

    draw: {
        value: function() {
            this._element.style.position = "absolute";
            this._element.style.top = this._top + "px";
            this._element.style.left = this._left + "px";
            this._element.style.height = this._height + "px";
            this._element.style.width = this._width + "px";

            if (this.part) {
                var part = this.part;
                this.templateObjects.innerTemplate.element.appendChild(part.fragment);
            }
        }
    }

});
