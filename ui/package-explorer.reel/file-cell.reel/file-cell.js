var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    Promise = require("montage/core/promise").Promise,
    MenuModule = require("core/menu"),
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
            this.addPathChangeListener("fileInfo.mimeType", this, "handleFileInfoChange");
            this.addPathChangeListener("fileInfo.fileUrl", this, "handleFileInfoChange");
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
                } else {
                    //TODO eventually allow downloading directories
                    //TODO eventually allow moving directories
                    this.element.addEventListener("dragstart", this);
                }

                this.element.addEventListener("mouseup", this);

                // contextualMenu
                this.addEventListener("contextualMenuValidate", this, false);
                this.addEventListener("contextualMenuAction", this, false);
            }
        }
    },

    _contextualMenu: {
        value: null
    },

    contextualMenu: {
        get: function () {
            if (this._contextualMenu) {
                return this._contextualMenu;
            }

            // TODO: one menu instance for every file, RLY ?!!!
            var menu = this.ownerComponent._createContextualMenu(),
                deleteItem = MenuModule.makeMenuItem("Delete", "delete", true, "");
            menu.insertItem(deleteItem);
            this._contextualMenu = menu;

            return this._contextualMenu;
        }
    },

    handleContextualMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = menuItem.identifier;

            switch (identifier) {
            case "delete":
                evt.stop();
                menuItem.enabled = true;
                break;
            }

        }
    },

    handleContextualMenuAction: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = menuItem.identifier;

            switch (identifier) {
            case "newFolder":
                this.dispatchEventNamed("addDirectory", true, true);
                break;

            case "newComponent":
                this.dispatchEventNamed("addFile", true, true);
                break;

            case "newModule":
                this.dispatchEventNamed("addModule", true, true);
                break;

            case "delete":
                debugger
                // this.fileInfo will need to be send
                this.dispatchEventNamed("deletePath", true, true);
                break
            }
        }
    },



    _isUploading: {
        value: false
    },

    //TODO derive this value form the presence of uploadCompletion promises
    isUploading: {
        get: function () {
            return this._isUploading;
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

    // NOTE this is tracking dragenter/dragleave events that bubble up from children
    // to recognize when we actually leave the fileCell
    // FIXME: More robust solution.
    _hoverCounter: {
        value: 0
    },

    draw: {
        value: function() {
            this.super();

            var fileInfo = this.fileInfo,
                element = this.element;

            if (fileInfo && fileInfo.mimeType && fileInfo.name && fileInfo.fileUrl) {
                element.setAttribute("draggable", true);
                element.dataset.downloadurl = this.fileInfo.mimeType + ":" + this.fileInfo.name + ":" + this.fileInfo.fileUrl;
            } else {
                element.removeAttribute("draggable");
                delete this.element.dataset.downloadurl;
            }

            if (this._hoverCounter > 0) {
                element.classList.add("FileCell--dragHover");
            } else {
                element.classList.remove("FileCell--dragHover");
            }

            if (this.isUploading) {
                element.classList.add("FileCell--uploading");
            } else {
                element.classList.remove("FileCell--uploading");
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

                    self.projectController.projectDocument.add(base64, destinationUrl)
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
            // Only decrement the hover counter if we cared enough to increment it
            // i.e. ignore leaves that didn't have a corresponding enter that we accepted
            if (this._hoverCounter > 0) {
                e.stopPropagation();
                e.preventDefault();
                this._hoverCounter--;
                this.needsDraw = true;
            }
        }
    },

    handleDragstart: {
        value: function (evt) {
            var fileDetails = this.element.dataset.downloadurl;
            evt.dataTransfer.setData("DownloadURL", fileDetails);
        }
    },

    handlePathChange: {
        value: function () {
            if (this.fileInfo && this.iteration && this.fileInfo.root) {
                this.iteration.expanded = true;
            }
        }
    },

    handleFileInfoChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleExpandedChange: {
        value: function(newValue) {
            if (newValue && this.fileInfo && !this.fileInfo.expanded) {
                var self = this;
                this.projectController.filesAtUrl(this.fileInfo.fileUrl).then(function (fileDescriptors) {
                    self.fileInfo.expanded = true;
                    self.fileInfo.children.addEach(fileDescriptors);

                    //TODO not reach into the projectController to do this; formalize when we get the mimetypes
                    fileDescriptors.forEach(function (fd) {
                        self.projectController.environmentBridge.detectMimeTypeAtUrl(fd.fileUrl).then(function (mimeType) {
                            fd.mimeType = mimeType;
                        }).done();
                    });

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
    },

    // Hack to go arround the fact that the press composer sometimes gets the mouse event before the contextMenu
    handleMouseup: {
        value: function (evt) {
            if (evt.button === 2) {
                evt.stop();
            }
        }
    }

});
