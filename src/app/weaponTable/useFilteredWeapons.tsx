import { useDeferredValue, useMemo } from "react";
import type { Weapon } from "../../calculator/weapon";
import { useAppStateContext } from "../AppStateProvider";
import { allWeaponTypes } from "../uiUtils";
import filterWeapons from "../../search/filterWeapons";
import type { RegulationVersion } from "../regulationVersions";

const useFilteredWeapons = (weapons: Weapon[], regulationVersion: RegulationVersion): Weapon[] => {
  const appState = useAppStateContext();
  const attributes = useDeferredValue(appState.attributes);
  const twoHanding = useDeferredValue(appState.twoHanding);
  const weaponTypes = useDeferredValue(appState.weaponTypes);
  const affinityIds = useDeferredValue(appState.affinityIds);
  const effectiveOnly = useDeferredValue(appState.effectiveOnly);
  const includeDLC = useDeferredValue(appState.includeDLC);
  const selectedWeapons = useDeferredValue(appState.selectedWeapons);

  // Determine which weapon types can never be given an affinity. It's convenient for them to
  // show up under both "Standard" and "Unique" filtering options
  const uninfusableWeaponTypes = useMemo(() => {
    const tmp = new Set(allWeaponTypes);
    for (const weapon of weapons) {
      if (weapon.affinityId !== 0 && weapon.affinityId !== -1) {
        tmp.delete(weapon.weaponType);
      }
    }
    return tmp;
  }, [weapons]);

  return useMemo(
    () =>
      filterWeapons(weapons, {
        weaponTypes: new Set(
          weaponTypes.filter((weaponType) => allWeaponTypes.includes(weaponType)),
        ),
        affinityIds: new Set(
          affinityIds.filter((affinityId) => regulationVersion.affinityOptions.has(affinityId)),
        ),
        effectiveWithAttributes: effectiveOnly ? attributes : undefined,
        includeDLC,
        twoHanding,
        uninfusableWeaponTypes,
        weaponNames: new Set(selectedWeapons.map((weapon) => weapon.value)),
      }),
    [
      weapons,
      weaponTypes,
      affinityIds,
      attributes,
      effectiveOnly,
      includeDLC,
      twoHanding,
      uninfusableWeaponTypes,
      regulationVersion.affinityOptions,
      selectedWeapons,
    ],
  );
};

export default useFilteredWeapons;
