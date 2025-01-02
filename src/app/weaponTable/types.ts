import type { ReactNode } from "react";
import type { SystemStyleObject } from "@mui/system";
import type { Theme } from "@mui/material";
import type { Weapon } from "../../calculator/weapon";

export interface DefaultWeaponTableRowData {
  weapon: Weapon;
  upgradeLevel: number;
  twoHanding: boolean;
}

export type RowExpandedState = {
  isExpanded: boolean;
  toggleIsExpanded: () => void;
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
  render(row: T, rowExpandedState: RowExpandedState): ReactNode;
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}

export interface WeaponTableColumnGroupDef<T = DefaultWeaponTableRowData> {
  key: string;
  header?: string;
  columns: WeaponTableColumnDef<T>[];
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}
