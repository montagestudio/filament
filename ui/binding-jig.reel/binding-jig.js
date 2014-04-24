var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    NotModifiedError = require("core/error").NotModifiedError,
    replaceDroppedTextPlain = require("ui/drag-and-drop").replaceDroppedTextPlain,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

exports.BindingJig = Montage.create(Component, {

    _focusTimeout: {
        value: null
    },

    acceptsActiveTarget: {
        value: true
    },

    enterDocument: {
        value: function () {

            // We enter the document prior to the overlay presenting it
            if (!this.bindingModel) {
                return;
            }

            this.templateObjects.sourcePath.element.addEventListener("drop", this, false);

            defaultEventManager.activeTarget = this;

            var self = this;
            this._focusTimeout = setTimeout(function () {
                self.templateObjects.targetPath.element.focus();
            }, 100);
        }
    },

    exitDocument: {
        value: function () {
            this.templateObjects.sourcePath.element.removeEventListener("drop", this, false);
            clearTimeout(this._focusTimeout);
        }
    },

    editingDocument: {
        value: null
    },

    bindingModel: {
        value: null
    },

    existingBinding: {
        value: null
    },

    targetPath: {
        value: null
    },

    sourcePath: {
        value: null
    },

    shouldDismissOverlay: {
        value: function (overlay, target) {
            // don't dismiss the overlay if the user can drag the target
            while (target) {
                if (target.draggable || target.classList.contains("matte-Autocomplete--popup")) {
                    return false;
                }
                target = target.parentElement;
            }
            return true;
        }
    },

    handleDrop: {
        value: function (event) {
            if (event.dataTransfer.types.has(MimeTypes.SERIALIZATION_OBJECT_LABEL)) {
                var plain = event.dataTransfer.getData("text/plain");
                var rich = "@" + event.dataTransfer.getData(MimeTypes.SERIALIZATION_OBJECT_LABEL);
                replaceDroppedTextPlain(plain, rich, this.templateObjects.sourcePath.element);
            }
        }
    },

    handleDefineBindingButtonAction: {
        value: function (evt) {
            evt.stop();
            var self = this;
            this._commitBindingEdits().catch(function(error) {
                if (error instanceof NotModifiedError) {
                    self._discardBindingEdits();
                }
            }).done();
        }
    },

    handleCancelButtonAction: {
        value: function (evt) {
            evt.stop();
            this._discardBindingEdits();
        }
    },

    handleKeyPress: {
        value: function(evt) {
            /*
                TODO: FIXME: This is a hack to by pass the fact that the keycomposer does not play nice with child keycomposers
            */
            var sourcePath = this.templateObjects.sourcePath,
                targetPath = this.templateObjects.targetPath;
            if (sourcePath.showPopup || targetPath.showPopup) {
                return;
            }
            /*
                EOH: End Of Hack
            */
            if ("cancelEditing" === evt.identifier) {
                this._discardBindingEdits();
            }
        }
    },

    handleAction: {
        value: function (evt) {
            var target = evt.target,
                objects = this.templateObjects;

            if (target === objects.bidirectional ||
                target === objects.unidirectional) {
                return;
            }

            this._commitBindingEdits().catch(function(error) {
                // Ignore validation error
            }).done();
        }
    },

    _discardBindingEdits: {
        value: function () {
            this.bindingModel = null;
            this.existingBinding = null;
            this.dispatchEventNamed("discard", true, false);
        }
    },

    _commitBindingEdits: {
        value: function () {
            var model = this.bindingModel,
                proxy = model.targetObject,
                targetPath = model.targetPath,
                oneway = model.oneway,
                sourcePath = model.sourcePath,
                converter = model.converter,
                bindingPromise;

            if (this.existingBinding) {
                bindingPromise = this.editingDocument.updateOwnedObjectBinding(proxy, this.existingBinding, targetPath, oneway, sourcePath, converter);
            } else {
                bindingPromise = this.editingDocument.defineOwnedObjectBinding(proxy, targetPath, oneway, sourcePath, converter);
            }

            var self = this;
            return bindingPromise.then(function(bindingEntry) {
                self.dispatchEventNamed("commit", true, false, {
                    bindingEntry: bindingEntry
                });

                self.existingBinding = null;
                self.bindingModel = null;

            });

        }
    },

    targetPathShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var searchProperty = searchTerm,
                component = this.bindingModel.targetObject;
            component.packageRequire.async(component.moduleId).get(component.exportName).get("blueprint")
                .then(function (blueprint) {
                    var suggestions = [];
                    blueprint.propertyBlueprints.forEach(function (property) {
                        if (property.name.startsWith(searchProperty)) {
                            suggestions.push(property.name);
                        }
                    });
                    autocomplete.suggestions = suggestions;
                }, function (reason) {
                    console.warn("Unable to load blueprint: ", reason.message ? reason.message : reason);
                }).done();
        }
    },

    sourcePathShouldGetSuggestions: {
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
