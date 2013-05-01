var Montage = require("montage").Montage;
var BlueprintVisitor = require("./blueprint-visitor").BlueprintVisitor;
var ProxySerializer = require("palette/core/serialization/proxy-serializer").ProxySerializer;

exports.BlueprintSerializer = Montage.create(ProxySerializer, {

    /*
     * Return a newly created visitor for the proxies
     */
    newVisitor: {
        get: function () {
            return BlueprintVisitor.create();
        }
    }

});
