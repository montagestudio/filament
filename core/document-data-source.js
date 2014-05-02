var Montage = require("montage/core/core").Montage;

exports.DocumentDataSource = Montage.specialize({
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
            return this._environmentBridge.saveFile(content, url);
        }
    },

    /**
     * Registers a new data modifier that can lazily tell the data source that
     * it has modified the data it read.
     * A data modifier needs to implement the following functions:
     * - hasModifiedData: called to check if the data was modified.
     * - acceptModifiedData: returns a promise to the modified data.
     * - rejectModifiedData(data): indicates that the data was modified by
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

    isModified: {
        value: function(url) {
            var dataModifiers = this._dataModifiers;
            var dataModifier;

            if (dataModifiers) {
                for (var i = 0; dataModifier =/*assign*/ dataModifiers[i]; i++) {
                    if (dataModifier.hasModifiedData(url)) {
                        return true;
                    }
                }
            }

            return false;
        }
    }
});