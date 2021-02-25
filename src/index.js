const fs = require("fs");
const path = require("path");

const [, , file] = process.argv;

const printOut = (data) => {
  fs.writeFile(outputFile, data, (err) => {
    if (err) return console.log("Print out: ", err);

    console.log(`Saved to ${outputFile}`);
  });
};

fs.readFile(path.resolve(__dirname, "..", file), "utf-8", (err, data) => {
  if (err) return console.log("Read Error: ", err);

  printOut(output);
});
