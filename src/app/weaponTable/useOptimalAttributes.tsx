import { useCallback, useEffect } from "react";
import {
  damageAttributes,
  type AttributeSolverValues,
  type DamageAttributeValues,
} from "../../calculator/calculator";
import type { Weapon } from "../../calculator/weapon";
import { useAppStateContext } from "../AppStateProvider";
import { INITIAL_CLASS_VALUES, type StartingClass } from "../ClassPicker";
import { ENDURANCE_LEVEL_TO_EQUIP_LOAD } from "./constants";
import { getIncrementalDamagePerAttribute } from "../../calculator/newCalculator";
import { getNormalizedUpgradeLevel } from "../uiUtils";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface OptimalAttribute {
  highestWeaponAttackResult: number;
  highestAttributes: DamageAttributeValues;
  disposablePoints: number;
}

function getIncrementalEndurance(weaponWeight: number, initialEndurance: number) {
  const ROLL_TYPE_MULTIPIER = 0.7; // Hardcode medium roll for now.
  const currentEquipLoad = ENDURANCE_LEVEL_TO_EQUIP_LOAD[initialEndurance];
  const requiredEquipLoad = weaponWeight / ROLL_TYPE_MULTIPIER + currentEquipLoad;
  const requiredEndurance = ENDURANCE_LEVEL_TO_EQUIP_LOAD.findIndex((c) => c > requiredEquipLoad);
  return requiredEndurance - initialEndurance;
}
type MaxAttackPower = { maxValue: number; highestAttributes: DamageAttributeValues };

function getMaxAttackPower(
  attackPowers: number[][], // Provide in the order of "str", "dex", "int", "fai", "arc"
  ranges: number[][],
  spendablePoints: number,
): MaxAttackPower {
  const numArrays = attackPowers.length;
  const minAttributes: DamageAttributeValues = {
    str: ranges[0][0],
    dex: ranges[1][0],
    int: ranges[2][0],
    fai: ranges[3][0],
    arc: ranges[4][0],
  };

  // Create a DP table to store max values and indices
  const dp: MaxAttackPower[][] = [];
  for (let i = 0; i <= numArrays; i++) {
    dp[i] = [];
    for (let j = 0; j <= spendablePoints; j++) {
      dp[i][j] = {
        maxValue: 0,
        highestAttributes: { ...minAttributes },
      };
    }
  }
  let absoluteMin = 0;
  for (let attrId = 1; attrId <= numArrays; attrId++) {
    const attrName = damageAttributes[attrId - 1];
    const [minIndex, maxIndex] = ranges[attrId - 1];
    absoluteMin += minIndex;
    for (let pts = absoluteMin; pts <= spendablePoints; pts++) {
      const minPointsUsedBeforeThisAttribute = absoluteMin - minIndex;

      for (
        let attrPts = minIndex;
        attrPts <= maxIndex && attrPts <= pts - minPointsUsedBeforeThisAttribute;
        attrPts++
      ) {
        const remainingPts = pts - attrPts;
        const lastDP = dp[attrId - 1][remainingPts]; // The current record for the remaining points
        const previousValue = lastDP.maxValue; // 5.12
        const attackPowerForThisAttr = attackPowers[attrId - 1][attrPts];
        const currentValue = previousValue + attackPowerForThisAttr;

        if (currentValue > dp[attrId][pts].maxValue) {
          dp[attrId][pts] = {
            maxValue: currentValue,
            highestAttributes: {
              ...lastDP.highestAttributes,
              [attrName]: attrPts,
            },
          };
        }
      }
    }
  }
  return dp[numArrays][spendablePoints];
}

export const useOptimalAttributes = ({
  weapons,
  solverAttributes: sa,
  twoHanding,
  upgradeLevel: regularUpgradeLevel,
  startingClass,
  weaponAdjustedEndurance,
}: {
  weapons: Weapon[];
  solverAttributes: AttributeSolverValues;
  twoHanding: boolean;
  upgradeLevel: number;
  startingClass: StartingClass;
  weaponAdjustedEndurance: boolean;
}) => {
  const { setOptimalAttributeForWeapon } = useAppStateContext();
  const calculateHighestWeaponAttackResult = useCallback(
    function (weapon: Weapon): Promise<OptimalAttribute> {
      return new Promise((resolve) => {
        const normalizedUpgradeLevel = getNormalizedUpgradeLevel(weapon, regularUpgradeLevel);
        // This value includes the value of the points that are unable to be moved, i.e. 14 pts in str
        const SPENDABLE =
          INITIAL_CLASS_VALUES[startingClass].total -
          INITIAL_CLASS_VALUES[startingClass].lvl +
          sa.lvl -
          sa.min -
          sa.vig -
          sa.end -
          (weaponAdjustedEndurance ? getIncrementalEndurance(weapon.weight ?? 0, sa.end) : 0);

        const dmg = getIncrementalDamagePerAttribute(weapon, normalizedUpgradeLevel, twoHanding);
        const optimalAttributes = getMaxAttackPower(
          [dmg.str, dmg.dex, dmg.int, dmg.fai, dmg.arc],
          [
            [Math.max(sa["str.Min"], weapon.requirements.str ?? 0), sa["str.Max"]],
            [Math.max(sa["dex.Min"], weapon.requirements.dex ?? 0), sa["dex.Max"]],
            [Math.max(sa["int.Min"], weapon.requirements.int ?? 0), sa["int.Max"]],
            [Math.max(sa["fai.Min"], weapon.requirements.fai ?? 0), sa["fai.Max"]],
            [Math.max(sa["arc.Min"], weapon.requirements.arc ?? 0), sa["arc.Max"]],
          ],
          SPENDABLE,
        );
        const spentPoints = Object.values(optimalAttributes.highestAttributes).reduce(
          (acc, val) => acc + val,
          0,
        );
        resolve({
          highestWeaponAttackResult: optimalAttributes.maxValue + dmg.base,
          highestAttributes: optimalAttributes.highestAttributes,
          // TODO: Remove me - Temporarily putting this here for easy comparison
          disposablePoints: SPENDABLE - spentPoints,
        });
      });
    },
    [sa, startingClass, weaponAdjustedEndurance, regularUpgradeLevel, twoHanding],
  );

  useEffect(() => {
    setOptimalAttributeForWeapon("");
    (async () => {
      for (const weapon of weapons) {
        const result = await calculateHighestWeaponAttackResult(weapon);
        setOptimalAttributeForWeapon(weapon.name, result);
        await wait(10);
      }
    })();
  }, [calculateHighestWeaponAttackResult, weapons, setOptimalAttributeForWeapon]);
};

// const scaledUpgradeLevel =
//   weapon.attack.length - 1 === regulationVersion.maxUpgradeLevel
//     ? 10
//     : Math.min(upgradeLevel, weapon.attack.length - 1);
// const scalingValues = weapon.attributeScaling[scaledUpgradeLevel];
// const minS = Math.max(sa["str.Min"], weapon.requirements.str || 0);
// const maxS = scalingValues.str ? Math.min(SPENDABLE, sa["str.Max"], 99) : minS;
// for (let s = minS; s <= maxS; s++) {
//   const minD = Math.max(sa["dex.Min"], weapon.requirements.dex || 0);
//   const maxD = scalingValues.dex ? Math.min(SPENDABLE - s, sa["dex.Max"], 99) : minD;
//   for (let d = minD; d <= maxD; d++) {
//     const minI = Math.max(sa["int.Min"], weapon.requirements.int || 0);
//     const maxI = scalingValues.int ? Math.min(SPENDABLE - s - d, sa["int.Max"], 99) : minI;
//     for (let i = minI; i <= maxI; i++) {
//       const minF = Math.max(sa["fai.Min"], weapon.requirements.fai || 0);
//       const maxF = scalingValues.fai
//         ? Math.min(SPENDABLE - s - d - i, sa["fai.Max"], 99)
//         : minF;
//       for (let f = minF; f <= maxF; f++) {
//         const minA = Math.max(sa["arc.Min"], weapon.requirements.arc || 0);
//         const maxA = scalingValues.arc
//           ? Math.min(SPENDABLE - s - d - i - f, sa["arc.Max"], 99)
//           : minA;
//         for (let a = minA; a <= maxA; a++) {
//           const pointSum = s + d + i + f + a;
//           if (pointSum === SPENDABLE || [s + d + i + f + a].includes(99)) {
//             const weaponAttackResult = getWeaponAttack({
//               weapon,
//               attributes: {
//                 str: s,
//                 dex: d,
//                 int: i,
//                 fai: f,
//                 arc: a,
//               },
//               twoHanding,
//               upgradeLevel: scaledUpgradeLevel,
//               disableTwoHandingAttackPowerBonus:
//                 regulationVersion.disableTwoHandingAttackPowerBonus,
//               ineffectiveAttributePenalty: regulationVersion.ineffectiveAttributePenalty,
//             });

//             const totalAR = Object.entries(weaponAttackResult.attackPower).reduce(
//               (acc, [damageType, value]) =>
//                 allDamageTypes.includes(parseInt(damageType) as AttackPowerType)
//                   ? acc + value
//                   : acc,
//               0,
//             );
//             if (totalAR > highestWeaponAttackResult) {
//               highestWeaponAttackResult = totalAR;
//               highestAttributes = {
//                 str: scalingValues.str ? s : 0,
//                 dex: scalingValues.dex ? d : 0,
//                 int: scalingValues.int ? i : 0,
//                 fai: scalingValues.fai ? f : 0,
//                 arc: scalingValues.arc ? a : 0,
//               };
//             }
//           }
//         }
//       }
//     }
//   }
// }
