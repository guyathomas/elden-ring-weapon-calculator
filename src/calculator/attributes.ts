// Calculator Types
export const damageAttributes = ["str", "dex", "int", "fai", "arc"] as const;
export const nonDamageAttributes = ["vig", "min", "end"] as const;
export const allAttributes = [...damageAttributes, ...nonDamageAttributes] as const;
export const allAttributesAndLvl = [...allAttributes, "lvl"] as const;
export type DamageAttribute = typeof damageAttributes[number];
export type NonDamageAttribute = typeof nonDamageAttributes[number];
export type AllAttribute = typeof allAttributes[number];
export type AllAttributeAndLevel = typeof allAttributesAndLvl[number];
export type DamageAttributeValues = Record<DamageAttribute, number>;

