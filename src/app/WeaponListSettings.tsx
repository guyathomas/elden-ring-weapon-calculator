import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { allAttributes, maxRegularUpgradeLevel } from "../calculator/calculator";
import { toSpecialUpgradeLevel } from "../search/filterWeapons";
import { useAppState } from "./AppState";
import NumberTextField from "./NumberTextField";
import { getAttributeLabel } from "./uiUtils";

/**
 * Form controls for entering player attributes, basic filters, and display options
 */
const WeaponListSettings = () => {
  const {
    attributes,
    twoHanding,
    upgradeLevel,
    maxWeight,
    effectiveOnly,
    onAttributesChanged,
    onTwoHandingChanged,
    onUpgradeLevelChanged,
    onMaxWeightChanged,
    onEffectiveOnlyChanged,
  } = useAppState();

  return (
    <Box
      display="grid"
      sx={{
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "384px 128px auto auto 1fr" },
        alignItems: "start",
        pt: 1,
      }}
    >
      <Box display="grid" sx={{ gap: 2, gridTemplateColumns: "1fr 1fr 1fr" }}>
        {allAttributes.map((attribute) => (
          <NumberTextField
            key={attribute}
            label={getAttributeLabel(attribute)}
            size="small"
            variant="outlined"
            value={attributes[attribute]}
            min={1}
            max={99}
            onChange={(value) => {
              onAttributesChanged({ ...attributes, [attribute]: value });
            }}
          />
        ))}
      </Box>

      <Box display="grid" sx={{ gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="upgradeLevelLabel">Weapon Level</InputLabel>
          <Select
            labelId="upgradeLevelLabel"
            label="Weapon Level"
            size="small"
            value={upgradeLevel}
            onChange={(evt) => onUpgradeLevelChanged(+evt.target.value)}
          >
            {Array.from({ length: maxRegularUpgradeLevel + 1 }, (_, upgradeLevelOption) => (
              <MenuItem key={upgradeLevelOption} value={upgradeLevelOption}>
                +{upgradeLevelOption} / +{toSpecialUpgradeLevel(upgradeLevelOption)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Weight Limit"
          size="small"
          variant="outlined"
          inputProps={{
            type: "number",
            min: 0,
            max: 30,
            step: 0.5,
          }}
          value={maxWeight}
          onChange={(evt) => onMaxWeightChanged(+evt.currentTarget.value)}
        />
      </Box>

      <FormControlLabel
        label="Two Handing"
        sx={{ mr: 0 }}
        control={
          <Checkbox
            size="small"
            checked={twoHanding}
            name="Two Handing"
            onChange={(evt) => onTwoHandingChanged(evt.currentTarget.checked)}
          />
        }
      />

      <FormControlLabel
        label="Effective only"
        sx={{ mr: 0 }}
        control={
          <Checkbox
            size="small"
            checked={effectiveOnly}
            name="Effective only"
            onChange={(evt) => onEffectiveOnlyChanged(evt.currentTarget.checked)}
          />
        }
      />
    </Box>
  );
};

export default WeaponListSettings;
