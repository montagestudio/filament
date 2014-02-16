var Montage = require("montage").Montage,

    DEPENDENCY_STATE_LABELS = {
        HAS_ERRORS: "errors",
        HAS_UPDATE: "update available",
        PENDING_REMOVAL: "pending removal",
        PENDING_INSTALL: "pending install",
        ACCEPT_INSTALL: "not installed"
    };

var Dependency = function Dependency(name, version, type) {
    this.name = name;
    this.version = version;
    this.type = type;
    this.missing = true;
    this.state = new DependencyState(this);
};

Object.defineProperties(Dependency, {

    INSTALL_DEPENDENCY_ACTION: {
        value: 0,
        enumerable: true
    },

    REMOVE_DEPENDENCY_ACTION: {
        value: 1,
        enumerable: true
    },

    UPDATE_DEPENDENCY_ACTION: {
        value: 2,
        enumerable: true
    },

    ERROR_INSTALL_DEPENDENCY_ACTION: {
        value: 3,
        enumerable: true
    },

    INSTALLING_DEPENDENCY_ACTION: {
        value: 4,
        enumerable: true
    }

});

var DependencyState = Montage.specialize({

    constructor: {
        value: function DependencyStates(dependency) {
            this.super();

            if (!dependency) {
                throw new Error("Cannot instantiate a new DependencyStates object with:" + dependency);
            }

            this._dependency = dependency;
            this.acceptInstall = this.canBeMissing;

            this.addPathChangeListener("_dependency.update", this, "_updateStateMessage");
        }
    },

    _dependency: {
        value: null
    },

    _pendingRemoval: {
        value: null
    },

    pendingRemoval: {
        set: function (flag) {
            this._pendingRemoval = !!flag;
            this._pendingInstall = false;
            this.acceptInstall = this._pendingRemoval;

            this._updateStateMessage();
        },
        get: function () {
            return this._pendingRemoval;
        }
    },

    _pendingInstall: {
        value: null
    },

    pendingInstall: {
        set: function (flag) {
            this._pendingInstall = !!flag;
            this._pendingRemoval = false;
            this.acceptInstall = false;

            this._updateStateMessage();
        },
        get: function () {
            return this._pendingInstall;
        }
    },

    hasErrors: {
        get: function () {
            var module = this._dependency;
            return module && Array.isArray(module.problems) && module.problems.length > 0;
        }
    },

    hasUpdate: {
        get: function () {
            return this._dependency && this._dependency.update;
        }
    },

    acceptInstall: {
        value: null
    },

    canBeMissing: { // within the package.json but not mandatory
        get: function () {
            var module = this._dependency;
            return module && module.type !== "dependencies" && module.missing
        }
    },

    _updateStateMessage: {
        value: function () {
            var message = null;

            if (this.pendingRemoval) {
                message = DEPENDENCY_STATE_LABELS.PENDING_REMOVAL;
            } else if (this.pendingInstall) {
                message = DEPENDENCY_STATE_LABELS.PENDING_INSTALL;
            } else if (this.hasErrors) {
                message = DEPENDENCY_STATE_LABELS.HAS_ERRORS;
            } else if (this.hasUpdate) {
                message = DEPENDENCY_STATE_LABELS.HAS_UPDATE;
            } else if (this.acceptInstall) {
                message = DEPENDENCY_STATE_LABELS.ACCEPT_INSTALL;
            }

            this.message = message;
        }
    },

    message: {
        value: null
    }
});


exports.Dependency = Dependency;
exports.DependencyState = DependencyState;
