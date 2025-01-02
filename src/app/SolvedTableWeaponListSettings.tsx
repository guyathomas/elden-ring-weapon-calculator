import { memo } from "react";
import { Box, debounce } from "@mui/material";
import {
  damageAttributes,
  type BoundsOptions,
  type AttributeRangeKey,
  type AttributeSolverKey,
  type NonDamageAttribute,
} from "../calculator/calculator";
import NumberTextField from "./NumberTextField";
import { getAttributeLabel } from "./uiUtils";
import ClassPicker, {
  INITIAL_CLASS_VALUES,
  type StartingClass as StartingClass,
} from "./ClassPicker";
import RollTypePicker from "./RollTypePicker";
import type { SolvedAttributeState } from "./reducers/useSolvedAttributeState";
import { getMaxWeightForEndurance } from "./weaponTable/useOptimalAttributes";
import {
  BooleanInput,
  WeaponLevelInput,
  type AttributeInputRangeProps,
} from "./FixedTableWeaponListSetting";

/**
 * Form control for picking the value of a single attribute (str/dex/int/fai/arc)
 */
const AttributeRangeInput = memo(function AttributeInput({
  attribute,
  value,
  onAttributeChanged,
  bounds,
}: AttributeInputRangeProps) {
  const fieldName = `${attribute}.${bounds}` as AttributeRangeKey;
  return (
    <NumberTextField
      key={fieldName}
      label={`${getAttributeLabel(attribute)} ${bounds}`}
      size="small"
      variant="outlined"
      value={value}
      min={1}
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
}

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
}: Props) {
  const debouncedOnAttributeSolverChanged = debounce(onAttributeSolverChanged, 300);
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
        min={1}
        max={713}
        onChange={(newValue) => debouncedOnAttributeSolverChanged("lvl", newValue)}
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
          onChange={(newValue) => debouncedOnAttributeSolverChanged(attribute, newValue)}
        />
      ))}

      {(["Min", "Max"] as BoundsOptions[]).map((bounds) =>
        damageAttributes.map((attribute) => {
          const rangeKey: AttributeRangeKey = `${attribute}.${bounds}`;
          return (
            <AttributeRangeInput
              key={rangeKey}
              attribute={attribute}
              value={solverAttributes[rangeKey]}
              onAttributeChanged={debouncedOnAttributeSolverChanged}
              bounds={bounds}
            />
          );
        }),
      )}
      {/*
      This isn't super useful, most of the time you are trying to optimize for the highest AP for a weapon.
      Changing this doesn't give very insightful information - i.e. if lighting type is chosen to optimize, it will give 99 in Dex first.
      <OptimizedDamageTypePicker
        onOptimizedDamageTypeChanged={onOptimizedDamageTypeChanged}
        optimizedDamageType={damageTypeToOptimizeFor}
      />
      */}

      <NumberTextField
        label={getAttributeLabel("end")}
        size="small"
        variant="outlined"
        value={solverAttributes.end}
        min={INITIAL_CLASS_VALUES[startingClass].end}
        max={99}
        onChange={(newValue) => {
          debouncedOnAttributeSolverChanged("end", newValue);
          const maxWeight = getMaxWeightForEndurance(newValue, rollType);
          onArmorWeightChanged(maxWeight);
        }}
      />
      <RollTypePicker onRollTypeChanged={onRollTypeChanged} rollType={rollType} />
      <NumberTextField
        label={"Max Armor Weight"}
        size="small"
        variant="outlined"
        value={armorWeight}
        min={0}
        max={200}
        onChange={(newValue) => onArmorWeightChanged(newValue)}
      />
      <BooleanInput label="Two handing" checked={twoHanding} onChange={onTwoHandingChanged} />
      <BooleanInput
        label="Subtract weapon weight from endurance"
        checked={adjustEnduranceForWeapon}
        onChange={onWeaponAdjustedEnduranceChanged}
      />
    </Box>
  );
}

export default memo(WeaponListSettings);
