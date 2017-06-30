var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    NotModifiedError = require("palette/core/error").NotModifiedError,
    replaceDroppedTextPlain = require("ui/drag-and-drop").replaceDroppedTextPlain,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

exports.PropertyJig = Component.specialize({

    _focusTimeout: {
        value: null
    },

    acceptsActiveTarget: {
        value: true
    },

    constructor: {
        value: function PropertyJig() {
            var self = this;
            this.super();
            this.defineBinding("isKeyComplex", {
                "<-": "model.key",
                convert: function (k) {
                    return !!k && k.length > 0 && !(/^[A-Za-z]+\w*$/.test(k))
                }
            });
            this.addPathChangeListener("isKeyComplex", function (value) {
                if (value) {
                    self.model.bound = true;
                }
            });
            this.defineBinding("isKeyConflicting", {
                "<-": "existingPropertyKeys.has(model.key)"
            });
        }
    },

    enterDocument: {
        value: function () {

            // We enter the document prior to the overlay presenting it
            if (!this.model) {
                return;
            }

            this.templateObjects.sourcePath.element.addEventListener("drop", this, false);

            defaultEventManager.activeTarget = this;

            var self = this;
            this._focusTimeout = setTimeout(function () {
                self.templateObjects.key.element.focus();
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

    model: {
        value: null
    },

    existingBinding: {
        value: null
    },

    existingPropertyKeys: {
        value: null
    },

    targetPath: {
        value: null
    },

    sourcePath: {
        value: null
    },

    /**
     * Prevents the user from choosing whether the property is bound or not.
     * This is useful e.g. when defining a binding on an existing property - in
     * this case it doesn't make sense from a UI perspective to allow the user
     * to uncheck the bound checkbox.
     *
     * @type {boolean}
     * @default false
     */
    isToggleBindingDisabled: {
        value: false
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
            if (event.dataTransfer.types && event.dataTransfer.types.has(MimeTypes.SERIALIZATION_OBJECT_LABEL)) {
                var plain = event.dataTransfer.getData("text/plain");
                var rich = "@" + event.dataTransfer.getData(MimeTypes.SERIALIZATION_OBJECT_LABEL);
                replaceDroppedTextPlain(plain, rich, this.templateObjects.sourcePath.element);
            }
        }
    },

    handleDefineButtonAction: {
        value: function (evt) {
            evt && evt.stop && evt.stop();
            var self = this;
            try {
                this._commitBindingEdits();
            } catch (error) {
                if (error instanceof NotModifiedError) {
                    self._discardBindingEdits();
                }
            }
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

    _discardBindingEdits: {
        value: function () {
            this.model = null;
            this.existingBinding = null;
            this.dispatchEventNamed("discard", true, false);
        }
    },

    _commitBindingEdits: {
        value: function () {
            var model = this.model,
                proxy = model.targetObject,
                binding;

            if (this.model.bound) {
                binding = this.editingDocument.defineOwnedObjectBinding(proxy, model.key, model.oneway, model.sourcePath, model.converter);
            } else {
                this.editingDocument.setOwnedObjectProperty(proxy, model.key, model.value);
            }

            this.dispatchEventNamed("commit", true, false, {
                bindingEntry: binding
            });

            this.existingBinding = null;
            this.model = null;
        }
    },

    keyShouldGetSuggestions: {
        value: function(autocomplete, searchTerm) {
            var searchProperty = searchTerm,
                component = this.model.targetObject;
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
