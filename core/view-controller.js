var Montage = require("montage/core/core").Montage,
    WeakMap = require("montage/collections/weak-map");

exports.ViewController = Montage.create(Montage, {

    didCreate: {
        value: function () {
            this.editorMatchers = [];
            this.matcherEditorTypeMap = new WeakMap();
        }
    },

    matcherEditorTypeMap: {
        enumerable: false,
        value: null
    },

    editorMatchers: {
        enumerable: false,
        value: null
    },

    registerEditorTypeForFileTypeMatcher: {
        value: function (editorType, fileTypeMatcher) {

            if (this.matcherEditorTypeMap.has(fileTypeMatcher)) {
                throw new Error("Already has an editor type registered for this matcher");
            }

            //TODO use one data structure for both of these
            this.editorMatchers.push(fileTypeMatcher);
            this.matcherEditorTypeMap.set(fileTypeMatcher, editorType);
        }
    },

    unregisterEditorTypeForFileTypeMatcher: {
        value: function (fileTypeMatcher) {
            //TODO remove from list/map
            //TODO if any of these types are in use....what do we do with the open editors?
        }
    },

    editorTypeForFileUrl: {
        value: function (fileUrl) {
            var editorType,
                matchResults = this.editorMatchers.filter(function (matcher) {
                    return matcher(fileUrl) ? matcher : false;
                });

            if (matchResults.length) {
                editorType = this.matcherEditorTypeMap.get(matchResults[matchResults.length - 1]);
            }

            return editorType;
        }
    },

    registerExtendedEditorForObjectTypeMatcher: {
        value: function (editor, objectTypeMatcher) {

        }
    },

    unregisterExtendedEditorForObjectTypeMatcher: {
        value: function (objectTypeMatcher) {

        }
    },

    registerContextualInspectorForObjectTypeMatcher: {
        value: function (contextualInspector, objectTypeMatcher) {

        }
    },

    unregisterContextualInspectorForObjectTypeMatcher: {
        value: function (objectTypeMatcher) {

        }
    },

    registerInspectorForObjectTypeMatcher: {
        value: function (inspector, objectTypeMatcher) {

        }
    },

    unregisterInspectorForObjectTypeMatcher: {
        value: function (objectTypeMatcher) {

        }
    },

    registerPropertyInspectorForPropertyTypeMatcher: {
        value: function (propertyInspector, propertyTypeMatcher) {

        }
    },

    unregisterPropertyInspectorForPropertyTypeMatcher: {
        value: function (propertyTypeMatcher) {

        }
    }

});