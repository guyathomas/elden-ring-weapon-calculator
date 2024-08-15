import { useDeferredValue, useMemo } from "react";
import getWeaponAttack, {
  allAttackPowerTypes,
  AttackPowerType,
  WeaponType,
  type DamageAttributeValues,
  type Weapon,
} from "../../calculator/calculator";
import { getNormalizedUpgradeLevel } from "../uiUtils";

import { type WeaponTableRowData, type WeaponTableRowGroup } from "./WeaponTable";
import { type SortBy, sortWeapons } from "../../search/sortWeapons";
import { type RegulationVersion } from "../regulationVersions";
import { useAppStateContext } from "../AppStateProvider";
import { allWeaponTypes, weaponTypeLabels } from "../uiUtils";
import { getIncrementalDamagePerAttribute } from "../../calculator/newCalculator";

interface WeaponTableRowsOptions {
  weapons: Weapon[];
  regulationVersion: RegulationVersion;
  offset: number;
  limit: number;
  sortBy: SortBy;
  reverse: boolean;
  affinityIds: readonly number[];
  weaponTypes: readonly WeaponType[];
  attributes: DamageAttributeValues;
  includeDLC: boolean;
  effectiveOnly: boolean;
  twoHanding: boolean;
  upgradeLevel: number;
  groupWeaponTypes: boolean;
  maxUpgradeLevel: number;
}

interface WeaponTableRowsResult {
  rowGroups: readonly WeaponTableRowGroup[];

  /** Attack power types included in at least one weapon in the filtered results */
  attackPowerTypes: ReadonlySet<AttackPowerType>;

  /**True if at least one weapon in the filtered results can cast spells */
  spellScaling: boolean;

  total: number;
}

// TODO: Extract into util
const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

/**
 * Filter, sort, and paginate the weapon list based on the current selections
 */
const useWeaponTableRows = ({
  weapons,
  regulationVersion,
  offset,
  limit,
  groupWeaponTypes,
  sortBy,
  reverse,
  upgradeLevel,
  ...options
}: WeaponTableRowsOptions): WeaponTableRowsResult => {
  // Defer filtering based on app state changes because this can be CPU intensive if done while
  // busy rendering
  const attributes = useDeferredValue(options.attributes);
  const twoHanding = useDeferredValue(options.twoHanding);
  const { optimalAttributes } = useAppStateContext();

  const [filteredRows, attackPowerTypes, spellScaling] = useMemo<
    [WeaponTableRowData[], Set<AttackPowerType>, boolean]
  >(() => {
    const includedDamageTypes = new Set<AttackPowerType>();
    let includeSpellScaling = false;

    const rows = weapons.map((weapon): WeaponTableRowData => {
      // TODO: This is used in 2 places. Extract into func
      const normalizedUpgradeLevel = getNormalizedUpgradeLevel(weapon, upgradeLevel);

      const weaponAttackResult = getWeaponAttack({
        weapon,
        attributes,
        twoHanding,
        upgradeLevel: normalizedUpgradeLevel,
        disableTwoHandingAttackPowerBonus: regulationVersion.disableTwoHandingAttackPowerBonus,
        ineffectiveAttributePenalty: regulationVersion.ineffectiveAttributePenalty,
      });

      const maxWeaponAttackResult = getWeaponAttack({
        weapon,
        attributes: {
          str: 99,
          dex: 99,
          int: 99,
          fai: 99,
          arc: 99,
        },
        twoHanding,
        upgradeLevel: normalizedUpgradeLevel,
        disableTwoHandingAttackPowerBonus: regulationVersion.disableTwoHandingAttackPowerBonus,
        ineffectiveAttributePenalty: regulationVersion.ineffectiveAttributePenalty,
      });

      const incrementalDamagePerAttribute = getIncrementalDamagePerAttribute(
        weapon,
        normalizedUpgradeLevel,
        twoHanding,
      );

      // For all of the possible permutations of Attributes, where the sum is smaller than 150
      // Calculate the weaponAttackResult
      // Keep track of the highest weaponAttackResult and then return the combination of attributes that resulted in that weaponAttackResult

      for (const statusType of allAttackPowerTypes) {
        if (weaponAttackResult.attackPower[statusType]) {
          includedDamageTypes.add(statusType);
        }
      }

      if (weapon.sorceryTool || weapon.incantationTool) {
        includeSpellScaling = true;
      }

      return [
        weapon,
        {
          ...weaponAttackResult,
          upgradeLevel: normalizedUpgradeLevel,
          efficiencyScore: Math.round(
            (100 * sumObjectValues(weaponAttackResult.attackPower)) /
              sumObjectValues(maxWeaponAttackResult.attackPower),
          ),
        },
        {
          ...optimalAttributes[weapon.name],
          incrementalDamagePerAttribute,
        },
      ];
    });

    return [rows, includedDamageTypes, includeSpellScaling];
  }, [weapons, attributes, twoHanding, upgradeLevel, regulationVersion, optimalAttributes]);

  const memoizedAttackPowerTypes = useMemo(
    () => attackPowerTypes,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [[...attackPowerTypes].sort().join(",")],
  );

  const rowGroups = useMemo<WeaponTableRowGroup[]>(() => {
    if (groupWeaponTypes) {
      const rowsByWeaponType: { [weaponType in WeaponType]?: WeaponTableRowData[] } = {};
      filteredRows.forEach((row) => {
        const [weapon] = row;
        (rowsByWeaponType[weapon.weaponType] ??= []).push(row);
      });

      const rowGroups: WeaponTableRowGroup[] = [];
      allWeaponTypes.forEach((weaponType) => {
        if (weaponType in rowsByWeaponType) {
          rowGroups.push({
            key: weaponType.toString(),
            name: weaponTypeLabels.get(weaponType)!,
            rows: sortWeapons(rowsByWeaponType[weaponType]!, sortBy, reverse),
          });
        }
      });
      return rowGroups;
    }

    return filteredRows.length
      ? [
          {
            key: "allWeapons",
            rows: sortWeapons(filteredRows, sortBy, reverse).slice(offset, limit),
          },
        ]
      : [];
  }, [filteredRows, reverse, sortBy, groupWeaponTypes, offset, limit]);

  return {
    rowGroups,
    attackPowerTypes: memoizedAttackPowerTypes,
    spellScaling,
    total: filteredRows.length,
  };
};

export default useWeaponTableRows;
