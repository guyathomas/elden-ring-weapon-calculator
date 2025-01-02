import { Typography } from "@mui/material";
import {
  AttackPowerType,
  allAttackPowerTypes,
  allDamageTypes,
  allStatusTypes,
  damageAttributes,
} from "../../calculator/calculator";
import {
  damageTypeIcons,
  damageTypeLabels,
  getAttributeLabel,
  getShortAttributeLabel,
  getTotalDamageAttackPower,
} from "../uiUtils";
import type { WeaponTableColumnDef, WeaponTableColumnGroupDef } from "./FixedWeaponTable";
import {
  WeaponNameRenderer,
  ScalingRenderer,
  AttributeRequirementRenderer,
  AttackPowerRenderer,
  OptimizedAttributeRenderer,
} from "./tableRenderers";

const nameColumn: WeaponTableColumnDef = {
  key: "name",
  sortBy: "name",
  header: (
    <Typography component="span" variant="subtitle2">
      Weapon
    </Typography>
  ),
  sx: {
    justifyContent: "start",
  },
  render({ weapon, weaponAttackData: { upgradeLevel } }) {
    return (
      <WeaponNameRenderer
        weapon={weapon}
        upgradeLevel={upgradeLevel}
        isExpanded={false} // TODO: implement this
        toggleIsExpanded={() => undefined} // TODO: implement this
      />
    );
  },
};

const attackColumns = Object.fromEntries(
  allAttackPowerTypes.map((attackPowerType): [AttackPowerType, WeaponTableColumnDef] => [
    attackPowerType,
    {
      key: `${attackPowerType}Attack`,
      sortBy: `${attackPowerType}Attack`,
      header: damageTypeIcons.has(attackPowerType) ? (
        <img
          src={damageTypeIcons.get(attackPowerType)!}
          alt={damageTypeLabels.get(attackPowerType)!}
          title={damageTypeLabels.get(attackPowerType)!}
          width={24}
          height={24}
        />
      ) : (
        <Typography component="span" variant="subtitle2">
          {damageTypeLabels.get(attackPowerType)}
        </Typography>
      ),
      render({ weaponAttackData: { attackPower, ineffectiveAttackPowerTypes } }) {
        return (
          <AttackPowerRenderer
            value={attackPower[attackPowerType]}
            ineffective={ineffectiveAttackPowerTypes.includes(attackPowerType)}
          />
        );
      },
    },
  ]),
) as Record<AttackPowerType, WeaponTableColumnDef>;

const splitSpellScalingColumns: WeaponTableColumnDef[] = allDamageTypes.map((damageType) => ({
  key: `${damageType}SpellScaling`,
  sortBy: `${damageType}SpellScaling`,
  header: damageTypeIcons.has(damageType) ? (
    <img
      src={damageTypeIcons.get(damageType)!}
      alt={damageTypeLabels.get(damageType)!}
      title={damageTypeLabels.get(damageType)!}
      width={24}
      height={24}
    />
  ) : (
    <Typography component="span" variant="subtitle2">
      {damageTypeLabels.get(damageType)}
    </Typography>
  ),
  render({ weaponAttackData: { spellScaling, ineffectiveAttackPowerTypes } }) {
    return (
      <AttackPowerRenderer
        value={spellScaling?.[damageType]}
        ineffective={ineffectiveAttackPowerTypes.includes(damageType)}
      />
    );
  },
}));

const spellScalingColumn: WeaponTableColumnDef = {
  key: "spellScaling",
  sortBy: `${AttackPowerType.MAGIC}SpellScaling`,
  header: (
    <Typography component="span" variant="subtitle2">
      Spell scaling
    </Typography>
  ),
  render({ weapon, weaponAttackData: { spellScaling, ineffectiveAttackPowerTypes } }) {
    let attackPowerType: AttackPowerType | undefined;
    if (weapon.sorceryTool) {
      attackPowerType = AttackPowerType.MAGIC;
    } else if (weapon.incantationTool) {
      attackPowerType = AttackPowerType.HOLY;
    }

    return (
      <AttackPowerRenderer
        value={attackPowerType != null ? spellScaling?.[attackPowerType] : undefined}
        ineffective={
          attackPowerType != null && ineffectiveAttackPowerTypes.includes(attackPowerType)
        }
      />
    );
  },
};

const totalSplitAttackPowerColumn: WeaponTableColumnDef = {
  key: "totalAttack",
  sortBy: "totalAttack",
  header: (
    <Typography component="span" variant="subtitle2">
      Total
    </Typography>
  ),
  render({ weaponAttackData: { attackPower, ineffectiveAttackPowerTypes } }) {
    return (
      <AttackPowerRenderer
        value={getTotalDamageAttackPower(attackPower)}
        ineffective={ineffectiveAttackPowerTypes.some((attackPowerType) =>
          allDamageTypes.includes(attackPowerType),
        )}
      />
    );
  },
};

const totalAttackPowerColumn: WeaponTableColumnDef = {
  key: "totalAttack",
  sortBy: "totalAttack",
  header: (
    <Typography component="span" variant="subtitle2">
      Attack Power
    </Typography>
  ),
  render({ weaponAttackData: { attackPower, ineffectiveAttackPowerTypes } }) {
    return (
      <AttackPowerRenderer
        value={getTotalDamageAttackPower(attackPower)}
        ineffective={ineffectiveAttackPowerTypes.some((attackPowerType) =>
          allDamageTypes.includes(attackPowerType),
        )}
      />
    );
  },
};

const scalingColumns: WeaponTableColumnDef[] = damageAttributes.map((attribute) => ({
  key: `${attribute}Scaling`,
  sortBy: `${attribute}Scaling`,
  header: (
    <Typography
      component="span"
      variant="subtitle2"
      title={`${getAttributeLabel(attribute)} Scaling`}
    >
      {getShortAttributeLabel(attribute)}
    </Typography>
  ),
  render({ weapon, weaponAttackData: { upgradeLevel } }) {
    return <ScalingRenderer weapon={weapon} upgradeLevel={upgradeLevel} attribute={attribute} />;
  },
}));

const numericalScalingColumns: WeaponTableColumnDef[] = damageAttributes.map((attribute) => ({
  key: `${attribute}Scaling`,
  sortBy: `${attribute}Scaling`,
  header: (
    <Typography
      component="span"
      variant="subtitle2"
      title={`${getAttributeLabel(attribute)} Scaling`}
    >
      {getShortAttributeLabel(attribute)}
    </Typography>
  ),
  render({ weapon, weaponAttackData: { upgradeLevel } }) {
    return (
      <ScalingRenderer
        weapon={weapon}
        upgradeLevel={upgradeLevel}
        attribute={attribute}
        numerical
      />
    );
  },
}));

const requirementColumns: WeaponTableColumnDef[] = damageAttributes.map(
  (attribute): WeaponTableColumnDef => ({
    key: `${attribute}Requirement`,
    sortBy: `${attribute}Requirement`,
    header: (
      <Typography
        component="span"
        variant="subtitle2"
        title={`${getAttributeLabel(attribute)} Requirement`}
      >
        {getShortAttributeLabel(attribute)}
      </Typography>
    ),
    render({ weapon, weaponAttackData: { ineffectiveAttributes } }) {
      return (
        <AttributeRequirementRenderer
          weapon={weapon}
          attribute={attribute}
          ineffective={ineffectiveAttributes.includes(attribute)}
        />
      );
    },
  }),
);

function getSpellScalingColumns({
  spellScaling,
  splitSpellScaling,
}: {
  splitSpellScaling: boolean;
  spellScaling: boolean;
}) {
  let spellScalingColumnGroup: WeaponTableColumnGroupDef[] = [];

  if (spellScaling) {
    if (splitSpellScaling) {
      spellScalingColumnGroup = [
        {
          key: "spellScaling",
          sx: {
            width: 40 * splitSpellScalingColumns.length + 27,
            flex: 1,
          },
          header: "Spell Scaling",
          columns: splitSpellScalingColumns,
        },
      ];
    } else {
      spellScalingColumnGroup = [
        {
          key: "spellScaling",
          sx: {
            width: 128,
            flex: 1,
          },
          columns: [spellScalingColumn],
        },
      ];
    }
  }
  return spellScalingColumnGroup;
}

const attackPowerEfficiencyColumn: WeaponTableColumnDef = {
  key: `attackPowerEfficiency`,
  sortBy: `attackPowerEfficiency`,
  header: (
    <Typography component="span" variant="subtitle2" title={`Disposable Points`}>
      Eff
    </Typography>
  ),
  render({ weaponAttackData: { efficiencyScore } }) {
    return <OptimizedAttributeRenderer value={efficiencyScore} />;
  },
};

export function getFixedWeaponTableColumns({
  splitDamage,
  splitSpellScaling,
  numericalScaling,
  attackPowerTypes,
  spellScaling,
}: {
  splitDamage: boolean;
  splitSpellScaling: boolean;
  numericalScaling: boolean;
  attackPowerTypes: ReadonlySet<AttackPowerType>;
  spellScaling: boolean;
}): readonly WeaponTableColumnGroupDef[] {
  const includedStatusTypes = allStatusTypes.filter((statusType) =>
    attackPowerTypes.has(statusType),
  );

  return [
    {
      key: "name",
      sx: { flex: 2, minWidth: 160 },
      columns: [nameColumn],
    },
    ...getSpellScalingColumns({ spellScaling, splitSpellScaling }),
    splitDamage
      ? {
          key: "attack",
          sx: {
            width: 40 * (allDamageTypes.length + 1) + 27,
            flex: 1,
          },
          header: "Attack Power",
          columns: [
            ...allDamageTypes.map((damageType) => attackColumns[damageType]),
            totalSplitAttackPowerColumn,
            attackPowerEfficiencyColumn,
          ],
        }
      : {
          key: "attack",
          sx: {
            width: 128,
            flex: 1,
          },
          columns: [totalAttackPowerColumn, attackPowerEfficiencyColumn],
        },
    ...(includedStatusTypes.length > 0
      ? [
          {
            key: "statusEffects",
            sx: {
              width: Math.max(40 * includedStatusTypes.length + 21, 141),
              flex: 1,
            },
            header: "Status Effects",
            columns: includedStatusTypes.map((statusType) => attackColumns[statusType]),
          },
        ]
      : []),
    {
      key: "scaling",
      sx: {
        width: (numericalScaling ? 40 : 36) * scalingColumns.length + 21,
        flex: 1,
      },
      header: "Attribute Scaling",
      columns: numericalScaling ? numericalScalingColumns : scalingColumns,
    },
    {
      key: "requirements",
      sx: {
        width: 36 * requirementColumns.length + 21,
        flex: 1,
      },
      header: "Attributes Required",
      columns: requirementColumns,
    },
  ];
}
