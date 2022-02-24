export {};

const input = await Deno.readTextFile(`./input/${Deno.args[0]}.txt`);
const rows = input.split("\n");

const [TOTAL_TIME, INTERSECTIONS, STREETS, CARS, POINTS] = rows[0]
  .split(" ")
  .map(Number);

const streets = rows.slice(1, STREETS + 1).map((line) => {
  const [B, E, name, time] = line.split(" ");
  return { B: parseInt(B), E: parseInt(E), name, time: parseInt(time) };
});

const cars = rows.slice(STREETS + 1, CARS + STREETS + 1).map((line, id) => {
  const [P, ...routes] = line.split(" ");
  return { P: parseInt(P), routes, id };
});

const streetSet = new Set(cars.map(({ routes }) => routes).flat(Infinity));

const streetCount = cars.reduce<Record<string, number>>(
  (prev, { id, routes }) => {
    routes.forEach((route, index) => {
      prev[route] = prev[route] || 0;
      const weight = routes
        .slice(index + 1)
        .reduce(
          (prev, curr) =>
            prev + streets.filter(({ name }) => name === curr)[0].time,
          0
        );
      prev[route] = weight + prev[route];
    });

    return prev;
  },
  {}
);

// console.log(streetSet.size, STREETS, streetCount);

// console.log(streets);
// console.log(cars);

const intersections = Array.from({ length: INTERSECTIONS }, (_, id) => {
  const inputs = streets.filter(({ E }) => E === id);
  return { id, inputs };
});

// console.log(intersections);

const schedule = intersections.map(({ id, inputs }) => {
  const validInputs = inputs.filter((input) => streetSet.has(input.name));
  if (validInputs.length === 0) {
    return null;
  }

  const total = validInputs.reduce(
    (prev, { name }) => streetCount[name] + prev,
    0
  );

  const weights = validInputs
    .map(({ name }) => streetCount[name])
    .sort((a, b) => a - b)
    .map((x) => Math.ceil(x / (total || 1) || 1))
    .reverse();

  return [
    id,
    validInputs.length,
    ...validInputs
      .sort((a, b) => streetCount[a.name] - streetCount[b.name])
      .map(({ name }, index) => {
        return `${name} ${weights[index]}`;
      })
  ].join("\n");
});

const validSchedule = schedule.filter(Boolean);
const answer = `${validSchedule.length}\n${validSchedule.join("\n")}`;

// console.log(answer);

const write = Deno.writeTextFile(`./output/out_${Deno.args[0]}.txt`, answer);

write.then(() => console.log(`Written to: ./output/out_${Deno.args[0]}.txt`));

// from root of project:
// deno run --allow-read --allow-write ./src/index.ts
