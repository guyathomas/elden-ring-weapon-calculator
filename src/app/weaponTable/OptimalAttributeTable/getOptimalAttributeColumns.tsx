import { Tooltip, Typography } from "@mui/material";
import {
  AttackPowerType,
  allAttackPowerTypes,
  allDamageTypes,
  damageAttributes,
} from "../../../calculator/calculator";
import {
  damageTypeIcons,
  damageTypeLabels,
  getAttributeLabel,
  getShortAttributeLabel,
} from "../../uiUtils";
import type {
  OptimalAttributeTableColumnDef,
  OptimalAttributeTableColumnGroupDef,
} from "./OptimalAttributeTable";
import {
  WeaponNameRenderer,
  AttackPowerRenderer,
  OptimizedAttributeRenderer,
  OptimizedEnduranceRenderer,
  blankIcon,
  AttributeRequirementRenderer,
  ActionRenderer,
} from "../tableRenderers";

const nameColumn: OptimalAttributeTableColumnDef = {
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

const actionColumn: OptimalAttributeTableColumnDef = {
  key: "name",
  sortBy: "name",
  header: (
    <Typography component="span" variant="subtitle2">
      Actions
    </Typography>
  ),
  sx: {
    justifyContent: "start",
  },
  render() {
    return <ActionRenderer />;
  },
};

const optimizedAttackTypeColumns = Object.fromEntries(
  allAttackPowerTypes.map((attackPowerType): [AttackPowerType, OptimalAttributeTableColumnDef] => [
    attackPowerType,
    {
      key: `${attackPowerType}OptimizedAttackByDamageType`,
      sortBy: `${attackPowerType}OptimizedAttackByDamageType`,
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
      render({ optimalAttributes: { attackPower } }) {
        return <AttackPowerRenderer value={attackPower?.optimalDamageSplit[attackPowerType]} />;
      },
    },
  ]),
) as Record<AttackPowerType, OptimalAttributeTableColumnDef>;

const optimizedAPColumns: OptimalAttributeTableColumnDef[] = damageAttributes.map(
  (attribute): OptimalAttributeTableColumnDef => ({
    key: `${attribute}OptimizedAP`,
    sortBy: `${attribute}OptimizedAP`,
    header: (
      <Typography
        component="span"
        variant="subtitle2"
        title={`${getAttributeLabel(attribute)} Optimized AP`}
      >
        {getShortAttributeLabel(attribute)}
      </Typography>
    ),
    render({ optimalAttributes, startingClassAttributes }) {
      const defaultValue = startingClassAttributes[attribute];
      const value = optimalAttributes?.attackPower?.optimalAttributes[attribute];
      if (!value || value === defaultValue) return blankIcon;
      return <OptimizedAttributeRenderer key={attribute} value={value} />;
    },
  }),
);

const optimizedSPColumns: OptimalAttributeTableColumnDef[] = damageAttributes.map(
  (attribute): OptimalAttributeTableColumnDef => ({
    key: `${attribute}OptimizedSP`,
    sortBy: `${attribute}OptimizedSP`,
    header: (
      <Typography
        component="span"
        variant="subtitle2"
        title={`${getAttributeLabel(attribute)} SP Optimized`}
      >
        {getShortAttributeLabel(attribute)}
      </Typography>
    ),
    render({ optimalAttributes, startingClassAttributes }) {
      const defaultValue = startingClassAttributes[attribute];
      const value = optimalAttributes?.attackPower?.optimalAttributes[attribute];
      if (!value || value === defaultValue) return blankIcon;
      return <OptimizedAttributeRenderer key={attribute} value={value} />;
    },
  }),
);

const requirementColumns: OptimalAttributeTableColumnDef[] = damageAttributes.map(
  (attribute): OptimalAttributeTableColumnDef => ({
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
    render({ weapon }) {
      return (
        <AttributeRequirementRenderer weapon={weapon} attribute={attribute} ineffective={false} />
      );
    },
  }),
);

interface WeaponTableColumnsOptions {
  spellScaling: boolean;
  showEndurance: boolean;
}
export function getOptimalAttributeColumns({
  spellScaling,
  showEndurance,
}: WeaponTableColumnsOptions): OptimalAttributeTableColumnGroupDef[] {
  const optimizedSpellScalingColumns: OptimalAttributeTableColumnGroupDef[] = spellScaling
    ? [
        {
          key: "attributesOptimizedSP",
          sx: {
            width: 40 * (allDamageTypes.length + 1) + 27,
            flex: 1,
          },
          header: `Optimal SP Attributes`,
          columns: [
            ...optimizedSPColumns,
            {
              key: `totalOptimizedSP`,
              sortBy: `totalOptimizedSP`,
              header: (
                <Typography component="span" variant="subtitle2" title={`Total SP`}>
                  SP
                </Typography>
              ),
              render({ optimalAttributes }) {
                const value = optimalAttributes?.spellPower?.optimalDamage;
                if (!value) return blankIcon;
                return <OptimizedAttributeRenderer value={value} />;
              },
            } as OptimalAttributeTableColumnDef,
            {
              key: `disposableOptimizedPointsSP`,
              sortBy: `disposableOptimizedPointsSP`,
              header: (
                <Tooltip title="Disposable Points. The number of points remaining after maximizing the AR.">
                  <Typography component="span" variant="subtitle2" title={`Disposable Points`}>
                    DP
                  </Typography>
                </Tooltip>
              ),
              render({ optimalAttributes }) {
                const value = optimalAttributes?.spellPower?.disposablePoints;
                if (!value) return blankIcon;
                return <OptimizedAttributeRenderer value={value} />;
              },
            },
          ],
        },
      ]
    : [];

  return [
    {
      key: "actions",
      sx: { flex: 1, maxWidth: 120 },
      columns: [actionColumn],
    },
    {
      key: "name",
      sx: { flex: 1, minWidth: 100 },
      columns: [nameColumn],
    },
    {
      key: "requirements",
      sx: {
        width: 20 * requirementColumns.length,
        flex: 1,
      },
      header: "Attributes Required",
      columns: requirementColumns,
    },
    {
      key: "attributesOptimizedAP",
      sx: {
        width: 50 * (allDamageTypes.length + damageAttributes.length + 3),
        flex: 2,
      },
      header: `Optimal AP Attributes`,
      columns: [
        ...(showEndurance
          ? [
              {
                key: `incrementalOptimizedEnd`,
                sortBy: `incrementalOptimizedEnd`,
                header: (
                  <Tooltip title="The incremental endurance points that this weapon will cost you">
                    <Typography
                      component="span"
                      variant="subtitle2"
                      title={`Incremental Endurance`}
                    >
                      End+
                    </Typography>
                  </Tooltip>
                ),
                render({ optimalAttributes }) {
                  return (
                    <OptimizedEnduranceRenderer
                      endurance={optimalAttributes?.endurance?.incremental}
                    />
                  );
                },
              } as OptimalAttributeTableColumnDef,
              {
                key: `totalOptimizedEnd`,
                sortBy: `totalOptimizedEnd`,
                header: (
                  <Tooltip title="The total endurance points you'll need to wield this weapon">
                    <Typography component="span" variant="subtitle2" title={`Endurance`}>
                      End
                    </Typography>
                  </Tooltip>
                ),
                render({ optimalAttributes, startingClassAttributes }) {
                  const defaultValue = startingClassAttributes.end;
                  const value = optimalAttributes?.endurance?.total;
                  if (!value || value === defaultValue) return blankIcon;
                  return <OptimizedAttributeRenderer value={value} />;
                },
              } as OptimalAttributeTableColumnDef,
            ]
          : []),
        ...optimizedAPColumns,

        ...allDamageTypes.map((damageType) => optimizedAttackTypeColumns[damageType]),
        {
          key: `totalOptimizedAP`,
          sortBy: `totalOptimizedAP`,
          header: (
            <Typography component="span" variant="subtitle2" title={`Total AR`}>
              AR
            </Typography>
          ),
          render({ optimalAttributes }) {
            const value = optimalAttributes?.attackPower?.optimalDamage;
            if (!value) return blankIcon;
            return <OptimizedAttributeRenderer value={value} />;
          },
        },
        {
          key: `disposableOptimizedPointsAP`,
          sortBy: `disposableOptimizedPointsAP`,
          header: (
            <Tooltip title="Disposable Points. The number of points remaining after maximizing the AR.">
              <Typography component="span" variant="subtitle2" title={`Disposable Points`}>
                DP
              </Typography>
            </Tooltip>
          ),
          render({ optimalAttributes }) {
            const value = optimalAttributes?.attackPower?.disposablePoints;
            if (!value) return blankIcon;
            return <OptimizedAttributeRenderer value={value} />;
          },
        },

        {
          key: `totalOptimizedEfficiency`,
          sortBy: `totalOptimizedEfficiency`,
          header: (
            <Tooltip title="Efficiency Score. 100% means no stats can increase the AR.">
              <Typography component="span" variant="subtitle2" title={`Disposable Points`}>
                Eff
              </Typography>
            </Tooltip>
          ),
          render({ optimalAttributes }) {
            const value = optimalAttributes?.attackPower?.efficiencyScore;
            if (!value) return blankIcon;
            return <OptimizedAttributeRenderer value={value} />;
          },
        },
      ],
    },
    ...optimizedSpellScalingColumns,
  ];
}
