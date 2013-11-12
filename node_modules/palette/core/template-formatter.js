var Montage = require("montage").Montage,
    Template = require("montage/core/template").Template,
    SERIALIZATION_SCRIPT_TYPE = Template._SERIALIZATON_SCRIPT_TYPE;

exports.TemplateFormatter = Montage.create(Montage, {
    NO_FORMATTING: {
        value: {
            "PRE": true
        }
    },

    template: {
        value: null
    },

    _indent: {
        value: 4
    },

    indent: {
        get: function() {
            return this._indent;
        },
        set: function(value) {
            this._indent = value;

            this._indentString = "";
            for (var i = 0; i < value; i++) {
                this._indentString += " ";
            }
        }
    },

    _indentString: {
        value: "    "
    },

    init: {
        value: function(template, indent) {
            this.template = template;
            if (indent) {
                this.indent = indent;
            }

            return this;
        }
    },

    getIndentSpace: {
        value: function(depth) {
            return new Array(depth).join(this._indentString);
        }
    },

    getDoctypeString: {
        value: function () {
            var doctype = this.template.document.doctype;

            return "<!DOCTYPE " +
                doctype.name +
                (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '') +
                (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '') +
                (doctype.systemId ? ' "' + doctype.systemId + '"' : '') +
                '>';
        }
    },

    _referenceRegExp: {
        value: /\{\s*(\"[#@]\")\s*:\s*(\"[^\"]+\")\s*\}/g
    },
    _bindingRegExp: {
        value: /\{\s*(\"(?:<-|<->)\")\s*:\s*(\"[^\"]+\"\s*(?:,\s*\"converter\"\s*:\s*\{\s*\"@\"\s*:\s*\"[^\"]+\"\s*\}\s*|,\s*\"deferred\"\s*:\s*(true|false)\s*)*)\}/g
    },
    _bindingReplacer: {
        value: function(_, g1, g2) {
            return "{" + g1 + ": " + g2.replace(/,\s*/, ", ")
                .replace(/\n\s*/, "") + "}";
        }
    },
    formatSerialization: {
        value: function(serialization, depth) {
            var indentSpace = this.getIndentSpace(depth);

            return serialization
                // Format element and object references into a single line.
                .replace(this._referenceRegExp, "{$1: $2}")
                // Format binding declarations into a single line.
                .replace(this._bindingRegExp, this._bindingReplacer)
                // Indent.
                .replace(/^/gm, indentSpace);
        }
    },

    getHtml: {
        value: function() {
            var rootNode = this.template.document.documentElement,
                html;

            html = this.getDoctypeString() + "\n" +
                this.getNodeHtml(rootNode);

            return html;
        }
    },

    /**
     * HTML generation
     */
    getNodeHtml: {
        value: function(node, depth) {
            depth = depth || 0;

            if (node.nodeType === Node.ELEMENT_NODE) {
                // skip serialization
                if (!(
                    node.tagName === "SCRIPT" &&
                    node.type === SERIALIZATION_SCRIPT_TYPE
                )) {
                    return this.getElementHtml(node, depth);
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                return this.getTextHtml(node, depth);
            } else if (node.nodeType === Node.COMMENT_NODE) {
                return this.getCommentHtml(node, depth);
            }

            return ""; // unknown node type
        }
    },

    getElementHtml: {
        value: function(node, depth) {
            var indentSpace = this.getIndentSpace(depth),
                html,
                serializationHtml,
                hasChildNodes = node.childNodes.length > 0,
                tagName = node.tagName;

            html = indentSpace;

            // Unable to perform this optimization on the HEAD because
            // the serialization needs to be added.
            if (!hasChildNodes && tagName !== "HEAD") {
                html += node.outerHTML;
            } else if (tagName in this.NO_FORMATTING) {
                html += node.innerHTML;
            } else {
                html += this.getOpenTagHtml(node);
                if (hasChildNodes) {
                    html += "\n" +
                            this.getNodeListHtml(node.childNodes, depth) +
                        "\n";
                }
                // Add the serialization script as the last element of the head.
                if (tagName === "HEAD") {
                    serializationHtml = this.getSerializationHtml(depth + 1);
                    if (serializationHtml) {
                        html += indentSpace + serializationHtml + "\n";
                    }
                }
                html += indentSpace + this.getCloseTagHtml(node);
            }

            return html;
        }
    },

    getTextHtml: {
        value: function(node, depth) {
            var indentSpace = this.getIndentSpace(depth),
                text;

            // Trim the text.
            text = node.nodeValue.replace(/^\s*|\s*$/g, "");
            if (text) {
                return indentSpace + text;
            } else {
                return "";
            }
        }
    },

    getCommentHtml: {
        value: function(node, depth) {
            var indentSpace = this.getIndentSpace(depth);

            return indentSpace + "<!--" + node.nodeValue + "-->";
        }
    },

    getOpenTagHtml: {
        value: function(node) {
            var tagName = node.tagName.toLowerCase(),
                html;

            html = "<" + tagName;
            if (node.attributes.length > 0) {
                html += " " + this.getAttributesHtml(node.attributes);
            }
            html += ">";

            return html;
        }
    },

    getAttributesHtml: {
        value: function(attributes) {
            var attributeList = [],
                nodeValue;

            for (var i = 0, attribute; attribute = attributes[i]; i++) {
                if (attribute.nodeValue) {
                    nodeValue = attribute.nodeValue.replace("\"", "&quot;");
                } else {
                    nodeValue = attribute.nodeValue;
                }
                attributeList.push(attribute.nodeName + '="' + nodeValue + '"');
            }

            return attributeList.join(" ");
        }
    },

    getCloseTagHtml: {
        value: function(node) {
            var tagName = node.tagName.toLowerCase();

            return "</" + tagName + ">";
        }
    },

    getNodeListHtml: {
        value: function(childNodes, depth) {
            var htmlList = [],
                htmlItem;

            if (childNodes.length > 0) {
                for (var i = 0, childNode; childNode = childNodes[i]; i++) {
                    htmlItem = this.getNodeHtml(childNode, depth + 1);
                    if (htmlItem) {
                        htmlList.push(htmlItem);
                    }
                }
            }

            return htmlList.join("\n");
        }
    },

    getSerializationHtml: {
        value: function(depth) {
            var serialization = this.template.objectsString,
                indentSpace;

            if (serialization) {
                indentSpace = this.getIndentSpace(depth);
                return indentSpace +
                    '<script type="' + SERIALIZATION_SCRIPT_TYPE + '">\n' +
                    this.formatSerialization(serialization, depth) + "\n" +
                    indentSpace + '</script>';
            } else {
                return "";
            }
        }
    }
});
