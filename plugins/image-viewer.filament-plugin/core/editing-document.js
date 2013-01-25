var Montage = require("montage").Montage,
    UndoManager = require("montage/core/undo-manager").UndoManager;

exports.EditingDocument = Montage.create(Montage, {

    title: {
        dependencies: ["reelUrl"],
        get: function () {
            return this.reelUrl.substring(this.reelUrl.lastIndexOf("/") + 1);
        }
    },

    undoManager: {
        value: null
    },

    _reelUrl: {
        value: null
    },

    _packageUrl: {
        value: null
    },

    reelUrl: {
        get: function () {
            return this._reelUrl;
        }
    },

    packageUrl: {
        get: function () {
            return this._packageUrl;
        }
    },

    init: {
        value: function (reelUrl, packageUrl) {

            this._reelUrl = reelUrl;
            this._packageUrl = packageUrl;

            this.undoManager = UndoManager.create();
            return this;
        }
    }

});
