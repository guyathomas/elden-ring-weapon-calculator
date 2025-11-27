import React, { useMemo } from "react";
import { type SliceTooltip } from "@nivo/line";
import type { DamageTypeToOptimizeFor } from "../../OptimizedDamageTypePicker";
import type { DamageAttribute, DamageAttributeValues } from "../../calculator/attributes";
import type { IncrementalTotalAndSourceDamage } from "../../calculator/newCalculator";

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

export default function WeaponDamageChart({
  chartType,
  damageTypeToOptimizeFor,
  attributeDamages,
  attributeValues,
}: {
  chartType: "incremental" | "cumulative";
  damageTypeToOptimizeFor: DamageTypeToOptimizeFor;
  attributeDamages: Partial<Record<DamageAttribute, IncrementalTotalAndSourceDamage[]>>;
  attributeValues: Partial<DamageAttributeValues>;
}) {
  const markers = useMemo(
    () =>
      Object.entries(attributeDamages).map(([attr, totalDamageArray]) => {
        const attribute = attr as DamageAttribute;
        const attrValue = attributeValues?.[attribute] || 0;
        const thisDamage = totalDamageArray[attrValue]?.[damageTypeToOptimizeFor] || 0;
        const incrementalValue =
          thisDamage - (totalDamageArray[attrValue - 1]?.[damageTypeToOptimizeFor] || 0);

        return {
          label: attribute,
          x: attrValue,
          y: chartType === "incremental" ? incrementalValue : thisDamage,
        };
      }),
    [chartType, attributeValues],
  );

  const lineData = useMemo(
    () =>
      Object.entries(attributeDamages).map(([attr, values]) => ({
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
      })),
    [chartType, damageTypeToOptimizeFor],
  );

  const yGrids = useMemo(() => {
    const gridNumbers = [];
    const maxValue = Object.values(lineData).reduce(
      (acc, { data }) => Math.max(acc, ...data.map(({ y }) => parseFloat(y))),
      0,
    );
    const intervalSize = chartType === "cumulative" ? maxValue / 4 : 2;
    const numberOfLines = Math.ceil(maxValue / intervalSize);
    for (let i = 0; i < numberOfLines; i++) {
      gridNumbers.push(i * intervalSize);
    }
    return gridNumbers;
  }, [chartType, lineData]);

  return (
    <ResponsiveLine
      data={lineData}
      colors={({ id }) => LINE_COLOURS[id as DamageAttribute]}
      theme={{
        text: { fill: "#fff" },
        tooltip: { container: { background: "#333" } },
        crosshair: { line: { stroke: "#fff" } },
      }}
      yScale={{ min: 0, max: "auto", type: "linear" }}
      margin={{ top: 40, right: 20, bottom: 40, left: 50 }}
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
  );
}
