var Montage = require("montage/core/core").Montage,
    WeakMap = require("montage/collections/weak-map");

exports.ViewController = Montage.specialize({

    constructor: {
        value: function ViewController() {
            this.editorMatchers = [];
            this.matcherEditorTypeMap = new WeakMap();

            this.modalEditorMatchers = [];
            this.matcherModalEditorTypeMap = new WeakMap();
        }
    },

    // Editor Registration

    matcherEditorTypeMap: {
        enumerable: false,
        value: null
    },

    editorMatchers: {
        enumerable: false,
        value: null
    },

    /**
     * Registers an editor prototype to be used when the specified fileTypeMatcher returns true
     *
     * @param {Prototype} editorType A Prototype to use build editors
     * @param {function} fileTypeMatcher A function that tests whether or not a provided fileUrl can be opened by the editorType
     */
    registerEditorTypeForFileTypeMatcher: {
        value: function (editorType, fileTypeMatcher) {

            if (!(editorType && fileTypeMatcher)) {
                throw new Error("Both an editor and a matcher function are needed to register");
            }

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

    // Modal Editor Registration

    matcherModalEditorTypeMap: {
        enumerable: false,
        value: null
    },

    modalEditorMatchers: {
        enumerable: false,
        value: null
    },

    registerModalEditorTypeForObjectTypeMatcher: {
        value: function (editorType, objectTypeMatcher) {
            if (!(editorType && objectTypeMatcher)) {
                throw new Error("Both an modal editor type and a matcher function are needed to register");
            }

            if (this.matcherModalEditorTypeMap.has(objectTypeMatcher)) {
                throw new Error("Already has an modal editor type registered for this matcher");
            }

            //TODO use one data structure for both of these
            this.modalEditorMatchers.push(objectTypeMatcher);
            this.matcherModalEditorTypeMap.set(objectTypeMatcher, editorType);
        }
    },

    unregisterModalEditorTypeForObjectTypeMatcher: {
        value: function (objectTypeMatcher) {
            //TODO implement this
        }
    },

    modalEditorTypeForObject: {
        value: function (object) {
            var editorType,
                matchResults = this.modalEditorMatchers.filter(function (matcher) {
                    return matcher(object) ? matcher : false;
                });

            if (matchResults.length) {
                editorType = this.matcherModalEditorTypeMap.get(matchResults[matchResults.length - 1]);
            }

            return editorType;
        }
    },

    // Inspector inspector

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
