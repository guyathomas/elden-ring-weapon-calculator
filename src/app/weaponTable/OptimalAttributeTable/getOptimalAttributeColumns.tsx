import { Typography } from "@mui/material";
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
    render({ optimalAttributes, startingClassAttributes, weapon }) {
      const defaultValue = startingClassAttributes[attribute];
      const value = optimalAttributes?.attackPower?.optimalAttributes[attribute];
      console.log("zzz", {
        weapon: weapon.name,
        attribute,
        isStartingValue: value === defaultValue,
        value,
        defaultValue,
      });
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
                <Typography component="span" variant="subtitle2" title={`Disposable Points`}>
                  Disposable Points
                </Typography>
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
      key: "name",
      sx: { flex: 2, minWidth: 160 },
      columns: [nameColumn],
    },
    {
      key: "attributesOptimizedAP",
      sx: {
        width: 45 * (allDamageTypes.length + damageAttributes.length + 4) + 27,
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
                  <Typography component="span" variant="subtitle2" title={`Incremental Endurance`}>
                    End+
                  </Typography>
                ),
                render({ optimalAttributes }) {
                  // TODO: !armorWeight || !rollType

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
                  <Typography component="span" variant="subtitle2" title={`Endurance`}>
                    End
                  </Typography>
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
            <Typography component="span" variant="subtitle2" title={`Disposable Points`}>
              DP
            </Typography>
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
            <Typography component="span" variant="subtitle2" title={`Disposable Points`}>
              Eff
            </Typography>
          ),
          render({ optimalAttributes }) {
            const value = optimalAttributes?.attackPower?.efficiencyScore;
            if (!value) return blankIcon;
            return <OptimizedAttributeRenderer value={value} />;
          },
        },
        ...allDamageTypes.map((damageType) => optimizedAttackTypeColumns[damageType]),
      ],
    },
    ...optimizedSpellScalingColumns,
  ];
}
