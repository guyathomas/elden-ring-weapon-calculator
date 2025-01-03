import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  ThemeProvider,
  Toolbar,
  useMediaQuery,
  useTheme,
  Tab,
  Tabs,
  type Theme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import WeaponListSettings from "./weaponTable/FixedAttributeTable/FixedTableWeaponListSetting";
import FixedWeaponTable from "./weaponTable/FixedAttributeTable/FixedAttributeTable";
import theme from "./theme";
import regulationVersions, { type RegulationVersionName } from "./regulationVersions";
import useWeapons from "./useWeapons";
import { useAppState } from "./reducers/useAppState";
import { useFixedAttributeState } from "./reducers/useFixedAttributeState";
import { useSolvedAttributeState } from "./reducers/useSolvedAttributeState";
import AppBar from "./AppBar";
import RegulationVersionPicker from "./RegulationVersionPicker";
import WeaponTypePicker from "./WeaponTypePicker";
import WeaponPicker, { makeWeaponOptionsFromWeapon, type WeaponOption } from "./WeaponPicker";
import AffinityPicker from "./AffinityPicker";
import Footer from "./Footer";
import MiscFilterPicker from "./MiscFilterPicker";
import { getEnduranceForWeight } from "./weaponTable/OptimalAttributeTable/useOptimalAttributes";
import useFilteredWeapons from "./weaponTable/useFilteredWeapons";
import { INITIAL_CLASS_VALUES, type StartingClass } from "./ClassPicker";
import type { Weapon } from "../calculator/weapon";
import SolvedTableWeaponListSettings from "./weaponTable/OptimalAttributeTable/SolvedTableWeaponListSettings";
import SolverWeaponTable from "./weaponTable/OptimalAttributeTable/OptimalAttributeTable";
import type { WeaponType } from "../calculator/weaponTypes";
import type { AllAttributeAndLevel } from "../calculator/attributes";
import type { RollType } from "./RollTypePicker";

const useMenuState = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery<Theme>(theme.breakpoints.down("md"));

  // Open the menu by default on large viewports. On mobile-sized viewports, the menu is an overlay
  // that partially covers the rest of the screen.
  const [menuOpenMobile, setMenuOpenMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);

  /* eslint-disable no-restricted-globals */
  const onMenuOpenChanged = useCallback(
    (open: boolean) => {
      if (isMobile) {
        if (open) {
          history.replaceState(null, "");
          history.pushState(null, "");
          setMenuOpenMobile(true);
        } else {
          history.back();
          setMenuOpenMobile(false);
        }
      } else {
        setMenuOpen(open);
      }
    },
    [isMobile],
  );

  useEffect(() => {
    if (menuOpenMobile) {
      if (!isMobile) {
        history.back();
        setMenuOpenMobile(false);
      }

      const onPopState = (evt: PopStateEvent) => {
        setMenuOpenMobile(false);
        evt.stopPropagation();
      };

      window.addEventListener("popstate", onPopState, false);
      return () => window.removeEventListener("popstate", onPopState, false);
    }
  }, [isMobile, menuOpenMobile]);
  /* eslint-enable no-restricted-globals */

  return {
    isMobile,
    menuOpen,
    menuOpenMobile,
    onMenuOpenChanged,
  };
};

function RegulationVersionAlert({ children }: { children: ReactNode }) {
  const SESSION_STORAGE_KEY = "hasDismissedRegulationAlert";
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SESSION_STORAGE_KEY) || false,
  );

  const handleSetDismissed = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
  }, []);

  if (!children || dismissed) return null;

  return (
    <Alert icon={false} severity="info" onClose={handleSetDismissed}>
      {children}
    </Alert>
  );
}
type TableView = "fixed" | "solver";

export default function App() {
  const { isMobile, menuOpen, menuOpenMobile, onMenuOpenChanged } = useMenuState();
  const [tableView, setTableView] = useState<TableView>("solver");
  const {
    state: {
      regulationVersionName,
      affinityIds,
      weaponTypes,
      includeDLC,
      effectiveOnly,
      twoHanding,
      upgradeLevel,
      groupWeaponTypes,
      startingClass,
      selectedWeapons,
    },
    dispatch: dispatchAppState,
  } = useAppState();
  const {
    state: { attributes, splitDamage, numericalScaling },
    dispatch: dispatchFixedAttributeState,
  } = useFixedAttributeState();
  const {
    state: {
      solverAttributes,
      adjustEnduranceForWeapon,
      rollType,
      armorWeight,
      damageTypeToOptimizeFor,
    },
    dispatch: dispatchSolvedAttributeState,
  } = useSolvedAttributeState();

  const { weapons, loading, error } = useWeapons(regulationVersionName);
  const regulationVersion = regulationVersions[regulationVersionName];

  const filteredWeapons = useFilteredWeapons(weapons, regulationVersion, {
    twoHanding,
    weaponTypes,
    affinityIds,
    effectiveOnly,
    includeDLC,
    selectedWeapons,
    attributes,
  });

  // The Convergence and Reforged don't separate DLC content, so this option is only relevant to
  // vanilla
  const showIncludeDLC = regulationVersionName === "latest";
  const includeDLCWeaponTypes = includeDLC || !showIncludeDLC;

  const weaponPickerOptions = useMemo(() => {
    const dedupedWeaponsByWeaponName = [
      ...weapons
        .reduce((acc, weapon) => acc.set(weapon.weaponName, weapon), new Map<string, Weapon>())
        .values(),
    ].filter((weapon) => (includeDLC ? true : !weapon.dlc));
    return makeWeaponOptionsFromWeapon(dedupedWeaponsByWeaponName);
  }, [weapons, includeDLC]);

  const handleRegulationVersionNameChanged = useCallback(
    (regulationVersionName: RegulationVersionName) => {
      dispatchAppState({ type: "setRegulationVersionName", payload: regulationVersionName });
    },
    [dispatchAppState],
  );

  const handleIncludeDLCChanged = useCallback(
    (includeDLC: boolean) => {
      dispatchAppState({ type: "setIncludeDLC", payload: includeDLC });
    },
    [dispatchAppState],
  );

  const handleEffectiveOnlyChanged = useCallback(
    (effectiveOnly: boolean) => {
      dispatchAppState({ type: "setEffectiveOnly", payload: effectiveOnly });
    },
    [dispatchAppState],
  );

  const handleSelectedWeaponsChanged = useCallback(
    (selectedWeapons: WeaponOption[]) => {
      dispatchAppState({ type: "setSelectedWeapons", payload: selectedWeapons });
    },
    [dispatchAppState],
  );

  const handleAffinityIdsChanged = useCallback(
    (affinityIds: readonly number[]) => {
      dispatchAppState({ type: "setAffinityIds", payload: affinityIds });
    },
    [dispatchAppState],
  );

  const handleWeaponTypesChanged = useCallback(
    (weaponTypes: WeaponType[]) => {
      dispatchAppState({ type: "setWeaponTypes", payload: weaponTypes });
    },
    [dispatchAppState],
  );

  const handleGroupWeaponTypesChanged = useCallback(
    (groupWeaponTypesChanged: boolean) => {
      dispatchAppState({
        type: "setGroupWeaponTypes",
        payload: groupWeaponTypesChanged,
      });
    },
    [dispatchAppState],
  );

  const handleOnAttributeChanges = useCallback(
    (attribute: AllAttributeAndLevel, value: number) => {
      dispatchFixedAttributeState({
        type: "setAttributes",
        payload: {
          [attribute]: value,
        },
      });
    },
    [dispatchFixedAttributeState],
  );

  const handleSetTableView = useCallback(
    (event: React.SyntheticEvent, newValue: TableView) => setTableView(newValue),
    [setTableView],
  );

  const drawerContent = (
    <>
      <Box mb={2}>
        <Tabs variant="fullWidth" value={tableView} onChange={handleSetTableView}>
          <Tab value={"fixed"} label="Fixed Attributes" />
          <Tab value={"solver"} label="Attribute Solver" />
        </Tabs>
      </Box>
      <RegulationVersionPicker
        regulationVersionName={regulationVersionName}
        onRegulationVersionNameChanged={handleRegulationVersionNameChanged}
      />
      <MiscFilterPicker
        showIncludeDLC={showIncludeDLC}
        includeDLC={includeDLC}
        effectiveOnly={effectiveOnly}
        onIncludeDLCChanged={handleIncludeDLCChanged}
        onEffectiveOnlyChanged={handleEffectiveOnlyChanged}
      />
      <WeaponPicker
        selectedWeapons={selectedWeapons}
        onSelectedWeaponsChanged={handleSelectedWeaponsChanged}
        weaponOptions={weaponPickerOptions}
      />
      <AffinityPicker
        affinityOptions={regulationVersion.affinityOptions}
        selectedAffinityIds={affinityIds}
        onAffinityIdsChanged={handleAffinityIdsChanged}
      />
      <WeaponTypePicker
        includeDLCWeaponTypes={includeDLCWeaponTypes}
        weaponTypes={weaponTypes}
        groupWeaponTypes={groupWeaponTypes}
        onWeaponTypesChanged={handleWeaponTypesChanged}
        onGroupWeaponTypesChanged={handleGroupWeaponTypesChanged}
      />
    </>
  );

  const handleStartingClassChanged = useCallback(
    (startingClass: StartingClass) => {
      const { arc, dex, str, int, fai, vig, end, min } = INITIAL_CLASS_VALUES[startingClass];

      dispatchAppState({ type: "setStartingClass", payload: startingClass });
      dispatchSolvedAttributeState({
        type: "setSolverAttributes",
        payload: {
          [`str.Min`]: Math.max(solverAttributes[`str.Min`], str),
          [`dex.Min`]: Math.max(solverAttributes[`dex.Min`], dex),
          [`int.Min`]: Math.max(solverAttributes[`int.Min`], int),
          [`fai.Min`]: Math.max(solverAttributes[`fai.Min`], fai),
          [`arc.Min`]: Math.max(solverAttributes[`arc.Min`], arc),
          end: Math.max(solverAttributes.end, end),
          min: Math.max(solverAttributes.min, min),
          vig: Math.max(solverAttributes.vig, vig),
        },
      });
      dispatchFixedAttributeState({
        type: "setAttributes",
        payload: {
          str: Math.max(attributes.str, str),
          dex: Math.max(attributes.dex, dex),
          int: Math.max(attributes.int, int),
          fai: Math.max(attributes.fai, fai),
          arc: Math.max(attributes.arc, arc),
        },
      });
    },
    [
      attributes,
      dispatchAppState,
      dispatchFixedAttributeState,
      dispatchSolvedAttributeState,
      solverAttributes,
    ],
  );

  const handleChangeTwoHanding = useCallback(
    (twoHandingChanged: boolean) => {
      dispatchAppState({ type: "setTwoHanding", payload: twoHandingChanged });
    },
    [dispatchAppState],
  );

  const handleChangeUpgradeLevel = useCallback(
    (upgradeLevelChanged: number) => {
      dispatchAppState({ type: "setUpgradeLevel", payload: upgradeLevelChanged });
    },
    [dispatchAppState],
  );

  const handleChangeSplitDamage = useCallback(
    (splitDamageChanged: boolean) => {
      dispatchFixedAttributeState({
        type: "setSplitDamage",
        payload: splitDamageChanged,
      });
    },
    [dispatchFixedAttributeState],
  );

  const handleChangeNumericalScaling = useCallback(
    (numericalScalingChanged: boolean) => {
      dispatchFixedAttributeState({
        type: "setNumericalScaling",
        payload: numericalScalingChanged,
      });
    },
    [dispatchFixedAttributeState],
  );

  const handleChangeRollType = useCallback(
    (rollType: RollType) => {
      dispatchSolvedAttributeState({ type: "setRollType", payload: rollType });
      const endurance = getEnduranceForWeight(armorWeight, rollType);
      dispatchSolvedAttributeState({
        type: "setSolverAttributes",
        payload: {
          end: Math.max(endurance, INITIAL_CLASS_VALUES[startingClass].end),
        },
      });
    },
    [armorWeight, dispatchSolvedAttributeState, startingClass],
  );

  const handleChangeArmorWeight = useCallback(
    (weight: number) => {
      dispatchSolvedAttributeState({
        type: "setArmorWeight",
        payload: weight,
      });
      const endurance = getEnduranceForWeight(weight, rollType);
      dispatchSolvedAttributeState({
        type: "setSolverAttributes",
        payload: {
          end: Math.max(endurance, INITIAL_CLASS_VALUES[startingClass].end),
        },
      });
    },
    [dispatchSolvedAttributeState, rollType, startingClass],
  );

  const handleChangeAttributeSolver = useCallback(
    (attributeChanged: string, attributeValue: number) => {
      dispatchSolvedAttributeState({
        type: "setSolverAttributes",
        payload: {
          [attributeChanged]: attributeValue,
        },
      });
    },
    [dispatchSolvedAttributeState],
  );

  const handleChangeWeaponAdjustedEndurance = useCallback(
    (weaponAdjustedEnduranceChanged: boolean) => {
      dispatchSolvedAttributeState({
        type: "setAdjustEnduranceForWeapon",
        payload: weaponAdjustedEnduranceChanged,
      });
    },
    [dispatchSolvedAttributeState],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar
        menuOpen={isMobile ? menuOpenMobile : menuOpen}
        onMenuOpenChanged={onMenuOpenChanged}
      />

      <Divider />

      <Box
        display="grid"
        sx={(theme) => ({
          px: 2,
          py: 3,
          [theme.breakpoints.up("sm")]: {
            px: 3,
          },
          [theme.breakpoints.up("md")]: {
            gridTemplateColumns: menuOpen ? `320px 1fr` : "1fr",
            alignContent: "start",
            alignItems: "start",
            gap: 2,
            px: 3,
          },
        })}
      >
        {menuOpen && (
          <Box
            display="grid"
            sx={(theme) => ({
              [theme.breakpoints.down("md")]: {
                display: "none",
              },
              gap: 2,
            })}
          >
            {drawerContent}
          </Box>
        )}

        <Drawer
          variant="temporary"
          open={menuOpenMobile}
          onClose={() => onMenuOpenChanged(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: "368px", maxWidth: "100vw" },
          }}
        >
          <Toolbar>
            <IconButton
              size="large"
              color="inherit"
              edge="start"
              role="checkbox"
              aria-label="Close Menu"
              sx={{ mr: 1 }}
              onClick={() => onMenuOpenChanged(false)}
            >
              <ArrowBackIcon />
            </IconButton>
          </Toolbar>

          <Divider />

          <Box display="grid" sx={{ gap: 2, p: 3 }}>
            {drawerContent}
          </Box>
        </Drawer>
        <Box display="grid" sx={{ gap: 2 }}>
          <RegulationVersionAlert key={regulationVersionName}>
            {regulationVersion.info}
          </RegulationVersionAlert>
          {tableView === "fixed" ? (
            <>
              <WeaponListSettings
                breakpoint={menuOpen ? "lg" : "md"}
                attributes={attributes}
                twoHanding={twoHanding}
                upgradeLevel={upgradeLevel}
                maxUpgradeLevel={regulationVersion.maxUpgradeLevel}
                splitDamage={splitDamage}
                numericalScaling={numericalScaling}
                onStartingClassChanged={handleStartingClassChanged}
                startingClass={startingClass}
                onAttributeChanged={handleOnAttributeChanges}
                onTwoHandingChanged={handleChangeTwoHanding}
                onUpgradeLevelChanged={handleChangeUpgradeLevel}
                onSplitDamageChanged={handleChangeSplitDamage}
                onNumericalScalingChanged={handleChangeNumericalScaling}
              />
              <FixedWeaponTable
                weapons={filteredWeapons}
                weaponsError={error}
                isWeaponsLoading={loading}
                regulationVersion={regulationVersion}
                splitDamage={splitDamage}
                numericalScaling={numericalScaling}
                twoHanding={twoHanding}
                upgradeLevel={upgradeLevel}
                groupWeaponTypes={groupWeaponTypes}
                attributes={attributes}
              />
            </>
          ) : (
            <>
              <SolvedTableWeaponListSettings
                solverAttributes={solverAttributes}
                twoHanding={twoHanding}
                upgradeLevel={upgradeLevel}
                maxUpgradeLevel={regulationVersion.maxUpgradeLevel}
                adjustEnduranceForWeapon={adjustEnduranceForWeapon}
                onStartingClassChanged={handleStartingClassChanged}
                startingClass={startingClass}
                rollType={rollType}
                onRollTypeChanged={handleChangeRollType}
                armorWeight={armorWeight}
                onArmorWeightChanged={handleChangeArmorWeight}
                onAttributeSolverChanged={handleChangeAttributeSolver}
                onTwoHandingChanged={handleChangeTwoHanding}
                onUpgradeLevelChanged={handleChangeUpgradeLevel}
                onWeaponAdjustedEnduranceChanged={handleChangeWeaponAdjustedEndurance}
              />
              <SolverWeaponTable
                weapons={filteredWeapons}
                weaponsError={error}
                isWeaponsLoading={loading}
                regulationVersion={regulationVersion}
                twoHanding={twoHanding}
                upgradeLevel={upgradeLevel}
                groupWeaponTypes={groupWeaponTypes}
                attributes={attributes}
                adjustEnduranceForWeapon={adjustEnduranceForWeapon}
                armorWeight={armorWeight}
                solverAttributes={solverAttributes}
                startingClass={startingClass}
                rollType={rollType}
                damageTypeToOptimizeFor={damageTypeToOptimizeFor}
              />
            </>
          )}

          <Footer />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
