var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise;

exports.FileSyncService = Montage.specialize({
    constructor: {
        value: function() {
        }
    },

    isInSync: {
        value: function(_document) {
            return _document.isDirty || _document.codeMirrorDocument.getValue() === _document.content;
        }
    }
});
