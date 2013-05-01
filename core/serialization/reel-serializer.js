var Montage = require("montage").Montage;
var ReelVisitor = require("./reel-visitor").ReelVisitor;
var ProxySerializer = require("palette/core/serialization/proxy-serializer").ProxySerializer;

exports.ReelSerializer = Montage.create(ProxySerializer, {

    /*
     * Return a newly created visitor for the proxies
     */
    newVisitor: {
        get: function () {
            return ReelVisitor.create();
        }
    }

});
