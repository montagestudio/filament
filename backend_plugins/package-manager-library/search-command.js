var PackageManagerError = require("./core").PackageManagerError,
    Tools = require("./package-manager-tools").PackageManagerTools,
    PackageManagerRegistry = require("./package-manager-registry").PackageManagerRegistry,
    SearchCommand =  function searchCommand () {},

    RANK_EXACT_NAME = 30,
    RANK_EXACT_NAME_WITH_VERSION = 20,
    RANK_SPLIT_NAME_MAX = 10,
    RANK_SPLIT_NAME_MIN = 2,
    RANK_APROX_NAME_MAX = 7,
    RANK_KEYWORD_MAX = 10,
    RANK_EXACT_AUTHOR_NAME = 8,
    RANK_APROX_AUTHOR_NAME = 3,
    CRITICAL_LENGTH = 2,
    MAX_RESULTS = 300,

    ERROR_NAME_TYPE = 5000,
    ERROR_INVALID_REQUEST = 5001;

/**
 * Prepares the search command, then invokes it.
 * @function
 * @param {String} name the dependency name to search.
 * @return {Promise.<Object>} Promise for the searched package.
 */
SearchCommand.prototype.run = function (name) {
    if (typeof name === 'string' && name.length > 0) {
        name = name.trim().toLowerCase();
    } else {
        throw new PackageManagerError("Dependency name invalid", ERROR_NAME_TYPE);
    }

    if (Tools.isNameValid(name, false)) {
        return this._invokeSearchCommand(name);
    } else {
        throw new PackageManagerError("The request is invalid", ERROR_INVALID_REQUEST);
    }
};

/**
 * Invokes the search command.
 * @function
 * @param {String} search the dependency name to search.
 * @return {Promise.<Object>} Promise for the searched package.
 * @private
 */
SearchCommand.prototype._invokeSearchCommand = function (search) {
    var self = this;

    return PackageManagerRegistry.search(search).then(function (results) {
        return self.rankResults(search, results);
    });
};

SearchCommand.prototype.rankResults = function (search, results) {
    for (var i = results.length - 1; i >= 0; i--) {
        var row = results[i],
            name = row.name.toLowerCase(),
            description = row.description,
            keywords = row.keywords,
            maintainers = row.maintainers,
            author = row.author;

        row.rank = this._rankName(search, name);

        if (keywords) {
            row.rank += this._rankKeywords(search, keywords);
        }

        if (description) {
            row.rank += this._rankDescription(search, description.toLowerCase());
        }

        if (author) {
            row.rank += this._rankAuthor(search, author.toLowerCase());
        }

        if (maintainers) {
            for (var j = 0, len = maintainers.length; j < len; j++) {
                row.rank += this._rankAuthor(search, maintainers[j].toLowerCase());
            }
        }
    }

    return this._clearResults(results.sort(this._sortResults));
};

SearchCommand.prototype._clearResults = function (results) {
    var resultsCleared = [];

    for (var i = 0, length = results.length; i < length; i++) {
        var result = results[i];

        if (result.rank <= CRITICAL_LENGTH || i === MAX_RESULTS) {
            break;
        }
        resultsCleared.push(result);
    }

    return resultsCleared;
};

SearchCommand.prototype._rankName = function (search, name) {
    if (search === name) {
        return RANK_EXACT_NAME;
    }

    if (new RegExp("^" + search + "[0-9]+$").test(name)) { // name[version]
        return RANK_EXACT_NAME_WITH_VERSION;
    }

    if (new RegExp(search).test(name)) {
        var number = name.split(/[\-\.~]/);

        if (number.length > 1 && number.indexOf(search) >= 0) {
            number = RANK_SPLIT_NAME_MAX - number.length;
            return number >= RANK_SPLIT_NAME_MIN ? number : RANK_SPLIT_NAME_MIN;
        }
        return Math.ceil(search.length / name.length * RANK_APROX_NAME_MAX);
    }

    return 0;
};

SearchCommand.prototype._rankKeywords = function (search, keywords) {
    var rank = 0,
        length = keywords.length;

    for (var i = length - 1; i >= 0; i--) {
        var keyword = keywords[i].toLowerCase();

        if (keyword === search) {
            rank = RANK_KEYWORD_MAX;
            break;
        }
    }

    if (rank > 0) {
        rank = (length >= rank) ? 1 : rank - length;
    }

    return rank;
};

SearchCommand.prototype._rankDescription = function (search, description) {
    var count = null;

    if (search.length > CRITICAL_LENGTH) {
        count = description.match(new RegExp(search, "g"));
    } else {
        count = description.match(new RegExp("\\b" + search + "\\b", "g")); // exact
    }

    return count ? count.length : 0;
};

SearchCommand.prototype._rankAuthor = function (search, author) {
    if (author === search) {
        return RANK_EXACT_AUTHOR_NAME;
    }

    var count = null;

    if (search.length > CRITICAL_LENGTH) {
        count = author.match(new RegExp(search));
    }

    return count ? RANK_APROX_AUTHOR_NAME : 0;
};

SearchCommand.prototype._sortResults = function (a, b) {
    function sortName (a, b) {
        return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
    }

    var value = b.rank - a.rank;
    return (value !== 0) ? value : sortName(a, b);
};

exports.searchCommand = new SearchCommand();
