import { useCallback, useEffect, useRef } from "react";
import {
  damageAttributes,
  type AttributeSolverValues,
  type DamageAttributeValues,
} from "../../calculator/calculator";
import type { Weapon } from "../../calculator/weapon";
import { useAppStateContext } from "../AppStateProvider";
import { INITIAL_CLASS_VALUES, type StartingClass } from "../ClassPicker";
import { ENDURANCE_LEVEL_TO_EQUIP_LOAD, rollTypeToMultiplier, type RollType } from "./constants";
import { getIncrementalDamagePerAttribute } from "../../calculator/newCalculator";
import { getNormalizedUpgradeLevel } from "../uiUtils";
import { getMaxAttackPower } from "./getMaxAttackPower";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface OptimalAttributeForAttackType {
  optimalDamage: number;
  optimalAttributes: DamageAttributeValues;
  disposablePoints: number;
}

export interface OptimalAttribute {
  attackPower: OptimalAttributeForAttackType;
  spellPower?: OptimalAttributeForAttackType;
  endurance: {
    incremental: number;
    total: number;
  };
}

function diffArraysByKey<T>(array1: T[], array2: T[], key: keyof T): T[] {
  // Create a set of the keys from the first array
  const keySet = new Set(array1.map((item) => item[key]));

  // Filter the second array to find new items
  const newItems = array2.filter((item) => !keySet.has(item[key]));

  return newItems;
}

export function getEnduranceForWeight(weight: number, rollType: RollType) {
  const rollTypeMultiplier = rollTypeToMultiplier[rollType];
  const targetCarryCapacity = weight / rollTypeMultiplier;
  return ENDURANCE_LEVEL_TO_EQUIP_LOAD.findIndex((c) => c >= targetCarryCapacity) + 1;
}

function getIncrementalEndurance(
  weaponWeight: number,
  initialEndurance: number,
  rollType: RollType,
) {
  const rollTypeMultiplier = rollTypeToMultiplier[rollType];
  const currentEquipLoad = ENDURANCE_LEVEL_TO_EQUIP_LOAD[initialEndurance];
  const requiredEquipLoad = weaponWeight / rollTypeMultiplier + currentEquipLoad;
  const totalEndurance = ENDURANCE_LEVEL_TO_EQUIP_LOAD.findIndex((c) => c > requiredEquipLoad);
  return totalEndurance - initialEndurance;
}

const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

function getEnduranceValues({
  armorWeight,
  weaponWeight,
  rollType,
  endurance,
  adjustEnduranceForWeapon,
}: {
  armorWeight: number;
  weaponWeight: number;
  rollType: RollType;
  endurance: number;
  adjustEnduranceForWeapon: boolean;
}) {
  let totalEndurance: number;
  let incrementalEndurance: number;
  if (adjustEnduranceForWeapon) {
    totalEndurance = Math.max(
      endurance,
      getEnduranceForWeight(armorWeight + weaponWeight ?? 0, rollType),
    );
    const enduranceWithoutWeapon = Math.max(
      getEnduranceForWeight(armorWeight, rollType),
      endurance,
    );
    incrementalEndurance = Math.max(totalEndurance - enduranceWithoutWeapon, 0);
  } else {
    const incremental = getIncrementalEndurance(weaponWeight ?? 0, endurance, rollType);
    incrementalEndurance = incremental;
    totalEndurance = incremental + endurance;
  }
  return {
    totalEndurance: Math.max(totalEndurance, endurance),
    incrementalEndurance,
  };
}

export const useOptimalAttributes = ({
  solverAttributes: sa,
  twoHanding,
  upgradeLevel,
  startingClass,
  adjustEnduranceForWeapon,
  rollType,
  weapons,
}: {
  solverAttributes: AttributeSolverValues;
  twoHanding: boolean;
  upgradeLevel: number;
  startingClass: StartingClass;
  adjustEnduranceForWeapon: boolean;
  rollType: RollType;
  weapons: Weapon[];
}) => {
  const weaponsMemo = useRef(weapons);
  const { setOptimalAttributesForWeapon, armorWeight } = useAppStateContext();
  const spendablePoints =
    INITIAL_CLASS_VALUES[startingClass].total -
    INITIAL_CLASS_VALUES[startingClass].lvl +
    sa.lvl -
    sa.min -
    sa.vig -
    sa.end;
  const calculateHighestWeaponAttackResult = useCallback(
    function (weapon: Weapon): OptimalAttribute {
      // Calculate Endurance Offsets
      const normalizedUpgradeLevel = getNormalizedUpgradeLevel(weapon, upgradeLevel);
      const { totalEndurance, incrementalEndurance } = getEnduranceValues({
        armorWeight,
        weaponWeight: weapon?.weight || 0,
        rollType,
        endurance: sa.end,
        adjustEnduranceForWeapon,
      });
      const endAdjustedSpendable =
        spendablePoints - (adjustEnduranceForWeapon ? incrementalEndurance : 0);

      const dmg = getIncrementalDamagePerAttribute(weapon, normalizedUpgradeLevel, twoHanding);

      // Calculate Attack Power
      const attributeRanges = damageAttributes.map((attr) => [
        Math.max(sa[`${attr}.Min`], weapon.requirements[attr] ?? 0),
        sa[`${attr}.Max`],
      ]);
      const optimalAttackScores = getMaxAttackPower(
        damageAttributes.map((attr) => dmg.attackPower[attr]),
        attributeRanges,
        Math.max(endAdjustedSpendable, 0),
      );

      // Calculate Spell Power
      let spellPower: OptimalAttributeForAttackType | undefined;
      if (weapon.sorceryTool || weapon.incantationTool) {
        const optimalSpellScores = getMaxAttackPower(
          damageAttributes.map((attr) => dmg.spellPower[attr]),
          attributeRanges,
          Math.max(endAdjustedSpendable, 0),
        );
        spellPower = {
          optimalAttributes: optimalSpellScores.highestAttributes,
          optimalDamage: optimalSpellScores.maxValue + 100,
          disposablePoints:
            endAdjustedSpendable - sumObjectValues(optimalSpellScores.highestAttributes),
        } as OptimalAttributeForAttackType;
      }

      return {
        attackPower: {
          optimalDamage: optimalAttackScores.maxValue + dmg.base,
          optimalAttributes: optimalAttackScores.highestAttributes,
          disposablePoints:
            endAdjustedSpendable - sumObjectValues(optimalAttackScores.highestAttributes),
        },
        spellPower,
        endurance: {
          total: totalEndurance,
          incremental: incrementalEndurance,
        },
      };
    },
    [
      sa,
      spendablePoints,
      adjustEnduranceForWeapon,
      upgradeLevel,
      twoHanding,
      rollType,
      armorWeight,
    ],
  );

  const calculateOptimalAttributesForWeapons = useCallback(
    async (weapons: Weapon[], reset?: boolean) => {
      if (reset) setOptimalAttributesForWeapon();
      const batchSize = 100;
      const batches: Weapon[][] = [];
      for (let i = 0; i < weapons.length; i += batchSize) {
        batches.push(weapons.slice(i, i + batchSize));
      }
      // Process each batch in series
      for (let i = 0; i < batches.length; i++) {
        const update = batches[i]
          .map(calculateHighestWeaponAttackResult)
          .reduce((acc, optimalAttribute, j) => {
            acc[batches[i][j].name] = optimalAttribute;
            return acc;
          }, {} as Record<Weapon["name"], OptimalAttribute>);
        setOptimalAttributesForWeapon(update);
        await wait(10);
      }
    },
    [calculateHighestWeaponAttackResult, setOptimalAttributesForWeapon],
  );

  useEffect(() => {
    // TODO: Debounce this so that can't be changed in quick succession
    const weaponsChanged = weaponsMemo.current !== weapons;
    if (weaponsChanged) {
      // Only recalculate the new weapons
      const newWeapons = diffArraysByKey(weaponsMemo.current, weapons, "name");
      weaponsMemo.current = weapons;
      calculateOptimalAttributesForWeapons(newWeapons);
    } else {
      // An input into the calulations has changed, and we must calculate all again
      calculateOptimalAttributesForWeapons(weapons, true);
    }
  }, [weapons, calculateOptimalAttributesForWeapons]);
};
