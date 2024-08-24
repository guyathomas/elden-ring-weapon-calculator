import { allDamageTypes, DamageType } from "./calculator/attackPowerTypes";

/*
 * Usage: yarn rebuildWeaponData
 */
const csvToJSON = require("csvtojson");
const path = require("path");
const { writeFileSync } = require("node:fs");

interface RawWeaponArtData {
  "Unique Skill Weapon": string; // '',
  Name: string; // 'Earthshaker - Shockwave',
  AtkId: string; // '300000322',
  "Phys MV": string; // '0',
  "Magic MV": string; // '0',
  "Fire MV": string; // '0',
  "Ltng MV": string; // '0',
  "Holy MV": string; // '0',
  "Stam Dmg MV": string; // '0',
  "Status MV": string; // '0',
  "Weapon Buff MV": string; // '0',
  "Poise Dmg MV": string; // '0',
  "Atk Repel MV": string; // '0',
  StaminaCost: string; // '0',
  PhysAtkAttribute: string; // 'Standard',
  "Shield Chip": string; // '0',
  disableGuard: string; // 'FALSE',
  DamageLevel: string; // '3',
  dmgLevel_vsPlayer: string; // '0',
  ignoreDmgCount: string; // 'FALSE',
  AtkPhys: string; // '120',
  AtkMag: string; // '0',
  AtkFire: string; // '0',
  AtkLtng: string; // '0',
  AtkHoly: string; // '0',
  AtkStam: string; // '90',
  AtkSuperArmor: string; // '30',
  isAddBaseAtk: string; // 'TRUE',
  overwriteAttackElementCorrectId: string; // '51010',
  isDisableBothHandsAtkBonus: string; // 'TRUE',
  IsArrowAtk: string; // 'FALSE',
  subCategory1: string; // 'Weapon Skill',
  subCategory2: string; // '-',
  subCategory3: string; // '-',
  subCategory4: string; // '-',
  spEffectId0: string; // '-1',
  spEffectId1: string; // '-1',
  spEffectId2: string; // '-1',
  spEffectId3: string; // '-1',
  spEffectId4: string; // '-1',
  "PvP Dmg Mult": string; // '0.8',
  "PvP Stam Dmg Mult": string; // '1.25',
  "PvP Poise Dmg Mult": string; // '2.7'
}

interface ParsedProperties {
  WeaponType?: string; // 'Greatsword',
  AshOfWarName?: string; // 'Earthshaker - Shockwave',
  Variant?: string; // 'Shockwave',
  Handing?: string; // '2h',
  Button?: string; // 'R1',
  Number?: string; // '1',
  Index?: string; // '0',
  IsLackingFP?: string; // 'Lacking FP',
  IsTick?: string; // 'Tick',
}

export interface ParsedWeaponArtData {
  "Unique Skill Weapon"?: string; // '',
  Name?: string; // 'Earthshaker - Shockwave',
  AtkId?: string; // '300000322',
  movement: Record<DamageType, number>;
  "Stam Dmg MV"?: number; // '0',
  "Status MV"?: number; // '0',
  "Weapon Buff MV"?: number; // '0',
  "Poise Dmg MV"?: number; // '0',
  "Atk Repel MV"?: number; // '0',
  StaminaCost?: number; // '0',
  PhysAtkAttribute?: string; // 'Standard',
  "Shield Chip"?: number; // '0',
  disableGuard?: boolean; // 'FALSE',
  DamageLevel?: number; // '3', ??? Not sure what this should be
  dmgLevel_vsPlayer?: number; // '0', ??? Not sure what this should be
  ignoreDmgCount?: boolean; // 'FALSE',
  attack: Record<DamageType, number>;
  AtkStam?: number; // '90',
  AtkSuperArmor?: number; // '30',
  isAddBaseAtk?: boolean; // 'TRUE',
  overwriteAttackElementCorrectId?: string; // '51010',
  isDisableBothHandsAtkBonus?: boolean; // 'TRUE',
  IsArrowAtk?: boolean; // 'FALSE',
  subCategory1?: string; // 'Weapon Skill',
  subCategory2?: string; // '-',
  subCategory3?: string; // '-',
  subCategory4?: string; // '-',
  spEffectId0?: string; // '-1',
  spEffectId1?: string; // '-1',
  spEffectId2?: string; // '-1',
  spEffectId3?: string; // '-1',
  spEffectId4?: string; // '-1',
  "PvP Dmg Mult"?: number; // '0.8',
  "PvP Stam Dmg Mult"?: number; // '1.25',
  "PvP Poise Dmg Mult"?: number; // '2.7'
  parsedProperties: ParsedProperties;
}

const parseStringBoolean = (str?: string) => {
  switch (str) {
    case "TRUE":
      return true;
    case "FALSE":
      return false;
    default:
      return undefined;
  }
};

function createPropertiesFromName(name: string): ParsedProperties {
  const nameRegex =
    /^(?:\[(?<WeaponType>.+?)\] )?(?:(?<AshOfWarName>.+?) ?)?(?: - (?<Variant>\w+) ?)?(?: ?(?<Handing>[12]h) ?)?(?: ?(?<Button>[LR][12]) ?)?(?: ?#(?<Number>\d) ?)?(?: ?\[(?<Index>\d)\] ?)?(?:\((?<IsLackingFP>Lacking FP)\))?(?:\((?<IsTick>Tick)\))?$/;
  const match = name.match(nameRegex);
  if (!match?.groups) return {};
  const { WeaponType, AshOfWarName, Variant, Handing, Button, Number, Index, IsLackingFP, IsTick } =
    match.groups;
  return {
    WeaponType,
    AshOfWarName,
    Variant,
    Handing,
    Button,
    Number,
    Index,
    IsLackingFP,
    IsTick,
  };
}

async function main() {
  const filePath = path.resolve(__dirname, "./motion-values.csv");
  const ashOfWarMotionData: RawWeaponArtData[] = await csvToJSON().fromFile(filePath);
  const result: ParsedWeaponArtData[] = ashOfWarMotionData.map((d) => ({
    ...d,
    movement: {
      [DamageType.PHYSICAL]: parseInt(d["Phys MV"]),
      [DamageType.MAGIC]: parseInt(d["Magic MV"]),
      [DamageType.FIRE]: parseInt(d["Fire MV"]),
      [DamageType.LIGHTNING]: parseInt(d["Ltng MV"]),
      [DamageType.HOLY]: parseInt(d["Holy MV"]),
    },
    "Stam Dmg MV": parseInt(d["Stam Dmg MV"]),
    "Status MV": parseInt(d["Status MV"]),
    "Weapon Buff MV": parseInt(d["Weapon Buff MV"]),
    "Poise Dmg MV": parseInt(d["Poise Dmg MV"]),
    "Atk Repel MV": parseInt(d["Atk Repel MV"]),
    StaminaCost: parseInt(d["StaminaCost"]),
    "Shield Chip": parseInt(d["Shield Chip"]),
    DamageLevel: parseInt(d["DamageLevel"]),
    dmgLevel_vsPlayer: parseInt(d["dmgLevel_vsPlayer"]),
    attack: {
      [DamageType.PHYSICAL]: parseInt(d["AtkPhys"]),
      [DamageType.MAGIC]: parseInt(d["AtkMag"]),
      [DamageType.FIRE]: parseInt(d["AtkFire"]),
      [DamageType.LIGHTNING]: parseInt(d["AtkLtng"]),
      [DamageType.HOLY]: parseInt(d["AtkHoly"]),
    },
    AtkStam: parseInt(d["AtkStam"]),
    AtkSuperArmor: parseInt(d["AtkSuperArmor"]),
    disableGuard: parseStringBoolean(d.disableGuard),
    ignoreDmgCount: parseStringBoolean(d.ignoreDmgCount),
    isAddBaseAtk: parseStringBoolean(d.isAddBaseAtk),
    isDisableBothHandsAtkBonus: parseStringBoolean(d.isDisableBothHandsAtkBonus),
    IsArrowAtk: parseStringBoolean(d.IsArrowAtk),
    "PvP Dmg Mult": parseFloat(d["PvP Dmg Mult"]),
    "PvP Stam Dmg Mult": parseFloat(d["PvP Stam Dmg Mult"]),
    "PvP Poise Dmg Mult": parseFloat(d["PvP Poise Dmg Mult"]),
    parsedProperties: createPropertiesFromName(d.Name),
  }));
  writeFileSync(
    path.resolve(__dirname, "./ashOfWarMotionData.json"),
    JSON.stringify(result, null, 2),
  );
}

main();
