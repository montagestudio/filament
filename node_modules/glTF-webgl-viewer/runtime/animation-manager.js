// Copyright (c) 2013, Fabrice ROBINET
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

require("runtime/dependencies/gl-matrix");
var Base = require("runtime/base").Base;
var Animation = require("runtime/animation").Animation;

exports.AnimationManager = Object.create(Base, {

    _animations: { value: null, writable: true },

    animations: {
        get: function() {
            return this._animations;
        },
        set: function(value) {
            if (this._animations != value) {
                this._animations = value;
            }
        }
    },

    targets: {
        get: function() {
            var targets = [];
            if (this._animations != null) {
                this._animations.forEach(function(animation) {
                    animation.channels.forEach(function(channel) {
                        targets.push(channel.target.id);
                    }, this);
                }, this);
            }
            return targets;
        }
    },

    hasAnimation: {
      value: function(targetUID, targets) {
          //it is a forEach, because eventually we will return all the animations for a given target.
          var animated = false;
          if (this._animations == null)
              return false;
          if (targets == null)
              targets = this.targets;

          return targets.indexOf(targetUID) !== -1;
        }
    },

    nodeHasAnimatedAncestor: {
        value: function(node) {
            do {
                if (this.hasAnimation(node.id)) {
                    return true;
                }
                node = node.parent;
            } while (node != null);
            return false;
        }
    },

    updateTargetsAtTime: {
        value: function(time, resourceManager) {
            if (this.animations) {
                this.animations.forEach( function(animation) {
                    animation.updateTargetsAtTime(time, resourceManager);
                }, this);
            }
        }
    },

    init: {
        value: function() {
            this.__Base_init();
            this.animations = [];
            return this;
        }
    }

});
