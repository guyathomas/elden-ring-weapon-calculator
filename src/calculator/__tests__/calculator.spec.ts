import getWeaponAttack from "../calculator";
import { INITIAL_CLASS_VALUES } from "../../app/ClassPicker";
import { TEST_WEAPONS } from "./mocks";

describe("getWeaponAttack", () => {
  TEST_WEAPONS.forEach(({ weapon, upgradeLevel, weaponClass }) => {
    describe(`with a level ${upgradeLevel} ${weapon.name} (${weaponClass} weapon)`, () => {
      it("calculates attack power correctly with sufficient attributes", () => {
        const result = getWeaponAttack({
          weapon,
          attributes: INITIAL_CLASS_VALUES.Vagabond,
          upgradeLevel,
        });
        expect(result).toMatchSnapshot();
      });
      it("adjusts strength for two-handing correctly", () => {
        const result = getWeaponAttack({
          weapon,
          attributes: INITIAL_CLASS_VALUES.Vagabond,
          upgradeLevel,
          twoHanding: true,
        });
        expect(result).toMatchSnapshot();
      });
    });
  });
});
