#!/usr/bin/env node

import { program } from "commander";
import { convert } from "./src/swaggerGen.js";
import fs from "node:fs";

program
	.version("0.0.1")
	.description("Convert JSON to Swagger spec")
	.option("-i, --input <type>", "JSON Path")
	.option("-o, --output <type>", "Output Path")
	.action((options) => {
		const yaml = convert(options.input);
		const outputPath = options.output || "./schema.yaml";
		fs.writeFileSync(outputPath, yaml);
		console.log(`Schema location: ${outputPath}`);
	});

program.parse(process.argv);
