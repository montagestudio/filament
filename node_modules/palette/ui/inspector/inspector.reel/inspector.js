/**
    @module "ui/inspector/inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise;

/**
    Description TODO
    @class module:"ui/inspector/inspector.reel".Inspector
    @extends module:montage/ui/component.Component
*/
exports.Inspector = Component.specialize( /** @lends module:"ui/inspector/inspector.reel".Inspector# */ {

    constructor: {
        value: function Inspector() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    _object: {
        value: null
    },
    object: {
        get: function () {
            return this._object;
        },
        set: function (value) {
            if (value === this._object) {
                return;
            }

            if (this._blueprintDeferred && !this._blueprintDeferred.promise.isFulfilled()) {
                this._blueprintDeferred.reject(new Error("Inspected Object changed before blueprint was resolved"));
            }

            this._object = value;

            this.needsDraw = true;

            if (this._object && this._object.moduleId && (this._object.moduleId !== "") && this._object.exportName && (this._object.exportName !== "")) {

                if (this.templateObjects) {
                    this.templateObjects.labelField.value = this._object.label;
                }

                this._blueprintDeferred = Promise.defer();

                var self = this;
                this._object.packageRequire.async(this._object.moduleId).get(this._object.exportName).get("blueprint")
                    .then(function (blueprint) {
                        self._blueprintDeferred.resolve(blueprint);
                        self.objectBlueprint = blueprint;
                    }, function (reason) {
                        console.warn("Unable to load blueprint: ", reason.message ? reason.message : reason);
                        self._blueprintDeferred.reject(null);
                    }).done();

            } else {
                this._blueprintDeferred = null;
                this.objectBlueprint = null;
                if (this.templateObjects) {
                    this.templateObjects.labelField.value = "";
                }
            }
        }
    },

    /**
     * Used to prevent blueprint being resolved if this.object changes
     * while the blueprint is being loaded.
     *
     * Takes advantage of the fact that a promise cannot be resolved after
     * being rejected and vice versa.
     * @type {Promise}
     * @private
     */
    _blueprintDeferred: {
        value: null
    },

    objectBlueprint: {
        serializable: false,
        value: null
    },

    inspectorController: {
        serializable: false,
        value: null
    },

    handleModalEditorButtonAction: {
        value: function (evt) {
            if (!(this.inspectorController && this.inspectorController.hasEditor)) {
                return;
            }

            var self = this,
                editor;

            this.inspectorController.editorComponent().then(function (Editor) {
                editor = Editor.create();
                editor.object = self._object;
                editor.editingDocument = self.editingDocument;
                self.dispatchEventNamed("enterModalEditor", true, true, {
                    modalEditor: editor
                });
            }).done();
        }
    },

    //TODO wait for the change to be considered committed, this action happens on every character change
    handlePropertyInspectorChange: {
        value: function (evt) {
            var detail = evt.detail;
            if (this.object) {
                this.editingDocument.setOwnedObjectProperty(this.object, detail.propertyName, detail.value);
            }
        }
    },

    handleLabelFieldAction : {
        value: function (evt) {
            if (this.object) {
                this.editingDocument.setOwnedObjectLabel(this.object, evt.target.value);
            }
        }
    }

});
