import { useEffect, useMemo, useState, createContext, useContext } from "react";
import {
  type DamageAttribute,
  type DamageAttributeValues,
  WeaponType,
  type AttributeSolverValues,
  type AttributeSolverKey,
  type Weapon,
} from "../calculator/calculator";
import type { SortBy } from "../search/sortWeapons";
import type { RegulationVersionName } from "./regulationVersions";
import regulationVersions from "./regulationVersions";
import { dlcWeaponTypes } from "./uiUtils";
import type { OptimalAttribute } from "./weaponTable/useOptimalAttributes";
import { INITIAL_CLASS_VALUES, type StartingClass } from "./ClassPicker";

interface AppState {
  readonly regulationVersionName: RegulationVersionName;
  readonly attributes: DamageAttributeValues;
  readonly solverAttributes: AttributeSolverValues;
  readonly twoHanding: boolean;
  readonly weaponAdjustedEndurance: boolean;
  readonly upgradeLevel: number;
  readonly weaponTypes: readonly WeaponType[];
  readonly affinityIds: readonly number[];
  readonly includeDLC: boolean;
  readonly effectiveOnly: boolean;
  readonly splitDamage: boolean;
  readonly groupWeaponTypes: boolean;
  readonly numericalScaling: boolean;
  readonly sortBy: SortBy;
  readonly reverse: boolean;
  readonly optimalAttributes: Record<Weapon["name"], OptimalAttribute>;
  readonly startingClass: StartingClass;
}

interface UpdateAppState extends AppState {
  setRegulationVersionName(regulationVersionName: RegulationVersionName): void;
  setAttribute(attribute: DamageAttribute, value: number): void;
  setAttributeSolver(attribute: AttributeSolverKey, value: number): void;
  setTwoHanding(twoHanding: boolean): void;
  setUpgradeLevel(upgradeLevel: number): void;
  setWeaponTypes(weaponTypes: readonly WeaponType[]): void;
  setAffinityIds(affinityIds: readonly number[]): void;
  setIncludeDLC(includeDLC: boolean): void;
  setWeaponAdjustedEndurance(weaponAdjustedEndurance: boolean): void;
  setEffectiveOnly(effectiveOnly: boolean): void;
  setSplitDamage(splitDamage: boolean): void;
  setGroupWeaponTypes(groupWeaponTypes: boolean): void;
  setNumericalScaling(numericalScaling: boolean): void;
  setSortBy(sortBy: SortBy): void;
  setReverse(reverse: boolean): void;
  // Update the optimal attributes for a weapon or '' for weaponName to clear the optimal attribute for all weapons
  setOptimalAttributeForWeapon(
    weaponName: Weapon["name"],
    optimalAttribute?: OptimalAttribute,
  ): void;
  setStartingClass(startingClass: StartingClass): void;
}

const startingClass: StartingClass = "Vagabond";

const defaultAppState: AppState = {
  regulationVersionName: "latest",
  startingClass: "Vagabond",
  attributes: {
    str: INITIAL_CLASS_VALUES[startingClass].str,
    dex: INITIAL_CLASS_VALUES[startingClass].dex,
    int: INITIAL_CLASS_VALUES[startingClass].int,
    fai: INITIAL_CLASS_VALUES[startingClass].fai,
    arc: INITIAL_CLASS_VALUES[startingClass].arc,
  },
  solverAttributes: {
    [`str.Min`]: INITIAL_CLASS_VALUES[startingClass].str,
    [`str.Max`]: 99,
    [`dex.Min`]: INITIAL_CLASS_VALUES[startingClass].dex,
    [`dex.Max`]: 99,
    [`int.Min`]: INITIAL_CLASS_VALUES[startingClass].int,
    [`int.Max`]: 99,
    [`fai.Min`]: INITIAL_CLASS_VALUES[startingClass].fai,
    [`fai.Max`]: 99,
    [`arc.Min`]: INITIAL_CLASS_VALUES[startingClass].arc,
    [`arc.Max`]: 99,
    end: INITIAL_CLASS_VALUES[startingClass].end,
    min: INITIAL_CLASS_VALUES[startingClass].min,
    vig: INITIAL_CLASS_VALUES[startingClass].vig,
    lvl: INITIAL_CLASS_VALUES[startingClass].lvl,
  },
  twoHanding: false,
  upgradeLevel: 25,
  weaponTypes: [WeaponType.AXE],
  affinityIds: [0, -1], // Standard and Special
  includeDLC: true,
  effectiveOnly: false,
  splitDamage: true,
  groupWeaponTypes: false,
  numericalScaling: false,
  sortBy: "totalAttack",
  reverse: false,
  optimalAttributes: {},
  weaponAdjustedEndurance: false,
};

/**
 * @returns the initial state of the app, restored from localstorage and the URL if available
 */
function getInitialAppState() {
  const appState = { ...defaultAppState };

  try {
    const storedAppState = localStorage.getItem("appState");
    if (storedAppState) {
      Object.assign(appState, JSON.parse(storedAppState));
    }
  } catch {
    /* ignored */
  }

  const regulationVersionName = window.location.pathname.substring(1);
  if (regulationVersionName && regulationVersionName in regulationVersions) {
    appState.regulationVersionName = regulationVersionName as RegulationVersionName;
  }

  return appState;
}

/**
 * Store the state of the app in localstorage and the URL so it can be restored on future visits
 */
function onAppStateChanged(appState: AppState) {
  localStorage.setItem("appState", JSON.stringify(appState));
}

function updateUrl(regulationVersionName: RegulationVersionName) {
  window.history.replaceState(
    null,
    "",
    `/${regulationVersionName === "latest" ? "" : regulationVersionName}`,
  );
}

const AppStateContext = createContext<UpdateAppState>({
  ...defaultAppState,
  setRegulationVersionName: () => undefined,
  setAttribute: () => undefined,
  setAttributeSolver: () => undefined,
  setTwoHanding: () => undefined,
  setUpgradeLevel: () => undefined,
  setWeaponTypes: () => undefined,
  setAffinityIds: () => undefined,
  setIncludeDLC: () => undefined,
  setEffectiveOnly: () => undefined,
  setSplitDamage: () => undefined,
  setGroupWeaponTypes: () => undefined,
  setNumericalScaling: () => undefined,
  setSortBy: () => undefined,
  setReverse: () => undefined,
  setOptimalAttributeForWeapon: () => undefined,
  setStartingClass: () => undefined,
  setWeaponAdjustedEndurance: () => undefined,
});

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const appState = useCreateAppState();
  return <AppStateContext.Provider value={appState}>{children}</AppStateContext.Provider>;
};

export const useAppStateContext = () => useContext(AppStateContext);

/**
 * Manages all of the user selectable filters and display options, and saves/loads them in
 * localStorage for use on future page loads
 */
function useCreateAppState() {
  const [appState, setAppState] = useState<AppState>(() => {
    return getInitialAppState();
  });

  useEffect(() => {
    onAppStateChanged(appState);
    updateUrl(appState.regulationVersionName);
  }, [appState]);

  useEffect(() => {
    function onPopState() {
      updateUrl(appState.regulationVersionName);
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [appState.regulationVersionName]);

  const changeHandlers = useMemo<Omit<UpdateAppState, keyof AppState>>(
    () => ({
      setRegulationVersionName(regulationVersionName) {
        setAppState((prevAppState) => ({ ...prevAppState, regulationVersionName }));
      },
      setAttribute(attribute, value) {
        setAppState((prevAppState) => ({
          ...prevAppState,
          attributes: { ...prevAppState.attributes, [attribute]: value },
        }));
      },
      setAttributeSolver(attribute, value) {
        setAppState((prevAppState) => ({
          ...prevAppState,
          solverAttributes: { ...prevAppState.solverAttributes, [attribute]: value },
        }));
      },
      setTwoHanding(twoHanding) {
        setAppState((prevAppState) => ({ ...prevAppState, twoHanding }));
      },
      setUpgradeLevel(upgradeLevel) {
        setAppState((prevAppState) => ({ ...prevAppState, upgradeLevel }));
      },
      setWeaponTypes(weaponTypes) {
        setAppState((prevAppState) => ({ ...prevAppState, weaponTypes }));
      },
      setAffinityIds(affinityIds) {
        setAppState((prevAppState) => ({ ...prevAppState, affinityIds }));
      },
      setIncludeDLC(includeDLC) {
        setAppState((prevAppState) => ({
          ...prevAppState,
          includeDLC,
          weaponTypes: prevAppState.weaponTypes.filter(
            (weaponType) => !dlcWeaponTypes.includes(weaponType),
          ),
        }));
      },
      setEffectiveOnly(effectiveOnly) {
        setAppState((prevAppState) => ({ ...prevAppState, effectiveOnly }));
      },
      setSplitDamage(splitDamage) {
        setAppState((prevAppState) => ({ ...prevAppState, splitDamage }));
      },
      setGroupWeaponTypes(groupWeaponTypes) {
        setAppState((prevAppState) => ({ ...prevAppState, groupWeaponTypes }));
      },
      setNumericalScaling(numericalScaling) {
        setAppState((prevAppState) => ({ ...prevAppState, numericalScaling }));
      },
      setSortBy(sortBy) {
        setAppState((prevAppState) => ({ ...prevAppState, sortBy }));
      },
      setReverse(reverse) {
        setAppState((prevAppState) => ({ ...prevAppState, reverse }));
      },
      setOptimalAttributeForWeapon(weaponName, optimalAttribute) {
        setAppState((prevAppState) => {
          if (!optimalAttribute) return prevAppState; // Error case, ignore
          const newOptimalAttributes =
            weaponName === "" // When '' explicitly passed for weaponName, clear state
              ? {}
              : {
                  ...prevAppState.optimalAttributes,
                  [weaponName]: optimalAttribute,
                };
          return {
            ...prevAppState,
            optimalAttributes: newOptimalAttributes,
          };
        });
      },
      setStartingClass(startingClass) {
        setAppState((prevAppState) => ({ ...prevAppState, startingClass }));
      },
      setWeaponAdjustedEndurance(weaponAdjustedEndurance) {
        setAppState((prevAppState) => ({ ...prevAppState, weaponAdjustedEndurance }));
      },
    }),
    [],
  );

  return useMemo(() => ({ ...appState, ...changeHandlers }), [appState, changeHandlers]);
}
