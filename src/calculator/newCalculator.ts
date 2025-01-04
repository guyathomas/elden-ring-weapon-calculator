import { allDamageTypes, AttackPowerType } from "./attackPowerTypes";
import type { DamageAttribute } from "./attributes";
import { adjustStrengthForTwoHanding } from "./calculator";
import type { AttackCorrect, AttackElementCorrect, Weapon } from "./weapon";

type DamageTypeScaling = Partial<Record<AttackPowerType, number>>;
const damageTypeScaling: DamageTypeScaling = {};

const ATTRIBUTE_SCALING_LENGTH = 150;
const createReturnValue = ({ base }: { base: DamageTypeScaling }): DamageScalingReturnValue => ({
  base,
  attackPower: {
    str: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    dex: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    int: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    fai: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    arc: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
  },
  spellScaling: {
    str: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    dex: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    int: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    fai: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
    arc: Array.from({ length: ATTRIBUTE_SCALING_LENGTH }, () => ({ ...damageTypeScaling })),
  },
});

type DamageScalingPerAttribute = Record<DamageAttribute, DamageTypeScaling[]>;
type DamageScalingReturnValue = {
  base: DamageTypeScaling;
  attackPower: DamageScalingPerAttribute;
  spellScaling: DamageScalingPerAttribute;
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
): {
  base: DamageTypeScaling;
  attackPower: DamageScalingPerAttribute;
  spellScaling: DamageScalingPerAttribute;
} {
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
          const finalScaling = calculateFinalScaling({
            attributeCorrect, // true or 0.18
            attributeScaling: scalingForUpgradeLevel[attribute] || 0,
            baseAttributeScaling: weapon.attributeScaling[0][attribute] || 0,
            calcCorrectGraphValue: calcCorrectGraphForDamageType[attrLvl],
          });

          acc.attackPower[attribute][attrLvl][attackPowerType] = baseDamage * (finalScaling || 0);
          if (weapon.sorceryTool || weapon.incantationTool) {
            acc.spellScaling[attribute][attrLvl][attackPowerType] = 100 * finalScaling;
          }
        }
      },
    );
    return acc;
  }, createReturnValue({ base }));
}

type IncrementalTotalAndSourceDamage = { total: number } & Partial<DamageTypeScaling>;

export type IncrementalDamagePerAttribute = {
  base: IncrementalTotalAndSourceDamage;
  attackPower: Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>;
  spellPower: Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>;
};

/*
  @returns for attackPower or spellScaling the amount of damage for each DamageType that a given attribute level provides
    {
      str: [{ '0': 4.3 '4': 2.5 }, { '0': 6.3 '4': 3.5 }, { '0': 7.3 '4': 4.5 }, ...],
      ...
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
    {} as IncrementalDamagePerAttribute["attackPower"],
  );
  const spellPower = Object.entries(damageScalingPerAttribute.spellScaling).reduce(
    (acc, [attribute, damageScaling]) => {
      acc[attribute as DamageAttribute] = damageScaling.map((v) => ({
        total: v["0"] || 0,
      })); // Only applies scaling off this attackType
      return acc;
    },
    {} as IncrementalDamagePerAttribute["spellPower"],
  );
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
