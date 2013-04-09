var Montage = require("montage").Montage;
var ReelVisitor = require("./reel-visitor").ReelVisitor;
var Malker = require("mousse/serialization/malker").Malker;
var MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

exports.ReelSerializer = Montage.create(MontageSerializer, {

    initWithRequire: {
        value: function(_require) {
            //TODO use the MontageSerializer from the specified require
            var self = MontageSerializer.initWithRequire.call(this, _require);

            self._visitor = ReelVisitor.create().initWithBuilderAndLabelerAndRequireAndUnits(
                self._builder,
                self._labeler,
                self._require,
                self._units);

            self._malker = new Malker(self._visitor);

            return self;
        }
    }

});
