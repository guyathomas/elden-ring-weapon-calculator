import { useDeferredValue, useMemo } from "react";
import type { Weapon } from "../../calculator/weapon";
import { type AppState } from "../useAppState";
import { allWeaponTypes } from "../uiUtils";
import filterWeapons from "../../search/filterWeapons";
import type { RegulationVersion } from "../regulationVersions";

const useFilteredWeapons = (
  weapons: Weapon[],
  regulationVersion: RegulationVersion,
  filterValues: {
    attributes: AppState["attributes"];
    twoHanding: AppState["twoHanding"];
    weaponTypes: AppState["weaponTypes"];
    affinityIds: AppState["affinityIds"];
    effectiveOnly: AppState["effectiveOnly"];
    includeDLC: AppState["includeDLC"];
    selectedWeapons: AppState["selectedWeapons"];
  },
): readonly Weapon[] => {
  const attributes = useDeferredValue(filterValues.attributes);
  const twoHanding = useDeferredValue(filterValues.twoHanding);
  const weaponTypes = useDeferredValue(filterValues.weaponTypes);
  const affinityIds = useDeferredValue(filterValues.affinityIds);
  const effectiveOnly = useDeferredValue(filterValues.effectiveOnly);
  const includeDLC = useDeferredValue(filterValues.includeDLC);
  const selectedWeapons = useDeferredValue(filterValues.selectedWeapons);
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
        selectedWeapons: new Set(selectedWeapons.map((weapon) => weapon.value)),
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
