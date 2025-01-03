import { useReducer } from "react";
import type { AttributeSolverValues } from "../../calculator/attributes";
import type { Weapon } from "../../calculator/weapon";
import type { SortBy } from "../../search/sortWeapons";
import { INITIAL_CLASS_VALUES } from "../ClassPicker";
import type { DamageTypeToOptimizeFor } from "../OptimizedDamageTypePicker";
import type { OptimalAttribute } from "../weaponTable/OptimalAttributeTable/useOptimalAttributes";
import { defaultStartingClass, type ActionMap } from "./useAppState";
import { type RollType } from "../RollTypePicker";

/* Custom actions - Start */
// It's not convenient to have all actions that are expressed automatically by replacing the state with the same type
type AttributePatchUpdate = {
  type: "setSolverAttributes";
  payload: Partial<AttributeSolverValues>;
};
type OptimalAttributeReset = {
  type: "setOptimalAttributes";
  payload: null;
};
/* Custom actions - End */

export type SolvedAttributeAction =
  | ActionMap<SolvedAttributeState>[keyof ActionMap<SolvedAttributeState>]
  | AttributePatchUpdate
  | OptimalAttributeReset;

// SolvedAttributeState - Values that only impact the solver view
export interface SolvedAttributeState {
  readonly solverAttributes: AttributeSolverValues;
  readonly adjustEnduranceForWeapon: boolean;
  readonly optimalAttributes: Partial<Record<Weapon["name"], OptimalAttribute>>;
  readonly rollType: RollType;
  readonly armorWeight: number;
  readonly damageTypeToOptimizeFor: DamageTypeToOptimizeFor;
  readonly sortBy: SortBy; // Move this to locale state for the table rendered.
  readonly reverse: boolean; // Move this to locale state for the table rendered.
}

export function solvedAttributeStateReducer(
  state: SolvedAttributeState,
  action: SolvedAttributeAction,
): SolvedAttributeState {
  switch (action.type) {
    case "setArmorWeight":
      return { ...state, armorWeight: action.payload };
    case "setDamageTypeToOptimizeFor":
      return { ...state, damageTypeToOptimizeFor: action.payload };
    case "setAdjustEnduranceForWeapon":
      return { ...state, adjustEnduranceForWeapon: action.payload };
    case "setRollType":
      return { ...state, rollType: action.payload };
    case "setOptimalAttributes":
      if (action.payload === null) return { ...state, optimalAttributes: {} }; // Reset Action
      return { ...state, optimalAttributes: { ...state.optimalAttributes, ...action.payload } };
    case "setSolverAttributes":
      return { ...state, solverAttributes: { ...state.solverAttributes, ...action.payload } };
    default:
      return state;
  }
}

const initialState: SolvedAttributeState = {
  solverAttributes: {
    [`str.Min`]: INITIAL_CLASS_VALUES[defaultStartingClass].str,
    [`str.Max`]: 99,
    [`dex.Min`]: INITIAL_CLASS_VALUES[defaultStartingClass].dex,
    [`dex.Max`]: 99,
    [`int.Min`]: INITIAL_CLASS_VALUES[defaultStartingClass].int,
    [`int.Max`]: 99,
    [`fai.Min`]: INITIAL_CLASS_VALUES[defaultStartingClass].fai,
    [`fai.Max`]: 99,
    [`arc.Min`]: INITIAL_CLASS_VALUES[defaultStartingClass].arc,
    [`arc.Max`]: 99,
    end: INITIAL_CLASS_VALUES[defaultStartingClass].end,
    min: INITIAL_CLASS_VALUES[defaultStartingClass].min,
    vig: INITIAL_CLASS_VALUES[defaultStartingClass].vig,
    lvl: INITIAL_CLASS_VALUES[defaultStartingClass].lvl,
  },
  sortBy: "totalAttack",
  reverse: false,
  optimalAttributes: {},
  adjustEnduranceForWeapon: false,
  rollType: "medium",
  armorWeight: 34,
  damageTypeToOptimizeFor: "total",
};

export function useSolvedAttributeState() {
  const [state, dispatch] = useReducer(solvedAttributeStateReducer, initialState);

  return { state, dispatch };
}
