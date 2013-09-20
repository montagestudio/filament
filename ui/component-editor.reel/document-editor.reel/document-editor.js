var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types"),
    Promise = require("montage/core/promise").Promise,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver;

exports.DocumentEditor = Component.specialize({

    workbench: {
        enumerable: false,
        value: null
    },

    viewController: {
        value: null
    },

    acceptsActiveTarget: {
        value: true
    },

    editingDocument: {
        value: null
    },

    fileUrl: {
        value: null
    },

    _deferredWorkbench: {
        value: null
    },

    constructor: {
        value: function DocumentEditor() {
            this.super();
            this.defineBinding("fileUrl", {"<-": "editingDocument.fileUrl"});
            this._deferredWorkbench = Promise.defer();

            this.addRangeAtPathChangeListener("editingDocument.selectedObjects", this, "handleSelectedObjectsRangeChange");
        }
    },

    load: {
        value: function (document) {
            var self = this,
                liveStageInfoPromise,
                editingDocumentPromise,
                moduleId,
                exportName;

            // pre-load blueprints for everything already in the template
            // but don't complain if we can't find one
            document.editingProxies.forEach(function (proxy) {
                moduleId = proxy.moduleId;
                exportName = proxy.exportName;
                if (moduleId && exportName) {
                    document.packageRequire.async(moduleId).get(exportName).get("blueprint").fail(Function.noop);
                }
            });

            self.editingDocument = document;
            document.editor = self;

            document.addEventListener("domModified", this, false);

            return this._deferredWorkbench.promise.then(function(workbench) {
                var TEMPLATE = document._template, promise;
                if (!TEMPLATE) {
                    promise = workbench.load(document.fileUrl, document.packageRequire.location);
                } else {
                    var module = document.fileUrl.substring(document.packageRequire.location + 1, document.fileUrl.length - 1);
                    var name = MontageReviver.parseObjectLocationId(module).objectName;

                    promise = document.packageRequire.async(module).then(function (component) {
                        return component[name]._loadTemplate();
                    }).then(function (template) {
                        var fileUrl = document.fileUrl;
                        // ensure trailing slash
                        if (fileUrl.charAt(fileUrl.length -1) !== "/") {
                            fileUrl += "/";
                        }
                        template.setBaseUrl(fileUrl);
                        return workbench.loadTemplate(template, module);
                    });
                }

                return promise.then(function (liveStageInfo) {
                    document.associateWithLiveRepresentations(liveStageInfo.documentPart, liveStageInfo.template, liveStageInfo.frame);
                });
            });
        }
    },

    refresh: {
        value: function () {
            var self = this;

            self.editingDocument._buildSerializationObjects();

            return this.workbench.refresh(this.editingDocument._template)
            .then(function (liveStageInfo) {
                self.editingDocument.associateWithLiveRepresentations(
                    liveStageInfo.documentPart, liveStageInfo.template, liveStageInfo.frame
                );
            });
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._deferredWorkbench.resolve(this.workbench);

                //TODO it was weird that the workbench component emitted DOM events
                this.workbench.addEventListener("dragover", this, false);
                this.workbench.addEventListener("drop", this, false);
                this.workbench.addEventListener("select", this, false);

                this.element.addEventListener("mouseout", this, false);
            }
        }
    },

    handleSelectedObjectsRangeChange: {
        value: function (plus, minus, index) {
            var self = this;
            var selectedObjects = this.getPath("editingDocument.selectedObjects");
            if (selectedObjects && selectedObjects.length === 1) {
                var selectedObject = selectedObjects[0];
                var inspectors = this.viewController.contextualInspectorsForObject(selectedObject);

                Promise.all(inspectors.map(function (component) {
                    var inspector = component.create();
                    inspector.object = selectedObject;
                    inspector.documentEditor = self;
                    return inspector;
                })).then(function (inspectors) {
                    self.contextualInspectors = inspectors;
                }).done();

                var element = selectedObject.properties.get("element");
                if (!element) {
                    return;
                }
                var parentObject = this.editingDocument.nearestComponent(element.parentNode);
                if (!parentObject) {
                    return;
                }

                // TODO make a loop
                var parentInspectors = this.viewController.contextualInspectorsForObject(parentObject).filter(function (inspector) {
                    return inspector.showForChildComponents;
                });
                Promise.all(parentInspectors.map(function (component) {
                    var inspector = component.create();
                    inspector.object = parentObject;
                    inspector.documentEditor = self;
                    inspector.selectedObject = selectedObject;
                    return inspector;
                })).then(function (inspectors) {
                    self.contextualInspectors.push.apply(self.contextualInspectors, inspectors);
                }).done();

            } else {
                if (this.contextualInspectors) {
                    this.contextualInspectors.clear();
                }
            }
        }
    },

    handleDomModified: {
        value: function () {
            this.refresh().done();
        }
    },

    handleRefreshAction: {
        value: function () {
            this.refresh().done();
        }
    },

    handleSelect: {
        value: function (evt) {
            var detail = evt.detail,
                selectionCandidate = detail.candidate,
                isAddingToSelection = detail.addingToSelection,
                isRemovingFromSelection = detail.removingFromSelection,
                editingDocument = this.editingDocument;

            selectionCandidate = editingDocument.updateSelectionCandidate(selectionCandidate);

            if (selectionCandidate) {
                if (isAddingToSelection) {
                    editingDocument.selectObject(selectionCandidate);
                } else if (isRemovingFromSelection) {
                    editingDocument.deselectObject(selectionCandidate);
                } else {
                    var selectedObjects = editingDocument.selectedObjects;
                    selectedObjects.splice(0, selectedObjects.length, selectionCandidate);
                }
            } else {
                editingDocument.clearSelectedObjects();
            }
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (event.dataTransfer.types && event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    // deHighlight when leaving the stage
    handleMouseout: {
        value: function(event) {
            this.dispatchEventNamed("deHighlight", true, true);
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (event) {
            // TODO: security issues?
            var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                transferObject = JSON.parse(data);

            this.editingDocument.addLibraryItemFragments(transferObject.serializationFragment, transferObject.htmlFragment).done();
        }
    }

});
