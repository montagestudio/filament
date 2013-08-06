var Converter = require("montage/core/converter/converter").Converter;

exports.CardinalityConverter = Converter.specialize({
    convert: {
        value: function (cardinality) {
            return cardinality > 1;
        }
    },

    revert: {
        value: function (isToMany) {
            return isToMany ? Infinity : 1;
        }
    }
});
