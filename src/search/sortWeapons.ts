import { getTotalDamageAttackPower } from "../app/uiUtils";
import { type FixedAttributeTableRowData } from "../app/weaponTable/FixedAttributeTable/FixedAttributeTable";
import { type DamageAttribute, AttackPowerType } from "../calculator/calculator";

export type SortBy =
  | "name"
  | "totalAttack"
  | `${AttackPowerType}Attack`
  | "sortBy"
  | "attackPowerEfficiency"
  | `${AttackPowerType}SpellScaling`
  | `${DamageAttribute}Scaling`
  | `${DamageAttribute}Requirement`;

/**
 * Sort and paginate a filtered list of weapons for display in the weapon table
 */
export function sortWeapons(
  rows: readonly FixedAttributeTableRowData[],
  sortBy: SortBy,
  reverse: boolean,
): FixedAttributeTableRowData[] {
  const getSortValue = ((): ((row: FixedAttributeTableRowData) => number | string) => {
    if (sortBy === "name") {
      return ({ weapon }) =>
        `${weapon.weaponName},${weapon.affinityId.toString().padStart(4, "0")}`;
    }

    if (sortBy === "totalAttack") {
      return ({ weaponAttackData: { attackPower } }) => -getTotalDamageAttackPower(attackPower);
    }

    if (sortBy === "attackPowerEfficiency") {
      return ({ weaponAttackData: { efficiencyScore } }) => -(efficiencyScore ?? 0);
    }

    if (sortBy.endsWith("Attack")) {
      const attackPowerType = +sortBy.slice(0, -1 * "Attack".length) as AttackPowerType;
      return ({ weaponAttackData: { attackPower } }) => -(attackPower[attackPowerType] ?? 0);
    }

    if (sortBy.endsWith("SpellScaling")) {
      const attackPowerType = +sortBy.slice(0, -1 * "SpellScaling".length) as AttackPowerType;
      return ({ weaponAttackData: { spellScaling } }) => -(spellScaling[attackPowerType] ?? 0);
    }

    if (sortBy.endsWith("Scaling")) {
      const attribute = sortBy.slice(0, -1 * "Scaling".length) as DamageAttribute;
      return ({ weapon, upgradeLevel }) =>
        -(weapon.attributeScaling[upgradeLevel][attribute] ?? 0);
    }

    if (sortBy.endsWith("Requirement")) {
      const attribute = sortBy.slice(0, -1 * "Requirement".length) as DamageAttribute;
      return ({ weapon }) => -(weapon.requirements[attribute] ?? 0);
    }

    return () => "";
  })();

  return [...rows].sort((row1, row2) =>
    getSortValue(row1) > getSortValue(row2) !== reverse ? 1 : -1,
  );
}
