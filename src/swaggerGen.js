import fs from "node:fs";

var inJSON, outSwagger, tabCount, indentator;

const changeIndentation = (count) => {
	let i;
	if (count >= tabCount) {
		i = tabCount;
	} else {
		i = 0;
		indentator = "\n";
	}
	for (; i < count; i++) {
		indentator += "\t";
	}
	tabCount = count;
}

const conversorSelection = (obj, nullable) => {
	changeIndentation(tabCount + 1);
	if (typeof obj === "number") {
		convertNumber(obj);
	} else if (Object.prototype.toString.call(obj) === "[object Array]") {
		convertArray(obj);
	} else if (typeof obj === "object") {
		convertObject(obj);
	} else if (typeof obj === "string") {
		convertString(obj);
	} else if (typeof obj === "boolean") {
		outSwagger += indentator + '"type": "boolean"';
	} else {
		console.log('Property type "' + typeof obj + '" not valid for Swagger definitions');
	}
	if(nullable) {
		outSwagger += indentator + "nullable: true,";
	}
	changeIndentation(tabCount - 1);
}

const convertNumber = (num) => {
	if (num % 1 === 0) {
		outSwagger += indentator + '"type": "integer",';
		if (num < 2147483647 && num > -2147483647) {
			outSwagger += indentator + '"format": "int32"';
		} else if (Number.isSafeInteger(num)) {
			outSwagger += indentator + '"format": "int64"';
		} else {
			outSwagger += indentator + '"format": "unsafe"';
		}
	} else {
		outSwagger += indentator + '"type": "number"';
	}
}

const convertString = (str) => {
	let regxDate = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
		regxDateTime =
		/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]).([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?(Z|(\+|\-)([0-1][0-9]|2[0-3]):[0-5][0-9])$/,
		egyptianPhoneNumber = /^01[0|1|2|5][0-9]{8}$/
	outSwagger += indentator + '"type": "string"';
	if (regxDateTime.test(str)) {
		outSwagger += ",";
		outSwagger += indentator + '"format": "date-time"';
	} else if (regxDate.test(str)) {
		outSwagger += ",";
		outSwagger += indentator + '"format": "date"';
	}
	if (egyptianPhoneNumber.test(str)) {
		outSwagger += indentator + `"pattern": "${egyptianPhoneNumber}"`;
	}
}

const convertArray = (obj) => {
	outSwagger += indentator + '"type": "array",';
	outSwagger += indentator + '"items": {';
	if(typeof obj[0] === "object") { 
		let schema = {};
		for (const entry of obj) {
			for (let key of Object.keys(entry)) {
				if (!Object.keys(schema).includes(key)) {
					schema[key] = entry[key];
				}
			}
		}
		conversorSelection(schema);
	}
	else {
		conversorSelection(obj[0]);
	}
	outSwagger += indentator + "}";
}

const convertObject = (obj) => {
	outSwagger += indentator + '"type": "object",';
	outSwagger += indentator + '"properties": {';
	changeIndentation(tabCount + 1);
	for (var prop in obj) {
		const nullable = prop.endsWith("?");
		outSwagger += indentator + '"' + prop.replace("?", '') + '": {';
		conversorSelection(obj[prop], nullable);
		outSwagger += indentator + "},";
	}

	changeIndentation(tabCount - 1);
	if (Object.keys(obj).length > 0) {
		outSwagger = outSwagger.substring(0, outSwagger.length - 1);
		outSwagger += indentator + "}";
	} else {
		outSwagger += " }";
	}
}

const format = (value) => {
	return value
		.replace(/[{},"]+/g, "")
			.replace(/\t/g, "  ")
			.replace(/(^ *\n)/gm, "");
		}

export const convert = (path) => {
	let inJSON = fs.readFileSync(path, 'utf8');
	try {
		inJSON = JSON.parse(inJSON);
	} catch (e) {
		conseole.log("Your JSON is invalid!\n(" + e + ")");
		return;
	}

	tabCount = 0;
	indentator = "\n";
	outSwagger = '"definitions": {';
	changeIndentation(1);
	for (var obj in inJSON) {
		outSwagger += indentator + '"' + obj + '": {';
		conversorSelection(inJSON[obj]);
		outSwagger += indentator + "},";
	}
	outSwagger = outSwagger.substring(0, outSwagger.length - 1);
	changeIndentation(tabCount - 1);
	outSwagger += indentator + "}";

	return format(outSwagger);
}
