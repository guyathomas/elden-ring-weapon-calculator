import { memo, useMemo, useState } from "react";
import { type Weapon, type WeaponAttackResult } from "../../../calculator/calculator";
import type { SortBy } from "./sortFixedWeapons";
import useFixedAttributeTableRows from "./useFixedAttributeTableRows";
import WeaponTableBase from "../WeaponTableBase";
import type { RegulationVersion } from "../../regulationVersions";
import { maxRegularUpgradeLevel } from "../../uiUtils";
import type { AppState } from "../../reducers/useAppState";
import type { FixedAttributeState } from "../../reducers/useFixedAttributeState";
import { getFixedWeaponTableColumns } from "./getFixedWeaponTableColumns";
import {
  type WeaponTableColumnDef,
  type WeaponTableColumnGroupDef,
  type WeaponTableRowGroup,
} from "../types";

const OFFSET = 0;
const LIMIT = 200;

export type FixedAttributeTableRowData = {
  weapon: Weapon;
  weaponAttackData: WeaponAttackResult & {
    efficiencyScore: number;
  };
  upgradeLevel: number;
  twoHanding: boolean;
};

export type FixedAttributeTableColumnDef = WeaponTableColumnDef<FixedAttributeTableRowData>;
export type FixedAttributeTableColumnGroupDef =
  WeaponTableColumnGroupDef<FixedAttributeTableRowData>;
export type FixedAttributeTableRowGroup = WeaponTableRowGroup<FixedAttributeTableRowData>;

interface Props {
  /**
   * If true, include columns for each individual damage type as well as total attack power.
   */
  splitDamage: boolean;

  /**
   * If true, show scaling as integers instead of S/A/B/C/D/E ranks.
   */
  numericalScaling: boolean;

  /**
   * Indicates if the weapon data is currently being loaded.
   */
  isWeaponsLoading: boolean;

  /**
   * Optional error object if there was an error loading the weapon data.
   */
  weaponsError?: Error;

  /**
   * Array of weapon objects to be displayed in the table.
   */
  weapons: readonly Weapon[];

  /**
   * The regulation version of the game.
   */
  regulationVersion: RegulationVersion;

  /**
   * Indicates if the player is two-handing the weapon.
   */
  twoHanding: AppState["twoHanding"];

  /**
   * The upgrade level of the weapon.
   */
  upgradeLevel: AppState["upgradeLevel"];

  /**
   * Indicates if the weapons should be grouped by their types.
   */
  groupWeaponTypes: AppState["groupWeaponTypes"];

  /**
   * The attributes of the character.
   */
  attributes: FixedAttributeState["attributes"];
}

function FixedAttributeTable({
  splitDamage,
  numericalScaling,
  isWeaponsLoading,
  weaponsError,
  weapons,
  regulationVersion,
  twoHanding,
  upgradeLevel,
  groupWeaponTypes,
  attributes,
}: Props) {
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [reverse, setReverse] = useState<boolean>(false);
  const splitSpellScaling = Boolean(regulationVersion.splitSpellScaling);

  const { rows, attackPowerTypes, hasSpellScaling } = useFixedAttributeTableRows({
    weapons,
    regulationVersion,
    offset: OFFSET,
    limit: LIMIT,
    sortBy,
    reverse,
    maxUpgradeLevel: regulationVersion.maxUpgradeLevel || maxRegularUpgradeLevel,
    attributes,
    twoHanding,
    upgradeLevel,
    groupWeaponTypes,
  });

  const columns = useMemo(
    () =>
      getFixedWeaponTableColumns({
        splitDamage,
        splitSpellScaling,
        numericalScaling,
        attackPowerTypes,
        spellScaling: hasSpellScaling,
      }),
    [splitDamage, splitSpellScaling, numericalScaling, attackPowerTypes, hasSpellScaling],
  );

  return (
    <WeaponTableBase<SortBy>
      columns={columns}
      rows={rows}
      isWeaponsLoading={isWeaponsLoading}
      errorWeapons={weaponsError}
      onSortByChanged={setSortBy}
      sortBy={sortBy}
      onReverseChanged={setReverse}
      reverse={reverse}
      limit={LIMIT}
      total={weapons.length}
    />
  );
}

export default memo(FixedAttributeTable);
