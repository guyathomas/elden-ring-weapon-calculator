import { memo } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { rollTypeToMultiplier, type RollType } from "./weaponTable/constants";

interface Props {
  rollType: RollType;
  onRollTypeChanged(rollType: RollType): void;
}

/**
 * Dropdown used to select the desired roll type in the attribute solver when "adjustEnduranceForWeapon" is enabled
 */
function RollTypePicker({ rollType, onRollTypeChanged }: Props) {
  return (
    <FormControl fullWidth>
      <InputLabel>Target Roll Type</InputLabel>
      <Select
        label="Target Roll Type"
        size="small"
        value={rollType}
        onChange={(evt) => {
          onRollTypeChanged(evt.target.value as RollType);
        }}
      >
        {Object.keys(rollTypeToMultiplier).map((rollType) => (
          <MenuItem key={rollType} value={rollType}>
            {[rollType[0].toLocaleUpperCase(), rollType.slice(1)].join("")}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default memo(RollTypePicker);
