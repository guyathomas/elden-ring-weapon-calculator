import { useDeferredValue, useMemo } from "react";
import { WeaponType, type DamageAttribute, type Weapon } from "../../../calculator/calculator";
import { allWeaponTypes, getNormalizedUpgradeLevel, weaponTypeLabels } from "../../uiUtils";
import type { OptimalAttributesMap } from "./useOptimalAttributes";
import { sortSolverWeapons, type SortBy } from "./sortOptimalWeapons";
import type { OptimalAttributeTableRowGroup } from "./OptimalAttributeTable";
import { INITIAL_CLASS_VALUES, type StartingClass } from "../../ClassPicker";
import type { OptimalAttributeTableRowData } from "./OptimalAttributeTable";

interface WeaponTableRowsOptions {
  weapons: readonly Weapon[];
  offset: number;
  limit: number;
  sortBy: SortBy;
  reverse: boolean;
  upgradeLevel: number;
  groupWeaponTypes: boolean;
  optimalAttributes: OptimalAttributesMap;
  startingClass: StartingClass;
  twoHanding: boolean;
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
  startingClass,
  ...options
}: WeaponTableRowsOptions): WeaponTableRowsResult => {
  const twoHanding = useDeferredValue(options.twoHanding);
  const optimalAttributes = useDeferredValue(options.optimalAttributes);
  const upgradeLevel = useDeferredValue(options.upgradeLevel);

  const hasSpellScaling = weapons.some((weapon) => weapon.sorceryTool || weapon.incantationTool);
  const rows = useMemo<OptimalAttributeTableRowData[]>(
    () =>
      weapons.map(
        (weapon): OptimalAttributeTableRowData => ({
          weapon,
          upgradeLevel: getNormalizedUpgradeLevel(weapon, upgradeLevel),
          attributeMarkers: optimalAttributes[weapon.name]?.attackPower?.optimalAttributes,
          optimalAttributes: optimalAttributes[weapon.name] ?? {},
          startingClassAttributes: INITIAL_CLASS_VALUES[startingClass],
          twoHanding,
        }),
      ),
    [weapons, optimalAttributes, upgradeLevel, startingClass, twoHanding],
  );

  const rowGroups = useMemo<OptimalAttributeTableRowGroup[]>(() => {
    if (groupWeaponTypes) {
      const rowsByWeaponType: Map<WeaponType, OptimalAttributeTableRowData[]> = rows.reduce(
        (acc, row) => {
          const rowsForWeaponType = acc.get(row.weapon.weaponType) ?? [];
          return acc.set(row.weapon.weaponType, [...rowsForWeaponType, row]);
        },
        new Map(),
      );

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
