/**
 @module "./editor.reel"
 @requires montage
 @requires palette/ui/editor.reel
 */
var Montage = require("montage").Montage;
var BlueprintDocument = require("core/blueprint-document").BlueprintDocument;
var Editor = require("palette/ui/editor.reel").Editor;

/**
 Description TODO
 @class module:"./Editor.reel".Editor
 @extends module:palette/ui/editor.reel.Editor
 */
exports.BlueprintEditor = Montage.create(Editor, /** @lends module:"./viewer.reel".Viewer# */ {

    /*
     * Create and load the document.<br/>
     * <b>Note:</> This must be overwritten by sub classes
     * @returns By default a rejected promise.
     */
    loadDocument:{
        value:function (fileUrl, packageUrl) {
            return BlueprintDocument.load(fileUrl, packageUrl);
        }
    }

});
