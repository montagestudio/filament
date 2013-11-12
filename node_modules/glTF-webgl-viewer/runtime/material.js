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
var Component3D = require("runtime/component-3d").Component3D;

exports.Material = Component3D.specialize( {

    constructor: {
        value: function Material() {
            this.super();
            this.addRangeAtPathChangeListener("filterColor", this, "handleFilterColorChange");
            this.addOwnPropertyChangeListener("glTFElement", this);
            this.addOwnPropertyChangeListener("image", this);
            this.addOwnPropertyChangeListener("opacity", this);
        }
    },

    filterColor: { value: [1,1,1,1]},

    handleGlTFElementChange: {
        value: function() {
            this.handleFilterColorChange();
            this.handleImageChange();
            this.handleOpacityChange();
        }
    },

    handleFilterColorChange: {
        value: function(plus, minus, index) {
            if (this.glTFElement != null) {
                if (this.glTFElement.parameters["filterColor"]) {
                    this.glTFElement.parameters["filterColor"].value = this.filterColor;
                    if (this.scene) {
                        this.scene.dispatchEventNamed("materialUpdate", true, false, this);
                    }
                }
            }
        }
    },

    handleOpacityChange: {
        value: function() {
            if (this.glTFElement != null) {
                if (this.glTFElement.parameters["transparency"]) {
                    this.glTFElement.parameters["transparency"].value = this.opacity;
                    if (this.scene) {
                        this.scene.dispatchEventNamed("materialUpdate", true, false, this);
                    }
                }
            }
        }
    },

    handleImageChange: {
        value: function() {
            if (this.glTFElement != null) {
                if (this.glTFElement.parameters["diffuse"]) {
                    if (this._image) {
                        var imagePath = this.resolvePathIfNeeded(this._image);
                        var parameterValue = this.parameterForImagePath(imagePath);
                        this.glTFElement.parameters["diffuse"] = parameterValue;
                        if (this.scene) {
                            this.scene.dispatchEventNamed("textureUpdate", true, false, parameterValue);
                        }
                    }
                }
            }
        }
    },

    parameterForImagePath: {
        value: function(imagePath) {

            var sampler = {
                "magFilter": "LINEAR",
                "minFilter": "LINEAR",
                "type": "sampler",
                "wrapS" : "REPEAT",
                "wrapT" : "REPEAT"
            };

            var source = {
                "id" : "source-"+ imagePath,
                "type" : "image",
                "baseId" : "source-"+ imagePath,
                "description" : {
                    "path" : imagePath
                }
            };

            var parameterValue = {
                "baseId": "texture-" + imagePath,
                "id": "texture-" + imagePath,
                "format": "RGBA",
                "internalFormat" : "RGBA",
                "sampler" : sampler,
                "source" : source,
                "type" : "texture",
                "target" : "TEXTURE_2D"
            };

            var parameter = {
                "parameter": "diffuse",
                "value" : parameterValue
            };

            return parameter;
        }
    },

    _image: { value: null , writable:true },

    image: {
        set: function(value) {
            if (value) {
                //FIXME: remove this when we initialized property image with the path in place when the glTFElement comes up
                if (value.length == 0) {
                    return;
                }
            } else {
                return;
            }

            var lowerCaseImage = value.toLowerCase();
            if ((lowerCaseImage.indexOf(".jpg") != -1) || (lowerCaseImage.indexOf(".jpeg") != -1) || (lowerCaseImage.indexOf(".png") != -1)) {
                if (this._image != value) {
                    this._image = value;
                }
            }
        },
        get: function() {
            return this._image;
        }
    },

    _opacity: { value: 1., writable:true },

    opacity: {
        set: function(value) {
            if (this._opacity != value) {
                this._opacity = value;
            }
        },
        get: function() {
            return this._opacity;
        }
    }

});
