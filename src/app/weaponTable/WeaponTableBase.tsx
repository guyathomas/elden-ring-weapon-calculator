import React, { memo, Suspense, useMemo, useState } from "react";
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
import type { SliceTooltip } from "@nivo/line";
import type { DamageTypeToOptimizeFor } from "../OptimizedDamageTypePicker";
import OptimizedDamageTypePicker from "../OptimizedDamageTypePicker";
import { getIncrementalDamagePerAttribute } from "../../calculator/newCalculator";
import { type DamageAttribute, type DamageAttributeValues } from "../../calculator/attributes";

const ResponsiveLine = React.lazy(() =>
  import("@nivo/line").then((module) => ({ default: module.ResponsiveLine })),
);

const LINE_COLOURS: Record<DamageAttribute, string> = {
  // Strength: often depicted with a red or crimson theme
  str: "#C74444",

  // Dexterity: brownish-orange or a lightly earthy tone
  dex: "#C79B4B",

  // Intelligence: shades of blue
  int: "#3776A3",

  // Faith: a bright, golden tone
  fai: "#F2DE8E",

  // Arcane: a mysterious purple/pink
  arc: "#9F5591",
};

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
const DataRow = memo(function DataRow({
  columns,
  rowData,
  onCopyAttributes,
}: {
  columns: readonly WeaponTableColumnGroupDef[];
  rowData: DefaultWeaponTableRowData;
  onCopyAttributes?: (attributes: DamageAttributeValues) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [damageTypeToOptimizeFor, setDamageTypeToOptimizeFor] =
    useState<DamageTypeToOptimizeFor>("total");
  const [chartType, setChartType] = useState<"incremental" | "cumulative">("incremental");
  const toggleIsExpanded = React.useCallback(() => setIsExpanded((prev) => !prev), []);
  const incrementalDamagePerAttribute = getIncrementalDamagePerAttribute(
    rowData.weapon,
    rowData.upgradeLevel,
    rowData.twoHanding,
  );
  const baseDamage = incrementalDamagePerAttribute?.base[damageTypeToOptimizeFor] || 0;

  const markers = useMemo(
    () =>
      Object.entries(incrementalDamagePerAttribute?.attackPower || {}).map(
        ([attr, totalDamageArray]) => {
          const attribute = attr as DamageAttribute;
          const attrValue = rowData.attributeMarkers?.[attribute] || 0;
          const thisDamage = totalDamageArray[attrValue]?.[damageTypeToOptimizeFor] || 0;
          const incrementalValue =
            thisDamage - (totalDamageArray[attrValue - 1]?.[damageTypeToOptimizeFor] || 0);

          return {
            label: attribute,
            x: attrValue,
            y: chartType === "incremental" ? incrementalValue : thisDamage,
          };
        },
      ),
    [chartType, rowData.attributeMarkers, incrementalDamagePerAttribute],
  );

  const lineData = useMemo(() => {
    if (!isExpanded) return [];

    return Object.entries(incrementalDamagePerAttribute?.attackPower || {}).map(
      ([attr, values]) => ({
        id: attr,
        data: values
          .map((v, i, arr) => {
            const thisDamage = v?.[damageTypeToOptimizeFor] || 0;
            const previousDamage = arr[i - 1]?.[damageTypeToOptimizeFor] || 0;
            const y =
              chartType === "incremental" ? Math.max(0, thisDamage - previousDamage) : thisDamage;
            return {
              x: i,
              y: y.toFixed(2),
            };
          })
          .slice(1, 100),
      }),
    );
  }, [isExpanded, incrementalDamagePerAttribute, chartType, damageTypeToOptimizeFor, baseDamage]);

  const yGrids = useMemo(() => {
    const gridNumbers = [];
    const maxValue = Object.values(lineData).reduce(
      (acc, { data }) => Math.max(acc, ...data.map(({ y }) => parseFloat(y))),
      0,
    );
    const intervalSize =
      chartType === "cumulative" ? Math.floor(incrementalDamagePerAttribute.base.total / 4) : 2;
    const numberOfLines = Math.ceil(maxValue / intervalSize);
    for (let i = 0; i < numberOfLines; i++) {
      gridNumbers.push(i * intervalSize);
    }
    return gridNumbers;
  }, [chartType, lineData]);

  return (
    <>
      <WeaponTableDataRow role="row">
        {columns.map(({ key, sx, columns }) => (
          <WeaponTableColumnGroup key={key} sx={sx}>
            {columns.map((column) => (
              <WeaponTableColumn key={column.key} role="cell" sx={column.sx}>
                {column.render(rowData, { isExpanded, toggleIsExpanded, onCopyAttributes })}
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
              colors={({ id }) => LINE_COLOURS[id as DamageAttribute]}
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
              layers={[
                "grid",
                "markers",
                "axes",
                "areas",
                "crosshair",
                "lines",
                "slices",
                "points",
                "mesh",
                "legends",
                ({ xScale, yScale }) =>
                  markers.map(({ x, y, label }) => (
                    <circle
                      key={label}
                      cx={xScale(x)}
                      cy={yScale(y)}
                      r={4}
                      fill="white"
                      fillOpacity={0.5}
                      stroke="white"
                      strokeWidth={1}
                    />
                  )),
              ]}
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
