var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application;

exports.FileCell = Montage.create(Component, {

    projectController: {
        value: null
    },

    fileInfo: {
        value: null
    },

    iteration: {
        value: null
    },

    constructor: {
        value: function FileCell() {
            this.super();
            this.addPathChangeListener("iteration", this);
            this.addPathChangeListener("fileInfo", this);
            this.addPathChangeListener("iteration.expanded", this, "handleExpandedChange");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                application.addEventListener("didOpenDocument", this);

                if (this.fileInfo.isDirectory) {
                    this.element.addEventListener("drop", this, false);
                    this.element.addEventListener("dragenter", this, true);
                    this.element.addEventListener("dragleave", this, true);
                }
            }
        }
    },

    isUploading: {
        value: false
    },

    // FIXME: More robust solution.
    _hoverCounter: {
        value: 0
    },

    draw: {
        value: function() {
            if (this._hoverCounter > 0) {
                this.element.classList.add("FileCell-hover");
            } else {
                this.element.classList.remove("FileCell-hover");
            }

            if (this.isUploading) {
                this.element.classList.add("FileCell-uploading");
            } else {
                this.element.classList.remove("FileCell-uploading");
            }
        }
    },

    captureDragenter: {
        value: function(e) {
            if (e.dataTransfer.types.indexOf("Files") === -1) {
                return;
            }
            e.stopPropagation();
            e.preventDefault();
            this._hoverCounter++;
            this.needsDraw = true;
        }
    },

    handleDrop: {
        value: function(e) {
            this.captureDragleave(e);

            var files = e.dataTransfer.files;
            if (files.length === 0) {
                return;
            }

            var self = this;
            Array.prototype.forEach.call(files, function(file) {
                var reader = new FileReader();
                reader.readAsBinaryString(file);

                reader.onload = function(e) {
                    var base64 = btoa(e.target.result);
                    var dirname = self.fileInfo.filename;
                    var filename = decodeURIComponent(file.name);

                    self.isUploading = true;
                    self.needsDraw = true;
                    self.projectController.addFileToProjectAtUrl(base64, dirname + filename).done(function() {
                        self.isUploading = false;
                        self.needsDraw = true;
                    });
                };

                reader.onerror = function() {
                    throw new Error('handleDrop: Error reading: ' + file.name);
                };
            });
        }
    },

    captureDragleave: {
        value: function(e) {
            e.stopPropagation();
            e.preventDefault();
            this._hoverCounter--;
            this.needsDraw = true;
        }
    },

    handlePathChange: {
        value: function () {
            if (this.fileInfo && this.iteration && this.fileInfo.root) {
                this.iteration.expanded = true;
            }
        }
    },

    handleExpandedChange: {
        value: function(newValue) {
            if (newValue && this.fileInfo && !this.fileInfo.expanded) {
                var self = this;
                this.projectController.filesAtUrl(this.fileInfo.fileUrl).then(function (fileDescriptors) {
                    self.fileInfo.expanded = true;
                    self.fileInfo.children.addEach(fileDescriptors);
                    application.dispatchEventNamed("treeExpanded", true, true);
                }).done();
            }
        }
    },

    handleDidOpenDocument: {
        value: function (evt) {
            var openedDocument = evt.detail.document;
            if (this.fileInfo && this.fileInfo.fileUrl === openedDocument.url) {
                this.fileInfo.associatedDocument = openedDocument;
                application.removeEventListener("didOpenDocument", this);
                application.addEventListener("didCloseDocument", this);
            }
        }
    },

    handleDidCloseDocument: {
        value: function (evt) {
            var openedDocument = evt.detail.document;
            if (this.fileInfo && this.fileInfo.fileUrl === openedDocument.url) {
                this.fileInfo.associatedDocument = null;
                application.addEventListener("didOpenDocument", this);
                application.removeEventListener("didCloseDocument", this);
            }
        }
    },

    handleOpenFileButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("openUrl", true, true, this.fileInfo.fileUrl);
        }
    }

});
