import { useDeferredValue, useMemo } from "react";
import getWeaponAttack, {
  allAttackPowerTypes,
  AttackPowerType,
  WeaponType,
  type DamageAttributeValues,
  type Weapon,
} from "../../calculator/calculator";
import filterWeapons from "../../search/filterWeapons";
import { type WeaponTableRowData, type WeaponTableRowGroup } from "./WeaponTable";
import { type SortBy, sortWeapons } from "../../search/sortWeapons";
import { type RegulationVersion } from "../regulationVersions";
import {
  allWeaponTypes,
  weaponTypeLabels,
  maxRegularUpgradeLevel,
  maxSpecialUpgradeLevel,
  toSpecialUpgradeLevel,
} from "../uiUtils";

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
  maxUpgradeLevel?: number;
  groupWeaponTypes: boolean;
}

interface WeaponTableRowsResult {
  rowGroups: readonly WeaponTableRowGroup[];

  /** Attack power types included in at least one weapon in the filtered results */
  attackPowerTypes: ReadonlySet<AttackPowerType>;

  /**True if at least one weapon in the filtered results can cast spells */
  spellScaling: boolean;

  total: number;
}

/**
 * Filter, sort, and paginate the weapon list based on the current selections
 */
const useWeaponTableRows = ({
  weapons,
  regulationVersion,
  offset,
  limit,
  upgradeLevel: regularUpgradeLevel,
  maxUpgradeLevel = maxRegularUpgradeLevel,
  groupWeaponTypes,
  sortBy,
  reverse,
  ...options
}: WeaponTableRowsOptions): WeaponTableRowsResult => {
  // Defer filtering based on app state changes because this can be CPU intensive if done while
  // busy rendering
  const attributes = useDeferredValue(options.attributes);
  const twoHanding = useDeferredValue(options.twoHanding);
  const weaponTypes = useDeferredValue(options.weaponTypes);
  const affinityIds = useDeferredValue(options.affinityIds);
  const effectiveOnly = useDeferredValue(options.effectiveOnly);
  const includeDLC = useDeferredValue(options.includeDLC);

  const specialUpgradeLevel = toSpecialUpgradeLevel(regularUpgradeLevel);

  // Determine which weapon types can never be given an affinity. It's convenient for them to
  // show up under both "Standard" and "Unique" filtering options
  const uninfusableWeaponTypes = useMemo(() => {
    const tmp = new Set(allWeaponTypes);
    for (const weapon of weapons) {
      if (weapon.affinityId !== 0 && weapon.affinityId !== -1) {
        tmp.delete(weapon.weaponType);
      }
    }
    return tmp;
  }, [weapons]);

  const [filteredRows, attackPowerTypes, spellScaling] = useMemo<
    [WeaponTableRowData[], Set<AttackPowerType>, boolean]
  >(() => {
    const includedDamageTypes = new Set<AttackPowerType>();
    let includeSpellScaling = false;

    const filteredWeapons = filterWeapons(weapons, {
      weaponTypes: new Set(weaponTypes.filter((weaponType) => allWeaponTypes.includes(weaponType))),
      affinityIds: new Set(
        affinityIds.filter((affinityId) => regulationVersion.affinityOptions.has(affinityId)),
      ),
      effectiveWithAttributes: effectiveOnly ? attributes : undefined,
      includeDLC,
      twoHanding,
      uninfusableWeaponTypes,
    });

    const rows = filteredWeapons.map((weapon): WeaponTableRowData => {
      let upgradeLevel = 0;
      if (weapon.attack.length - 1 === maxSpecialUpgradeLevel) {
        upgradeLevel = specialUpgradeLevel;
      } else {
        upgradeLevel = Math.min(regularUpgradeLevel, weapon.attack.length - 1);
      }

      const weaponAttackResult = getWeaponAttack({
        weapon,
        attributes,
        twoHanding,
        upgradeLevel,
        disableTwoHandingAttackPowerBonus: regulationVersion.disableTwoHandingAttackPowerBonus,
        ineffectiveAttributePenalty: regulationVersion.ineffectiveAttributePenalty,
      });

      for (const statusType of allAttackPowerTypes) {
        if (weaponAttackResult.attackPower[statusType]) {
          includedDamageTypes.add(statusType);
        }
      }

      if (weapon.sorceryTool || weapon.incantationTool) {
        includeSpellScaling = true;
      }

      return [weapon, weaponAttackResult];
    });

    return [rows, includedDamageTypes, includeSpellScaling];
  }, [
    attributes,
    twoHanding,
    weapons,
    regulationVersion,
    regularUpgradeLevel,
    specialUpgradeLevel,
    maxUpgradeLevel,
    weaponTypes,
    affinityIds,
    includeDLC,
    effectiveOnly,
    uninfusableWeaponTypes,
  ]);

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
