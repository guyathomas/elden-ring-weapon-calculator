import { memo, type ReactNode, useMemo, useState } from "react";
import { type SystemStyleObject, type Theme } from "@mui/system";
import { type Weapon, type WeaponAttackResult } from "../../calculator/calculator";
import type { SortBy } from "../../search/sortWeapons";
import useWeaponTableRows from "./useWeaponTableRows";
import WeaponTableBase from "./WeaponTableBase";
import type { RegulationVersion } from "../regulationVersions";
import { maxRegularUpgradeLevel } from "../uiUtils";
import type { AppState } from "../reducers/useAppState";
import type { FixedAttributeState } from "../reducers/useFixedAttributeState";
import { getFixedWeaponTableColumns } from "./getFixedWeaponTableColumns";

// TODO pagination if there are >200 results
const OFFSET = 0;
const LIMIT = 200;

export type WeaponTableRowData = { weapon: Weapon; weaponAttackData: WeaponAttackResult };

export interface WeaponTableRowGroup {
  key: string;
  name?: string;
  rows: readonly WeaponTableRowData[];
}

export interface WeaponTableColumnDef {
  key: string;
  sortBy?: SortBy;
  header: ReactNode;
  render(row: WeaponTableRowData): ReactNode;
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}

export interface WeaponTableColumnGroupDef {
  key: string;
  header?: string;
  columns: readonly WeaponTableColumnDef[];
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}

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

function WeaponTable({
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

  const { rows, attackPowerTypes, hasSpellScaling } = useWeaponTableRows({
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
    <WeaponTableBase
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

export default memo(WeaponTable);
