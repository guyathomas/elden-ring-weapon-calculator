import { useCallback, useEffect } from "react";
import getWeaponAttack, {
  allDamageTypes,
  AttackPowerType,
  type AttributeSolverValues,
  type DamageAttributeValues,
} from "../../calculator/calculator";
import type { Weapon } from "../../calculator/weapon";
import type { RegulationVersion } from "../regulationVersions";
import { useAppStateContext } from "../AppStateProvider";
import { INITIAL_CLASS_VALUES, type StartingClass } from "../ClassPicker";
import { ENDURANCE_LEVEL_TO_EQUIP_LOAD } from "./constants";
import { getIncrementalDamagePerAttribute } from "../../calculator/newCalculator";

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

function getMaxAttackPower(
  attackPowers: number[][],
  ranges: number[][],
  spendablePoints: number,
): { maxValue: number; indices: number[] } {
  const numArrays = attackPowers.length;

  // Create a DP table to store max values and indices
  const dp: { maxValue: number; indices: number[] }[][] = [];
  for (let i = 0; i <= numArrays; i++) {
    dp[i] = [];
    for (let j = 0; j <= spendablePoints; j++) {
      dp[i][j] = { maxValue: 0, indices: [] };
    }
  }

  // Base case: No arrays to choose from, max value is 0
  dp[0][0] = { maxValue: 0, indices: [] };

  for (let i = 1; i <= numArrays; i++) {
    const [minIndex, maxIndex] = ranges[i - 1];
    for (let j = 0; j <= spendablePoints; j++) {
      for (let k = minIndex; k <= maxIndex && k <= j; k++) {
        const lastDP = dp[i - 1][j - k];
        const previousValue = lastDP.maxValue;
        const currentValue = previousValue + attackPowers[i - 1][k];

        if (currentValue > dp[i][j].maxValue) {
          dp[i][j] = {
            maxValue: currentValue,
            indices: [...lastDP.indices, k],
          };
        }
      }
    }
  }
  return dp[numArrays][spendablePoints];
}

export const useOptimalAttributes = ({
  weapons,
  regulationVersion,
  solverAttributes: sa,
  twoHanding,
  upgradeLevel,
  startingClass,
  weaponAdjustedEndurance,
}: {
  weapons: Weapon[];
  regulationVersion: RegulationVersion;
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
        let highestWeaponAttackResult = 0;
        let highestAttributes: DamageAttributeValues = {
          str: 0,
          dex: 0,
          int: 0,
          fai: 0,
          arc: 0,
        };
        let disposablePoints = 0;
        // This doesn't include the points allocated to the damage attributes.
        // If the damage attributes sum is higher, then no solution will be found
        const SPENDABLE =
          INITIAL_CLASS_VALUES[startingClass].total -
          INITIAL_CLASS_VALUES[startingClass].lvl +
          sa.lvl -
          sa.min -
          sa.vig -
          sa.end -
          (weaponAdjustedEndurance ? getIncrementalEndurance(weapon.weight ?? 0, sa.end) : 0);
        const scaledUpgradeLevel =
          weapon.attack.length - 1 === regulationVersion.maxUpgradeLevel
            ? 10
            : Math.min(upgradeLevel, weapon.attack.length - 1);
        const scalingValues = weapon.attributeScaling[scaledUpgradeLevel];
        const minS = Math.max(sa["str.Min"], weapon.requirements.str || 0);
        const maxS = scalingValues.str ? Math.min(SPENDABLE, sa["str.Max"], 99) : minS;
        for (let s = minS; s <= maxS; s++) {
          const minD = Math.max(sa["dex.Min"], weapon.requirements.dex || 0);
          const maxD = scalingValues.dex ? Math.min(SPENDABLE - s, sa["dex.Max"], 99) : minD;
          for (let d = minD; d <= maxD; d++) {
            const minI = Math.max(sa["int.Min"], weapon.requirements.int || 0);
            const maxI = scalingValues.int ? Math.min(SPENDABLE - s - d, sa["int.Max"], 99) : minI;
            for (let i = minI; i <= maxI; i++) {
              const minF = Math.max(sa["fai.Min"], weapon.requirements.fai || 0);
              const maxF = scalingValues.fai
                ? Math.min(SPENDABLE - s - d - i, sa["fai.Max"], 99)
                : minF;
              for (let f = minF; f <= maxF; f++) {
                const minA = Math.max(sa["arc.Min"], weapon.requirements.arc || 0);
                const maxA = scalingValues.arc
                  ? Math.min(SPENDABLE - s - d - i - f, sa["arc.Max"], 99)
                  : minA;
                for (let a = minA; a <= maxA; a++) {
                  const pointSum = s + d + i + f + a;
                  if (pointSum === SPENDABLE || [s + d + i + f + a].includes(99)) {
                    const weaponAttackResult = getWeaponAttack({
                      weapon,
                      attributes: {
                        str: s,
                        dex: d,
                        int: i,
                        fai: f,
                        arc: a,
                      },
                      twoHanding,
                      upgradeLevel: scaledUpgradeLevel,
                      disableTwoHandingAttackPowerBonus:
                        regulationVersion.disableTwoHandingAttackPowerBonus,
                      ineffectiveAttributePenalty: regulationVersion.ineffectiveAttributePenalty,
                    });

                    const totalAR = Object.entries(weaponAttackResult.attackPower).reduce(
                      (acc, [damageType, value]) =>
                        allDamageTypes.includes(parseInt(damageType) as AttackPowerType)
                          ? acc + value
                          : acc,
                      0,
                    );
                    if (totalAR > highestWeaponAttackResult) {
                      highestWeaponAttackResult = totalAR;
                      highestAttributes = {
                        str: scalingValues.str ? s : 0,
                        dex: scalingValues.dex ? d : 0,
                        int: scalingValues.int ? i : 0,
                        fai: scalingValues.fai ? f : 0,
                        arc: scalingValues.arc ? a : 0,
                      };
                      disposablePoints =
                        SPENDABLE -
                        Math.max(minS, highestAttributes.str) -
                        Math.max(minD, highestAttributes.dex) -
                        Math.max(minI, highestAttributes.int) -
                        Math.max(minF, highestAttributes.fai) -
                        Math.max(minA, highestAttributes.arc);
                    }
                  }
                }
              }
            }
          }
        }
        const dmg = getIncrementalDamagePerAttribute(weapon, upgradeLevel);
        const optimalAttributes = getMaxAttackPower(
          [dmg.str, dmg.dex, dmg.int, dmg.fai, dmg.arc],
          [
            [sa["str.Min"], sa["str.Max"]],
            [sa["dex.Min"], sa["dex.Max"]],
            [sa["int.Min"], sa["int.Max"]],
            [sa["fai.Min"], sa["fai.Max"]],
            [sa["arc.Min"], sa["arc.Max"]],
          ],
          SPENDABLE,
        );

        resolve({
          highestWeaponAttackResult,
          highestAttributes,
          // TODO: Remove me - Temporarily putting this here for easy comparison
          disposablePoints: optimalAttributes.maxValue,
        });
      });
    },
    [upgradeLevel, regulationVersion, sa, twoHanding, startingClass, weaponAdjustedEndurance],
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
