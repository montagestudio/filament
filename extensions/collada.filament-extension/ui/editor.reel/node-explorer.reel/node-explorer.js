/**
 * @module ui/node-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class NodeExplorer
 * @extends Component
 */
exports.NodeExplorer = Component.specialize(/** @lends NodeExplorer# */ {
    constructor: {
        value: function NodeExplorer() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    _willAcceptDrop: {
        value: null
    },

    selectedTemplate: {
        value: null
    },

    sceneGraph: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragover", this, false);
                this._element.addEventListener("dragleave", this, false);
                this._element.addEventListener("drop", this, false);

                this.addPathChangeListener("selectedTemplate", this, "handleSelectedTemplate");
            }
        }
    },

    handleSelectedTemplate: {
        value: function (selectedTemplate) {
            if (selectedTemplate && /mjs-volume\/runtime\/node/.test(selectedTemplate.exportId)) {
                this.sceneGraph.selectNodeById(selectedTemplate.properties.get("id"));
            }
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            var availableTypes = event.dataTransfer.types;

            //Accept dropping prototypes from library
            if (availableTypes && availableTypes.has(MimeTypes.TEMPLATE)) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                this._willAcceptDrop = true;
            } else {
                event.dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
            }
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (event) {
            var availableTypes = event.dataTransfer.types,
                data;

            if (availableTypes) {

                if (availableTypes.has(MimeTypes.TEMPLATE)) {
                    data = event.dataTransfer.getData(MimeTypes.TEMPLATE);
                }

                if (data) {
                    this.editingDocument.insertTemplateContent(data).done();
                }
            }

            this._willAcceptDrop = false;
        }
    }

});
