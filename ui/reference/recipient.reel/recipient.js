/**
 * @module ui/reference/recipient.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;
var TranslateComposer = require("montage/composer/translate-composer").TranslateComposer;
var sharedReferenceManager = require("../../../core/reference-manager").sharedReferenceManager;
var MimeTypes = require("core/mime-types");

/**
 * @class Recipient
 * @extends Component
 */
exports.Recipient = Component.specialize(/** @lends Recipient# */ {
    constructor: {
        value: function Outlet() {
            this.super();
            this.defineBinding("classList.has('is-active')", {"<-": "_isActive"});
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                // As the recipient
                this._translateComposer = new TranslateComposer();
                this._translateComposer.identifier = "reference";
                this._translateComposer.hasMomentum = false;
                this.addComposerForElement(this._translateComposer, this.element);
            }
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this, false);
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);
        }
    },

// As the recipient

    handleReferenceTranslateStart: {
        value: function (event) {
            this._session = sharedReferenceManager.startSession(this);
            this._isActive = true;
            // update the session with start position of mouse
            this._session.startPosition(event.clientX, event.clientY);
            // delegate method to let the delegate populate desired types

            var types = this.callDelegateMethod("recipientAcceptsTypes", this);
            if (!types) {
                types = [MimeTypes.SERIALIZATION_OBJECT_LABEL];
            }
            this._session.setAcceptedTypes(types);

            //TODO make activeTarget to respond to esc key
        }
    },

    handleReferenceTranslate: {
        value: function (event) {
            // update the session with current position of mouse
            this._session.position(event.clientX, event.clientY);
        }
    },

    handleReferenceTranslateEnd: {
        value: function () {
            this._isActive = false;
            var data = sharedReferenceManager.endSession(this._session);
            // if data then use it to tell the delegate
            if(data) {
                console.log("didReceiveReference",data);
                this.callDelegateMethod("didReceiveReference", this, data);
            }
        }
    },

    handleReferenceTranslateCancel: {
        value: function () {
            this._isActive = false;
            sharedReferenceManager.endSession(this._session);
        }
    },

    delegate: {
        value: null
    },

    _session: {
        value: null
    },

    _translateComposer: {
        value: null
    },

    _isActive: {
        value: false
    }

});
