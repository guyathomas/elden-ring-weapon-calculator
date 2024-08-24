import { allDamageTypes, AttackPowerType } from "./attackPowerTypes";
import type { DamageAttribute } from "./attributes";
import { adjustStrengthForTwoHanding } from "./calculator";
import type { Weapon } from "./weapon";

export type DamageTypeScaling = Partial<Record<AttackPowerType, number>>;
const damageTypeScaling: DamageTypeScaling = {};
type Attribute = "str" | "dex" | "int" | "fai" | "arc";

const createReturnValue = ({ base }: { base: DamageTypeScaling }): DamageScalingReturnValue => ({
  base,
  attackPower: {
    str: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    dex: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    int: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    fai: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    arc: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
  },
  spellScaling: {
    str: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    dex: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    int: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    fai: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
    arc: Array.from({ length: 150 }, () => ({ ...damageTypeScaling })),
  },
});

type DamageScalingPerAttribute = Record<Attribute, DamageTypeScaling[]>;
type DamageScalingReturnValue = {
  base: DamageTypeScaling;
  attackPower: DamageScalingPerAttribute;
  spellScaling: DamageScalingPerAttribute;
};

function calculateFinalScaling({
  attributeCorrect,
  attributeScaling,
  baseAttributeScaling,
  calcCorrectGraphValue,
}: {
  attributeCorrect: number | true;
  attributeScaling: number;
  baseAttributeScaling: number;
  calcCorrectGraphValue: number;
}): number {
  let scaling;
  if (attributeCorrect === true) {
    scaling = attributeScaling ?? 0;
  } else {
    scaling = (attributeCorrect * (attributeScaling ?? 0)) / (baseAttributeScaling ?? 0);
  }
  return scaling * calcCorrectGraphValue;
}

export function createDamageScalingPerAttribute(
  weapon: Weapon,
  weaponUpgradeLevel: number,
): {
  base: DamageTypeScaling;
  attackPower: DamageScalingPerAttribute;
  spellScaling: DamageScalingPerAttribute;
} {
  const base = weapon.attack[weaponUpgradeLevel]; // {0: 73.84, 1: 62.400000000000006, 8: 73}
  const returnValue = createReturnValue({ base });

  for (const damageType of allDamageTypes) {
    if (!base[damageType]) continue; // Does not have that damage type

    const calcCorrectGraphForDamageType = weapon.calcCorrectGraphs[damageType]; // [1: 0, 2: 0.008344518906935003, 3: 0.01917067028327579, 4: 0.031185076135726773, ...]
    const scalingPairsForDamageType = Object.entries(
      weapon.attributeScaling[weaponUpgradeLevel],
    ).filter(
      ([attribute]) => weapon.attackElementCorrect[damageType]?.[attribute as Attribute],
    ) as [Attribute, number][];
    for (const [attribute, attributeScaling] of scalingPairsForDamageType) {
      const attributeCorrect = weapon.attackElementCorrect[damageType]?.[attribute];
      if (!attributeCorrect) continue;
      const attributeScalingArray = returnValue.attackPower[attribute];
      for (let i = 0; i < attributeScalingArray.length; i++) {
        const finalScaling = calculateFinalScaling({
          attributeCorrect,
          attributeScaling,
          baseAttributeScaling: weapon.attributeScaling[0][attribute] || 0,
          calcCorrectGraphValue: calcCorrectGraphForDamageType[i],
        });

        returnValue.attackPower[attribute][i][damageType] = base[damageType] * (finalScaling || 0);
        if (weapon.sorceryTool || weapon.incantationTool) {
          returnValue.spellScaling[attribute][i][damageType] = 100 * finalScaling;
        }
      }
    }
  }
  return returnValue;
}
const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

type IncrementalTotalAndSourceDamage = { total: number } & Partial<DamageTypeScaling>;

export type IncrementalDamagePerAttribute = {
  base: IncrementalTotalAndSourceDamage;
  attackPower: Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>;
  spellPower: Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>;
};

export function getIncrementalDamagePerAttribute(
  weapon: Weapon,
  weaponUpgradeLevel: number,
  twoHanding: boolean,
): IncrementalDamagePerAttribute {
  const damageScalingPerAttribute = createDamageScalingPerAttribute(weapon, weaponUpgradeLevel);
  const attackPower = Object.entries(damageScalingPerAttribute.attackPower).reduce(
    (acc, [attribute, damageScaling]) => {
      if (attribute === "str" && Array.isArray(damageScaling) && twoHanding) {
        acc[attribute as Attribute] = damageScaling.map((v, i) => {
          // Scaling values don't exist for 148 onwards and onwards, so this is equivalent to just stopping at 148
          const adjustedStrength = Math.min(
            148,
            adjustStrengthForTwoHanding({ weapon, twoHanding, str: i }),
          );

          return {
            total: sumObjectValues(damageScaling[adjustedStrength]),
            ...damageScaling[adjustedStrength],
          };
        });
      } else if (Array.isArray(damageScaling)) {
        acc[attribute as Attribute] = damageScaling.map((v) => ({
          total: sumObjectValues(v) || 0,
          ...v,
        }));
      }
      return acc;
    },
    {} as IncrementalDamagePerAttribute["attackPower"],
  );
  const spellPower = Object.entries(damageScalingPerAttribute.spellScaling).reduce(
    (acc, [attribute, damageScaling]) => {
      acc[attribute as Attribute] = damageScaling.map((v) => ({
        total: v["0"] || 0,
      })); // Only applies scaling off this attackType
      return acc;
    },
    {} as IncrementalDamagePerAttribute["spellPower"],
  );
  const base = Object.entries(damageScalingPerAttribute.base).reduce(
    (acc, [damageType, damage]) => {
      const attackPowerType = parseInt(damageType) as AttackPowerType;
      const isDamageType = allDamageTypes.includes(attackPowerType);
      if (isDamageType) {
        acc.total += damage;
        acc[attackPowerType] = damage;
      }
      return acc;
    },
    { total: 0 } as IncrementalTotalAndSourceDamage,
  );

  return {
    base,
    attackPower,
    spellPower,
  };
}
