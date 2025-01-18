import { useDeferredValue, useMemo } from "react";
import type { Weapon } from "../../calculator/weapon";
import { type AppState } from "../reducers/useAppState";
import { allWeaponTypes } from "../uiUtils";
import filterWeapons from "../../search/filterWeapons";
import type { RegulationVersion } from "../regulationVersions";
import type { WeaponType } from "../../calculator/weaponTypes";
import type { FixedAttributeState } from "../reducers/useFixedAttributeState";

const useFilteredWeapons = (
  weapons: readonly Weapon[],
  regulationVersion: RegulationVersion,
  filterValues: {
    attributes: FixedAttributeState["attributes"];
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
      regulationVersion.affinityOptions,
      selectedWeapons,
    ],
  );
};

export default useFilteredWeapons;
