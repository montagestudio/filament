/**
 * @module ui/node-materials.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MIME_TYPES = require("core/mime-types"),
    MaterialTemplate = require("library-items/mjs-volume/material.library-item/material.html").content,
    ICON_PATH = "library-items/mjs-volume/material.library-item/material.png";

/**
 * @class NodeMaterials
 * @extends Component
 */
exports.NodeMaterials = Component.specialize(/** @lends NodeMaterials# */ {
    constructor: {
        value: function NodeMaterials() {
            this.super();
        }
    },

    inspector: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, false);
            }
        }
    },

    _createNodeTemplate: {
        value: function (materialID) {
            var htmlDocument = document.implementation.createHTMLDocument("");
            htmlDocument.documentElement.innerHTML = MaterialTemplate;

            if (materialID && this.inspector.sceneLabel) {
                var selector = "script[type='" + MIME_TYPES.SERIALIZATON_SCRIPT_TYPE + "']",
                    scriptSerialization = htmlDocument.querySelector(selector);

                if (scriptSerialization) {
                    var serialization = JSON.parse(scriptSerialization.textContent);

                    if (serialization && serialization.material) {
                        var material = serialization.material;

                        material.properties = material.properties ? material.properties : {};
                        material.properties.id = materialID;
                        material.properties.scene = {"@": this.inspector.sceneLabel};

                        scriptSerialization.textContent = JSON.stringify(serialization);
                    }
                }
            }

            return htmlDocument.documentElement.outerHTML;
        }
    },

    handleDragstart: {
        value: function (event) {
            var dataTransfer = event.dataTransfer;

            if (dataTransfer) {
                var materialID = dataTransfer.getData(MIME_TYPES.TEXT_PLAIN);

                if (materialID) {
                    var nodeTemplate = this._createNodeTemplate(materialID),
                        imageElement = document.createElement("img");

                    dataTransfer.setData(MIME_TYPES.TEMPLATE, nodeTemplate);

                    imageElement.src = require.location + ICON_PATH;
                    dataTransfer.setDragImage(imageElement, imageElement.width / 2, imageElement.height / 2);
                }
            }
        }
    }

});
