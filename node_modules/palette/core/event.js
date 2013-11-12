var Montage = require("montage").Montage;

// Flyweight implementation of a logged event
// TODO may not end up being necessary as part of palette
exports.Event = Montage.create(Montage, {

    type: {
        value: null
    },

    timestamp: {
        value: null
    },

    target: {
        value: null
    }

});
