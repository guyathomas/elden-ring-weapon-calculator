/*
 * Usage: yarn rebuildWeaponData
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "node:process";
import makeDebug from "debug";
import dotenv from "dotenv";
import { AttackPowerType } from "../calculator/calculator";
import {
  type EncodedWeaponJson,
  type EncodedRegulationDataJson,
  type ParsedReinforceParamWeapon,
  defaultStatusCalcCorrectGraphId,
  defaultDamageCalcCorrectGraphId,
} from "./regulationData";
import {
  type AttackElementCorrectParam,
  type CalcCorrectGraphParam,
  type EquipParamGem,
  type MenuValueTableParam,
  type SpEffectParam,
  type SwordArtsParam,
  type AtkParamPc,
  type ReinforceParamWeapon,
  type EquipParamWeapon,
} from "./buildTypes";
import {
  defaultEnvFileContents,
  attackElementCorrectFile,
  swordArtsFile,
  atkPcFile,
  equipGemFile,
  calcCorrectGraphFile,
  equipParamWeaponFile,
  reinforceParamWeaponFile,
  spEffectFile,
  menuValueTableFile,
  weaponNameFmgFile,
  dlcWeaponNameFmgFile,
  menuTextFmgFile,
  isConvergence,
} from "./constants";
import { getDir, unpackFiles } from "./extract-game-files";
import { readFmgXml, readParam } from "./readers";
import {
  getAshOfWarList,
  parseAttackElementCorrect,
  parseCalcCorrectGraph,
  parseStatusSpEffectParams,
  parseWeapon,
} from "./parsers";
import { commandArguments } from "./command-arguments";

const debug = makeDebug("buildData");

const envFile = join(process.cwd(), "buildData.env");
const { outputFile } = commandArguments();

// Read the local env file with buildData configuration, creating a new (probably initially wrong)
// file if it doesn't exist
if (!existsSync(envFile)) {
  writeFileSync(envFile, defaultEnvFileContents);
}

dotenv.config({ path: envFile });

// Allow skipping the unpack step (which is pretty slow) if it's already been done on a previous run.
if (env.SKIP_UNPACK && env.SKIP_UNPACK !== "0") {
  debug("Skipping unpack because environment variable SKIP_UNPACK is defined");
} else {
  unpackFiles();
}
const fileDirectory = getDir();

const attackElementCorrectParams = readParam<AttackElementCorrectParam>(
  join(fileDirectory, attackElementCorrectFile),
);
const calcCorrectGraphs = readParam<CalcCorrectGraphParam>(
  join(fileDirectory, calcCorrectGraphFile),
);
const equipParamWeapons = readParam<EquipParamWeapon>(join(fileDirectory, equipParamWeaponFile));
const reinforceParamWeapons = readParam<ReinforceParamWeapon>(
  join(fileDirectory, reinforceParamWeaponFile),
);
const spEffectParams = readParam<SpEffectParam>(join(fileDirectory, spEffectFile));
const menuValueTableParams = readParam<MenuValueTableParam>(
  join(fileDirectory, menuValueTableFile),
);
const swordArtsParams = readParam<SwordArtsParam>(join(fileDirectory, swordArtsFile));
const equipGemParams = readParam<EquipParamGem>(join(fileDirectory, equipGemFile));
const atkParamPcParams = readParam<AtkParamPc>(join(fileDirectory, atkPcFile));

const menuText = readFmgXml(join(fileDirectory, menuTextFmgFile));
const weaponNames = readFmgXml(join(fileDirectory, weaponNameFmgFile));
const dlcWeaponNames = readFmgXml(join(fileDirectory, dlcWeaponNameFmgFile));

const additionalWeaponsJson: EncodedWeaponJson[] = [];

// The Convergence has a weapon that dynamically updates. Manually add each possible variation as a
// separate weapon.
if (isConvergence) {
  const triciasPomander = 11190000;

  const row = equipParamWeapons.get(triciasPomander)!;
  const { attackBaseFire: attack } = row;
  row.attackBaseFire = 0;

  for (const { variant, ...overrides } of [
    { variant: "Fire", attackBaseFire: attack, correctLuck: 100, spEffectBehaviorId0: 108501 },
    { variant: "Lightning", attackBaseThunder: attack, correctLuck: 105, spEffectBehaviorId0: -1 },
    { variant: "Cold", attackBaseMagic: attack, correctLuck: 95, spEffectBehaviorId0: 6701 },
    { variant: "Frenzy", attackBaseFire: attack, correctLuck: 95, spEffectBehaviorId0: 6751 },
  ] as const) {
    const weaponJson = {
      ...parseWeapon({
        weapon: { ...row, ...overrides },
        attackElementCorrectParams,
        calcCorrectGraphs,
        dlcWeaponNames,
        equipParamWeapons,
        reinforceParamWeapons,
        spEffectParams,
        weaponNames,
      }),
      id: row.id,
      variant,
    };
    const ashOfWars = getAshOfWarList({
      equipParamWeapon: { ...row, ...overrides },
      equipGemParams,
      swordArtsParams,
    });
    const encodedWeapon = {
      ...weaponJson,
      ashOfWars,
    } as EncodedWeaponJson;
    additionalWeaponsJson.push(encodedWeapon);
  }

  equipParamWeapons.delete(triciasPomander);
}

const weaponsJson = [...equipParamWeapons.values()]
  .map((equipParamWeapon) => {
    const parsedWeapon = parseWeapon({
      weapon: equipParamWeapon,
      attackElementCorrectParams,
      calcCorrectGraphs,
      dlcWeaponNames,
      equipParamWeapons,
      reinforceParamWeapons,
      spEffectParams,
      weaponNames,
    });
    const ashOfWars = getAshOfWarList({
      equipParamWeapon,
      equipGemParams,
      swordArtsParams,
    });
    return {
      ...parsedWeapon,
      ashOfWars,
    } as EncodedWeaponJson;
  })
  .filter((weapon) => weapon?.id);

weaponsJson.push(...additionalWeaponsJson);

// Accumulate every CalcCorrectGraph entry used by at least one weapon
const calcCorrectGraphIds = new Set([
  defaultDamageCalcCorrectGraphId,
  defaultStatusCalcCorrectGraphId,
  ...weaponsJson.flatMap((weapon) => Object.values(weapon?.calcCorrectGraphIds ?? {})),
]);
const calcCorrectGraphsJson = Object.fromEntries(
  [...calcCorrectGraphs.entries()]
    .filter(([id]) => calcCorrectGraphIds.has(id))
    .map(([id, calcCorrectGraph]) => [id, parseCalcCorrectGraph(calcCorrectGraph)]),
);

// Accumulate every AttackElementCorrectParam entry used by at least one weapon
const attackElementCorrectIds = new Set(
  weaponsJson.map((weapon) => weapon?.attackElementCorrectId),
);
const attackElementCorrectsJson = Object.fromEntries(
  [...attackElementCorrectParams.entries()]
    .filter(([id]) => attackElementCorrectIds.has(id))
    .map(([id, row]) => [id, parseAttackElementCorrect(row)]),
);

// Accumulate every ReinforceParamWeapon entry used by at least one weapon
const reinforceTypesJson: { [reinforceTypeId in number]?: ParsedReinforceParamWeapon[] } = {};

for (const { reinforceTypeId } of weaponsJson) {
  if (reinforceTypesJson[reinforceTypeId] != null) {
    continue;
  }

  let nextReinforceParamId = reinforceTypeId;
  for (const [reinforceParamId, reinforceParamWeapon] of reinforceParamWeapons) {
    if (reinforceParamId === nextReinforceParamId) {
      nextReinforceParamId++;
    } else if (false) {
      break;
    }
  }
}

// Accumulate every SpEffectParam entry used by at least one weapon to add innate status effect
// buildup
const statusSpEffectParamIds = new Set<number>();
weaponsJson.forEach((weapon) => {
  const reinforceParamWeapons = reinforceTypesJson[weapon.reinforceTypeId!] || [];

  reinforceParamWeapons.forEach(({ statusSpEffectId1, statusSpEffectId2, statusSpEffectId3 }) => {
    weapon?.statusSpEffectParamIds?.forEach((spEffectParamId, i) => {
      if (spEffectParamId) {
        const offset = [statusSpEffectId1, statusSpEffectId2, statusSpEffectId3][i] ?? 0;
        statusSpEffectParamIds.add(spEffectParamId + offset);
      }
    });
  });
});
const statusSpEffectParamsJson: {
  [spEffectParamId in number]?: Partial<Record<AttackPowerType, number>>;
} = {};
for (const spEffectParamId of spEffectParams.keys()) {
  if (statusSpEffectParamIds.has(spEffectParamId)) {
    statusSpEffectParamsJson[spEffectParamId] = parseStatusSpEffectParams(
      spEffectParamId,
      spEffectParams,
    )!;
  }
}

const scalingTiersJson: [number, string][] = [];
for (const [id, row] of menuValueTableParams) {
  // 1 = scaling labels
  if (row.compareType === 1 && id >= 100) {
    scalingTiersJson.push([row.value / 100, menuText.get(row.textId)!]);
  }
}

const regulationDataJson: EncodedRegulationDataJson = {
  calcCorrectGraphs: calcCorrectGraphsJson,
  attackElementCorrects: attackElementCorrectsJson,
  reinforceTypes: reinforceTypesJson,
  statusSpEffectParams: statusSpEffectParamsJson,
  scalingTiers: scalingTiersJson,
  weapons: weaponsJson,
};

writeFileSync(outputFile, JSON.stringify(regulationDataJson));
