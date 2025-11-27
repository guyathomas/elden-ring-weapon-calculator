import { damageAttributes, type DamageAttribute, type DamageAttributeValues } from "./attributes.ts";
import { AttackPowerType, allAttackPowerTypes, allDamageTypes } from "./attackPowerTypes.ts";
import type { Weapon, AttackCorrect } from "./weapon.ts";
import { WeaponType } from "./weaponTypes.ts";


interface WeaponAttackOptions {
  weapon: Weapon;
  attributes: DamageAttributeValues;
  twoHanding?: boolean;
  upgradeLevel: number;
  disableTwoHandingAttackPowerBonus: boolean;
  ineffectiveAttributePenalty: number;
}

export interface WeaponAttackResult {
  attackPower: Partial<Record<AttackPowerType, number>>;
  spellScaling: Partial<Record<AttackPowerType, number>>;
  ineffectiveAttributes: DamageAttribute[];
  ineffectiveAttackPowerTypes: AttackPowerType[];
}

export function adjustStrengthForTwoHanding({
  twoHanding = false,
  weapon,
  str,
}: {
  twoHanding?: boolean;
  weapon: Weapon;
  str: number;
}): number {
  let applyTwoHandingBonus = twoHanding;

  // Paired weapons do not get the two handing bonus
  if (weapon.paired) {
    applyTwoHandingBonus = false;
  }

  // Bows and ballistae can only be two handed
  if (
    weapon.weaponType === WeaponType.LIGHT_BOW ||
    weapon.weaponType === WeaponType.BOW ||
    weapon.weaponType === WeaponType.GREATBOW ||
    weapon.weaponType === WeaponType.BALLISTA
  ) {
    applyTwoHandingBonus = true;
  }
  // 148 is the max allowed attribute value
  return applyTwoHandingBonus ? Math.min(Math.floor(str * 1.5), 148) : str;
}

/**
 * Determine the damage for a weapon with the given player stats
 */
export default function getWeaponAttack({
  weapon,
  attributes,
  twoHanding,
  upgradeLevel,
  disableTwoHandingAttackPowerBonus,
  ineffectiveAttributePenalty,
}: WeaponAttackOptions): WeaponAttackResult {
  const adjustedAttributes: DamageAttributeValues = {
    ...attributes,
    str: adjustStrengthForTwoHanding({ twoHanding, weapon, str: attributes.str }),
  };

  const ineffectiveAttributes = (Object.entries(weapon.requirements) as [DamageAttribute, number][])
    .filter(([attribute, requirement]) => adjustedAttributes[attribute] < requirement)
    .map(([attribute]) => attribute);

  const ineffectiveAttackPowerTypes: AttackPowerType[] = [];

  const attackPower: Partial<Record<AttackPowerType, number>> = {};
  const spellScaling: Partial<Record<AttackPowerType, number>> = {};

  for (const attackPowerType of allAttackPowerTypes) {
    const isDamageType = allDamageTypes.includes(attackPowerType);

    const baseAttackPower = weapon.attack[upgradeLevel][attackPowerType] ?? 0;
    if (baseAttackPower || weapon.sorceryTool || weapon.incantationTool) {
      // This weapon's AttackElementCorrectParam determines what attributes each damage type scales
      // with
      const scalingAttributes = weapon.attackElementCorrect[attackPowerType] ?? {};

      let totalScaling = 1;

      if (ineffectiveAttributes.some((attribute) => scalingAttributes[attribute])) {
        // If the requirements for this damage type are not met, a penalty is subtracted instead
        // of a scaling bonus being added
        totalScaling = 1 - ineffectiveAttributePenalty;
        ineffectiveAttackPowerTypes.push(attackPowerType);
      } else {
        // Otherwise, the scaling multiplier is equal to the sum of the corrected attribute values
        // multiplied by the scaling for that attribute
        const effectiveAttributes =
          !disableTwoHandingAttackPowerBonus && isDamageType ? adjustedAttributes : attributes;
        for (const attribute of damageAttributes) {
          const attributeCorrect = scalingAttributes[attribute];
          if (attributeCorrect) {
            const attributeScaling = weapon.attributeScaling[upgradeLevel][attribute] || 0;
            const baseAttributeScaling = weapon.attributeScaling[0][attribute] || 0;
            const calcCorrectGraphValue =
              weapon.calcCorrectGraphs[attackPowerType][effectiveAttributes[attribute]];
            let scaling;
            if (attributeCorrect === true) {
              scaling = attributeScaling ?? 0;
            } else {
              scaling = (attributeCorrect * (attributeScaling ?? 0)) / (baseAttributeScaling ?? 0);
            }
            const v = scaling * calcCorrectGraphValue;
            totalScaling += v;
          }
        }
      }

      // The final scaling multiplier modifies the attack power for this damage type as a
      // percentage boost, e.g. 0.5 adds +50% of the base attack power
      if (baseAttackPower) {
        attackPower[attackPowerType] = baseAttackPower * totalScaling;
      }

      if (isDamageType && (weapon.sorceryTool || weapon.incantationTool)) {
        spellScaling[attackPowerType] = 100 * totalScaling;
      }
    }
  }

  return {
    attackPower,
    spellScaling,
    ineffectiveAttributes,
    ineffectiveAttackPowerTypes,
  };
}


export const maxRegularUpgradeLevel = 25;
export const maxSpecialUpgradeLevel = 10;

/**
 * @param regularUpgradeLevel the upgrade level of a regular weapon
 * @returns the corresponding upgrade level for a somber weapon. i.e. 25 > 10, 13 > 5
 */
export function toSpecialUpgradeLevel(regularUpgradeLevel: number) {
  // For in between levels with no exact equivalent, round down. I think this is what you would
  // look for in practice, e.g. if you pick +24 you probably want +9 sombers because you're not
  // spending an Ancient Dragon (Somber) Smithing Stone, although it's not necessarily the same
  // matchmaking range.
  return Math.floor(
    (regularUpgradeLevel + 0.5) * (maxSpecialUpgradeLevel / maxRegularUpgradeLevel),
  );
}

export function getNormalizedUpgradeLevel(weapon: Weapon, upgradeLevel: number) {
  const isSpecialWeapon = weapon.attack.length - 1 === maxSpecialUpgradeLevel;
  return isSpecialWeapon
    ? toSpecialUpgradeLevel(upgradeLevel)
    : Math.min(upgradeLevel, weapon.attack.length - 1);
}

/**
 * @param regularUpgradeLevel the upgrade level of a somber weapon
 * @returns the corresponding upgrade level for a regular weapon
 */
export function toRegularUpgradeLevel(specialUpgradeLevel: number) {
  return Math.floor(specialUpgradeLevel * 2.5);
}

/*
  Get unique values out of an array of objects based on a key
*/
export function getUniqueValues<T>(array: T[], key: keyof T): T[] {
  const seenValues = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seenValues.has(value)) {
      return false;
    } else {
      seenValues.add(value);
      return true;
    }
  });
}

type DamageTypeScaling = Partial<Record<AttackPowerType, number>>;

const ATTRIBUTE_SCALING_LENGTH = 150;
const createReturnValue = ({ base }: { base: DamageTypeScaling }): DamageScalingReturnValue => ({
  base,
  attackPower: {},
});
const createDefaultScalingArray = () =>
  Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({}) as DamageTypeScaling);

type DamageScalingPerAttribute = Record<DamageAttribute, DamageTypeScaling[]>;
type DamageScalingReturnValue = {
  base: DamageTypeScaling;
  attackPower: Partial<DamageScalingPerAttribute>;
  spellScaling?: Partial<DamageScalingPerAttribute>;
};

export function calculateFinalScaling({
  attributeCorrect,
  attributeScaling,
  baseAttributeScaling,
  calcCorrectGraphValue,
}: {
  attributeCorrect: AttackCorrect;
  attributeScaling: number;
  baseAttributeScaling: number;
  calcCorrectGraphValue: number;
}): number {
  let scaling;
  if (attributeCorrect === true) {
    scaling = attributeScaling ?? 0;
  } else {
    scaling = (attributeCorrect * (attributeScaling ?? 0)) / (baseAttributeScaling ?? 0);
  }
  return scaling * calcCorrectGraphValue;
}
const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

/*
  @returns for attackPower or spellScaling the scaling factor to be applied for each damage type at each attribute level
    {
      str: [{ '0': 0.02 }, { '0': 0.03 }, { '0': 0.04 }, ... }],
      ...
    }
*/
export function createDamageScalingPerAttribute(
  weapon: Weapon,
  weaponUpgradeLevel: number,
): DamageScalingReturnValue {
  const base = weapon.attack[weaponUpgradeLevel]; // {0: 73.84, 1: 62.400000000000006, 8: 73}
  return Object.entries(base).reduce((acc, [attackPowerTypeString, baseDamage]) => {
    const attackPowerType = parseInt(attackPowerTypeString) as AttackPowerType;
    // Which attributes affect scaling
    const attributeScalingFactors = weapon.attackElementCorrect[attackPowerType]; // {str: true, dex: 0.18}
    // Incremental damage for each attribute level. Multiplier by the scaling factor
    const calcCorrectGraphForDamageType = weapon.calcCorrectGraphs[attackPowerType]; // [1: 0, 2: 0.008344518906935003, 3: 0.01917067028327579, 4: 0.031185076135726773, ...]
    // Scaling for the weapon upgrade level
    const scalingForUpgradeLevel = weapon.attributeScaling[weaponUpgradeLevel]; // {str: 0.12, dex: 0.987}

    Object.entries(attributeScalingFactors || {}).forEach(
      ([untypedAttribute, attributeCorrect]) => {
        const attribute = untypedAttribute as DamageAttribute;
        for (let attrLvl = 0; attrLvl < ATTRIBUTE_SCALING_LENGTH; attrLvl++) {
          const attributeScaling = scalingForUpgradeLevel[attribute] || 0;
          const finalScaling = calculateFinalScaling({
            attributeCorrect, // true or 0.18
            attributeScaling,
            baseAttributeScaling: weapon.attributeScaling[0][attribute] || 0,
            calcCorrectGraphValue: calcCorrectGraphForDamageType[attrLvl],
          });
          if (!finalScaling) continue;
          if (!acc.attackPower[attribute]) acc.attackPower[attribute] = createDefaultScalingArray();
          acc.attackPower[attribute][attrLvl][attackPowerType] = baseDamage * (finalScaling || 0);
          if (weapon.sorceryTool || weapon.incantationTool) {
            if (!acc.spellScaling) acc.spellScaling = {};
            if (!acc.spellScaling[attribute]) {
              acc.spellScaling[attribute] = createDefaultScalingArray();
            }
            acc.spellScaling[attribute][attrLvl][attackPowerType] = 100 * finalScaling;
          }
        }
      },
    );
    return acc;
  }, createReturnValue({ base }));
}

export type IncrementalTotalAndSourceDamage = { total: number } & Partial<DamageTypeScaling>;

export type IncrementalDamagePerAttribute = {
  base: IncrementalTotalAndSourceDamage;
  attackPower: Partial<Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>>;
  spellPower?: Partial<Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>>;
};

/*
  @returns for attackPower or spellScaling the amount of damage for each DamageType that a given attribute level provides
  {
    base : { 0: 161.70000000000002, 4: 159.25 }, 
    attackPower: {
      str: [{ '0': 4.3, total: 4.3 }, { '0': 6.3, total: 6.3 }, { '0': 7.3, total: 7.3 }, ...],
      dex: [{},{},{}],
    }
    spellPower: {
      int: [{ '0': 4.3, total: 4.3 }, { '0': 6.3, total: 6.3 }, { '0': 7.3, total: 7.3 }, ...],
      str: [{},{},{}],
    }
  }

*/
export function getIncrementalDamagePerAttribute(
  weapon: Weapon,
  weaponUpgradeLevel: number,
  twoHanding: boolean,
): IncrementalDamagePerAttribute {
  const damageScalingPerAttribute = createDamageScalingPerAttribute(weapon, weaponUpgradeLevel);

  const attackPower = Object.entries(damageScalingPerAttribute.attackPower).reduce(
    (acc, [attribute, damageScaling]) => {
      acc[attribute as DamageAttribute] = damageScaling.map((v, i) => {
        const attributeValue =
          attribute === "str" && twoHanding
            ? adjustStrengthForTwoHanding({ weapon, twoHanding, str: i })
            : i;

        return {
          total: sumObjectValues(damageScaling[attributeValue]) || 0,
          ...damageScaling[attributeValue],
        };
      });
      return acc;
    },
    {} as Partial<Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>>,
  );
  const spellPower = damageScalingPerAttribute.spellScaling
    ? Object.entries(damageScalingPerAttribute.spellScaling).reduce(
        (acc, [attribute, damageScaling]) => {
          acc[attribute as DamageAttribute] = damageScaling.map((v) => ({
            total: v["0"] || 0,
          }));
          return acc;
        },
        {} as Partial<Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>>,
      )
    : undefined;
  const base = Object.entries(damageScalingPerAttribute.base).reduce(
    (acc, [damageType, damage]) => {
      const attackPowerType = parseInt(damageType) as AttackPowerType;
      const isDamageType = allDamageTypes.includes(attackPowerType);
      if (isDamageType) {
        acc.total += damage;
        acc[attackPowerType] = damage;
      }
      return acc;
    },
    { total: 0 } as IncrementalTotalAndSourceDamage,
  );

  return {
    base,
    attackPower,
    spellPower,
  };
}

export * from "./attributes.ts";
export * from "./attackPowerTypes.ts";
export * from "./weapon.ts";
export * from "./weaponTypes.ts";
