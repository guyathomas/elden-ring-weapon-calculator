import React, { memo, Profiler, Suspense, useState } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Alert, Box, CircularProgress, FormControlLabel, Switch, Typography } from "@mui/material";
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
import {
  getIncrementalDamagePerAttribute,
  type IncrementalDamagePerAttribute,
} from "../../calculator/newCalculator";
import { type DamageAttributeValues } from "../../calculator/attributes";
import WeaponDamageChart from "./WeaponDamageChart";

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
  onCopyAttributes?: (attributes: DamageAttributeValues) => void;
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
export type RowDetailType = "damage" | "aow";
const DataRow = memo(function DataRow({
  columns,
  rowData,
  onCopyAttributes,
}: {
  columns: readonly WeaponTableColumnGroupDef[];
  rowData: DefaultWeaponTableRowData;
  onCopyAttributes?: (attributes: DamageAttributeValues) => void;
}) {
  const [rowDetailType, setRowDetailType] = useState<RowDetailType | null>(null);
  const [chartType, setChartType] = useState<"incremental" | "cumulative">("incremental");
  const toggleRowDetailType = React.useCallback(
    (newValue: RowDetailType) =>
      setRowDetailType((currentValue) => (newValue === currentValue ? null : newValue)),
    [],
  );
  const incrementalDamagePerAttribute = React.useMemo(
    () =>
      rowDetailType === "damage"
        ? getIncrementalDamagePerAttribute(rowData.weapon, rowData.upgradeLevel, rowData.twoHanding)
        : ({} as IncrementalDamagePerAttribute),
    [rowDetailType],
  );

  return (
    <>
      <WeaponTableDataRow role="row" data-weapon-id={rowData.weapon.id}>
        {columns.map(({ key, sx, columns }) => (
          <WeaponTableColumnGroup key={key} sx={sx}>
            {columns.map((column) => (
              <WeaponTableColumn key={column.key} role="cell" sx={column.sx}>
                {column.render(rowData, { rowDetailType, toggleRowDetailType, onCopyAttributes })}
              </WeaponTableColumn>
            ))}
          </WeaponTableColumnGroup>
        ))}
      </WeaponTableDataRow>
      {rowDetailType === "damage" && (
        <Suspense
          fallback={
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: 300,
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <Box mb={4}>
            <Box height={300}>
              <Box display="flex" alignItems="center" ml={2} mt={1}>
                <Typography>Attack Rating</Typography>
                <FormControlLabel
                  sx={{ flexShrink: 0, ml: 2 }}
                  control={
                    <Switch
                      value={chartType === "cumulative"}
                      onClick={() => {
                        setChartType((oldType) =>
                          oldType === "incremental" ? "cumulative" : "incremental",
                        );
                      }}
                    />
                  }
                  label="Show cumulative"
                />
              </Box>
              <WeaponDamageChart
                chartType={chartType}
                damageTypeToOptimizeFor={rowData.damageTypeToOptimizeFor}
                attributeDamages={incrementalDamagePerAttribute.attackPower}
                attributeValues={rowData.attributeMarkers || {}}
              />
            </Box>
            {incrementalDamagePerAttribute.spellPower && (
              <Box height={300}>
                <Typography mt={5} ml={2}>
                  Spell Rating
                </Typography>
                <WeaponDamageChart
                  chartType={chartType}
                  damageTypeToOptimizeFor={rowData.damageTypeToOptimizeFor}
                  attributeDamages={incrementalDamagePerAttribute.spellPower}
                  attributeValues={rowData.attributeMarkers || {}}
                />
              </Box>
            )}
          </Box>
        </Suspense>
      )}
    </>
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
  onCopyAttributes,
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
                    rowData={row}
                    onCopyAttributes={onCopyAttributes}
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
