/**
 * @fileoverview Type definitions and core data mappings for Elden Ring build data.
 * Contains interfaces for game param files and essential lookup maps.
 * 
 * Module Dependencies: None (foundation module)
 * 
 * Used by:
 * - buildData.ts (build orchestration)
 * - regulationData.ts (data processing)
 * 
 * Note: While named "Types", this module also contains core data mappings
 * (weaponTypeMap, affinityMap, EXCLUDE_GEM_SET) that are tightly coupled
 * to the type definitions and used throughout the build process.
 */
import {
  AttackPowerType,
  WeaponType,
  type DamageAttribute,
} from "./calculator/calculator.ts";
import { type SwordArtMeta } from "./regulationData.ts";

export type ParamDamageType = "Physics" | "Magic" | "Fire" | "Thunder" | "Dark";
export type ParamAttribute = "Strength" | "Agility" | "Magic" | "Faith" | "Luck";

// MenuValueTableParam.param
export type MenuValueTableParamMap = Map<number, MenuValueTableParam>;
export interface MenuValueTableParam {
  value: number;
  textId: number;
  compareType: number;
}

export type AttackElementCorrectParamAttribute =
  | "Strength"
  | "Dexterity"
  | "Magic"
  | "Faith"
  | "Luck";
type CorrectParamKey = {
  [key in `is${AttackElementCorrectParamAttribute}Correct_by${ParamDamageType}`]: number;
};
type OverriteCorrectParamKey = {
  [key in `overwrite${AttackElementCorrectParamAttribute}CorrectRate_by${ParamDamageType}`]: number;
};
type InfluenceCorrectParamKey = {
  [key in `Influence${AttackElementCorrectParamAttribute}CorrectRate_by${ParamDamageType}`]: number;
};

// AttackElementCorrectParam.param
export type AttackElementCorrectParam = CorrectParamKey &
  OverriteCorrectParamKey &
  InfluenceCorrectParamKey;
export type AttackElementCorrectParamMap = Map<number, AttackElementCorrectParam>;

// CalcCorrectGraph.param
export type CalcCorrectGraphParamMap = Map<number, CalcCorrectGraphParam>;
export interface CalcCorrectGraphParam {
  stageMaxVal0: number;
  stageMaxVal1: number;
  stageMaxVal2: number;
  stageMaxVal3: number;
  stageMaxVal4: number;

  stageMaxGrowVal0: number;
  stageMaxGrowVal1: number;
  stageMaxGrowVal2: number;
  stageMaxGrowVal3: number;
  stageMaxGrowVal4: number;

  adjPt_maxGrowVal0: number;
  adjPt_maxGrowVal1: number;
  adjPt_maxGrowVal2: number;
  adjPt_maxGrowVal3: number;
  adjPt_maxGrowVal4: number;

  init_inclination_soul: number;
  adjustment_value: number;
  boundry_inclination_soul: number;
  boundry_value: number;
}

type DamageRateMap = {
  [key in `${Lowercase<ParamDamageType>}AtkRate`]: number;
};

type GuardCutRateMap = {
  [key in `${Lowercase<ParamDamageType>}GuardCutRate`]: number;
};
type AttributeRateMap = {
  [key in `correct${ParamAttribute}Rate`]: number;
};

// ReinforceParamWeapon.param
export type ReinforceParamWeaponMap = Map<number, ReinforceParamWeapon>;
export interface ReinforceParamWeapon extends DamageRateMap, GuardCutRateMap, AttributeRateMap {
  staminaAtkRate: number;
  saWeaponAtkRate: number;
  saDurabilityRate: number;
  baseAtkRate: number;
  poisonGuardResistRate: number;
  diseaseGuardResistRate: number;
  bloodGuardResistRate: number;
  curseGuardResistRate: number;
  staminaGuardDefRate: number;
  freezeGuardDefRate: number;
  sleepGuardDefRate: number;
  madnessGuardDefRate: number;
  spEffectId1: number;
  spEffectId2: number;
  spEffectId3: number;
  residentSpEffectId1: number;
  residentSpEffectId2: number;
  residentSpEffectId3: number;
  materialSetId: number;
  maxReinforceLevel: number;
  reinforcePriceRate: number;
  baseChangePriceRate: number;
  enableGemRank: number;
  pad2: [number, number, number];
}

export type SpEffectParamMap = Map<number, SpEffectParam>;
export interface SpEffectParam {
  iconId: number;
  conditionHp: number;
  effectEndurance: number;
  motionInterval: number;
  maxHpRate: number;
  maxMpRate: number;
  maxStaminaRate: number;
  slashDamageCutRate: number;
  blowDamageCutRate: number;
  thrustDamageCutRate: number;
  neutralDamageCutRate: number;
  magicDamageCutRate: number;
  fireDamageCutRate: number;
  thunderDamageCutRate: number;
  physicsAttackRate: number;
  magicAttackRate: number;
  fireAttackRate: number;
  thunderAttackRate: number;
  physicsAttackPowerRate: number;
  magicAttackPowerRate: number;
  fireAttackPowerRate: number;
  thunderAttackPowerRate: number;
  physicsAttackPower: number;
  magicAttackPower: number;
  fireAttackPower: number;
  thunderAttackPower: number;
  physicsDiffenceRate: number;
  magicDiffenceRate: number;
  fireDiffenceRate: number;
  thunderDiffenceRate: number;
  physicsDiffence: number;
  magicDiffence: number;
  fireDiffence: number;
  thunderDiffence: number;
  NoGuardDamageRate: number;
  vitalSpotChangeRate: number;
  normalSpotChangeRate: number;
  lookAtTargetPosOffset: number;
  behaviorId: number;
  changeHpRate: number;
  changeHpPoint: number;
  changeMpRate: number;
  changeMpPoint: number;
  mpRecoverChangeSpeed: number;
  changeStaminaRate: number;
  changeStaminaPoint: number;
  staminaRecoverChangeSpeed: number;
  magicEffectTimeChange: number;
  insideDurability: number;
  maxDurability: number;
  staminaAttackRate: number;
  poizonAttackPower: number;
  diseaseAttackPower: number;
  bloodAttackPower: number;
  curseAttackPower: number;
  fallDamageRate: number;
  soulRate: number;
  equipWeightChangeRate: number;
  allItemWeightChangeRate: number;
  soul: number;
  animIdOffset: number;
  haveSoulRate: number;
  targetPriority: number;
  sightSearchEnemyRate: number;
  hearingSearchEnemyRate: number;
  grabityRate: number;
  registPoizonChangeRate: number;
  registDiseaseChangeRate: number;
  registBloodChangeRate: number;
  registCurseChangeRate: number;
  soulStealRate: number;
  lifeReductionRate: number;
  hpRecoverRate: number;
  replaceSpEffectId: number;
  cycleOccurrenceSpEffectId: number;
  atkOccurrenceSpEffectId: number;
  guardDefFlickPowerRate: number;
  guardStaminaCutRate: number;
  rayCastPassedTime: number;
  magicSubCategoryChange1: number;
  magicSubCategoryChange2: number;
  bowDistRate: number;
  spCategory: number;
  categoryPriority: number;
  saveCategory: number;
  changeMagicSlot: number;
  changeMiracleSlot: number;
  heroPointDamage: number;
  defFlickPower: number;
  flickDamageCutRate: number;
  bloodDamageRate: number;
  dmgLv_None: number;
  dmgLv_S: number;
  dmgLv_M: number;
  dmgLv_L: number;
  dmgLv_BlowM: number;
  dmgLv_Push: number;
  dmgLv_Strike: number;
  dmgLv_BlowS: number;
  dmgLv_Min: number;
  dmgLv_Uppercut: number;
  dmgLv_BlowLL: number;
  dmgLv_Breath: number;
  atkAttribute: number;
  spAttribute: number;
  stateInfo: number;
  wepParamChange: number;
  moveType: number;
  lifeReductionType: number;
  throwCondition: number;
  addBehaviorJudgeId_condition: number;
  freezeDamageRate: number;
  effectTargetSelf: number;
  effectTargetFriend: number;
  effectTargetEnemy: number;
  effectTargetPlayer: number;
  effectTargetAI: number;
  effectTargetLive: number;
  effectTargetGhost: number;
  disableSleep: number;
  disableMadness: number;
  effectTargetAttacker: number;
  dispIconNonactive: number;
  regainGaugeDamage: number;
  bAdjustMagicAblity: number;
  bAdjustFaithAblity: number;
  bGameClearBonus: number;
  magParamChange: number;
  miracleParamChange: number;
  clearSoul: number;
  requestSOS: number;
  requestBlackSOS: number;
  requestForceJoinBlackSOS: number;
  requestKickSession: number;
  requestLeaveSession: number;
  requestNpcInveda: number;
  noDead: number;
  bCurrHPIndependeMaxHP: number;
  corrosionIgnore: number;
  sightSearchCutIgnore: number;
  hearingSearchCutIgnore: number;
  antiMagicIgnore: number;
  fakeTargetIgnore: number;
  fakeTargetIgnoreUndead: number;
  fakeTargetIgnoreAnimal: number;
  grabityIgnore: number;
  disablePoison: number;
  disableDisease: number;
  disableBlood: number;
  disableCurse: number;
  enableCharm: number;
  enableLifeTime: number;
  bAdjustStrengthAblity: number;
  bAdjustAgilityAblity: number;
  eraseOnBonfireRecover: number;
  throwAttackParamChange: number;
  requestLeaveColiseumSession: number;
  isExtendSpEffectLife: number;
  hasTarget: number;
  replanningOnFire: number;
  vowType0: number;
  vowType1: number;
  vowType2: number;
  vowType3: number;
  vowType4: number;
  vowType5: number;
  vowType6: number;
  vowType7: number;
  vowType8: number;
  vowType9: number;
  vowType10: number;
  vowType11: number;
  vowType12: number;
  vowType13: number;
  vowType14: number;
  vowType15: number;
  repAtkDmgLv: number;
  sightSearchRate: number;
  effectTargetOpposeTarget: number;
  effectTargetFriendlyTarget: number;
  effectTargetSelfTarget: number;
  effectTargetPcHorse: number;
  effectTargetPcDeceased: number;
  isContractSpEffectLife: number;
  isWaitModeDelete: number;
  isIgnoreNoDamage: number;
  changeTeamType: number;
  dmypolyId: number;
  vfxId: number;
  accumuOverFireId: number;
  accumuOverVal: number;
  accumuUnderFireId: number;
  accumuUnderVal: number;
  accumuVal: number;
  eye_angX: number;
  eye_angY: number;
  addDeceasedLv: number;
  vfxId1: number;
  vfxId2: number;
  vfxId3: number;
  vfxId4: number;
  vfxId5: number;
  vfxId6: number;
  vfxId7: number;
  freezeAttackPower: number;
  AppearAiSoundId: number;
  addFootEffectSfxId: number;
  dexterityCancelSystemOnlyAddDexterity: number;
  teamOffenseEffectivity: number;
  toughnessDamageCutRate: number;
  weakDmgRateA: number;
  weakDmgRateB: number;
  weakDmgRateC: number;
  weakDmgRateD: number;
  weakDmgRateE: number;
  weakDmgRateF: number;
  darkDamageCutRate: number;
  darkDiffenceRate: number;
  darkDiffence: number;
  darkAttackRate: number;
  darkAttackPowerRate: number;
  darkAttackPower: number;
  antiDarkSightRadius: number;
  antiDarkSightDmypolyId: number;
  conditionHpRate: number;
  consumeStaminaRate: number;
  itemDropRate: number;
  changePoisonResistPoint: number;
  changeDiseaseResistPoint: number;
  changeBloodResistPoint: number;
  changeCurseResistPoint: number;
  changeFreezeResistPoint: number;
  slashAttackRate: number;
  blowAttackRate: number;
  thrustAttackRate: number;
  neutralAttackRate: number;
  slashAttackPowerRate: number;
  blowAttackPowerRate: number;
  thrustAttackPowerRate: number;
  neutralAttackPowerRate: number;
  slashAttackPower: number;
  blowAttackPower: number;
  thrustAttackPower: number;
  neutralAttackPower: number;
  changeStrengthPoint: number;
  changeAgilityPoint: number;
  changeMagicPoint: number;
  changeFaithPoint: number;
  changeLuckPoint: number;
  recoverArtsPoint_Str: number;
  recoverArtsPoint_Dex: number;
  recoverArtsPoint_Magic: number;
  recoverArtsPoint_Miracle: number;
  madnessDamageRate: number;
  isUseStatusAilmentAtkPowerCorrect: number;
  isUseAtkParamAtkPowerCorrect: number;
  dontDeleteOnDead: number;
  disableFreeze: number;
  isDisableNetSync: number;
  shamanParamChange: number;
  isStopSearchedNotify: number;
  isCheckAboveShadowTest: number;
  addBehaviorJudgeId_add: number;
  saReceiveDamageRate: number;
  defPlayerDmgCorrectRate_Physics: number;
  defPlayerDmgCorrectRate_Magic: number;
  defPlayerDmgCorrectRate_Fire: number;
  defPlayerDmgCorrectRate_Thunder: number;
  defPlayerDmgCorrectRate_Dark: number;
  defEnemyDmgCorrectRate_Physics: number;
  defEnemyDmgCorrectRate_Magic: number;
  defEnemyDmgCorrectRate_Fire: number;
  defEnemyDmgCorrectRate_Thunder: number;
  defEnemyDmgCorrectRate_Dark: number;
  defObjDmgCorrectRate: number;
  atkPlayerDmgCorrectRate_Physics: number;
  atkPlayerDmgCorrectRate_Magic: number;
  atkPlayerDmgCorrectRate_Fire: number;
  atkPlayerDmgCorrectRate_Thunder: number;
  atkPlayerDmgCorrectRate_Dark: number;
  atkEnemyDmgCorrectRate_Physics: number;
  atkEnemyDmgCorrectRate_Magic: number;
  atkEnemyDmgCorrectRate_Fire: number;
  atkEnemyDmgCorrectRate_Thunder: number;
  atkEnemyDmgCorrectRate_Dark: number;
  registFreezeChangeRate: number;
  invocationConditionsStateChange1: number;
  invocationConditionsStateChange2: number;
  invocationConditionsStateChange3: number;
  hearingAiSoundLevel: number;
  chrProxyHeightRate: number;
  addAwarePointCorrectValue_forMe: number;
  addAwarePointCorrectValue_forTarget: number;
  sightSearchEnemyAdd: number;
  sightSearchAdd: number;
  hearingSearchAdd: number;
  hearingSearchRate: number;
  hearingSearchEnemyAdd: number;
  value_Magnification: number;
  artsConsumptionRate: number;
  magicConsumptionRate: number;
  shamanConsumptionRate: number;
  miracleConsumptionRate: number;
  changeHpEstusFlaskRate: number;
  changeHpEstusFlaskPoint: number;
  changeMpEstusFlaskRate: number;
  changeMpEstusFlaskPoint: number;
  changeHpEstusFlaskCorrectRate: number;
  changeMpEstusFlaskCorrectRate: number;
  applyIdOnGetSoul: number;
  extendLifeRate: number;
  contractLifeRate: number;
  defObjectAttackPowerRate: number;
  effectEndDeleteDecalGroupId: number;
  addLifeForceStatus: number;
  addWillpowerStatus: number;
  addEndureStatus: number;
  addVitalityStatus: number;
  addStrengthStatus: number;
  addDexterityStatus: number;
  addMagicStatus: number;
  addFaithStatus: number;
  addLuckStatus: number;
  deleteCriteriaDamage: number;
  magicSubCategoryChange3: number;
  spAttributeVariationValue: number;
  atkFlickPower: number;
  wetConditionDepth: number;
  changeSaRecoveryVelocity: number;
  regainRate: number;
  saAttackPowerRate: number;
  sleepAttackPower: number;
  madnessAttackPower: number;
  registSleepChangeRate: number;
  registMadnessChangeRate: number;
  changeSleepResistPoint: number;
  changeMadnessResistPoint: number;
  sleepDamageRate: number;
  applyPartsGroup: number;
  clearTarget: number;
  fakeTargetIgnoreAjin: number;
  fakeTargetIgnoreMirageArts: number;
  requestForceJoinBlackSOS_B: number;
  isDestinedDeathHpMult: number;
  isHpBurnEffect: number;
  unknown_0x352_6: number;
  unknown_0x352_7: number;
  unknown_0x353_0: number;
  unknown_0x353_1: number;
  unknown_0x353_2: number;
  unknown_0x353_3: number;
  unknown_0x353_4: number;
  unknown_0x353_5: number;
  changeSuperArmorPoint: number;
  changeSaPoint: number;
  hugeEnemyPickupHeightOverwrite: number;
  poisonDefDamageRate: number;
  diseaseDefDamageRate: number;
  bloodDefDamageRate: number;
  curseDefDamageRate: number;
  freezeDefDamageRate: number;
  sleepDefDamageRate: number;
  madnessDefDamageRate: number;
  overwrite_maxBackhomeDist: number;
  overwrite_backhomeDist: number;
  overwrite_backhomeBattleDist: number;
  overwrite_BackHome_LookTargetDist: number;
  goodsConsumptionRate: number;
  guardStaminaMult: number;
  spiritDeathSpEffectId: number;
}

// EquipParamWeapon.param
type AttackBaseMap = {
  [key in `attackBase${ParamDamageType}`]: number;
};
type CorrectTypeMap = {
  [key in `correctType_${ParamDamageType}`]: number;
};
export type EquipParamWeaponAttribute = "Strength" | "Agility" | "Magic" | "Faith" | "Luck";
type EquipParamCorrectAttributeMap = {
  [key in `correct${ParamDamageType}`]: number;
};
export type EquipParamWeaponMap = Map<number, EquipParamWeapon>;

export interface EquipParamWeapon
  extends AttackBaseMap,
    CorrectTypeMap,
    EquipParamCorrectAttributeMap {
  id: number;
  disableParam_NT: number;
  disableParamReserve1: number;
  disableParamReserve2: number;
  behaviorVariationId: number;
  sortId: number;
  wanderingEquipId: number;
  weight: number;
  weaponWeightRate: number;
  fixPrice: number;
  reinforcePrice: number;
  sellValue: number;
  correctStrength: number;
  correctAgility: number;
  correctMagic: number;
  correctFaith: number;
  correctLuck: number;
  physGuardCutRate: number;
  magGuardCutRate: number;
  fireGuardCutRate: number;
  thunGuardCutRate: number;
  spEffectBehaviorId0: number;
  spEffectBehaviorId1: number;
  spEffectBehaviorId2: number;
  residentSpEffectId: number;
  residentSpEffectId1: number;
  residentSpEffectId2: number;
  materialSetId: number;
  originEquipWep: number;
  originEquipWep1: number;
  originEquipWep2: number;
  originEquipWep3: number;
  originEquipWep4: number;
  originEquipWep5: number;
  originEquipWep6: number;
  originEquipWep7: number;
  originEquipWep8: number;
  originEquipWep9: number;
  originEquipWep10: number;
  originEquipWep11: number;
  originEquipWep12: number;
  originEquipWep13: number;
  originEquipWep14: number;
  originEquipWep15: number;
  weakA_DamageRate: number;
  weakB_DamageRate: number;
  weakC_DamageRate: number;
  weakD_DamageRate: number;
  sleepGuardResist_MaxCorrect: number;
  madnessGuardResist_MaxCorrect: number;
  saWeaponDamage: number;
  equipModelId: number;
  iconId: number;
  durability: number;
  durabilityMax: number;
  attackThrowEscape: number;
  parryDamageLife: number;
  attackBaseStamina: number;
  guardAngle: number;
  saDurability: number;
  staminaGuardDef: number;
  reinforceTypeId: number;
  trophySGradeId: number;
  trophySeqId: number;
  throwAtkRate: number;
  bowDistRate: number;
  equipModelCategory: number;
  equipModelGender: number;
  weaponCategory: number;
  wepmotionCategory: number;
  guardmotionCategory: number;
  atkMaterial: number;
  defSeMaterial1: number;
  spAttribute: number;
  spAtkcategory: number;
  wepmotionOneHandId: number;
  wepmotionBothHandId: number;
  properStrength: number;
  properAgility: number;
  properMagic: number;
  properFaith: number;
  overStrength: number;
  attackBaseParry: number;
  defenseBaseParry: number;
  guardBaseRepel: number;
  attackBaseRepel: number;
  guardCutCancelRate: number;
  guardLevel: number;
  slashGuardCutRate: number;
  blowGuardCutRate: number;
  thrustGuardCutRate: number;
  poisonGuardResist: number;
  diseaseGuardResist: number;
  bloodGuardResist: number;
  curseGuardResist: number;
  atkAttribute: number;
  rightHandEquipable: number;
  leftHandEquipable: number;
  bothHandEquipable: number;
  arrowSlotEquipable: number;
  boltSlotEquipable: number;
  enableGuard: number;
  enableParry: number;
  enableMagic: number;
  enableSorcery: number;
  enableMiracle: number;
  enableVowMagic: number;
  isNormalAttackType: number;
  isBlowAttackType: number;
  isSlashAttackType: number;
  isThrustAttackType: number;
  isEnhance: number;
  isHeroPointCorrect: number;
  isCustom: number;
  disableBaseChangeReset: number;
  disableRepair: number;
  isDarkHand: number;
  simpleModelForDlc: number;
  lanternWep: number;
  isVersusGhostWep: number;
  baseChangeCategory: number;
  isDragonSlayer: number;
  isDeposit: number;
  disableMultiDropShare: number;
  isDiscard: number;
  isDrop: number;
  showLogCondType: number;
  enableThrow: number;
  showDialogCondType: number;
  disableGemAttr: number;
  defSfxMaterial1: number;
  wepCollidableType0: number;
  wepCollidableType1: number;
  postureControlId_Right: number;
  postureControlId_Left: number;
  traceSfxId0: number;
  traceDmyIdHead0: number;
  traceDmyIdTail0: number;
  traceSfxId1: number;
  traceDmyIdHead1: number;
  traceDmyIdTail1: number;
  traceSfxId2: number;
  traceDmyIdHead2: number;
  traceDmyIdTail2: number;
  traceSfxId3: number;
  traceDmyIdHead3: number;
  traceDmyIdTail3: number;
  traceSfxId4: number;
  traceDmyIdHead4: number;
  traceDmyIdTail4: number;
  traceSfxId5: number;
  traceDmyIdHead5: number;
  traceDmyIdTail5: number;
  traceSfxId6: number;
  traceDmyIdHead6: number;
  traceDmyIdTail6: number;
  traceSfxId7: number;
  traceDmyIdHead7: number;
  traceDmyIdTail7: number;
  defSfxMaterial2: number;
  defSeMaterial2: number;
  absorpParamId: number;
  toughnessCorrectRate: number;
  isValidTough_ProtSADmg: number;
  isDualBlade: number;
  isAutoEquip: number;
  isEnableEmergencyStep: number;
  invisibleOnRemo: number;
  unknown_0x17c_5: number;
  unknown_0x17c_6: number;
  unknown_0x17c_7: number;
  weakE_DamageRate: number;
  weakF_DamageRate: number;
  darkGuardCutRate: number;
  correctType_Poison: number;
  sortGroupId: number;
  atkAttribute2: number;
  sleepGuardResist: number;
  madnessGuardResist: number;
  correctType_Blood: number;
  properLuck: number;
  freezeGuardResist: number;
  autoReplenishType: number;
  swordArtsParamId: number;

  arrowBoltEquipId: number;
  DerivationLevelType: number;
  enchantSfxSize: number;
  wepType: number;
  physGuardCutRate_MaxCorrect: number;
  magGuardCutRate_MaxCorrect: number;
  fireGuardCutRate_MaxCorrect: number;
  thunGuardCutRate_MaxCorrect: number;
  darkGuardCutRate_MaxCorrect: number;
  poisonGuardResist_MaxCorrect: number;
  diseaseGuardResist_MaxCorrect: number;
  bloodGuardResist_MaxCorrect: number;
  curseGuardResist_MaxCorrect: number;
  freezeGuardResist_MaxCorrect: number;
  staminaGuardDef_MaxCorrect: number;
  residentSfxId_1: number;
  residentSfxId_2: number;
  residentSfxId_3: number;
  residentSfxId_4: number;
  residentSfx_DmyId_1: number;
  residentSfx_DmyId_2: number;
  residentSfx_DmyId_3: number;
  residentSfx_DmyId_4: number;
  staminaConsumptionRate: number;
  vsPlayerDmgCorrectRate_Physics: number;
  vsPlayerDmgCorrectRate_Magic: number;
  vsPlayerDmgCorrectRate_Fire: number;
  vsPlayerDmgCorrectRate_Thunder: number;
  vsPlayerDmgCorrectRate_Dark: number;
  vsPlayerDmgCorrectRate_Poison: number;
  vsPlayerDmgCorrectRate_Blood: number;
  vsPlayerDmgCorrectRate_Freeze: number;
  attainmentWepStatusStr: number;
  attainmentWepStatusDex: number;
  attainmentWepStatusMag: number;
  attainmentWepStatusFai: number;
  attainmentWepStatusLuc: number;
  attackElementCorrectId: number;
  saleValue: number;
  reinforceShopCategory: number;
  maxArrowQuantity: number;
  residentSfx_1_IsVisibleForHang: number;
  residentSfx_2_IsVisibleForHang: number;
  residentSfx_3_IsVisibleForHang: number;
  residentSfx_4_IsVisibleForHang: number;
  isSoulParamIdChange_model0: number;
  isSoulParamIdChange_model1: number;
  isSoulParamIdChange_model2: number;
  isSoulParamIdChange_model3: number;
  wepSeIdOffset: number;
  baseChangePrice: number;
  levelSyncCorrectId: number;
  correctType_Sleep: number;
  correctType_Madness: number;
  rarity: number;
  gemMountType: number;
  wepRegainHp: number;
  spEffectMsgId0: number;
  spEffectMsgId1: number;
  spEffectMsgId2: number;
  originEquipWep16: number;
  originEquipWep17: number;
  originEquipWep18: number;
  originEquipWep19: number;
  originEquipWep20: number;
  originEquipWep21: number;
  originEquipWep22: number;
  originEquipWep23: number;
  originEquipWep24: number;
  originEquipWep25: number;
  vsPlayerDmgCorrectRate_Sleep: number;
  vsPlayerDmgCorrectRate_Madness: number;
  saGuardCutRate: number;
  defMaterialVariationValue: number;
  spAttributeVariationValue: number;
  stealthAtkRate: number;
  vsPlayerDmgCorrectRate_Disease: number;
  vsPlayerDmgCorrectRate_Curse: number;
  restrictSpecialSwordArt: number;
  pad: number;
}

// SwordArtsParam.param
export type SwordArtsParamMap = Map<number, SwordArtsParam>;
export interface SwordArtsParam {
  id: number; // Added this
  paramdexName: string;
  disableParam_NT: number;
  disableParamReserve1: number;
  disableParamReserve2: number;
  swordArtsType: number;
  artsSpeedType: number;
  refStatus: number;
  isRefRightArts: number;
  isGrayoutLeftHand: number;
  isGrayoutRightHand: number;
  isGrayoutBothHand: number;
  reserve2: number;
  usePoint_L1: number;
  usePoint_L2: number;
  usePoint_R1: number;
  usePoint_R2: number;
  textId: number;
  useMagicPoint_L1: number;
  useMagicPoint_L2: number;
  useMagicPoint_R1: number;
  useMagicPoint_R2: number;
  swordArtsTypeNew: number;
  iconId: number;
  aiUsageId: number;
}

// EquipParamGem.param
type CanMountWeaponTypes = { [key in `canMountWep_${EquipParamWeaponType}`]: number };
export type EquipParamGemMap = Map<number, EquipParamGem>;
export interface EquipParamGem extends CanMountWeaponTypes {
  name: string; // Added this
  id: number;
  paramdexName: string;
  disableParam_NT: number;
  disableParamReserve1: number;
  disableParamReserve2: number;
  iconId: number;
  rank: number;
  sortGroupId: number;
  spEffectId0: number;
  spEffectId1: number;
  spEffectId2: number;
  itemGetTutorialFlagId: number;
  swordArtsParamId: number;
  mountValue: number;
  sellValue: number;
  saleValue: number;
  sortId: number;
  compTrophySedId: number;
  trophySeqId: number;
  configurableWepAttr00: number;
  configurableWepAttr01: number;
  configurableWepAttr02: number;
  configurableWepAttr03: number;
  configurableWepAttr04: number;
  configurableWepAttr05: number;
  configurableWepAttr06: number;
  configurableWepAttr07: number;
  configurableWepAttr08: number;
  configurableWepAttr09: number;
  configurableWepAttr10: number;
  configurableWepAttr11: number;
  configurableWepAttr12: number;
  configurableWepAttr13: number;
  configurableWepAttr14: number;
  configurableWepAttr15: number;
  rarity: number;
  configurableWepAttr16: number;
  configurableWepAttr17: number;
  configurableWepAttr18: number;
  configurableWepAttr19: number;
  configurableWepAttr20: number;
  configurableWepAttr21: number;
  configurableWepAttr22: number;
  configurableWepAttr23: number;
  isDiscard: number;
  isDrop: number;
  isDeposit: number;
  disableMultiDropShare: number;
  showDialogCondType: number;
  showLogCondType: number;
  pad: number;
  defaultWepAttr: number;
  isSpecialSwordArt: number;
  pad2: number;
  reserved_canMountWep_0x3d_4: number;
  reserved2_canMountWep: number;
  spEffectMsgId0: number;
  spEffectMsgId1: number;
  spEffectId_forAtk0: number;
  spEffectId_forAtk1: number;
  spEffectId_forAtk2: number;
  mountWepTextId: number;
  pad6: number;
}

// AtkParam_Pc.param
export type AtkParamPcMap = Map<number, AtkParamPc>;
export type AtkParamAttributeShorthand = "Phys" | "Mag" | "Fire" | "Thun" | "Dark";
type AtkParamAtk = { [key in `atk${AtkParamAttributeShorthand}`]: number };
type AtkParamAtkCorrection = { [key in `atk${AtkParamAttributeShorthand}Correction`]: number };
export interface AtkParamPc extends AtkParamAtk, AtkParamAtkCorrection {
  hit0_Radius: number;
  hit1_Radius: number;
  hit2_Radius: number;
  hit3_Radius: number;
  knockbackDist: number;
  hitStopTime: number;
  spEffectId0: number;
  spEffectId1: number;
  spEffectId2: number;
  spEffectId3: number;
  spEffectId4: number;
  hit0_DmyPoly1: number;
  hit1_DmyPoly1: number;
  hit2_DmyPoly1: number;
  hit3_DmyPoly1: number;
  hit0_DmyPoly2: number;
  hit1_DmyPoly2: number;
  hit2_DmyPoly2: number;
  hit3_DmyPoly2: number;
  blowingCorrection: number;
  atkStamCorrection: number;
  guardAtkRateCorrection: number;
  guardBreakCorrection: number;
  atkThrowEscapeCorrection: number;
  subCategory1: number;
  subCategory2: number;
  atkStam: number;
  guardAtkRate: number;
  guardBreakRate: number;
  pad6: number;
  isEnableCalcDamageForBushesObj: number;
  atkThrowEscape: number;
  atkObj: number;
  guardStaminaCutRate: number;
  guardRate: number;
  throwTypeId: number;
  hit0_hitType: number;
  hit1_hitType: number;
  hit2_hitType: number;
  hit3_hitType: number;
  hti0_Priority: number;
  hti1_Priority: number;
  hti2_Priority: number;
  hti3_Priority: number;
  dmgLevel: number;
  mapHitType: number;
  guardCutCancelRate: number;
  atkAttribute: number;
  spAttribute: number;
  atkType: number;
  atkMaterial: number;
  guardRangeType: number;
  defSeMaterial1: number;
  hitSourceType: number;
  throwFlag: number;
  disableGuard: number;
  disableStaminaAttack: number;
  disableHitSpEffect: number;
  IgnoreNotifyMissSwingForAI: number;
  repeatHitSfx: number;
  isArrowAtk: number;
  isGhostAtk: number;
  isDisableNoDamage: number;
  atkPow_forSfx: number;
  atkDir_forSfx: number;
  opposeTarget: number;
  friendlyTarget: number;
  selfTarget: number;
  isCheckDoorPenetration: number;
  isVsRideAtk: number;
  isAddBaseAtk: number;
  excludeThreatLvNotify: number;
  pad1: number;
  atkBehaviorId: number;
  atkPow_forSe: number;
  atkSuperArmor: number;
  decalId1: number;
  decalId2: number;
  AppearAiSoundId: number;
  HitAiSoundId: number;
  HitRumbleId: number;
  HitRumbleIdByNormal: number;
  HitRumbleIdByMiddle: number;
  HitRumbleIdByRoot: number;
  traceSfxId0: number;
  traceDmyIdHead0: number;
  traceDmyIdTail0: number;
  traceSfxId1: number;
  traceDmyIdHead1: number;
  traceDmyIdTail1: number;
  traceSfxId2: number;
  traceDmyIdHead2: number;
  traceDmyIdTail2: number;
  traceSfxId3: number;
  traceDmyIdHead3: number;
  traceDmyIdTail3: number;
  traceSfxId4: number;
  traceDmyIdHead4: number;
  traceDmyIdTail4: number;
  traceSfxId5: number;
  traceDmyIdHead5: number;
  traceDmyIdTail5: number;
  traceSfxId6: number;
  traceDmyIdHead6: number;
  traceDmyIdTail6: number;
  traceSfxId7: number;
  traceDmyIdHead7: number;
  traceDmyIdTail7: number;
  hit4_Radius: number;
  hit5_Radius: number;
  hit6_Radius: number;
  hit7_Radius: number;
  hit8_Radius: number;
  hit9_Radius: number;
  hit10_Radius: number;
  hit11_Radius: number;
  hit12_Radius: number;
  hit13_Radius: number;
  hit14_Radius: number;
  hit15_Radius: number;
  hit4_DmyPoly1: number;
  hit5_DmyPoly1: number;
  hit6_DmyPoly1: number;
  hit7_DmyPoly1: number;
  hit8_DmyPoly1: number;
  hit9_DmyPoly1: number;
  hit10_DmyPoly1: number;
  hit11_DmyPoly1: number;
  hit12_DmyPoly1: number;
  hit13_DmyPoly1: number;
  hit14_DmyPoly1: number;
  hit15_DmyPoly1: number;
  hit4_DmyPoly2: number;
  hit5_DmyPoly2: number;
  hit6_DmyPoly2: number;
  hit7_DmyPoly2: number;
  hit8_DmyPoly2: number;
  hit9_DmyPoly2: number;
  hit10_DmyPoly2: number;
  hit11_DmyPoly2: number;
  hit12_DmyPoly2: number;
  hit13_DmyPoly2: number;
  hit14_DmyPoly2: number;
  hit15_DmyPoly2: number;
  hit4_hitType: number;
  hit5_hitType: number;
  hit6_hitType: number;
  hit7_hitType: number;
  hit8_hitType: number;
  hit9_hitType: number;
  hit10_hitType: number;
  hit11_hitType: number;
  hit12_hitType: number;
  hit13_hitType: number;
  hit14_hitType: number;
  hit15_hitType: number;
  hti4_Priority: number;
  hti5_Priority: number;
  hti6_Priority: number;
  hti7_Priority: number;
  hti8_Priority: number;
  hti9_Priority: number;
  hti10_Priority: number;
  hti11_Priority: number;
  hti12_Priority: number;
  hti13_Priority: number;
  hti14_Priority: number;
  hti15_Priority: number;
  defSfxMaterial1: number;
  defSeMaterial2: number;
  defSfxMaterial2: number;
  pad5: number;
  isDisableParry: number;
  isDisableBothHandsAtkBonus: number;
  isInvalidatedByNoDamageInAir: number;
  pad2: number;
  dmgLevel_vsPlayer: number;
  statusAilmentAtkPowerCorrectRate: number;
  spEffectAtkPowerCorrectRate_byPoint: number;
  spEffectAtkPowerCorrectRate_byRate: number;
  spEffectAtkPowerCorrectRate_byDmg: number;
  atkBehaviorId_2: number;
  throwDamageAttribute: number;
  statusAilmentAtkPowerCorrectRate_byPoint: number;
  overwriteAttackElementCorrectId: number;
  decalBaseId1: number;
  decalBaseId2: number;
  wepRegainHpScale: number;
  atkRegainHp: number;
  regainableTimeScale: number;
  regainableHpRateScale: number;
  regainableSlotId: number;
  spAttributeVariationValue: number;
  parryForwardOffset: number;
  atkSuperArmorCorrection: number;
  defSfxMaterialVariationValue: number;
  pad4: number[];
  finalDamageRateId: number;
  subCategory3: number;
  subCategory4: number;
  pad7: number[];
}

export type EquipParamWeaponType =
  | "Dagger"
  | "SwordNormal"
  | "SwordLarge"
  | "SwordGigantic"
  | "SaberNormal"
  | "SaberLarge"
  | "katana"
  | "SwordDoubleEdge"
  | "SwordPierce"
  | "RapierHeavy"
  | "AxeNormal"
  | "AxeLarge"
  | "HammerNormal"
  | "HammerLarge"
  | "Flail"
  | "SpearNormal"
  | "SpearHeavy"
  | "SpearAxe"
  | "Sickle"
  | "Knuckle"
  | "Claw"
  | "Whip"
  | "AxhammerLarge"
  | "BowSmall"
  | "BowNormal"
  | "BowLarge"
  | "ClossBow"
  | "Ballista"
  | "Staff"
  | "Talisman"
  | "ShieldSmall"
  | "ShieldNormal"
  | "ShieldLarge"
  | "Torch"
  | "HandToHand"
  | "PerfumeBottle"
  | "ThrustingShield"
  | "ThrowingWeapon"
  | "ReverseHandSword"
  | "LightGreatsword"
  | "GreatKatana"
  | "BeastClaw";

export const weaponTypeMap: Map<WeaponType, `canMountWep_${EquipParamWeaponType}`> = new Map([
  [WeaponType.DAGGER, "canMountWep_Dagger"],
  [WeaponType.STRAIGHT_SWORD, "canMountWep_SwordNormal"],
  [WeaponType.GREATSWORD, "canMountWep_SwordLarge"],
  [WeaponType.COLOSSAL_SWORD, "canMountWep_SwordGigantic"],
  [WeaponType.CURVED_SWORD, "canMountWep_SaberNormal"],
  [WeaponType.CURVED_GREATSWORD, "canMountWep_SaberLarge"],
  [WeaponType.KATANA, "canMountWep_katana"],
  [WeaponType.TWINBLADE, "canMountWep_SwordDoubleEdge"],
  [WeaponType.THRUSTING_SWORD, "canMountWep_SwordPierce"],
  [WeaponType.HEAVY_THRUSTING_SWORD, "canMountWep_RapierHeavy"],
  [WeaponType.AXE, "canMountWep_AxeNormal"],
  [WeaponType.GREATAXE, "canMountWep_AxeLarge"],
  [WeaponType.HAMMER, "canMountWep_HammerNormal"],
  [WeaponType.GREAT_HAMMER, "canMountWep_HammerLarge"],
  [WeaponType.FLAIL, "canMountWep_Flail"],
  [WeaponType.SPEAR, "canMountWep_SpearNormal"],
  [WeaponType.GREAT_SPEAR, "canMountWep_SpearHeavy"],
  [WeaponType.HALBERD, "canMountWep_SpearAxe"],
  [WeaponType.REAPER, "canMountWep_Sickle"],
  [WeaponType.FIST, "canMountWep_Knuckle"],
  [WeaponType.CLAW, "canMountWep_Claw"],
  [WeaponType.WHIP, "canMountWep_Whip"],
  [WeaponType.COLOSSAL_WEAPON, "canMountWep_AxhammerLarge"],
  [WeaponType.LIGHT_BOW, "canMountWep_BowSmall"],
  [WeaponType.BOW, "canMountWep_BowNormal"],
  [WeaponType.GREATBOW, "canMountWep_BowLarge"],
  [WeaponType.CROSSBOW, "canMountWep_ClossBow"],
  [WeaponType.BALLISTA, "canMountWep_Ballista"],
  [WeaponType.GLINTSTONE_STAFF, "canMountWep_Staff"],
  [WeaponType.SACRED_SEAL, "canMountWep_Talisman"],
  [WeaponType.SMALL_SHIELD, "canMountWep_ShieldSmall"],
  [WeaponType.MEDIUM_SHIELD, "canMountWep_ShieldNormal"],
  [WeaponType.GREATSHIELD, "canMountWep_ShieldLarge"],
  [WeaponType.TORCH, "canMountWep_Torch"],
  [WeaponType.HAND_TO_HAND, "canMountWep_HandToHand"],
  [WeaponType.PERFUME_BOTTLE, "canMountWep_PerfumeBottle"],
  [WeaponType.THRUSTING_SHIELD, "canMountWep_ThrustingShield"],
  [WeaponType.THROWING_BLADE, "canMountWep_ThrowingWeapon"],
  [WeaponType.BACKHAND_BLADE, "canMountWep_ReverseHandSword"],
  [WeaponType.LIGHT_GREATSWORD, "canMountWep_LightGreatsword"],
  [WeaponType.GREAT_KATANA, "canMountWep_GreatKatana"],
  [WeaponType.BEAST_CLAW, "canMountWep_BeastClaw"],
]);

export const affinityMap: Map<number, { name: string; equipParamGemKey: keyof EquipParamGem }> =
  new Map([
    [0, { name: "Standard", equipParamGemKey: "configurableWepAttr00" }],
    [1, { name: "Heavy", equipParamGemKey: "configurableWepAttr01" }],
    [2, { name: "Keen", equipParamGemKey: "configurableWepAttr02" }],
    [3, { name: "Quality", equipParamGemKey: "configurableWepAttr03" }],
    [4, { name: "Fire", equipParamGemKey: "configurableWepAttr04" }],
    [5, { name: "Flame Art", equipParamGemKey: "configurableWepAttr05" }],
    [6, { name: "Lightning", equipParamGemKey: "configurableWepAttr06" }],
    [7, { name: "Sacred", equipParamGemKey: "configurableWepAttr07" }],
    [8, { name: "Magic", equipParamGemKey: "configurableWepAttr08" }],
    [9, { name: "Cold", equipParamGemKey: "configurableWepAttr09" }],
    [10, { name: "Poison", equipParamGemKey: "configurableWepAttr10" }],
    [11, { name: "Blood", equipParamGemKey: "configurableWepAttr11" }],
    [12, { name: "Occult", equipParamGemKey: "configurableWepAttr12" }],
  ]);

export const EXCLUDE_GEM_SET = new Map([
  [10, "test gem 1"],
  [20, "test gem 2"],
  [30, "test gem 3"],
]);
