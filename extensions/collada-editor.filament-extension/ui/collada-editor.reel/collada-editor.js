var Montage = require("montage").Montage,
    Editor = require("palette/ui/editor.reel").Editor;

exports.ColladaEditor = Montage.create(Editor, {

    captureResize: {
        value: function(evt) {
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function() {
            if (this.templateObjects) {
                //FIXME:(FR) "manual" propagation the size of the editor slot to the colladaView.
                //WebGL viewport needs this information.
                if (this.templateObjects.colladaView) {
                    this.templateObjects.colladaView.width = this.element.parentElement.offsetWidth;
                    this.templateObjects.colladaView.height = this.element.parentElement.offsetHeight;
                }
            }
        }
    },

    enterDocument: {
        value: function() {
            window.addEventListener("resize", this, true);
        }
    },

    exitDocument: {
        value: function() {
            window.removeEventListener("resize", this, true);
        }
    }


});
