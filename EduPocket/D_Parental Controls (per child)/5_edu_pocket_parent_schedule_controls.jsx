import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Add,
  ArrowForward,
  CheckCircle,
  Close,
  Event,
  Info,
  Refresh,
  Schedule,
  Settings,
  Shield,
  Sun
} from "@mui/icons-material";

/**
 * EduPocket Parent - Schedule Controls (Premium)
 * Route: /parent/edupocket/children/:childId/controls/schedule
 * Includes:
 * - WeeklyScheduleGrid + weekday/weekend presets
 * - SchoolDayTemplatePicker
 * - HolidayTermCalendar
 * - NoSpendDuringClassToggle
 * - ResetBoundaryRules
 * - State: timezone + daylight adjustments
 */

const EVZ = { green: "#03CD8C", orange: "#F77F00", ink: "#0B1A17" } as const;

type Child = { id: string; name: string; school: string; className: string; stream?: string };

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

type DaySchedule = {
  enabled: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
};

type WeekSchedule = Record<Day, DaySchedule>;

type SchoolTemplate = "Standard" | "Half-day" | "Boarding" | "Custom";

type ClassBlock = { id: string; name: string; days: Day[]; start: string; end: string };

type Term = { id: string; name: string; start: string; end: string };

type Holiday = { id: string; name: string; date: string; type: "Holiday" | "Exam" | "Half-day" };

type ResetRules = {
  resetDailyAtMidnight: boolean;
  resetWeeklyOnMonday: boolean;
  resetLunchDaily: boolean;
  lunchResetTime: string;
  resetAtTermStart: boolean;
};

const CHILDREN: Child[] = [
  { id: "c_1", name: "Amina N.", school: "Greenhill Academy", className: "P6", stream: "Blue" },
  { id: "c_2", name: "Daniel K.", school: "Greenhill Academy", className: "S2", stream: "West" },
  { id: "c_3", name: "Maya R.", school: "Starlight School", className: "P3" },
];

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function useCorporateTheme() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const theme = useMemo(() => {
    const isDark = mode === "dark";
    const bg = isDark ? "#07110F" : "#F6FBF9";
    const paper = isDark ? alpha("#081A16", 0.92) : "#FFFFFF";
    const textPrimary = isDark ? "#E9FFF7" : EVZ.ink;
    const textSecondary = isDark ? alpha("#E9FFF7", 0.72) : alpha(EVZ.ink, 0.70);
    return createTheme({
      palette: {
        mode,
        primary: { main: EVZ.green },
        secondary: { main: EVZ.orange },
        background: { default: bg, paper },
        text: { primary: textPrimary, secondary: textSecondary },
        divider: isDark ? alpha("#E9FFF7", 0.12) : alpha(EVZ.ink, 0.10),
      },
      shape: { borderRadius: 18 },
      typography: {
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        h5: { fontWeight: 950, letterSpacing: -0.5 },
        h6: { fontWeight: 900, letterSpacing: -0.28 },
        button: { fontWeight: 900, textTransform: "none" },
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              border: `1px solid ${isDark ? alpha("#E9FFF7", 0.10) : alpha(EVZ.ink, 0.10)}`,
              backgroundImage:
                "radial-gradient(900px 420px at 10% 0%, rgba(3,205,140,0.12), transparent 60%), radial-gradient(900px 420px at 90% 0%, rgba(3,205,140,0.10), transparent 55%)",
            },
          },
        },
        MuiButton: { styleOverrides: { root: { borderRadius: 14, boxShadow: "none" } } },
      },
    });
  }, [mode]);
  return { theme, mode, setMode };
}

function makeDefaultWeek(): WeekSchedule {
  return {
    Mon: { enabled: true, start: "07:00", end: "18:30" },
    Tue: { enabled: true, start: "07:00", end: "18:30" },
    Wed: { enabled: true, start: "07:00", end: "18:30" },
    Thu: { enabled: true, start: "07:00", end: "18:30" },
    Fri: { enabled: true, start: "07:00", end: "18:30" },
    Sat: { enabled: true, start: "09:00", end: "19:00" },
    Sun: { enabled: false, start: "09:00", end: "19:00" },
  };
}

function applyPreset(base: WeekSchedule, preset: "Weekdays" | "Weekends" | "24/7" | "Strict") {
  const next: WeekSchedule = JSON.parse(JSON.stringify(base));
  if (preset === "Weekdays") {
    (['Mon','Tue','Wed','Thu','Fri'] as Day[]).forEach((d) => (next[d] = { enabled: true, start: "07:00", end: "18:30" }));
    return next;
  }
  if (preset === "Weekends") {
    (['Sat','Sun'] as Day[]).forEach((d) => (next[d] = { enabled: true, start: "09:00", end: "19:00" }));
    return next;
  }
  if (preset === "24/7") {
    DAYS.forEach((d) => (next[d] = { enabled: true, start: "00:00", end: "23:59" }));
    return next;
  }
  // Strict
  (['Mon','Tue','Wed','Thu','Fri'] as Day[]).forEach((d) => (next[d] = { enabled: true, start: "06:30", end: "18:00" }));
  next.Sat = { enabled: true, start: "08:30", end: "14:00" };
  next.Sun = { enabled: false, start: "00:00", end: "00:00" };
  return next;
}

function parseTime(t: string) {
  const [h, m] = (t || "00:00").split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function timeRangeValid(start: string, end: string) {
  return parseTime(start) < parseTime(end);
}

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const as = parseTime(aStart);
  const ae = parseTime(aEnd);
  const bs = parseTime(bStart);
  const be = parseTime(bEnd);
  if (as >= ae || bs >= be) return true;
  return as < be && bs < ae;
}

function fmtLocalTime(date: Date, tz: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    // fallback
    return date.toLocaleTimeString();
  }
}

export default function EduPocketScheduleControls() {
  const { theme, mode, setMode } = useCorporateTheme();

  const [childId, setChildId] = useState("c_1");
  const child = useMemo(() => CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0], [childId]);

  const [timezone, setTimezone] = useState("Africa/Kampala");
  const [dstAware, setDstAware] = useState(false);

  const [week, setWeek] = useState<WeekSchedule>(makeDefaultWeek());

  const [template, setTemplate] = useState<SchoolTemplate>("Standard");

  const [noSpendDuringClass, setNoSpendDuringClass] = useState(true);
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([
    { id: "cb1", name: "Morning class", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "08:00", end: "10:00" },
    { id: "cb2", name: "Late morning", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "10:45", end: "12:00" },
    { id: "cb3", name: "Afternoon", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "14:00", end: "16:00" },
  ]);

  const [terms, setTerms] = useState<Term[]>([
    { id: "t1", name: "Term 1", start: "2026-02-03", end: "2026-05-02" },
    { id: "t2", name: "Term 2", start: "2026-06-01", end: "2026-08-29" },
  ]);

  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: "h1", name: "Founders Day", date: "2026-03-21", type: "Holiday" },
    { id: "h2", name: "Midterm Exams", date: "2026-04-15", type: "Exam" },
  ]);

  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [holidayDraft, setHolidayDraft] = useState<Holiday>({ id: "", name: "", date: "", type: "Holiday" });

  const [resetRules, setResetRules] = useState<ResetRules>({
    resetDailyAtMidnight: true,
    resetWeeklyOnMonday: true,
    resetLunchDaily: true,
    lunchResetTime: "13:30",
    resetAtTermStart: true,
  });

  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "info" | "warning" | "error" }>({
    open: false,
    msg: "",
    sev: "info",
  });

  // Live clock preview in chosen timezone
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toast = (msg: string, sev: "success" | "info" | "warning" | "error" = "info") => setSnack({ open: true, msg, sev });

  // Template picker affects week + class blocks defaults
  const applySchoolTemplate = (t: SchoolTemplate) => {
    setTemplate(t);
    if (t === "Standard") {
      setWeek((w) => applyPreset(w, "Weekdays"));
      setNoSpendDuringClass(true);
      setClassBlocks([
        { id: "cb1", name: "Morning class", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "08:00", end: "10:00" },
        { id: "cb2", name: "Late morning", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "10:45", end: "12:00" },
        { id: "cb3", name: "Afternoon", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "14:00", end: "16:00" },
      ]);
      toast("Applied Standard school day template", "success");
      return;
    }
    if (t === "Half-day") {
      setWeek((w) => {
        const next = applyPreset(w, "Weekdays");
        (['Mon','Tue','Wed','Thu','Fri'] as Day[]).forEach((d) => (next[d] = { enabled: true, start: "07:00", end: "13:30" }));
        return next;
      });
      setNoSpendDuringClass(true);
      setClassBlocks([
        { id: "cb1", name: "Morning class", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "08:00", end: "10:00" },
        { id: "cb2", name: "Late morning", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "10:30", end: "12:30" },
      ]);
      toast("Applied Half-day template", "success");
      return;
    }
    if (t === "Boarding") {
      setWeek((w) => {
        const next = applyPreset(w, "24/7");
        next.Sun = { enabled: true, start: "06:00", end: "21:30" };
        return next;
      });
      setNoSpendDuringClass(false);
      setClassBlocks([]);
      toast("Applied Boarding template", "success");
      return;
    }
    toast("Custom template selected", "info");
  };

  // Validation: schedule times must be valid; class blocks must not overlap with each other
  const scheduleErrors = useMemo(() => {
    const errs: string[] = [];
    for (const d of DAYS) {
      const s = week[d];
      if (!s.enabled) continue;
      if (!timeRangeValid(s.start, s.end)) errs.push(`${d}: start must be before end`);
    }

    if (noSpendDuringClass) {
      // class block validity
      for (const b of classBlocks) {
        if (!b.name.trim()) errs.push("A class block is missing a name");
        if (!b.days.length) errs.push(`Class block "${b.name || "(unnamed)"}" has no days selected`);
        if (!timeRangeValid(b.start, b.end)) errs.push(`Class block "${b.name || "(unnamed)"}": start must be before end`);
      }
      // overlap detection per day
      for (const day of DAYS) {
        const blocks = classBlocks.filter((b) => b.days.includes(day));
        for (let i = 0; i < blocks.length; i++) {
          for (let j = i + 1; j < blocks.length; j++) {
            if (overlap(blocks[i].start, blocks[i].end, blocks[j].start, blocks[j].end)) {
              errs.push(`Overlapping class blocks on ${day}: "${blocks[i].name}" overlaps "${blocks[j].name}"`);
            }
          }
        }
      }
    }

    return Array.from(new Set(errs));
  }, [week, classBlocks, noSpendDuringClass]);

  const hasErrors = scheduleErrors.length > 0;

  const addHoliday = () => {
    if (!holidayDraft.name.trim() || !holidayDraft.date) {
      toast("Holiday name and date are required", "warning");
      return;
    }
    const id = `h_${Math.floor(100000 + Math.random() * 899999)}`;
    setHolidays((p) => [{ ...holidayDraft, id }, ...p]);
    setHolidayDraft({ id: "", name: "", date: "", type: "Holiday" });
    setHolidayDialogOpen(false);
    toast("Holiday added", "success");
  };

  const removeHoliday = (id: string) => {
    setHolidays((p) => p.filter((h) => h.id !== id));
    toast("Holiday removed", "info");
  };

  const resetToDefaults = () => {
    setTimezone("Africa/Kampala");
    setDstAware(false);
    setWeek(makeDefaultWeek());
    applySchoolTemplate("Standard");
    setTerms([
      { id: "t1", name: "Term 1", start: "2026-02-03", end: "2026-05-02" },
      { id: "t2", name: "Term 2", start: "2026-06-01", end: "2026-08-29" },
    ]);
    setHolidays([
      { id: "h1", name: "Founders Day", date: "2026-03-21", type: "Holiday" },
      { id: "h2", name: "Midterm Exams", date: "2026-04-15", type: "Exam" },
    ]);
    setResetRules({
      resetDailyAtMidnight: true,
      resetWeeklyOnMonday: true,
      resetLunchDaily: true,
      lunchResetTime: "13:30",
      resetAtTermStart: true,
    });
    toast("Reset to defaults", "info");
  };

  const save = () => {
    if (hasErrors) {
      toast("Fix validation issues before saving", "warning");
      return;
    }
    toast("Schedule controls saved", "success");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppShell
        mode={mode}
        onToggleMode={() => setMode(mode === "dark" ? "light" : "dark")}
        childName={`${child.name} • ${child.school}`}
      >
        <Container maxWidth="xl" disableGutters>
          <Card>
            <CardContent>
              <Stack spacing={2.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">Schedule controls</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set allowed spending hours, school-day blocks, holidays and reset boundaries.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} sx={{ minWidth: 260 }}>
                      {CHILDREN.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} • {c.school}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={resetToDefaults} sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}>
                      Reset
                    </Button>
                    <Button variant="contained" startIcon={<CheckCircle />} onClick={save} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                      Save
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Timezone & DST */}
                <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.6,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(EVZ.green, 0.12),
                            color: EVZ.green,
                            border: `1px solid ${alpha(EVZ.green, 0.22)}`,
                          }}
                        >
                          <Sun fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                            Timezone and daylight
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Schedules are evaluated in the child’s local timezone.
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                        <TextField
                          select
                          label="Timezone"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          sx={{ minWidth: 240 }}
                        >
                          <MenuItem value="Africa/Kampala">Africa/Kampala</MenuItem>
                          <MenuItem value="Africa/Nairobi">Africa/Nairobi</MenuItem>
                          <MenuItem value="Europe/London">Europe/London</MenuItem>
                          <MenuItem value="America/New_York">America/New_York</MenuItem>
                          <MenuItem value="Asia/Shanghai">Asia/Shanghai</MenuItem>
                        </TextField>
                        <Card
                          variant="outlined"
                          sx={{ bgcolor: alpha("#FFFFFF", 0.72), borderColor: alpha(EVZ.ink, 0.12), px: 1.2, py: 0.7 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>
                              DST aware
                            </Typography>
                            <Switch size="small" checked={dstAware} onChange={(e) => setDstAware(e.target.checked)} />
                          </Stack>
                        </Card>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.2 }} />

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Current time in {timezone}: <b>{fmtLocalTime(now, timezone)}</b>
                      </Typography>
                      <Chip
                        size="small"
                        label={dstAware ? "Daylight adjustments enabled" : "Daylight adjustments off"}
                        sx={{
                          fontWeight: 900,
                          bgcolor: alpha(dstAware ? EVZ.orange : EVZ.green, 0.10),
                          color: dstAware ? EVZ.orange : EVZ.green,
                          border: `1px solid ${alpha(dstAware ? EVZ.orange : EVZ.green, 0.22)}`,
                        }}
                      />
                    </Stack>

                    {dstAware ? (
                      <Alert severity="info" icon={<Info />} sx={{ mt: 1.2 }}>
                        Daylight saving may shift local clocks. We evaluate schedule rules using local time in the selected timezone.
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Weekly schedule grid + presets */}
                <Card>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Weekly schedule</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Define allowed spending windows per day.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {(["Weekdays", "Weekends", "24/7", "Strict"] as const).map((p) => (
                          <Button
                            key={p}
                            size="small"
                            variant="outlined"
                            startIcon={<Schedule />}
                            onClick={() => {
                              setWeek((w) => applyPreset(w, p));
                              toast(`Applied preset: ${p}`, "success");
                            }}
                            sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                          >
                            {p}
                          </Button>
                        ))}
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={1.2}>
                      {DAYS.map((d) => {
                        const s = week[d];
                        const invalid = s.enabled && !timeRangeValid(s.start, s.end);
                        return (
                          <Grid key={d} item xs={12} md={6}>
                            <Card
                              variant="outlined"
                              component={motion.div}
                              whileHover={{ y: -2 }}
                              sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72), borderColor: invalid ? alpha(EVZ.orange, 0.35) : alpha(EVZ.ink, 0.12) }}
                            >
                              <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                  <Stack direction="row" spacing={1.2} alignItems="center">
                                    <Box
                                      sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 2.5,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: alpha(s.enabled ? EVZ.green : EVZ.ink, s.enabled ? 0.12 : 0.06),
                                        color: s.enabled ? EVZ.green : "text.primary",
                                        border: `1px solid ${alpha(s.enabled ? EVZ.green : EVZ.ink, s.enabled ? 0.22 : 0.10)}`,
                                      }}
                                    >
                                      <Schedule fontSize="small" />
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                        {d}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {s.enabled ? `${s.start} to ${s.end}` : "Off"}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  <Switch
                                    checked={s.enabled}
                                    onChange={(e) => setWeek((p) => ({ ...p, [d]: { ...p[d], enabled: e.target.checked } }))}
                                  />
                                </Stack>

                                <Divider sx={{ my: 1.2 }} />

                                <Grid container spacing={1.2}>
                                  <Grid item xs={6}>
                                    <TextField
                                      label="Start"
                                      type="time"
                                      value={s.start}
                                      onChange={(e) => setWeek((p) => ({ ...p, [d]: { ...p[d], start: e.target.value } }))}
                                      InputLabelProps={{ shrink: true }}
                                      disabled={!s.enabled}
                                      fullWidth
                                    />
                                  </Grid>
                                  <Grid item xs={6}>
                                    <TextField
                                      label="End"
                                      type="time"
                                      value={s.end}
                                      onChange={(e) => setWeek((p) => ({ ...p, [d]: { ...p[d], end: e.target.value } }))}
                                      InputLabelProps={{ shrink: true }}
                                      disabled={!s.enabled}
                                      fullWidth
                                    />
                                  </Grid>
                                </Grid>

                                {invalid ? (
                                  <Alert severity="warning" icon={<Info />} sx={{ mt: 1.2 }}>
                                    Start must be before end.
                                  </Alert>
                                ) : null}
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      Schedule windows define when spending is allowed. Class blocks can further restrict time.
                    </Alert>
                  </CardContent>
                </Card>

                {/* School day template picker */}
                <Card>
                  <CardContent>
                    <Typography variant="h6">School day templates</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Apply a standard school-day layout and class blocks.
                    </Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <TextField select label="Template" value={template} onChange={(e) => applySchoolTemplate(e.target.value as SchoolTemplate)} sx={{ minWidth: 260 }}>
                        <MenuItem value="Standard">Standard</MenuItem>
                        <MenuItem value="Half-day">Half-day</MenuItem>
                        <MenuItem value="Boarding">Boarding</MenuItem>
                        <MenuItem value="Custom">Custom</MenuItem>
                      </TextField>

                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          startIcon={<Refresh />}
                          onClick={() => applySchoolTemplate(template)}
                          sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                        >
                          Re-apply
                        </Button>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>No spend during class</Typography>
                            <Typography variant="caption" color="text.secondary">Blocks spending inside class periods (optional).</Typography>
                          </Box>
                          <Switch checked={noSpendDuringClass} onChange={(e) => setNoSpendDuringClass(e.target.checked)} />
                        </Stack>

                        {noSpendDuringClass ? (
                          <>
                            <Divider sx={{ my: 1.2 }} />
                            <Stack spacing={1}>
                              {classBlocks.map((b) => (
                                <Card key={b.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                                  <CardContent>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{b.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{b.days.join(", ")} • {b.start}-{b.end}</Typography>
                                      </Box>
                                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <TextField
                                          label="Start"
                                          type="time"
                                          value={b.start}
                                          onChange={(e) => setClassBlocks((p) => p.map((x) => (x.id === b.id ? { ...x, start: e.target.value } : x)))}
                                          InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                          label="End"
                                          type="time"
                                          value={b.end}
                                          onChange={(e) => setClassBlocks((p) => p.map((x) => (x.id === b.id ? { ...x, end: e.target.value } : x)))}
                                          InputLabelProps={{ shrink: true }}
                                        />
                                        <Button
                                          variant="outlined"
                                          startIcon={<Close />}
                                          onClick={() => setClassBlocks((p) => p.filter((x) => x.id !== b.id))}
                                          sx={{ borderColor: alpha(EVZ.orange, 0.55), color: EVZ.orange }}
                                        >
                                          Remove
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              ))}

                              <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={() => {
                                  const id = `cb_${Math.floor(100000 + Math.random() * 899999)}`;
                                  setClassBlocks((p) => [{ id, name: "New class block", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: "08:00", end: "09:00" }, ...p]);
                                  toast("Class block added", "success");
                                }}
                                sx={{ borderColor: alpha(EVZ.ink, 0.20), color: "text.primary" }}
                              >
                                Add class block
                              </Button>
                            </Stack>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                {/* Holiday/Term calendar */}
                <Card>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Holiday and term calendar</Typography>
                        <Typography variant="body2" color="text.secondary">Schedule-aware days for school terms and holidays.</Typography>
                      </Box>
                      <Button variant="contained" startIcon={<Add />} onClick={() => setHolidayDialogOpen(true)} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
                        Add holiday
                      </Button>
                    </Stack>

                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={2.2}>
                      <Grid item xs={12} lg={6}>
                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Terms</Typography>
                            <Typography variant="caption" color="text.secondary">Used for term resets and allowance skipping rules.</Typography>
                            <Divider sx={{ my: 1.2 }} />

                            <Stack spacing={1}>
                              {terms.map((t) => (
                                <Card key={t.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                                  <CardContent>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{t.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{t.start} to {t.end}</Typography>
                                      </Box>
                                      <Chip size="small" icon={<Event fontSize="small" />} label="Term" sx={{ fontWeight: 900 }} />
                                    </Stack>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} lg={6}>
                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Holidays / events</Typography>
                            <Typography variant="caption" color="text.secondary">Can be used to skip allowances or adjust schedule.</Typography>
                            <Divider sx={{ my: 1.2 }} />

                            {holidays.length === 0 ? (
                              <Alert severity="info" icon={<Info />}>No holidays added.</Alert>
                            ) : (
                              <Stack spacing={1}>
                                {holidays
                                  .slice()
                                  .sort((a, b) => (a.date < b.date ? -1 : 1))
                                  .map((h) => (
                                    <Card key={h.id} variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.70) }}>
                                      <CardContent>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                          <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{h.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{h.date} • {h.type}</Typography>
                                          </Box>
                                          <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip size="small" label={h.type} sx={{ fontWeight: 900 }} />
                                            <Button size="small" startIcon={<Close />} onClick={() => removeHoliday(h.id)}>
                                              Remove
                                            </Button>
                                          </Stack>
                                        </Stack>
                                      </CardContent>
                                    </Card>
                                  ))}
                              </Stack>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Reset boundary rules */}
                <Card>
                  <CardContent>
                    <Typography variant="h6">Reset boundaries</Typography>
                    <Typography variant="body2" color="text.secondary">Define how counters reset across time boundaries.</Typography>
                    <Divider sx={{ my: 1.6 }} />

                    <Grid container spacing={1.6}>
                      <Grid item xs={12} md={6}>
                        <ToggleRow
                          title="Reset daily at midnight"
                          desc="Daily spending caps reset at 00:00 local time."
                          checked={resetRules.resetDailyAtMidnight}
                          onChange={(v) => setResetRules((p) => ({ ...p, resetDailyAtMidnight: v }))}
                          mode={mode}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <ToggleRow
                          title="Reset weekly on Monday"
                          desc="Weekly caps reset at Monday 00:00 local time."
                          checked={resetRules.resetWeeklyOnMonday}
                          onChange={(v) => setResetRules((p) => ({ ...p, resetWeeklyOnMonday: v }))}
                          mode={mode}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <ToggleRow
                          title="Lunch reset daily"
                          desc="Optional lunch counters reset each day."
                          checked={resetRules.resetLunchDaily}
                          onChange={(v) => setResetRules((p) => ({ ...p, resetLunchDaily: v }))}
                          mode={mode}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
                          <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Lunch reset time</Typography>
                                <Typography variant="caption" color="text.secondary">When lunch counters reset.</Typography>
                              </Box>
                              <TextField
                                type="time"
                                value={resetRules.lunchResetTime}
                                onChange={(e) => setResetRules((p) => ({ ...p, lunchResetTime: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                disabled={!resetRules.resetLunchDaily}
                              />
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <ToggleRow
                          title="Reset at term start"
                          desc="Term caps reset when a new term begins."
                          checked={resetRules.resetAtTermStart}
                          onChange={(v) => setResetRules((p) => ({ ...p, resetAtTermStart: v }))}
                          mode={mode}
                        />
                      </Grid>
                    </Grid>

                    <Alert severity="info" icon={<Info />} sx={{ mt: 1.6 }}>
                      Resets are evaluated using the selected timezone. If DST is enabled, resets follow the local clock.
                    </Alert>
                  </CardContent>
                </Card>

                {/* Validation summary */}
                <AnimatePresence initial={false}>
                  {hasErrors ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert severity="warning" icon={<WarningAmber />}>
                        <b>Fix these before saving:</b>
                        <ul style={{ margin: "6px 0 0 18px" }}>
                          {scheduleErrors.slice(0, 10).map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      </Alert>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      <Alert severity="success" icon={<CheckCircle />}>No validation issues.</Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Stack>
            </CardContent>
          </Card>
        </Container>

        {/* Add holiday dialog */}
        <Dialog open={holidayDialogOpen} onClose={() => setHolidayDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack spacing={0.2}>
                <Typography variant="h6">Add holiday / event</Typography>
                <Typography variant="body2" color="text.secondary">Add a day that can affect schedule and resets.</Typography>
              </Stack>
              <IconButton onClick={() => setHolidayDialogOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.6} sx={{ mt: 1 }}>
              <TextField label="Name" value={holidayDraft.name} onChange={(e) => setHolidayDraft((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <TextField label="Date" type="date" value={holidayDraft.date} onChange={(e) => setHolidayDraft((p) => ({ ...p, date: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField select label="Type" value={holidayDraft.type} onChange={(e) => setHolidayDraft((p) => ({ ...p, type: e.target.value as any }))} fullWidth>
                <MenuItem value="Holiday">Holiday</MenuItem>
                <MenuItem value="Exam">Exam</MenuItem>
                <MenuItem value="Half-day">Half-day</MenuItem>
              </TextField>
              <Alert severity="info" icon={<Info />}>You can use holidays to skip allowances and tighten schedule windows.</Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHolidayDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<Add />} onClick={addHoliday} sx={{ bgcolor: EVZ.green, ":hover": { bgcolor: alpha(EVZ.green, 0.92) } }}>
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </AppShell>
    </ThemeProvider>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  mode,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  mode: "light" | "dark";
}) {
  return (
    <Card variant="outlined" sx={{ bgcolor: alpha("#FFFFFF", mode === "dark" ? 0.04 : 0.72) }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {desc}
            </Typography>
          </Box>
          <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
        </Stack>
      </CardContent>
    </Card>
  );
}
