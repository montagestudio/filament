/*global lumieres */
var Montage = require("montage/core/core").Montage,
    CoreAssetCompiler = require("filament-asset-compiler/core/asset-compiler").AssetCompiler,
    Promise = require("montage/core/promise").Promise,
    Connection = require("filament/q-connection"),
    AdaptConnection = require("filament/q-connection/adapt"),
    Q = require("filament/q");

var AssetCompiler = exports.AssetCompiler = Montage.create(CoreAssetCompiler, {

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
