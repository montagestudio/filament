/**
    @module "ui//inner-template-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
/*global WebKitMutationObserver */

var Montage = require("montage").Montage,
    Inspector = require("contextual-inspectors/base/ui/inspector.reel").Inspector,
    Promise = require("montage/core/promise").Promise;

var Template = require("montage/core/template").Template;
var MimeTypes = require("core/mime-types");

var INSPECTOR_HEIGHT = 200;
var INSPECTOR_PADDING = 16;

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
            if (value) {
                this._instantiateInnerTemplate();
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
                this._object.properties.removeMapChangeListener(this, "objectProperties");
            }
            this._selectedObject = value;
            if (value) {
                this._selectedObject.properties.addMapChangeListener(this, "objectProperties");
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

            // Convert the inner template to use the Application require
            var innerTemplate = Template.clone.call(object.innerTemplate);
            innerTemplate._require = require;

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

    handleObjectPropertiesMapChange: {
        value: function () {
            console.log("handleObjectPropertiesMapChange");
            var self = this;
            // need to wait until the next tick so that the serialization
            // can be rebuilt
            Promise.nextTick(function () {
                self.updateInnerTemplate();
            });
        }
    },

    updateInnerTemplate: {
        value: function () {

            // START HACK //
            // Avoid bug where setting innerTemplate multiple times in
            // one draw cycle causes the repetition to break
            if (this._waitingForObjectDraw) {
                // if this function is called while we're waiting for a draw
                // wait until after the draw to trigger it again
                this._needsUpdateInnerTemplate = true;
                return;
            }
            this._waitingForObjectDraw = true;
            var self = this;
            var oldDraw = this.object.stageObject.draw;
            this.object.stageObject.draw = function () {
                self._waitingForObjectDraw = false;
                // replace original draw
                self.object.stageObject.draw = oldDraw;
                oldDraw.apply(this, arguments);
                // now the draw is happened we can update the inner template
                // again
                if (self._needsUpdateInnerTemplate) {
                    self.updateInnerTemplate();
                }
            };
            this._needsUpdateInnerTemplate = false;
            // END HACK //


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

            // Use the Template from the stage, so that it uses the Stage
            // Window object. Note: we're using the Template prototype, not
            // the instance.
            ownerTemplate.clearTemplateFromElementContentsCache();
            innerTemplate = ownerDocumentPart.template.createTemplateFromElementContents.call(ownerTemplate, elementId);
            // ownerTemplate._templateFromElementContentsCache = void 0;
            // Also need to make sure we're using the Stage require
            innerTemplate._require = ownerDocumentPart.template._require;

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
