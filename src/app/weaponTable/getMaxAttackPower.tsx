import { type DamageAttribute, type DamageAttributeValues } from "../../calculator/calculator";

type MaxAttackPower = { maxValue: number; highestAttributes: DamageAttributeValues };
export type AttributeRange = [number, number];

export function getMaxAttackPower(
  attackPowers: Map<DamageAttribute, number[]>,
  ranges: Map<DamageAttribute, AttributeRange>,
  spendablePoints: number,
): MaxAttackPower {
  const rangeArray = [...ranges.entries()]
  const numArrays = rangeArray.length;

  const minAttributes = rangeArray.reduce((acc, [attr, range]) => {
    acc[attr] = range[0];
    return acc;
  }, {} as DamageAttributeValues)

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
  for (let attrId = 1; attrId < numArrays; attrId++) {
    const [attrName, [minIndex, maxIndex]]: [DamageAttribute, [number,number]] = rangeArray[attrId - 1];
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
        const attackPowerForThisAttr = attackPowers.get(attrName)?.[attrPts] || 0;
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
