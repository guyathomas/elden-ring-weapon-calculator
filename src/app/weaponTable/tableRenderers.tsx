/*
 * Components used to render certain data cells in the weapon table
 *
 * These are implemented as memozied components because they often don't update when the rest
 * of the table does, so it's performant to be able to skip over them when e.g. only attack
 * power changes.
 */
import { memo } from "react";
import { Box, Link, Typography } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import { type Weapon, type DamageAttribute } from "../../calculator/calculator";
import { getAttributeLabel } from "../uiUtils";

export const blankIcon = <RemoveIcon color="disabled" fontSize="small" />;

/**
 * @returns the given value truncated to an integer
 */
export function round(value: number) {
  // Add a small offset to prevent off-by-ones due to floating point error
  return Math.floor(value + 0.000000001);
}

/**
 * Component that displays the weapon name as a wiki link.
 */
export const WeaponNameRenderer = memo(function WeaponNameRenderer({
  weapon,
  upgradeLevel,
}: {
  weapon: Weapon;
  upgradeLevel: number;
}) {
  const text = `${weapon.name}${upgradeLevel > 0 ? ` +${upgradeLevel}` : ""}`;
  const weaponName = weapon.url ? (
    <Link
      variant="button"
      underline="hover"
      href={weapon.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {text}
    </Link>
  ) : (
    <Typography variant="button">{text}</Typography>
  );
  return (
    <Box>
      {weaponName}
      {weapon.variant && (
        <Typography component="span" variant="body2">
          {" "}
          ({weapon.variant})
        </Typography>
      )}
    </Box>
  );
});

/**
 * Component that displays the scaling for an attribute on a weapon.
 */
export const ScalingRenderer = memo(function ScalingRenderer({
  weapon: { attributeScaling, scalingTiers },
  upgradeLevel,
  attribute,
  numerical,
}: {
  weapon: Weapon;
  upgradeLevel: number;
  attribute: DamageAttribute;
  numerical?: boolean;
}) {
  const scalingValue = attributeScaling[upgradeLevel][attribute];
  if (!scalingValue) return blankIcon;
  const value = numerical
    ? round(scalingValue * 100)
    : scalingTiers.find(([value]) => scalingValue >= value)?.[1];
  return <span title={`${Math.round(scalingValue! * 100000) / 1000}%`}>{value}</span>;
});

/**
 * Component that displays an attribute of a weapon.
 */
export const AttributeRequirementRenderer = memo(function AttributeRequirementRenderer({
  weapon: { requirements },
  attribute,
  ineffective,
}: {
  weapon: Weapon;
  attribute: DamageAttribute;
  ineffective: boolean;
}) {
  const requirement = requirements[attribute] ?? 0;
  if (requirement === 0) return blankIcon;

  if (ineffective) {
    return (
      <Typography
        sx={{ color: (theme) => theme.palette.error.main }}
        aria-label={
          `${requirement}. Unable to wield this weapon effectively with present` +
          ` ${getAttributeLabel(attribute)} stat`
        }
      >
        {requirement}
      </Typography>
    );
  }

  return <>{requirement}</>;
});

/**
 * Component that displays the best stats to use given the provided constraints for this weapon
 */
export const OptimizedAttributeRenderer = memo(function AttributeRequirementRenderer({
  value,
}: {
  value: number;
}) {
  const attributeValue = Math.floor(value);

  return (
    <Typography
      sx={{ color: (theme) => (attributeValue < 0 ? theme.palette.error.main : undefined) }}
      aria-label={`${round(
        attributeValue,
      )}. Invalid stat allocation. Please adjust your starting class or level`}
    >
      {round(attributeValue)}
    </Typography>
  );
});

/**
 * Component that displays the endurance required for the given armor weight and weapon weight
 */
export const OptimizedEnduranceRenderer = memo(function AttributeRequirementRenderer({
  endurance,
}: {
  endurance?: number;
}) {
  if (!endurance) return blankIcon;
  return <>{endurance}</>;
});

/**
 * Component that displays one damage type / status effect / spell scaling of a weapon.
 */
export const AttackPowerRenderer = memo(function AttackPowerRenderer({
  value,
  ineffective,
}: {
  value?: number;
  ineffective?: boolean;
}) {
  if (value == null || typeof value === "undefined") {
    return blankIcon;
  }

  if (ineffective) {
    return (
      <Typography
        sx={{ color: (theme) => theme.palette.error.main }}
        aria-label={`${round(value)}. Unable to wield this weapon effectively with present stats`}
      >
        {round(value)}
      </Typography>
    );
  }

  return <>{round(value)}</>;
});

/**
 * Component that displays one damage type / status effect / spell scaling of a weapon.
 */
export const ActionRenderer = memo(function ActionRenderer() {
  return (
    <Typography sx={{ color: (theme) => theme.palette.error.main }}>{"Typography"}</Typography>
  );
});
