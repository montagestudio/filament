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
        value: function (session, expectedType) {
            var reference = this.callDelegateMethod("provideReference", this, expectedType);
            this.leave();
            return reference;
        }
    },

    enter: {
        value: function (session) {
            if(!sharedReferenceManager.hasSession) {
                return;
            }
            this._mouseIsOver = true;
            // see if the ReferenceManger's session needs anything we could provide.
            // if it does register with RM, on commit it will ask for the data and send it to the recipient.

            var expectedType = this.callDelegateMethod("canProvideReference", this, session._acceptTypes);

            if (expectedType) {
                var registrationSuccessful = sharedReferenceManager.registerActiveSource(this, expectedType);
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
