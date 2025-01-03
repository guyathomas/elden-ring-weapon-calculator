import { type OptimalAttributeTableRowData } from "./OptimalAttributeTable";
import { type DamageAttribute, AttackPowerType } from "../../../calculator/calculator";

export type SortBy =
  | "name"
  | "sortBy"
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
export function sortSolverWeapons(
  rows: readonly OptimalAttributeTableRowData[],
  sortBy: SortBy,
  reverse: boolean,
): OptimalAttributeTableRowData[] {
  const getSortValue = ((): ((row: OptimalAttributeTableRowData) => number | string) => {
    if (sortBy === "name") {
      return ({ weapon }) =>
        `${weapon.weaponName},${weapon.affinityId.toString().padStart(4, "0")}`;
    }

    if (sortBy.endsWith("OptimizedAttackByDamageType")) {
      const suffixLength = "OptimizedAttackByDamageType".length;
      const attackPowerType = sortBy.slice(0, -1 * suffixLength) as AttackPowerType;
      return ({ optimalAttributes }) =>
        -(optimalAttributes?.attackPower?.optimalDamageSplit[attackPowerType] ?? 0);
    }

    if (sortBy === "totalOptimizedAP") {
      return ({ optimalAttributes }) => -(optimalAttributes?.attackPower?.optimalDamage ?? 0);
    }
    if (sortBy === "totalOptimizedSP") {
      return ({ optimalAttributes }) => -(optimalAttributes?.spellPower?.optimalDamage ?? 0);
    }

    if (sortBy === "disposableOptimizedPointsAP") {
      return ({ optimalAttributes }) => -(optimalAttributes?.attackPower?.disposablePoints ?? 0);
    }

    if (sortBy === "totalOptimizedEfficiency") {
      return ({ optimalAttributes }) => -(optimalAttributes?.attackPower?.efficiencyScore ?? 0);
    }
    if (sortBy === "disposableOptimizedPointsSP") {
      return ({ optimalAttributes }) => -(optimalAttributes?.spellPower?.disposablePoints ?? 0);
    }

    if (sortBy === "totalOptimizedEnd") {
      return ({ optimalAttributes }) => -(optimalAttributes?.endurance?.total ?? 0);
    }

    if (sortBy.endsWith("OptimizedAP")) {
      const attributeType = sortBy.slice(0, -1 * "OptimizedAP".length) as DamageAttribute;
      return ({ optimalAttributes }) =>
        -(optimalAttributes?.attackPower?.optimalAttributes[attributeType] ?? 0);
    }

    if (sortBy.endsWith("OptimizedSP")) {
      const attributeType = sortBy.slice(0, -1 * "OptimizedSP".length) as DamageAttribute;
      return ({ optimalAttributes }) =>
        -(optimalAttributes?.spellPower?.optimalAttributes[attributeType] ?? 0);
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
