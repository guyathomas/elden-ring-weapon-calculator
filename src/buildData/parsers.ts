/*
 * Usage: yarn rebuildWeaponData
 */
import makeDebug from "debug";
import {
  WeaponType,
  AttackPowerType,
  allDamageTypes,
  type AttackElementCorrect as ParsedAttackElementCorrect,
  type DamageAttribute,
} from "../calculator/calculator";
import {
  type ParsedReinforceParamWeapon,
  type CalcCorrectGraph as ParsedCalcCorrectGraph,
  defaultStatusCalcCorrectGraphId,
  defaultDamageCalcCorrectGraphId,
  type CalcCorrectGraph,
  evaluateCalcCorrectGraph,
} from "./regulationData";
import {
  type AttackElementCorrectParam,
  type CalcCorrectGraphParam,
  type EquipParamGem,
  type EquipParamWeapon,
  type SwordArtMeta,
  type ReinforceParamWeapon,
  type AttackElementCorrectParamMap,
  type EquipParamWeaponMap,
  type CalcCorrectGraphParamMap,
  type SpEffectParamMap,
  type ReinforceParamWeaponMap,
  type SwordArtsParamMap,
  type EquipParamGemMap,
  type ParamDamageType,
  type AtkParamPcMap,
  type AtkParamAttributeShorthand,
  type AttackElementCorrectParamAttribute,
  type EquipParamWeaponAttribute,
} from "./buildTypes";
import { weaponTypeLabels } from "../app/uiUtils";
import {
  urlOverrides,
  supportedWeaponTypes,
  EXCLUDE_GEM_SET,
  wepTypeOverrides,
  unobtainableWeapons,
  isVanilla,
  categorySwordArtAddBase,
  categorySwordArt,
  affinityMap,
  swordArtParamIdToAttack,
  weaponTypeMap,
  paramDamageTypes,
  ignoreBaseAtkRateSet,
} from "./constants";
import { ifNotDefault, type FmgFile } from "./helpers";

const debug = makeDebug("buildData");

function isUniqueWeapon(row: EquipParamWeapon) {
  // Consider a weapon unique if it can't have Ashes of War (e.g. torches, moonveil) or can't have
  // affinities selected when applying Ashes of War (e.g. bows)
  return row.gemMountType === 0 || row.disableGemAttr === 1;
}

function isSupportedWeaponType(wepType: number): wepType is WeaponType {
  return supportedWeaponTypes.has(wepType);
}

function isNotExcludedGem(gem: EquipParamGem) {
  return !EXCLUDE_GEM_SET.get(gem.id);
}

function isValidAshOfWarId(gem: EquipParamGem) {
  return gem.id >= 10000;
}

function getSwordArtAttacks(
  swordArtId: number,
  equipParamWeapon: EquipParamWeapon,
): SwordArtMeta[] {
  const weaponTypeString = weaponTypeLabels.get(equipParamWeapon.wepType);
  const isForWeapon = (attack: SwordArtMeta) => attack.name.startsWith(`[${weaponTypeString}]`);
  const isNotWeaponSpecific = (attack: SwordArtMeta) => !attack.name.match(weaponLabelsRegex);
  const isCategorySwordArt = categorySwordArt.has(swordArtId);
  const isCategorySwordArtAddBase = categorySwordArtAddBase.has(swordArtId);
  const weaponLabelsRegex = new RegExp(`^\\[(?:${[...weaponTypeLabels.values()].join("|")})\\]`);
  let attacks: SwordArtMeta[];

  if (isCategorySwordArt) {
    const allAttacks = swordArtId ? swordArtParamIdToAttack.get(swordArtId) || [] : [];
    const attacksForWeaponType = allAttacks.filter(isForWeapon);
    const attacksWithoutWeaponType = allAttacks.filter(isNotWeaponSpecific);
    attacks = attacksForWeaponType.length ? attacksForWeaponType : attacksWithoutWeaponType;
  } else if (isCategorySwordArtAddBase) {
    const adjustedSwordArtId = swordArtId === 654 ? 651 : swordArtId;
    const allAttacks = adjustedSwordArtId
      ? swordArtParamIdToAttack.get(adjustedSwordArtId) || []
      : [];
    const attacksForWeaponType = allAttacks.filter(isForWeapon);
    const attacksWithoutWeaponType = allAttacks.filter(isNotWeaponSpecific);
    attacks = [...attacksForWeaponType, ...attacksWithoutWeaponType];
  } else {
    attacks = swordArtId ? swordArtParamIdToAttack.get(swordArtId) || [] : [];
  }
  return attacks;
}

function cleanGemName(gemName: string) {
  return gemName.replace("Ash of War: ", "");
}

export interface AshOfWarData {
  name: string;
  swordArtId?: number;
  attacks: SwordArtMeta[];
}
export function getAshOfWarList({
  equipParamWeapon,
  swordArtsParams,
  equipGemParams,
}: {
  equipParamWeapon: EquipParamWeapon;
  swordArtsParams: SwordArtsParamMap;
  equipGemParams: EquipParamGemMap;
}): AshOfWarData[] {
  const result: AshOfWarData[] = [];
  const affinityId = (equipParamWeapon.id % 10000) / 100;
  const aowNames = new Set<string>();

  if (!equipParamWeapon.swordArtsParamId) return result;

  const defaultSwordArt = swordArtsParams.get(equipParamWeapon.swordArtsParamId);
  if (defaultSwordArt) {
    if (!defaultSwordArt.paramdexName) {
      console.error(`No name found for ${equipParamWeapon.swordArtsParamId}`);
      return result;
    }
    const defaultName = cleanGemName(defaultSwordArt.paramdexName);
    aowNames.add(defaultName);
    result.push({
      name: defaultName,
      swordArtId: equipParamWeapon.swordArtsParamId,
      attacks: getSwordArtAttacks(equipParamWeapon.swordArtsParamId, equipParamWeapon),
    });
  }

  function isSpecialAllowed(equipParamGem: EquipParamGem) {
    return equipParamWeapon.restrictSpecialSwordArt ? !equipParamGem.isSpecialSwordArt : true;
  }

  function isMountable(equipParamGem: EquipParamGem) {
    const canMountKey = weaponTypeMap.get(equipParamWeapon.wepType);
    const canMountValue = canMountKey ? equipParamGem[canMountKey] : "0";
    return !!(typeof canMountValue === "string" ? parseInt(canMountValue) : canMountValue);
  }

  function isForCurrentInfusement(equipParamGem: EquipParamGem) {
    const equipParamGemKey = affinityMap.get(affinityId)?.equipParamGemKey;
    return !!(equipParamGemKey ? equipParamGem[equipParamGemKey] : false);
  }

  function isUniqueByName({ name }: EquipParamGem) {
    if (aowNames.has(name)) return false;
    aowNames.add(name);
    return true;
  }

  const gems = [...equipGemParams.values()];
  const otherAshes: AshOfWarData[] = (
    equipParamWeapon.gemMountType === 2
      ? gems
          .map((gem) => ({ ...gem, name: cleanGemName(gem.paramdexName) }))
          .filter(isValidAshOfWarId)
          .filter(isNotExcludedGem)
          .filter(isMountable)
          .filter(isSpecialAllowed)
          .filter(isForCurrentInfusement)
      : []
  )
    .filter(isUniqueByName)
    .sort((a, b) => a.sortId - b.sortId)
    .map((gem) => ({
      name: gem.name,
      swordArtId: gem.swordArtsParamId,
      attacks: getSwordArtAttacks(gem.swordArtsParamId, equipParamWeapon),
    }));
  return [...result, ...otherAshes];
}

export function getAshOfWarDamage({
  weaponId,
  weaponLevel,
  twoHanding,
  attackId,
  attackName,
  equipParamWeapons,
  reinforceParamWeapons,
  atkParamPc,
  attackElementCorrectParam,
  calcCorrectGraphsJson,
}: {
  weaponId: number;
  weaponLevel: number;
  twoHanding: false;
  attackId: number;
  attackName: string;
  equipParamWeapons: EquipParamWeaponMap;
  reinforceParamWeapons: ReinforceParamWeaponMap;
  atkParamPc: AtkParamPcMap;
  attackElementCorrectParam: AttackElementCorrectParamMap;
  calcCorrectGraphsJson: {
    [k: string]: CalcCorrectGraph;
  };
}) {
  const calcCorrectGraphsById = new Map(
    Object.entries(calcCorrectGraphsJson).map(([calcCorrectGraphId, calcCorrectGraph]) => [
      +calcCorrectGraphId,
      evaluateCalcCorrectGraph(calcCorrectGraph!),
    ]),
  );
  const damageAttributes: AttackElementCorrectParamAttribute[] = [
    "Strength",
    "Dexterity",
    "Magic",
    "Faith",
    "Luck",
  ];
  function getEquipParamWeaponAttribute(
    attribute: AttackElementCorrectParamAttribute,
  ): EquipParamWeaponAttribute {
    return attribute === "Dexterity" ? "Agility" : attribute;
  }

  // TODO: DamageAttributeValues will be a better type
  const attributeValues: Record<AttackElementCorrectParamAttribute, number> = {
    Strength: 20,
    Dexterity: 20,
    Magic: 20,
    Faith: 20,
    Luck: 20,
  };

  const atkParamDamageTypeShorthand: Record<ParamDamageType, AtkParamAttributeShorthand> = {
    Physics: "Phys",
    Magic: "Mag",
    Fire: "Fire",
    Thunder: "Thun",
    Dark: "Dark",
  };
  // Constants that actually have evaluation formulas, but having fixed here for simplicity
  const ignoreScale = false;
  const isPhysAtkPenalty = false;
  const physAtkPenalty = -0.4;
  const isNegPhysScale = false;
  const negPhysScale = 0;
  const equipParamWeaponValue = equipParamWeapons.get(weaponId);
  const atkParamPcValue = atkParamPc.get(attackId);

  // TODO: Can I derive this another way?
  const isBullet = attackName.includes("Bullet");
  // TODO: Can I derive this another way?
  const ignoreBaseAtkRate = ignoreBaseAtkRateSet.has(attackId);

  if (!equipParamWeaponValue) throw new Error("Unable to find equipParamWeapon");
  if (!atkParamPcValue) throw new Error("Unable to find atkParamPc");
  const leveledReinforcementId = equipParamWeaponValue.reinforceTypeId + weaponLevel;
  const reinforceParamWeapon = reinforceParamWeapons.get(leveledReinforcementId);
  if (!reinforceParamWeapon) throw new Error("Unable to find reinforceParamWeapon");
  const attackElementCorrectId =
    atkParamPcValue.overwriteAttackElementCorrectId === -1
      ? equipParamWeaponValue.attackElementCorrectId
      : atkParamPcValue.overwriteAttackElementCorrectId;
  const attackElementCorrectValue = attackElementCorrectParam.get(attackElementCorrectId);

  if (!attackElementCorrectValue) throw new Error("Unable to find attackElementCorrect");

  const isAddBaseAtk = atkParamPcValue.isAddBaseAtk;
  const baseAtkRate = reinforceParamWeapon.baseAtkRate; // 1 + (3 / MaxWeaponLevel) * WeaponLevel;
  const throwFlag = atkParamPcValue.throwFlag;
  const throwAtkRate = equipParamWeaponValue.throwAtkRate;

  return paramDamageTypes.reduce((acc, damageType) => {
    const attackBase = equipParamWeaponValue[`attackBase${damageType}`];
    const atkRate =
      reinforceParamWeapon[
        `${damageType.toLocaleLowerCase() as Lowercase<ParamDamageType>}AtkRate`
      ];
    const atkCorrection =
      atkParamPcValue[`atk${atkParamDamageTypeShorthand[damageType]}Correction`];
    const atk = atkParamPcValue[`atk${atkParamDamageTypeShorthand[damageType]}`];

    const baseAtk =
      attackBase * atkRate * atkCorrection * 0.01 +
      (isBullet || isAddBaseAtk ? atk : 0) *
        (ignoreBaseAtkRate === false ? baseAtkRate : 1) *
        (throwFlag === 2 ? 1 + throwAtkRate * 0.01 : 1);

    const _baseAtkScaling = damageAttributes.reduce((acc, attr) => {
      const isCorrect_by = attackElementCorrectValue[`is${attr}Correct_by${damageType}`];
      const _correctRate = attackElementCorrectValue[`Influence${attr}CorrectRate_by${damageType}`];
      const overwriteCorrectRate_by =
        attackElementCorrectValue[`overwrite${attr}CorrectRate_by${damageType}`];
      const equipParamWeaponAttribute = getEquipParamWeaponAttribute(attr);
      const correct = equipParamWeaponValue[`correct${equipParamWeaponAttribute}`];

      // TODO: Update maps to reference the Gem ID instead of name. Hardcode for now. Only affects a few AoW's
      // const changePoint = attributePointMap.get(attack.name).change[attr]Point || 0
      const changePoint = 0;
      const _adjustedAttr =
        attr === "Strength" && twoHanding
          ? Math.floor(attributeValues[attr] * 1.5)
          : attributeValues[attr];
      const correctType = equipParamWeaponValue[`correctType_${damageType}`];
      const correct_by = calcCorrectGraphsById.get(correctType)?.[_adjustedAttr] || 0;
      const damageForAttribute = isCorrect_by
        ? _correctRate * 0.01 -
          1 +
          ((overwriteCorrectRate_by >= 0 ? overwriteCorrectRate_by : correct) *
            0.01 *
            reinforceParamWeapon[`correct${getEquipParamWeaponAttribute(attr)}Rate`] +
            changePoint * 0.01) *
            (correct_by * 0.01) *
            _correctRate
        : 0;

      return acc.set(attr, damageForAttribute);
    }, new Map());
    const effectiveScaling = ignoreScale
      ? 0
      : isPhysAtkPenalty
        ? physAtkPenalty
        : isNegPhysScale
          ? negPhysScale
          : [..._baseAtkScaling.values()].reduce((acc, v) => acc + v, 0);
    return acc.set(damageType, baseAtk + baseAtk * effectiveScaling);
  }, new Map());
}

interface ParseWeaponResult {
  id: number;
  name: string;
  weaponName: string;
  url: string;
  affinityId: number;
  weaponType: number;
  requirements: {
    str?: number;
    dex?: number;
    int?: number;
    fai?: number;
    arc?: number;
  };
  attack: (readonly [AttackPowerType, number])[];
  weight: number;
  attributeScaling: Array<readonly [DamageAttribute, number]>;
  statusSpEffectParamIds?: number[];
  reinforceTypeId: number;
  attackElementCorrectId: number;
  calcCorrectGraphIds: {
    [key in AttackPowerType]?: number;
  };
  paired?: boolean;
  sorceryTool?: boolean;
  incantationTool?: boolean;
  dlc?: boolean;
}
export function parseWeapon({
  weapon,
  weaponNames,
  dlcWeaponNames,
  reinforceParamWeapons,
  attackElementCorrectParams,
  equipParamWeapons,
  calcCorrectGraphs,
  spEffectParams,
}: {
  weapon: EquipParamWeapon;
  weaponNames: FmgFile;
  dlcWeaponNames: FmgFile;
  reinforceParamWeapons: ReinforceParamWeaponMap;
  attackElementCorrectParams: AttackElementCorrectParamMap;
  equipParamWeapons: EquipParamWeaponMap;
  calcCorrectGraphs: CalcCorrectGraphParamMap;
  spEffectParams: SpEffectParamMap;
}): ParseWeaponResult | null {
  let name: string;
  let dlc = false;

  if (weaponNames.has(weapon.id)) {
    name = weaponNames.get(weapon.id)!;
  } else if (dlcWeaponNames.has(weapon.id)) {
    name = dlcWeaponNames.get(weapon.id)!;
    dlc = isVanilla;
  } else {
    return null;
  }
  if (name.includes("[ERROR]") || name.includes("%null%")) {
    return null;
  }

  const weaponType = wepTypeOverrides.get(weapon.id) ?? weapon.wepType;
  if (!isSupportedWeaponType(weaponType)) {
    // Log a message if this is something other than ammunition or other placeholder weapon types
    if (![0, 81, 83, 85, 86].includes(weaponType)) {
      debug(`Unknown weapon type ${weaponType} on "${name}" ${weapon.id}, ignoring`);
    }
    return null;
  }

  if (unobtainableWeapons.has(weapon.id)) {
    return null;
  }

  if (!reinforceParamWeapons.has(weapon.reinforceTypeId)) {
    debug(`Unknown reinforceTypeId ${weapon.reinforceTypeId} on "${name}", ignoring`);
    return null;
  }

  if (!attackElementCorrectParams.has(weapon.attackElementCorrectId)) {
    debug(
      `Unknown AttackElementCorrectParam ${weapon.attackElementCorrectId} on "${name}, ignoring`,
    );
    return null;
  }

  const affinityId = (weapon.id % 10000) / 100;
  const uninfusedWeapon = equipParamWeapons.get(weapon.id - 100 * affinityId);
  if (!uninfusedWeapon) {
    throw new Error(`No uninfused weapon ${weapon.id - 100 * affinityId} for ${weapon.id} ${name}`);
  }

  if (affinityId !== Math.floor(affinityId)) {
    debug(`Unknown affinity for ID ${weapon.id} on "${name}", ignoring`);
    return null;
  }

  // Some weapons have infused versions in EquipParamWeapon even though ashes of war can't be
  // applied to them, e.g. Magic Great Club. Exclude these fake weapons from the list.
  if (affinityId !== 0 && isUniqueWeapon(uninfusedWeapon)) {
    debug(`Cannot apply affinity ${affinityId} on unique weapon "${name}", ignoring`);
    return null;
  }

  const attackPowerTypes = new Set<AttackPowerType>();

  let statusSpEffectParamIds: number[] | undefined = [
    weapon.spEffectBehaviorId0,
    weapon.spEffectBehaviorId1,
    weapon.spEffectBehaviorId2,
  ];

  // Replace SpEffectParams that aren't relevant for status effects with 0, since they don't need
  // to be included in the data
  statusSpEffectParamIds = statusSpEffectParamIds.map((spEffectParamId) => {
    const statusSpEffectParams = parseStatusSpEffectParams(spEffectParamId, spEffectParams);
    if (statusSpEffectParams != null) {
      Object.keys(statusSpEffectParams).forEach((statusType) => {
        attackPowerTypes.add(+statusType as AttackPowerType);
      });
      return spEffectParamId;
    }
    return 0;
  });

  if (statusSpEffectParamIds.every((id) => id === 0)) {
    statusSpEffectParamIds = undefined;
  }

  // Occult Fingerprint Stone Shield is bugged even though the data looks good.
  // Manually override this for now.
  if (isVanilla && weapon.id === 32131200) {
    statusSpEffectParamIds = [0, 0, 0];
  }

  const attack: (readonly [AttackPowerType, number])[] = (
    [
      [AttackPowerType.PHYSICAL, weapon.attackBasePhysics],
      [AttackPowerType.MAGIC, weapon.attackBaseMagic],
      [AttackPowerType.FIRE, weapon.attackBaseFire],
      [AttackPowerType.LIGHTNING, weapon.attackBaseThunder],
      [AttackPowerType.HOLY, weapon.attackBaseDark],
    ] as const
  ).filter(([attackPowerType, attackPower]) => {
    if (attackPower) {
      attackPowerTypes.add(attackPowerType);
      return true;
    }
    return false;
  });

  // Spells use a CalcCorrectGraph based on the type of damage they deal. These are normally the
  // same, but The Convergence has different CalcCorrectGraphs to give spell tools varying
  // effectiveness with different damage types.
  if (weapon.enableMagic || weapon.enableMiracle) {
    allDamageTypes.forEach((damageType) => attackPowerTypes.add(damageType));
  }

  const calcCorrectGraphIds = {
    [AttackPowerType.PHYSICAL]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.PHYSICAL) ? weapon.correctType_Physics : undefined,
      defaultDamageCalcCorrectGraphId,
    ),
    [AttackPowerType.MAGIC]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.MAGIC) ? weapon.correctType_Magic : undefined,
      defaultDamageCalcCorrectGraphId,
    ),
    [AttackPowerType.FIRE]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.FIRE) ? weapon.correctType_Fire : undefined,
      defaultDamageCalcCorrectGraphId,
    ),
    [AttackPowerType.LIGHTNING]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.LIGHTNING) ? weapon.correctType_Thunder : undefined,
      defaultDamageCalcCorrectGraphId,
    ),
    [AttackPowerType.HOLY]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.HOLY) ? weapon.correctType_Dark : undefined,
      defaultDamageCalcCorrectGraphId,
    ),
    [AttackPowerType.POISON]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.POISON) ? weapon.correctType_Poison : undefined,
      defaultStatusCalcCorrectGraphId,
    ),
    [AttackPowerType.BLEED]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.BLEED) ? weapon.correctType_Blood : undefined,
      defaultStatusCalcCorrectGraphId,
    ),
    [AttackPowerType.SLEEP]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.SLEEP) ? weapon.correctType_Sleep : undefined,
      defaultStatusCalcCorrectGraphId,
    ),
    [AttackPowerType.MADNESS]: ifNotDefault(
      attackPowerTypes.has(AttackPowerType.MADNESS) ? weapon.correctType_Madness : undefined,
      defaultStatusCalcCorrectGraphId,
    ),
  };

  for (const calcCorrectGraphId of Object.values(calcCorrectGraphIds)) {
    if (calcCorrectGraphId !== undefined && !calcCorrectGraphs.has(calcCorrectGraphId)) {
      debug(`Unknown CalcCorrectGraph ${calcCorrectGraphId} on "${name}", ignoring`);
      return null;
    }
  }
  const weaponName = (weaponNames.get(uninfusedWeapon.id) ??
    dlcWeaponNames.get(uninfusedWeapon.id))!;
  return {
    id: weapon.id,
    name,
    weaponName,
    url:
      urlOverrides.get(uninfusedWeapon.id) ||
      `https://eldenring.wiki.fextralife.com/${weaponName.replaceAll(" ", "+")}`,
    affinityId: isUniqueWeapon(weapon) ? -1 : affinityId,
    weaponType,
    requirements: {
      str: ifNotDefault(weapon.properStrength, 0),
      dex: ifNotDefault(weapon.properAgility, 0),
      int: ifNotDefault(weapon.properMagic, 0),
      fai: ifNotDefault(weapon.properFaith, 0),
      arc: ifNotDefault(weapon.properLuck, 0),
    },
    attack,
    weight: weapon.weight,
    attributeScaling: (
      [
        ["str", weapon.correctStrength / 100],
        ["dex", weapon.correctAgility / 100],
        ["int", weapon.correctMagic / 100],
        ["fai", weapon.correctFaith / 100],
        ["arc", weapon.correctLuck / 100],
      ] as const
    ).filter(([, attributeScaling]) => attributeScaling),
    statusSpEffectParamIds,
    reinforceTypeId: weapon.reinforceTypeId,
    attackElementCorrectId: weapon.attackElementCorrectId,
    calcCorrectGraphIds,
    paired: ifNotDefault(weapon.isDualBlade === 1, false),
    sorceryTool: ifNotDefault(weapon.enableMagic === 1, false),
    incantationTool: ifNotDefault(weapon.enableMiracle === 1, false),
    dlc: ifNotDefault(dlc, false),
  };
}

export function parseCalcCorrectGraph(row: CalcCorrectGraphParam): ParsedCalcCorrectGraph {
  return [
    {
      maxVal: row.stageMaxVal0,
      maxGrowVal: row.stageMaxGrowVal0 / 100,
      adjPt: row.adjPt_maxGrowVal0,
    },
    {
      maxVal: row.stageMaxVal1,
      maxGrowVal: row.stageMaxGrowVal1 / 100,
      adjPt: row.adjPt_maxGrowVal1,
    },
    {
      maxVal: row.stageMaxVal2,
      maxGrowVal: row.stageMaxGrowVal2 / 100,
      adjPt: row.adjPt_maxGrowVal2,
    },
    {
      maxVal: row.stageMaxVal3,
      maxGrowVal: row.stageMaxGrowVal3 / 100,
      adjPt: row.adjPt_maxGrowVal3,
    },
    {
      maxVal: row.stageMaxVal4,
      maxGrowVal: row.stageMaxGrowVal4 / 100,
      adjPt: row.adjPt_maxGrowVal4,
    },
  ];
}

export function parseAttackElementCorrect(
  row: AttackElementCorrectParam,
): ParsedAttackElementCorrect {
  function buildAttackElementCorrect(...args: [DamageAttribute, boolean, number][]) {
    const entries = args
      .filter(([, isCorrect]) => isCorrect)
      .map(([attribute, , overwriteCorrect]): [DamageAttribute, number | true] => [
        attribute,
        overwriteCorrect === -1 ? true : overwriteCorrect / 100,
      ]);
    return entries.length
      ? (Object.fromEntries(entries) as ParsedAttackElementCorrect[AttackPowerType])
      : undefined;
  }

  return {
    [AttackPowerType.PHYSICAL]: buildAttackElementCorrect(
      ["str", !!row.isStrengthCorrect_byPhysics, row.overwriteStrengthCorrectRate_byPhysics],
      ["dex", !!row.isDexterityCorrect_byPhysics, row.overwriteDexterityCorrectRate_byPhysics],
      ["fai", !!row.isFaithCorrect_byPhysics, row.overwriteFaithCorrectRate_byPhysics],
      ["int", !!row.isMagicCorrect_byPhysics, row.overwriteMagicCorrectRate_byPhysics],
      ["arc", !!row.isLuckCorrect_byPhysics, row.overwriteLuckCorrectRate_byPhysics],
    ),
    [AttackPowerType.MAGIC]: buildAttackElementCorrect(
      ["str", !!row.isStrengthCorrect_byMagic, row.overwriteStrengthCorrectRate_byMagic],
      ["dex", !!row.isDexterityCorrect_byMagic, row.overwriteDexterityCorrectRate_byMagic],
      ["fai", !!row.isFaithCorrect_byMagic, row.overwriteFaithCorrectRate_byMagic],
      ["int", !!row.isMagicCorrect_byMagic, row.overwriteMagicCorrectRate_byMagic],
      ["arc", !!row.isLuckCorrect_byMagic, row.overwriteLuckCorrectRate_byMagic],
    ),
    [AttackPowerType.FIRE]: buildAttackElementCorrect(
      ["str", !!row.isStrengthCorrect_byFire, row.overwriteStrengthCorrectRate_byFire],
      ["dex", !!row.isDexterityCorrect_byFire, row.overwriteDexterityCorrectRate_byFire],
      ["fai", !!row.isFaithCorrect_byFire, row.overwriteFaithCorrectRate_byFire],
      ["int", !!row.isMagicCorrect_byFire, row.overwriteMagicCorrectRate_byFire],
      ["arc", !!row.isLuckCorrect_byFire, row.overwriteLuckCorrectRate_byFire],
    ),
    [AttackPowerType.LIGHTNING]: buildAttackElementCorrect(
      ["str", !!row.isStrengthCorrect_byThunder, row.overwriteStrengthCorrectRate_byThunder],
      ["dex", !!row.isDexterityCorrect_byThunder, row.overwriteDexterityCorrectRate_byThunder],
      ["fai", !!row.isFaithCorrect_byThunder, row.overwriteFaithCorrectRate_byThunder],
      ["int", !!row.isMagicCorrect_byThunder, row.overwriteMagicCorrectRate_byThunder],
      ["arc", !!row.isLuckCorrect_byThunder, row.overwriteLuckCorrectRate_byThunder],
    ),
    [AttackPowerType.HOLY]: buildAttackElementCorrect(
      ["str", !!row.isStrengthCorrect_byDark, row.overwriteStrengthCorrectRate_byDark],
      ["dex", !!row.isDexterityCorrect_byDark, row.overwriteDexterityCorrectRate_byDark],
      ["fai", !!row.isFaithCorrect_byDark, row.overwriteFaithCorrectRate_byDark],
      ["int", !!row.isMagicCorrect_byDark, row.overwriteMagicCorrectRate_byDark],
      ["arc", !!row.isLuckCorrect_byDark, row.overwriteLuckCorrectRate_byDark],
    ),
  };
}

export function parseReinforceParamWeapon(row: ReinforceParamWeapon): ParsedReinforceParamWeapon {
  return {
    attack: {
      [AttackPowerType.PHYSICAL]: row.physicsAtkRate,
      [AttackPowerType.MAGIC]: row.magicAtkRate,
      [AttackPowerType.FIRE]: row.fireAtkRate,
      [AttackPowerType.LIGHTNING]: row.thunderAtkRate,
      [AttackPowerType.HOLY]: row.darkAtkRate,
    },
    attributeScaling: {
      str: row.correctStrengthRate,
      dex: row.correctAgilityRate,
      int: row.correctMagicRate,
      fai: row.correctFaithRate,
      arc: row.correctLuckRate,
    },
    statusSpEffectId1: ifNotDefault(row.spEffectId1, 0),
    statusSpEffectId2: ifNotDefault(row.spEffectId2, 0),
    statusSpEffectId3: ifNotDefault(row.spEffectId3, 0),
  };
}

export function parseStatusSpEffectParams(
  statusSpEffectParamId: number,
  spEffectParams: SpEffectParamMap,
): Partial<Record<AttackPowerType, number>> | null {
  const spEffectRow = spEffectParams.get(statusSpEffectParamId);
  if (!spEffectRow) {
    return null;
  }

  const statuses = {
    [AttackPowerType.POISON]: ifNotDefault(spEffectRow.poizonAttackPower, 0),
    [AttackPowerType.SCARLET_ROT]: ifNotDefault(spEffectRow.diseaseAttackPower, 0),
    [AttackPowerType.BLEED]: ifNotDefault(spEffectRow.bloodAttackPower, 0),
    [AttackPowerType.FROST]: ifNotDefault(spEffectRow.freezeAttackPower, 0),
    [AttackPowerType.SLEEP]: ifNotDefault(spEffectRow.sleepAttackPower, 0),
    [AttackPowerType.MADNESS]: ifNotDefault(spEffectRow.madnessAttackPower, 0),
    [AttackPowerType.DEATH_BLIGHT]: ifNotDefault(spEffectRow.curseAttackPower, 0),
  };

  if (Object.values(statuses).some((value) => value !== undefined)) {
    return statuses;
  }

  return null;
}
