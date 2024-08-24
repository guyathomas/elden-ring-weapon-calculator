import { damageAttributes, type DamageAttribute, type DamageAttributeValues } from "./attributes";
import { AttackPowerType, allAttackPowerTypes, allDamageTypes } from "./attackPowerTypes";
import type { Weapon } from "./weapon";
import { WeaponType } from "./weaponTypes";

interface WeaponAttackOptions {
  weapon: Weapon;
  attributes: DamageAttributeValues;
  twoHanding?: boolean;
  upgradeLevel: number;
  disableTwoHandingAttackPowerBonus?: boolean;
  ineffectiveAttributePenalty?: number;
}

export interface WeaponAttackResult {
  attackPower: Partial<Record<AttackPowerType, number>>;
  spellScaling: Partial<Record<AttackPowerType, number>>;
  ineffectiveAttributes: DamageAttribute[];
  ineffectiveAttackPowerTypes: AttackPowerType[];
  upgradeLevel: number;
  efficiencyScore?: number;
}

/**
 * Adjust a set of character attributes to take into account the 50% Strength bonus when two
 * handing a weapon
 */
export function adjustAttributesForTwoHanding({
  twoHanding = false,
  weapon,
  attributes,
}: {
  twoHanding?: boolean;
  weapon: Weapon;
  attributes: DamageAttributeValues;
}): DamageAttributeValues {
  return {
    ...attributes,
    str: adjustStrengthForTwoHanding({ twoHanding, weapon, str: attributes.str }),
  };
}

export function adjustStrengthForTwoHanding({
  twoHanding = false,
  weapon,
  str,
}: {
  twoHanding?: boolean;
  weapon: Weapon;
  str: number;
}): number {
  // Paired weapons do not get the two handing bonus
  if (weapon.paired) return str;

  // Bows and ballistae can only be two handed
  const isForced2h = [
    WeaponType.LIGHT_BOW,
    WeaponType.BOW,
    WeaponType.GREATBOW,
    WeaponType.BALLISTA,
  ].includes(weapon.weaponType);

  return isForced2h || twoHanding ? Math.floor(str * 1.5) : str;
}

/**
 * Determine the damage for a weapon with the given player stats
 */
export default function getWeaponAttack({
  weapon,
  attributes,
  twoHanding,
  disableTwoHandingAttackPowerBonus,
  ineffectiveAttributePenalty = 0.4,
  upgradeLevel,
}: WeaponAttackOptions): WeaponAttackResult {
  const adjustedAttributes = adjustAttributesForTwoHanding({ twoHanding, weapon, attributes });
  // eslint-disable-next-line no-debugger
  debugger;
  const ineffectiveAttributes = (Object.entries(weapon.requirements) as [DamageAttribute, number][])
    .filter(([attribute, requirement]) => adjustedAttributes[attribute] < requirement)
    .map(([attribute]) => attribute);

  const ineffectiveAttackPowerTypes: AttackPowerType[] = [];

  const attackPower: Partial<Record<AttackPowerType, number>> = {};
  const spellScaling: Partial<Record<AttackPowerType, number>> = {};

  for (const attackPowerType of allAttackPowerTypes) {
    const isDamageType = allDamageTypes.includes(attackPowerType);

    const baseAttackPower = weapon.attack[upgradeLevel][attackPowerType] ?? 0;
    if (baseAttackPower || weapon.sorceryTool || weapon.incantationTool) {
      // This weapon's AttackElementCorrectParam determines what attributes each damage type scales
      // with
      const scalingAttributes = weapon.attackElementCorrect[attackPowerType] ?? {};

      let scalingForAttackType = 1;

      if (ineffectiveAttributes.some((attribute) => scalingAttributes[attribute])) {
        // If the requirements for this damage type are not met, a penalty is subtracted instead
        // of a scaling bonus being added
        scalingForAttackType = 1 - ineffectiveAttributePenalty;
        ineffectiveAttackPowerTypes.push(attackPowerType);
      } else {
        // Otherwise, the scaling multiplier is equal to the sum of the corrected attribute values
        // multiplied by the scaling for that attribute
        const effectiveAttributes =
          !disableTwoHandingAttackPowerBonus && isDamageType ? adjustedAttributes : attributes;
        for (const attribute of damageAttributes) {
          const attributeCorrect = scalingAttributes[attribute];
          if (attributeCorrect) {
            let scaling: number;
            if (attributeCorrect === true) {
              scaling = weapon.attributeScaling[upgradeLevel][attribute] ?? 0;
            } else {
              scaling =
                (attributeCorrect * (weapon.attributeScaling[upgradeLevel][attribute] ?? 0)) /
                (weapon.attributeScaling[0][attribute] ?? 0);
            }

            if (scaling) {
              scalingForAttackType +=
                weapon.calcCorrectGraphs[attackPowerType][effectiveAttributes[attribute]] * scaling;
            }
          }
        }
      }

      // The final scaling multiplier modifies the attack power for this damage type as a
      // percentage boost, e.g. 0.5 adds +50% of the base attack power
      if (baseAttackPower) {
        attackPower[attackPowerType] = baseAttackPower * scalingForAttackType;
      }

      if (isDamageType && (weapon.sorceryTool || weapon.incantationTool)) {
        spellScaling[attackPowerType] = 100 * scalingForAttackType;
      }
    }
  }

  return {
    attackPower,
    spellScaling,
    ineffectiveAttributes,
    ineffectiveAttackPowerTypes,
    upgradeLevel,
  };
}

export * from "./attributes";
export * from "./attackPowerTypes";
export * from "./weapon";
export * from "./weaponTypes";
