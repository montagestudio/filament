/**
 @module "./editor.reel"
 @requires montage
 @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    BlueprintDocument = require("core/blueprint-document").BlueprintDocument,
    Promise = require("montage/core/promise").Promise;

/**
 Description TODO
 @class module:"./Editor.reel".Editor
 @extends module:montage/ui/component.Component
 */
exports.BlueprintEditor = Montage.create(Component, /** @lends module:"./viewer.reel".Viewer# */ {

    _currentDocument:{
        value:null
    },

    currentDocument:{
        get: function() {
            return this._currentDocument;
        }
    },

    load:{
        value:function (fileUrl, packageUrl) {
            var self = this;
            return BlueprintDocument.load(fileUrl, packageUrl).then(function (document) {
                self.dispatchBeforeOwnPropertyChange("currentDocument", this._currentDocument);
                self._currentDocument = document;
                self.dispatchOwnPropertyChange("currentDocument", document);
                return document ;
            });
        }
    }

});
