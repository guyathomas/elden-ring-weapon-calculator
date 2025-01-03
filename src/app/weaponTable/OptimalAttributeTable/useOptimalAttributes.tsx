import { useCallback, useEffect, useRef, useState } from "react";
import getWeaponAttack, {
  allDamageTypes,
  AttackPowerType,
  damageAttributes,
  type AttributeSolverValues,
  type DamageAttribute,
  type DamageAttributeValues,
} from "../../../calculator/calculator";
import type { Weapon } from "../../../calculator/weapon";
import { INITIAL_CLASS_VALUES, type StartingClass } from "../../ClassPicker";
import { type RollType, rollTypeToMultiplier } from "../../RollTypePicker";
import {
  getIncrementalDamagePerAttribute,
  type IncrementalDamagePerAttribute,
} from "../../../calculator/newCalculator";
import { getNormalizedUpgradeLevel } from "../../uiUtils";
import { getMaxAttackPower } from "../getMaxAttackPower";
import type { DamageTypeToOptimizeFor } from "../../OptimizedDamageTypePicker";
import type { SolvedAttributeState } from "../../reducers/useSolvedAttributeState";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface OptimalAttributeForAttackType {
  optimalDamage: number;
  optimalAttributes: DamageAttributeValues;
  disposablePoints: number;
}

export interface OptimalAttribute {
  attackPower?: OptimalAttributeForAttackType & {
    optimalDamageSplit: Record<AttackPowerType, number>;
    efficiencyScore: number;
  };
  spellPower?: OptimalAttributeForAttackType;
  endurance?: {
    incremental: number;
    total: number;
  };
  incrementalDamagePerAttribute?: IncrementalDamagePerAttribute;
}

export const ENDURANCE_LEVEL_TO_EQUIP_LOAD = [
  45.0, 45.0, 45.0, 45.0, 45.0, 45.0, 45.0, 45.0, 46.6, 48.2, 49.8, 51.4, 52.9, 54.5, 56.1, 57.7,
  59.3, 60.9, 62.5, 64.1, 65.6, 67.2, 68.8, 70.4, 72.0, 73.0, 74.1, 75.2, 76.4, 77.6, 78.9, 80.2,
  81.5, 82.8, 84.1, 85.4, 86.8, 88.1, 89.5, 90.9, 92.3, 93.7, 95.1, 96.5, 97.9, 99.4, 100.8, 102.2,
  103.7, 105.2, 106.6, 108.1, 109.6, 111.0, 112.5, 114.0, 115.5, 117.0, 118.5, 120.0, 121.0, 122.1,
  123.1, 124.1, 125.1, 126.2, 127.2, 128.2, 129.2, 130.3, 131.3, 132.3, 133.3, 134.4, 135.4, 136.4,
  137.4, 138.5, 139.5, 140.5, 141.5, 142.6, 143.6, 144.6, 145.6, 146.7, 147.7, 148.7, 149.7, 150.8,
  151.8, 152.8, 153.8, 154.9, 155.9, 156.9, 157.9, 159.0, 160.0,
];

function diffArraysByKey<T>(array1: T[], array2: T[], key: keyof T): T[] {
  // Create a set of the keys from the first array
  const keySet = new Set(array1.map((item) => item[key]));
  // Filter the second array to find new items
  return array2.filter((item) => !keySet.has(item[key]));
}

export function getEnduranceForWeight(weight: number, rollType: RollType) {
  const rollTypeMultiplier = rollTypeToMultiplier[rollType];
  const targetCarryCapacity = weight / rollTypeMultiplier;
  return ENDURANCE_LEVEL_TO_EQUIP_LOAD.findIndex((c) => c >= targetCarryCapacity) + 1;
}

export function getMaxWeightForEndurance(endurance: number, rollType: RollType) {
  const rollTypeMultiplier = rollTypeToMultiplier[rollType];
  const carryCapacity = ENDURANCE_LEVEL_TO_EQUIP_LOAD[endurance - 1];
  return carryCapacity * rollTypeMultiplier;
}

const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

/*
 * When adjustEnduranceForWeapon checked
 * Specify how much additional endurance is required ontop of the existing endurance or weight/rollType
 * Return that additional endurance amount and the total endurance
 */
function getIncrementalEndurance({
  armorWeight,
  weaponWeight,
  rollType,
}: {
  armorWeight: number;
  weaponWeight: number;
  rollType: RollType;
}) {
  const enduranceWithoutWeapon = getEnduranceForWeight(armorWeight, rollType);
  const enduranceWithWeapon = getEnduranceForWeight(armorWeight + weaponWeight || 0, rollType);
  const incrementalEndurance = Math.max(enduranceWithWeapon - enduranceWithoutWeapon, 0);
  return {
    enduranceWithWeapon,
    incrementalEndurance,
  };
}
export type OptimalAttributesMap = Partial<Record<Weapon["name"], OptimalAttribute>>;
export const useOptimalAttributes = ({
  solverAttributes: sa,
  twoHanding,
  upgradeLevel,
  startingClass,
  adjustEnduranceForWeapon,
  rollType,
  weapons,
  damageTypeToOptimizeFor = "total",
  armorWeight,
}: {
  solverAttributes: AttributeSolverValues;
  twoHanding: boolean;
  upgradeLevel: number;
  startingClass: StartingClass;
  adjustEnduranceForWeapon: boolean;
  rollType: RollType;
  weapons: readonly Weapon[];
  damageTypeToOptimizeFor?: DamageTypeToOptimizeFor;
  armorWeight: SolvedAttributeState["armorWeight"];
}): { optimalAttributes: OptimalAttributesMap } => {
  const [optimalAttributes, setOptimalAttributes] = useState<OptimalAttributesMap>({});
  const weaponsMemo = useRef(weapons);
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
      const { enduranceWithWeapon, incrementalEndurance } = getIncrementalEndurance({
        armorWeight,
        weaponWeight: weapon?.weight || 0,
        rollType,
      });

      const endAdjustedSpendable = adjustEnduranceForWeapon
        ? spendablePoints - incrementalEndurance
        : spendablePoints;

      const dmg = getIncrementalDamagePerAttribute(weapon, normalizedUpgradeLevel, twoHanding);

      // Calculate Attack Power
      const attributeRanges = damageAttributes.map((attr) => [
        Math.max(sa[`${attr}.Min`], weapon.requirements[attr] ?? 0),
        sa[`${attr}.Max`],
      ]);
      let optimalAttackScores = getMaxAttackPower(
        damageAttributes.map((attr) =>
          dmg.attackPower[attr].map((d) => d[damageTypeToOptimizeFor] || 0),
        ),
        attributeRanges,
        Math.max(endAdjustedSpendable, 0),
      );

      // Spend the remaining points to optimize for total damage.
      // i.e. optimizing for fire damage will not spend points on str after faith is capped.
      if (damageTypeToOptimizeFor !== "total") {
        optimalAttackScores = getMaxAttackPower(
          damageAttributes.map((attr) => dmg.attackPower[attr].map((d) => d.total || 0)),
          damageAttributes.map((attr) => [
            Math.max(
              sa[`${attr}.Min`],
              weapon.requirements[attr] ?? 0,
              optimalAttackScores.highestAttributes[attr], // Starting from at least the amount available
            ),
            sa[`${attr}.Max`],
          ]),
          Math.max(endAdjustedSpendable, 0),
        );
      }

      // Calculate Spell Power
      let spellPower: OptimalAttributeForAttackType | undefined;
      if (weapon.sorceryTool || weapon.incantationTool) {
        const optimalSpellScores = getMaxAttackPower(
          damageAttributes.map((attr) =>
            dmg.spellPower[attr].map((d) => d[damageTypeToOptimizeFor] || 0),
          ),
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

      const optimalDamageSplit = allDamageTypes.reduce((damageTypeAcc, damageType) => {
        const baseDamageForType = dmg.base[damageType] || 0;
        const scaledDamageForType = Object.entries(dmg.attackPower).reduce(
          (damageOfTypeForAllAttrs, [attr, values]) => {
            const optimalAttributeLevel =
              optimalAttackScores.highestAttributes[attr as DamageAttribute];
            const damageForAttribute = values[optimalAttributeLevel][damageType] || 0;
            return damageOfTypeForAllAttrs + damageForAttribute;
          },
          0,
        );
        damageTypeAcc[damageType] = baseDamageForType + scaledDamageForType;
        return damageTypeAcc;
      }, {} as Record<AttackPowerType, number>);

      const optimalDamage =
        damageTypeToOptimizeFor === "total"
          ? optimalAttackScores.maxValue + dmg.base.total
          : sumObjectValues(optimalDamageSplit);

      const maxDamage = sumObjectValues(
        getWeaponAttack({
          weapon,
          attributes: {
            str: 99,
            dex: 99,
            int: 99,
            fai: 99,
            arc: 99,
          },
          upgradeLevel: normalizedUpgradeLevel,
          twoHanding,
        }).attackPower,
      );
      return {
        attackPower: {
          optimalDamage,
          optimalDamageSplit,
          optimalAttributes: optimalAttackScores.highestAttributes,
          disposablePoints:
            endAdjustedSpendable - sumObjectValues(optimalAttackScores.highestAttributes),
          efficiencyScore: Math.round((100 * optimalDamage) / maxDamage),
        },
        spellPower,
        endurance: {
          total: adjustEnduranceForWeapon ? enduranceWithWeapon : sa.end,
          incremental: incrementalEndurance,
        },
        incrementalDamagePerAttribute: dmg,
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
      damageTypeToOptimizeFor,
    ],
  );

  const calculateOptimalAttributesForWeapons = useCallback(
    async (weapons: Weapon[], reset?: boolean) => {
      if (reset) setOptimalAttributes({});
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
        setOptimalAttributes((prev) => ({ ...prev, ...update }));
        await wait(10);
      }
    },
    [calculateHighestWeaponAttackResult, setOptimalAttributes],
  );

  useEffect(() => {
    // TODO: Debounce this so that can't be changed in quick succession
    const weaponsChanged = weaponsMemo.current !== weapons;
    if (weaponsChanged) {
      // Only recalculate the new weapons
      const newWeapons = diffArraysByKey(
        weaponsMemo.current as Weapon[],
        weapons as Weapon[],
        "name",
      );
      weaponsMemo.current = weapons;
      calculateOptimalAttributesForWeapons(newWeapons);
    } else {
      // An input into the calulations has changed, and we must calculate all again
      calculateOptimalAttributesForWeapons(weapons as Weapon[], true);
    }
  }, [weapons, calculateOptimalAttributesForWeapons]);

  return { optimalAttributes };
};
