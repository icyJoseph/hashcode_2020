const input = await Deno.readTextFile(`./input/${Deno.args[0]}.txt`);

console.log({ input });

const answer = `Echo`;

// console.log(answer);

const write = Deno.writeTextFile(`./output/out_${Deno.args[0]}.txt`, answer);

write.then(() => console.log(`Written to: ./output/out_${Deno.args[0]}.txt`));

// from root of project:
// deno run --allow-read --allow-write ./src/index.ts a
