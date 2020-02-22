const fs = require("fs");
const path = require("path");

const [, , file] = process.argv;

const printOut = output => {
  const outputFile = file.replace("input", "output").replace(".txt", ".out");

  const rows = output
    .map(
      ({ index, booksToShip }) =>
        `${index} ${booksToShip.length}\n${booksToShip.join(" ")}`
    )
    .join("\n");

  const data = [output.length, rows].join("\n");

  fs.writeFile(outputFile, data, err => {
    if (err) return console.log("Print out: ", err);

    console.log("Success");
  });
};

function estimatePoints(output, bookPoints) {
  console.log(
    "Estimated points",
    output.reduce(
      (acc, curr) =>
        acc + curr.booksToShip.reduce((acc, curr) => acc + bookPoints[curr], 0),
      0
    )
  );
}

// takes "2 3 4" => [2,3,4] as number[]
const readNumericInputLine = data => data.split(" ").map(e => parseInt(e));

function parseInputData(data) {
  const [header, subheader, ...rest] = data.split("\n").filter(e => e);

  const [numOfBooks, numOfLibraries, numOfDays] = header
    .split(" ")
    .map(e => parseInt(e));

  const bookPoints = subheader.split(" ").map(e => parseInt(e));

  const libraries = rest.reduce((prev, curr, index, src) => {
    if (index % 2 === 0) {
      const [numOfLibraryBooks, signUp, shipCapacity] = readNumericInputLine(
        curr
      );

      const libraryBooks = readNumericInputLine(src[index + 1]).sort(
        (a, b) => bookPoints[b] - bookPoints[a]
      );

      const maxPoints = libraryBooks.reduce(
        (acc, book) => acc + bookPoints[book],
        0
      );

      const availableScanningTime = numOfDays - signUp;

      return [
        ...prev,
        {
          index: index / 2,
          libraryBooks,
          numOfLibraryBooks,
          signUp,
          shipCapacity,
          maxPoints,
          availableScanningTime
        }
      ];
    }
    return prev;
  }, []);

  return { numOfBooks, numOfLibraries, numOfDays, bookPoints, libraries };
}

function updateLibraries({ libraries, bookSet, daysLeft, bookPoints }) {
  return libraries.map(library => {
    const libraryBooks = library.libraryBooks.filter(
      book => !bookSet.has(book)
    );

    const availableScanningTime = daysLeft - library.signUp;

    const maxPoints = libraryBooks.reduce(
      (acc, book) => acc + bookPoints[book],
      0
    );

    return { ...library, libraryBooks, maxPoints, availableScanningTime };
  });
}

function sortLibraries({ libraries }) {
  const compareFn = (b, a) => {
    const ret =
      b.availableScanningTime * b.shipCapacity * b.maxPoints -
      a.availableScanningTime * a.shipCapacity * a.maxPoints;
    return ret;
  };
  return libraries.slice(0).sort(compareFn);
}

function addLibraryToOutput({ output, library, bookSet, daysLeft }) {
  const qTyOfBooksToShip = Math.floor(daysLeft / library.shipCapacity);

  const booksToShip = library.libraryBooks
    .filter(e => !bookSet.has(e))
    .slice(0, qTyOfBooksToShip);

  if (booksToShip.length) {
    // update the output
    booksToShip.forEach(book => bookSet.add(book));
    output.push({ ...library, booksToShip });
  }
}

fs.readFile(path.resolve(__dirname, "..", file), "utf-8", (err, data) => {
  if (err) return console.log("Read Error: ", err);

  // save all scanned books to this set
  const scannedBooks = new Set();

  const {
    numOfBooks,
    numOfLibraries,
    numOfDays,
    bookPoints,
    ...restOf
  } = parseInputData(data);

  let { libraries } = restOf;

  // console.log({ numOfBooks, numOfLibraries, numOfDays, bookPoints, libraries });

  let daysLeft = numOfDays;
  let output = [];

  libraries = sortLibraries({ libraries });

  while (daysLeft >= 0) {
    const [currLib, ...rest] = libraries;

    if (!currLib) {
      break;
    }

    // add library to output
    addLibraryToOutput({
      output,
      library: currLib,
      bookSet: scannedBooks,
      daysLeft
    });

    // update library cycle
    daysLeft = daysLeft - currLib.signUp;

    libraries = updateLibraries({
      libraries: rest,
      bookSet: scannedBooks,
      daysLeft,
      bookPoints
    });

    libraries = sortLibraries({ libraries });
  }

  estimatePoints(output, bookPoints);

  printOut(output);
});
