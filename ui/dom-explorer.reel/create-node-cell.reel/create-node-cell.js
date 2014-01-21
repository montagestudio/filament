/**
 * @module ui/create-node-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    emmet = require('core/filament-emmet');

/**
 * @class CreateNodeCell
 * @extends Component
 */
exports.CreateNodeCell = Component.specialize(/** @lends CreateNodeCell# */ {

    nodeSegment: {
        value: null
    },

    _montageId: {
        value: null
    },

    montageId: {
        set: function (value) {
            this._montageId = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._montageId;
        }
    },

    _emmetTree: {
        value: null
    },
    _tagName: {
        value: null
    },
    tagName: {
        set: function (value) {
            this._tagName = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._tagName;
        }
    },

    handleTagNameAction: {
        value: function () {
            var value = this._tagName;
            var tree = emmet.expandAbbreviation(value);
            if (!tree || !tree.children) {
                return;
            }
            var node = tree.children[0];
            this._emmetTree = tree;
            this.tagName =  node.name();
            // look for any data-montage-id attribute
            var id = null;
            var attributes = node.attributeList();
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name === "data-montage-id") {
                    id = attributes[i].value;
                }
            }
            if (id) {
                this.montageId = id;
            }
        }
    },

    focusTagName: {
        value: function () {
            this.templateObjects.tagName.toggle();
        }
    },

    constructor: {
        value: function CreateNodeCell() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) { return; }

            this.element.addEventListener("dragstart", this);
        }
    },

    handleDragstart: {
        value: function (evt) {
            if (!this.tagName) {return;}
            var node = this._emmetTree.children[0],
                json = {
                name: node.name(),
                attributes: []
            };
            var attributes = node.attributeList();
            for (var i = 0; i < attributes.length; i++) {
                json.attributes.push({
                    name: attributes[i].name,
                    value: attributes[i].value
                });
            }
            if (this.montageId) {
                json.attributes.push({name: "data-montage-id", value: this.montageId});
            }

            evt.dataTransfer.effectAllowed = "copyMove";
            evt.dataTransfer.setData(MimeTypes.JSON_NODE, JSON.stringify(json));
            evt.dataTransfer.setData("text/plain", this._emmetTree.valueOf());
        }
    },

    reset: {
        value: function () {
            this.tagName = null;
            this.montageId = null;
            this._emmetTree = null;
        }
    },

    draw: {
        value: function () {
            var draggable = !!(this.tagName && this.tagName.trim().length);
            this.nodeSegment.setAttribute("draggable", draggable.toString());
        }
    }
});
