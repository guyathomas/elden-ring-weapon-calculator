import { useCallback, useEffect } from "react";
import {
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

export function getEnduranceForWeight(weight: number, rollType: RollType) {
  const rollTypeMultiplier = rollTypeToMultiplier[rollType]; // Hardcode medium roll for now.
  const targetCarryCapacity = weight / rollTypeMultiplier;
  return ENDURANCE_LEVEL_TO_EQUIP_LOAD.findIndex((c) => c >= targetCarryCapacity) + 1;
}

function getIncrementalEndurance(
  weaponWeight: number,
  initialEndurance: number,
  rollType: RollType,
) {
  const rollTypeMultiplier = rollTypeToMultiplier[rollType]; // Hardcode medium roll for now.
  const currentEquipLoad = ENDURANCE_LEVEL_TO_EQUIP_LOAD[initialEndurance];
  const requiredEquipLoad = weaponWeight / rollTypeMultiplier + currentEquipLoad;
  const requiredEndurance =
    ENDURANCE_LEVEL_TO_EQUIP_LOAD.findIndex((c) => c > requiredEquipLoad) + 1;
  return requiredEndurance - initialEndurance;
}

const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

export const useOptimalAttributes = ({
  weapons,
  solverAttributes: sa,
  twoHanding,
  upgradeLevel: regularUpgradeLevel,
  startingClass,
  weaponAdjustedEndurance,
  rollType,
}: {
  weapons: Weapon[];
  solverAttributes: AttributeSolverValues;
  twoHanding: boolean;
  upgradeLevel: number;
  startingClass: StartingClass;
  weaponAdjustedEndurance: boolean;
  rollType: RollType;
}) => {
  const { setOptimalAttributesForWeapon: setOptimalAttributeForWeapon, armorWeight } =
    useAppStateContext();
  const calculateHighestWeaponAttackResult = useCallback(
    function (weapon: Weapon): Promise<OptimalAttribute> {
      return new Promise((resolve) => {
        const normalizedUpgradeLevel = getNormalizedUpgradeLevel(weapon, regularUpgradeLevel);
        const incrementalEndurance = getIncrementalEndurance(weapon.weight ?? 0, sa.end, rollType);
        // This value includes the value of the points that are unable to be moved, i.e. 14 pts in str
        const SPENDABLE =
          INITIAL_CLASS_VALUES[startingClass].total -
          INITIAL_CLASS_VALUES[startingClass].lvl +
          sa.lvl -
          sa.min -
          sa.vig -
          sa.end -
          (weaponAdjustedEndurance ? incrementalEndurance : 0);

        const dmg = getIncrementalDamagePerAttribute(weapon, normalizedUpgradeLevel, twoHanding);
        const optimalAttackScores = getMaxAttackPower(
          [
            dmg.attackPower.str,
            dmg.attackPower.dex,
            dmg.attackPower.int,
            dmg.attackPower.fai,
            dmg.attackPower.arc,
          ],
          [
            [Math.max(sa["str.Min"], weapon.requirements.str ?? 0), sa["str.Max"]],
            [Math.max(sa["dex.Min"], weapon.requirements.dex ?? 0), sa["dex.Max"]],
            [Math.max(sa["int.Min"], weapon.requirements.int ?? 0), sa["int.Max"]],
            [Math.max(sa["fai.Min"], weapon.requirements.fai ?? 0), sa["fai.Max"]],
            [Math.max(sa["arc.Min"], weapon.requirements.arc ?? 0), sa["arc.Max"]],
          ],
          Math.max(SPENDABLE, 0),
        );
        const isCatalyst = Boolean(weapon.sorceryTool || weapon.incantationTool);
        const optimalSpellScores = isCatalyst
          ? getMaxAttackPower(
              [
                dmg.spellPower.str,
                dmg.spellPower.dex,
                dmg.spellPower.int,
                dmg.spellPower.fai,
                dmg.spellPower.arc,
              ],
              [
                [Math.max(sa["str.Min"], weapon.requirements.str ?? 0), sa["str.Max"]],
                [Math.max(sa["dex.Min"], weapon.requirements.dex ?? 0), sa["dex.Max"]],
                [Math.max(sa["int.Min"], weapon.requirements.int ?? 0), sa["int.Max"]],
                [Math.max(sa["fai.Min"], weapon.requirements.fai ?? 0), sa["fai.Max"]],
                [Math.max(sa["arc.Min"], weapon.requirements.arc ?? 0), sa["arc.Max"]],
              ],
              Math.max(SPENDABLE, 0),
            )
          : null;
        const spellPower =
          isCatalyst && optimalSpellScores
            ? ({
                optimalAttributes: optimalSpellScores.highestAttributes,
                optimalDamage: optimalSpellScores.maxValue + 100,
                disposablePoints: SPENDABLE - sumObjectValues(optimalSpellScores.highestAttributes),
              } as OptimalAttributeForAttackType)
            : undefined;
        resolve({
          attackPower: {
            optimalDamage: optimalAttackScores.maxValue + dmg.base,
            optimalAttributes: optimalAttackScores.highestAttributes,
            disposablePoints: SPENDABLE - sumObjectValues(optimalAttackScores.highestAttributes),
          },
          spellPower,
          endurance: {
            total: getEnduranceForWeight(armorWeight + weapon?.weight ?? 0, rollType),
            incremental: incrementalEndurance,
          },
        });
      });
    },
    [
      sa,
      startingClass,
      weaponAdjustedEndurance,
      regularUpgradeLevel,
      twoHanding,
      rollType,
      armorWeight,
    ],
  );

  useEffect(() => {
    setOptimalAttributeForWeapon();
    (async () => {
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < weapons.length; i += batchSize) {
        batches.push(weapons.slice(i, i + batchSize));
      }

      // Process each batch in series
      for (const batch of batches) {
        const optimalAttributesForBatch = await Promise.all(
          batch.map(calculateHighestWeaponAttackResult),
        );
        const update = optimalAttributesForBatch.reduce((acc, optimalAttribute, i) => {
          acc[batch[i].name] = optimalAttribute;
          return acc;
        }, {} as Record<Weapon["name"], OptimalAttribute>);
        setOptimalAttributeForWeapon(update);
        await wait(10);
      }
    })();
  }, [calculateHighestWeaponAttackResult, weapons, setOptimalAttributeForWeapon]);
};
