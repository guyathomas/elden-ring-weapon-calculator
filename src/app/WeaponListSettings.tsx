import {
  Box,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import { allAttributes, maxRegularUpgradeLevel } from "../calculator/calculator";
import { toSpecialUpgradeLevel } from "../search/filterWeapons";
import { useAppState } from "./AppState";
import { getAttributeLabel } from "./uiUtils";

/**
 * Form controls for entering player attributes, basic filters, and display options
 */
const WeaponListSettings = () => {
  const {
    darkMode,
    attributes,
    twoHanding,
    upgradeLevel,
    maxWeight,
    effectiveOnly,
    onDarkModeChanged,
    onAttributesChanged,
    onTwoHandingChanged,
    onUpgradeLevelChanged,
    onMaxWeightChanged,
    onEffectiveOnlyChanged,
  } = useAppState();

  return (
    <Container
      maxWidth="xl"
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "384px 128px auto auto 1fr" },
        alignItems: "start",
        py: 2,
      }}
    >
      <Box display="grid" sx={{ gap: 2, gridTemplateColumns: "1fr 1fr 1fr" }}>
        {allAttributes.map((attribute) => (
          <TextField
            key={attribute}
            label={getAttributeLabel(attribute)}
            size="small"
            variant="outlined"
            inputProps={{
              type: "number",
              min: 1,
              max: 99,
              step: 1,
            }}
            value={attributes[attribute]}
            onChange={(evt) => {
              onAttributesChanged({ ...attributes, [attribute]: +evt.currentTarget.value });
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

      <FormControlLabel
        label="Dark Mode"
        sx={{ justifySelf: "end" }}
        control={
          <Switch
            checked={darkMode}
            onChange={(evt) => onDarkModeChanged(evt.currentTarget.checked)}
          />
        }
      />
    </Container>
  );
};

export default WeaponListSettings;
