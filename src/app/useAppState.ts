import { useEffect, useMemo, useState, useRef } from "react";
import isEqual from "lodash/isEqual";
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
import { type OptimalAttribute } from "./weaponTable/useOptimalAttributes";
import { INITIAL_CLASS_VALUES, type StartingClass } from "./ClassPicker";
import type { RollType } from "./weaponTable/constants";
import type { WeaponOption } from "./WeaponPicker";
import type { DamageTypeToOptimizeFor } from "./OptimizedDamageTypePicker";

export interface AppState {
  // AppState - Values that impact the entire app
  readonly regulationVersionName: RegulationVersionName;
  // readonly menuOpen: boolean; // TODO: Move useMenuState here

  // TableFilterState - Values that impact which items are shown in the table. This state is shared between tables.
  readonly weaponTypes: readonly WeaponType[];
  readonly affinityIds: readonly number[];
  readonly includeDLC: boolean;
  readonly effectiveOnly: boolean;
  readonly selectedWeapons: WeaponOption[];

  // CalulatorState - Values that impact the output of the calculator
  readonly twoHanding: boolean;
  readonly upgradeLevel: number;
  readonly groupWeaponTypes: boolean;
  readonly startingClass: StartingClass;
  // readonly sortBy: SortBy; // Move this to locale state for the table rendered.
  // readonly reverse: boolean; // Move this to locale state for the table rendered.

  // FixedAttributeState - Values that only impact the calculator view
  readonly splitDamage: boolean;
  readonly attributes: DamageAttributeValues;
  readonly numericalScaling: boolean;
  readonly sortBy: SortBy; // Move this to locale state for the table rendered.
  readonly reverse: boolean; // Move this to locale state for the table rendered.

  // SolvedAttributeState - Values that only impact the solver view
  readonly solverAttributes: AttributeSolverValues;
  readonly adjustEnduranceForWeapon: boolean;
  readonly optimalAttributes: Partial<Record<Weapon["name"], OptimalAttribute>>;
  readonly rollType: RollType;
  readonly armorWeight: number;
  readonly damageTypeToOptimizeFor: DamageTypeToOptimizeFor;
}

export interface UpdateAppState extends AppState {
  setRegulationVersionName(regulationVersionName: RegulationVersionName): void;
  setAttribute(attribute: DamageAttribute, value: number): void;
  setAttributeSolver(attribute: AttributeSolverKey, value: number): void;
  setTwoHanding(twoHanding: boolean): void;
  setUpgradeLevel(upgradeLevel: number): void;
  setWeaponTypes(weaponTypes: readonly WeaponType[]): void;
  setAffinityIds(affinityIds: readonly number[]): void;
  setIncludeDLC(includeDLC: boolean): void;
  setWeaponAdjustedEndurance(adjustEnduranceForWeapon: boolean): void;
  setEffectiveOnly(effectiveOnly: boolean): void;
  setSplitDamage(splitDamage: boolean): void;
  setGroupWeaponTypes(groupWeaponTypes: boolean): void;
  setNumericalScaling(numericalScaling: boolean): void;
  setSortBy(sortBy: SortBy): void;
  setReverse(reverse: boolean): void;
  // Update the optimal attributes for a weapon or '' for weaponName to clear the optimal attribute for all weapons
  setOptimalAttributesForWeapon(
    optimalAttributeUpdates?: Record<Weapon["name"], OptimalAttribute>,
  ): void;
  setStartingClass(startingClass: StartingClass): void;
  setRollType(rollType: RollType): void;
  setArmorWeight(armorWeight: number): void;
  setSelectedWeapons(weapons: WeaponOption[]): void;
  setDamageTypeToOptimizeFor(damageType: DamageTypeToOptimizeFor): void;
}

const startingClass: StartingClass = "Vagabond";

const defaultAppState: AppState = {
  regulationVersionName: "latest",
  startingClass,
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
  adjustEnduranceForWeapon: false,
  rollType: "medium",
  armorWeight: 34,
  selectedWeapons: [],
  damageTypeToOptimizeFor: "total",
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

const useUpdateLocalStorage = (appState: AppState) => {
  const previousProps = useRef<AppState>(appState);

  useEffect(() => {
    if (previousProps.current) {
      const allowUpdate = isEqual(
        previousProps.current.optimalAttributes,
        appState.optimalAttributes,
      );
      // Don't allow updates when optimalAttributes changes, since this will be high frequency and we don't want to store in localStorage anyway.
      if (allowUpdate) {
        const { optimalAttributes, ...fieldsToSave } = appState;
        onAppStateChanged({
          ...fieldsToSave,
          optimalAttributes: defaultAppState.optimalAttributes,
        });
      }
    }

    previousProps.current = appState;
  }, [appState]);
};

/**
 * Manages all of the user selectable filters and display options, and saves/loads them in
 * localStorage for use on future page loads
 */
export function useAppState() {
  const [appState, setAppState] = useState<AppState>(() => getInitialAppState());

  useEffect(() => {
    updateUrl(appState.regulationVersionName);
  }, [appState.regulationVersionName]);

  useUpdateLocalStorage(appState);

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
      setOptimalAttributesForWeapon(updates) {
        if (updates) {
          setAppState((prevAppState) => ({
            ...prevAppState,
            optimalAttributes: {
              ...prevAppState.optimalAttributes,
              ...updates,
            },
          }));
        } else {
          setAppState((prevAppState) => ({
            ...prevAppState,
            optimalAttributes: {},
          }));
        }
      },
      setStartingClass(startingClass) {
        setAppState((prevAppState) => ({ ...prevAppState, startingClass }));
      },
      setWeaponAdjustedEndurance(adjustEnduranceForWeapon) {
        setAppState((prevAppState) => ({ ...prevAppState, adjustEnduranceForWeapon }));
      },
      setRollType(rollType) {
        setAppState((prevAppState) => ({ ...prevAppState, rollType }));
      },
      setArmorWeight(armorWeight) {
        setAppState((prevAppState) => ({ ...prevAppState, armorWeight }));
      },
      setSelectedWeapons(selectedWeapons) {
        setAppState((prevAppState) => ({ ...prevAppState, selectedWeapons }));
      },
      setDamageTypeToOptimizeFor(damageTypeToOptimizeFor) {
        setAppState((prevAppState) => ({ ...prevAppState, damageTypeToOptimizeFor }));
      },
    }),
    [],
  );

  return useMemo(() => ({ ...appState, ...changeHandlers }), [appState, changeHandlers]);
}
