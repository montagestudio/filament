var Montage = require('montage').Montage;

exports.SceneEditorController = Montage.specialize({

    hasEditor: {
        value: true
    },

    editorComponent: {
        value: function () {
            return require.async("ui/editor.reel").get("Editor");
        }
    }

});
