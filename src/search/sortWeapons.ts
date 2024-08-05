import { getTotalDamageAttackPower } from "../app/uiUtils";
import { type WeaponTableRowData } from "../app/weaponTable/WeaponTable";
import { type DamageAttribute, AttackPowerType } from "../calculator/calculator";

export type SortBy =
  | "name"
  | "totalAttack"
  | `${AttackPowerType}Attack`
  | "sortBy"
  | `${AttackPowerType}SpellScaling`
  | `${DamageAttribute}Scaling`
  | `${DamageAttribute}Requirement`
  | `${DamageAttribute}OptimizedAP`
  | `${DamageAttribute}OptimizedSP`
  | `${AttackPowerType}OptimizedAttackByDamageType`
  | `totalOptimizedAP`
  | `attackPowerEfficiency`
  | `totalOptimizedEfficiency`
  | `totalOptimizedSP`
  | `disposableOptimizedPointsAP`
  | `disposableOptimizedPointsSP`
  | `totalOptimizedEnd`
  | `incrementalOptimizedEnd`;

/**
 * Sort and paginate a filtered list of weapons for display in the weapon table
 */
export function sortWeapons(
  rows: readonly WeaponTableRowData[],
  sortBy: SortBy,
  reverse: boolean,
): WeaponTableRowData[] {
  const getSortValue = ((): ((row: WeaponTableRowData) => number | string) => {
    if (sortBy === "name") {
      return ([weapon]) => `${weapon.weaponName},${weapon.affinityId.toString().padStart(4, "0")}`;
    }

    if (sortBy === "totalAttack") {
      return ([, { attackPower }]) => -getTotalDamageAttackPower(attackPower);
    }

    if (sortBy.endsWith("Attack")) {
      const attackPowerType = +sortBy.slice(0, -1 * "Attack".length) as AttackPowerType;
      return ([, { attackPower }]) => -(attackPower[attackPowerType] ?? 0);
    }

    if (sortBy.endsWith("SpellScaling")) {
      const attackPowerType = +sortBy.slice(0, -1 * "SpellScaling".length) as AttackPowerType;
      return ([, { spellScaling }]) => -(spellScaling[attackPowerType] ?? 0);
    }

    if (sortBy.endsWith("Scaling")) {
      const attribute = sortBy.slice(0, -1 * "Scaling".length) as DamageAttribute;
      return ([weapon, { upgradeLevel }]) =>
        -(weapon.attributeScaling[upgradeLevel][attribute] ?? 0);
    }

    if (sortBy.endsWith("OptimizedAttackByDamageType")) {
      const attackPowerType = +sortBy.slice(
        0,
        -1 * "OptimizedAttackByDamageType".length,
      ) as AttackPowerType;
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.attackPower?.optimalDamageSplit[attackPowerType] ?? 0);
    }

    if (sortBy.endsWith("Requirement")) {
      const attribute = sortBy.slice(0, -1 * "Requirement".length) as DamageAttribute;
      return ([weapon]) => -(weapon.requirements[attribute] ?? 0);
    }

    if (sortBy === "totalOptimizedAP") {
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.attackPower?.optimalDamage ?? 0);
    }
    if (sortBy === "totalOptimizedSP") {
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.spellPower?.optimalDamage ?? 0);
    }

    if (sortBy === "disposableOptimizedPointsAP") {
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.attackPower?.disposablePoints ?? 0);
    }

    if (sortBy === "totalOptimizedEfficiency") {
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.attackPower?.efficiencyScore ?? 0);
    }

    if (sortBy === "attackPowerEfficiency") {
      return ([weapon, weaponAttack, optimizedStats]) => -(weaponAttack.efficiencyScore ?? 0);
    }

    if (sortBy === "disposableOptimizedPointsSP") {
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.spellPower?.disposablePoints ?? 0);
    }

    if (sortBy === "totalOptimizedEnd") {
      return ([weapon, weaponAttack, optimizedStats]) => -(optimizedStats?.endurance.total ?? 0);
    }

    if (sortBy.endsWith("OptimizedAP")) {
      const attributeType = sortBy.slice(0, -1 * "OptimizedAP".length) as DamageAttribute;
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.attackPower?.optimalAttributes[attributeType] ?? 0);
    }

    if (sortBy.endsWith("OptimizedSP")) {
      const attributeType = sortBy.slice(0, -1 * "OptimizedSP".length) as DamageAttribute;
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.spellPower?.optimalAttributes[attributeType] ?? 0);
    }

    return () => "";
  })();

  return [...rows].sort((row1, row2) =>
    getSortValue(row1) > getSortValue(row2) !== reverse ? 1 : -1,
  );
}
