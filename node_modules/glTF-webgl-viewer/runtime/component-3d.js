// Copyright (c) 2013, Fabrice Robinet
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var Montage = require("montage").Montage;
var glTFNode = require("runtime/glTF-node").glTFNode;
var Target = require("montage/core/target").Target

//FIXME: add a state to now that resolution of id pending to avoid adding useless listeners
//This currently *can't* happen with the code path in use, the API would allow it.
exports.Component3D = Target.specialize( {

    //FIXME: work-around
    self: {
        get: function() {
            return this;
        }
    },

    constructor: {
        value: function Component3D() {
            this._hasUnresolvedId = true;
            this.super();
        }
    },

    _glTFElement: { value : null, writable: true },

    glTFElement: {
        get: function() {
            return this._glTFElement;
        },
        set: function(value) {
            this._glTFElement = value;
        }
    },

    _scene: { value : null, writable: true },

    scene: {
        get: function() {
            return this._scene;
        },
        set: function(value) {
            this._scene = value;
            this._sceneDidChange();
        }
    },

    baseURL: {
        get: function() {
            return this.scene ? this.scene.glTFElement.baseURL : null;
        }
    },

    _isAbsolutePath: {
        value: function(path) {
            var isAbsolutePathRegExp = new RegExp("^"+window.location.protocol, "i");

            return path.match(isAbsolutePathRegExp) ? true : false;
        }
    },

    resolvePathIfNeeded: {
        value: function(path) {
            if (this._isAbsolutePath(path)) {
                return path;
            }

            return this.baseURL + path;
        }
    },

    _hasUnresolvedId: { value: false, writable: true },

    handleStatusChange: {
        value: function(status, key, object) {
            if (status === "loaded") {
                if (this._id) {
                    this.glTFElement = this.scene.glTFElement.ids[this._id];

                    if (this.glTFElement) {
                        this._hasUnresolvedId = false;
                        //console.log("node attached to element with id:"+this._id);
                    }
                }
            }
        }
    },

    resolveIdIfNeeded: {
        value: function() {
            if (this._hasUnresolvedId && this.scene != null) {
                if (this.scene.status !== "loaded") {
                    this.scene.addOwnPropertyChangeListener("status", this);
                    return;
                }

                if (this._id) {
                    if (this.scene.status === "loaded") {
                        this.glTFElement = this.scene.glTFElement.ids[this._id];
                        if (this.glTFElement) {
                            this._hasUnresolvedId = false;
                            //console.log("node attached to element with id:"+this._id);
                        }
                    }
                }
            }
        }
    },

    _idDidChange: {
        value: function() {
            this.resolveIdIfNeeded();
        }
    },

    _sceneDidChange: {
        value: function() {
            this.resolveIdIfNeeded();
        }
    },

    _id: { value: null,  writable: true },

    id: {
        enumerable: true,
        get: function() {
            return this._id;
        },

        set: function(value) {
            if (value != this._id) {
                this._id = value;
                this._idDidChange();
            }
        }
    },

    initWithScene: {
        value: function(scene) {
            this.scene = scene;
            return this;
        }
    },

    blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

    blueprint:require("montage")._blueprintDescriptor

});
