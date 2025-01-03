import {
  createDamageScalingPerAttribute,
  getIncrementalDamagePerAttribute,
} from "../newCalculator";
import { TEST_WEAPONS } from "./mocks";

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
    });
  });
});
