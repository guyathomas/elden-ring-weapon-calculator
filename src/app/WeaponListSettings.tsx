import { memo } from "react";
import {
  Box,
  Checkbox,
  debounce,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import {
  damageAttributes,
  type DamageAttributeValues,
  type AllAttribute,
  type BoundsOptions,
  type AttributeRangeKey,
  nonDamageAttributes,
  type AllAttributeAndLevel,
  type AttributeSolverKey,
  type AttributeSolverValues,
  type NonDamageAttribute,
} from "../calculator/calculator";
import NumberTextField from "./NumberTextField";
import { getAttributeLabel, maxRegularUpgradeLevel, toSpecialUpgradeLevel } from "./uiUtils";
import ClassPicker, {
  INITIAL_CLASS_VALUES,
  type StartingClass as StartingClass,
} from "./ClassPicker";
import type { RollType } from "./weaponTable/constants";
import RollTypePicker from "./RollTypePicker";
import OptimizedDamageTypePicker from "./OptimizedDamageTypePicker";
import type { DamageTypeToOptimizeFor } from "./OptimizedDamageTypePicker";
import { getMaxWeightForEndurance } from "./weaponTable/useOptimalAttributes";

interface AttributeInputProps {
  attribute: AllAttribute;
  value: number;
  onAttributeChanged(attribute: AllAttribute, value: number): void;
}

interface AttributeInputRangeProps {
  attribute: AllAttribute;
  value: number;
  onAttributeChanged(attribute: AttributeRangeKey, value: number): void;
  bounds: BoundsOptions;
}

/**
 * Form control for picking the value of a single attribute (str/dex/int/fai/arc)
 */
const AttributeInput = memo(function AttributeInput({
  attribute,
  value,
  onAttributeChanged,
}: AttributeInputProps) {
  return (
    <NumberTextField
      key={attribute}
      label={getAttributeLabel(attribute)}
      size="small"
      variant="outlined"
      value={value}
      min={1}
      max={99}
      onChange={(newValue) => onAttributeChanged(attribute, newValue)}
    />
  );
});

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

interface WeaponLevelInputProps {
  upgradeLevel: number;
  maxUpgradeLevel?: number;
  onUpgradeLevelChanged(upgradeLevel: number): void;
}

/**
 * Form control for picking the weapon upgrade level (+1, +2, etc.)
 */
const WeaponLevelInput = memo(function WeaponLevelInput({
  upgradeLevel,
  maxUpgradeLevel = maxRegularUpgradeLevel,
  onUpgradeLevelChanged,
}: WeaponLevelInputProps) {
  return (
    <FormControl fullWidth>
      <InputLabel id="upgradeLevelLabel">Weapon Level</InputLabel>
      <Select
        labelId="upgradeLevelLabel"
        label="Weapon Level"
        size="small"
        value={Math.min(upgradeLevel, maxUpgradeLevel)}
        onChange={(evt) => onUpgradeLevelChanged(+evt.target.value)}
      >
        {Array.from({ length: maxUpgradeLevel + 1 }, (_, upgradeLevelOption) => (
          <MenuItem key={upgradeLevelOption} value={upgradeLevelOption}>
            {maxUpgradeLevel === maxRegularUpgradeLevel
              ? `+${upgradeLevelOption} / +${toSpecialUpgradeLevel(upgradeLevelOption)}`
              : `+${upgradeLevelOption}`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

interface BooleanInputProps {
  label: string;
  checked: boolean;
  onChange(checked: boolean): void;
}

/**
 * Form control for one of the weapon list checkboxes (two handing, show split damage)
 */
const BooleanInput = memo(function BooleanInput({ label, checked, onChange }: BooleanInputProps) {
  return (
    <FormControlLabel
      label={label}
      sx={{ mr: 0 }}
      control={
        <Checkbox
          size="small"
          checked={checked}
          name={label}
          onChange={(evt) => onChange(evt.currentTarget.checked)}
        />
      }
    />
  );
});

interface Props {
  breakpoint: "md" | "lg";
  attributes: DamageAttributeValues;
  attributeSolverValues: AttributeSolverValues;
  twoHanding: boolean;
  adjustEnduranceForWeapon: boolean;
  upgradeLevel: number;
  maxUpgradeLevel?: number;
  splitDamage: boolean;
  groupWeaponTypes: boolean;
  numericalScaling: boolean;
  startingClass: StartingClass;
  rollType: RollType;
  armorWeight: number;
  damageTypeToOptimizeFor: DamageTypeToOptimizeFor;
  onAttributeChanged(attribute: AllAttributeAndLevel, value: number): void;
  onAttributeSolverChanged(attribute: AttributeSolverKey, value: number): void;
  onTwoHandingChanged(twoHanding: boolean): void;
  onUpgradeLevelChanged(upgradeLevel: number): void;
  onSplitDamageChanged(splitDamage: boolean): void;
  onGroupWeaponTypesChanged(groupWeaponTypes: boolean): void;
  onNumericalScalingChanged(numericalScaling: boolean): void;
  onStartingClassChanged(startingClass: StartingClass): void;
  onWeaponAdjustedEnduranceChanged(adjustEnduranceForWeapon: boolean): void;
  onRollTypeChanged(rollType: RollType): void;
  onArmorWeightChanged(armorWeight: number): void;
  onOptimizedDamageTypeChanged(damageTypeToOptimizeFor: DamageTypeToOptimizeFor): void;
}

/**
 * Form controls for entering player attributes, basic filters, and display options
 */
function WeaponListSettings({
  breakpoint,
  attributes,
  attributeSolverValues,
  twoHanding,
  upgradeLevel,
  maxUpgradeLevel,
  adjustEnduranceForWeapon,
  splitDamage,
  groupWeaponTypes,
  numericalScaling,
  startingClass,
  rollType,
  armorWeight,
  damageTypeToOptimizeFor,
  onAttributeChanged,
  onAttributeSolverChanged,
  onTwoHandingChanged,
  onUpgradeLevelChanged,
  onSplitDamageChanged,
  onGroupWeaponTypesChanged,
  onNumericalScalingChanged,
  onStartingClassChanged,
  onWeaponAdjustedEnduranceChanged,
  onRollTypeChanged,
  onArmorWeightChanged,
  onOptimizedDamageTypeChanged,
}: Props) {
  const debouncedOnAttributeSolverChanged = debounce(onAttributeSolverChanged, 300);
  return (
    <>
      <Box
        display="grid"
        sx={(theme) => ({
          gap: 2,
          gridTemplateColumns: "1fr",
          alignItems: "start",
          [theme.breakpoints.up(breakpoint)]: {
            gridTemplateColumns: "320px 120px auto",
          },
        })}
      >
        <Box display="grid" sx={{ gap: 2, gridTemplateColumns: "1fr 1fr 1fr" }}>
          {damageAttributes.map((attribute) => (
            <AttributeInput
              key={attribute}
              attribute={attribute}
              value={attributes[attribute]}
              onAttributeChanged={onAttributeChanged}
            />
          ))}
        </Box>

        <WeaponLevelInput
          upgradeLevel={upgradeLevel}
          maxUpgradeLevel={maxUpgradeLevel}
          onUpgradeLevelChanged={onUpgradeLevelChanged}
        />

        <Box
          display="grid"
          sx={(theme) => ({
            mt: -1,
            columnGap: 2,
            gridTemplateColumns: "1fr auto",
            [theme.breakpoints.up("sm")]: {
              gridTemplateColumns: "1fr 1fr",
            },
            [theme.breakpoints.up(breakpoint)]: {
              gridTemplateColumns: "1fr auto",
              justifySelf: "start",
            },
          })}
        >
          <BooleanInput label="Two handing" checked={twoHanding} onChange={onTwoHandingChanged} />
          <BooleanInput
            label="Group by type"
            checked={groupWeaponTypes}
            onChange={onGroupWeaponTypesChanged}
          />
          <BooleanInput
            label="Numeric scaling"
            checked={numericalScaling}
            onChange={onNumericalScalingChanged}
          />
          <BooleanInput
            label="Show damage split"
            checked={splitDamage}
            onChange={onSplitDamageChanged}
          />
        </Box>
      </Box>
      <Typography variant="body1" align="center" sx={{ alignSelf: "end" }}>
        Weapon Solver
      </Typography>
      <Box>
        <Box
          display="grid"
          sx={{ gap: 2, gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", marginBottom: 2 }}
        >
          {(["Min", "Max"] as BoundsOptions[]).map((bounds) =>
            damageAttributes.map((attribute) => {
              const rangeKey: AttributeRangeKey = `${attribute}.${bounds}`;
              return (
                <AttributeRangeInput
                  key={rangeKey}
                  attribute={attribute}
                  value={attributeSolverValues[rangeKey]}
                  onAttributeChanged={debouncedOnAttributeSolverChanged}
                  bounds={bounds}
                />
              );
            }),
          )}
        </Box>
        <Box display="grid" sx={{ gap: 2, gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}>
          {(["vig", "min"] as NonDamageAttribute[]).map((attribute) => (
            <NumberTextField
              key={attribute}
              label={getAttributeLabel(attribute)}
              size="small"
              variant="outlined"
              value={attributeSolverValues[attribute]}
              min={INITIAL_CLASS_VALUES[startingClass][attribute]}
              max={99}
              onChange={(newValue) => debouncedOnAttributeSolverChanged(attribute, newValue)}
            />
          ))}
          <NumberTextField
            label={"Level"}
            size="small"
            variant="outlined"
            value={attributeSolverValues.lvl}
            min={1}
            max={713}
            onChange={(newValue) => debouncedOnAttributeSolverChanged("lvl", newValue)}
          />
          <ClassPicker
            onStartingClassChanged={onStartingClassChanged}
            startingClass={startingClass}
          />
          <OptimizedDamageTypePicker
            onOptimizedDamageTypeChanged={onOptimizedDamageTypeChanged}
            optimizedDamageType={damageTypeToOptimizeFor}
          />

          <NumberTextField
            label={getAttributeLabel("end")}
            size="small"
            variant="outlined"
            value={attributeSolverValues.end}
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
          <BooleanInput
            label="Adjust End for Weapon Weight"
            checked={adjustEnduranceForWeapon}
            onChange={onWeaponAdjustedEnduranceChanged}
          />
        </Box>
      </Box>
    </>
  );
}

export default memo(WeaponListSettings);
