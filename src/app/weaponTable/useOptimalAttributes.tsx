import { useCallback, useEffect } from "react";
import {
  type AttributeSolverValues,
  type DamageAttributeValues,
} from "../../calculator/calculator";
import type { Weapon } from "../../calculator/weapon";
import { useAppStateContext } from "../AppStateProvider";
import { INITIAL_CLASS_VALUES, type StartingClass } from "../ClassPicker";
import { ENDURANCE_LEVEL_TO_EQUIP_LOAD } from "./constants";
import { getIncrementalDamagePerAttribute } from "../../calculator/newCalculator";
import { getNormalizedUpgradeLevel } from "../uiUtils";
import { getMaxAttackPower } from "./getMaxAttackPower";

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
