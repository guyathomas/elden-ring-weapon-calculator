import type { ReactNode } from "react";
import type { SystemStyleObject } from "@mui/system";
import type { Theme } from "@mui/material";
import type { Weapon } from "../../calculator/weapon";
import type { DamageAttributeValues } from "../../calculator/attributes";
import type { DamageTypeToOptimizeFor } from "../OptimizedDamageTypePicker";
import type { RowDetailType } from "./WeaponTableBase";

export interface DefaultWeaponTableRowData {
  weapon: Weapon;
  upgradeLevel: number;
  twoHanding: boolean;
  attributeMarkers?: DamageAttributeValues;
  damageTypeToOptimizeFor: DamageTypeToOptimizeFor;
}

export type RowActions = {
  rowDetailType: RowDetailType | null;
  toggleRowDetailType: (rowDetailType: RowDetailType) => void;
  onCopyAttributes?: (attributes: DamageAttributeValues) => void;
};

export interface WeaponTableRowGroup<T = DefaultWeaponTableRowData> {
  key: string;
  name?: string;
  rows: T[];
}

export interface WeaponTableColumnDef<T = DefaultWeaponTableRowData> {
  key: string;
  sortBy?: any; // TODO: Fix this.
  header: ReactNode;
  render(row: T, actions: RowActions): ReactNode;
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}

export interface WeaponTableColumnGroupDef<T = DefaultWeaponTableRowData> {
  key: string;
  header?: string;
  columns: WeaponTableColumnDef<T>[];
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}
