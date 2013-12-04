// Based on http://codemirror.net/mode/htmlembedded/htmlembedded.js
CodeMirror.defineMode("montagetemplate", function(config, parserConfig) {

    //config settings
    var serializationStartRegex = parserConfig.serializationStartRegex || /^<script.*type\s*=\s*(["'])text\/montage-serialization(\1).*>/i,
        serializationEndRegex = parserConfig.serializationEndRegex || /^<\/script>/i;

    //inner modes
    var serializationMode, htmlMixedMode;

    //tokenizer when in html mode
    function htmlDispatch(stream, state) {
        // We use prepareToChangeToSerialization and changeToSerialization as a way to
        // continue parsing the stream as html even thought we already know we
        // need to change the mode after consuming the serializationStartRegex string.
        if (state.changeToSerialization) {
            state.changeToSerialization = false;
            state.token=serializationDispatch;
            return serializationMode.token(stream, state.serializationState);
        } else {
            if (state.prepareToChangeToSerialization && stream.match(/>/, false)) {
                state.changeToSerialization = true;
                state.prepareToChangeToSerialization = false;
            } else if (stream.match(serializationStartRegex, false)) {
                state.prepareToChangeToSerialization = true;
            }
            return htmlMixedMode.token(stream, state.htmlState);
        }
    }

    //tokenizer when in serialization mode
    function serializationDispatch(stream, state) {
        if (stream.match(serializationEndRegex, false))  {
            state.token=htmlDispatch;
            return htmlMixedMode.token(stream, state.htmlState);
        }
        else {
            return serializationMode.token(stream, state.serializationState);
        }
    }


    return {
        startState: function() {
            serializationMode = serializationMode || CodeMirror.getMode(config, "text/montage-serialization");
            htmlMixedMode = htmlMixedMode || CodeMirror.getMode(config, "htmlmixed");
            return {
                token :  parserConfig.startOpen ? serializationDispatch : htmlDispatch,
                htmlState : CodeMirror.startState(htmlMixedMode),
                serializationState : CodeMirror.startState(serializationMode)
            };
        },

        token: function(stream, state) {
            return state.token(stream, state);
        },

        indent: function(state, textAfter) {
            if (state.token == htmlDispatch)
                return htmlMixedMode.indent(state.htmlState, textAfter);
            else if (serializationMode.indent)
                return serializationMode.indent(state.serializationState, textAfter);
        },

        copyState: function(state) {
            return {
                token : state.token,
                htmlState : CodeMirror.copyState(htmlMixedMode, state.htmlState),
                serializationState : CodeMirror.copyState(serializationMode, state.serializationState)
            };
        },

        electricChars: "/{}:",

        innerMode: function(state) {
            if (state.token == serializationDispatch) return {state: state.serializationState, mode: serializationMode};
            else return {state: state.htmlState, mode: htmlMixedMode};
        }
    };
}, "htmlmixed");

CodeMirror.defineMIME("text/montage-template", { name: "montagetemplate"});