/**
 * @module ui/add-dependency-overlay.reel
 * @requires montage/ui/component
 */
var Overlay = require("montage/ui/overlay.reel/").Overlay,
    Tools = require('../../../core/package-tools').ToolsBox;

/**
 * @class AddDependencyOverlay
 * @extends Overlay
 */
exports.AddDependencyOverlay = Overlay.specialize(/** @lends AddDependencyOverlay# */ {

    constructor: {
        value: function AddDependencyOverlay() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    show: {
        value: function () {
            Overlay.show.call(this);
            this.url = this.version = this.name = null;
            this.templateObjects.regular.checked = true;
        }
    },

    _name: {
        value: null
    },

    name: {
        set: function (name) {
            this._name = (typeof name === "string") ? name : null;
        },
        get: function () {
            return this._name;
        }
    },

    _version: {
        value: null
    },

    version: {
        set: function (version) {
            this._version = (typeof version === "string") ? version : null;
            if (this._version && this._url) {
                this.url = null;
            }
        },
        get: function () {
            return this._version;
        }
    },

    _url: {
        value: null
    },

    url: {
        set: function (url) {
            this._url = (typeof url === "string") ? url : null;

            if (this._url) {
                this.name = Tools.findModuleNameFormGitUrl(this._url);

                if (this._version) {
                    this.version = null;
                }
            }
        },
        get: function () {
            return this._url;
        }
    },

    type: {
        value: null
    },

    _checkValidity: {
        value: function () {
            return (this.templateObjects.installDependencyName.element.validity.valid &&
                this.templateObjects.installDependencyVersion.element.validity.valid &&
                this.templateObjects.installDependencyUrl.element.validity.valid);
        }
    },

    handleInstallManuallyDependencyAction: {
        value: function () {
            if (this.editingDocument && this._name && this._name.length > 0 && this._checkValidity()) {
                if (!this.editingDocument.findDependency(this._name)) { // Fixme, temporary fix, to avoid to override dependencies.
                    this.editingDocument.installDependency(this._name, this._url || this._version, this.type);
                }

                this.hide();
            }
        }
    }

});
