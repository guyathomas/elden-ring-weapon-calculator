import { memo, useMemo } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { DamageAttribute, NonDamageAttribute } from "../calculator/attributes";

export type StartingClass =
  | "Hero"
  | "Bandit"
  | "Astrologer"
  | "Warrior"
  | "Prisoner"
  | "Confessor"
  | "Wretch"
  | "Vagabond"
  | "Prophet"
  | "Samurai";

type AllStartingClassAttributes = DamageAttribute | NonDamageAttribute | "lvl" | "total";

export const INITIAL_CLASS_VALUES: Record<
  StartingClass,
  Record<AllStartingClassAttributes, number>
> = {
  Hero: {
    lvl: 7,
    vig: 14,
    min: 9,
    end: 12,
    str: 16,
    dex: 9,
    int: 7,
    fai: 8,
    arc: 11,
    total: 86,
  },
  Bandit: {
    lvl: 5,
    vig: 10,
    min: 11,
    end: 10,
    str: 9,
    dex: 13,
    int: 9,
    fai: 8,
    arc: 14,
    total: 84,
  },
  Astrologer: {
    lvl: 6,
    vig: 9,
    min: 15,
    end: 9,
    str: 8,
    dex: 12,
    int: 16,
    fai: 7,
    arc: 9,
    total: 85,
  },
  Warrior: {
    lvl: 8,
    vig: 11,
    min: 12,
    end: 11,
    str: 10,
    dex: 16,
    int: 10,
    fai: 8,
    arc: 9,
    total: 87,
  },
  Prisoner: {
    lvl: 9,
    vig: 11,
    min: 12,
    end: 11,
    str: 11,
    dex: 14,
    int: 14,
    fai: 6,
    arc: 9,
    total: 88,
  },
  Confessor: {
    lvl: 10,
    vig: 10,
    min: 13,
    end: 10,
    str: 12,
    dex: 12,
    int: 9,
    fai: 14,
    arc: 9,
    total: 89,
  },
  Wretch: {
    lvl: 1,
    vig: 10,
    min: 10,
    end: 10,
    str: 10,
    dex: 10,
    int: 10,
    fai: 10,
    arc: 10,
    total: 80,
  },
  Vagabond: {
    lvl: 9,
    vig: 15,
    min: 10,
    end: 11,
    str: 14,
    dex: 13,
    int: 9,
    fai: 9,
    arc: 7,
    total: 88,
  },
  Prophet: {
    lvl: 7,
    vig: 10,
    min: 14,
    end: 8,
    str: 11,
    dex: 10,
    int: 7,
    fai: 16,
    arc: 10,
    total: 86,
  },
  Samurai: {
    lvl: 9,
    vig: 12,
    min: 11,
    end: 13,
    str: 12,
    dex: 15,
    int: 9,
    fai: 8,
    arc: 8,
    total: 88,
  },
};

interface Props {
  startingClass: StartingClass;
  onStartingClassChanged(startingClass: StartingClass): void;
}

/**
 * Dropdown used to select a class to use in the solver. Setting the class will just prefill the minimum ranges for the solver.
 */
function ClassPicker({ startingClass, onStartingClassChanged }: Props) {
  const options = useMemo(
    () => Object.keys(INITIAL_CLASS_VALUES).sort((a, b) => (a > b ? 1 : -1)),
    [],
  );
  return (
    <FormControl fullWidth>
      <InputLabel>Starting Class</InputLabel>
      <Select
        label="Starting Class"
        size="small"
        value={startingClass}
        onChange={(evt) => {
          onStartingClassChanged(evt.target.value as StartingClass);
        }}
      >
        {options.map((startingClass) => (
          <MenuItem key={startingClass} value={startingClass}>
            {startingClass}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default memo(ClassPicker);
