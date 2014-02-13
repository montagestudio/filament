var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    Promise = require("montage/core/promise").Promise,
    Url = require("core/url");

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

            this.activeUploads = [];
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

    _isUploading: {
        value: false
    },

    //TODO derive this value form the presence of uploadCompletion promises
    isUploading: {
        get: function () {
            return this._isUploading
        },
        set: function (value) {
            if (value === this._isUploading) {
                return;
            }

            this._isUploading = value;

            if (!value) {
                //the batch of uploads is done, safe to clear
                this.expectedUploadedFileCount = 0;
                this.uploadedFileCount = 0;
                this.expectedUploadedBytes = 0;
                this.uploadedBytes = 0;
            }
            this.needsDraw = true;
        }
    },

    // FIXME: More robust solution.
    _hoverCounter: {
        value: 0
    },

    draw: {
        value: function() {
            if (this._hoverCounter > 0) {
                this.element.classList.add("FileCell--dragHover");
            } else {
                this.element.classList.remove("FileCell--dragHover");
            }

            if (this.isUploading) {
                this.element.classList.add("FileCell--uploading");
            } else {
                this.element.classList.remove("FileCell--uploading");
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

    /**
     * The active uploads affecting this fileCell
     * TODO move most of this machinery elsewhere such that uploads that target the fileUrl
     * represented by this fileCell don't need to necessarily start on this fileCell to be indicated here
     */
    activeUploads: {
        value: null
    },

    expectedUploadedFileCount: {
        value: 0
    },

    uploadedFileCount: {
        value: 0
    },

    expectedUploadedBytes: {
        value: 0
    },

    uploadedBytes: {
        value: 0
    },

    handleDrop: {
        value: function(e) {
            this.captureDragleave(e);

            var files = e.dataTransfer.files,
                self = this,
                activeUploads = this.activeUploads;

            if (files.length === 0) {
                return;
            }

            var uploadOperation = this._uploadFiles(files)
                .then(function (finishedUploads) {
                    activeUploads.splice(activeUploads.indexOf(uploadOperation), 1);
                })
                // Wait a bit before considering the upload batch closed
                // This allows the 100% progress to show and not simply disappear/flash briefly
                // This also gives us a chance to accommodate adding more uploads to the batch
                .delay(1500)
                .then(function () {
                    if (0 === activeUploads.length) {
                        self.isUploading = false;
                    }
                }).done();

            activeUploads.push(uploadOperation);
        }
    },

    _uploadFiles: {
        value: function (files) {
            var destination = this.fileInfo.fileUrl,
                relativeDestination = destination.replace(this.projectController.packageUrl, ""),
                deferredCompletion = Promise.defer(),
                self = this,
                initialActivityMessage,
                uploadPromises;

            // Do what we can immediately
            this.isUploading = true;
            this.expectedUploadedFileCount += files.length;
            this.expectedUploadedBytes += Array.prototype.reduce.call(files, function (total, file) {
                return total + file.size;
            }, 0);

            //TODO localize these messages
            if (files.length === 1) {
                initialActivityMessage = "Adding " + files[0].name + " to " + relativeDestination;
            } else {
                initialActivityMessage = "Adding " + files.length + " files to " + relativeDestination;
            }

            this.dispatchEventNamed("asyncActivity", true, false, {
                promise: deferredCompletion.promise,
                title: initialActivityMessage
            });

            // Now start trying to upload files
            uploadPromises = Array.prototype.map.call(files, function(file) {
                var reader = new FileReader(),
                    deferredUpload = Promise.defer(),
                    sizeToReportOnLoad = file.size,
                    lastReportedLoadedBytes = 0;

                reader.readAsBinaryString(file);

                reader.onprogress = function (e) {
                    var loadedDelta = e.loaded - lastReportedLoadedBytes;

                    self.uploadedBytes += loadedDelta;
                    sizeToReportOnLoad -= loadedDelta;
                    lastReportedLoadedBytes = e.loaded;
                };

                reader.onload = function(e) {
                    var base64 = btoa(e.target.result),
                        filename = decodeURIComponent(file.name),
                        destinationUrl = Url.resolve(destination, filename);

                    self.projectController.addFileToProjectAtUrl(base64, destinationUrl)
                        .then(function (success) {
                            deferredUpload.resolve(destinationUrl);
                            deferredCompletion.notify(filename);
                            self.uploadedBytes += sizeToReportOnLoad;
                            self.uploadedFileCount++;
                            self.needsDraw = true;
                        }, function (failure) {
                            deferredUpload.reject(failure);
                        }).done();
                };

                reader.onerror = function() {
                    deferredUpload.reject(new Error('handleDrop: Error reading: ' + file.name));
                };

                return deferredUpload.promise;
            });

            // Ultimately return a promise for all the files to be uploaded
            return Promise.all(uploadPromises)
                .then(function (uploads) {
                    deferredCompletion.resolve("Done");
                    return uploads;
                }, function (failure) {
                    deferredCompletion.resolve(failure);
                    return failure;
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
