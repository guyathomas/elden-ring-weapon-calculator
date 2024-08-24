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
import { calculateWeaponArtDamage } from "../../calculator/weaponArt";

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

const mockWeaponHitWeaponArt = {
  "Unique Skill Weapon": "",
  Name: "Lion's Claw",
  AtkId: "300300820",
  movement: {
    0: 240,
    1: 240,
    2: 240,
    3: 240,
    4: 240,
  },
  "Stam Dmg MV": 500,
  "Status MV": 100,
  "Weapon Buff MV": 100,
  "Poise Dmg MV": 600,
  "Atk Repel MV": 500,
  StaminaCost: 45,
  PhysAtkAttribute: "253",
  "Shield Chip": 0,
  disableGuard: false,
  DamageLevel: 6,
  dmgLevel_vsPlayer: 0,
  ignoreDmgCount: false,
  attack: {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  },
  AtkStam: 0,
  AtkSuperArmor: 0,
  isAddBaseAtk: false,
  overwriteAttackElementCorrectId: "-1",
  isDisableBothHandsAtkBonus: true,
  IsArrowAtk: false,
  subCategory1: "Weapon Skill",
  subCategory2: "Redmane Battle Skill",
  subCategory3: "-",
  subCategory4: "-",
  spEffectId0: "6903",
  spEffectId1: "-1",
  spEffectId2: "-1",
  spEffectId3: "-1",
  spEffectId4: "-1",
  "PvP Dmg Mult": 0.8,
  "PvP Stam Dmg Mult": 1.25,
  "PvP Poise Dmg Mult": 2.7,
  parsedProperties: {
    AshOfWarName: "Lion's Claw",
  },
};

const mockEnhancedHitWeaponArt = {
  "Unique Skill Weapon": "",
  Name: "Glintstone Pebble R2",
  AtkId: "300200895",
  movement: {
    0: 160,
    1: 160,
    2: 160,
    3: 160,
    4: 160,
  },
  "Stam Dmg MV": 200,
  "Status MV": 100,
  "Weapon Buff MV": 100,
  "Poise Dmg MV": 400,
  "Atk Repel MV": 500,
  StaminaCost: 30,
  PhysAtkAttribute: "252",
  "Shield Chip": 0,
  disableGuard: false,
  DamageLevel: 3,
  dmgLevel_vsPlayer: 0,
  ignoreDmgCount: false,
  attack: {
    0: 0,
    1: 45,
    2: 0,
    3: 0,
    4: 0,
  },
  AtkStam: 0,
  AtkSuperArmor: 0,
  isAddBaseAtk: true,
  overwriteAttackElementCorrectId: "-1",
  isDisableBothHandsAtkBonus: true,
  IsArrowAtk: false,
  subCategory1: "Weapon Skill",
  subCategory2: "-",
  subCategory3: "-",
  subCategory4: "-",
  spEffectId0: "6903",
  spEffectId1: "-1",
  spEffectId2: "-1",
  spEffectId3: "-1",
  spEffectId4: "-1",
  "PvP Dmg Mult": 0.8,
  "PvP Stam Dmg Mult": 1.25,
  "PvP Poise Dmg Mult": 2.7,
  parsedProperties: {
    AshOfWarName: "Glintstone Pebble ",
    Button: "R2",
  },
};

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

      const weaponArtResult = calculateWeaponArtDamage(
        weapon,
        attributes,
        mockEnhancedHitWeaponArt,
        weaponAttackResult.attackPower,
        normalizedUpgradeLevel / 25, // This is already normalized so that a somber upgrade of 10 will be 25
      );

      console.log("zzz", {
        weaponArtResult,
        weaponAttackResult,
        weapon,
        attributes,
        twoHanding,
        normalizedUpgradeLevel,
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
