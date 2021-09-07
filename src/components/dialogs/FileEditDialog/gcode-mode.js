// CodeMirror mode for conditional G-code, see https://duet3d.dozuki.com/Wiki/GCode_Meta_Commands
// based on the Pascal mode by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
"use strict";

import { StreamLanguage } from '@codemirror/stream-parser'

function wordRegexp(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
}
const atomArray = [
	"true", "false", "iterations", "line", "null", "pi", "result"
]
const builtinArray = [
	"abs", "acos", "asin", "atan", "atan2", "cos", "degrees", "exists", "floor",
	"isnan", "max", "min", "mod", "radians", "random", "sin", "sqrt", "tan"
]
const keywordArray = [
	"echo", "if", "elif", "else", "while", "break", "abort",
	"global", "param", "var", "set"
]
const atoms = wordRegexp(atomArray), builtins = wordRegexp(builtinArray), keywords = wordRegexp(keywordArray)
//CodeMirror.registerHelper("hintWords", "gcode", atomArray.concat(builtinArray).concat(keywordArray));

export default StreamLanguage.define({
	indent: (state, textAfter, context) => {
		const line = context.state.doc.lineAt(context.state.selection.ranges[0].head);
		let indentation = 0;
		for (let i = 0; i < line.text.length; i++) {
			if (line.text[i] === ' ') {
				indentation++;
			} else if (line.text[i] === '\t') {
				if (indentation % context.state.tabSize === 0) {
					indentation += context.state.tabSize;
				} else {
					indentation += context.state.tabSize - indentation % context.state.tabSize;
				}
			} else {
				break;
			}
		}
		return indentation;
	},

	token(stream) {
		// whitespaces
		if (stream.eatSpace()) return null;

		// Handle one line Comments
		if (stream.match(";")) {
			stream.skipToEnd();
			return "comment";
		}

		// Handle G/M/T-Codes
		if (stream.match(/[GM]\d+(\.\d+)?/) || stream.match(/T\d+/)) { return "keyword"; }

		// Handle Expressions
		if (stream.match(/\{.*\}/)) { return "variable"; }

		// Handle Strings
		if (stream.match(/^"([^"]|(""))*"/)) { return "string"; }

		// Handle Encapsulated comments
		if (stream.match(/\(.*\)/)) { return "comment"; }		// FIXME add state support to handle function parameters

		// Handle Atoms, Builtins and Keywords
		if (stream.match(atoms)) { return "atom"; }
		if (stream.match(builtins)) { return "builtin"; }
		if (stream.match(keywords)) { return "keyword"; }

		// Handle Number Literals
		if (stream.match(/^[0-9.+-]/, false)) {
			if (stream.match(/^[+-]?\d*\.\d+([EeDd][+-]?\d+)?/))
				return "number";
			if (stream.match(/^[+-]?\d+([EeDd][+-]?\d+)?/))
				return "number";
		}

		// Handle Letter Literals
		if (stream.match(/[A-Za-z]/)) { return "qualifier"; }

		// TODO Handle invalid characters here via "invalidchar"

		// Handle non-detected items
		stream.next();
		return null;
	}
});
