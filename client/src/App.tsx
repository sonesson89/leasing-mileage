import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/sv.js";
import "./App.css";
import LoginScreen from "./components/LoginScreen";
import CarLocationMap from "./components/CarLocationMap";
import AverageMileageStats from "./components/AverageMileageStats";
import MileageProjectionChart from "./components/MileageProjectionChart";
import ChargeHistoryChart from "./components/ChargeHistoryChart";
import SourceFooter from "./components/SourceFooter";
import TutorialStep, {
  ANON_TUTORIAL_STEPS,
} from "./components/AnonTutorial";
import { fmtMil } from "./utils/format";
import type { CarLocation, ChargeSession } from "./types";

moment.locale("sv");

function GenericCarIcon() {
  return (
    <svg
      className="generic-car-icon"
      viewBox="0 0 64 40"
      role="img"
      aria-label="Generic car"
    >
      <path
        fill="currentColor"
        d="M8 26 L12 14 Q14 10 20 10 H40 Q46 10 48 14 L52 26 H56 Q60 26 60 30 V32 Q60 34 58 34 H54 Q54 30 50 30 Q46 30 46 34 H18 Q18 30 14 30 Q10 30 10 34 H6 Q4 34 4 32 V30 Q4 26 8 26 Z M18 14 L15 24 H30 V14 Z M34 14 V24 H49 L46 14 Z"
      />
      <circle cx="14" cy="34" r="4" fill="currentColor" />
      <circle cx="50" cy="34" r="4" fill="currentColor" />
    </svg>
  );
}


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [anonMode, setAnonMode] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialCancelConfirm, setTutorialCancelConfirm] = useState(false);
  const [mileage, setMileage] = useState<number | null>(null);
  const [carPicture, setCarPicture] = useState<{
    brand: string;
    model: string;
    pictureUrl: string;
  } | null>(null);
  const [carLocation, setCarLocation] = useState<CarLocation | null>(null);
  const [chargeSessions, setChargeSessions] = useState<ChargeSession[] | null>(
    null,
  );
  const [startDate, setStartDate] = useState<string>(() => {
    const saved = localStorage.getItem("startDate");
    if (saved) return saved;
    // Persist the default immediately so a fresh anon session isn't mistaken for an unconfigured one
    const today = moment().format("YYYY-MM-DD");
    localStorage.setItem("startDate", today);
    return today;
  });
  const [maxMilPerYear, setMaxMilPerYear] = useState<string>(
    () => localStorage.getItem("maxMilPerYear") || "",
  );
  const [overageFee, setOverageFee] = useState<string>(
    () => localStorage.getItem("overageFee") || "",
  );
  const [leasingYears, setLeasingYears] = useState<number>(() => {
    const saved = localStorage.getItem("leasingYears");
    if (saved) return Number(saved);
    localStorage.setItem("leasingYears", "3");
    return 3;
  });

  useEffect(() => {
    // /demo and /anon are deep links that bypass the login screen entirely, so skip the real session check
    if (location.pathname === "/demo" || location.pathname === "/anon") return;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authenticated || demoMode || anonMode) return;

    fetch("/api/car/status")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthenticated(false);
          throw new Error("Your Renault session has expired.");
        }
        if (!res.ok) throw new Error("Could not load car status.");
        return res.json();
      })
      .then((data) => {
        console.log("Car status:", data);
        setMileage(data.cockpit?.totalMileage ?? null);
        const location = data.location;
        if (
          Number.isFinite(location?.latitude) &&
          Number.isFinite(location?.longitude)
        ) {
          setCarLocation(location);
        }
      })
      .catch((err) => console.error("Car status error:", err));

    fetch("/api/car/picture")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthenticated(false);
          throw new Error("Your Renault session has expired.");
        }
        if (!res.ok) throw new Error("Could not load car picture.");
        return res.json();
      })
      .then((data) => {
        console.log("Car picture:", data);
        if (data.pictureUrl) setCarPicture(data);
      })
      .catch((err) => console.error("Car picture error:", err));

    fetch("/api/car/charges?days=90")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthenticated(false);
          throw new Error("Your Renault session has expired.");
        }
        if (!res.ok) throw new Error("Could not load charge history.");
        return res.json();
      })
      .then((data) => {
        console.log("Charge history:", data);
        setChargeSessions(data.sessions ?? []);
      })
      .catch((err) => console.error("Charge history error:", err));
  }, [authenticated, demoMode, anonMode]);

  const handleLoginRequest = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Renault authentication failed.");
    }
    setAuthenticated(true);
  };

  const handleDemo = () => {
    const mockStartDate = moment().subtract(284, "days").format("YYYY-MM-DD");

    setDemoMode(true);
    setMileage(13166);
    setCarPicture({
      brand: "Renault",
      model: "Megane E-Tech (Demo)",
      pictureUrl:
        "https://3dv.renault.com/ImageFromBookmark?configuration=PAVEH%2FX1316%2FHTB%2FEA3%2FLHDG%2FACC02%2FACD02%2FWFTRP%2FCLK00%2FRVX09%2F2RVLG%2FRAL18%2FCLS02%2FFSE06%2FTEEQJ%2FPRROP%2FSLSW0%2FRVIAT%2FTRSV0%2FHTS02%2FNA510%2FRMLT3%2FRIM03%2FFXCCA%2FNOADT%2FABCXL%2F02ANT%2FNODUP%2FNOWAP%2FSBCAL%2FAMLT0%2FMET05%2FNOBSD%2FITPK0%2FPXA00%2FPXB00%2FPXF00%2FSSPXJ%2FHTSW0%2FDDAWA%2FWICH0%2FNOLIE%2FNOLII%2FRRCAM%2FCHRGI&databaseId=e36685d0-7888-418f-b0d3-3302fcc0649b&bookmarkSet=RSITE&bookmark=EXT_34_DESSUS&profile=HELIOS_OWNERSERVICES_LARGE",
    });
    setCarLocation({
      // 68.30056737900378, 22.10866444080784
      latitude: 68.30056737900378,
      longitude: 22.10866444080784,
      lastUpdated: moment().toISOString(),
    });
    setStartDate(mockStartDate);
    setMaxMilPerYear("1500");
    setOverageFee("12");
    setLeasingYears(3);

    const mockSession = (
      daysAgo: number,
      hour: number,
      minute: number,
      durationMinutes: number,
      avgPowerKw: number,
      startBatteryLevel: number,
      endBatteryLevel: number,
    ): ChargeSession => {
      const start = moment()
        .subtract(daysAgo, "days")
        .set({ hour, minute, second: 0, millisecond: 0 });
      const end = start.clone().add(durationMinutes, "minutes");
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        durationMinutes,
        energyKwh: Number(((avgPowerKw * durationMinutes) / 60).toFixed(2)),
        startBatteryLevel,
        endBatteryLevel,
        avgPowerKw,
      };
    };

    setChargeSessions([
      // Overnight home charges (slow, ~3.3-3.5 kW)
      mockSession(3, 22, 10, 420, 3.4, 25, 92),
      mockSession(7, 21, 45, 450, 3.3, 18, 88),
      mockSession(10, 22, 30, 380, 3.5, 32, 95),
      mockSession(12, 22, 0, 420, 3.4, 22, 90),
      mockSession(14, 23, 0, 400, 3.4, 28, 91),
      mockSession(17, 20, 50, 460, 3.3, 15, 89),
      mockSession(21, 22, 15, 410, 3.5, 24, 93),
      mockSession(24, 22, 40, 390, 3.4, 30, 90),
      mockSession(28, 21, 30, 430, 3.4, 20, 92),
      mockSession(31, 22, 0, 390, 3.3, 27, 88),
      mockSession(35, 23, 15, 440, 3.5, 19, 94),
      mockSession(38, 20, 40, 400, 3.4, 26, 90),
      // Fast charging stops on the road (~49-53 kW)
      mockSession(5, 13, 20, 35, 51, 30, 68),
      mockSession(12, 8, 0, 25, 52, 40, 74), // same day as the day-12 home charge above
      mockSession(19, 10, 5, 28, 53, 35, 71),
      mockSession(33, 15, 40, 32, 49, 38, 70),
    ]);
    setAuthenticated(true);
    navigate("/demo", { replace: true });
  };

  const handleAnon = () => {
    setAnonMode(true);
    setDemoMode(false);
    const savedMileage = localStorage.getItem("anonMileage");
    setMileage(savedMileage ? Number(savedMileage) : null);
    setCarPicture(null);
    setCarLocation(null);
    setChargeSessions(null);
    setAuthenticated(true);
    setTutorialStep(0);
    setTutorialCancelConfirm(false);

    // Skip the tutorial if the user already configured everything in a previous anon session
    const hasAllSavedValues =
      !!savedMileage &&
      !!localStorage.getItem("startDate") &&
      !!localStorage.getItem("maxMilPerYear") &&
      !!localStorage.getItem("overageFee") &&
      !!localStorage.getItem("leasingYears");
    const tutorialHidden = localStorage.getItem("hideAnonTutorial") === "true";
    setTutorialActive(!tutorialHidden && !hasAllSavedValues);
    navigate("/anon", { replace: true });
  };

  useEffect(() => {
    // Deep links: /demo and /anon jump straight into that mode, bypassing the login screen
    if (location.pathname === "/demo") {
      handleDemo();
    } else if (location.pathname === "/anon") {
      handleAnon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTutorialNext = () => {
    if (tutorialStep >= ANON_TUTORIAL_STEPS.length - 1) {
      setTutorialActive(false);
      return;
    }
    setTutorialStep((s) => s + 1);
  };

  const handleTutorialCancelClick = () => setTutorialCancelConfirm(true);

  const handleTutorialCancelOnly = () => {
    setTutorialActive(false);
    setTutorialCancelConfirm(false);
  };

  const handleTutorialNeverShowAgain = () => {
    localStorage.setItem("hideAnonTutorial", "true");
    setTutorialActive(false);
    setTutorialCancelConfirm(false);
  };

  const handleAnonMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const km = value === "" ? null : Number(value) * 10;
    setMileage(km);
    localStorage.setItem("anonMileage", km === null ? "" : String(km));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setDemoMode(false);
    setAnonMode(false);
    setTutorialActive(false);
    setTutorialStep(0);
    setTutorialCancelConfirm(false);
    setAuthenticated(false);
    setMileage(null);
    setCarPicture(null);
    setCarLocation(null);
    setChargeSessions(null);

    // Wipe per-account lease settings so they don't carry over to the next login
    localStorage.removeItem("startDate");
    localStorage.removeItem("maxMilPerYear");
    localStorage.removeItem("overageFee");
    localStorage.removeItem("leasingYears");
    localStorage.removeItem("anonMileage");
    setStartDate(moment().format("YYYY-MM-DD"));
    setMaxMilPerYear("");
    setOverageFee("");
    setLeasingYears(3);
    navigate("/", { replace: true });
  };

  // Demo/anon never had a real session, so leave localStorage untouched when leaving them
  const handleReturnToLogin = () => {
    setDemoMode(false);
    setAnonMode(false);
    setTutorialActive(false);
    setTutorialStep(0);
    setTutorialCancelConfirm(false);
    setAuthenticated(false);
    setMileage(null);
    setCarPicture(null);
    setCarLocation(null);
    setChargeSessions(null);
    navigate("/", { replace: true });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    localStorage.setItem("startDate", e.target.value);
  };

  const handleMaxMilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxMilPerYear(e.target.value);
    localStorage.setItem("maxMilPerYear", e.target.value);
  };

  const handleOverageFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOverageFee(e.target.value);
    localStorage.setItem("overageFee", e.target.value);
  };

  const handleLeasingYearsChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const val = Number(e.target.value);
    setLeasingYears(val);
    localStorage.setItem("leasingYears", String(val));
  };

  const daysSinceStart = moment()
    .startOf("day")
    .diff(moment(startDate), "days");

  const perDay =
    mileage !== null && daysSinceStart > 0 ? mileage / daysSinceStart : null;
  const perMonth = perDay !== null ? perDay * 30.44 : null;
  const perYear = perDay !== null ? perDay * 365.25 : null;

  const maxMilNum = maxMilPerYear ? parseFloat(maxMilPerYear) : null;
  const budgetPerDayMil = maxMilNum !== null ? maxMilNum / 365.25 : null;
  const overageFeeNum = overageFee ? parseFloat(overageFee) : null;

  // Projected over-mileage (mil) at end of contract
  const totalContractMil = maxMilNum !== null ? maxMilNum * leasingYears : null;
  const totalProjectedMil =
    perYear !== null ? (perYear / 10) * leasingYears : null;
  const projectedOverMil =
    totalProjectedMil !== null && totalContractMil !== null
      ? Math.max(0, totalProjectedMil - totalContractMil)
      : null;
  const projectedMarginMil =
    totalProjectedMil !== null && totalContractMil !== null
      ? Math.max(0, totalContractMil - totalProjectedMil)
      : null;
  const formatProjectedMil = (value: number) =>
    value.toLocaleString("sv-SE", { maximumFractionDigits: 0 });

  // Expected overage cost
  const expectedOverageCost =
    projectedOverMil !== null && overageFeeNum !== null
      ? projectedOverMil * overageFeeNum
      : null;

  // Build chart data: one point per week from startDate to startDate + leasingYears
  const chartData = useMemo(() => {
    if (mileage === null || daysSinceStart <= 0) return [];

    const start = moment(startDate);
    const milPerDayKm = mileage / daysSinceStart; // km per day
    const budgetPerDayKm =
      maxMilNum !== null ? (maxMilNum * 10) / 365.25 : null;

    const totalDays = Math.round(365.25 * leasingYears);
    const step = leasingYears <= 2 ? 7 : 14; // biweekly for longer contracts

    const points: {
      date: string;
      month: number;
      actual: number | null;
      budget: number | null;
      projected: number | null;
    }[] = [];

    for (let d = 0; d <= totalDays; d += step) {
      const pointDate = start.clone().add(d, "days");
      const label = pointDate.format(leasingYears > 1 ? "D MMM YY" : "D MMM");
      const isActual = d <= daysSinceStart;
      const actualKm = milPerDayKm * d;
      const budgetKm = budgetPerDayKm !== null ? budgetPerDayKm * d : null;

      points.push({
        date: label,
        month: d,
        actual: isActual ? actualKm / 10 : null,
        projected: !isActual ? actualKm / 10 : null,
        budget: budgetKm !== null ? budgetKm / 10 : null,
      });

      // Add the exact "today" point at the boundary
      if (d < daysSinceStart && d + step > daysSinceStart) {
        const todayDate = start.clone().add(daysSinceStart, "days");
        const todayLabel = todayDate.format(
          leasingYears > 1 ? "D MMM YY" : "D MMM",
        );
        const todayActualKm = milPerDayKm * daysSinceStart;
        const todayBudgetKm =
          budgetPerDayKm !== null ? budgetPerDayKm * daysSinceStart : null;
        points.push({
          date: todayLabel + " ←",
          month: daysSinceStart,
          actual: todayActualKm / 10,
          projected: todayActualKm / 10, // bridge point so projected connects
          budget: todayBudgetKm !== null ? todayBudgetKm / 10 : null,
        });
      }
    }

    points.sort((a, b) => a.month - b.month);
    return points;
  }, [mileage, daysSinceStart, startDate, maxMilNum, leasingYears]);
  const todayChartLabel = chartData.find(
    (point) => point.month === daysSinceStart,
  )?.date;

  if (authenticated === null) {
    return <p className="session-loading">Checking session...</p>;
  }

  if (!authenticated) {
    return (
      <LoginScreen
        onLogin={handleLoginRequest}
        onDemo={handleDemo}
        onAnon={handleAnon}
      />
    );
  }

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>
            {demoMode || anonMode
              ? "Car Leasing Calculator"
              : "Renault Leasing Checker"}
          </h1>
          <p className="unit-note">Swedish mil: 1 mil = 10 km</p>
          {demoMode && <p className="demo-label">Demo data</p>}
          {anonMode && <p className="demo-label">Manual mode</p>}
        </div>
        {anonMode || demoMode ? (
          <button
            className="logout-button"
            type="button"
            onClick={handleReturnToLogin}
          >
            Back to login screen
          </button>
        ) : (
          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        )}
      </header>

      <div
        className={`vehicle-overview${anonMode ? " vehicle-overview--single" : ""}`}
      >
        <div className="card vehicle-card">
          {anonMode ? (
            <GenericCarIcon />
          ) : (
            carPicture && (
              <>
                {carPicture.pictureUrl && (
                  <img
                    src={carPicture.pictureUrl}
                    alt={`${carPicture.brand} ${carPicture.model}`}
                    className="car-image"
                  />
                )}
                <p className="car-model">{carPicture.model}</p>
              </>
            )
          )}
          {anonMode ? (
            <div
              className={`mileage-input-group tutorial-anchor${
                tutorialActive && tutorialStep === 0 ? " tutorial-highlight" : ""
              }`}
            >
              <label htmlFor="anon-mileage">Current mileage (mil)</label>
              <input
                id="anon-mileage"
                type="number"
                min="0"
                placeholder="e.g. 1500"
                value={mileage !== null ? mileage / 10 : ""}
                onChange={handleAnonMileageChange}
              />
              <TutorialStep
                stepIndex={0}
                currentStep={tutorialStep}
                active={anonMode && tutorialActive}
                cancelConfirm={tutorialCancelConfirm}
                onNext={handleTutorialNext}
                onCancel={handleTutorialCancelClick}
                onCancelOnly={handleTutorialCancelOnly}
                onNeverShowAgain={handleTutorialNeverShowAgain}
              />
            </div>
          ) : (
            <>
              <h2 className="mileage">
                {mileage !== null
                  ? `${fmtMil(mileage)} mil`
                  : "Loading mileage…"}
              </h2>
              <p>Current Mileage</p>
            </>
          )}
        </div>
        {!anonMode && <CarLocationMap carLocation={carLocation} />}
      </div>

      <div className="card lease-settings">
        <div
          className={`lease-field tutorial-anchor${
            anonMode && tutorialActive && tutorialStep === 1
              ? " tutorial-highlight"
              : ""
          }`}
        >
          <label htmlFor="start-date">Counting from</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={handleDateChange}
          />
          <p className="days-count">{daysSinceStart} days since start</p>
          <TutorialStep
            stepIndex={1}
            currentStep={tutorialStep}
            active={anonMode && tutorialActive}
            cancelConfirm={tutorialCancelConfirm}
            onNext={handleTutorialNext}
            onCancel={handleTutorialCancelClick}
            onCancelOnly={handleTutorialCancelOnly}
            onNeverShowAgain={handleTutorialNeverShowAgain}
          />
        </div>
        <div
          className={`lease-field tutorial-anchor${
            anonMode && tutorialActive && tutorialStep === 2
              ? " tutorial-highlight"
              : ""
          }`}
        >
          <label htmlFor="max-mil">Contract limit (mil/year)</label>
          <input
            id="max-mil"
            type="number"
            placeholder="e.g. 1500"
            value={maxMilPerYear}
            onChange={handleMaxMilChange}
          />
          <TutorialStep
            stepIndex={2}
            currentStep={tutorialStep}
            active={anonMode && tutorialActive}
            cancelConfirm={tutorialCancelConfirm}
            onNext={handleTutorialNext}
            onCancel={handleTutorialCancelClick}
            onCancelOnly={handleTutorialCancelOnly}
            onNeverShowAgain={handleTutorialNeverShowAgain}
          />
        </div>
        <div
          className={`lease-field tutorial-anchor${
            anonMode && tutorialActive && tutorialStep === 3
              ? " tutorial-highlight"
              : ""
          }`}
        >
          <label htmlFor="overage-fee">Over-mileage fee (kr/mil)</label>
          <input
            id="overage-fee"
            type="number"
            placeholder="e.g. 50"
            value={overageFee}
            onChange={handleOverageFeeChange}
          />
          <TutorialStep
            stepIndex={3}
            currentStep={tutorialStep}
            active={anonMode && tutorialActive}
            cancelConfirm={tutorialCancelConfirm}
            onNext={handleTutorialNext}
            onCancel={handleTutorialCancelClick}
            onCancelOnly={handleTutorialCancelOnly}
            onNeverShowAgain={handleTutorialNeverShowAgain}
          />
        </div>
        <div
          className={`lease-field tutorial-anchor${
            anonMode && tutorialActive && tutorialStep === 4
              ? " tutorial-highlight"
              : ""
          }`}
        >
          <label htmlFor="leasing-years">Contract length</label>
          <select
            id="leasing-years"
            value={leasingYears}
            onChange={handleLeasingYearsChange}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((y) => (
              <option key={y} value={y}>
                {y} {y === 1 ? "year" : "years"}
              </option>
            ))}
          </select>
          <TutorialStep
            stepIndex={4}
            currentStep={tutorialStep}
            active={anonMode && tutorialActive}
            cancelConfirm={tutorialCancelConfirm}
            onNext={handleTutorialNext}
            onCancel={handleTutorialCancelClick}
            onCancelOnly={handleTutorialCancelOnly}
            onNeverShowAgain={handleTutorialNeverShowAgain}
          />
        </div>
      </div>

      <MileageProjectionChart
        chartData={chartData}
        todayChartLabel={todayChartLabel}
        showBudgetLine={budgetPerDayMil !== null}
      />

      <AverageMileageStats perDay={perDay} perMonth={perMonth} perYear={perYear} />

      {projectedOverMil !== null && projectedOverMil > 0 && (
        <div className="card overage-card">
          <h3>Projected Over-Mileage</h3>
          {totalProjectedMil !== null && (
            <p className="projection-summary">
              Based on your mileage, you are projected to end up at{" "}
              <strong>{formatProjectedMil(totalProjectedMil)} mil</strong> by
              the end of your contract.
            </p>
          )}
          <p className="overage-value">
            +{formatProjectedMil(projectedOverMil)} mil over limit
          </p>
          {expectedOverageCost !== null && (
            <p className="overage-cost">
              Expected fee:{" "}
              <strong>
                {expectedOverageCost.toLocaleString("sv-SE", {
                  maximumFractionDigits: 0,
                })}{" "}
                kr
              </strong>
            </p>
          )}
        </div>
      )}

      {projectedOverMil !== null && projectedOverMil === 0 && (
        <div className="card under-budget-card">
          <h3>On Track</h3>
          {totalProjectedMil !== null && projectedMarginMil !== null && (
            <p className="under-budget-value">
              Based on your mileage, you are projected to end up at{" "}
              <strong>{formatProjectedMil(totalProjectedMil)} mil</strong> by
              the end of your contract, meaning you have a{" "}
              <strong>{formatProjectedMil(projectedMarginMil)} mil</strong>{" "}
              margin.
            </p>
          )}
        </div>
      )}

      {!anonMode && <ChargeHistoryChart chargeSessions={chargeSessions} />}

      <SourceFooter />
    </>
  );
}

export default App;
