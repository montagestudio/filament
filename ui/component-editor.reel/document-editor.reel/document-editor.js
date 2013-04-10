var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ReelDocument = require("core/reel-document").ReelDocument,
    MimeTypes = require("core/mime-types"),
    Promise = require("montage/core/promise").Promise;

exports.DocumentEditor = Montage.create(Component, {

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

    didCreate: {
        value: function () {
            this.defineBinding("fileUrl", {"<-": "editingDocument.fileUrl"});
            this._deferredWorkbench = Promise.defer();
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

            return this._deferredWorkbench.promise.then(function(workbench) {
                return workbench.load(document.fileUrl, document.packageRequire.location);
            }).then(function (liveStageInfo) {
                document.associateWithLiveRepresentations(liveStageInfo.owner, liveStageInfo.template, liveStageInfo.frame);
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
            }
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
                    editingDocument.selectedObjects = [selectionCandidate];
                }
            } else {
                editingDocument.clearSelectedObjects();
            }
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1) {
                // allows us to drop
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
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
