import React, { memo } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import {
  Scrollbar,
  ScrollbarThumb,
  WeaponTableBody,
  WeaponTableColumn,
  WeaponTableColumnGroup,
  WeaponTableColumnGroupHeaderRow,
  WeaponTableColumnHeaderRow,
  WeaponTableDataRow,
  WeaponTableGroup,
  WeaponTableGroupHeaderRow,
} from "./tableStyledComponents";
import type {
  WeaponTableRowGroup,
  DefaultWeaponTableRowData,
  WeaponTableColumnDef,
  WeaponTableColumnGroupDef,
} from "./types";

interface Props<S> {
  rows: readonly WeaponTableRowGroup[];
  columns: readonly WeaponTableColumnGroupDef[];
  sortBy: S;
  reverse: boolean;
  onSortByChanged(sortBy: S): void;
  onReverseChanged(reverse: boolean): void;
  isWeaponsLoading: boolean;
  errorWeapons?: Error;
  total: number;
  limit: number;
}

/**
 * The row in the weapon table containing headers for each column
 */
const ColumnHeaderRow = memo(function ColumnHeaderRow<S>({
  columns,
  sortBy,
  reverse,
  onSortByChanged,
  onReverseChanged,
}: {
  columns: readonly WeaponTableColumnGroupDef[];
  sortBy: S;
  reverse: boolean;
  onSortByChanged(sortBy: S): void;
  onReverseChanged(reverse: boolean): void;
}) {
  type TableColumn = WeaponTableColumnDef;
  const onColumnClicked = (column: TableColumn) => {
    if (column.sortBy) {
      if (column.sortBy === sortBy) {
        onReverseChanged(!reverse);
      } else {
        onSortByChanged(column.sortBy);
        onReverseChanged(false);
      }
    }
  };

  return (
    <WeaponTableColumnHeaderRow role="row">
      {columns.map(({ key, sx, columns }) => (
        <WeaponTableColumnGroup key={key} sx={sx}>
          {columns.map((column) => (
            <Box
              key={column.key}
              display="grid"
              sx={[
                {
                  flex: "1 1 0",
                  gridTemplateRows: "24px 1fr",
                  alignItems: "start",
                  justifyContent: "center",
                  borderRadius: "9999px",
                  position: "relative",
                  pt: 1,
                },
                column.sortBy
                  ? {
                      cursor: "pointer",
                      userSelect: "none",
                      ":hover": { backgroundColor: "rgba(245, 189, 99, 0.08)" },
                    }
                  : {},
                column.sx ?? {},
              ]}
              tabIndex={0}
              role="columnheader"
              aria-sort={
                column.sortBy === sortBy ? (reverse ? "ascending" : "descending") : undefined
              }
              onClick={column.sortBy ? () => onColumnClicked(column) : undefined}
              onKeyDown={
                column.sortBy
                  ? (evt) => {
                      if (evt.key === " " || evt.key === "Enter") {
                        onColumnClicked(column);
                        evt.preventDefault();
                      }
                    }
                  : undefined
              }
            >
              {column.header}
              {column.sortBy === sortBy &&
                (reverse ? (
                  <ArrowDropUpIcon sx={{ justifySelf: "center" }} fontSize="small" />
                ) : (
                  <ArrowDropDownIcon sx={{ justifySelf: "center" }} fontSize="small" />
                ))}
            </Box>
          ))}
        </WeaponTableColumnGroup>
      ))}
    </WeaponTableColumnHeaderRow>
  );
});

/**
 * A row in the weapon table containing a single weapon
 */
const DataRow = memo(function DataRow({
  columns,
  row,
}: {
  columns: readonly WeaponTableColumnGroupDef[];
  row: DefaultWeaponTableRowData;
}) {
  return (
    <WeaponTableDataRow role="row">
      {columns.map(({ key, sx, columns }) => (
        <WeaponTableColumnGroup key={key} sx={sx}>
          {columns.map((column) => (
            <WeaponTableColumn key={column.key} role="cell" sx={column.sx}>
              {column.render(row)}
            </WeaponTableColumn>
          ))}
        </WeaponTableColumnGroup>
      ))}
    </WeaponTableDataRow>
  );
});

function WeaponTableBase<S>({
  rows,
  columns,
  sortBy,
  reverse,
  onSortByChanged,
  onReverseChanged,
  isWeaponsLoading,
  errorWeapons,
  total,
  limit,
}: Props<S>): React.ReactElement {
  if (errorWeapons) {
    return (
      <Alert severity="error" sx={{ my: 3 }}>
        Oops, something went wrong loading weapons ({errorWeapons.message})
      </Alert>
    );
  }
  return (
    <ScrollArea.Root asChild>
      <WeaponTableBody role="table">
        <ScrollArea.Viewport>
          <WeaponTableColumnGroupHeaderRow role="row">
            {columns.map(({ key, sx, header }) => (
              <WeaponTableColumnGroup
                key={key}
                sx={[sx ?? {}, { alignItems: "center", justifyContent: "center" }]}
              >
                {header && (
                  <Typography component="span" variant="subtitle2" role="columnheader">
                    {header}
                  </Typography>
                )}
              </WeaponTableColumnGroup>
            ))}
          </WeaponTableColumnGroupHeaderRow>

          <ColumnHeaderRow
            columns={columns}
            sortBy={sortBy}
            reverse={reverse}
            onSortByChanged={onSortByChanged}
            onReverseChanged={onReverseChanged}
          />
          {rows.length > 0 ? (
            rows.map(({ key, name, rows }) => (
              <WeaponTableGroup key={key} role="rowgroup">
                {name != null && (
                  <WeaponTableGroupHeaderRow role="row">
                    <Typography component="span" variant="subtitle2" role="columnheader">
                      {name}
                    </Typography>
                  </WeaponTableGroupHeaderRow>
                )}

                {rows.map((row) => (
                  <DataRow
                    key={`${row.weapon.weaponName},${row.weapon.affinityId},${
                      row.weapon.variant ?? ""
                    }`}
                    columns={columns}
                    row={row}
                  />
                ))}
              </WeaponTableGroup>
            ))
          ) : (
            <Box display="grid" sx={{ minHeight: "480px", px: "10px", gap: 3 }}>
              {isWeaponsLoading ? (
                <>
                  <Typography variant="body1" align="center" sx={{ alignSelf: "end" }}>
                    Loading weapon data
                  </Typography>
                  <Box display="grid" sx={{ alignSelf: "start", justifyContent: "center" }}>
                    <CircularProgress />
                  </Box>
                </>
              ) : (
                <Typography variant="body1" align="center" sx={{ alignSelf: "center" }}>
                  No weapons match your selections
                </Typography>
              )}
            </Box>
          )}
          {total > limit && (
            <Box display="grid" sx={{ minHeight: "36px", px: "10px" }}>
              <Typography variant="body1" align="center" sx={{ alignSelf: "center" }}>
                {total} weapons match your selections - showing the first {limit}
              </Typography>
            </Box>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar asChild orientation="horizontal">
          <Scrollbar>
            <ScrollArea.Thumb asChild>
              <ScrollbarThumb />
            </ScrollArea.Thumb>
          </Scrollbar>
        </ScrollArea.Scrollbar>
      </WeaponTableBody>
    </ScrollArea.Root>
  );
}

export default WeaponTableBase;
