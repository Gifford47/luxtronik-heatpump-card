/*
 * Luxtronik Heatpump Card
 * Animated system diagram for heat pumps with a Luxtronik controller
 * (Novelan, Alpha Innotec, Roth, …) using the BenPru/luxtronik (luxtronik2) integration.
 *
 * No dependencies, no build step. MIT License.
 */

const CARD_VERSION = "1.3.1";

/* ------------------------------------------------------------------ */
/*  Entity mapping: logical key -> default entity (% = prefix)          */
/* ------------------------------------------------------------------ */
const ENTITY_MAP = {
  // Status
  status: "sensor.%_status",
  status_line_1: "sensor.%_status_line_1",
  status_line_3: "sensor.%_status_line_3",
  status_time: "sensor.%_status_time",
  error_reason: "sensor.%_error_reason",
  disturbance: "binary_sensor.%_disturbance_output",
  evu: "binary_sensor.%_evu_unlocked",
  smart_grid: "sensor.%_smart_grid_status",
  // Outdoor / heat source
  outdoor: "sensor.%_outdoor_temperature",
  outdoor_avg: "sensor.%_outdoor_temperature_average",
  source_in: "sensor.%_heat_source_input_temperature",
  source_out: "sensor.%_heat_source_output_temperature",
  source_flow: "sensor.%_heat_source_flow_rate",
  source_pump: "binary_sensor.%_pump_flow", // VBO: fan / brine / well pump
  // Refrigerant circuit
  compressor: "binary_sensor.%_compressor",
  frequency: "sensor.%_pump_frequency",
  hot_gas: "sensor.%_hot_gas_temperature",
  suction: "sensor.%_suction_compressor_temperature",
  evaporation: "sensor.%_suction_evaporator_temperature",
  superheat: "sensor.%_overheating_temperature",
  superheat_target: "sensor.%_overheating_target_temperature",
  high_pressure: "sensor.%_high_pressure",
  low_pressure: "sensor.%_low_pressure",
  defrost_valve: "binary_sensor.%_defrost_valve",
  // Heating water (Luxtronik naming: flow_in = flow, flow_out = return)
  flow: "sensor.%_flow_in_temperature",
  return: "sensor.%_flow_out_temperature",
  return_target: "sensor.%_flow_out_temperature_target",
  flow_rate: "sensor.%_heat_amount_flow_rate",
  pump: "binary_sensor.%_circulation_pump_heating", // HUP
  zup: "binary_sensor.%_additional_circulation_pump", // ZUP
  dhw_valve: "binary_sensor.%_dhw_recirculation_pump", // BUP / 3-way valve
  zwe: "binary_sensor.%_additional_heat_generator",
  room: "sensor.%_room_thermostat_temperature",
  room_target: "sensor.%_room_thermostat_temperature_target",
  heating_mode: "select.%_heating_mode",
  // Domestic hot water
  dhw: "sensor.%_dhw_temperature",
  dhw_target: "number.%_dhw_target_temperature",
  dhw_mode: "select.%_dhw_mode",
  // Energy
  heat_output: "sensor.%_current_heat_output",
  power: "sensor.%_current_power_consumption",
  cop_heating: "sensor.%_cop_heating",
  cop_dhw: "sensor.%_cop_dhw",
  // Lifetime counters for the overall SPF
  heat_amount_heating: "sensor.%_heat_amount_heating",
  heat_amount_dhw: "sensor.%_dhw_heat_amount",
  energy_heating: "sensor.%_heat_energy_input",
  energy_dhw: "sensor.%_dhw_energy_input",
};

const SG_HIDDEN = ["normal_operation", "unknown", "unavailable", ""];

const STATUS_STYLE = {
  heating: { color: "#f97316", icon: "mdi:radiator" },
  hot_water: { color: "#e5484d", icon: "mdi:water-boiler" },
  swimming_pool_solar: { color: "#14b8a6", icon: "mdi:pool" },
  evu: { color: "#a855f7", icon: "mdi:transmission-tower-off" },
  defrost: { color: "#06b6d4", icon: "mdi:snowflake-melt" },
  no_request: { color: "#8a8f98", icon: "mdi:sleep" },
  heating_external_source: { color: "#f59e0b", icon: "mdi:fire" },
  cooling: { color: "#3b82f6", icon: "mdi:snowflake" },
};

const I18N = {
  de: {
    title: "Wärmepumpe",
    outdoor: "Außen", refrigerant: "Kältekreis", evaporator: "Verdampfer", condenser: "Verflüssiger",
    compressor: "Verdichter", eev: "Expansionsventil", suction: "Sauggas", low_pressure: "Niederdruck",
    hot_gas: "Heißgas", high_pressure: "Hochdruck", superheat: "Überhitzung", evaporation: "Verdampfung",
    target: "Soll", heating_circuit: "Heizkreis", room: "Raum", dhw: "Warmwasser", heating: "Heizen",
    pump: "Umwälzpumpe", flow: "Vorlauf", return: "Rücklauf", flow_rate: "Durchfluss", source_flow: "Durchfluss WQ",
    evu: "EVU-Sperre", since: "seit", fault: "Störung", fault_active: "Störung aktiv",
    defrost_running: "Abtauen läuft", defrost_in: "Abtauen in",
    heat_output: "Wärmeleistung", power: "Leistungsaufnahme", cop_heating: "COP Heizen", cop_dhw: "COP Warmwasser",
    spread: "Spreizung", jaz: "Arbeitszahl gesamt", zwe: "ZWE",
    src: {
      air: { title: "Luft", in: "Luft ein", out: "Luft aus" },
      brine: { title: "Erdsonde", in: "Sole ein", out: "Sole aus" },
      water: { title: "Brunnen", in: "Wasser ein", out: "Wasser aus" },
    },
    status: {
      heating: "Heizen", hot_water: "Warmwasser", swimming_pool_solar: "Pool / Solar", evu: "EVU-Sperre",
      defrost: "Abtauen", no_request: "Keine Anforderung", heating_external_source: "Heizen (ext. Quelle)", cooling: "Kühlen",
    },
  },
  en: {
    title: "Heat pump",
    outdoor: "Outdoor", refrigerant: "Refrigerant circuit", evaporator: "Evaporator", condenser: "Condenser",
    compressor: "Compressor", eev: "Expansion valve", suction: "Suction gas", low_pressure: "Low pressure",
    hot_gas: "Hot gas", high_pressure: "High pressure", superheat: "Superheat", evaporation: "Evaporation",
    target: "Target", heating_circuit: "Heating circuit", room: "Room", dhw: "Hot water", heating: "Heating",
    pump: "Circulation pump", flow: "Flow", return: "Return", flow_rate: "Flow rate", source_flow: "Source flow",
    evu: "Utility lock", since: "for", fault: "Fault", fault_active: "Fault active",
    defrost_running: "Defrosting", defrost_in: "Defrost in",
    heat_output: "Heat output", power: "Power input", cop_heating: "COP heating", cop_dhw: "COP hot water",
    spread: "Spread", jaz: "Overall SPF", zwe: "Aux",
    src: {
      air: { title: "Air", in: "Air in", out: "Air out" },
      brine: { title: "Ground loop", in: "Brine in", out: "Brine out" },
      water: { title: "Well", in: "Water in", out: "Water out" },
    },
    status: {
      heating: "Heating", hot_water: "Hot water", swimming_pool_solar: "Pool / solar", evu: "Utility lock",
      defrost: "Defrost", no_request: "No request", heating_external_source: "Heating (ext. source)", cooling: "Cooling",
    },
  },
};
const HEAT_SOURCES = ["air", "brine", "water"];
let T = I18N.en;
function langOf(hass) {
  const l = (hass && ((hass.locale && hass.locale.language) || hass.language)) || "en";
  return String(l).toLowerCase().startsWith("de") ? "de" : "en";
}

/* ------------------------------------------------------------------ */

class LuxtronikHeatpumpCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
  }

  static getConfigElement() {
    return document.createElement("luxtronik-heatpump-card-editor");
  }

  static getStubConfig(hass) {
    const prefix = hass ? detectPrefix(hass) : undefined;
    return prefix ? { prefix } : {};
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    const hs = config.heat_source || "auto";
    if (hs !== "auto" && !HEAT_SOURCES.includes(hs)) throw new Error("heat_source must be auto, air, brine or water");
    this._config = {
      show_header: true,
      show_refrigerant: true,
      show_kpis: true,
      ...config,
      heat_source: hs,
      entities: { ...(config.entities || {}) },
    };
    this._built = false;
    this._prefix = undefined;
    if (this._hass) this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (this._lang !== langOf(hass)) this._built = false;
    // The device registry can arrive after the first states, so an "auto"
    // heat source may only become decidable on a later update.
    if (this._built && this._heatSource() !== this._builtSource) this._built = false;
    if (!this._built) this._build();
    this._update();
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return { columns: "full", min_columns: 9, rows: "auto" };
  }

  /* ---------------- Entity resolution ---------------- */

  _eid(key) {
    const ov = this._config.entities[key];
    if (ov === false || ov === null) return undefined; // explicitly hidden
    if (typeof ov === "string") return ov;
    if (this._prefix === undefined) {
      this._prefix = this._config.prefix || (this._hass && detectPrefix(this._hass)) || "luxtronik";
    }
    const tpl = ENTITY_MAP[key];
    return tpl ? tpl.replace("%", this._prefix) : undefined;
  }

  _st(key) {
    const id = this._eid(key);
    return id && this._hass ? this._hass.states[id] : undefined;
  }

  /**
   * Resolve the heat source. "auto" reads the model code the integration
   * stores as the device model (ID_WEB_Code_WP_akt, e.g. "MSW4-16", "LWC407").
   * The defrost valve entity is no evidence: luxtronik2 creates it on every
   * unit, brine and water included. It is only kept as the last resort, so
   * units whose model names no source (ERC, …) behave as before.
   */
  _heatSource() {
    const hs = this._config.heat_source;
    if (hs !== "auto") return hs;
    const h = this._hass;
    for (const key of ["status", "outdoor", "source_in", "compressor"]) {
      const id = this._eid(key);
      const ent = id && h && h.entities && h.entities[id];
      const dev = ent && ent.device_id && h.devices && h.devices[ent.device_id];
      const fromModel = dev && heatSourceFromModel(dev.model);
      if (fromModel) return fromModel;
    }
    return this._st("defrost_valve") ? "air" : "brine";
  }

  _num(key) {
    const s = this._st(key);
    if (!s) return NaN;
    return parseFloat(s.state);
  }

  _on(key) {
    const s = this._st(key);
    return !!s && s.state === "on";
  }

  _fmtNumber(v, digits) {
    try {
      return new Intl.NumberFormat((this._hass && this._hass.locale && this._hass.locale.language) || this._lang || "en", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(v);
    } catch (e) {
      return v.toFixed(digits);
    }
  }

  _fmt(key) {
    const s = this._st(key);
    if (!s || s.state === "unavailable" || s.state === "unknown") return "–";
    const unit = (s.attributes && s.attributes.unit_of_measurement) || "";
    const v = parseFloat(s.state);
    if (isNaN(v) || !/^-?[\d.]+(e-?\d+)?$/i.test(String(s.state).trim())) {
      return this._fmtState(s);
    }
    return this._fmtValue(v, unit);
  }

  _fmtValue(v, unit) {
    switch (unit) {
      case "W":
        return Math.abs(v) >= 1000 ? `${this._fmtNumber(v / 1000, 2)} kW` : `${this._fmtNumber(v, 0)} W`;
      case "kW":
        return `${this._fmtNumber(v, 2)} kW`;
      case "Hz":
      case "l/h":
      case "L/h":
      case "%":
        return `${this._fmtNumber(v, 0)} ${unit}`;
      case "":
        return this._fmtNumber(v, 2);
      default:
        return `${this._fmtNumber(v, 1)} ${unit}`;
    }
  }

  _fmtState(s) {
    const h = this._hass;
    if (h && typeof h.formatEntityState === "function") {
      try {
        return h.formatEntityState(s);
      } catch (e) {
        /* fallthrough */
      }
    }
    return T.status[s.state] || s.state;
  }

  _moreInfo(key) {
    const entityId = this._eid(key);
    if (!entityId) return;
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  /* ---------------- Build ---------------- */

  _build() {
    if (!this._hass) return;
    this._lang = langOf(this._hass);
    T = I18N[this._lang];
    const c = { ...this._config, title: this._config.title || T.title };
    c.heat_source = this._heatSource();
    this._builtSource = c.heat_source;
    const src = T.src[c.heat_source];
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <ha-card><div class="lxwrap">
        ${c.show_header ? headerTpl(c) : ""}
        <div class="banner" data-banner hidden>
          <ha-icon icon="mdi:alert-circle"></ha-icon><span data-banner-text></span>
        </div>
        <div class="schema">
          ${svgTpl(c, src)}
        </div>
        <div class="temps">
          ${[["outdoor", T.outdoor], ["flow", T.flow], ["return", T.return], ["flow_rate", T.flow_rate]]
            .map(([k, t]) => `<div class="mini" data-k="${k}"><span class="t">${t}</span><span class="n">–</span></div>`)
            .join("")}
        </div>
        ${c.show_kpis ? kpiTpl() : ""}
      </div></ha-card>`;
    this._root = this.shadowRoot;
    this._root.querySelectorAll("[data-k],[data-click]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this._moreInfo(el.dataset.click || el.dataset.k);
      });
    });
    this._built = true;
  }

  /* ---------------- Update ---------------- */

  _update() {
    const r = this._root;
    if (!r || !this._hass) return;
    T = I18N[this._lang] || I18N.en;

    // All value fields
    r.querySelectorAll("[data-k]").forEach((g) => {
      const key = g.dataset.k;
      const st = this._st(key);
      g.classList.toggle("missing", !st);
      const n = g.querySelector(".n");
      if (n) n.textContent = this._fmt(key);
      const subKey = g.dataset.sub;
      const sub = g.querySelector(".s");
      if (sub && subKey) {
        const ss = this._st(subKey);
        sub.textContent = ss ? `${g.dataset.subLabel || ""}${this._fmt(subKey)}` : "";
      }
    });

    // States
    const status = (this._st("status") || {}).state || "";
    const compressorSt = this._st("compressor");
    const compressorOn = compressorSt
      ? compressorSt.state === "on"
      : ["heating", "hot_water", "cooling", "swimming_pool_solar", "defrost"].includes(status);
    const defrost = status === "defrost" || this._on("defrost_valve");
    // Which circuit is served? Valve/BUP entity decides if configured,
    // otherwise the operating state of the heat pump.
    const dhwValveSt = this._st("dhw_valve");
    const dhwActive = dhwValveSt && !["unknown", "unavailable"].includes(dhwValveSt.state)
      ? dhwValveSt.state === "on"
      : status === "hot_water";
    // Is heating water moving? Any of HUP / ZUP / BUP running, or measurable flow.
    // Without any of these entities: compressor running or external heat source.
    const pumpKeys = ["pump", "zup", "dhw_valve"];
    const flowRate = this._num("flow_rate");
    const hasPumpInfo = pumpKeys.some((k) => this._st(k)) || !isNaN(flowRate);
    const pumpOn = hasPumpInfo
      ? pumpKeys.some((k) => this._on(k)) || flowRate > 50
      : compressorOn || status === "heating_external_source";
    const zweOn = this._on("zwe");
    const srcPumpSt = this._st("source_pump");
    const srcOn = srcPumpSt ? srcPumpSt.state === "on" : compressorOn;
    const evuLock = status === "evu";

    const svg = r.querySelector("svg.hp");
    if (svg) {
      svg.classList.toggle("comp-on", compressorOn);
      svg.classList.toggle("src-on", srcOn && !defrost);
      svg.classList.toggle("defrost", defrost);
      svg.classList.toggle("pump-on", pumpOn);
      svg.classList.toggle("dhw", pumpOn && dhwActive);
      svg.classList.toggle("heat", pumpOn && !dhwActive);
      svg.classList.toggle("zwe-on", zweOn);
      svg.classList.toggle("has-zwe", !!this._st("zwe"));
      svg.classList.toggle("no-refrigerant", !this._config.show_refrigerant);
    }

    // Defrost countdown (air source; attribute of the status-time sensor)
    const abt = r.querySelector("[data-defrost-in]");
    if (abt) {
      const t = this._st("status_time");
      let txt = "";
      if (defrost) txt = T.defrost_running;
      else if (t && t.attributes) {
        const k = Object.keys(t.attributes).find((a) => a.startsWith("Abtauen in"));
        const sec = k ? parseFloat(t.attributes[k]) : NaN;
        if (!isNaN(sec) && sec > 0) txt = `${T.defrost_in} ${fmtDuration(sec)}`;
      }
      abt.textContent = txt;
    }

    // Tank fill colour
    const dhwT = this._num("dhw");
    const tankFill = r.querySelector("[data-tank-fill]");
    if (tankFill) tankFill.setAttribute("fill", tempColor(isNaN(dhwT) ? 35 : dhwT, 20, 62));
    const tankTxt = r.querySelector("[data-tank-temp]");
    if (tankTxt) tankTxt.textContent = this._fmt("dhw");

    // Header
    const chip = r.querySelector("[data-status-chip]");
    if (chip) {
      const style = STATUS_STYLE[status] || STATUS_STYLE.no_request;
      chip.style.setProperty("--chip", style.color);
      const ic = chip.querySelector("ha-icon");
      if (ic) ic.setAttribute("icon", style.icon);
      const statusSt = this._st("status");
      chip.querySelector("span").textContent = statusSt ? this._fmtState(statusSt) : "–";
    }
    const lines = r.querySelector("[data-status-lines]");
    if (lines) {
      const parts = [];
      for (const k of ["status_line_1", "status_line_3"]) {
        const s = this._st(k);
        if (s && !["unknown", "unavailable", "", "none"].includes(s.state)) parts.push(this._fmtState(s));
      }
      const t = this._st("status_time");
      if (t && !["unknown", "unavailable"].includes(t.state)) {
        const sec = parseFloat(t.state);
        const txt = (t.attributes && t.attributes.status_text) || (isNaN(sec) ? "" : fmtDuration(sec));
        if (txt) parts.push(`${T.since} ${txt}`);
      }
      lines.textContent = parts.join(" · ");
    }
    const evuChip = r.querySelector("[data-evu]");
    if (evuChip) evuChip.hidden = !evuLock;
    const sgChip = r.querySelector("[data-sg]");
    if (sgChip) {
      const sg = this._st("smart_grid");
      sgChip.hidden = !sg || SG_HIDDEN.includes(sg.state);
      if (sg) sgChip.querySelector("span").textContent = this._fmtState(sg);
    }

    // Fault banner
    const banner = r.querySelector("[data-banner]");
    if (banner) {
      const dist = this._on("disturbance");
      banner.hidden = !dist;
      if (dist) {
        const er = this._st("error_reason");
        r.querySelector("[data-banner-text]").textContent = er
          ? `${T.fault}: ${this._fmtState(er)}`
          : T.fault_active;
      }
    }

    // KPIs
    const kpi = (name, text, missing) => {
      const el = r.querySelector(`[data-kpi="${name}"]`);
      if (!el) return;
      el.classList.toggle("missing", !!missing);
      el.querySelector(".kv").textContent = text;
    };
    kpi("heat_output", this._fmt("heat_output"), !this._st("heat_output"));
    kpi("power", this._fmt("power"), !this._st("power"));

    // COP depends on mode; fallback = heat output / power input
    let cop = NaN;
    let copKey = dhwActive ? "cop_dhw" : "cop_heating";
    cop = this._num(copKey);
    const heatW = toWatt(this._st("heat_output"));
    const elW = toWatt(this._st("power"));
    if ((isNaN(cop) || !this._st(copKey)) && !isNaN(heatW) && !isNaN(elW) && elW > 50) {
      cop = heatW / elW;
      copKey = "power";
    }
    const copEl = r.querySelector('[data-kpi="cop"]');
    if (copEl) copEl.dataset.click = copKey;
    kpi("cop", !isNaN(cop) && compressorOn ? this._fmtNumber(cop, 2) : "–", isNaN(cop) && !this._st(copKey));
    const copLbl = r.querySelector("[data-cop-label]");
    if (copLbl) copLbl.textContent = dhwActive ? T.cop_dhw : T.cop_heating;

    const vl = this._num("flow");
    const rl = this._num("return");
    kpi("spread", pumpOn && !isNaN(vl) && !isNaN(rl) ? `${this._fmtNumber(vl - rl, 1)} K` : "–", isNaN(vl) || isNaN(rl));

    // Overall SPF since commissioning: Σ heat / Σ electricity (heating + DHW)
    const sum = (keys) => keys.reduce((a, k) => a + (isNaN(this._num(k)) ? 0 : this._num(k)), 0);
    const hasJaz = ["heat_amount_heating", "energy_heating"].every((k) => this._st(k));
    const q = sum(["heat_amount_heating", "heat_amount_dhw"]);
    const w = sum(["energy_heating", "energy_dhw"]);
    kpi("jaz", hasJaz && w > 0 ? this._fmtNumber(q / w, 2) : "–", !hasJaz);
  }

  connectedCallback() {
    if (this._config && this._hass && !this._built) this._build();
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function detectPrefix(hass) {
  const ids = Object.keys(hass.states || {});
  for (const id of ids) {
    const m = id.match(/^sensor\.(luxtronik\w*?)_status$/);
    if (m && hass.states[`sensor.${m[1]}_outdoor_temperature`]) return m[1];
  }
  for (const id of ids) {
    const m = id.match(/^sensor\.(\w+?)_flow_out_temperature_target$/);
    if (m && hass.states[`sensor.${m[1]}_status`]) return m[1];
  }
  return undefined;
}

/**
 * Map a Luxtronik model code to its heat source. Codes as reported by
 * ID_WEB_Code_WP_akt: L…/KLW = air/water, HMD 2/HZ_HMD = hydraulic module of
 * an air split unit, SW…/MSW…/KSW/WZS = brine/water, WW…/WZW… = water/water.
 * WWB_20 (a DHW heat pump), ERC and unknown codes say nothing.
 */
function heatSourceFromModel(model) {
  const m = String(model || "").toUpperCase().replace(/\s+/g, "");
  if (!m) return undefined;
  if (/^(WW(?!B)|WZW)/.test(m)) return "water";
  if (/^(SW|MSW|KSW|WZS)/.test(m)) return "brine";
  if (/^(L|KLW|HMD|HZ_HMD)/.test(m)) return "air";
  return undefined;
}

function fmtDuration(sec) {
  const m = Math.round(sec / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} h`;
}

function toWatt(s) {
  if (!s) return NaN;
  const v = parseFloat(s.state);
  if (isNaN(v)) return NaN;
  const u = (s.attributes && s.attributes.unit_of_measurement) || "W";
  return u === "kW" ? v * 1000 : v;
}

function tempColor(t, min, max) {
  // cold (blue) -> warm (orange) -> hot (red)
  const x = Math.max(0, Math.min(1, (t - min) / (max - min)));
  const stops = [
    [0, [59, 130, 246]],
    [0.55, [245, 158, 11]],
    [1, [229, 72, 77]],
  ];
  let i = 0;
  while (i < stops.length - 2 && x > stops[i + 1][0]) i++;
  const [x0, c0] = stops[i];
  const [x1, c1] = stops[i + 1];
  const f = (x - x0) / (x1 - x0);
  const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * f));
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.28)`;
}

/* SVG value label: title + value (+ optional sub line) */
function lbl(key, x, y, title, opts = {}) {
  const a = opts.anchor || "middle";
  const sub = opts.sub
    ? ` data-sub="${opts.sub}" data-sub-label="${opts.subLabel || ""}"`
    : "";
  return `
    <g class="v${opts.big ? " big" : ""}" data-k="${key}"${sub} transform="translate(${x},${y})">
      <rect class="hit" x="${a === "start" ? -4 : a === "end" ? -96 : -50}" y="-14" width="100" height="${opts.sub ? 56 : 38}" rx="6"/>
      <text class="t" text-anchor="${a}">${title}</text>
      <text class="n" y="${opts.big ? 24 : 19}" text-anchor="${a}">–</text>
      ${opts.sub ? `<text class="s" y="${opts.big ? 42 : 36}" text-anchor="${a}"></text>` : ""}
    </g>`;
}

function headerTpl(c) {
  return `
    <div class="header">
      <div class="title">
        <ha-icon icon="mdi:heat-pump-outline"></ha-icon>
        <div>
          <div class="name">${escapeHtml(c.title)}</div>
          <div class="lines" data-status-lines></div>
        </div>
      </div>
      <div class="chips">
        <div class="chip status" data-status-chip data-click="status"><ha-icon icon="mdi:sleep"></ha-icon><span>–</span></div>
        <div class="chip sg" data-sg data-click="smart_grid" hidden><ha-icon icon="mdi:transmission-tower"></ha-icon><span>–</span></div>
        <div class="chip evu" data-evu data-click="evu" hidden><ha-icon icon="mdi:transmission-tower-off"></ha-icon><span>${T.evu}</span></div>
      </div>
    </div>
    <div class="modes">
      <div class="mode" data-k="heating_mode"><ha-icon icon="mdi:radiator"></ha-icon><span class="t">${T.heating}</span><span class="n">–</span></div>
      <div class="mode" data-k="dhw_mode"><ha-icon icon="mdi:water-boiler"></ha-icon><span class="t">${T.dhw}</span><span class="n">–</span></div>
    </div>`;
}

function kpiTpl() {
  const tile = (key, label, icon, click) => `
    <div class="kpi" data-kpi="${key}" data-click="${click || key}">
      <ha-icon icon="${icon}"></ha-icon>
      <div><div class="kl"${key === "cop" ? " data-cop-label" : ""}>${label}</div><div class="kv">–</div></div>
    </div>`;
  return `
    <div class="kpis">
      ${tile("heat_output", T.heat_output, "mdi:fire")}
      ${tile("power", T.power, "mdi:flash")}
      ${tile("cop", "COP", "mdi:gauge", "cop_heating")}
      ${tile("spread", T.spread, "mdi:arrow-expand-vertical", "flow")}
      ${tile("jaz", T.jaz, "mdi:chart-line", "heat_amount_heating")}
    </div>`;
}

function zigzag(x, y1, y2, w, n) {
  // vertical heat-exchanger coil
  const step = (y2 - y1) / n;
  let d = `M${x + w / 2} ${y1}`;
  for (let i = 0; i < n; i++) {
    const yy = y1 + step * (i + 0.5);
    d += ` L${i % 2 ? x + 6 : x + w - 6} ${yy}`;
  }
  d += ` L${x + w / 2} ${y2}`;
  return d;
}

function pipe(cls, d) {
  return `<path class="pipe base ${cls}" d="${d}"/><path class="pipe flow ${cls}" d="${d}"/>`;
}

function sourceTpl(c, src) {
  if (c.heat_source === "air") {
    const arrows = [235, 280, 325]
      .map((y) => `<path class="air" d="M8 ${y} h34 m-8 -6 l8 6 l-8 6"/>`)
      .join("");
    return `
      <g class="source air-src">
        ${arrows}
        <rect class="box" x="52" y="185" width="176" height="190" rx="16"/>
        <g class="fan" transform="translate(140,280)">
          <circle class="ring" r="66"/>
          <g class="blades">
            ${[0, 120, 240]
              .map(
                (a) =>
                  `<path transform="rotate(${a})" d="M0 0 C 14 -10, 40 -22, 56 -10 C 44 4, 18 6, 0 0 Z"/>`
              )
              .join("")}
            <circle r="9" class="hub"/>
            <circle r="60" class="pivot"/>
          </g>
        </g>
        ${lbl("source_in", 140, 140, src.in)}
        ${lbl("source_out", 140, 405, src.out)}
        <text class="cap defrost-in" x="140" y="366" text-anchor="middle" data-defrost-in data-click="status_time"></text>
      </g>`;
  }
  return `
    <g class="source ground-src">
      <rect class="ground" x="16" y="410" width="214" height="130" rx="10"/>
      <text class="gl" x="26" y="430">${src.title}</text>
      ${pipe("brine warm", "M90 410 V225 H275")}
      ${pipe("brine cold", "M275 335 H170 V410")}
      ${pipe("brine loop", "M170 410 V522 H90 V410")}
      ${lbl("source_in", 222, 182, src.in)}
      ${lbl("source_out", 222, 352, src.out)}
      ${lbl("source_flow", 92, 182, T.source_flow)}
    </g>`;
}

function svgTpl(c, src) {
  return `
  <svg class="hp" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${T.title}">
    <defs>
      <linearGradient id="lxHot" x1="0" x2="1"><stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#e5484d"/></linearGradient>
    </defs>

    <!-- Outdoor -->
    ${lbl("outdoor", 22, 40, T.outdoor, { anchor: "start", big: true, sub: "outdoor_avg", subLabel: "Ø " })}

    <!-- Heat source -->
    ${sourceTpl(c, src)}

    <!-- Heat pump casing -->
    <rect class="housing" x="250" y="74" width="382" height="420" rx="20"/>
    <text class="htitle" x="266" y="98">${T.refrigerant}</text>

    <!-- Refrigerant circuit -->
    <g class="refrigerant">
      ${pipe("r-suction", "M298 180 V150 H412")}
      ${pipe("r-hot", "M488 150 H583 V180")}
      ${pipe("r-liquid", "M583 380 V440 H468")}
      ${pipe("r-inject", "M432 440 H298 V380")}

      <!-- Evaporator -->
      <rect class="hx evap" x="275" y="180" width="46" height="200" rx="8"/>
      <path class="coil" d="${zigzag(275, 186, 374, 46, 9)}"/>
      <rect class="frost" x="275" y="180" width="46" height="200" rx="8"/>
      <text class="cap" x="298" y="402" text-anchor="middle">${T.evaporator}</text>

      <!-- Condenser -->
      <rect class="hx cond" x="560" y="180" width="46" height="200" rx="8"/>
      <path class="coil" d="${zigzag(560, 186, 374, 46, 9)}"/>
      <text class="cap" x="583" y="402" text-anchor="middle">${T.condenser}</text>

      <!-- Compressor -->
      <g class="compressor" data-click="compressor" transform="translate(450,150)">
        <circle class="body" r="38"/>
        <g class="rotor">
          <path d="M0 -22 A22 22 0 0 1 22 0 M0 22 A22 22 0 0 1 -22 0 M-14 -14 L14 14 M14 -14 L-14 14"/>
        </g>
      </g>
      ${lbl("frequency", 450, 210, T.compressor)}

      <!-- Expansion valve -->
      <g class="eev" transform="translate(450,440)">
        <path d="M-18 -12 L18 12 L18 -12 L-18 12 Z"/>
      </g>
      <text class="cap" x="450" y="474" text-anchor="middle">${T.eev}</text>

      ${lbl("suction", 362, 110, T.suction)}
      ${lbl("low_pressure", 366, 176, T.low_pressure)}
      ${lbl("hot_gas", 532, 110, T.hot_gas)}
      ${lbl("high_pressure", 518, 176, T.high_pressure)}
      ${lbl("superheat", 450, 280, T.superheat, { sub: "superheat_target", subLabel: `${T.target} ` })}
      ${lbl("evaporation", 450, 352, T.evaporation)}
    </g>

    <!-- Heating water -->
    <g class="water">
      ${pipe("w-flow", "M606 215 H770")}
      ${pipe("w-heat", "M770 215 V105 H850")}
      ${pipe("w-heat-ret", "M960 125 H985 V490 H815")}
      ${pipe("w-dhw", "M770 215 V380 H850")}
      ${pipe("w-dhw-ret", "M850 432 H815 V490")}
      ${pipe("w-ret", "M815 490 H650 V345 H606")}

      <!-- Auxiliary heater (ZWE) -->
      <g class="zwe" data-click="zwe" transform="translate(683,215)">
        <rect x="-18" y="-11" width="36" height="22" rx="5"/>
        <path d="M-12 0 l4 -6 l4 12 l4 -12 l4 12 l4 -12 l4 6"/>
        <text class="cap" y="30" text-anchor="middle">${T.zwe}</text>
      </g>

      <!-- 3-way valve -->
      <g class="valve" data-click="dhw_valve" transform="translate(770,215)">
        <path class="vin" d="M-16 -9 L0 0 L-16 9 Z"/>
        <path class="vheat" d="M-9 -16 L0 0 L9 -16 Z"/>
        <path class="vdhw" d="M-9 16 L0 0 L9 16 Z"/>
        <circle r="3.5" class="vc"/>
      </g>

      <!-- Heating circuit -->
      <text class="cap strong" x="905" y="52" text-anchor="middle">${T.heating_circuit}</text>
      <g class="radiator">
        <rect x="850" y="65" width="110" height="80" rx="8"/>
        ${[868, 886, 904, 922, 940].map((x) => `<line x1="${x}" y1="74" x2="${x}" y2="136"/>`).join("")}
      </g>
      ${lbl("room", 905, 168, T.room, { sub: "room_target", subLabel: `${T.target} ` })}

      <!-- DHW tank -->
      <text class="cap strong" x="900" y="240" text-anchor="middle">${T.dhw}</text>
      <g class="tank" data-click="dhw">
        <rect class="shell" x="850" y="250" width="100" height="200" rx="32"/>
        <rect data-tank-fill x="853" y="253" width="94" height="194" rx="29" fill="transparent"/>
        <path class="coil tcoil" d="M850 380 C 880 380, 930 386, 930 394 S 870 404, 870 410 S 930 418, 930 424 S 880 432, 850 432"/>
        <text class="tt" x="900" y="318" text-anchor="middle" data-tank-temp>–</text>
      </g>
      ${lbl("dhw_target", 900, 340, T.target)}

      <!-- Heating pump -->
      <g class="pumpicon" data-click="pump" transform="translate(722,490)">
        <circle r="17"/>
        <g class="imp"><path d="M-9 -9 L9 9 M9 -9 L-9 9"/></g>
      </g>

      ${lbl("flow", 708, 156, T.flow)}
      ${lbl("return", 900, 512, T.return, { sub: "return_target", subLabel: `${T.target} ` })}
      ${lbl("flow_rate", 722, 528, T.pump)}
    </g>
  </svg>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const STYLES = `
:host {
  --lx-hot: #e5484d;
  --lx-warm: #f59e0b;
  --lx-cold: #3b82f6;
  --lx-ice: #06b6d4;
  --lx-violet: #8b5cf6;
  --lx-on: var(--success-color, #22c55e);
  --lx-text: var(--primary-text-color, #1f2328);
  --lx-muted: var(--secondary-text-color, #6b7280);
  --lx-line: var(--divider-color, rgba(127,127,127,.25));
  --lx-bg: var(--ha-card-background, var(--card-background-color, #fff));
  display: block;
}
ha-card { overflow: hidden; padding-bottom: 8px; }

/* Header */
.header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:16px 16px 4px; flex-wrap:wrap; }
.title { display:flex; gap:12px; align-items:center; min-width:0; }
.title > ha-icon { color: var(--state-icon-color, var(--lx-muted)); --mdc-icon-size: 28px; }
.name { font-size: 1.25rem; font-weight: 500; color: var(--lx-text); line-height:1.2; }
.lines { font-size: .85rem; color: var(--lx-muted); margin-top:2px; }
.chips { display:flex; gap:8px; flex-wrap:wrap; }
.chip { --chip: var(--lx-muted); display:inline-flex; align-items:center; gap:6px; padding:5px 12px 5px 8px; border-radius:999px;
  background: color-mix(in srgb, var(--chip) 16%, transparent); color: var(--chip); font-weight:600; font-size:.9rem; cursor:pointer; }
.chip ha-icon { --mdc-icon-size: 18px; }
.chip.evu { --chip: #a855f7; }
.chip.sg { --chip: #0ea5e9; font-weight:500; }
.chip[hidden] { display:none; }
.modes { display:flex; gap:8px; padding:8px 16px 0; flex-wrap:wrap; }
.mode { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border:1px solid var(--lx-line); border-radius:8px; font-size:.85rem; cursor:pointer; color:var(--lx-text); }
.mode ha-icon { --mdc-icon-size:16px; color: var(--lx-muted); }
.mode .t { color: var(--lx-muted); }
.mode .n { font-weight:600; }
.mode.missing { display:none; }

.banner { display:flex; align-items:center; gap:8px; margin:10px 16px 0; padding:8px 12px; border-radius:8px;
  background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent); color: var(--error-color, #db4437); font-weight:500; }
.banner[hidden] { display:none; }

/* Schema */
.schema { padding: 4px 8px 0; }
.lxwrap { container: lxcard / inline-size; }
.temps .mini { display:flex; flex-direction:column; padding:8px 12px; border-radius:12px; cursor:pointer; background: color-mix(in srgb, var(--lx-text) 4%, transparent); }
.temps .t { font-size:.78rem; color: var(--lx-muted); }
.temps .n { font-size:1.15rem; font-weight:600; color: var(--lx-text); font-variant-numeric: tabular-nums; }
.temps .mini.missing { display:none; }
svg.hp { width:100%; height:auto; display:block; font-family: inherit; }
svg.hp text { fill: var(--lx-text); }
.v { cursor:pointer; }
.v .hit { fill: transparent; }
.v:hover .hit { fill: color-mix(in srgb, var(--lx-text) 7%, transparent); }
.v .t { font-size: 12.5px; fill: var(--lx-muted); }
.v .n { font-size: 17px; font-weight: 600; }
.v .s { font-size: 12px; fill: var(--lx-muted); }
.v.big .n { font-size: 24px; }
.v.missing { display:none; }
.cap { font-size: 11.5px; fill: var(--lx-muted) !important; letter-spacing:.02em; }
.cap.strong { font-size: 13px; font-weight:600; fill: var(--lx-text) !important; }
.htitle { font-size: 12px; fill: var(--lx-muted) !important; text-transform: uppercase; letter-spacing:.08em; }
.housing { fill: color-mix(in srgb, var(--lx-text) 3%, transparent); stroke: var(--lx-line); stroke-width:1.5; stroke-dasharray: 6 5; }

/* Pipes */
.pipe { fill:none; stroke-linecap:round; stroke-linejoin:round; }
.pipe.base { stroke-width:7; opacity:.9; }
.pipe.flow { stroke-width:2.5; stroke: rgba(255,255,255,.85); stroke-dasharray: 1.5 13; opacity:0; }
@keyframes lxdash { to { stroke-dashoffset: -14.5; } }

.r-suction.base { stroke: var(--lx-violet); }
.r-hot.base { stroke: var(--lx-hot); }
.r-liquid.base { stroke: var(--lx-warm); }
.r-inject.base { stroke: var(--lx-ice); }
.w-flow.base, .w-heat.base, .w-dhw.base { stroke: var(--lx-hot); }
.w-ret.base, .w-heat-ret.base, .w-dhw-ret.base { stroke: var(--lx-cold); }
.brine.warm.base { stroke: #22c55e; } .brine.cold.base { stroke: var(--lx-cold); } .brine.loop.base { stroke: #84cc16; opacity:.6; }

/* inactive branches faded */
svg.hp .w-heat.base, svg.hp .w-heat-ret.base, svg.hp .w-dhw.base, svg.hp .w-dhw-ret.base { opacity:.28; }
svg.hp.heat .w-heat.base, svg.hp.heat .w-heat-ret.base { opacity:.9; }
svg.hp.dhw .w-dhw.base, svg.hp.dhw .w-dhw-ret.base { opacity:.9; }
svg.hp:not(.comp-on) .refrigerant .pipe.base { opacity:.4; }
/* Dim refrigerant values while the compressor is off (standstill values) */
svg.hp:not(.comp-on) .refrigerant .v { opacity:.5; }
svg.hp:not(.pump-on) .water .pipe.base { opacity:.35; }

/* Animations */
svg.hp.comp-on .refrigerant .pipe.flow { opacity:1; animation: lxdash .9s linear infinite; }
svg.hp.comp-on.defrost .refrigerant .pipe.flow { animation-direction: reverse; }
svg.hp.src-on .ground-src .pipe.flow { opacity:1; animation: lxdash 1.4s linear infinite; }
svg.hp.pump-on .w-flow.flow, svg.hp.pump-on .w-ret.flow { opacity:1; animation: lxdash 1.1s linear infinite; }
svg.hp.heat .w-heat.flow, svg.hp.heat .w-heat-ret.flow { opacity:1; animation: lxdash 1.1s linear infinite; }
svg.hp.dhw .w-dhw.flow, svg.hp.dhw .w-dhw-ret.flow { opacity:1; animation: lxdash 1.1s linear infinite; }

/* Heat exchangers */
.hx { fill: var(--lx-bg); stroke: var(--lx-line); stroke-width:1.5; }
.coil { fill:none; stroke: var(--lx-muted); stroke-width:2; stroke-linejoin:round; opacity:.7; }
.frost { fill: var(--lx-ice); opacity:0; pointer-events:none; }
svg.hp.defrost .frost { animation: lxfrost 1.6s ease-in-out infinite; }
@keyframes lxfrost { 0%,100% { opacity:.12; } 50% { opacity:.45; } }

/* Compressor */
.compressor { cursor:pointer; }
.compressor .body { fill: var(--lx-bg); stroke: var(--lx-muted); stroke-width:3; }
.compressor .rotor path { fill:none; stroke: var(--lx-muted); stroke-width:3; stroke-linecap:round; }
.compressor .rotor { transform-box: fill-box; transform-origin: center; }
svg.hp.comp-on .compressor .body { stroke: var(--lx-on); }
svg.hp.comp-on .compressor .rotor path { stroke: var(--lx-on); }
svg.hp.comp-on .compressor .rotor { animation: lxspin 1.6s linear infinite; }
@keyframes lxspin { to { transform: rotate(360deg); } }

.eev path { fill: var(--lx-bg); stroke: var(--lx-muted); stroke-width:2.5; stroke-linejoin:round; }

/* Air source */
.source .box { fill: color-mix(in srgb, var(--lx-text) 3%, transparent); stroke: var(--lx-line); stroke-width:1.5; }
.fan .ring { fill:none; stroke: var(--lx-line); stroke-width:2; }
.fan .blades path { fill: color-mix(in srgb, var(--lx-muted) 45%, transparent); }
.fan .blades .hub { fill: var(--lx-muted); }
/* invisible circle centred on the hub: makes the rotation box symmetric so the rotor turns on its shaft */
.fan .blades .pivot { fill: none; stroke: none; }
.fan .blades { transform-box: fill-box; transform-origin: center; }
svg.hp.src-on .fan .blades { animation: lxspin 1.1s linear infinite; }
.air { fill:none; stroke: var(--lx-ice); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; opacity:.35; }
svg.hp.src-on .air { opacity:.9; stroke-dasharray: 6 5; animation: lxdash 1s linear infinite; }
.defrost-in { cursor:pointer; }
svg.hp.defrost .defrost-in { fill: var(--lx-ice) !important; font-weight:600; }

/* Ground */
.ground { fill: color-mix(in srgb, #92400e 18%, transparent); stroke: color-mix(in srgb, #92400e 35%, transparent); }
.gl { font-size:12px; fill: var(--lx-muted) !important; }

/* ZWE */
.zwe { display:none; cursor:pointer; }
svg.hp.has-zwe .zwe { display:inline; }
.zwe rect { fill: var(--lx-bg); stroke: var(--lx-muted); stroke-width:2; }
.zwe path { fill:none; stroke: var(--lx-muted); stroke-width:2; stroke-linejoin:round; }
svg.hp.zwe-on .zwe rect { stroke: var(--lx-warm); fill: color-mix(in srgb, var(--lx-warm) 25%, var(--lx-bg)); }
svg.hp.zwe-on .zwe path { stroke: var(--lx-hot); animation: lxglow 1.2s ease-in-out infinite; }
@keyframes lxglow { 50% { opacity:.4; } }

/* 3-way valve */
.valve { cursor:pointer; }
.valve path { fill: var(--lx-bg); stroke: var(--lx-muted); stroke-width:2; stroke-linejoin:round; }
.valve .vc { fill: var(--lx-muted); }
svg.hp.pump-on .valve .vin { fill: var(--lx-hot); stroke: var(--lx-hot); }
svg.hp.heat .valve .vheat { fill: var(--lx-hot); stroke: var(--lx-hot); }
svg.hp.dhw .valve .vdhw { fill: var(--lx-hot); stroke: var(--lx-hot); }

/* Radiator */
.radiator rect { fill: var(--lx-bg); stroke: var(--lx-muted); stroke-width:2; }
.radiator line { stroke: var(--lx-muted); stroke-width:2; opacity:.6; }
svg.hp.heat .radiator rect { stroke: var(--lx-hot); fill: color-mix(in srgb, var(--lx-hot) 10%, var(--lx-bg)); }
svg.hp.heat .radiator line { stroke: var(--lx-hot); }

/* Tank */
.tank { cursor:pointer; }
.tank .shell { fill: var(--lx-bg); stroke: var(--lx-muted); stroke-width:2.5; }
.tank .tcoil { stroke-width:2.5; }
svg.hp.dhw .tank .tcoil { stroke: var(--lx-hot); opacity:1; }
.tank .tt { font-size: 26px; font-weight: 700; }

/* Pump */
.pumpicon { cursor:pointer; }
.pumpicon circle { fill: var(--lx-bg); stroke: var(--lx-muted); stroke-width:2.5; }
.pumpicon .imp path { stroke: var(--lx-muted); stroke-width:2.5; stroke-linecap:round; }
.pumpicon .imp { transform-box: fill-box; transform-origin: center; }
svg.hp.pump-on .pumpicon circle { stroke: var(--lx-on); }
svg.hp.pump-on .pumpicon .imp path { stroke: var(--lx-on); }
svg.hp.pump-on .pumpicon .imp { animation: lxspin 1s linear infinite; }

/* Hide refrigerant values */
svg.hp.no-refrigerant .refrigerant .v, svg.hp.no-refrigerant .refrigerant .cap { display:none; }

/* KPIs */
.kpis { display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; padding: 8px 16px 8px; }
.kpi { display:flex; gap:10px; align-items:center; padding:10px 12px; border-radius:12px; cursor:pointer;
  background: color-mix(in srgb, var(--lx-text) 4%, transparent); }
.kpi ha-icon { color: var(--lx-muted); --mdc-icon-size:22px; flex:none; }
.kl { font-size:.78rem; color: var(--lx-muted); }
.kv { font-size:1.15rem; font-weight:600; color: var(--lx-text); font-variant-numeric: tabular-nums; }
.kpi.missing { display:none; }

/* Narrow card (phone): diagram as picture only, main values as tiles below */
.temps { display:none; }
@container lxcard (max-width: 560px) {
  svg.hp .v, svg.hp .cap:not(.strong), svg.hp .htitle, svg.hp .zwe text { display:none; }
  svg.hp .cap.strong { font-size: 26px; }
  svg.hp .tank .tt { font-size: 40px; }
  .temps { display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; padding: 8px 16px 0; }
}

@media (prefers-reduced-motion: reduce) {
  svg.hp * { animation: none !important; }
}
`;

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Visual editor                                                      */
/* ------------------------------------------------------------------ */

const ENTITY_GROUPS = [
  { id: "status", icon: "mdi:information-outline",
    keys: ["status", "status_line_1", "status_line_3", "status_time", "smart_grid", "evu", "disturbance", "error_reason", "heating_mode", "dhw_mode"] },
  { id: "source", icon: "mdi:fan",
    keys: ["outdoor", "outdoor_avg", "source_in", "source_out", "source_flow", "source_pump", "defrost_valve"] },
  { id: "refrigerant", icon: "mdi:sync",
    keys: ["compressor", "frequency", "hot_gas", "suction", "evaporation", "superheat", "superheat_target", "high_pressure", "low_pressure"] },
  { id: "water", icon: "mdi:radiator",
    keys: ["flow", "return", "return_target", "flow_rate", "pump", "zup", "dhw_valve", "zwe", "room", "room_target"] },
  { id: "dhw", icon: "mdi:water-boiler", keys: ["dhw", "dhw_target"] },
  { id: "energy", icon: "mdi:lightning-bolt",
    keys: ["heat_output", "power", "cop_heating", "cop_dhw", "heat_amount_heating", "heat_amount_dhw", "energy_heating", "energy_dhw"] },
];

const EDITOR_I18N = {
  de: {
    intro: "Die Entitäten werden aus dem Präfix vorbelegt. Jede Zuordnung kann geändert werden; ein geleertes Feld blendet den Wert in der Karte aus. Ohne 3-Wege-Ventil/BUP entscheidet der Betriebszustand, welcher Kreis versorgt wird.",
    title: "Titel", prefix: "Entity-Präfix (leer = automatisch)", heat_source: "Wärmequelle",
    show_header: "Kopfzeile", show_refrigerant: "Kältekreis-Werte", show_kpis: "Kennzahlen",
    hs: { auto: "Automatisch", air: "Luft", brine: "Erdsonde / Sole", water: "Brunnen / Wasser" },
    groups: { status: "Status", source: "Außen & Wärmequelle", refrigerant: "Kältekreis", water: "Heizwasser", dhw: "Warmwasser", energy: "Leistung & Energie" },
    e: {
      status: "Betriebszustand", status_line_1: "Statuszeile 1", status_line_3: "Statuszeile 3", status_time: "Status-Zeit (inkl. Abtau-Countdown)",
      smart_grid: "Smart-Grid-Status", evu: "EVU-Freigabe", disturbance: "Störung", error_reason: "Letzter Fehler",
      heating_mode: "Betriebsmodus Heizen", dhw_mode: "Betriebsmodus Warmwasser",
      outdoor: "Außentemperatur", outdoor_avg: "Ø Außentemperatur", source_in: "Wärmequelle Eintritt", source_out: "Wärmequelle Austritt",
      source_flow: "Durchfluss Wärmequelle", source_pump: "Ventilator / Solepumpe (VBO)", defrost_valve: "Abtauventil",
      compressor: "Verdichter läuft", frequency: "Verdichterfrequenz", hot_gas: "Heißgas", suction: "Sauggas", evaporation: "Verdampfung",
      superheat: "Überhitzung", superheat_target: "Überhitzung Soll", high_pressure: "Hochdruck", low_pressure: "Niederdruck",
      flow: "Vorlauf", return: "Rücklauf", return_target: "Rücklauf Soll", flow_rate: "Durchfluss Heizwasser",
      pump: "Heizungsumwälzpumpe (HUP)", zup: "Zusatzumwälzpumpe (ZUP)",
      dhw_valve: "3-Wege-Ventil / BUP (leer = nach Betriebszustand)", zwe: "Zusatzheizung (ZWE)", room: "Raumtemperatur", room_target: "Raumtemperatur Soll",
      dhw: "Warmwasser Ist", dhw_target: "Warmwasser Soll",
      heat_output: "Wärmeleistung", power: "Leistungsaufnahme", cop_heating: "COP Heizen", cop_dhw: "COP Warmwasser",
      heat_amount_heating: "Wärmemenge Heizen (Zähler)", heat_amount_dhw: "Wärmemenge Warmwasser (Zähler)",
      energy_heating: "Energieeinsatz Heizen (Zähler)", energy_dhw: "Energieeinsatz Warmwasser (Zähler)",
    },
  },
  en: {
    intro: "Entities are pre-filled from the prefix. Every mapping can be changed; clearing a field hides that value on the card. Without a 3-way valve/BUP entity, the operating state decides which circuit is served.",
    title: "Title", prefix: "Entity prefix (empty = auto-detect)", heat_source: "Heat source",
    show_header: "Header", show_refrigerant: "Refrigerant values", show_kpis: "Key figures",
    hs: { auto: "Automatic", air: "Air", brine: "Ground loop / brine", water: "Well / water" },
    groups: { status: "Status", source: "Outdoor & heat source", refrigerant: "Refrigerant circuit", water: "Heating water", dhw: "Hot water", energy: "Power & energy" },
    e: {
      status: "Operating state", status_line_1: "Status line 1", status_line_3: "Status line 3", status_time: "Status time (incl. defrost countdown)",
      smart_grid: "Smart grid status", evu: "Utility release (EVU)", disturbance: "Fault", error_reason: "Last error",
      heating_mode: "Heating mode", dhw_mode: "Hot water mode",
      outdoor: "Outdoor temperature", outdoor_avg: "Outdoor temperature (avg)", source_in: "Heat source inlet", source_out: "Heat source outlet",
      source_flow: "Heat source flow rate", source_pump: "Fan / brine pump (VBO)", defrost_valve: "Defrost valve",
      compressor: "Compressor running", frequency: "Compressor frequency", hot_gas: "Hot gas", suction: "Suction gas", evaporation: "Evaporation",
      superheat: "Superheat", superheat_target: "Superheat target", high_pressure: "High pressure", low_pressure: "Low pressure",
      flow: "Flow temperature", return: "Return temperature", return_target: "Return target", flow_rate: "Heating water flow rate",
      pump: "Heating circulation pump (HUP)", zup: "Additional circulation pump (ZUP)",
      dhw_valve: "3-way valve / BUP (empty = by operating state)", zwe: "Auxiliary heater (ZWE)", room: "Room temperature", room_target: "Room target",
      dhw: "Hot water temperature", dhw_target: "Hot water target",
      heat_output: "Heat output", power: "Power input", cop_heating: "COP heating", cop_dhw: "COP hot water",
      heat_amount_heating: "Heat amount heating (counter)", heat_amount_dhw: "Heat amount hot water (counter)",
      energy_heating: "Energy input heating (counter)", energy_dhw: "Energy input hot water (counter)",
    },
  },
};

const DOMAIN_FILTER = {
  sensor: ["sensor", "number", "input_number"],
  binary_sensor: ["binary_sensor", "input_boolean", "switch"],
  number: ["number", "input_number", "sensor"],
  select: ["select", "input_select", "sensor"],
};
const FLAG_DEFAULTS = { show_header: true, show_refrigerant: true, show_kpis: true };

function defaultEntity(key, prefix) {
  const tpl = ENTITY_MAP[key];
  return tpl && prefix ? tpl.replace("%", prefix) : undefined;
}

class LuxtronikHeatpumpCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config, entities: { ...(config.entities || {}) } };
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    if (first) this._render();
  }

  connectedCallback() {
    this._ensureHaForm().then(() => this._render());
  }

  async _ensureHaForm() {
    if (customElements.get("ha-form")) return;
    try {
      // ha-form is lazy-loaded by HA; loading a built-in card editor pulls it in.
      const helpers = await window.loadCardHelpers();
      const card = await helpers.createCardElement({ type: "entities", entities: [] });
      if (card && card.constructor.getConfigElement) await card.constructor.getConfigElement();
    } catch (e) {
      /* ignore */
    }
    await Promise.race([customElements.whenDefined("ha-form"), new Promise((r) => setTimeout(r, 3000))]);
  }

  _prefix(cfg) {
    return (cfg && cfg.prefix) || (this._hass && detectPrefix(this._hass)) || undefined;
  }

  _exists(id) {
    return !!(id && this._hass && this._hass.states[id]);
  }

  _schema(L) {
    const ent = (key) => {
      const dom = (ENTITY_MAP[key] || "sensor.").split(".")[0];
      return { name: key, selector: { entity: { domain: DOMAIN_FILTER[dom] || [dom] } } };
    };
    return [
      { name: "title", selector: { text: {} } },
      {
        type: "grid", name: "", schema: [
          { name: "prefix", selector: { text: {} } },
          { name: "heat_source", selector: { select: { mode: "dropdown",
            options: ["auto", ...HEAT_SOURCES].map((v) => ({ value: v, label: L.hs[v] })) } } },
        ],
      },
      {
        type: "grid", name: "", column_min_width: "140px", schema: [
          { name: "show_header", selector: { boolean: {} } },
          { name: "show_refrigerant", selector: { boolean: {} } },
          { name: "show_kpis", selector: { boolean: {} } },
        ],
      },
      ...ENTITY_GROUPS.map((g) => ({
        type: "expandable", name: `group_${g.id}`, flatten: true, title: L.groups[g.id], icon: g.icon,
        schema: g.keys.map(ent),
      })),
    ];
  }

  _data() {
    const c = this._config || {};
    const prefix = this._prefix(c);
    const d = {
      title: c.title || "",
      prefix: c.prefix || "",
      heat_source: c.heat_source || "auto",
    };
    for (const [k, v] of Object.entries(FLAG_DEFAULTS)) d[k] = c[k] === undefined ? v : !!c[k];
    for (const g of ENTITY_GROUPS) {
      for (const key of g.keys) {
        const ov = c.entities[key];
        if (typeof ov === "string") d[key] = ov;
        else if (ov === false || ov === null) d[key] = undefined;
        else {
          const def = defaultEntity(key, prefix);
          d[key] = this._exists(def) ? def : undefined;
        }
      }
    }
    return d;
  }

  _render() {
    if (!this._config || !this._hass || !customElements.get("ha-form")) return;
    const L = EDITOR_I18N[langOf(this._hass)];
    if (!this._form) {
      this.innerHTML = `<p class="lx-intro" style="margin:0 0 12px;color:var(--secondary-text-color);font-size:.9rem"></p>`;
      this.querySelector(".lx-intro").textContent = L.intro;
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (sch) => L[sch.name] || L.e[sch.name] || sch.name;
      this._form.addEventListener("value-changed", (ev) => this._changed(ev.detail.value));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema(L);
    this._form.data = this._data();
  }

  _changed(v) {
    const old = this._config;
    const oldPrefix = this._prefix(old);
    const cfg = { type: old.type || "custom:luxtronik-heatpump-card" };
    if (v.title) cfg.title = v.title;
    if (v.prefix) cfg.prefix = v.prefix.trim();
    if (v.heat_source && v.heat_source !== "auto") cfg.heat_source = v.heat_source;
    for (const [k, def] of Object.entries(FLAG_DEFAULTS)) if (v[k] !== undefined && v[k] !== def) cfg[k] = v[k];
    const prefix = this._prefix(cfg);
    const entities = {};
    for (const g of ENTITY_GROUPS) {
      for (const key of g.keys) {
        const val = v[key];
        const def = defaultEntity(key, prefix);
        const oldDef = defaultEntity(key, oldPrefix);
        if (val) {
          if (val !== def && val !== oldDef) entities[key] = val;
        } else if (this._exists(def)) {
          entities[key] = false; // cleared -> hide
        }
      }
    }
    if (Object.keys(entities).length) cfg.entities = entities;
    // keep unknown keys the user may have added in YAML
    for (const [k, val] of Object.entries(old)) if (!(k in cfg) && !["entities", ...Object.keys(FLAG_DEFAULTS), "title", "prefix", "heat_source", "type"].includes(k)) cfg[k] = val;
    this._config = { ...cfg, entities: { ...(cfg.entities || {}) } };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
    this._render();
  }
}

if (!customElements.get("luxtronik-heatpump-card-editor")) {
  customElements.define("luxtronik-heatpump-card-editor", LuxtronikHeatpumpCardEditor);
}

if (!customElements.get("luxtronik-heatpump-card")) {
  customElements.define("luxtronik-heatpump-card", LuxtronikHeatpumpCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "luxtronik-heatpump-card")) {
  window.customCards.push({
    type: "luxtronik-heatpump-card",
    name: "Luxtronik Heat Pump",
    description: "Animated system diagram for Luxtronik heat pumps (Novelan, Alpha Innotec, …) using the BenPru/luxtronik integration",
    preview: true,
    documentationURL: "https://github.com/BenPru/luxtronik",
  });
}

console.info(
  `%c LUXTRONIK-HEATPUMP-CARD %c v${CARD_VERSION} `,
  "color:#fff;background:#e5484d;font-weight:700;border-radius:3px 0 0 3px",
  "color:#e5484d;background:#fff1f1;font-weight:700;border-radius:0 3px 3px 0"
);
