CodeMirror.defineMode("montagehtml", function(config, parserConfig) {
    var htmlMixedMode = CodeMirror.getMode(config, "htmlmixed");

    return {
        startState: function() {
            var state = htmlMixedMode.startState();

            state.labels = [];

            return state;
        },

        copyState: function(state) {
            var newState = htmlMixedMode.copyState(state);

            newState.labels = state.labels;

            return newState;
        },

        token: function(stream, state) {
            var token = htmlMixedMode.token(stream, state);

            if (token === "attribute" && stream.current() === "data-montage-id") {
                state.nextStringIsLabel = true;
            }

            if (token === "string" && state.nextStringIsLabel) {
                state.nextStringIsLabel = false;
                var string = stream.current();

                // remove quotes when present
                if (string[0] === "'" || string[0] === '"') {
                    string = string.slice(1, -1);
                }

                if (state.labels.indexOf(string) >= 0) {
                    token = "label";
                } else {
                    token = "element";
                }
            }

            return token;
        },

        indent: function(state, textAfter) {
            return htmlMixedMode.indent(state, textAfter);
        },

        electricChars: htmlMixedMode.electricChars,

        innerMode: function(state) {
            return htmlMixedMode.innerMode(state);
        }
    };
}, "htmlmixed");