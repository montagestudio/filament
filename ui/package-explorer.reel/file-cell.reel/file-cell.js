var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
    Promise = require("montage/core/promise").Promise,
    MenuModule = require("core/menu"),
    MimeTypes = require("core/mime-types"),
    Url = require("core/url");


// Can't use flatten() from montagejs/collections
// https://github.com/montagejs/collections/issues/74#issuecomment-44437489
function flatten(array) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
        var item = array[i];
        if (Array.isArray(item)) {
            result.push.apply(result, flatten(item));
        } else {
            result.push(item);
        }
    }
    return result;
}


exports.FileCell = Component.specialize({

    projectController: {
        value: null
    },

    info: {
        value: null
    },

    fileDescriptor: {
        get: function () {
            return this.info ? this.info.data : null;
        }
    },

    expandedToggle: {
        value: null
    },

    constructor: {
        value: function FileCell() {
            this.super();
            this.addPathChangeListener("info", this, "handleInfoChange");
            this.addPathChangeListener("fileDescriptor.mimeType", this, "handleFileDescriptorChange");
            this.addPathChangeListener("fileDescriptor.fileUrl", this, "handleFileDescriptorChange");
            this.addPathChangeListener("info.isExpanded", this, "handleExpandedChange");

            this.activeUploads = [];
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime && this.info) {
                application.addEventListener("didOpenDocument", this);

                if (this.fileDescriptor.isDirectory) {
                    this.element.addEventListener("drop", this, false);
                    this.element.addEventListener("dragenter", this, true);
                    this.element.addEventListener("dragleave", this, true);
                }
                this.element.addEventListener("dragstart", this);

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
                deleteItem = MenuModule.makeMenuItem("Delete", "delete", true, ""),
                openWithItem = MenuModule.makeMenuItem("Open with", "openWith", true, "");
            menu.insertItem(deleteItem);

            // openWith menuItem
            var prototypes = this.projectController.documentTypesForUrl(this.fileDescriptor.fileUrl);
            if (prototypes.length > 0) {
                menu.insertItem(openWithItem, 0);
                prototypes.forEach(function (proto) {
                    var name = (proto.editorType.friendlyName)? proto.editorType.friendlyName : proto.editorType.name,
                    // TODO: we should be able to provide event details
                    item = MenuModule.makeMenuItem(name, "openWith", true, "");
                    item.editorType = proto.editorType;
                    openWithItem.insertItem(item, 0);
                });
            }
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
                identifier = menuItem.identifier,
                path = this.fileDescriptor.filename;

            if (!this.fileDescriptor.isDirectory) {
                path = this.fileDescriptor.filename.substring(0, this.fileDescriptor.filename.lastIndexOf(this.fileDescriptor.name));
            }

            switch (identifier) {
            case "newDirectory":
                evt.stop();
                this.dispatchEventNamed("addDirectory", true, true, {path: path});
                break;

            case "newComponent":
                evt.stop();
                this.dispatchEventNamed("addFile", true, true, {path: path});
                break;

            case "newModule":
                evt.stop();
                this.dispatchEventNamed("addModule", true, true, {path: path});
                break;

            case "newFile":
                evt.stop();
                this.dispatchEventNamed("newFile", true, true, {path: path});
                break;

            case "delete":
                evt.stop();
                this.dispatchEventNamed("removeTree", true, true, {path: this.fileDescriptor.filename});
                break;

            case "openWith":
                evt.stop();
                var editorType = menuItem.editorType;
                this.projectController.openUrlForEditing(this.fileDescriptor.fileUrl, editorType);
                break;
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

            var fileDescriptor = this.fileDescriptor,
                element = this.element;

            if (fileDescriptor && fileDescriptor.mimeType && fileDescriptor.name && fileDescriptor.fileUrl) {
                element.setAttribute("draggable", true);
            } else {
                element.removeAttribute("draggable");
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
            if (e.dataTransfer.types && e.dataTransfer.types.indexOf("Files") === -1) {
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

    /**
     * Subroutine used to walk throught a folder drag and drop
     * _readDirectory iter on a given array of entries.
     * An entry can either be a FileEntry or DirectoryEntry
     */
    _readDirectory: {
        value: function(entries) {
            var promises = [];

            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isDirectory) {
                    promises = promises.concat(this._getAllEntries(entries[i]));
                } else {
                    var defer = Promise.defer();
                    promises.push(defer.promise);
                    defer.resolve(entries[i]);
                }
            }

            return Promise.all(promises).then(function(files) {
                files = flatten(files);
                return files;
            }, function(err) {
                console.warn('_readDirectory FAIL', err);
            });
        }
    },

    /**
     * Subroutine used by _readDirectory to read a directoryEntry's entries
     */
    _getAllEntries: {
        value: function(directoryEntry) {
            var defer = Promise.defer(),
                entries = [],
                directoryReader = directoryEntry.createReader(),
                ignore = [".git", ".DS_Store"],
                self = this;

            var readEntries = function() {
                directoryReader.readEntries(function(entryArray) {
                    // Filter out ignored files
                    entryArray  = entryArray.filter(function (entry) {
                        return ignore.indexOf(entry.name) === -1;
                    });

                    if (!entryArray.length) {
                        self._readDirectory(entries).then(function(dirEntries) {
                            // Call makeTree to create an empty directory
                            // TODO: this directory creation is not reflected in the upload progression
                            if (dirEntries.length === 0) {
                                var destination = self.fileDescriptor.fileUrl,
                                    dirname = directoryEntry.fullPath,
                                    destinationUrl = Url.resolve(destination, dirname.replace(/^\//, ""));

                                self.projectController.projectDocument.makeTree(destinationUrl).done();
                            }
                            defer.resolve(dirEntries);
                        }).done();
                    } else {
                        entries.push.apply(entries, entryArray);
                        readEntries();
                    }
                }, function onError(error) {
                    defer.reject(error);
                    console.warn('ERROR', error);
                });
            };

            readEntries();
            return defer.promise;
        }
    },

    handleDrop: {
        value: function(e) {
            this.captureDragleave(e);

            var files = [],
                items = e.dataTransfer.items,
                self = this;

            if (items[0] && typeof items[0].webkitGetAsEntry === "function") {
                // Directory drag-n-dropping is supported
                // http://codebits.glennjones.net/dragdrop/dropfolder.htm
                var entries = Array.prototype.map.call(items, function(item) {
                    return item.webkitGetAsEntry();
                });
                this._readDirectory(entries).then(function(files) {
                    files = files.filter(function(f) {
                        return f.isFile;
                    });

                    self._startUploading(files);
                }, function(err) {
                    console.warn('_readDirectory FAIL', err);
                });

            } else {
                files = Array.prototype.slice.call(e.dataTransfer.files, 0);
                self._startUploading(files);
            }
        }
    },

    _startUploading: {
        value: function(files) {
            var self = this;
            var activeUploads = this.activeUploads;

            Promise.all(files.map(function(item) {
                var defer = Promise.defer();
                item.file(function(file) {
                    file.fullPath = item.fullPath;
                    defer.resolve(file);
                });
                return defer.promise;
            })).then(function(files) {

                var uploadOperation = self._uploadFiles(files)
                    .then(function(finishedUploads) {
                        activeUploads.splice(activeUploads.indexOf(uploadOperation), 1);
                    })
                    // Wait a bit before considering the upload batch closed
                    // This allows the 100% progress to show and not simply disappear/flash briefly
                    // This also gives us a chance to accommodate adding more uploads to the batch
                    .delay(1500)
                    .then(function() {
                        if (0 === activeUploads.length) {
                            self.isUploading = false;
                        }
                    }).done();

                activeUploads.push(uploadOperation);

            }).done();

        }
    },

    _uploadFiles: {
        value: function(files) {
            var destination = this.fileDescriptor.fileUrl,
                relativeDestination = destination.replace(this.projectController.packageUrl, ""),
                deferredCompletion = Promise.defer(),
                self = this,
                initialActivityMessage,
                uploadPromises,
                commitBatch = self.projectController.environmentBridge.openCommitBatch(),
                urlsToCommit = [],
                commitMessage;

            // Do what we can immediately
            this.isUploading = true;
            this.expectedUploadedFileCount += files.length;
            this.expectedUploadedBytes += files.reduce(function (total, file) {
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
            uploadPromises = files.map(function(file) {
                var reader = new FileReader(),
                    deferredUpload = Promise.defer(),
                    sizeToReportOnLoad = file.size,
                    lastReportedLoadedBytes = 0;

                if (commitMessage === undefined) {
                    commitMessage = "Adding file " + file.name;
                } else {
                    commitMessage = "Adding files";
                }

                reader.readAsBinaryString(file);

                reader.onprogress = function (e) {
                    var loadedDelta = e.loaded - lastReportedLoadedBytes;

                    self.uploadedBytes += loadedDelta;
                    sizeToReportOnLoad -= loadedDelta;
                    lastReportedLoadedBytes = e.loaded;
                };

                reader.onload = function(e) {
                    var base64 = btoa(e.target.result),
                        fullPath = file.fullPath || file.name,
                        filename = decodeURIComponent(fullPath),
                        makeSubDirectories = (file.fullPath && file.fullPath !== file.filename),
                        destinationUrl = Url.resolve(destination, filename.replace(/^\//, ""));

                    self.projectController.projectDocument.add(base64, destinationUrl, makeSubDirectories)
                        .then(function (success) {
                            deferredUpload.resolve(destinationUrl);
                            deferredCompletion.notify(filename);
                            self.uploadedBytes += sizeToReportOnLoad;
                            self.uploadedFileCount++;
                            self.needsDraw = true;
                            urlsToCommit.push(destinationUrl);
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
                    return self.projectController.environmentBridge.stageFiles(commitBatch, urlsToCommit)
                    .then(function() {
                        self.projectController.environmentBridge.closeCommitBatch(commitBatch, commitMessage);
                        return uploads;
                    });
                }, function (failure) {
                    deferredCompletion.resolve(failure);
                    return failure;
                })
                .finally(function() {
                    self.projectController.environmentBridge.releaseCommitBatch(commitBatch);
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
            // TODO eventually allow downloading directories
            // TODO eventually allow moving directories
            if (!this.fileDescriptor.isDirectory) {
                var fileDetails = this.fileDescriptor.mimeType + ":" + this.fileDescriptor.name + ":" + this.fileDescriptor.fileUrl;
                evt.dataTransfer.setData("DownloadURL", fileDetails);
            }
            evt.dataTransfer.setData(MimeTypes.URL, this.fileDescriptor.fileUrl);
        }
    },

    handleInfoChange: {
        value: function () {
            this.dispatchOwnPropertyChange("fileDescriptor", this.fileDescriptor);
        }
    },

    handleFileDescriptorChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    expandFolder: {
        value: function () {
            var self = this;

            this.projectController.filesAtUrl(this.fileDescriptor.fileUrl).then(function (fileDescriptors) {
                self.fileDescriptor.expanded = true;
                self.fileDescriptor.children.addEach(fileDescriptors);

                //TODO not reach into the projectController to do this; formalize when we get the mimetypes
                fileDescriptors.forEach(function (fd) {
                    self.projectController.environmentBridge.detectMimeTypeAtUrl(fd.fileUrl).then(function (mimeType) {
                        fd.mimeType = mimeType;
                    }).done();
                });

                application.dispatchEventNamed("treeExpanded", true, true);
            }).done();
        }
    },

    handleExpandedChange: {
        value: function(newValue) {
            if (newValue && this.fileDescriptor && !this.fileDescriptor.expanded) {
                this.expandFolder();
            }
        }
    },

    handleDidOpenDocument: {
        value: function (evt) {
            var openedDocument = evt.detail.document;
            if (this.fileDescriptor && this.fileDescriptor.fileUrl === openedDocument.url) {
                this.fileDescriptor.associatedDocument = openedDocument;
                application.removeEventListener("didOpenDocument", this);
                application.addEventListener("didCloseDocument", this);
            }
        }
    },

    handleDidCloseDocument: {
        value: function (evt) {
            var openedDocument = evt.detail.document;
            if (this.fileDescriptor && this.fileDescriptor.fileUrl === openedDocument.url) {
                this.fileDescriptor.associatedDocument = null;
                application.addEventListener("didOpenDocument", this);
                application.removeEventListener("didCloseDocument", this);
            }
        }
    },

    handleOpenFileButtonAction: {
        value: function (evt) {
            if (this.fileDescriptor.isDirectory && !this.fileDescriptor.isReel) {
                this.info.isExpanded = !this.info.isExpanded;
            } else {
                this.dispatchEventNamed("openUrl", true, true, this.fileDescriptor.fileUrl);
            }
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
