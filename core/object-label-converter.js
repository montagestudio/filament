var Converter = require("montage/core/converter/converter").Converter;

exports.ObjectLabelConverter = Converter.specialize({

    editingDocument: {
        value: null
    },

    allowPartialConversion: {
        value: false
    },

    convert: {
        value: function (object) {
            var value;
            if (object) {
                value = "@" + object.label;
            }

            return value;
        }
    },

    revert: {
        value: function (string) {
            var value,
                label;

            if (string) {
                label = string.replace(/^@/, "");
                value =  this.editingDocument.editingProxyMap[label];
            }

            return value;

        }
    }

});
