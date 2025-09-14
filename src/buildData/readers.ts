import { XMLParser } from "fast-xml-parser";
import { readFileSync } from "fs";

// TODO: I can probably move this back into a helpers file when I no longer need to mock everything

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: true,
  attributeNamePrefix: "",
});

type DefaultParamRow = Record<string, number>;

/**
 * Parse an XML param file extracted by unpackFiles()
 */
type Field = { name: string; defaultValue: unknown };
type FilteredField = { name: string; defaultValue: number };
function isDefaultValueNumber(field: Field): field is FilteredField {
  return typeof field.defaultValue === "number";
}
export function readParam<T = DefaultParamRow>(filename: string): Map<number, T> {
  const data = xmlParser.parse(readFileSync(`${filename}.xml`, "utf-8"));

  const defaultValues = Object.fromEntries(
    (data.param.fields.field as { name: string; defaultValue: unknown }[])
      .filter(isDefaultValueNumber)
      .map(({ name, defaultValue }) => [name, defaultValue]),
  );

  return new Map<number, T>(
    data.param.rows.row.map(({ name, ...data }: any) => [data.id, { ...defaultValues, ...data }]),
  );
}

/**
 * Parse an XML fmg file extracted by unpackFiles(), which contains translation strings displayed
 * in the game
 */
export type FmgFile = Map<number, string | null>;
export function readFmgXml(filename: string): FmgFile {
  const data = xmlParser.parse(readFileSync(`${filename}.xml`, "utf-8"));
  const { text } = data.fmg.entries;
  if (!Array.isArray(text)) {
    return new Map();
  }

  return new Map(text.map((entry) => [entry.id, entry["#text"]]));
}
