import { damageAttributes, type DamageAttribute, type DamageAttributeValues } from "./attributes";
import { AttackPowerType, allAttackPowerTypes, allDamageTypes } from "./attackPowerTypes";
import type { Weapon } from "./weapon";
import { WeaponType } from "./weaponTypes";
import { calculateFinalScaling } from "./newCalculator";

interface WeaponAttackOptions {
  weapon: Weapon;
  attributes: DamageAttributeValues;
  twoHanding?: boolean;
  upgradeLevel: number;
  disableTwoHandingAttackPowerBonus: boolean;
  ineffectiveAttributePenalty: number;
}

export interface WeaponAttackResult {
  attackPower: Partial<Record<AttackPowerType, number>>;
  spellScaling: Partial<Record<AttackPowerType, number>>;
  ineffectiveAttributes: DamageAttribute[];
  ineffectiveAttackPowerTypes: AttackPowerType[];
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
  let applyTwoHandingBonus = twoHanding;

  // Paired weapons do not get the two handing bonus
  if (weapon.paired) {
    applyTwoHandingBonus = false;
  }

  // Bows and ballistae can only be two handed
  if (
    weapon.weaponType === WeaponType.LIGHT_BOW ||
    weapon.weaponType === WeaponType.BOW ||
    weapon.weaponType === WeaponType.GREATBOW ||
    weapon.weaponType === WeaponType.BALLISTA
  ) {
    applyTwoHandingBonus = true;
  }
  // 148 is the max allowed attribute value
  return applyTwoHandingBonus ? Math.min(Math.floor(str * 1.5), 148) : str;
}

/**
 * Determine the damage for a weapon with the given player stats
 */
export default function getWeaponAttack({
  weapon,
  attributes,
  twoHanding,
  upgradeLevel,
  disableTwoHandingAttackPowerBonus,
  ineffectiveAttributePenalty,
}: WeaponAttackOptions): WeaponAttackResult {
  const adjustedAttributes: DamageAttributeValues = {
    ...attributes,
    str: adjustStrengthForTwoHanding({ twoHanding, weapon, str: attributes.str }),
  };

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

      let totalScaling = 1;

      if (ineffectiveAttributes.some((attribute) => scalingAttributes[attribute])) {
        // If the requirements for this damage type are not met, a penalty is subtracted instead
        // of a scaling bonus being added
        totalScaling = 1 - ineffectiveAttributePenalty;
        ineffectiveAttackPowerTypes.push(attackPowerType);
      } else {
        // Otherwise, the scaling multiplier is equal to the sum of the corrected attribute values
        // multiplied by the scaling for that attribute
        const effectiveAttributes =
          !disableTwoHandingAttackPowerBonus && isDamageType ? adjustedAttributes : attributes;
        for (const attribute of damageAttributes) {
          const attributeCorrect = scalingAttributes[attribute];
          if (attributeCorrect) {
            totalScaling += calculateFinalScaling({
              attributeCorrect,
              attributeScaling: weapon.attributeScaling[upgradeLevel][attribute] || 0,
              baseAttributeScaling: weapon.attributeScaling[0][attribute] || 0,
              calcCorrectGraphValue:
                weapon.calcCorrectGraphs[attackPowerType][effectiveAttributes[attribute]],
            });
          }
        }
      }

      // The final scaling multiplier modifies the attack power for this damage type as a
      // percentage boost, e.g. 0.5 adds +50% of the base attack power
      if (baseAttackPower) {
        attackPower[attackPowerType] = baseAttackPower * totalScaling;
      }

      if (isDamageType && (weapon.sorceryTool || weapon.incantationTool)) {
        spellScaling[attackPowerType] = 100 * totalScaling;
      }
    }
  }

  return {
    attackPower,
    spellScaling,
    ineffectiveAttributes,
    ineffectiveAttackPowerTypes,
  };
}

export * from "./attributes";
export * from "./attackPowerTypes";
export * from "./weapon";
export * from "./weaponTypes";
