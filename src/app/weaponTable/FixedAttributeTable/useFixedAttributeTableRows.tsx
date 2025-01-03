import { useDeferredValue, useMemo } from "react";
import getWeaponAttack, {
  AttackPowerType,
  WeaponType,
  type DamageAttributeValues,
  type Weapon,
} from "../../../calculator/calculator";
import { getNormalizedUpgradeLevel } from "../../uiUtils";

import {
  type FixedAttributeTableRowData,
  type FixedAttributeTableRowGroup,
} from "./FixedAttributeTable";
import { type SortBy, sortWeapons } from "./sortFixedWeapons";
import { type RegulationVersion } from "../../regulationVersions";
import { allWeaponTypes, weaponTypeLabels } from "../../uiUtils";

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
  rows: readonly FixedAttributeTableRowGroup[];

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
const useFixedAttributeTableRows = ({
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
  const { disableTwoHandingAttackPowerBonus, ineffectiveAttributePenalty } = regulationVersion;
  const rows = useMemo<FixedAttributeTableRowData[]>(
    () =>
      weapons.map((weapon): FixedAttributeTableRowData => {
        const normalizedUpgradeLevel = getNormalizedUpgradeLevel(weapon, upgradeLevel);

        const weaponAttackResult = getWeaponAttack({
          weapon,
          attributes,
          twoHanding,
          upgradeLevel: normalizedUpgradeLevel,
          disableTwoHandingAttackPowerBonus,
          ineffectiveAttributePenalty,
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
          disableTwoHandingAttackPowerBonus,
          ineffectiveAttributePenalty,
        });

        const fixedWeaponAttackResult: FixedAttributeTableRowData["weaponAttackData"] = {
          ...weaponAttackResult,
          efficiencyScore: Math.round(
            100 *
              (sumObjectValues(weaponAttackResult.attackPower) /
                sumObjectValues(maxWeaponAttackResult.attackPower)),
          ),
        };
        return {
          weapon,
          weaponAttackData: fixedWeaponAttackResult,
          upgradeLevel: normalizedUpgradeLevel,
        };
      }),
    [
      weapons,
      attributes,
      twoHanding,
      upgradeLevel,
      disableTwoHandingAttackPowerBonus,
      ineffectiveAttributePenalty,
    ],
  );

  const attackPowerTypes = rows.reduce((acc, { weaponAttackData }) => {
    Object.keys(weaponAttackData.attackPower).forEach((attackPowerType) => {
      acc.add(parseInt(attackPowerType) as AttackPowerType);
    });
    return acc;
  }, new Set<AttackPowerType>());

  const rowGroups = useMemo<FixedAttributeTableRowGroup[]>(() => {
    if (groupWeaponTypes) {
      const rowsByWeaponType: Map<WeaponType, FixedAttributeTableRowData[]> = rows.reduce(
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
            rows: sortWeapons(weaponsForType, sortBy, reverse),
          });
        }
        return acc;
      }, [] as FixedAttributeTableRowGroup[]);
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

export default useFixedAttributeTableRows;
