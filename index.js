import fetch from "node-fetch";
import * as prettier from "prettier";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import endpoints from "./endpoints.json" assert { type: "json" };

let api = {};

async function formatJSON(json) {
  let output = await prettier.format(JSON.stringify(json), {
    semi: false,
    parser: "json",
  });
  return output;
}

async function scrapeEndpont(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(response);
    }

    return response;
  } catch (error) {
    // console.error(error);
  }
  return "";
}

async function handleEndpoint(url, folder) {
  var out = {};
  for (let index = 1; index < 5; index++) {
    let version = `v${index}`;
    let response = await scrapeEndpont(`https://${url}/docs/json/${version}`);

    if (response.json) {
      let json = await response.json();
      let text = await formatJSON(json);

      if (json.errors) return {};

      if (!existsSync(folder)) {
        mkdirSync(folder);
      }

      writeFileSync(`out/${folder}/${version}.json`, text);
      out[version] = json;
    }
  }

  return out;
}

async function processEndpoints() {
  for (const url of endpoints) {
    try {
      let folder = url.split(".")[0];
      let out = await handleEndpoint(url, folder);
      api[folder] = out;
    } catch (error) {
      console.error(error);
    }
  }

  // Sort the api object alphabetically by the first key
  let sortedApi = Object.keys(api)
    .sort()
    .reduce((acc, key) => {
      acc[key] = api[key];
      return acc;
    }, {});

  let formatted = await formatJSON(sortedApi);
  writeFileSync("api.json", formatted);
}

processEndpoints();
