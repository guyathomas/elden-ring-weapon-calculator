import { allDamageTypes, AttackPowerType } from "./attackPowerTypes";
import type { DamageAttribute } from "./attributes";
import type { Weapon } from "./weapon";

type DamageTypeScaling = Partial<Record<AttackPowerType, number>>;
const damageTypeScaling: DamageTypeScaling = {};
type Attribute = "str" | "dex" | "int" | "fai" | "arc";

export function createDamageScalingPerAttribute(weapon: Weapon, weaponUpgradeLevel: number) {
  const returnValue: Record<Attribute, DamageTypeScaling[]> & { base: DamageTypeScaling } = {
    str: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    dex: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    int: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    fai: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    arc: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    base: {},
  };
  // TODO: Fix the unarmed case. There is only 1 weapon upgrade and not sure how to hanldle it. Added the || {} to be safe
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
      const attributeScalingArray = returnValue[attribute];
      for (let i = 0; i < attributeScalingArray.length; i++) {
        const attributeLevelScaling = attributeScalingArray[i];

        const scaling = attributeScaling * calcCorrectGraphForDamageType[i];
        attributeLevelScaling[damageType] = baseDamageForDamageType * scaling;
        if (Object.values(attributeLevelScaling[damageType]).length > 1) {
          // TODO: Remove me
          console.log(
            `zzz Weapon ${weapon.name} has multiple values for ${attribute} at level ${i}`,
            Object.keys(attributeLevelScaling[damageType]),
          );
        }
      }
    }
  }
  return returnValue;
}
const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

export function getIncrementalDamagePerAttribute(weapon: Weapon, weaponUpgradeLevel: number) {
  const damageScalingPerAttribute = createDamageScalingPerAttribute(weapon, weaponUpgradeLevel);

  return Object.entries(damageScalingPerAttribute).reduce((acc, [attribute, damageScaling]) => {
    if (attribute === "base" && !Array.isArray(damageScaling)) {
      acc.base = Object.entries(damageScaling).reduce((acc, [damageType, damage]) => {
        return (
          acc + (allDamageTypes.includes(parseInt(damageType) as AttackPowerType) ? damage : 0)
        );
      }, 0);
    } else if (attribute !== "base" && Array.isArray(damageScaling)) {
      acc[attribute as Attribute] = damageScaling.map((v) => sumObjectValues(v) || 0);
    }
    return acc;
  }, {} as Record<DamageAttribute, number[]> & Record<"base", number>);
}
