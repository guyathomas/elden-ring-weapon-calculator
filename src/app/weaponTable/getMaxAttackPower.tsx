import { damageAttributes, type DamageAttributeValues } from "../../calculator/calculator";

type MaxAttackPower = { maxValue: number; highestAttributes: DamageAttributeValues };
// TODO: I could optimize this to be less opinionated about the attrName = damageAttributes
// and just use indicies so it's a more generalized solution
export function getMaxAttackPower(
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
