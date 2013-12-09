(function () {
    var Pos = CodeMirror.Pos;

    function serializationHint(editor, options) {
        var cursor = editor.getCursor(),
            token = editor.getTokenAt(cursor);

        if (token.type === "module") {
            var hasEndQuote = token.string.slice(-1) === '"';
            token = {
                // strip the quotes
                start: token.start + 1,
                end: token.end - (hasEndQuote ? 1 : 0),
                type: token.type,
                string: token.string.slice(1, cursor.ch - token.start)
            }
        }

        return {
            list: getCompletions(token, options),
            from: Pos(cursor.line, token.start),
            to: Pos(cursor.line, token.end)
        };
    }

    CodeMirror.registerHelper("hint", "montageserialization", serializationHint);

    function getCompletions(token, options) {
        var symbols,
            string = token.string;

        if (token.type === "module") {
            symbols = options.serializationModules;
        } else {
            return [];
        }

        if (string) {
            return symbols.filter(function(symbol) {
                return symbol.indexOf(string) === 0;
            });
        } else {
            return symbols;
        }
    }
})();