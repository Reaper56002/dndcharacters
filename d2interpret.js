// d2interpret.js — Final Version with FizzBuzz Easter Egg, charactersearch, and deletecharacter

const fs = require("fs");
const readline = require("readline");
const path = require("path");

const SAVE_DIR = "saved_characters";

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

const abilityList = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

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

function saveCharacter(character) {
  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR);
  const timestamp = Date.now();
  const filename = `${character.name}_${timestamp}.json`;
  const filepath = path.join(SAVE_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(character, null, 2));
  console.log(`Character saved to: ${filepath}`);
}

async function interpretCharacterBlock(lines) {
  const character = {};
  let rollStats = false;

  for (const line of lines) {
    if (line.trim() === "roll_stats") {
      rollStats = true;
    } else {
      const [key, value] = line.split(":").map(s => s.trim().replace(/["']/g, ""));
      character[key] = value;
    }
  }

  character.level = parseInt(await promptInput("Enter character level: "), 10);
  character.stats = rollStats ? await rollStatsInteractive() : {};

  displayCharacterSheet(character);
  saveCharacter(character);
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

  const character = JSON.parse(fs.readFileSync(path.join(SAVE_DIR, selectedFile)));
  displayCharacterSheet(character);
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

  const choice = parseInt(await promptInput("\nEnter number of the character to delete: "), 10);
  const selectedFile = files[choice - 1];
  if (!selectedFile) return console.log("Invalid selection.");

  const fullPath = path.join(SAVE_DIR, selectedFile);
  const character = JSON.parse(fs.readFileSync(fullPath));
  console.log(`\nYou selected: ${character.name} (Level ${character.level})`);

  const confirmDelete = (await promptInput("Are you sure you want to delete this character? (y/n): ")).toLowerCase();
  if (confirmDelete === "y") {
    fs.unlinkSync(fullPath);
    console.log("Character deleted.");
  } else {
    console.log("Character not deleted.");
  }
}

async function runInterpreter(file) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n").map(line => line.trim()).filter(Boolean);

  const characterBlock = [];
  let inCharacter = false;

  for (const line of lines) {
    if (line.startsWith("character {")) {
      inCharacter = true;
    } else if (line === "}") {
      await interpretCharacterBlock(characterBlock);
      inCharacter = false;
    } else if (inCharacter) {
      characterBlock.push(line);
    }
  }
}

// ENTRY
(async () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node d2interpret.js file.dnd | charactersearch | deletecharacter");
    process.exit(1);
  }

  if (arg === "charactersearch") {
    await runCharacterSearch();
  } else if (arg === "deletecharacter") {
    await runCharacterDelete();
  } else {
    await runInterpreter(arg);
  }
})();



