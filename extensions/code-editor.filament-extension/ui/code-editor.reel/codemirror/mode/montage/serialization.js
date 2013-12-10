CodeMirror.defineMode("text/montage-serialization", function(config/*, parserConfig*/) {
    var indentUnit = config.indentUnit;

    var builtin = words("true false null");
    var serializationSyntax = words("@ # % <- <-> /");

    function words(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }

    function getPropertyName(state) {
        var properties = state.block && state.block.properties;

        if (properties) {
            return properties[properties.length - 1].name
        }
    }

    function tokenBase(stream, state) {
        var ch = stream.next();
        var properties = state.block && state.block.properties;

        // String
        if (ch == '"') {
            if (state.block.readingPropertyName) {
                return tokenPropertyName(stream, state);
            } else {
                return tokenPropertyValueString(stream, state);
            }
        }

        if (ch === ",") {
            endProperty(state);
            return null;
        }

        if (ch === "{") {
            startBlock(stream, state);

            // Recognize serialization syntax like {"@".
            // This only works when the property name is in the same line as the
            // opening bracket due to the line by line nature of the tokenizer.
            if (!isEOL(stream, state)) {
                tokenPropertyName(stream, state, true);
                var propertyName = getPropertyName(state);
                if (serializationSyntax.propertyIsEnumerable(propertyName)) {
                    return "keyword";
                }
            }
        }

        if (ch === "}") {
            endBlock(state);
            endProperty(state);

            // recognize the closing } of serialization syntax.
            for (var i = 0; i < properties.length; i++) {
                var propertyName = properties[i].name;
                if (serializationSyntax.propertyIsEnumerable(propertyName)) {
                    return "keyword";
                }
            }
        }

        // Punctuation
        if (/[\[\]\{\}:,]/.test(ch)) {
            return null;
        }

        // Number
        if (/\d/.test(ch)) {
            stream.eatWhile(/[\w\.]/);
            return "number";
        }

        // Advance stream to cover a "word"
        stream.eatWhile(/[\w\$_]/);

        // Read the "word" covered
        var word = stream.current();

        // Builtin
        if (builtin.propertyIsEnumerable(word)) {
            return "builtin";
        }

        return "error";
    }

    function tokenPropertyName(stream, state, readInitialQuote) {
        var string = consumeString(stream, state, readInitialQuote);
        state.block.readingPropertyName = false;
        addProperty(state, string);

        if (state.blockLevel === 1) {
            addLabel(state, string);
            return "label";
        } else {
            return "string";
        }
    }

    function tokenPropertyValueString(stream, state) {
        var propertyName = getPropertyName(state);
        var token = tokenString(stream, state);

        if (propertyName === "prototype") {
            return "module";
        } else if (propertyName === "@") {
            return "object-reference";
        } else {
            return token;
        }
    }

    function tokenString(stream, state) {
        consumeString(stream, state);
        return "string-2";
    }

    function consumeString(stream, state, readInitialQuote) {
        var escaped = false, next, end = false, string = "";
        if (readInitialQuote) {
            stream.eat("\"");
        }
        while ((next = stream.next()) != null) {
            if (next == '"' && !escaped) {end = true; break;}
            escaped = !escaped && next == "\\";
            if (!escaped) {
                string += next;
            }
        }

        return string;
    }

    function isEOL(stream, state) {
        return stream.match(/\s*$/, false);
    }

    function addProperty(state, name) {
        state.block.properties.push({
            name: name
        });
        //console.log("add property: ", name);
    }

    function endProperty(state) {
        if (state.block) {
            state.block.readingPropertyName = true;
        }
    }

    function addLabel(state, label) {
        state.labels.push(label);
    }

    function startBlock(stream, state) {
        if (state.blocks.length === 0) {
            state.baseColumn = stream.column();
        }

        state.blocks.push({
            readingPropertyName: true,
            properties: []
        });
        state.block = state.blocks[state.blockLevel];
        state.blockLevel++;
        //console.log("new block", state.block.uuid);
    }

    function endBlock(state) {
        state.blockLevel--;
        state.block = state.blocks[state.blockLevel-1];
        state.blocks.pop();
        if (state.block) {
            //console.log("go up", state.block.properties.map(function(value) {return value.name}), state.block.uuid);
        }
    }

    return {
        startState: function(/*basecolumn*/) {
            return {
                tokenize: null,
                blocks: [],
                block: null,
                blockLevel: 0,
                labels: [],
                baseColumn: 0
            };
        },

        token: function(stream, state) {
            var style;

            if (stream.eatSpace()) return null;

            style = (state.tokenize || tokenBase)(stream, state);

            return style;
        },

        copyState: function(state) {
            var newState = {
                tokenize: state.tokenize,
                blockLevel: state.blockLevel,
                labels: state.labels.slice(0),
                baseColumn: state.baseColumn
            };

            newState.blocks = JSON.parse(JSON.stringify(state.blocks));
            newState.block = newState.blocks[newState.blocks.length-1];

            return newState;
        },

        indent: function(state, textAfter) {
            if (state.tokenize != tokenBase &&
                state.tokenize != null) {
                return CodeMirror.Pass;
            }

            var indentLevel = state.blockLevel;

            if (textAfter[0] === "}") {
                indentLevel--;
            }

            return state.baseColumn + indentLevel * indentUnit;
        },

        electricChars: "{}",

        helperType: "montageserialization"
    };
});