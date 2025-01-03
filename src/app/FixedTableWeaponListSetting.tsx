import { memo } from "react";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  damageAttributes,
  type DamageAttributeValues,
  type AllAttribute,
  type BoundsOptions,
  type AttributeRangeKey,
  type AllAttributeAndLevel,
  type AttributeSolverKey,
  type AttributeSolverValues,
} from "../calculator/calculator";
import NumberTextField from "./NumberTextField";
import { getAttributeLabel, maxRegularUpgradeLevel, toSpecialUpgradeLevel } from "./uiUtils";
import ClassPicker, { type StartingClass as StartingClass } from "./ClassPicker";

export interface AttributeInputProps {
  attribute: AllAttribute;
  value: number;
  onAttributeChanged(attribute: AllAttribute, value: number): void;
}

export interface AttributeInputRangeProps {
  attribute: AllAttribute;
  value: number;
  onAttributeChanged(attribute: AttributeRangeKey, value: number): void;
  bounds: BoundsOptions;
  min?: number;
}

/**
 * Form control for picking the value of a single attribute (str/dex/int/fai/arc)
 */
export const AttributeInput = memo(function AttributeInput({
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
      fullWidth
    />
  );
});

export interface WeaponLevelInputProps {
  upgradeLevel: number;
  maxUpgradeLevel?: number;
  onUpgradeLevelChanged(upgradeLevel: number): void;
}

/**
 * Form control for picking the weapon upgrade level (+1, +2, etc.)
 */
export const WeaponLevelInput = memo(function WeaponLevelInput({
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

export interface BooleanInputProps {
  label: string;
  checked: boolean;
  onChange(checked: boolean): void;
}

/**
 * Form control for one of the weapon list checkboxes (two handing, show split damage)
 */
export const BooleanInput = memo(function BooleanInput({
  label,
  checked,
  onChange,
}: BooleanInputProps) {
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
  twoHanding: boolean;
  upgradeLevel: number;
  maxUpgradeLevel?: number;
  splitDamage: boolean;
  numericalScaling: boolean;
  startingClass: StartingClass;
  onAttributeChanged(attribute: AllAttributeAndLevel, value: number): void;
  onTwoHandingChanged(twoHanding: boolean): void;
  onUpgradeLevelChanged(upgradeLevel: number): void;
  onSplitDamageChanged(splitDamage: boolean): void;
  onNumericalScalingChanged(numericalScaling: boolean): void;
  onStartingClassChanged(startingClass: StartingClass): void;
}

/**
 * Form controls for entering player attributes, basic filters, and display options
 */
function WeaponListSettings({
  breakpoint,
  attributes,
  twoHanding,
  upgradeLevel,
  maxUpgradeLevel,
  splitDamage,
  numericalScaling,
  startingClass,
  onAttributeChanged,
  onTwoHandingChanged,
  onUpgradeLevelChanged,
  onSplitDamageChanged,
  onNumericalScalingChanged,
  onStartingClassChanged,
}: Props) {
  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: 2,
        gridTemplateColumns: "repeat(5, minmax(60px, 1fr))",
        gridRow: "auto",
        gridTemplateAreas: `"class-picker class-picker weapon-level two-handing two-handing"
        "str dex int fai arc"
"column-settings column-settings column-settings column-settings column-settings"
`,
        [theme.breakpoints.up(breakpoint)]: {
          gridTemplateAreas: `"class-picker weapon-level two-handing . ."
        "str dex int fai arc"
"column-settings column-settings . . ."
`,
        },
      })}
    >
      <Box gridArea="class-picker">
        <ClassPicker
          onStartingClassChanged={onStartingClassChanged}
          startingClass={startingClass}
        />
      </Box>
      <Box gridArea="weapon-level">
        <WeaponLevelInput
          upgradeLevel={upgradeLevel}
          maxUpgradeLevel={maxUpgradeLevel}
          onUpgradeLevelChanged={onUpgradeLevelChanged}
        />
      </Box>
      <Box gridArea="two-handing">
        <BooleanInput label="Two handing" checked={twoHanding} onChange={onTwoHandingChanged} />
      </Box>
      {damageAttributes.map((attribute) => (
        <Box gridArea={attribute} key={attribute}>
          <AttributeInput
            key={attribute}
            attribute={attribute}
            value={attributes[attribute]}
            onAttributeChanged={onAttributeChanged}
          />
        </Box>
      ))}
      <Box
        gridArea="column-settings"
        justifyContent="flex-start"
        gridTemplateColumns="1fr 1fr"
        display="grid"
        sx={(theme) => ({
          [theme.breakpoints.up(breakpoint)]: {
            gridTemplateColumns: "minmax(1fr, 140px) minmax(1fr, 140px)",
          },
        })}
      >
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
  );
}

export default memo(WeaponListSettings);
