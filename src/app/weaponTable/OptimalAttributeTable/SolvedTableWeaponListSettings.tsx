import { memo, useCallback } from "react";
import { Box, debounce } from "@mui/material";
import {
  damageAttributes,
  type BoundsOptions,
  type AttributeRangeKey,
  type AttributeSolverKey,
  type NonDamageAttribute,
} from "../../../calculator/calculator";
import NumberTextField from "../../NumberTextField";
import { getAttributeLabel } from "../../uiUtils";
import ClassPicker, {
  INITIAL_CLASS_VALUES,
  type StartingClass,
} from "../../ClassPicker";
import RollTypePicker from "../../RollTypePicker";
import type { SolvedAttributeState } from "../../reducers/useSolvedAttributeState";
import { getMaxWeightForEndurance } from "./useOptimalAttributes";
import {
  BooleanInput,
  WeaponLevelInput,
  type AttributeInputRangeProps,
} from "../FixedAttributeTable/FixedTableWeaponListSetting";
import OptimizedDamageTypePicker, {
  type DamageTypeToOptimizeFor,
} from "../../OptimizedDamageTypePicker";

/**
 * Form control for picking the value of a single attribute (str/dex/int/fai/arc)
 */
const AttributeRangeInput = memo(function AttributeInput({
  attribute,
  value,
  onAttributeChanged,
  bounds,
  min,
}: AttributeInputRangeProps) {
  const fieldName = `${attribute}.${bounds}` as AttributeRangeKey;
  return (
    <NumberTextField
      key={fieldName}
      label={`${getAttributeLabel(attribute)} ${bounds}`}
      size="small"
      variant="outlined"
      value={value}
      min={min}
      max={99}
      onChange={(newValue) => onAttributeChanged(fieldName, newValue)}
    />
  );
});

interface Props {
  twoHanding: boolean;
  upgradeLevel: number;
  maxUpgradeLevel?: number;
  startingClass: StartingClass;
  onAttributeSolverChanged(attribute: AttributeSolverKey, value: number): void;
  onTwoHandingChanged(twoHanding: boolean): void;
  onUpgradeLevelChanged(upgradeLevel: number): void;
  onStartingClassChanged(startingClass: StartingClass): void;
  onRollTypeChanged(rollType: SolvedAttributeState["rollType"]): void;
  onArmorWeightChanged(armorWeight: SolvedAttributeState["armorWeight"]): void;
  onWeaponAdjustedEnduranceChanged(
    weaponAdjustedEndurance: SolvedAttributeState["adjustEnduranceForWeapon"],
  ): void;
  solverAttributes: SolvedAttributeState["solverAttributes"];
  rollType: SolvedAttributeState["rollType"];
  armorWeight: SolvedAttributeState["armorWeight"];
  adjustEnduranceForWeapon: SolvedAttributeState["adjustEnduranceForWeapon"];
  splitDamage: boolean;
  onSplitDamageChanged(splitDamage: boolean): void;
  showStatDmg: boolean;
  onShowStatDmgChanged(showStatDmg: boolean): void;
  damageTypeToOptimizeFor: DamageTypeToOptimizeFor;
  onDamageTypeToOptimizeForChanged(damageType: DamageTypeToOptimizeFor): void;
}

// TODO: Decide whether this provides value. It currently performs two actions - should it do both, 1 of them or neither
// 1. Forces the solver to solve for a damage type first in the solver
// 2. Only show attributes that scale for that damage type in the fixed view
const ENABLE_ATTRIBUTE_TO_SOLVE_FOR = false;

const spanNColumnsOnMobile = (n: number) => ({
  gridColumn: {
    xs: `span ${n}`,
    sm: "auto",
  },
});

/**
 * Form controls for entering player attributes, basic filters, and display options
 */
function WeaponListSettings({
  twoHanding,
  upgradeLevel,
  maxUpgradeLevel,
  startingClass,
  onTwoHandingChanged,
  onUpgradeLevelChanged,
  onStartingClassChanged,
  solverAttributes,
  onRollTypeChanged,
  rollType,
  armorWeight,
  onArmorWeightChanged,
  adjustEnduranceForWeapon,
  onWeaponAdjustedEnduranceChanged,
  onAttributeSolverChanged,
  splitDamage,
  onSplitDamageChanged,
  showStatDmg,
  onShowStatDmgChanged,
  damageTypeToOptimizeFor,
  onDamageTypeToOptimizeForChanged,
}: Props) {
  const debouncedOnAttributeSolverChanged = debounce(onAttributeSolverChanged, 300);

  const handleChangeLevel = useCallback(
    (newValue: number) => debouncedOnAttributeSolverChanged("lvl", newValue),
    [debouncedOnAttributeSolverChanged],
  );

  const handleChangeAttribute = useCallback(
    (attribute: NonDamageAttribute, newValue: number) =>
      debouncedOnAttributeSolverChanged(attribute, newValue),
    [debouncedOnAttributeSolverChanged],
  );

  const handleChangeAttributeRange = useCallback(
    (attribute: AttributeSolverKey, newValue: number) =>
      debouncedOnAttributeSolverChanged(attribute, newValue),
    [debouncedOnAttributeSolverChanged],
  );

  const handleChangeEndurance = useCallback(
    (newValue: number) => {
      debouncedOnAttributeSolverChanged("end", newValue);
      const maxWeight = getMaxWeightForEndurance(newValue, rollType);
      onArmorWeightChanged(maxWeight);
    },
    [debouncedOnAttributeSolverChanged, rollType, onArmorWeightChanged],
  );

  const initialValues = INITIAL_CLASS_VALUES[startingClass].total;
  const minValues =
    solverAttributes["arc.Min"] +
    solverAttributes["fai.Min"] +
    solverAttributes["str.Min"] +
    solverAttributes["dex.Min"] +
    solverAttributes["int.Min"] +
    solverAttributes.end +
    solverAttributes.min +
    solverAttributes.vig;

  const minLevel = minValues - initialValues + INITIAL_CLASS_VALUES[startingClass].lvl;
  return (
    <Box
      sx={() => ({
        display: "grid",
        gap: 2,
        gridTemplateColumns: "repeat(5, minmax(60px, 1fr))",
        gridAutoRows: "auto",
      })}
    >
      <ClassPicker onStartingClassChanged={onStartingClassChanged} startingClass={startingClass} />
      <WeaponLevelInput
        upgradeLevel={upgradeLevel}
        maxUpgradeLevel={maxUpgradeLevel}
        onUpgradeLevelChanged={onUpgradeLevelChanged}
      />
      <NumberTextField
        label={"Level"}
        size="small"
        variant="outlined"
        value={solverAttributes.lvl}
        min={Math.max(minLevel, INITIAL_CLASS_VALUES[startingClass].lvl)}
        max={713}
        onChange={handleChangeLevel}
      />
      {(["vig", "min"] as NonDamageAttribute[]).map((attribute) => (
        <NumberTextField
          key={attribute}
          label={getAttributeLabel(attribute)}
          size="small"
          variant="outlined"
          value={solverAttributes[attribute]}
          min={INITIAL_CLASS_VALUES[startingClass][attribute]}
          max={99}
          onChange={(newValue) => handleChangeAttribute(attribute, newValue)}
        />
      ))}

      {(["Min", "Max"] as BoundsOptions[]).map((bounds) =>
        damageAttributes.map((attribute) => {
          const rangeKey: AttributeRangeKey = `${attribute}.${bounds}`;
          const min = INITIAL_CLASS_VALUES[startingClass][attribute];
          return (
            <AttributeRangeInput
              key={rangeKey}
              attribute={attribute}
              value={solverAttributes[rangeKey]}
              onAttributeChanged={handleChangeAttributeRange}
              bounds={bounds}
              min={min}
            />
          );
        }),
      )}
      <Box sx={spanNColumnsOnMobile(2)}>
        <BooleanInput label="Two handing" checked={twoHanding} onChange={onTwoHandingChanged} />
      </Box>
      <Box sx={spanNColumnsOnMobile(3)}>
        <BooleanInput
          label="Subtract Weapon Weight"
          checked={adjustEnduranceForWeapon}
          onChange={onWeaponAdjustedEnduranceChanged}
        />
      </Box>

      <NumberTextField
        label={getAttributeLabel("end")}
        size="small"
        variant="outlined"
        value={solverAttributes.end}
        min={INITIAL_CLASS_VALUES[startingClass].end}
        max={99}
        onChange={handleChangeEndurance}
      />
      {ENABLE_ATTRIBUTE_TO_SOLVE_FOR && (
        <OptimizedDamageTypePicker
          optimizedDamageType={damageTypeToOptimizeFor}
          onOptimizedDamageTypeChanged={onDamageTypeToOptimizeForChanged}
        />
      )}
      {adjustEnduranceForWeapon && (
        <>
          <RollTypePicker onRollTypeChanged={onRollTypeChanged} rollType={rollType} />
          <NumberTextField
            label={"Max Armor Weight"}
            size="small"
            variant="outlined"
            value={armorWeight}
            min={0}
            max={200}
            onChange={onArmorWeightChanged}
          />
        </>
      )}
      <Box sx={spanNColumnsOnMobile(2)}>
        <BooleanInput label="Damage split" checked={splitDamage} onChange={onSplitDamageChanged} />
      </Box>
      <Box sx={spanNColumnsOnMobile(2)}>
        <BooleanInput label="Stat Damage" checked={showStatDmg} onChange={onShowStatDmgChanged} />
      </Box>
    </Box>
  );
}

export default memo(WeaponListSettings);
