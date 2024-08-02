import { allDamageTypes, AttackPowerType } from "./attackPowerTypes";
import type { DamageAttribute } from "./attributes";
import { adjustStrengthForTwoHanding } from "./calculator";
import type { Weapon } from "./weapon";

type DamageTypeScaling = Partial<Record<AttackPowerType, number>>;
const damageTypeScaling: DamageTypeScaling = {};
type Attribute = "str" | "dex" | "int" | "fai" | "arc";

type DamageScalingPerAttribute = Record<Attribute, DamageTypeScaling[]>;
type DamageScalingReturnValue = {
  base: DamageTypeScaling;
  attackPower: DamageScalingPerAttribute;
  spellScaling: DamageScalingPerAttribute;
};
export function createDamageScalingPerAttribute(
  weapon: Weapon,
  weaponUpgradeLevel: number,
): {
  base: DamageTypeScaling;
  attackPower: DamageScalingPerAttribute;
  spellScaling: DamageScalingPerAttribute;
} {
  const returnValue: DamageScalingReturnValue = {
    base: {},
    attackPower: {
      str: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      dex: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      int: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      fai: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      arc: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    },
    spellScaling: {
      str: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      dex: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      int: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      fai: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
      arc: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    },
  };
  const baseWeaponAttackForWeaponLevel = weapon.attack[weaponUpgradeLevel]; // {0: 73.84, 1: 62.400000000000006, 8: 73}
  const scalingStatsForWeaponLevel = weapon.attributeScaling[weaponUpgradeLevel]; // {str: 0.3875, dex: 0.725, int: 0.65}
  returnValue.base = baseWeaponAttackForWeaponLevel;

  for (const damageType of allDamageTypes) {
    if (!baseWeaponAttackForWeaponLevel[damageType]) continue; // Does not have that damage type
    const baseDamageForDamageType = baseWeaponAttackForWeaponLevel[damageType]; // 73.84
    if (!baseDamageForDamageType) continue;

    const calcCorrectGraphForDamageType = weapon.calcCorrectGraphs[damageType]; // [1: 0, 2: 0.008344518906935003, 3: 0.01917067028327579, 4: 0.031185076135726773, ...]

    const scalingPairsForDamageType = Object.entries(scalingStatsForWeaponLevel).filter(
      ([attribute]) => weapon.attackElementCorrect[damageType]?.[attribute as Attribute],
    ) as [Attribute, number][];
    for (const [attribute, attributeScaling] of scalingPairsForDamageType) {
      // [str, 0.3875], [dex, 0.725], [int, 0.65]]
      const attributeScalingArray = returnValue.attackPower[attribute];
      for (let i = 0; i < attributeScalingArray.length; i++) {
        const isCatalyst = Boolean(weapon.sorceryTool || weapon.incantationTool);
        const scaling = attributeScaling * calcCorrectGraphForDamageType[i];

        returnValue.attackPower[attribute][i][damageType] = baseDamageForDamageType * scaling;
        if (isCatalyst) returnValue.spellScaling[attribute][i][damageType] = 100 * scaling;
      }
    }
  }
  return returnValue;
}
const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

type IncrementalTotalAndSourceDamage = { total: number } & Partial<DamageTypeScaling>;

export type IncrementalDamagePerAttribute = {
  base: IncrementalTotalAndSourceDamage;
  attackPower: Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>;
  spellPower: Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>;
};

export function getIncrementalDamagePerAttribute(
  weapon: Weapon,
  weaponUpgradeLevel: number,
  twoHanding: boolean,
): IncrementalDamagePerAttribute {
  const damageScalingPerAttribute = createDamageScalingPerAttribute(weapon, weaponUpgradeLevel);
  const attackPower = Object.entries(damageScalingPerAttribute.attackPower).reduce(
    (acc, [attribute, damageScaling]) => {
      if (attribute === "str" && Array.isArray(damageScaling) && twoHanding) {
        acc[attribute as Attribute] = damageScaling.map((v, i) => {
          const adjustedStrength = adjustStrengthForTwoHanding({ weapon, twoHanding, str: i });
          // Scaling values don't exist for 1.5*100 and onwards, so just return 0
          if (!damageScaling[adjustedStrength]) return { total: 0 };
          return {
            total: sumObjectValues(damageScaling[adjustedStrength]),
            ...damageScaling[adjustedStrength],
          };
        });
      } else if (Array.isArray(damageScaling)) {
        acc[attribute as Attribute] = damageScaling.map((v) => ({
          total: sumObjectValues(v) || 0,
          ...v,
        }));
      }
      return acc;
    },
    {} as IncrementalDamagePerAttribute["attackPower"],
  );
  const spellPower = Object.entries(damageScalingPerAttribute.spellScaling).reduce(
    (acc, [attribute, damageScaling]) => {
      acc[attribute as Attribute] = damageScaling.map((v) => ({
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
