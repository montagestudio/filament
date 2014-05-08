var Composer = require("montage/composer/composer").Composer;
var sharedReferenceManager = require("../../../core/reference-manager").sharedReferenceManager;

exports.ReferenceSource = Composer.specialize(/** @lends ReferenceSource# */ {

    // Load/unload

    load: {
        value: function () {
            sharedReferenceManager.registerSourceForElement(this, this.element);
        }
    },

    unload: {
        value: function () {
            sharedReferenceManager.unregisterSourceForElement(this, this.element);
        }
    },


    provideReference: {
        value: function (session) {
            return this.callDelegateMethod("provideReference", this, session);
        }
    },

    enter: {
        value: function () {
            if(!sharedReferenceManager.hasSession) {
                return;
            }
            this._mouseIsOver = true;
            // see if the ReferenceManger's session needs anything we could provide.
            // if it does register with RM, on commit it will ask for the data and send it to the recipient.
            if (!!this.callDelegateMethod("canProvideReference", this, this._session)) {
                var registrationSuccessful = sharedReferenceManager.registerActiveSource(this);
                if (registrationSuccessful) {
                    this._canAcceptReference = true;
                    this.callDelegateMethod("acceptingReference", this);
                } else {
                    console.error("Source failed to register as active outlet");
                    this._canAcceptReference = false;
                }
            }
        }
    },

    leave: {
        value: function () {
            if (!this._mouseIsOver) {
                return;
            }
            // unregister with RM if needed
            sharedReferenceManager.unregisterActiveSource(this);
            this._canAcceptReference = false;
            this.callDelegateMethod("resigningReference", this);
            //TODO unregister with RM if needed see above
        }
    },

    _canAcceptReference: {
        value: false
    },

    _mouseIsOver: {
        value: false
    },

    delegate: {
        value: null
    }
});
