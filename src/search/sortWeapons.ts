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
  | `${DamageAttribute}Optimized`
  | `totalAttackOptimized`
  | `optimizedDisposablePoints`;

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

    if (sortBy.endsWith("Requirement")) {
      const attribute = sortBy.slice(0, -1 * "Requirement".length) as DamageAttribute;
      return ([weapon]) => -(weapon.requirements[attribute] ?? 0);
    }

    if (sortBy === "totalAttackOptimized") {
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.highestWeaponAttackResult ?? 0);
    }

    // if (sortBy === "optimizedDisposablePoints") {
    //   return ([weapon, weaponAttack, optimizedStats]) => -(optimizedStats?.disposablePoints ?? 0);
    // }

    if (sortBy.endsWith("Optimized")) {
      const attributeType = sortBy.slice(0, -1 * "Optimized".length) as DamageAttribute;
      return ([weapon, weaponAttack, optimizedStats]) =>
        -(optimizedStats?.highestAttributes[attributeType] ?? 0);
    }

    return () => "";
  })();

  return [...rows].sort((row1, row2) =>
    getSortValue(row1) > getSortValue(row2) !== reverse ? 1 : -1,
  );
}
