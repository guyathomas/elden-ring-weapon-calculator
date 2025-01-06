import { type DamageAttributeValues, damageAttributes } from "../attributes";
import {
  createDamageScalingPerAttribute,
  getIncrementalDamagePerAttribute,
} from "../newCalculator";
import getWeaponAttack from "../calculator";
import { TEST_WEAPONS } from "./mocks";

const sumObjectValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((acc, v) => acc + v, 0);

describe("createDamageScalingPerAttribute", () => {
  TEST_WEAPONS.forEach(({ weapon, upgradeLevel, weaponClass }) => {
    describe(`with a level ${upgradeLevel} ${weapon.name} (${weaponClass} weapon)`, () => {
      it("calculates damage scaling correctly", () => {
        const result = createDamageScalingPerAttribute(weapon, upgradeLevel);
        expect(result).toMatchSnapshot();
      });
    });
  });
});

describe("getIncrementalDamagePerAttribute", () => {
  TEST_WEAPONS.forEach(({ weapon, upgradeLevel, weaponClass }) => {
    describe(`with a level ${upgradeLevel} ${weapon.name} (${weaponClass} weapon)`, () => {
      it("calculates incremental damage correctly without two-handing", () => {
        const result = getIncrementalDamagePerAttribute(weapon, upgradeLevel, false);
        expect(result).toMatchSnapshot();
      });

      it("calculates incremental damage correctly with two-handing", () => {
        const result = getIncrementalDamagePerAttribute(weapon, upgradeLevel, true);
        expect(result).toMatchSnapshot();
      });

      describe("should return the same value for both calculators", () => {
        const TWO_HANDING = false;
        const ATTRIBUTE_COMBINATIONS: DamageAttributeValues[] = [
          {
            str: 14,
            dex: 13,
            int: 9,
            fai: 9,
            arc: 7,
          },
        ];

        const dmg = getIncrementalDamagePerAttribute(weapon, upgradeLevel, TWO_HANDING);
        ATTRIBUTE_COMBINATIONS.forEach((attributes) => {
          it(`should return the same value for both calculators for attributes: ${JSON.stringify(attributes)}`, () => {
            const newDamage = damageAttributes.reduce(
              (acc, attribute) => acc + dmg.attackPower[attribute][attributes[attribute]].total,
              dmg.base.total,
            );

            const oldDamage = sumObjectValues(
              getWeaponAttack({
                weapon,
                attributes,
                upgradeLevel,
                twoHanding: TWO_HANDING,
                disableTwoHandingAttackPowerBonus: false,
                ineffectiveAttributePenalty: 0.4,
              }).attackPower,
            );

            expect(Math.floor(newDamage)).toEqual(Math.floor(oldDamage));
          });
        });
      });
    });
  });
});
