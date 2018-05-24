var HttpService = require("montage/data/service/http-service").HttpService;

var LINK_HEADER_PART_REGEX = /<(.+)>; rel="(.+)"/;

/**
 * Github APIs return most of their data paginated. The initial response only
 * contains a fixed number of results and a "Link" header containing the next
 * and last urls. This service abstracts that away by fetching all data from
 * all pages before returning.
 */
exports.GithubHttpService = HttpService.specialize({

    /**
     * @override HttpService._fetchHttpRawDataWithParsedArguments
     */
    _fetchHttpRawDataWithParsedArguments: {
        value: function (parsed, lastPageUrl) {
            var self = this,
            error, request;

            if (!parsed) {
                error = new Error("Invalid arguments to fetchHttpRawData()");
            } else if (!parsed.url) {
                error = new Error("No URL provided to fetchHttpRawData()");
            }

            return this._fetchHttpWithParsedArguments(parsed)
                .then(function (request) {
                    var response = parsed.types[0].parseResponse(request, parsed.url);
                    var linkHeader = request.getResponseHeader("Link");
                    if (linkHeader && Array.isArray(response) && parsed.url !== lastPageUrl) {
                        var link = self._parseLinkHeader(linkHeader);
                        parsed.url = link.next;
                        return self._fetchHttpRawDataWithParsedArguments(parsed, link.last)
                            .then(function (tailData) {
                                return response.concat(tailData);
                            })
                    } else {
                        return response;
                    }
                });
        }
    },

    _fetchHttpWithParsedArguments: {
        value: function (parsed) {
            var self = this,
            error, request;

            if (!parsed) {
                error = new Error("Invalid arguments to fetchHttpRawData()");
            } else if (!parsed.url) {
                error = new Error("No URL provided to fetchHttpRawData()");
            }

            return new Promise(function (resolve, reject) {
                var i, keys, key;

                // Report errors or fetch the requested raw data.
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    request = new XMLHttpRequest();
                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            resolve(request);
                        }
                    };
                    request.onerror = function () {
                        error = HttpError.withRequestAndURL(request, parsed.url);
                        reject(error);
                    };
                    request.open(parsed.body ? "POST" : "GET", parsed.url, true);

                    self.setHeadersForQuery(parsed.headers, parsed.query, parsed.url);

                    keys = Object.keys(parsed.headers);
                    for (i = 0; (key = keys[i]); ++i) {
                        request.setRequestHeader(key, parsed.headers[key]);
                    }
                    request.withCredentials = parsed.credentials;
                    request.send(parsed.body);
                }
            }).then(function () {
                // The response status can be 0 initially even for successful
                // requests, so defer the processing of this response until the
                // next event loop to give the status time to be set correctly.
                return self.eventLoopPromise;
            }).then(function () {
                // Log a warning for error status responses.
                // TODO: Reject the promise for error statuses.
                if (self._isRequestUnauthorized(request) && typeof self.authorize === "function") {
                    return self.authorize().then(function () {
                        return self._fetchHttpRawDataWithParsedArguments(parsed);
                    });
                } else if (!error && (request.status >= 300 || request.status === 0)) {
                    // error = new Error("Status " + request.status + " received for REST URL " + parsed.url);
                    // console.warn(error);
                    throw HttpError.withRequestAndURL(request, parsed.url);
                }
                return request;
            });
        }
    },

    _parseLinkHeader: {
        value: function (linkHeader) {
            var link = {};
            var parts = linkHeader.split(", ");
            parts.forEach(function (part) {
                var match = part.match(LINK_HEADER_PART_REGEX);
                link[match[2]] = match[1];
            });
            return link;
        }
    },
});
