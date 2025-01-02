import { Typography } from "@mui/material";
import {
  AttackPowerType,
  allAttackPowerTypes,
  allDamageTypes,
  allStatusTypes,
  damageAttributes,
} from "../../../calculator/calculator";
import {
  damageTypeIcons,
  damageTypeLabels,
  getAttributeLabel,
  getShortAttributeLabel,
  getTotalDamageAttackPower,
} from "../../uiUtils";
import type {
  FixedAttributeTableColumnDef,
  FixedAttributeTableColumnGroupDef,
} from "./FixedAttributeTable";
import {
  WeaponNameRenderer,
  ScalingRenderer,
  AttributeRequirementRenderer,
  AttackPowerRenderer,
  OptimizedAttributeRenderer,
  ActionRenderer,
} from "../tableRenderers";

export const actionColumn: FixedAttributeTableColumnDef = {
  key: "actions",
  header: null,
  sx: {
    justifyContent: "start",
  },
  render(rowData, expandedState) {
    return <ActionRenderer {...expandedState} />;
  },
};

const nameColumn: FixedAttributeTableColumnDef = {
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
  render({ weapon, upgradeLevel }) {
    return <WeaponNameRenderer weapon={weapon} upgradeLevel={upgradeLevel} />;
  },
};

const attackColumns = Object.fromEntries(
  allAttackPowerTypes.map((attackPowerType): [AttackPowerType, FixedAttributeTableColumnDef] => [
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
) as Record<AttackPowerType, FixedAttributeTableColumnDef>;

const splitSpellScalingColumns: FixedAttributeTableColumnDef[] = allDamageTypes.map(
  (damageType) => ({
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
  }),
);

const spellScalingColumn: FixedAttributeTableColumnDef = {
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

const totalSplitAttackPowerColumn: FixedAttributeTableColumnDef = {
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

const totalAttackPowerColumn: FixedAttributeTableColumnDef = {
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

const scalingColumns: FixedAttributeTableColumnDef[] = damageAttributes.map((attribute) => ({
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
  render({ weapon, upgradeLevel }) {
    return <ScalingRenderer weapon={weapon} upgradeLevel={upgradeLevel} attribute={attribute} />;
  },
}));

const numericalScalingColumns: FixedAttributeTableColumnDef[] = damageAttributes.map(
  (attribute) => ({
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
    render({ weapon, upgradeLevel }) {
      return (
        <ScalingRenderer
          weapon={weapon}
          upgradeLevel={upgradeLevel}
          attribute={attribute}
          numerical
        />
      );
    },
  }),
);

const requirementColumns: FixedAttributeTableColumnDef[] = damageAttributes.map(
  (attribute): FixedAttributeTableColumnDef => ({
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
  let spellScalingColumnGroup: FixedAttributeTableColumnGroupDef[] = [];

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

const attackPowerEfficiencyColumn: FixedAttributeTableColumnDef = {
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
}): readonly FixedAttributeTableColumnGroupDef[] {
  const includedStatusTypes = allStatusTypes.filter((statusType) =>
    attackPowerTypes.has(statusType),
  );

  return [
    {
      key: "actions",
      sx: { flex: 1, maxWidth: 70 },
      columns: [actionColumn],
    },
    {
      key: "name",
      sx: { flex: 1, minWidth: 120 },
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
