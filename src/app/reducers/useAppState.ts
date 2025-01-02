import { useEffect, useReducer } from "react";
import { WeaponType } from "../../calculator/calculator";

import type { RegulationVersionName } from "../regulationVersions";
import regulationVersions from "../regulationVersions";
import { dlcWeaponTypes } from "../uiUtils";
import { type StartingClass } from "../ClassPicker";
import type { WeaponOption } from "../WeaponPicker";

export type ActionMap<T extends object> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: {
    type: `set${Capitalize<string & K>}`;
    payload: T[K];
  };
};

export interface AppState {
  // AppState - Values that impact the entire app
  readonly regulationVersionName: RegulationVersionName;
  // readonly menuOpen: boolean; // TODO: Move useMenuState here
  // Filter State - Values that impact which items are shown in the table. This state is shared between tables.
  readonly weaponTypes: readonly WeaponType[];
  readonly affinityIds: readonly number[];
  readonly includeDLC: boolean;
  readonly effectiveOnly: boolean;
  readonly selectedWeapons: WeaponOption[];
  // Calulator State - Values that impact the output of the calculator
  readonly twoHanding: boolean;
  readonly upgradeLevel: number;
  readonly groupWeaponTypes: boolean;
  readonly startingClass: StartingClass;
}

export type AppStateAction = ActionMap<AppState>[keyof ActionMap<AppState>];

export const defaultStartingClass: StartingClass = "Vagabond";

const defaultAppState: AppState = {
  regulationVersionName: "latest",
  startingClass: defaultStartingClass,
  twoHanding: false,
  upgradeLevel: 25,
  weaponTypes: [WeaponType.AXE],
  affinityIds: [0, -1], // Standard and Special
  includeDLC: true,
  effectiveOnly: false,
  groupWeaponTypes: false,
  selectedWeapons: [],
};

function appStateReducer(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case "setRegulationVersionName":
      return { ...state, regulationVersionName: action.payload };
    // Calculator Modifiers
    case "setTwoHanding":
      return { ...state, twoHanding: action.payload };
    case "setUpgradeLevel":
      return { ...state, upgradeLevel: action.payload };
    // Filters
    case "setSelectedWeapons":
      return { ...state, selectedWeapons: action.payload };
    case "setWeaponTypes":
      return { ...state, weaponTypes: action.payload };
    case "setGroupWeaponTypes":
      return { ...state, groupWeaponTypes: action.payload };
    case "setAffinityIds":
      return { ...state, affinityIds: action.payload };
    case "setIncludeDLC":
      return {
        ...state,
        includeDLC: action.payload,
        weaponTypes: state.weaponTypes.filter((weaponType) => !dlcWeaponTypes.includes(weaponType)),
      };
    case "setEffectiveOnly":
      return { ...state, effectiveOnly: action.payload };
    case "setStartingClass":
      return {
        ...state,
        startingClass: action.payload,
      };
    default:
      return state;
  }
}

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

/**
 * Manages all of the user selectable filters and display options, and saves/loads them in
 * localStorage for use on future page loads
 */
export function useAppState() {
  const [state, dispatch] = useReducer(appStateReducer, getInitialAppState());

  useEffect(() => {
    updateUrl(state.regulationVersionName);
  }, [state.regulationVersionName]);

  useEffect(() => {
    function onPopState() {
      updateUrl(state.regulationVersionName);
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [state.regulationVersionName]);

  useEffect(() => {
    onAppStateChanged(state);
  }, [state]);

  return { state, dispatch };
}
