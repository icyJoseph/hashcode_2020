const fs = require("fs");
const path = require("path");

const [, , file] = process.argv;

const printOut = data => {
  const outputFile = file.replace("input", "output").replace(".txt", ".out");

  fs.writeFile(outputFile, data, err => {
    if (err) return console.log("Print out: ", err);

    console.log("Success");
  });
};

fs.readFile(path.resolve(__dirname, "..", file), "utf-8", (err, data) => {
  if (err) return console.log("Read Error: ", err);

  const scannedBooks = new Set();

  const [header, subheader, ...rest] = data.split("\n").filter(e => e);

  const [numOfBooks, numOfLibraries, numOfDays] = header
    .split(" ")
    .map(e => parseInt(e));

  const bookPoints = subheader.split(" ").map(e => parseInt(e));

  const libraries = rest
    .reduce((prev, curr, index, src) => {
      if (index % 2 === 0) {
        const [numOfLibraryBooks, signUp, shipCapacity] = curr
          .split(" ")
          .map(e => parseInt(e));

        const libraryBooks = src[index + 1]
          .split(" ")
          .map(e => parseInt(e))
          .sort((a, b) => bookPoints[b] - bookPoints[a]);

        const maxPoints = libraryBooks.reduce(
          (acc, book) => acc + bookPoints[book],
          0
        );

        return [
          ...prev,
          {
            index: index / 2,
            libraryBooks,
            numOfLibraryBooks,
            signUp,
            shipCapacity,
            maxPoints
          }
        ];
      }
      return prev;
    }, [])
    .sort((a, b) => b.maxPoints - a.maxPoints);

  console.log({ numOfBooks, numOfLibraries, numOfDays, bookPoints, libraries });

  let daysLeft = numOfDays;
  let output = [];
  let i = 0;

  while (daysLeft >= 0) {
    const currLib = libraries[i];

    if (!currLib) {
      break;
    }

    const qTyOfBooksToShip = Math.floor(daysLeft / currLib.shipCapacity);

    const booksToShip = currLib.libraryBooks
      .filter(e => !scannedBooks.has(e))
      .slice(0, qTyOfBooksToShip);

    daysLeft = daysLeft - currLib.signUp;

    i = i + 1;

    if (booksToShip.length) {
      booksToShip.forEach(book => scannedBooks.add(book));
      output.push({ ...currLib, booksToShip });
    }
  }

  const rows = output
    .map(
      ({ index, booksToShip }) =>
        `${index} ${booksToShip.length}\n${booksToShip.join(" ")}`
    )
    .join("\n");

  const toPrint = [output.length, rows].join("\n");

  printOut(toPrint);
});
