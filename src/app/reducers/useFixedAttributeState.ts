import { defaultStartingClass, type ActionMap } from "./useAppState";
import type { DamageAttributeValues } from "../../calculator/attributes";
import { INITIAL_CLASS_VALUES } from "../ClassPicker";
import { useReducer } from "react";

// FixedAttributeState - Values that only impact the fixed calculator view
export interface FixedAttributeState {
  readonly splitDamage: boolean;
  readonly attributes: DamageAttributeValues;
  readonly numericalScaling: boolean;
}

/* Custom actions - Start */
// It's not convenient to have all actions that are expressed automatically by replacing the state with the same type
type AttributePatchUpdate = { type: "setAttributes"; payload: Partial<DamageAttributeValues> };
/* Custom actions - End */

export type FixedAttributeAction =
  | ActionMap<FixedAttributeState>[keyof ActionMap<FixedAttributeState>]
  | AttributePatchUpdate;

export function fixedAttributeStateReducer(
  state: FixedAttributeState,
  action: FixedAttributeAction,
): FixedAttributeState {
  switch (action.type) {
    case "setAttributes":
      return { ...state, attributes: { ...state.attributes, ...action.payload } };
    case "setSplitDamage":
      return { ...state, splitDamage: action.payload };
    case "setNumericalScaling":
      return { ...state, numericalScaling: action.payload };
    default:
      return state;
  }
}

const initialState: FixedAttributeState = {
  splitDamage: true,
  attributes: {
    str: INITIAL_CLASS_VALUES[defaultStartingClass].str,
    dex: INITIAL_CLASS_VALUES[defaultStartingClass].dex,
    int: INITIAL_CLASS_VALUES[defaultStartingClass].int,
    fai: INITIAL_CLASS_VALUES[defaultStartingClass].fai,
    arc: INITIAL_CLASS_VALUES[defaultStartingClass].arc,
  },
  numericalScaling: false,
};

export function useFixedAttributeState() {
  const [state, dispatch] = useReducer(fixedAttributeStateReducer, initialState);

  return { state, dispatch };
}
