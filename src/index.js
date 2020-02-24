const fs = require("fs");
const path = require("path");

const [, , file] = process.argv;

let k = 0.7235;

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

    console.log(`Saved to ${outputFile}`);
  });
};

function estimatePoints(output, bookPoints) {
  const estimate = output.reduce(
    (acc, curr) =>
      acc + curr.booksToShip.reduce((acc, curr) => acc + bookPoints[curr], 0),
    0
  );
  console.log("Estimated points:", estimate);
  return estimate;
}

function genStats({ libraries, numOfDays }) {
  // TODO: reverse look up for where each book is (w/ duplicates)
  return {
    ...libraries.reduce(
      (prev, curr, index) => ({
        avgNumOfLibraryBooks:
          (index * prev.avgNumOfLibraryBooks + curr.numOfLibraryBooks) /
          (index + 1),
        avgSignUp: (index * prev.avgSignUp + curr.signUp) / (index + 1),
        avgShipCapacity:
          (index * prev.avgShipCapacity + curr.shipCapacity) / (index + 1),
        avgMaxPoints:
          (index * prev.avgMaxPoints + curr.maxPoints) / (index + 1),
        avgAvailableScanningTime:
          (index * prev.avgAvailableScanningTime + curr.availableScanningTime) /
          (index + 1)
      }),
      {
        avgNumOfLibraryBooks: 0,
        avgSignUp: 0,
        avgShipCapacity: 0,
        avgMaxPoints: 0,
        avgAvailableScanningTime: 0
      }
    ),
    numOfDays
  };
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

      const maxShippableBooks = (numOfDays - signUp) * shipCapacity;

      const maxPoints = libraryBooks
        .slice(0, maxShippableBooks)
        .reduce((acc, book) => acc + bookPoints[book], 0);

      return [
        ...prev,
        {
          index: index / 2,
          libraryBooks,
          numOfLibraryBooks,
          signUp,
          shipCapacity,
          maxPoints,
          availableScanningTime: numOfDays - signUp,
          maxShippableBooks
        }
      ];
    }
    return prev;
  }, []);

  return { numOfBooks, numOfLibraries, numOfDays, bookPoints, libraries };
}

function updateLibraries({ libraries, scannedBooks, daysLeft, bookPoints }) {
  return libraries
    .map(library => {
      //  stop considering already scanned books
      const libraryBooks = library.libraryBooks.filter(
        book => !scannedBooks.has(book)
      );

      const availableScanningTime = daysLeft - library.signUp;

      const maxShippableBooks = availableScanningTime * library.shipCapacity;

      const maxPoints = libraryBooks
        .slice(0, maxShippableBooks)
        .reduce((acc, book) => acc + bookPoints[book], 0);

      return {
        ...library,
        numOfBooks: libraryBooks.length,
        libraryBooks,
        maxPoints,
        availableScanningTime,
        maxShippableBooks
      };
    })
    .filter(e => e.availableScanningTime > 0);
}

function sortLibraries({ libraries }) {
  const compareFn = (a, b) => {
    return a.signUp - b.signUp;
  };
  return libraries.slice(0).sort(compareFn);
}

function selectLibrary({ libraries }) {
  const max = Math.max(...libraries.map(({ maxPoints }) => maxPoints));

  const index = libraries.findIndex(({ maxPoints }) => maxPoints >= k * max);

  return [
    libraries[index],
    ...libraries.slice(0, index),
    ...libraries.slice(index + 1)
  ];
}

function addLibraryToOutput({ output, library, scannedBooks }) {
  const booksToShip = library.libraryBooks
    .filter(e => !scannedBooks.has(e))
    .slice(0, library.shipCapacity * library.availableScanningTime);

  if (booksToShip.length) {
    // update the output
    booksToShip.forEach(book => scannedBooks.add(book));
    output.push({ ...library, booksToShip });
  }
}

fs.readFile(path.resolve(__dirname, "..", file), "utf-8", (err, data) => {
  if (err) return console.log("Read Error: ", err);

  // let bestEstimate = 0;
  // save all scanned books to this set
  // while (k < 1) {
  const scannedBooks = new Set();

  const {
    numOfBooks,
    numOfLibraries,
    numOfDays,
    bookPoints,
    ...restOf
  } = parseInputData(data);

  let { libraries } = restOf;

  const stats = genStats({ libraries, numOfDays });

  // console.log({ numOfBooks, numOfLibraries, numOfDays, bookPoints, libraries });

  let daysLeft = numOfDays;
  let output = [];

  libraries = sortLibraries({ libraries });

  while (daysLeft >= 0) {
    const [currLib, ...rest] = selectLibrary({ libraries });

    if (!currLib) {
      console.log("No more libraries are possible");
      break;
    }

    console.log({
      daysLeft,
      librariesLeft: numOfLibraries - output.length,
      current: currLib
    });

    // add library to output
    addLibraryToOutput({
      output,
      library: currLib,
      scannedBooks
    });

    // update library cycle
    daysLeft = daysLeft - currLib.signUp;

    libraries = updateLibraries({
      libraries: rest,
      scannedBooks,
      daysLeft,
      bookPoints
    });

    libraries = sortLibraries({ libraries });
  }

  const estimate = estimatePoints(output, bookPoints);
  // if (estimate > bestEstimate) {
  //   bestEstimate = estimate;
  //   printOut(output);
  // }
  // console.log({ k, estimate });
  // k = k + 0.1;
  // }

  printOut(output);

  console.log({
    daysLeft,
    scannedBooks: [...scannedBooks].length,
    signedUpLibraries: output.length,
    totalBooks: numOfBooks,
    totalLibraries: numOfLibraries,
    ...stats
  });
});
