/**
    @module "ui/template-object-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    MimeTypes = require("core/mime-types");

var CLASS_PREFIX = "TemplateObjectCell";

/**
    Description TODO
    @class module:"ui/template-object-cell.reel".TemplateObjectCell
    @extends module:montage/ui/component.Component
*/
exports.TemplateObjectCell = Montage.create(Component, /** @lends module:"ui/template-object-cell.reel".TemplateObjectCell# */ {

    constructor: {
        value: function TemplateObjectCell() {
            this.super();
            this.addPathChangeListener("x", this, "scheduleDraw");
            this.addPathChangeListener("y", this, "scheduleDraw");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            var icon = this.templateObjects.icon.element;
            icon.addEventListener("dragstart", this, false);
            icon.addEventListener("mousedown", this, false);
            icon.addEventListener("dragend", this, false);

            this._templateObjectTagEl.addEventListener("dragover", this, false);
            this._templateObjectTagEl.addEventListener("drop", this, false);
        }
    },

    _templateObject: {
        value: null
    },
    templateObject: {
        get: function() {
            return this._templateObject;
        },
        set: function(value) {
            if (this._templateObject === value) {
                return;
            }
            this._templateObject = value;
            if (value) {
                var self = this;
                value.editingDocument.packageRequire.async(value.moduleId)
                .get(value.exportName)
                .then(function (object) {
                    self.hasElementProperty = !!Object.getPropertyDescriptor(object, "element");
                }).fail(Function.noop);
            }

        }
    },

    hasElementProperty: {
        value: true
    },

    x: {
        value: null
    },

    y: {
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

    handleTranslateStart: {
        value: function (evt) {
            this.templateObjects.translateComposer.translateX = this.x;
            this.templateObjects.translateComposer.translateY = this.y;
            this.classList.add(CLASS_PREFIX + "--dragging");
        }
    },

    handleTranslateEnd: {
        value: function() {
            this.classList.remove(CLASS_PREFIX + "--dragging");
        }
    },

    handleTranslate: {
        value: function (evt) {
            this.x = evt.translateX;
            this.y = evt.translateY;
        }
    },

    handleDragover: {
        value: function (event) {
            var element = this.templateObject.properties.get("element");

            if (event.dataTransfer.types &&
                event.dataTransfer.types.indexOf(MimeTypes.MONTAGE_TEMPLATE_ELEMENT) !== -1 &&
                (!element || !element.isInTemplate)
            ) {
                // allows us to drop
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "link";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },
    handleDrop: {
        value: function (event) {
            event.stopPropagation();
            var montageId = event.dataTransfer.getData(MimeTypes.MONTAGE_TEMPLATE_ELEMENT);

            var templateObject = this.templateObject;
            var editingDocument = templateObject.editingDocument;
            var element = editingDocument.nodeProxyForMontageId(montageId);

            if (!element) {
                throw new Error("Dropped montageId, " + montageId + " not found in templateNodes");
            }

            editingDocument.undoManager.register("Change element", Promise.resolve([
                this.setElement, this, templateObject.properties.get("element")
            ]));
            this.setElement(element);
        }
    },

    setElement: {
        value: function (element) {
            this.templateObject.properties.set("element", element);
        }
    },

    draw: {
        value: function () {
            var x = this.x ? this.x : 0,
                y = this.y ? this.y : 0;

            this.element.style.webkitTransform = "translate3d(" + x + "px," + y + "px, 0)";
        }
    },

    handlePress: {
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
    }

});
