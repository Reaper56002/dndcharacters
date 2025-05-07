// d2interpret.js — FINAL FULL VERSION (All Commands Integrated and Working)

const fs = require("fs");
const readline = require("readline");
const path = require("path");

const SAVE_DIR = "saved_characters";
const abilityList = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const traits = {
  Human: {
    speed: "30ft",
    abilities: ["Adrenaline Rush", "Strength of Humanity"],
    bonus: "+2 and +1 to two ability scores (you choose)",
  },
  Krill: {
    speed: "30ft",
    vision: "Darkvision 60ft",
    rest: "Wary Hypnogogia (4hr trance)",
    morph: "Starts as Acolyte",
  },
};

const classes = {
  Hunter: {
    subclass: {
      Gunslinger: {
        description: "Precision shooting and solar light abilities.",
        grenades: ["Incendiary", "Swarm", "Thermite"],
        abilities: [
          { level: 1, name: "Golden Gun", desc: "Flaming pistol of solar death." },
          { level: 3, name: "Knife Trick", desc: "Fan of burning knives." },
          { level: 6, name: "Explosive Precision", desc: "Kills create solar explosions." },
          { level: 10, name: "Line 'Em Up", desc: "Golden Gun enhanced." }
        ]
      }
    }
  },
  Warlock: {
    subclass: {
      Dawnblade: {
        description: "Solar light powers of flight and fire.",
        grenades: ["Solar", "Firebolt", "Fusion"],
        abilities: [
          { level: 1, name: "Daybreak", desc: "Wings of fire and flaming sword." },
          { level: 3, name: "Igniting Touch", desc: "Melee ignites enemies." },
          { level: 6, name: "Icarus Dash", desc: "Air dashing powered by light." },
          { level: 10, name: "Phoenix Dive", desc: "Healing dive from midair." }
        ]
      }
    }
  },
  Titan: {
    subclass: {
      Sentinel: {
        description: "Void shields and defensive tactics.",
        grenades: ["Magnetic", "Suppressor", "Voidwall"],
        abilities: [
          { level: 1, name: "Sentinel Shield", desc: "Void shield for defense or offense." },
          { level: 3, name: "Shield Throw", desc: "Ricochet throwing shield." },
          { level: 6, name: "Defensive Strike", desc: "Melee buff for allies." },
          { level: 10, name: "Ward of Dawn", desc: "Indestructible void dome." }
        ]
      }
    }
  }
};

function rollDice() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
}

function getModifier(score) {
  return Math.floor((score - 10) / 2);
}

function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

async function promptInput(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function rollStatsInteractive() {
  const stats = {};
  for (const ability of abilityList) {
    const rolls = rollDice();
    rolls.sort((a, b) => a - b);
    const dropped = rolls[0];
    const total = rolls.slice(1).reduce((a, b) => a + b, 0);
    console.log(`Rolling ${ability}: [${rolls.join(", ")}] → drop ${dropped} → ${total}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    stats[ability] = total;
  }
  return stats;
}

function displayCharacterSheet(character) {
  console.log(`\n--- Character Sheet: ${character.name} (Level ${character.level}) ---`);
  const raceData = traits[character.race];
  if (raceData) {
    console.log(`Race: ${character.race}`);
    Object.entries(raceData).forEach(([k, v]) => {
      console.log(`  ${k[0].toUpperCase() + k.slice(1)}: ${Array.isArray(v) ? v.join(", ") : v}`);
    });
  }

  const classData = classes[character.class];
  const subclassData = classData?.subclass?.[character.subclass];

  console.log(`\nClass: ${character.class} → ${character.subclass}`);
  if (subclassData?.description) console.log(`  ${subclassData.description}`);
  if (subclassData?.grenades) console.log(`  Grenades: ${subclassData.grenades.join(", ")}`);

  if (subclassData?.abilities) {
    console.log(`\nUnlocked Abilities:`);
    subclassData.abilities
      .filter(a => character.level >= a.level)
      .forEach(a => {
        console.log(`  • ${a.name} (Level ${a.level}): ${a.desc}`);
      });
  }

  console.log(`\nAbility Scores:`);
  for (const ability of abilityList) {
    const score = character.stats[ability];
    const mod = getModifier(score);
    console.log(`  ${ability}: ${score} (${formatMod(mod)})`);
  }

  if (character.name.toLowerCase() === "fizzbuzz") {
    console.log("\nThe lord of counting awaits...\n");
    for (let i = 1; i <= 100; i++) {
      if (i % 15 === 0) console.log("FizzBuzz");
      else if (i % 3 === 0) console.log("Fizz");
      else if (i % 5 === 0) console.log("Buzz");
      else console.log(i);
    }
  }
  console.log("");
}

async function runInterpreter(file) {
  const text = fs.readFileSync(file, "utf-8");
  const lines = text.split(/\r?\n/);
  const character = { name: "", race: "", class: "", subclass: "", level: 1, stats: {} };

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("name:")) character.name = line.split(":")[1].trim();
    else if (line.startsWith("race:")) character.race = line.split(":")[1].trim();
    else if (line.startsWith("class:")) character.class = line.split(":")[1].trim();
    else if (line.startsWith("subclass:")) character.subclass = line.split(":")[1].trim();
  }

  character.level = parseInt(await promptInput("Enter level: "));
  character.stats = await rollStatsInteractive();

  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR);
  const filename = `${character.name.replace(/\s+/g, "_")}_${Date.now()}.json`;
  fs.writeFileSync(path.join(SAVE_DIR, filename), JSON.stringify(character, null, 2));
  displayCharacterSheet(character);
}

async function runCharacterSearch() {
  if (!fs.existsSync(SAVE_DIR)) return console.log("No saved characters found.");
  const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith(".json"));
  if (files.length === 0) return console.log("No saved characters found.");

  console.log("\nSaved Characters:");
  files.forEach((file, index) => {
    const parsed = JSON.parse(fs.readFileSync(path.join(SAVE_DIR, file)));
    console.log(`  [${index + 1}] ${parsed.name} (Level ${parsed.level})`);
  });

  const choice = parseInt(await promptInput("\nEnter character number: "), 10);
  const selectedFile = files[choice - 1];
  if (!selectedFile) return console.log("Invalid selection.");

  const fullPath = path.join(SAVE_DIR, selectedFile);
  let character = JSON.parse(fs.readFileSync(fullPath));

  let exitMenu = false;
  while (!exitMenu) {
    console.log("\n1. View Character\n2. Reroll Stats\n3. Edit Stats\n4. Edit Name\n5. Exit");
    const action = await promptInput("Choose an option: ");

    if (action === "1") {
      displayCharacterSheet(character);
    } else if (action === "2") {
      character.stats = await rollStatsInteractive();
      console.log("Stats rerolled.");
    } else if (action === "3") {
      for (const ability of abilityList) {
        const newVal = await promptInput(`Enter new value for ${ability} (current ${character.stats[ability]}): `);
        const parsed = parseInt(newVal);
        if (!isNaN(parsed)) character.stats[ability] = parsed;
      }
      console.log("Stats updated.");
    } else if (action === "4") {
      const newName = await promptInput("Enter new character name: ");
      character.name = newName;
      console.log("Name updated.");
    } else if (action === "5") {
      fs.writeFileSync(fullPath, JSON.stringify(character, null, 2));
      console.log("Changes saved. Exiting.");
      exitMenu = true;
    } else {
      console.log("Invalid choice.");
    }
  }
}

async function runCharacterDelete() {
  if (!fs.existsSync(SAVE_DIR)) return console.log("No saved characters found.");
  const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith(".json"));
  if (files.length === 0) return console.log("No saved characters found.");

  console.log("\nSaved Characters:");
  files.forEach((file, index) => {
    const parsed = JSON.parse(fs.readFileSync(path.join(SAVE_DIR, file)));
    console.log(`  [${index + 1}] ${parsed.name} (Level ${parsed.level})`);
  });

  const choice = parseInt(await promptInput("\nEnter character number to delete: "), 10);
  const selectedFile = files[choice - 1];
  if (!selectedFile) return console.log("Invalid selection.");

  const confirm = await promptInput("Are you sure you want to delete this character? (y/n): ");
  if (confirm.toLowerCase() === "y") {
    fs.unlinkSync(path.join(SAVE_DIR, selectedFile));
    console.log("Character deleted.");
  } else {
    console.log("Deletion cancelled.");
  }
}

async function runFightForever() {
  if (!fs.existsSync(SAVE_DIR)) return console.log("No saved characters to fight.");
  const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith(".json"));
  if (files.length === 0) return console.log("No saved characters to fight.");

  const randomFile = files[Math.floor(Math.random() * files.length)];
  const fullPath = path.join(SAVE_DIR, randomFile);
  let character = JSON.parse(fs.readFileSync(fullPath));

  console.log(`\nSummoning ${character.name}...`);
  const roll = Math.floor(Math.random() * 20) + 1;
  console.log(`Rolled a ${roll} on a d20!`);

  const originalStats = { ...character.stats };

  if (roll === 1) {
    fs.unlinkSync(fullPath);
    console.log(`*** CRITICAL FAILURE ***\n${character.name} has been lost to the void.`);
    return;
  } else if (roll >= 2 && roll <= 10) {
    abilityList.forEach(stat => character.stats[stat] = Math.max(1, character.stats[stat] - 5));
    console.log(`${character.name} suffers great loss... All stats reduced by 5.`);
  } else if (roll >= 11 && roll <= 19) {
    abilityList.forEach(stat => character.stats[stat] += 5);
    console.log(`${character.name} emerges stronger! All stats increased by 5.`);
  } else if (roll === 20) {
    if (character.level < 20) {
      character.level++;
      console.log(`${character.name} ascends! Level increased to ${character.level}.`);
    } else {
      console.log(`${character.name} is already at the pinnacle (level 20).`);
    }
  }

  fs.writeFileSync(fullPath, JSON.stringify(character, null, 2));
  console.log("\nStat Changes:");
  console.log("ABILITY | BEFORE | AFTER");
  console.log("------------------------");
  for (const ability of abilityList) {
    const before = originalStats[ability];
    const after = character.stats[ability];
    console.log(`${ability.padEnd(6)} | ${String(before).padEnd(6)} | ${after}`);
  }
  displayCharacterSheet(character);
}

// CLI Entry
(async () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node d2interpret.js file.dnd | charactersearch | deletecharacter | fightforever");
    process.exit(1);
  }

  if (arg === "charactersearch") {
    await runCharacterSearch();
  } else if (arg === "deletecharacter") {
    await runCharacterDelete();
  } else if (arg === "fightforever") {
    await runFightForever();
  } else {
    await runInterpreter(arg);
  }
})();





