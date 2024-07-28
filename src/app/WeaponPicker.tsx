import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import type { Weapon } from "../calculator/weapon";
import { weaponTypeLabels } from "./uiUtils";

export type WeaponOption = {
  label: string; // weaponName
  value: string; // weaponName
  type: string; // weaponType
};

interface Props {
  selectedWeapons: WeaponOption[];
  onSelectedWeaponsChanged(weapons: WeaponOption[]): void;
  weaponOptions: Weapon[];
}
/**
 * An Autocomplete to allow for manually specifying weapons
 */
function WeaponPicker({ onSelectedWeaponsChanged, weaponOptions, selectedWeapons }: Props) {
  const handleOnChange = useCallback(
    (event: React.SyntheticEvent<Element, Event>, newSelection: WeaponOption[]) => {
      onSelectedWeaponsChanged(newSelection);
    },
    [onSelectedWeaponsChanged],
  );
  const options: WeaponOption[] = useMemo(
    () =>
      weaponOptions.map((weapon) => ({
        label: weapon.name,
        value: weapon.name,
        type: weaponTypeLabels.get(weapon.weaponType) || "",
      })),
    [weaponOptions],
  );
  return (
    <Box>
      <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
        Weapons
      </Typography>
      <Autocomplete
        multiple
        options={options}
        value={selectedWeapons}
        onChange={handleOnChange}
        renderInput={(params) => <TextField {...params} label="Weapons" />}
        groupBy={(weapon) => weapon.type}
        size="small"
      />
    </Box>
  );
}

export default memo(WeaponPicker);
