/**
    @module "ui//inner-template-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
/*global WebKitMutationObserver */

var Montage = require("montage").Montage,
    Inspector = require("contextual-inspectors/base/ui/inspector.reel").Inspector;

var Deserializer = require("montage/core/serialization").Deserializer;
var MimeTypes = require("core/mime-types");

var INSPECTOR_HEIGHT = 200;
var INSPECTOR_PADDING = 10;

// configuration of the observer:
var MUTATION_OBSERVER_CONFIG = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
};

/**
    Description TODO
    @class module:"ui//inner-template-inspector.reel".InnerTemplateInspector
    @extends module:montage/ui/component.Component
*/
exports.InnerTemplateInspector = Montage.create(Inspector, /** @lends module:"ui//inner-template-inspector.reel".InnerTemplateInspector# */ {

    didCreate: {
        value: function () {
            this.defineBinding("objectElement", {"<-": "object.element"});
        }
    },

    _innerTemplateInstancePromise: {
        value: null
    },

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

            this._object = value;
            this._instantiateInnerTemplate();
        }
    },

    _objectElement: {
        value: null
    },
    objectElement: {
        get: function() {
            return this._objectElement;
        },
        set: function(value) {
            if (this._objectElement === value) {
                return;
            }

            if (this._mutationObserver) {
                this._mutationObserver.disconnect();
                this._mutationObserver = null;
            }

            this._objectElement = value;

            if (value) {
                this._mutationObserver = new WebKitMutationObserver(this.handleMutations.bind(this));
                this._mutationObserver.observe(value, MUTATION_OBSERVER_CONFIG);
            }
        }
    },

    _mutationObserver: {
        value: null
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
            var doc = object.element.ownerDocument;
            object.innerTemplate.instantiate(doc).then(function (part) {
                part.childComponents.forEach(function (component) {
                    // set stageObject of child components?
                    self.templateObjects.innerTemplate.addChildComponent(component);
                });
                if (self.selectedObject && self.selectedObject.label in part.objects) {
                    self.selectedObject.stageObject = part.objects[self.selectedObject.label];
                }
                return part.loadComponentTree().then(function() {
                    self.part = part;
                    // Originally there was a `self.needsDraw = true` here but
                    // for some reason, I do not know why, it would cause the
                    // event manager of the frame and of our window to get
                    // mixed together, so that the delegate of the event
                    // manager in thw frame would get called for events in our
                    // window.
                });
            }).done();
        }
    },

    prepareForDraw: {
        value: function () {
            this.element.addEventListener("mousedown", this, false);

            this.templateObjects.innerTemplate.element.addEventListener("dragover", this, false);
            this.templateObjects.innerTemplate.element.addEventListener("drop", this, false);
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
            var self = this,
                // TODO: security issues?
                data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                deserializer = Deserializer.create().init(data, require);

            deserializer.deserialize().then(function (prototypeEntry) {
                self.documentEditor.addLibraryItem(prototypeEntry, self.object, self.templateObjects.innerTemplate.element).done();
            }).done();
        }
    },

    handleMutations: {
        value: function (mutations) {

            // adapted from montage/ui/component.js innerTemplate.get
            var innerTemplate,
                ownerDocumentPart,
                ownerTemplate,
                elementId,
                serialization,
                externalObjectLabels,
                ownerTemplateObjects,
                externalObjects;

            // is this the correct _ownerDocumentPart? We're kind of using a
            // hybrid of our internal template and the stage's template...
            ownerDocumentPart = this.object.stageObject._ownerDocumentPart;

            ownerTemplate = this.documentEditor.editingDocument._template;

            elementId = this.object.stageObject.getElementId();
            innerTemplate = ownerTemplate.createTemplateFromElementContents(elementId);

            serialization = innerTemplate.getSerialization();
            externalObjectLabels = serialization.getExternalObjectLabels();
            ownerTemplateObjects = ownerDocumentPart.objects;
            externalObjects = Object.create(null);

            for (var i = 0, label; (label = externalObjectLabels[i]); i++) {
                externalObjects[label] = ownerTemplateObjects[label];
            }
            innerTemplate.setInstances(externalObjects);

            this.object.stageObject.innerTemplate = innerTemplate;
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

            this._top = rect.top - INSPECTOR_HEIGHT - INSPECTOR_PADDING;
            this._left = rect.left;
            this._height = INSPECTOR_HEIGHT;
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
