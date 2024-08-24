import React, { memo, type ReactNode, Suspense, useMemo, useState } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Box, CircularProgress, FormControlLabel, Switch, Typography } from "@mui/material";
import { type SystemStyleObject, type Theme } from "@mui/system";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { AttackPowerType, type Weapon, type WeaponAttackResult } from "../../calculator/calculator";
import type { SortBy } from "../../search/sortWeapons";
import getWeaponTableColumns from "./getWeaponTableColumns";
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
import type { OptimalAttribute } from "./useOptimalAttributes";
import { useAppStateContext } from "../AppStateProvider";
import type { DamageTypeToOptimizeFor } from "../OptimizedDamageTypePicker";
import OptimizedDamageTypePicker from "../OptimizedDamageTypePicker";
import type { SliceTooltip } from "@nivo/line";

const ResponsiveLine = React.lazy(() =>
  import("@nivo/line").then((module) => ({ default: module.ResponsiveLine })),
);

export type WeaponTableRowData = [Weapon, WeaponAttackResult, OptimalAttribute];

export interface WeaponTableRowGroup {
  key: string;
  name?: string;
  rows: readonly WeaponTableRowData[];
}

export interface WeaponTableColumnDef {
  key: string;
  sortBy?: SortBy;
  header: ReactNode;
  render(row: WeaponTableRowData, collapsibleProps: CollapsibleProps): ReactNode;
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}

export interface WeaponTableColumnGroupDef {
  key: string;
  header?: string;
  columns: readonly WeaponTableColumnDef[];
  sx?: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}

interface Props {
  rowGroups: readonly WeaponTableRowGroup[];
  placeholder?: ReactNode;
  total: number;
  footer?: ReactNode;
  sortBy: SortBy;
  reverse: boolean;

  /**
   * If true, include columns for each individual damage type as well as total attack power
   */
  splitDamage: boolean;

  /**
   * If true, include columns for each individual damage type for Spell Scaling
   */
  splitSpellScaling: boolean;

  /**
   * If true, show scaling as integers instead of S/A/B/C/D/E ranks
   */
  numericalScaling: boolean;

  /**
   * Attack power types that must be included as columns in the table
   */
  attackPowerTypes: ReadonlySet<AttackPowerType>;

  /**
   * Include spell scaling columns in the table
   */
  spellScaling: boolean;

  onSortByChanged(sortBy: SortBy): void;
  onReverseChanged(reverse: boolean): void;
}

/**
 * The row in the weapon table containing headers for each column
 */
const ColumnHeaderRow = memo(function ColumnHeaderRow({
  columnGroups,
  sortBy,
  reverse,
  onSortByChanged,
  onReverseChanged,
}: {
  columnGroups: readonly WeaponTableColumnGroupDef[];
  sortBy: SortBy;
  reverse: boolean;
  onSortByChanged(sortBy: SortBy): void;
  onReverseChanged(reverse: boolean): void;
}) {
  const onColumnClicked = (column: WeaponTableColumnDef) => {
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
      {columnGroups.map(({ key, sx, columns }) => (
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

export interface CollapsibleProps {
  isExpanded: boolean;
  toggleIsExpanded: () => void;
}

/**
 * A row in the weapon table containing a single weapon
 */
const DataRow = memo(function DataRow({
  columnGroups,
  row,
}: {
  columnGroups: readonly WeaponTableColumnGroupDef[];
  row: WeaponTableRowData;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [damageTypeToOptimizeFor, setDamageTypeToOptimizeFor] =
    useState<DamageTypeToOptimizeFor>("total");
  const [chartType, setChartType] = useState<"incremental" | "cumulative">("incremental");
  const toggleIsExpanded = React.useCallback(() => setIsExpanded((prev) => !prev), []);
  const incrementalDamagePerAttribute = row[2].incrementalDamagePerAttribute;
  const baseDamage = Math.round(incrementalDamagePerAttribute.base[damageTypeToOptimizeFor] ?? 0);

  const lineData = useMemo(() => {
    if (!isExpanded) return [];
    if (chartType === "cumulative") {
      const basePoints = {
        id: "base",
        data: new Array(150).fill(true).map((_, i) => ({ x: i, y: baseDamage })),
      };
      const attributeScaling = Object.entries(incrementalDamagePerAttribute.attackPower).map(
        ([attr, values]) => ({
          id: attr,
          data: values.map((v, i) => ({
            x: i + 1,
            y: (v?.[damageTypeToOptimizeFor] || 0).toFixed(2),
          })),
        }),
      );
      return [...attributeScaling, basePoints];
    } else {
      return Object.entries(incrementalDamagePerAttribute.attackPower).map(([attr, values]) => ({
        id: attr,
        data: values.map((v, i, arr) => ({
          x: i,
          y: (
            Math.max(
              0,
              (v?.[damageTypeToOptimizeFor] || 0) - (arr[i - 1]?.[damageTypeToOptimizeFor] || 0),
            ) || 0
          ).toFixed(2),
        })),
      }));
    }
  }, [isExpanded, incrementalDamagePerAttribute, chartType, damageTypeToOptimizeFor, baseDamage]);
  const yGrids = useMemo(() => {
    const gridNumbers = [];
    const maxValue = Object.values(lineData).reduce(
      (acc, { data }) => Math.max(acc, ...data.map(({ y }) => parseFloat(y))),
      0,
    );
    const intervalSize = chartType === "cumulative" ? 100 : 2;
    const numberOfLines = Math.ceil(maxValue / intervalSize);
    for (let i = 0; i < numberOfLines; i++) {
      gridNumbers.push(i * intervalSize);
    }
    return gridNumbers;
  }, [chartType, lineData]);

  return (
    <>
      <WeaponTableDataRow role="row">
        {columnGroups.map(({ key, sx, columns }) => (
          <WeaponTableColumnGroup key={key} sx={sx}>
            {columns.map((column) => (
              <WeaponTableColumn key={column.key} role="cell" sx={column.sx}>
                {column.render(row, { isExpanded, toggleIsExpanded })}
              </WeaponTableColumn>
            ))}
          </WeaponTableColumnGroup>
        ))}
      </WeaponTableDataRow>
      {isExpanded && (
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
          <Box style={{ height: 300 }}>
            <Box
              sx={{
                marginTop: 1,
                marginLeft: 1,
                position: "absolute",
                zIndex: 1,
                display: "flex",
                width: 400,
              }}
            >
              <FormControlLabel
                sx={{ flexShrink: 0 }}
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
              <Box sx={{ flex: 1 }}>
                <OptimizedDamageTypePicker
                  optimizedDamageType={damageTypeToOptimizeFor}
                  onOptimizedDamageTypeChanged={setDamageTypeToOptimizeFor}
                />
              </Box>
            </Box>
            <ResponsiveLine
              data={lineData}
              theme={{
                text: {
                  fill: "#fff",
                },
                tooltip: {
                  container: {
                    background: "#333",
                  },
                },
                crosshair: {
                  line: {
                    stroke: "#fff",
                  },
                },
              }}
              yScale={{
                min: 0,
                max: "auto",
                type: "linear",
              }}
              margin={{ top: 60, right: 20, bottom: 40, left: 50 }}
              gridXValues={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140]}
              gridYValues={yGrids}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickValues: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140],
                legendPosition: "start",
              }}
              axisLeft={{
                tickValues: yGrids,
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "count",
                legendOffset: -40,
                legendPosition: "middle",
                truncateTickAt: 0,
              }}
              legends={[
                {
                  anchor: "top",
                  direction: "row",
                  translateY: -40,
                  itemWidth: 60,
                  itemHeight: 20,
                  symbolShape: "circle",
                  symbolBorderColor: "rgba(0, 0, 0, .5)",
                },
              ]}
              enablePoints={false}
              enableSlices="x"
              enableCrosshair
              enableTouchCrosshair={true}
              animate={false}
              sliceTooltip={CustomTooltip}
            />
          </Box>
        </Suspense>
      )}
    </>
  );
});

const CustomTooltip: SliceTooltip = ({ slice }: Parameters<SliceTooltip>[0]) => {
  const tdStyle = {
    padding: "3px 5px",
  };

  const spanStyle = (color: string) => ({
    display: "block",
    width: "12px",
    height: "12px",
    background: color,
    marginRight: "7px",
  });
  return (
    <div
      style={{
        background: "#333",
        color: "inherit",
        fontSize: "inherit",
        borderRadius: "2px",
        boxShadow: "rgba(0, 0, 0, 0.25) 0px 1px 2px",
        padding: "5px 9px",
      }}
    >
      <div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td style={tdStyle}>Level</td>
              <td style={tdStyle}>
                <span style={{ fontWeight: "bold" }}>{slice.points[0].data.xFormatted}</span>
              </td>
            </tr>
            {slice.points.map(({ id, data: { yFormatted }, color, serieId }) => (
              <tr key={id}>
                <td style={tdStyle}>
                  <span style={spanStyle(color)}></span>
                </td>
                <td style={tdStyle}>{serieId}</td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: "bold" }}>{yFormatted}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function WeaponTable({
  rowGroups,
  placeholder,
  footer,
  sortBy,
  reverse,
  splitDamage,
  splitSpellScaling,
  numericalScaling,
  attackPowerTypes,
  spellScaling,
  total,
  onSortByChanged,
  onReverseChanged,
}: Props) {
  const { optimalAttributes, adjustEnduranceForWeapon } = useAppStateContext();

  const optimalAttributesPercentageComplete = useMemo(
    () => Math.floor((100 * Object.values(optimalAttributes).length) / total) || 100,
    [optimalAttributes, total],
  );

  const columnGroups = useMemo(
    () =>
      getWeaponTableColumns({
        splitDamage,
        splitSpellScaling,
        numericalScaling,
        attackPowerTypes,
        spellScaling,
        optimalAttributesPercentageComplete,
        showEndurance: adjustEnduranceForWeapon,
      }),
    [
      splitDamage,
      splitSpellScaling,
      numericalScaling,
      attackPowerTypes,
      spellScaling,
      optimalAttributesPercentageComplete,
      adjustEnduranceForWeapon,
    ],
  );

  return (
    <ScrollArea.Root asChild>
      <WeaponTableBody role="table">
        <ScrollArea.Viewport>
          <WeaponTableColumnGroupHeaderRow role="row">
            {columnGroups.map(({ key, sx, header }) => (
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
            columnGroups={columnGroups}
            sortBy={sortBy}
            reverse={reverse}
            onSortByChanged={onSortByChanged}
            onReverseChanged={onReverseChanged}
          />
          {rowGroups.length > 0 ? (
            rowGroups.map(({ key, name, rows }) => (
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
                    key={`${row[0].weaponName},${row[0].affinityId}`}
                    columnGroups={columnGroups}
                    row={row}
                  />
                ))}
              </WeaponTableGroup>
            ))
          ) : (
            <Box display="grid" sx={{ minHeight: "480px", px: "10px", gap: 3 }}>
              {placeholder}
            </Box>
          )}
          {footer != null && (
            <Box display="grid" sx={{ minHeight: "36px", px: "10px" }}>
              {footer}
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

export default memo(WeaponTable);
