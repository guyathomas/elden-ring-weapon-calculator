import { memo } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { AttackPowerType } from "../calculator/attackPowerTypes";

export type DamageTypeToOptimizeFor = AttackPowerType | "total";

interface Props {
  onOptimizedDamageTypeChanged: (damageType: DamageTypeToOptimizeFor) => void;
  optimizedDamageType: DamageTypeToOptimizeFor;
}
type DamageTypeOption = { label: string; value: DamageTypeToOptimizeFor };
const damageTypeOptions: DamageTypeOption[] = [
  {
    value: "total",
    label: "Total",
  },
  {
    value: AttackPowerType.PHYSICAL,
    label: "Physical",
  },
  {
    value: AttackPowerType.MAGIC,
    label: "Magic",
  },
  {
    value: AttackPowerType.FIRE,
    label: "Fire",
  },
  {
    value: AttackPowerType.LIGHTNING,
    label: "Lightning",
  },
  {
    value: AttackPowerType.HOLY,
    label: "Holy",
  },
  // {
  //   value: AttackPowerType.POISON,
  //   label: "Poison",
  // },
  // {
  //   value: AttackPowerType.SCARLET_ROT,
  //   label: "Scarlet Rot",
  // },
  // {
  //   value: AttackPowerType.BLEED,
  //   label: "Bleed",
  // },
  // {
  //   value: AttackPowerType.FROST,
  //   label: "Frost",
  // },
  // {
  //   value: AttackPowerType.SLEEP,
  //   label: "Sleep",
  // },
  // {
  //   value: AttackPowerType.MADNESS,
  //   label: "Madness",
  // },
  // {
  //   value: AttackPowerType.DEATH_BLIGHT,
  //   label: "Death Blight",
  // },
];

/**
 * Dropdown used to select a damage type that the optimizer should optimize for
 */
function OptimizedDamageTypePicker({ onOptimizedDamageTypeChanged, optimizedDamageType }: Props) {
  return (
    <FormControl fullWidth>
      <InputLabel>Damage Type To Optimize</InputLabel>
      <Select
        label="Damage Type To Optimize"
        size="small"
        value={optimizedDamageType}
        onChange={(evt) => {
          onOptimizedDamageTypeChanged(evt.target.value as DamageTypeToOptimizeFor);
        }}
      >
        {damageTypeOptions.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default memo(OptimizedDamageTypePicker);
