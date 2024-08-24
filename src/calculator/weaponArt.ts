type WeaponArtCategory = "WeaponHit" | "EnhancedHit" | "FakeEnhancedHit" | "BulletArt" | "WindArt";

import { AffinityType } from "../app/uiUtils";
// Calculation logic sourced from here https://www.youtube.com/watch?v=5F9-TyuIICw
import { type ParsedWeaponArtData } from "../buildAshOfWarData";
import { allDamageTypes, DamageType } from "./attackPowerTypes";
import { damageAttributes, type DamageAttributeValues } from "./attributes";
import { type DamageTypeScaling } from "./newCalculator";
import type { Weapon } from "./weapon";

export function getWeaponArtCategory(ashOfWarData: ParsedWeaponArtData): WeaponArtCategory {
  const hasAttackValues = Object.values(ashOfWarData.attack).some((mv) => mv > 0);
  const hasMovementValues = Object.values(ashOfWarData.movement).some((mv) => mv > 0);
  if (hasAttackValues && hasMovementValues) {
    return "EnhancedHit"; // i.e. Loretta's Slash, Glinstone Pebble (Follow Up)
  } else if (hasMovementValues) {
    return "WeaponHit"; // i.e. Lion's Claw
  } else if (hasAttackValues) {
    return "BulletArt";
    // eslint-disable-next-line
  } else if (false) {
    // TODO: Implement logic for FakeEnhancedHit
    return "FakeEnhancedHit"; // i.e. Flaming Strike ( Follow Up )
  }

  return "WindArt";
}
function multiplyObjects<K extends string>(
  ...objects: Array<Partial<Record<K, number>>>
): Partial<Record<K, number>> {
  return objects.reduce((acc, obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      const k = key as K;
      // If a number does not exist on the key, the value will be defaulted to 0 and therefore the result for that key will eventually be 0
      acc[k] = (acc[k] ?? 0) * (value as number);
    });
    return acc;
  }, {} as Partial<Record<K, number>>);
}
const createDamageObjectWithValue = (value: number) => ({
  [DamageType.PHYSICAL]: value,
  [DamageType.MAGIC]: value,
  [DamageType.FIRE]: value,
  [DamageType.LIGHTNING]: value,
  [DamageType.HOLY]: value,
});

export function calculateWeaponArtDamage(
  weapon: Weapon,
  attributes: DamageAttributeValues,
  ashOfWarData: ParsedWeaponArtData,
  weaponAttackPower: Partial<Record<DamageType, number>>,
  percentWeaponUpgrade: number, // i.e. 25/25 or 10/10 === 1, 20/25 would be 0.8 and 2/10 would be 0.2
): DamageTypeScaling {
  const weaponArtCategory = getWeaponArtCategory(ashOfWarData);

  // Movement actually represents a percentage increase, i.e. 240 = 2.4x so divide by 100
  const movementPercentage = multiplyObjects(
    ashOfWarData.movement,
    createDamageObjectWithValue(0.01),
  );

  if (weaponArtCategory === "WeaponHit") {
    return multiplyObjects(movementPercentage, weaponAttackPower);
  } else if (weaponArtCategory === "EnhancedHit") {
    const movementDamage = multiplyObjects(movementPercentage, weaponAttackPower);
    const weaponUpgradeMultiplier = createDamageObjectWithValue(1 + 3 * percentWeaponUpgrade);
    const scalingAttributes = {
      [DamageType.PHYSICAL]: weapon.calcCorrectGraphs[DamageType.PHYSICAL],
      [DamageType.MAGIC]: weapon.calcCorrectGraphs[DamageType.MAGIC],
      [DamageType.FIRE]: weapon.calcCorrectGraphs[DamageType.FIRE],
      [DamageType.LIGHTNING]: weapon.calcCorrectGraphs[DamageType.LIGHTNING],
      [DamageType.HOLY]: weapon.calcCorrectGraphs[DamageType.HOLY],
    };

    // eslint-disable-next-line no-debugger
    debugger;
    // const calcscalingAttributesCorrect = weapon.calcCorrectGraphs[attackPowerType];
    // const calcCorrectForDamageType = allDamageTypes.reduce((acc, damageType) => {

    // }, {} as Record<DamageType, number>);
    // (ashOfWarData.attack) * ( 1 + 3 * PWU ) * ( 1 + ( weapon scaling multiplier (i.e. S/A/B/C/D ) * stat_multiplier_for_stat_level ) )
    return multiplyObjects(movementDamage, weaponUpgradeMultiplier);
  } else if (weaponArtCategory === "BulletArt") {
    // (ashOfWarData.attack) * ( 1 + 3 * PWU ) * ( 1 + ( base scaling<{ unique: weaponScalingWithoutUpgrades, singleStat: .25, doubleStat: .15 each}> * affinity scaling multiplier * stat multiplier ) )
    return ashOfWarData.attack;
  }
  return {};
}
type DamageAttribute = typeof damageAttributes[number];

const weaponAffinityScalingAttributesForAffinity: Partial<Record<AffinityType, DamageAttribute[]>> =
  {
    [AffinityType.HEAVY]: ["str"],
    [AffinityType.FIRE]: ["str"],
    [AffinityType.KEEN]: ["dex"],
    [AffinityType.LIGHTNING]: ["dex"],
    [AffinityType.QUALITY]: ["str", "dex"],
    [AffinityType.COLD]: ["int", "dex"],
    [AffinityType.MAGIC]: ["int"],
    [AffinityType.SACRED]: ["fai"],
    [AffinityType.FLAME_ART]: ["fai"],
    [AffinityType.BLOOD]: ["arc"],
    [AffinityType.POISON]: ["arc"],
    [AffinityType.OCCULT]: ["arc"],
  };
/*
Record<Weapon Art Affinity, Stat Scaling>

*/

const weaponAffinityScaling = {
  Standard: { STR: 1.5, DEX: 1.5, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  "Standard (Bow/Shield)": { STR: 1.8, DEX: 1.8, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  "Heavy (Strong)": { STR: 2.8, DEX: 0, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  "Heavy (Weak)": { STR: 2.6, DEX: 1.2, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  Fire: { STR: 2.1, DEX: 1.2, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  "Keen (Strong)": { STR: 1.3, DEX: 2.8, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  "Keen (Weak)": { STR: 1.3, DEX: 2.5, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  Lightning: { STR: 1.2, DEX: 2.1, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  Quality: { STR: 1.9, DEX: 1.9, INT: 1.8, FAI: 1.8, ARC: 1.8 },
  Cold: { STR: 1.9, DEX: 1.9, INT: 2.0, FAI: 1.8, ARC: 1.8 },
  Magic: { STR: 1.3, DEX: 1.3, INT: 2.35, FAI: 1.8, ARC: 1.8 },
  Sacred: { STR: 1.8, DEX: 1.8, INT: 1.8, FAI: 2.3, ARC: 1.8 },
  Flame: { STR: 1.8, DEX: 1.8, INT: 1.8, FAI: 2.3, ARC: 1.8 },
  Blood: { STR: 1.9, DEX: 1.9, INT: 1.9, FAI: 1.9, ARC: 1.45 },
  Poison: { STR: 1.9, DEX: 1.9, INT: 1.9, FAI: 1.9, ARC: 1.45 },
  Occult: { STR: 1.5, DEX: 1.5, INT: 1.5, FAI: 1.5, ARC: 1.8 },
};
