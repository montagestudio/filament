var Dependency = function Dependency(name, version, type) {
    this.name = name;
    this.version = version;
    this.type = type;
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

exports.Dependency = Dependency;
