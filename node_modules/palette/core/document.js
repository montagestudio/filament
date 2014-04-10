var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise,
    UndoManager = require("montage/core/undo-manager").UndoManager;

exports.Document = Target.specialize({

    constructor: {
        value: function Document(url) {
            this.super();
            this._url = url;
            this.defineBinding("isDirty", {
                "<-": "_changeCount != 0"
            });
        }
    },

    /**
     * Return a promise for the loading of this document the specified URL
     *
     * @param {string} url The url for which to load the document.
     * @return {Promise} A promise that resolves to this.
     */
    load: {
        value: function (url) {
            return Promise.resolve(this.init(url));
        }
    },

    _url: {
        value: null
    },

    /**s
     * The URL this document represents
     */
    url: {
        get: function () {
            return this._url;
        }
    },

    /**
     * Initialize a document instance representing the specified URL
     *
     * @param {string} url The URL this document instance will represent
     */
    init: {
        value: function (url) {
            this._url = url;

            var undoManager = this.undoManager = UndoManager.create();
            undoManager.addEventListener("operationRegistered", this, false);
            undoManager.addEventListener("undo", this, false);
            undoManager.addEventListener("redo", this, false);

            return this;
        }
    },

    /**
     * The actual component currently presenting this document
     */
    editor: {
        value: null
    },

    /**
     * The title of this document
     */
    title: {
        get: function () {
            // Get the last pathname component of the url, whether it's a file
            // or directory (trailing-slash).
            return this.url.match(/\/([^\/]+)\/*$/)[1];
        }
    },

    _undoManager: {
        value: null
    },
    /**
     * This document's UndoManager
     */
    undoManager: {
        get: function() {
            return this._undoManager;
        },
        set: function(value) {
            if (this._undoManager === value) {
                return;
            }

            this._undoManager = value;
        }
    },

    /**
     * Perform the operation at the top of the undo stack
     */
    undo: {
        value: function () {
            return this.undoManager.undo();
        }
    },

    /**
     * Perform the operation at the top of the redo stack
     */
    redo: {
        value: function () {
            return this.undoManager.redo();
        }
    },

    /*
     *
     */
    canUndo: {
        get: function () {
            return this.getPath("undoManager.undoCount > 0");
        }
    },

    /*
     *
     */
    canRedo: {
        get: function () {
            return this.getPath("undoManager.redoCount > 0");
        }
    },

    /**
     * Saves the data to the specified dataWriter. For example:<br/>
     * <code>
     *      var serializer = Serializer.create().initWithRequire(this.packageRequire);
     *      var serializedDescription = serializer.serializeObject(this.currentProxyObject.proxiedObject);
     *      return dataWriter(serializedDescription, location);
     * </code>
     *
     * By default sets the _changeCount to 0. If you override this method then
     * you must do this yourself.
     * @param {string} url The url to save this document's data to
     * @param {function} dataWriter The data writing function that will perform the data writing portion of the save operation
     */
    save: {
        value: function (url, dataWriter) {
            var self = this;
            return Promise.when(dataWriter("", url))
                .then(function (value) {
                    self._changeCount = 0;
                    return value;
                });
        }
    },

    /**
     * Give the document an opportunity to decide if it can be closed.
     * @return null if the document can be closed, a string withe reason it cannot close otherwise
     */
    canClose: {
        value: function () {
            // TODO PJYF This message needs to be localized
            return (this.isDirty ? "You have unsaved Changes" : null);
        }
    },

    /**
     * Whether or not this document has unsaved changes and is considered dirty
     *
     * If you are using the default undo manger created by the Document then
     * this property will be managed automatically.
     * @type {boolean}
     */
    isDirty: {
        value: false
    },

    /**
     * The number of changes that have been made to this document. Used to set
     * isDirty to true if non-zero.
     *
     * Note: The change count can be negative after the document is saved and
     * an undo is performed.
     * @type {number}
     * @protected
     */
    _changeCount: {
        value: 0
    },

    handleOperationRegistered: {
        value: function () {
            var changeCount = this._changeCount;
            // If we are behind the save and cannot redo then we can never get
            // back to the non-dirty state.
            if (changeCount < 0 && !this.undoManager.canRedo) {
                this._changeCount = Number.POSITIVE_INFINITY;
            } else {
                this._changeCount = changeCount + 1;
            }
        }
    },

    handleUndo: {
        value: function () {
            this._changeCount--;
        }
    },

    handleRedo: {
        value: function () {
            this._changeCount++;
        }
    },

    close: {
        value: Function.noop
    }


}, {

    /**
     * The preferred type of component used for presenting this document
     */
    editorType: {
        get: function () {
            return null;
        }
    }

});
