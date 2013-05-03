var Montage = require("montage").Montage,
    Converter = require("montage/core/converter/converter").Converter;

exports.ObjectLabelConverter = Montage.create(Converter, {

    editingDocument: {
        value: null
    },

    allowPartialConversion: {
        value: false
    },

    convert: {
        value: function (object) {
            console.log("convert object", object);
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
