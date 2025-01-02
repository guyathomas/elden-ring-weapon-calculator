import { useDeferredValue, useMemo } from "react";
import getWeaponAttack, {
  AttackPowerType,
  WeaponType,
  type DamageAttributeValues,
  type Weapon,
} from "../../calculator/calculator";
import { getNormalizedUpgradeLevel } from "../uiUtils";

import { type WeaponTableRowData, type WeaponTableRowGroup } from "./FixedWeaponTable";
import { type SortBy, sortWeapons } from "../../search/sortWeapons";
import { type RegulationVersion } from "../regulationVersions";
import { allWeaponTypes, weaponTypeLabels } from "../uiUtils";

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
  rows: readonly WeaponTableRowGroup[];

  /** Attack power types included in at least one weapon in the filtered results */
  attackPowerTypes: ReadonlySet<AttackPowerType>;

  /**True if at least one weapon in the filtered results can cast spells */
  hasSpellScaling: boolean;
}

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

  const hasSpellScaling = weapons.some((weapon) => weapon.sorceryTool || weapon.incantationTool);

  const rows = useMemo<WeaponTableRowData[]>(
    () =>
      weapons.map((weapon): WeaponTableRowData => {
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

        const fixedWeaponAttackResult = {
          ...weaponAttackResult,
          // upgradeLevel: normalizedUpgradeLevel, // TODO: Uncomment this
          efficiencyScore: Math.round(
            100 *
              (sumObjectValues(weaponAttackResult.attackPower) /
                sumObjectValues(maxWeaponAttackResult.attackPower)),
          ),
        };
        return {
          weapon,
          weaponAttackData: fixedWeaponAttackResult,
        };
      }),
    [weapons, attributes, twoHanding, upgradeLevel, regulationVersion],
  );

  const attackPowerTypes = rows.reduce((acc, { weaponAttackData }) => {
    Object.keys(weaponAttackData.attackPower).forEach((attackPowerType) => {
      acc.add(parseInt(attackPowerType) as AttackPowerType);
    });
    return acc;
  }, new Set<AttackPowerType>());

  const rowGroups = useMemo<WeaponTableRowGroup[]>(() => {
    if (groupWeaponTypes) {
      const rowsByWeaponType: Map<WeaponType, WeaponTableRowData[]> = rows.reduce((acc, row) => {
        const rowsForWeaponType = acc.get(row.weapon.weaponType) ?? [];
        return acc.set(row.weapon.weaponType, [...rowsForWeaponType, row]);
      }, new Map());

      return allWeaponTypes.reduce((acc, weaponType) => {
        const weaponsForType = rowsByWeaponType.get(weaponType);
        if (weaponsForType) {
          acc.push({
            key: weaponType.toString(),
            name: weaponTypeLabels.get(weaponType)!,
            rows: sortWeapons(weaponsForType, sortBy, reverse),
          });
        }
        return acc;
      }, [] as WeaponTableRowGroup[]);
    }

    return rows.length
      ? [
          {
            key: "allWeapons",
            rows: sortWeapons(rows, sortBy, reverse).slice(offset, limit),
          },
        ]
      : [];
  }, [rows, reverse, sortBy, groupWeaponTypes, offset, limit]);

  return {
    rows: rowGroups,
    attackPowerTypes,
    hasSpellScaling,
  };
};

export default useWeaponTableRows;
