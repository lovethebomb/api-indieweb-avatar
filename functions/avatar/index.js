const { builder } = require("@netlify/functions");
const AvatarHtml = require("./avatarHtml.js");

const IMAGE_WIDTH = 60;
const IMAGE_HEIGHT = 60;
const IMAGE_TTL = 1 * 7 * 24 * 60 * 60; // 1 week in seconds
const FALLBACK_IMAGE_FORMAT = "png";

/** @type {import('@netlify/functions').Handler} */
async function handler(event, context) {
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/
  let pathSplit = event.path.split("/").filter(entry => !!entry);
  let [url] = pathSplit;

  url = decodeURIComponent(url);

  try {
    // output to Function logs
    console.log("Fetching", url);

    let avatar = new AvatarHtml(url);
    await avatar.fetch();

    let stats = await avatar.getAvatar(IMAGE_WIDTH, FALLBACK_IMAGE_FORMAT);
    let format = Object.keys(stats).pop();
    let stat = stats[format][0];

    return {
      statusCode: 200,
      headers: {
        "content-type": stat.sourceType,
      },
      body: stat.buffer.toString("base64"),
      isBase64Encoded: true,
      ttl: IMAGE_TTL,
    };
  } catch (error) {
    console.log("Error", error);

    const img = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAGpJREFUWEftlUEOABAMBPX/jyaujWg3QSMZV2zXqGWteFhx/YYBCEAgQ6C7pxrtkdZHYrO2JKiux0CGwNW0xgAEIPAFAR/Fai5sD5khgIHnBNTvN+qJrd6qBzBQTiC606PzmRw4WtCLYWAA4goUIYfY4WEAAAAASUVORK5CYII=", 'base64')
    return {
      // We need to return 200 here or Firefox won’t display the image
      // HOWEVER a 200 means that if it times out on the first attempt it will stay the default image until the next build.
      statusCode: 200,
      headers: {
        "content-type": "image/png",
        "content-length": img.length,
        "x-error-message": error.message
      },
      body: img,
      isBase64Encoded: false,
    };
  }
}

exports.handler = builder(handler);
