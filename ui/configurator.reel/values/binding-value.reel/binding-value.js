/**
 * @module ui/binding-value.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class BindingValue
 * @extends AbstractTextField
 */
exports.BindingValue = Component.specialize(/** @lends BindingValue# */ {
    constructor: {
        value: function BindingValue() {
            this.super();
        }
    },

    value: {
        value: null
    },

    hasTemplate: {
        value: true
    },

    editingDocument: {
        value: null
    },

    autocompleteShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var searchLabel = (searchTerm.trim()[0] === "@") ? searchTerm.slice(1) : searchTerm;
            var i = searchLabel.indexOf(".");
            if (i !== -1) {
                // looks for properties in blueprint
                var searchProperty = searchLabel.slice(i + 1),
                    componentLabel = searchLabel.slice(0, i),
                    component = this.editingDocument.editingProxyMap[componentLabel];

                if (!component) {
                    autocomplete.suggestions = [];
                    return;
                }

                component.packageRequire.async(component.moduleId).get(component.exportName).get("blueprint")
                    .then(function (blueprint) {
                        var suggestions = [];
                        blueprint.propertyBlueprints.forEach(function (property) {
                            if (property.name.startsWith(searchProperty)) {
                                suggestions.push("@" + componentLabel + "." + property.name);
                            }
                        });
                        autocomplete.suggestions = suggestions;
                    }, function (reason) {
                        console.warn("Unable to load blueprint: ", reason.message ? reason.message : reason);
                    }).done();
            } else {
                // list available components
                var suggestions = [];
                this.editingDocument.editingProxies.forEach(function (proxy) {
                    if (proxy.identifier.startsWith(searchLabel)) {
                        suggestions.push("@" + proxy.identifier);
                    }
                });
                autocomplete.suggestions = suggestions;
            }
        }
    }
});
