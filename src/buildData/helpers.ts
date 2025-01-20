import { env } from "node:process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { basename, join, parse } from "node:path";
import {
  ENV_FILE_NAME,
  attackElementCorrectFile,
  swordArtsFile,
  atkPcFile,
  equipGemFile,
  calcCorrectGraphFile,
  equipParamWeaponFile,
  reinforceParamWeaponFile,
  spEffectFile,
  menuValueTableFile,
  weaponNameFmgFile,
  dlcWeaponNameFmgFile,
  menuTextFmgFile,
} from "./constants";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { XMLParser } from "fast-xml-parser";

const [_binary, _currentFile, gameVersion, outputFile] = process.argv;

const outputfileName = parse(outputFile).name;
const tmpDir = join(tmpdir(), "elden-ring-weapon-calculator", outputfileName);

// TODO: Validate that the join(tmpDir, outputfileName) logic is correct based on before these changes
export const getDir = () =>
  process.env.VANILLA_PATH
    ? join(tmpDir, outputfileName)
    : join(process.cwd(), "game-files", outputfileName);

function getWitchyDir() {
  const witchyDir = env.WITCHY_PATH;
  if (!witchyDir || !existsSync(witchyDir)) {
    throw new Error(
      "Variable WITCHY_PATH must point to a folder. Please install WitchyBND " +
        `(https://github.com/ividyon/WitchyBND/releases/latest) and update your ${ENV_FILE_NAME} file.`,
    );
  }

  return witchyDir;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: true,
  attributeNamePrefix: "",
});

// The paths to each mod and the vanilla game are supplied in the env file, and the command like
// argument (specified in package.json) says which one to use
function getExecutableDirectory() {
  const dataEnvVariable = `${gameVersion.toUpperCase()}_PATH`;
  const dataDir = process.env[dataEnvVariable];
  const skipUnpack = env.SKIP_UNPACK && env.SKIP_UNPACK !== "0";
  if (!skipUnpack && (!dataDir || !existsSync(dataDir))) {
    throw new Error(
      `Variable ${dataEnvVariable} must point to a folder. Please update your ${ENV_FILE_NAME} file.`,
    );
  }

  return dataDir || ""; // TODO: Have different paths for when to extract vs when not to
}

/**
 * Unpack the .param and .fmg files from the game or mod into an XML format we can read
 */
export function unpackFiles() {
  function witchy(paths: string[]) {
    const { error } = spawnSync(
      join(getWitchyDir(), "WitchyBND.exe"),
      ["--passive", "--parallel", ...paths],
      {
        stdio: "inherit",
        windowsHide: true,
      },
    );

    if (error) {
      throw error;
    }
  }
  const dataDir = getExecutableDirectory();
  const files = [
    attackElementCorrectFile,
    calcCorrectGraphFile,
    equipParamWeaponFile,
    reinforceParamWeaponFile,
    spEffectFile,
    menuValueTableFile,
    weaponNameFmgFile,
    dlcWeaponNameFmgFile,
    menuTextFmgFile,
    swordArtsFile,
    equipGemFile,
    atkPcFile,
  ];

  const bndPaths = [
    "regulation.bin",
    join("msg", "engus", "menu.msgbnd.dcx"),
    join("msg", "engus", "menu_dlc01.msgbnd.dcx"),
    join("msg", "engus", "menu_dlc02.msgbnd.dcx"),
    join("msg", "engus", "item.msgbnd.dcx"),
    join("msg", "engus", "item_dlc01.msgbnd.dcx"),
    join("msg", "engus", "item_dlc02.msgbnd.dcx"),
  ].filter((path) => existsSync(join(dataDir, path)));

  mkdirSync(tmpDir, { recursive: true });
  for (const path of bndPaths) {
    cpSync(join(dataDir, path), join(tmpDir, path));
  }

  witchy([...bndPaths.map((path) => join(tmpDir, path))]);

  // Extract any fmg/param files we need, delete the rest of the temporary files
  const filesToExtract: string[] = [];
  for (const path of bndPaths) {
    const bndDir = join(tmpDir, path.replaceAll(".", "-"));
    for (const file of readdirSync(bndDir)) {
      if (files.includes(file)) {
        filesToExtract.push(join(bndDir, file));
      }
    }
  }

  witchy(filesToExtract);

  for (const file of filesToExtract) {
    renameSync(`${file}.xml`, join(tmpDir, `${basename(file)}.xml`));
  }

  rmSync(join(tmpDir, "regulation.bin"));
  rmSync(join(tmpDir, "regulation-bin"), { recursive: true });
  rmSync(join(tmpDir, "msg"), { recursive: true });
}

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

export function ifNotDefault<T>(value: T, defaultValue: T): T | undefined {
  return value === defaultValue ? undefined : value;
}
