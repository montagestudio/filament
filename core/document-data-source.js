var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise;

/**
 * The DocumentDataSource manages the contents of a url (or more) that is needed
 * by multiple consumers at the same time.
 *
 * It allows read and write operations to urls. It fires a "dataChange" event
 * when the content of the url are changed by a write operation from one of the
 * consumers.
 *
 * In addition to these operations the DocumentDataSource also provides a
 * way for consumers to announce data modifications they have done to the
 * contents of the url.
 * Announcing data modifications is done by registering a data modifier that
 * implements a specific API. This API will be called when the DocumentDataSource
 * needs to know if a data modifier has modifications.
 * Modifications are not immediately integrated into the data, only when the
 * DocumentDataSource chooses to. This is to avoid the data modifiers from
 * having to generate the contents of the url everytime they perform a change.
 * Even after being accepted the new contents only remain in memory and an
 * explicit call to write() has to happen for it to be saved.
 *
 * registerDataModifier(dataModifier)
 *
 * dataModifier shape:
 * - hasModifiedData(url) - returns whether there are modifications at the url
 * - acceptModifiedData(url) - returns a pormise to the modified contents of the url
 * - rejectModifiedData(url) - informs the data modifier that another concurrent
 *                             modification was accepted instead.
 */
exports.DocumentDataSource = Target.specialize({
    constructor: {
        value: function DocumentDataSource(environmentBridge) {
            this._data = {};
            this._dataModifiers = [];
            this._environmentBridge = environmentBridge;
        }
    },

    _data: {
        value: null
    },

    _dataModifiers: {
        value: null
    },

    read: {
        value: function(url) {
            var dataModifiers,
                dataModifier,
                newDataFound;

            if (this._data[url]) {
                dataModifiers = this._dataModifiers;
                if (dataModifiers) {
                    for (var i = 0; dataModifier =/*assign*/ dataModifiers[i]; i++) {
                        if (dataModifier.hasModifiedData(url)) {
                            if (newDataFound) {
                                dataModifier.rejectModifiedData(url);
                            } else {
                                this._data[url] = dataModifier.acceptModifiedData(url);
                                newDataFound = true;
                            }
                        }
                    }
                }
            } else {
                this._data[url] = this._read(url);
            }

            return this._data[url];
        }
    },

    _read: {
        value: function(url) {
            return this._environmentBridge.read(url);
        }
    },

    write: {
        value: function(url, content) {
            var self = this,
                dataPromise = this._data[url] || Promise.resolve(null);

            return dataPromise.then(function(currentContent) {
                self._data[url] = Promise.resolve(content);
                self._rejectAllModifiedData(url);
                if (content !== currentContent) {
                    self._dispatchDataChange(url);
                }
                return self._environmentBridge.saveFile(content, url);
            });
        }
    },

    _dispatchDataChange: {
        value: function(url) {
            this.dispatchEventNamed("dataChange", true, false, {
                url: url
            });
        }
    },

    _rejectAllModifiedData: {
        value: function(url) {
            var dataModifiers = this._dataModifiers,
                dataModifier;

            if (dataModifiers) {
                for (var i = 0; dataModifier =/*assign*/ dataModifiers[i]; i++) {
                    if (dataModifier.hasModifiedData(url)) {
                        dataModifier.rejectModifiedData(url);
                    }
                }
            }
        }
    },

    /**
     * Registers a new data modifier that can lazily tell the data source that
     * it has modified the data it read.
     * A data modifier needs to implement the following functions:
     * - hasModifiedData(url): called to check if the data was modified.
     * - acceptModifiedData(url): returns a promise to the modified data.
     * - rejectModifiedData(url): indicates that the data was modified by
     *   another data modifier and this one rejected.
     */
    registerDataModifier: {
        value: function(dataModifier) {
            if (this._dataModifiers) {
                this._dataModifiers.push(dataModifier);
            } else {
                this._dataModifiers = [dataModifier];
            }
        }
    },

    unregisterDataModifier: {
        value: function(dataModifier) {
            var ix = this._dataModifiers.indexOf(dataModifier);

            if (ix >= 0) {
                this._dataModifiers.splice(ix, 1);
            }
        }
    },

    /**
     * Reports if the data source has been modified by a data modifier with
     * changes that haven't been accepted yet.
     * The next call to read() will accept the modified changes and return a
     * modified version of the url contents.
     */
    isModified: {
        value: function(url, ignoreDataModifier) {
            var dataModifiers = this._dataModifiers;
            var dataModifier;

            if (dataModifiers) {
                for (var i = 0; dataModifier =/*assign*/ dataModifiers[i]; i++) {
                    if (dataModifier === ignoreDataModifier) {
                        continue;
                    }
                    if (dataModifier.hasModifiedData(url)) {
                        return true;
                    }
                }
            }

            return false;
        }
    }
});