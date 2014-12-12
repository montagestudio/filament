var Montage = require("montage/core/core").Montage;

exports.FileSyncService = Montage.specialize({
    isInSync: {
        value: function(_document) {
            return _document.isDirty || _document.codeMirrorDocument.getValue() === _document.content;
        }
    }
});
