const fs = require("fs");
const path = require("path");

const [, , file] = process.argv;

const printOut = data => {
  const outputFile = file.replace("input", "output").replace(".in", ".out");

  fs.writeFile(outputFile, data, err => {
    if (err) return console.log("Print out: ", err);

    console.log("Success");
  });
};

fs.readFile(path.resolve(__dirname, "..", file), "utf-8", (err, data) => {
  if (err) return console.log("Read Error: ", err);
  console.log(data);

  // solve here

  const [header, ...rest] = data.split("\n").filter(e => e);

  console.log({ header });

  console.log({ rest });

  printOut(data);
});
