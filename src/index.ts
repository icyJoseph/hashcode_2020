/** Parsing START */

const input = await Deno.readTextFile(`./input/${Deno.args[0]}.txt`);

const rows = input.split("\n");

const [totalDevs, totalProjects] = rows[0].split(" ").map(Number);

let developers: Record<string, { skill: string; level: number }[]> = {};

let cursor = 1;

let skillsSet: Set<string> = new Set();
let devsSet: Set<string> = new Set();

for (let i = 0; i < totalDevs; i++) {
  const [name, totalSkills] = rows[cursor].split(" ");

  const devRows = rows.slice(cursor + 1, cursor + Number(totalSkills) + 1);
  devsSet.add(name);

  devRows.forEach((r) => {
    const [skill, level] = r.split(" ");

    developers[name] = developers[name] || [];

    skillsSet.add(skill);

    developers[name].push({ skill, level: Number(level) });
  });

  cursor += Number(totalSkills) + 1;
}

developers = Object.entries(developers).reduce((prev, [name, curr]) => {
  let complement = [...skillsSet].filter(
    (sk) => !curr.map(({ skill }) => skill).includes(sk)
  );

  return {
    ...prev,
    [name]: [...curr, ...complement.map((sk) => ({ skill: sk, level: 0 }))]
  };
}, {});

const projects: Record<
  string,
  {
    skills: Array<{ name: string; level: number }>;
    days: number;
    bestBefore: number;
    roles: number;
    score: number;
  }
> = {};

for (let p = 0; p < totalProjects; p++) {
  const [name, days, score, bestBefore, roles] = rows[cursor].split(" ");

  const projectRows = rows.slice(cursor + 1, cursor + Number(roles) + 1);

  projectRows.forEach((r) => {
    const [skill, level] = r.split(" ");

    projects[name] = projects[name] || {
      skills: [],
      days: Number(days),
      score: Number(score),
      bestBefore: Number(bestBefore),
      roles: Number(roles)
    };

    projects[name].skills.push({
      name: skill,
      level: Number(level)
    });
  });

  cursor += Number(roles) + 1;
}

/** Parsing END */

let skillBook = [...devsSet].reduce<
  Record<string, Array<{ name: string; level: number }>>
>((prev, name) => {
  const devSkills = developers[name];

  devSkills.forEach(({ skill, level }) => {
    prev[skill] = prev[skill] || [];
    prev[skill].push({ name, level });
  });

  return prev;
}, {});

const updateSkillBook = () => {
  skillBook = [...devsSet].reduce<
    Record<string, Array<{ name: string; level: number }>>
  >((prev, name) => {
    const devSkills = developers[name];

    devSkills.forEach(({ skill, level }) => {
      prev[skill] = prev[skill] || [];
      prev[skill].push({ name, level });
    });

    return prev;
  }, {});
};

const projectList = Object.entries(projects).map(([name, desc]) => ({
  ...desc,
  name
}));

const shortestFirst = projectList
  .slice(0)
  .sort((a, b) => a.days - b.days)
  .sort((a, b) => b.bestBefore - a.bestBefore);

const answer: Array<{
  project: string;
  contributors: { role: string; name: string; cLevel: number }[];
}> = [];

let pointer = 0;

const done = new Set();

let q: number[] = [];

console.log({ total: shortestFirst.length });

while (done.size < shortestFirst.length) {
  q.push(done.size);
  if (q.length > 1000 && new Set(q.slice(-1000)).size === 1) break;

  if (q.length > 10_000) {
    q = [];
  }
  const next = shortestFirst[pointer];

  console.log(done.size);

  if (done.has(next.name)) continue;

  /**
   * find people for the project
   */

  let team: Array<{ name: string; skill: string; cLevel: number }> = [];
  let teamSet: Set<string> = new Set();

  let takenSkills: Set<string> = new Set();

  const { skills } = next;

  skills.forEach(({ level, name }) => {
    const maybeQualified = skillBook[name];

    const qualified = maybeQualified.filter((dev) => dev.level >= level);

    const available = qualified.find((p) => !teamSet.has(p.name));

    if (available) {
      team.push({ name: available.name, skill: name, cLevel: available.level });

      takenSkills.add(name);
      teamSet.add(available.name);
    }
  });

  const leftOver = skills.filter((sk) => !takenSkills.has(sk.name));

  if (team.length < next.roles) {
    leftOver.forEach(({ name, level }) => {
      // find someone who can be mentored
      const newbies = skillBook[name].filter((dev) => dev.level + 1 === level);

      // in the team, there must be someone who could do it, but is doing something else
      const hasMentor =
        [...teamSet]
          .map((n) => developers[n])
          .filter((maybeMentor) => {
            return !!maybeMentor.find(
              (mentor) => mentor.skill === name && mentor.level >= level
            );
          }).length > 0;

      const availableNewbiew = newbies.find(
        (newbie) => !teamSet.has(newbie.name)
      );

      if (hasMentor && availableNewbiew) {
        team.push({
          name: availableNewbiew.name,
          skill: name,
          cLevel: availableNewbiew.level
        });

        takenSkills.add(name);
        teamSet.add(availableNewbiew.name);
      }
    });
  }

  if (team.length === next.roles) {
    answer.push({
      project: next.name,
      contributors: team.map((m) => ({
        role: m.skill,
        name: m.name,
        cLevel: m.cLevel
      }))
    });

    // update levels
    team.forEach((dev) => {
      const currentSkills = developers[dev.name];

      const newSkills = currentSkills.map((curr) => {
        const req = next.skills.find((sk) => sk.name === curr.skill);

        if (!req) return curr;

        if (curr.skill === dev.skill && curr.level === req.level) {
          curr.level = curr.level + 1;
          return curr;
        }

        if (curr.skill === dev.skill && curr.level + 1 === req.level) {
          curr.level = curr.level + 1;
          return curr;
        }
        return curr;
      });

      developers[dev.name] = newSkills;
    });

    updateSkillBook();

    done.add(next.name);
  }

  pointer = (pointer + 1) % shortestFirst.length;
}

const output = `${answer.length}\n${answer
  .map(({ project, contributors }) => {
    const consumed: Set<string> = new Set();

    return `${project}\n${projects[project].skills
      .map(({ name, level }) => {
        const contributor = contributors.find(
          (c) => c.role === name && !consumed.has(c.name)
        );
        const consuming = contributor?.name;

        if (consuming) {
          consumed.add(consuming);
        }
        return consuming;
      })
      .join(" ")}\n`;
  })
  .join("")}`;

const write = Deno.writeTextFile(`./output/out_${Deno.args[0]}.txt`, output);

write.then(() => console.log(`Written to: ./output/out_${Deno.args[0]}.txt`));

// from root of project:
// deno run --allow-read --allow-write ./src/index.ts a
