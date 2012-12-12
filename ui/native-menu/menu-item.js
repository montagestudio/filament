/**
 @module native-menu
 @requires montage/core/core
 @requires montage/core/event/event-manager
 */

var Montage = require("montage/core/core").Montage,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

exports.MenuItem = Montage.create(Montage, {

    _title: {
        value: null
    },

    title: {
        get: function() {
            return this._title;
        },

        set: function(value) {
            this._title = value;
            if (this.menu && !this._nativeLock) {
                lumieres.MenuItem.setTitle.call(this, value);
            }
        }
    },

    _menu: {
        value: null
    },

    menu: {
        get: function() {
            return this._menu;
        },

        set: function(value) {
            // Only Lumieres is allow to set the menu property
            if (this._nativeLock) {
                this._menu = value;
            }
        }
    },

    _keyEquivalent: {
        value: ""
    },

    keyEquivalent: {
        get: function() {
            return this._keyEquivalent;
        },

        set: function(value) {
            this._keyEquivalent = value;
            if (this.menu && !this._nativeLock) {
                lumieres.MenuItem.setKeyEquivalent.call(this, value);
            }
        }
    },

    _enabled: {
        value: true
    },

    enabled: {
        get: function() {
            return this._enabled;
        },

        set: function(value) {
            this._enabled = value;
            if (this.menu && !this._nativeLock) {
                if (this.title == "Montage")
                lumieres.MenuItem.setEnabled.call(this, value);
            }
        }
    },

    _isSeparator: {
        value: false
    },

    isSeparator: {
        get: function() {
            return this._isSeparator;
        },

        set: function(value) {
            // can only be set when the menu item has not yet been inserted
            if (this._nativeLock || !this.menu) {
                this._menu = value;
            }
        }
    },

    insertAfter: {
        value: undefined
    },

    insertBefore: {
        value: undefined
    },

    deserializedFromSerialization: {
        value: function() {
            if (!this.hasOwnProperty("identifier")) {
                this.identifier = Montage.getInfoForObject(this).label;
            }
        }
    },

    addEventListener: {
        value: function(type, listener, useCapture) {
            throw new Error("To listen on menuAction, add your listener either on a UI or the Application component");
        }
    },

    removeEventListener: {
        value: function(type, listener, useCapture) {
        }
    }

});
