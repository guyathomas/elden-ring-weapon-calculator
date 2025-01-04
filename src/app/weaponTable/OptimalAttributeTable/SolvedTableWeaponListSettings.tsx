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
  type StartingClass as StartingClass,
} from "../../ClassPicker";
import RollTypePicker from "../../RollTypePicker";
import type { SolvedAttributeState } from "../../reducers/useSolvedAttributeState";
import { getMaxWeightForEndurance } from "./useOptimalAttributes";
import {
  BooleanInput,
  WeaponLevelInput,
  type AttributeInputRangeProps,
} from "../FixedAttributeTable/FixedTableWeaponListSetting";

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
  splitDamage,
  onSplitDamageChanged,
}: Props) {
  const debouncedOnAttributeSolverChanged = debounce(onAttributeSolverChanged, 300);

  const handleChangeStartingClass = useCallback(
    (startingClass: StartingClass) => onStartingClassChanged(startingClass),
    [onStartingClassChanged],
  );

  const handleChangeUpgradeLevel = useCallback(
    (upgradeLevel: number) => onUpgradeLevelChanged(upgradeLevel),
    [onUpgradeLevelChanged],
  );

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

  const handleChangeRollType = useCallback(
    (rollType: SolvedAttributeState["rollType"]) => onRollTypeChanged(rollType),
    [onRollTypeChanged],
  );

  const handleChangeArmorWeight = useCallback(
    (newValue: number) => onArmorWeightChanged(newValue),
    [onArmorWeightChanged],
  );

  const handleChangeTwoHanding = useCallback(
    (twoHanding: boolean) => onTwoHandingChanged(twoHanding),
    [onTwoHandingChanged],
  );

  const handleChangeWeaponAdjustedEndurance = useCallback(
    (adjustEnduranceForWeapon: boolean) =>
      onWeaponAdjustedEnduranceChanged(adjustEnduranceForWeapon),
    [onWeaponAdjustedEnduranceChanged],
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
      <ClassPicker
        onStartingClassChanged={handleChangeStartingClass}
        startingClass={startingClass}
      />
      <WeaponLevelInput
        upgradeLevel={upgradeLevel}
        maxUpgradeLevel={maxUpgradeLevel}
        onUpgradeLevelChanged={handleChangeUpgradeLevel}
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
      <BooleanInput label="Two handing" checked={twoHanding} onChange={handleChangeTwoHanding} />
      <BooleanInput
        label="Adjust Endurance"
        checked={adjustEnduranceForWeapon}
        onChange={handleChangeWeaponAdjustedEndurance}
      />
      <NumberTextField
        label={getAttributeLabel("end")}
        size="small"
        variant="outlined"
        value={solverAttributes.end}
        min={INITIAL_CLASS_VALUES[startingClass].end}
        max={99}
        onChange={handleChangeEndurance}
      />
      {adjustEnduranceForWeapon && (
        <>
          <RollTypePicker onRollTypeChanged={handleChangeRollType} rollType={rollType} />
          <NumberTextField
            label={"Max Armor Weight"}
            size="small"
            variant="outlined"
            value={armorWeight}
            min={0}
            max={200}
            onChange={handleChangeArmorWeight}
          />
        </>
      )}
      <BooleanInput
        label="Show damage split"
        checked={splitDamage}
        onChange={onSplitDamageChanged}
      />
    </Box>
  );
}

export default memo(WeaponListSettings);
