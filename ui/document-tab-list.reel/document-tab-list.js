/**
 * @module ui/document-tab-list.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MimeTypes = require("core/mime-types");

/**
 * @class DocumentTabList
 * @extends Component
 */
exports.DocumentTabList = Component.specialize(/** @lends DocumentTabList# */ {
    
    projectController: {
        value: null
    },

    constructor: {
        value: function DocumentTabList() {
            this.super();
        }
    },

    enterDocument: {
        value: function () {
            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("dragleave", this, false);
            this.element.addEventListener("drop", this, false);
        }
    },

    handleDragover: {
        value: function (evt) {
            // TODO: move tabs arround
            evt.preventDefault();
            evt.stopPropagation();
            evt.dataTransfer.dropEffect = "move";
        }
    },

    handleDragleave: {
        value: function (evt) {
            // TODO: if we do not come back on dragover the dropover should reset the tab
        }
    },

    tabIndexForElement: {
        value: function (element) {
            var tab;

            // Make sure we are on a documentTab and not the children of one
            while (element.dataset.montageId !== "documentTab" && element.parentElement) {
                element = element.parentElement;
            }
            if (element.dataset.montageId) {
                tab = element;
            }
            else {
                throw "Can not move re-arrange this tab because this tab can not be found";
            }

            var iterations = this.templateObjects.tabRepetition.iterations.filter(function(i) {
                return i.firstElement === tab;
            });

            if (!iterations.length) {
                throw "Can not find iteration document for tab element";
            }

            return iterations[0].index;
        }
    },

    tabIndexForUrl: {
        value: function (url) {
            // Find documents associated with this url
            var documents = this.projectController.documents.filter(function (doc) {
                return doc.url === url;
            });

            if (documents.length === 1) {
                var doc = documents[0],
                    iterations = this.templateObjects.tabRepetition.iterations.filter(function(i) {
                        return i.object === doc;
                    });
                if (iterations.length) {
                    return iterations[0].index;
                } else {
                    throw "Can not find iteration for unique document for url:" + url;
                }
            } else {
                // Unopened file
                return -1;
            }
        }
    },

    handleDrop: {
        value: function (evt) {
            var availableTypes = evt.dataTransfer.types,
                element = document.elementFromPoint(evt.pageX, evt.pageY),
                documents = this.projectController.documents,
                currentDocument = this.projectController.currentDocument,
                url,
                doc,
                index,
                newIndex;

            if(availableTypes && availableTypes.has(MimeTypes.URL)) {
                url = evt.dataTransfer.getData(MimeTypes.URL);
                index = this.tabIndexForUrl(url);

                if (index && index === -1) {
                    // Open file
                    this.dispatchEventNamed("openUrl", true, true, url);
                    return;
                } else if ( index === undefined || !documents[index]) {
                    throw "Can not re-arrange this tab because this tab index is incorrect";
                }

                // move to last if not droped on a tab but in the empty space of the tab bar
                if (element === this.templateObjects.tabRepetition.element) {
                    newIndex = documents.length;
                }
                else {
                    newIndex = this.tabIndexForElement(element);
                }
                doc = documents[index];
                documents.splice(newIndex, 0, doc);
                index = (newIndex < index)? index + 1: index;
                documents.splice(index, 1);
                if (currentDocument !== doc) {
                    this.dispatchEventNamed("openUrl", true, true, doc.url);
                } else {
                    this.projectController.openDocumentsController.select(doc);
                }
            }
        }
    }
});
