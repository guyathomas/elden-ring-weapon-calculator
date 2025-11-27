import {
  allDamageTypes,
  AttackPowerType,
  WeaponType,
  type AllAttribute,
  type Weapon,
} from "../calculator/calculator";

export const maxRegularUpgradeLevel = 25;
export const maxSpecialUpgradeLevel = 10;

/**
 * @param regularUpgradeLevel the upgrade level of a regular weapon
 * @returns the corresponding upgrade level for a somber weapon. i.e. 25 > 10, 13 > 5
 */
export function toSpecialUpgradeLevel(regularUpgradeLevel: number) {
  // For in between levels with no exact equivalent, round down. I think this is what you would
  // look for in practice, e.g. if you pick +24 you probably want +9 sombers because you're not
  // spending an Ancient Dragon (Somber) Smithing Stone, although it's not necessarily the same
  // matchmaking range.
  return Math.floor(
    (regularUpgradeLevel + 0.5) * (maxSpecialUpgradeLevel / maxRegularUpgradeLevel),
  );
}

export function getNormalizedUpgradeLevel(weapon: Weapon, upgradeLevel: number) {
  const isSpecialWeapon = weapon.attack.length - 1 === maxSpecialUpgradeLevel;
  return isSpecialWeapon
    ? toSpecialUpgradeLevel(upgradeLevel)
    : Math.min(upgradeLevel, weapon.attack.length - 1);
}

/**
 * @param specialUpgradeLevel the upgrade level of a somber weapon
 * @returns the corresponding upgrade level for a regular weapon
 */
export function toRegularUpgradeLevel(specialUpgradeLevel: number) {
  return Math.floor(specialUpgradeLevel * 2.5);
}

/*
  Get unique values out of an array of objects based on a key
*/
export function getUniqueValues<T>(array: T[], key: keyof T): T[] {
  const seenValues = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seenValues.has(value)) {
      return false;
    } else {
      seenValues.add(value);
      return true;
    }
  });
}

export const weaponTypeLabels = new Map<WeaponType, string>([
  [WeaponType.DAGGER, "Dagger"],
  [WeaponType.STRAIGHT_SWORD, "Straight Sword"],
  [WeaponType.GREATSWORD, "Greatsword"],
  [WeaponType.COLOSSAL_SWORD, "Colossal Sword"],
  [WeaponType.CURVED_SWORD, "Curved Sword"],
  [WeaponType.CURVED_GREATSWORD, "Curved Greatsword"],
  [WeaponType.KATANA, "Katana"],
  [WeaponType.TWINBLADE, "Twinblade"],
  [WeaponType.THRUSTING_SWORD, "Thrusting Sword"],
  [WeaponType.HEAVY_THRUSTING_SWORD, "Heavy Thrusting Sword"],
  [WeaponType.AXE, "Axe"],
  [WeaponType.GREATAXE, "Greataxe"],
  [WeaponType.HAMMER, "Hammer"],
  [WeaponType.GREAT_HAMMER, "Great Hammer"],
  [WeaponType.FLAIL, "Flail"],
  [WeaponType.SPEAR, "Spear"],
  [WeaponType.GREAT_SPEAR, "Great Spear"],
  [WeaponType.HALBERD, "Halberd"],
  [WeaponType.REAPER, "Reaper"],
  [WeaponType.FIST, "Fist"],
  [WeaponType.CLAW, "Claw"],
  [WeaponType.WHIP, "Whip"],
  [WeaponType.COLOSSAL_WEAPON, "Colossal Weapon"],
  [WeaponType.LIGHT_BOW, "Light Bow"],
  [WeaponType.BOW, "Bow"],
  [WeaponType.GREATBOW, "Greatbow"],
  [WeaponType.CROSSBOW, "Crossbow"],
  [WeaponType.BALLISTA, "Ballista"],
  [WeaponType.GLINTSTONE_STAFF, "Glintstone Staff"],
  [WeaponType.DUAL_CATALYST, "Dual Catalyst"],
  [WeaponType.SACRED_SEAL, "Sacred Seal"],
  [WeaponType.SMALL_SHIELD, "Small Shield"],
  [WeaponType.MEDIUM_SHIELD, "Medium Shield"],
  [WeaponType.GREATSHIELD, "Greatshield"],
  [WeaponType.TORCH, "Torch"],
  [WeaponType.HAND_TO_HAND, "Hand-to-Hand"],
  [WeaponType.PERFUME_BOTTLE, "Perfume Bottle"],
  [WeaponType.THRUSTING_SHIELD, "Thrusting Shield"],
  [WeaponType.THROWING_BLADE, "Throwing Blade"],
  [WeaponType.BACKHAND_BLADE, "Backhand Blade"],
  [WeaponType.LIGHT_GREATSWORD, "Light Greatsword"],
  [WeaponType.GREAT_KATANA, "Great Katana"],
  [WeaponType.BEAST_CLAW, "Beast Claw"],
]);

export const damageTypeLabels = new Map([
  [AttackPowerType.PHYSICAL, "Physical Attack"],
  [AttackPowerType.MAGIC, "Magic Attack"],
  [AttackPowerType.FIRE, "Fire Attack"],
  [AttackPowerType.LIGHTNING, "Lightning Attack"],
  [AttackPowerType.HOLY, "Holy Attack"],
  [AttackPowerType.SCARLET_ROT, "Scarlet Rot Buildup"],
  [AttackPowerType.MADNESS, "Madness Buildup"],
  [AttackPowerType.SLEEP, "Sleep Buildup"],
  [AttackPowerType.FROST, "Frost Buildup"],
  [AttackPowerType.POISON, "Poison Buildup"],
  [AttackPowerType.BLEED, "Bleed Buildup"],
  [AttackPowerType.DEATH_BLIGHT, "Death Blight Buildup"],
]);

export function getAttributeLabel(attribute: AllAttribute) {
  switch (attribute) {
    case "str":
      return "Strength";
    case "dex":
      return "Dexterity";
    case "int":
      return "Intelligence";
    case "fai":
      return "Faith";
    case "arc":
      return "Arcane";
    case "vig":
      return "Vigor";
    case "min":
      return "Mind";
    case "end":
      return "Endurance";
  }
}

export function getShortAttributeLabel(attribute: AllAttribute) {
  switch (attribute) {
    case "str":
      return "Str";
    case "dex":
      return "Dex";
    case "int":
      return "Int";
    case "fai":
      return "Fai";
    case "arc":
      return "Arc";
    case "vig":
      return "Vig";
    case "min":
      return "Min";
    case "end":
      return "End";
  }
}

export function getTotalDamageAttackPower(attackPower: Partial<Record<AttackPowerType, number>>) {
  return allDamageTypes.reduce<number>(
    (totalAttackPower, damageType) => totalAttackPower + (attackPower[damageType] ?? 0),
    0,
  );
}
