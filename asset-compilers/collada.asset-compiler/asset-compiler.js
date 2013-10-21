/*global lumieres */
var CoreAssetCompiler = require("filament-asset-compiler/core/asset-compiler").AssetCompiler,
    Connection = require("filament/q-connection"),
    AdaptConnection = require("filament/q-connection/adapt"),
    Q = require("filament/q");

var AssetCompiler = exports.AssetCompiler = CoreAssetCompiler.specialize ({

    constructor: {
        value: function AssetCompiler () {
            this.super();
        }
    }
}, {

    _backend: {
        value: null
    },

    backend: {
        get: function() {
            var self = this;

            if (self._backend == null) {
                var connection = AdaptConnection(new WebSocket("ws://localhost:" + lumieres.nodePort));
                connection.closed.then(function() {
                    self._backend = null;
                });

                self._backend = Connection(connection);
            }

            return self._backend;
        }
    },

    convert: {
        value: function(fileURL) {
            // FIXME: Convert fs:// URLs to paths on the backend
            var preURL = "fs://localhost";
            var filePathURL = fileURL.substring(preURL.length);
            var deferred = Q.defer();
            this.backend.get("collada2gltf").invoke("convert",
                filePathURL).then (function(outputPath) {
                    console.log("outputPath:"+outputPath);
                    deferred.resolve(preURL+outputPath);
                }, function(e)  {
                deferred.reject(e);
            }).done ();
            return deferred.promise;
        }
    }
});
AssetCompiler.assetCompilerRequire = require;
