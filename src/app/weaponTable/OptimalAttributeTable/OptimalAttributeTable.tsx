import { memo, useMemo, useState } from "react";
import { type DamageAttributeValues, type Weapon } from "../../../calculator/calculator";
import type { SortBy } from "./sortOptimalWeapons";
import WeaponTableBase from "../WeaponTableBase";
import type { AppState } from "../../reducers/useAppState";
import { getOptimalAttributeColumns } from "./getOptimalAttributeColumns";
import { useOptimalAttributes, type OptimalAttribute } from "./useOptimalAttributes";
import type { SolvedAttributeState } from "../../reducers/useSolvedAttributeState";
import useWeaponSolverRows from "./useOptimalAttributeTableRows";
import {
  type DefaultWeaponTableRowData,
  type WeaponTableColumnDef,
  type WeaponTableColumnGroupDef,
  type WeaponTableRowGroup,
} from "../types";
import type { AllStartingClassAttributes } from "../../ClassPicker";

const OFFSET = 0;
const LIMIT = 200;

export interface OptimalAttributeTableRowData extends DefaultWeaponTableRowData {
  optimalAttributes: OptimalAttribute;
  startingClassAttributes: Record<AllStartingClassAttributes, number>;
}

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

  optimalAttributes: SolvedAttributeState["optimalAttributes"];
  /**
   * The callback to run when optimal attributes are calculated for a weapon.
   */
  setOptimalAttributes: (
    attributes: Partial<Record<Weapon["name"], OptimalAttribute>> | null,
  ) => void;

  /**
   * If true, include columns for each individual damage type as well as total attack power.
   */
  splitDamage: boolean;

  showStatDmg: boolean;

  disableTwoHandingAttackPowerBonus: boolean;
  ineffectiveAttributePenalty: number;
  onCopyAttributes: (attributes: DamageAttributeValues) => void;
}

function OptimalAttributeTable({
  isWeaponsLoading,
  weaponsError,
  weapons,
  twoHanding,
  upgradeLevel,
  groupWeaponTypes,
  solverAttributes,
  startingClass,
  adjustEnduranceForWeapon,
  rollType,
  armorWeight,
  damageTypeToOptimizeFor,
  optimalAttributes,
  setOptimalAttributes,
  splitDamage,
  disableTwoHandingAttackPowerBonus,
  ineffectiveAttributePenalty,
  onCopyAttributes,
  showStatDmg,
}: Props) {
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [reverse, setReverse] = useState<boolean>(false);

  useOptimalAttributes({
    solverAttributes,
    twoHanding,
    startingClass,
    adjustEnduranceForWeapon,
    upgradeLevel,
    rollType,
    weapons,
    armorWeight,
    damageTypeToOptimizeFor,
    setOptimalAttributes,
    disableTwoHandingAttackPowerBonus,
    ineffectiveAttributePenalty,
  });

  const { rows, hasSpellScaling } = useWeaponSolverRows({
    weapons,
    offset: OFFSET,
    limit: LIMIT,
    sortBy,
    reverse,
    upgradeLevel,
    groupWeaponTypes,
    optimalAttributes,
    startingClass,
    twoHanding,
    damageTypeToOptimizeFor,
  });
  const columns = useMemo(
    () =>
      getOptimalAttributeColumns({
        spellScaling: hasSpellScaling,
        showEndurance: adjustEnduranceForWeapon,
        splitDamage,
        showStatDmg,
      }),
    [hasSpellScaling, adjustEnduranceForWeapon, splitDamage, showStatDmg],
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
        onCopyAttributes={onCopyAttributes}
      />
    </>
  );
}

export default memo(OptimalAttributeTable);
