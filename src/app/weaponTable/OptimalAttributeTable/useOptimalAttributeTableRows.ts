import { useMemo } from "react";
import {
  WeaponType,
  type DamageAttributeValues,
  type Weapon,
} from "../../../calculator/calculator";
import { type RegulationVersion } from "../../regulationVersions";
import { allWeaponTypes, weaponTypeLabels } from "../../uiUtils";
import type { OptimalAttribute } from "./useOptimalAttributes";
import { sortSolverWeapons, type SortBy } from "./sortOptimalWeapons";
import type { OptimalAttributeTableRowGroup } from "./OptimalAttributeTable";

type SolverWeaponTableData = { weapon: Weapon; optimalAttributes: OptimalAttribute };

interface WeaponTableRowsOptions {
  weapons: readonly Weapon[];
  regulationVersion: RegulationVersion;
  offset: number;
  limit: number;
  sortBy: SortBy;
  reverse: boolean;
  attributes: DamageAttributeValues;
  twoHanding: boolean;
  upgradeLevel: number;
  groupWeaponTypes: boolean;
  maxUpgradeLevel: number;
}

interface WeaponTableRowsResult {
  rows: OptimalAttributeTableRowGroup[];

  /**True if at least one weapon in the filtered results can cast spells */
  hasSpellScaling: boolean;
}

/**
 * Filter, sort, and paginate the weapon list based on the current selections
 */
const useWeaponSolverRows = ({
  weapons,
  offset,
  limit,
  groupWeaponTypes,
  sortBy,
  reverse,
}: WeaponTableRowsOptions): WeaponTableRowsResult => {
  const hasSpellScaling = weapons.some((weapon) => weapon.sorceryTool || weapon.incantationTool);
  const rows = useMemo<SolverWeaponTableData[]>(
    () =>
      weapons.map((weapon): SolverWeaponTableData => {
        return {
          weapon,
          optimalAttributes: {}, // TODO: Add this
        };
      }),
    [weapons],
  );

  const rowGroups = useMemo<OptimalAttributeTableRowGroup[]>(() => {
    if (groupWeaponTypes) {
      const rowsByWeaponType: Map<WeaponType, SolverWeaponTableData[]> = rows.reduce((acc, row) => {
        const rowsForWeaponType = acc.get(row.weapon.weaponType) ?? [];
        return acc.set(row.weapon.weaponType, [...rowsForWeaponType, row]);
      }, new Map());

      return allWeaponTypes.reduce((acc, weaponType) => {
        const weaponsForType = rowsByWeaponType.get(weaponType);
        if (weaponsForType) {
          acc.push({
            key: weaponType.toString(),
            name: weaponTypeLabels.get(weaponType)!,
            rows: sortSolverWeapons(weaponsForType, sortBy, reverse),
          });
        }
        return acc;
      }, [] as OptimalAttributeTableRowGroup[]);
    }

    return rows.length
      ? [
          {
            key: "allWeapons",
            rows: sortSolverWeapons(rows, sortBy, reverse).slice(offset, limit),
          },
        ]
      : [];
  }, [rows, reverse, sortBy, groupWeaponTypes, offset, limit]);

  return {
    rows: rowGroups,
    hasSpellScaling,
  };
};

export default useWeaponSolverRows;
