import { memo, useMemo, useState } from "react";
import { type Weapon } from "../../../calculator/calculator";
import type { SortBy } from "./sortOptimalWeapons";
import WeaponTableBase from "../WeaponTableBase";
import type { RegulationVersion } from "../../regulationVersions";
import { maxRegularUpgradeLevel } from "../../uiUtils";
import type { AppState } from "../../reducers/useAppState";
import type { FixedAttributeState } from "../../reducers/useFixedAttributeState";
import { getOptimalAttributeColumns } from "./getOptimalAttributeColumns";
import { useOptimalAttributes, type OptimalAttribute } from "./useOptimalAttributes";
import type { SolvedAttributeState } from "../../reducers/useSolvedAttributeState";
import useWeaponSolverRows from "./useOptimalAttributeTableRows";
import {
  type WeaponTableColumnDef,
  type WeaponTableColumnGroupDef,
  type WeaponTableRowGroup,
} from "../types";
// TODO pagination if there are >200 results
const OFFSET = 0;
const LIMIT = 200;

export type OptimalAttributeTableRowData = {
  weapon: Weapon;
  optimalAttributes: OptimalAttribute;
  upgradeLevel: number;
};

export type OptimalAttributeTableColumnDef = WeaponTableColumnDef<OptimalAttributeTableRowData>;
export type OptimalAttributeTableColumnGroupDef =
  WeaponTableColumnGroupDef<OptimalAttributeTableRowData>;
export type OptimalAttributeTableRowGroup = WeaponTableRowGroup<OptimalAttributeTableRowData>;

/**
 * Props for the OptimalAttributeTable component.
 */
interface Props {
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

  /**
   * The solver attributes of the character.
   */
  solverAttributes: SolvedAttributeState["solverAttributes"];

  /**
   * The starting class of the character.
   */
  startingClass: AppState["startingClass"];

  /**
   * Indicates if endurance should be adjusted for the weapon.
   */
  adjustEnduranceForWeapon: SolvedAttributeState["adjustEnduranceForWeapon"];

  /**
   * The type of roll the character performs.
   */
  rollType: SolvedAttributeState["rollType"];

  /**
   * The weight of the character's armor.
   */
  armorWeight: SolvedAttributeState["armorWeight"];

  /**
   * The type of damage to optimize for.
   */
  damageTypeToOptimizeFor: SolvedAttributeState["damageTypeToOptimizeFor"];
}

function WeaponTable({
  isWeaponsLoading,
  weaponsError,
  weapons,
  regulationVersion,
  twoHanding,
  upgradeLevel,
  groupWeaponTypes,
  attributes,
  solverAttributes,
  startingClass,
  adjustEnduranceForWeapon,
  rollType,
  armorWeight,
}: Props) {
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [reverse, setReverse] = useState<boolean>(false);

  const { optimalAttributes } = useOptimalAttributes({
    solverAttributes,
    twoHanding,
    startingClass,
    adjustEnduranceForWeapon,
    upgradeLevel,
    rollType,
    weapons,
    armorWeight,
  });

  const { rows, hasSpellScaling } = useWeaponSolverRows({
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
    optimalAttributes,
  });
  const columns = useMemo(
    () =>
      getOptimalAttributeColumns({
        spellScaling: hasSpellScaling,
        showEndurance: adjustEnduranceForWeapon,
      }),
    [hasSpellScaling, adjustEnduranceForWeapon],
  );

  return (
    <>
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
    </>
  );
}

export default memo(WeaponTable);
