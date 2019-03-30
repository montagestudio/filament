(function () {
    var Pos = CodeMirror.Pos;

    var serializationUnits = ["prototype", "object", "properties", "bindings", "listeners"];
    var stringTypes = {"module": 1, "unit": 1, "montage-property-name": 1};

    function serializationHint(editor, options) {
        var cursor = editor.getCursor(),
            token = editor.getTokenAt(cursor);

        token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;

        if (stringTypes.propertyIsEnumerable(token.type)) {
            var hasEndQuote = token.string.slice(-1) === '"' && token.string.length > 1;
            token = {
                // strip the quotes
                start: token.start + 1,
                end: token.end - (hasEndQuote ? 1 : 0),
                type: token.type,
                string: token.string.slice(1, cursor.ch - token.start),
                state: token.state
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
        } else if (token.type === "unit") {
            symbols = serializationUnits;
        } else if (token.type === "montage-property-name") {
            var moduleId = findModuleId(token.state);
            symbols = options.serializationProperties[moduleId] || [];
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

    function findModuleId(state) {
        var properties = state.blocks[state.blocks.length - 2].properties;
        for (var i = 0, property; property = properties[i]; i++) {
            if (property.name === "prototype" ||
                property.name === "object") {
                return property.value;
            }
        }
    }
})();