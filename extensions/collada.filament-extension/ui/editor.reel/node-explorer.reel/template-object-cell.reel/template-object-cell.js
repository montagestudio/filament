/**
 @module "ui/template-object-cell.reel"
 @requires montage
 @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise;

/**
 @class module:"ui/template-object-cell.reel".TemplateObjectCell
 @extends module:montage/ui/component.Component
 */
exports.TemplateObjectCell = Component.specialize({

    constructor: {
        value: function TemplateObjectCell () {
            this.super();
        }
    },

    templateExplorer: {
        value: null
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

                this.canDrawGate.setField("needsObjectDescription", false);

                this._describeTemplateObject().spread(function (templateObject, description) {
                    // Only accept values if the templateObject hasn't changed
                    // since we went off to describe it

                    if (templateObject === self._templateObject) {
                        var keys = Object.keys(description);
                        keys.forEach(function (key) {
                            self[key] = description[key];
                        });
                        self.canDrawGate.setField("needsObjectDescription", true);
                    }

                }).done();
            }

        }
    },

    _describeTemplateObject: {
        value: function () {
            var templateObject = this.templateObject,
                packageRequire = templateObject.editingDocument.packageRequire,
                description = {};

            // Determine if this object is provided by the project's own package
            // TODO not restrict this to components within the ui directory
            description.isInProjectPackage = /^ui\//.test(templateObject.moduleId);

            return Promise.all([
                    packageRequire.async(templateObject.moduleId).get(templateObject.exportName),
                    packageRequire.async("montage/ui/component").get("Component")
                ])
                .spread(function (objectConstructor, componentConstructor) {
                    description.isTemplateObjectComponent = objectConstructor.prototype instanceof componentConstructor;
                })
                .catch(function () {
                    description.isTemplateObjectComponent = null;
                })
                .then(function() { return [templateObject, description]; });
        }
    },

    isInProjectPackage: {
        value: null
    },

    isTemplateObjectComponent: {
        value: null
    },

    handleToggle: {
        value: function (evt) {
            var reelProxy = this.templateObject,
                editingDocument = reelProxy._editingDocument,
                expanded = this.expanded.checked;

            editingDocument.templateObjectsTreeToggleStates.set(reelProxy, expanded);
        }
    }

});
