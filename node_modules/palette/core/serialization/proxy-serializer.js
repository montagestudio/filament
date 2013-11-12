var ProxyVisitor = require("./proxy-visitor").ProxyVisitor;
var Malker = require("mousse/serialization/malker").Malker;
var MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

exports.ProxySerializer = MontageSerializer.specialize({

    constructor: {
        value: function ProxySerializer() {
            this.super();
        }
    },

    initWithRequire: {
        value: function (_require) {
            //TODO use the MontageSerializer from the specified require
            var self = MontageSerializer.initWithRequire.call(this, _require);

            self._visitor = new this.visitorConstructor().initWithBuilderAndLabelerAndRequireAndUnits(
                self._builder,
                self._labeler,
                self._require,
                self._units);

            self._malker = new Malker(self._visitor);

            return self;
        }
    },

    /*
     * Return a visitor constructor
     * <b>Note:</b> This need to be overwritten to make something useful
     */
    visitorConstructor: {
        value: ProxyVisitor
    }

});
