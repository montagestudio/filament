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

        if (properties && properties.length > 0) {
            return properties[properties.length - 1].name
        }
    }

    function getParentPropertyName(state) {
        var block = state.blocks[state.blocks.length - 2];

        if (block) {
            var properties = block.properties;
            var length = properties.length;
            if (length > 0) {
                return properties[length - 1].name;
            }
        }
    }

    function tokenBase(stream, state) {
        var ch = stream.next();
        var properties = state.block && state.block.properties;

        // String
        if (ch == '"') {
            if (state.block && state.block.readingPropertyName) {
                return tokenPropertyName(stream, state);
            } else {
                return tokenPropertyValueString(stream, state);
            }
        }

        if (ch === ",") {
            endProperty(state);
        }

        if (ch === "[") {
            startBlock(stream, state, "array");
        }

        if (ch === "]" && state.block) {
            endBlock(state);
        }

        if (ch === "{") {
            startBlock(stream, state);

            // Recognize serialization syntax like {"@".
            // This only works when the property name is in the same line as the
            // opening bracket due to the line by line nature of the tokenizer.
            if (canConsumeString(stream, state)) {
                tokenPropertyName(stream, state, true);
                var propertyName = getPropertyName(state);
                if (serializationSyntax.propertyIsEnumerable(propertyName)) {
                    return "keyword";
                }
            }
        }

        if (ch === "}" && state.block) {
            endBlock(state);

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
        startProperty(state, string);

        if (state.blockLevel === 1) {
            addLabel(state, string);
            return "label";
        } else if (state.blockLevel === 2) {
            return "unit";
        } else if (state.blockLevel === 3
            && getParentPropertyName(state) === "properties") {
            return "montage-property-name";
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
            while(stream.eatSpace()) {}
            if (!stream.eat("\"")) {
                throw new Error("Montage serialization read error, expecting a quote, found "+ stream.string.slice(stream.pos));
            }
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

    function canConsumeString(stream, state) {
        return stream.match(/\s*"/, false);
    }

    function startProperty(state, name) {
        state.block.properties.push({
            name: name
        });
        //console.log("add property: ", name);
    }

    function endProperty(state) {
        if (state.block && state.block.type === "object") {
            state.block.readingPropertyName = true;
        }
    }

    function addLabel(state, label) {
        state.labels.push(label);
    }

    function startBlock(stream, state, type) {
        if (state.blocks.length === 0) {
            state.baseColumn = stream.column();
        }

        state.blocks.push({
            type: type || "object",
            readingPropertyName: type === "array" ? false : true,
            properties: [],
            inSameLineAsPreviousBlock: countOpenBlocksInLine(stream, state) > 0
        });
        state.block = state.blocks[state.blockLevel];
        state.blockLevel++;
        //console.log("new block", state.block.uuid);
        // Avoid increasing the indentation level when several blocks are opened
        // in the same line. Prevents adding 2 or more indentation levels in
        // the next line with code like [{ or [[.
        if (!state.block.inSameLineAsPreviousBlock) {
            state.indentLevel++;
        }
    }

    function endBlock(state) {
        state.blockLevel--;
        if (!state.block.inSameLineAsPreviousBlock) {
            state.indentLevel--;
        }
        state.block = state.blocks[state.blockLevel-1];
        state.blocks.pop();
    }

    function countOpenBlocksInLine(stream, state) {
        var openBlocksInLine = 0;

        for (var i = 0; i < stream.pos - 1; i++) {
            var ch = stream.string[i];
            if (/[\{\[]/.test(ch)) {
                openBlocksInLine++;
            } else if (/[\}\]]/.test(ch)) {
                openBlocksInLine--;
            }
        }

        return openBlocksInLine;
    }

    return {
        startState: function(/*basecolumn*/) {
            return {
                tokenize: null,
                blocks: [],
                block: null,
                blockLevel: 0,
                indentLevel: 0,
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
                indentLevel: state.indentLevel,
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

            var indentLevel = state.indentLevel;

            if (textAfter[0] === "}") {
                indentLevel--;
            }

            return state.baseColumn + indentLevel * indentUnit;
        },

        electricChars: "[]{}",

        helperType: "montageserialization"
    };
});