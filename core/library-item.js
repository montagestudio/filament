var Montage = require("montage").Montage;

//This is a straight transfer from the original components.js dictionary
//TODO replace this with a component perhaps? it would make for a natural container for the default
// template...when we are actually inserting a component
exports.LibraryItem = Montage.create(Montage, {

    moduleId: {
        value: null
    },

    name: {
        value: null
    },

    //The human readable label for this LibraryItem
    label: {
        value: null
    },

    // Properties to set on the object being added to the template
    properties: {
        value: null
    },

    // URL for the editor icon
    // TODO offer a generic fallback?
    icon: {
        value: null
    },

    // Optional HTML to insert within template for this libraryItem
    html: {
        value: null
    },

    // Action to take after addedTo the template
    //TODO rename didAddToTemplate?
    postProcess: {
        value: null
    }

});