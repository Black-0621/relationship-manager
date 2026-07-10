const STORAGE_KEY = "relationship-manager-standalone-v1";
const ACCOUNT_KEY = "relationship-manager-local-accounts-v1";
const ACTIVE_ACCOUNT_KEY = "relationship-manager-active-account-v1";
const LOCAL_WRITE_PAUSED_KEY = "relationship-manager-local-write-paused-v1";
// Legacy keys keep older local browser data and exported packages readable.
const LEGACY_STORAGE_KEY = "xindong-archive-standalone-v2";
const LEGACY_ACCOUNT_KEY = "xindong-archive-local-accounts-v1";
const LEGACY_ACTIVE_ACCOUNT_KEY = "xindong-archive-active-account-v1";
const LEGACY_LOCAL_WRITE_PAUSED_KEY = "xindong-archive-local-write-paused-v1";
const LOCAL_DATA_FORMAT = "relationship-manager-local-v1";
const LEGACY_LOCAL_DATA_FORMAT = "relationship-archive-local-v2";
const SYNC_FORMAT = "relationship-manager-sync-v1";
const LEGACY_SYNC_FORMAT = "xindong-archive-sync-v1";
const PORTABLE_CLEAN = true;
const LOCAL_DEEPSEEK_KEY = "";
const LOCAL_DATA_FILE = "人际关系管理器完整数据.json";
const LOCAL_BACKUP_DIR = "自动备份";
const LOCAL_SNAPSHOT_PREFIX = "人际关系管理器快照";

function readLocalJson(key, legacyKey = "") {
  const raw = localStorage.getItem(key) || (legacyKey ? localStorage.getItem(legacyKey) : "");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readLocalText(key, legacyKey = "") {
  return localStorage.getItem(key) || (legacyKey ? localStorage.getItem(legacyKey) : "");
}

const appPresets = {
  heart: { title: "人际关系管理器", subtitle: "本地关系资料库", mark: "人", modeLabel: "通用关系管理", theme: "heart" },
  family: { title: "亲情关系管理器", subtitle: "家庭记忆与关系资料库", mark: "家", modeLabel: "亲情关系管理", theme: "family" },
  work: { title: "职场关系管理器", subtitle: "职场与社会关系资料库", mark: "职", modeLabel: "职场关系管理", theme: "work" },
  custom: { title: "我的关系管理器", subtitle: "本地关系资料库", mark: "档", modeLabel: "自定义关系管理", theme: "custom" },
};
const themePalettes = {
  heart: { label: "心动酒红粉金（原版）", accent: "#ee807f", gold: "#e8bb6d", bgA: "#16131a", bgB: "#101117" },
  rosePurple: { label: "玫瑰紫夜", accent: "#d98cff", gold: "#f0b7cf", bgA: "#17101f", bgB: "#100d16" },
  businessBlue: { label: "商务深蓝", accent: "#7cb7ff", gold: "#d8c08a", bgA: "#101923", bgB: "#10131b" },
  forestGold: { label: "墨绿金", accent: "#91c788", gold: "#e0c06f", bgA: "#101914", bgB: "#111318" },
  coffee: { label: "暖棕咖啡", accent: "#d59a6f", gold: "#f1c987", bgA: "#1a1410", bgB: "#12100e" },
  blackGold: { label: "黑金档案", accent: "#d4af37", gold: "#f2d27c", bgA: "#111111", bgB: "#0c0c0f" },
  graphite: { label: "冷灰极简", accent: "#aab3c5", gold: "#d6c7a1", bgA: "#13151b", bgB: "#0f1116" },
  sakura: { label: "樱粉柔光", accent: "#ff9ab5", gold: "#f3c8a8", bgA: "#1d1218", bgB: "#121015" },
};
const defaultAppSettings = { activePreset: "heart", themePalette: "heart", customTitle: "", customSubtitle: "", customMark: "", customAccent: "", customGold: "" };
const defaultMeProfile = {
  about: "", workAndCreation: "", lifeAndHealth: "", relationshipHistory: "", patterns: "", goals: "", boundaries: "",
  avatar: "", aiPortrait: "", aiPortraitUpdatedAt: 0
};
function normalizeMe(me = {}) {
  return { ...defaultMeProfile, ...(me || {}) };
}
function appSettings() {
  const base = { ...defaultAppSettings, ...(store.app || {}) };
  const preset = appPresets[base.activePreset] || appPresets.heart;
  const palette = themePalettes[base.themePalette] || themePalettes.heart;
  const title = base.customTitle || preset.title;
  const subtitle = base.customSubtitle || preset.subtitle;
  const mark = base.customMark || preset.mark;
  const accent = base.customAccent || palette.accent;
  const gold = base.customGold || palette.gold;
  const bgA = palette.bgA;
  const bgB = palette.bgB;
  return { ...base, ...preset, ...palette, title, subtitle, mark, accent, gold, bgA, bgB };
}
function applyAppTheme() {
  const cfg = appSettings();
  document.documentElement.style.setProperty("--rose", cfg.accent);
  document.documentElement.style.setProperty("--gold", cfg.gold);
  document.documentElement.style.setProperty("--theme-bg-a", cfg.bgA);
  document.documentElement.style.setProperty("--theme-bg-b", cfg.bgB);
}
// Dynamic metric functions are defined later.
function sortedEvents(profile, newestFirst = true) {
  const arr = [...(profile.events || [])];
  return arr.sort((a, b) => newestFirst ? dateSortValue(b.date, 0) - dateSortValue(a.date, 0) : dateSortValue(a.date, 0) - dateSortValue(b.date, 0));
}
function buildFullContext(profile, mode = "smart") {
  const allEvents = sortedEvents(profile, true);
  const base = {
    appMode: appSettings().title,
    me: store.me || {},
    profile: {
      name: profile.name,
      title: profile.title,
      tags: profile.tags,
      summary: profile.summary,
      persona: profile.persona,
      currentStage: profile.stage,
      milestones: profile.milestoneDetails,
      focusedMilestone: profile.focusedMilestone,
      metricSchema: getMetricSchema(profile),
      metrics: profile.metrics,
      stageMetrics: profile.stageMetrics,
      analysis: profile.analysis,
      advice: profile.aiAdvice,
      direction: profile.direction,
    },
    sourceRecords: (profile.sourceRecords || []).slice(0, mode === "full" ? 80 : 20).map((item) => ({ title: item.name || item.title, createdAt: item.createdAt, processedAt: item.processedAt || 0, text: (item.text || item.content || "").slice(0, mode === "full" ? 12000 : 3000) })),
    events: allEvents.slice(0, mode === "full" ? 100 : 30).map((event) => ({ date: event.date, title: event.title, summary: event.summary, detail: event.detail, rawText: event.rawText, stage: event.stage })),
    contextSummary: profile.contextSummary || "",
  };
  if (mode === "recent") base.archiveChat = (profile.archiveChat || []).slice(-12);
  if (mode === "full") base.archiveChat = (profile.archiveChat || []).slice(-30);
  return JSON.stringify(base, null, 2);
}
function collectWorkbenchInput() {
  const input = document.querySelector("#archive-chat-input");
  const spokenText = input?.value.trim() || "";
  const filesText = pendingArchiveFiles.map((file) => `文件：${file.name}\n${file.text}`).join("\n\n");
  const sourceText = [spokenText, filesText].filter(Boolean).join("\n\n");
  const attachments = pendingArchiveFiles.map((file) => file.name);
  return { input, spokenText, filesText, sourceText, attachments };
}
function saveRawSource(profile, sourceText, attachments = [], name = "原始资料") {
  if (!sourceText.trim()) return null;
  profile.sourceRecords ??= [];
  const record = { id: `${profile.id}-source-${Date.now()}`, name: attachments.length ? attachments.join("、") : name, text: sourceText, createdAt: Date.now(), processedAt: 0, linkedEventIds: [] };
  profile.sourceRecords.unshift(record);
  attachments.forEach((fileName) => { if (!profile.materials.includes(fileName)) profile.materials.push(fileName); });
  return record;
}
function clearWorkbenchInput(input) {
  if (input) input.value = "";
  pendingArchiveFiles = [];
}


const cleanStarterProfiles = [{
  id: "starter", name: "新档案", initial: "新", title: "空白本地档案", stage: "初识",
  color: "linear-gradient(145deg,#786589,#27283f 58%,#263b39)", tags: ["待补充"],
  metrics: { familiarity: 0, trust: 0, curiosity: 0, initiative: 0, risk: 0 },
  milestones: ["初识", "熟悉", "了解加深"], current: 0,
  summary: "这是一个空白的本地人物档案。", direction: "先记录真实互动，再做整理。", analysis: "资料不足，等待后续记录。", materials: [], events: [],
}];

const defaultProfiles = cleanStarterProfiles;

let store = readLocalJson(STORAGE_KEY, LEGACY_STORAGE_KEY) || {
  profiles: defaultProfiles,
  selected: "starter",
  tab: "概览",
  api: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-flash", apiKey: LOCAL_DEEPSEEK_KEY, persona: "像一位冷静、尊重边界的关系记录顾问。区分事实、推测和未知，只给出不施压、尊重双方意愿的建议。" },
  me: normalizeMe(),
  app: { ...defaultAppSettings }
};

function newAccountStore() {
  const profileId = `starter-${Date.now()}`;
  return {
    profiles: [{ id: profileId, name: "新档案", initial: "新", title: "待补充", stage: "初识", color: "linear-gradient(145deg,#786589,#27283f 58%,#263b39)", tags: ["新建档案"], metrics: { familiarity: 0, trust: 0, curiosity: 0, initiative: 0, risk: 0 }, milestones: ["初识", "熟悉", "了解加深"], current: 0, focusedMilestone: 0, summary: "这是一个新的本地档案空间。", direction: "先记录真实互动，再做整理。", analysis: "资料不足，等待后续记录。", aiAdvice: "先补充真实资料，不急着下结论。", materials: [], events: [], photos: [], archiveChat: [], trash: [] }],
    selected: profileId,
    tab: "概览",
    api: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-flash", apiKey: "", persona: "像一位冷静、尊重边界的关系记录顾问。区分事实、推测和未知，只给出不施压、尊重双方意愿的建议。" },
    me: normalizeMe(),
    app: { ...defaultAppSettings },
    trash: [],
  };
}

let accountBook = readLocalJson(ACCOUNT_KEY, LEGACY_ACCOUNT_KEY);
if (!accountBook?.accounts?.length) {
  accountBook = { accounts: [{ id: "owner", name: "我的档案", pinHash: "", data: store }], activeId: "owner" };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accountBook));
}
let activeAccountId = readLocalText(ACTIVE_ACCOUNT_KEY, LEGACY_ACTIVE_ACCOUNT_KEY) || accountBook.activeId || accountBook.accounts[0].id;
if (!accountBook.accounts.some((account) => account.id === activeAccountId)) activeAccountId = accountBook.accounts[0].id;
let activeAccount = accountBook.accounts.find((account) => account.id === activeAccountId);
if (!activeAccount) {
  activeAccount = accountBook.accounts[0];
  activeAccountId = activeAccount.id;
}
if (!activeAccount.data || typeof activeAccount.data !== "object") activeAccount.data = newAccountStore();
store = activeAccount.data;
if (!Array.isArray(store.profiles) || !store.profiles.length) store.profiles = newAccountStore().profiles;
store.me = normalizeMe(store.me);
store.app = { ...defaultAppSettings, ...(store.app || {}) };
if (!store.selected || !store.profiles.some((item) => item.id === store.selected)) store.selected = store.profiles[0].id;
store.tab ||= "概览";
let accountLocked = Boolean(activeAccount.pinHash);
let pendingAccountId = null;
store.api = { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-flash", apiKey: "", persona: "像一位冷静、尊重边界的关系记录顾问。区分事实、推测和未知，只给出不施压、尊重双方意愿的建议。", ...store.api };
if (!store.api.apiKey && /deepseek\.com/i.test(store.api.baseUrl)) store.api.apiKey = LOCAL_DEEPSEEK_KEY;
store.me = normalizeMe(store.me);
store.app = { ...defaultAppSettings, ...(store.app || {}) };
store.trash ??= [];
const stageNotes = {};

const metricLabels = { familiarity: "熟悉度", trust: "信任感", curiosity: "好奇心", initiative: "主动性", risk: "风险性" };
// 3.5.2: dynamic relationship dimensions. Different archive modes can use
// different metric names, and each profile can override them manually.
const metricPresetDefinitions = {
  heart: [
    { id: "familiarity", label: "熟悉度" },
    { id: "trust", label: "信任感" },
    { id: "curiosity", label: "好奇心" },
    { id: "initiative", label: "主动性" },
    { id: "risk", label: "风险性" },
  ],
  family: [
    { id: "family_closeness", label: "亲近度" },
    { id: "family_support", label: "支持度" },
    { id: "family_trust", label: "信任感" },
    { id: "family_boundary", label: "边界感" },
    { id: "family_pressure", label: "压力值" },
  ],
  work: [
    { id: "work_trust", label: "信任度" },
    { id: "work_cooperation", label: "协作度" },
    { id: "work_influence", label: "影响力" },
    { id: "work_boundary", label: "边界清晰度" },
    { id: "work_risk", label: "风险性" },
  ],
  custom: [
    { id: "social_familiarity", label: "熟悉度" },
    { id: "social_reciprocity", label: "互惠度" },
    { id: "social_credibility", label: "可靠度" },
    { id: "social_boundary", label: "边界感" },
    { id: "social_conflict", label: "冲突风险" },
  ],
};
function cloneMetricSchema(schema) {
  return schema.map((item, index) => ({ id: item.id || `m${index + 1}`, label: item.label || `维度 ${index + 1}` }));
}
function metricPresetForMode(mode = appSettings().activePreset) {
  if (mode === "heart") return cloneMetricSchema(metricPresetDefinitions.heart);
  if (mode === "family") return cloneMetricSchema(metricPresetDefinitions.family);
  if (mode === "work") return cloneMetricSchema(metricPresetDefinitions.work);
  return cloneMetricSchema(metricPresetDefinitions.custom);
}
function sanitizeMetricLabel(label, index) {
  const text = String(label || "").trim().slice(0, 12);
  return text || `维度 ${index + 1}`;
}
function schemaFromLabels(labels, oldSchema = []) {
  return labels.map((label, index) => {
    const clean = sanitizeMetricLabel(label, index);
    const oldByLabel = oldSchema.find((item) => item.label === clean);
    const oldByIndex = oldSchema[index];
    return { id: oldByLabel?.id || oldByIndex?.id || `m${index + 1}`, label: clean };
  });
}
function getMetricSchema(profile = selected?.()) {
  if (!profile) return cloneMetricSchema(metricPresetDefinitions.heart);
  if (!Array.isArray(profile.metricSchema) || !profile.metricSchema.length) {
    const mode = profile.relationType || store?.app?.activePreset || appSettings().activePreset || "heart";
    profile.metricSchema = metricPresetForMode(mode);
  }
  profile.metricSchema = profile.metricSchema
    .slice(0, 9)
    .map((item, index) => ({ id: item.id || `m${index + 1}`, label: sanitizeMetricLabel(item.label, index) }));
  if (profile.metricSchema.length < 3) {
    const fallback = metricPresetForMode(profile.relationType || store?.app?.activePreset || "heart");
    profile.metricSchema = fallback;
  }
  return profile.metricSchema;
}
function metricSchemaText(profile) {
  return getMetricSchema(profile).map((item) => item.label).join(" / ");
}
function applyMetricSchemaText(profile, text) {
  const labels = String(text || "").split(/[\/，,、\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 9);
  if (labels.length < 3) return;
  const oldSchema = getMetricSchema(profile);
  const oldStageMetrics = Array.isArray(profile.stageMetrics) ? profile.stageMetrics : [];
  const oldMetrics = profile.metrics || {};
  const nextSchema = schemaFromLabels(labels, oldSchema);
  profile.metricSchema = nextSchema;
  const remap = (old = {}, stageIndex = 0) => {
    const next = {};
    nextSchema.forEach((metric, index) => {
      const oldId = oldSchema[index]?.id;
      const value = old[metric.id] ?? old[metric.label] ?? old[oldId] ?? Object.values(old)[index];
      next[metric.id] = Number.isFinite(Number(value)) ? Math.min(100, Math.max(0, Number(value))) : defaultMetricObject(profile, stageIndex)[metric.id];
    });
    return next;
  };
  profile.metrics = remap(oldMetrics, profile.current || 0);
  profile.stageMetrics = oldStageMetrics.map((item, index) => remap(item, index));
  normalizeStageMetrics(profile);
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") return;
  profile.id ||= `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  profile.name ||= "新档案";
  profile.initial ||= profile.name.slice(0, 1) || "新";
  profile.title ||= "待补充";
  profile.stage ||= "初识";
  profile.color ||= "linear-gradient(145deg,#786589,#27283f 58%,#263b39)";
  if (!Array.isArray(profile.tags)) profile.tags = [];
  if (!Array.isArray(profile.events)) profile.events = [];
  if (!Array.isArray(profile.materials)) profile.materials = [];
  if (!Array.isArray(profile.photos)) profile.photos = [];
  profile.coverPhotoIndex = Number.isFinite(Number(profile.coverPhotoIndex)) ? Number(profile.coverPhotoIndex) : 0;
  if (!Array.isArray(profile.sourceRecords)) profile.sourceRecords = [];
  profile.lastSmartOrganizedAt = Number(profile.lastSmartOrganizedAt || 0);
  profile.contextSummary ||= "";
  profile.relationType ||= (store?.app?.activePreset || "heart");
  profile.current = Number.isFinite(Number(profile.current)) ? Math.max(0, Number(profile.current)) : 0;
  if (!Array.isArray(profile.milestones) || !profile.milestones.length) {
    if (Array.isArray(profile.milestoneDetails) && profile.milestoneDetails.length) profile.milestones = profile.milestoneDetails.map((item) => item?.name || "新节点");
    else profile.milestones = ["初识", "熟悉", "了解加深"];
  }
  if (!Array.isArray(profile.milestoneDetails) || !profile.milestoneDetails.length) {
    profile.milestoneDetails = profile.milestones.map((name, index) => ({ name, description: stageNotes[profile.id]?.[index] || "在这里补充这个阶段的重要事实与变化。" }));
  }
  profile.milestoneDetails = profile.milestoneDetails.map((detail, index) => ({ name: detail?.name || profile.milestones[index] || "新节点", description: detail?.description || "在这里补充这个阶段的重要事实与变化。" }));
  profile.milestones = profile.milestoneDetails.map((detail) => detail.name);
  profile.current = Math.min(profile.current, Math.max(0, profile.milestones.length - 1));
  profile.focusedMilestone = Number.isFinite(Number(profile.focusedMilestone)) ? Math.max(0, Number(profile.focusedMilestone)) : profile.current;
  profile.focusedMilestone = Math.min(profile.focusedMilestone, Math.max(0, profile.milestones.length - 1));
  profile.persona ??= { communication: "待补充", interests: profile.tags?.slice(0, 4) || [], boundaries: "待补充", confidence: "" };
  profile.persona.communication ||= "待补充";
  if (!Array.isArray(profile.persona.interests)) profile.persona.interests = [];
  profile.persona.boundaries ||= "待补充";
  profile.persona.confidence ||= "";
  profile.metrics ||= {};
  if (!Array.isArray(profile.stageMetrics)) profile.stageMetrics = [];
  normalizeStageMetrics(profile);
  profile.direction ||= "先记录真实互动，再做整理。";
  profile.analysis ||= "资料不足，等待后续记录。";
  profile.aiAdvice ||= profile.direction;
  if (!Array.isArray(profile.archiveChat)) profile.archiveChat = [];
  profile.archiveChat = profile.archiveChat.filter((message) => !(/^整理失败：HTTP (401|400)$/.test(message?.text || "")));
  profile.events.forEach((event, index) => {
    event.id ||= `${profile.id}-event-${index}`;
    event.stage = Number.isFinite(Number(event.stage)) ? Math.min(Math.max(Number(event.stage), 0), Math.max(0, profile.milestones.length - 1)) : Math.min(index, Math.max(0, profile.current));
    event.summary ||= event.note || "待补充简述。";
    event.detail ||= event.note || event.summary;
    event.rawText ||= "";
    event.date ||= "时间待补";
    event.title ||= "未命名事件";
  });
}

store.profiles.forEach((profile) => {
  normalizeProfile(profile);
});
let modal = null;
let timelineDraft = null;
let archiveFolderHandle = null;
let archiveFolderFiles = [];
let pendingArchiveFiles = [];

const archiveDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open("relationship-manager-folder-v1", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("settings");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function saveFolderHandle(handle) {
  const db = await archiveDb();
  const transaction = db.transaction("settings", "readwrite");
  transaction.objectStore("settings").put(handle, "archive-folder");
}

async function getSavedFolderHandle() {
  const db = await archiveDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("settings", "readonly").objectStore("settings").get("archive-folder");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

let localFileStatus = { lastSavedAt: 0, lastError: "", lastLoadedAt: 0 };
let localWriteTimer = null;
let localWriteRunning = false;
let localWriteQueued = false;
let localDataWritePaused = readLocalText(LOCAL_WRITE_PAUSED_KEY, LEGACY_LOCAL_WRITE_PAUSED_KEY) === "1";

function setLocalDataWritePaused(paused) {
  localDataWritePaused = Boolean(paused);
  localStorage.setItem(LOCAL_WRITE_PAUSED_KEY, localDataWritePaused ? "1" : "0");
}

async function ensureFolderWritePermission(handle) {
  if (!handle?.queryPermission || !handle?.requestPermission) return true;
  const current = await handle.queryPermission({ mode: "readwrite" });
  if (current === "granted") return true;
  const requested = await handle.requestPermission({ mode: "readwrite" });
  return requested === "granted";
}

function cloneWithoutCredentials(value) {
  const cloned = structuredClone(value);
  const clearApiKey = (data) => {
    if (data?.api) data.api.apiKey = "";
  };
  clearApiKey(cloned);
  if (cloned?.accounts) cloned.accounts.forEach((account) => clearApiKey(account.data));
  return cloned;
}

function fullLocalDataPackage() {
  const cleanAccountBook = cloneWithoutCredentials(accountBook);
  const cleanStore = cloneWithoutCredentials(store);
  return {
    format: LOCAL_DATA_FORMAT,
    compatibleFormat: SYNC_FORMAT,
    exportedAt: new Date().toISOString(),
    activeAccountId,
    activeAccountName: activeAccount?.name || "我的档案",
    accountBook: cleanAccountBook,
    data: cleanStore,
    note: "这是人际关系管理器的本地完整数据镜像。可在新浏览器中通过“从本地数据文件恢复”读取。API Key 已故意留空，请在新设备单独填写。",
  };
}

function mergeById(baseItems = [], incomingItems = []) {
  const merged = [];
  const positions = new Map();
  [...baseItems, ...incomingItems].forEach((item) => {
    if (!item) return;
    const key = item.id || `${item.name || item.title || "item"}-${JSON.stringify(item).slice(0, 80)}`;
    if (positions.has(key)) {
      merged[positions.get(key)] = { ...merged[positions.get(key)], ...item };
    } else {
      positions.set(key, merged.length);
      merged.push(item);
    }
  });
  return merged;
}

function mergeStoreData(base = {}, incoming = {}) {
  const merged = { ...base, ...incoming };
  merged.profiles = mergeById(base.profiles || [], incoming.profiles || []);
  merged.trash = mergeById(base.trash || [], incoming.trash || []);
  merged.me = { ...normalizeMe(base.me), ...normalizeMe(incoming.me) };
  merged.app = { ...defaultAppSettings, ...(base.app || {}), ...(incoming.app || {}) };
  merged.api = { baseUrl: "", model: "", apiKey: "", persona: "", ...(base.api || {}), ...(incoming.api || {}) };
  merged.api.apiKey = "";
  if (!merged.selected || !merged.profiles.some((profile) => profile.id === merged.selected)) {
    merged.selected = incoming.selected && merged.profiles.some((profile) => profile.id === incoming.selected)
      ? incoming.selected
      : base.selected && merged.profiles.some((profile) => profile.id === base.selected)
        ? base.selected
        : merged.profiles[0]?.id;
  }
  return merged;
}

function normalizeLocalPayload(payload) {
  if (payload?.accountBook?.accounts?.length) return cloneWithoutCredentials(payload);
  const imported = [SYNC_FORMAT, LEGACY_SYNC_FORMAT].includes(payload?.format) ? payload.data : (payload?.data || payload);
  return {
    format: LOCAL_DATA_FORMAT,
    compatibleFormat: SYNC_FORMAT,
    exportedAt: payload?.exportedAt || new Date().toISOString(),
    activeAccountId: activeAccountId || "owner",
    activeAccountName: activeAccount?.name || "我的档案",
    accountBook: {
      accounts: [{ id: activeAccountId || "owner", name: activeAccount?.name || "我的档案", pinHash: "", data: cloneWithoutCredentials(imported) }],
      activeId: activeAccountId || "owner",
    },
    data: cloneWithoutCredentials(imported),
  };
}

function mergeLocalDataPackages(folderPayload, browserPayload) {
  const base = normalizeLocalPayload(folderPayload);
  const incoming = normalizeLocalPayload(browserPayload);
  const baseBook = base.accountBook;
  const incomingBook = incoming.accountBook;
  const accounts = [...baseBook.accounts.map((account) => ({ ...account, data: cloneWithoutCredentials(account.data || newAccountStore()) }))];
  const indexById = new Map(accounts.map((account, index) => [account.id, index]));
  incomingBook.accounts.forEach((account) => {
    const incomingAccount = { ...account, data: cloneWithoutCredentials(account.data || newAccountStore()) };
    if (indexById.has(incomingAccount.id)) {
      const index = indexById.get(incomingAccount.id);
      accounts[index] = {
        ...accounts[index],
        ...incomingAccount,
        data: mergeStoreData(accounts[index].data || {}, incomingAccount.data || {}),
      };
    } else {
      indexById.set(incomingAccount.id, accounts.length);
      accounts.push(incomingAccount);
    }
  });
  const activeId = incoming.activeAccountId || incomingBook.activeId || base.activeAccountId || baseBook.activeId || accounts[0]?.id;
  const active = accounts.find((account) => account.id === activeId) || accounts[0];
  return {
    ...base,
    exportedAt: new Date().toISOString(),
    activeAccountId: active?.id,
    activeAccountName: active?.name || "我的档案",
    accountBook: { accounts, activeId: active?.id },
    data: active?.data || base.data,
    note: "这是人际关系管理器的本地完整数据镜像。关联已有文件夹时会把当前浏览器新增档案合并进来；API Key 已故意留空，请在本机单独填写。",
  };
}

async function readLocalDataFilePayload() {
  if (!archiveFolderHandle) return null;
  try {
    const fileHandle = await archiveFolderHandle.getFileHandle(LOCAL_DATA_FILE);
    const text = await (await fileHandle.getFile()).text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeTextFile(directoryHandle, fileName, text) {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function writeFullDataFile(reason = "auto") {
  if (!archiveFolderHandle) return false;
  if (localDataWritePaused && reason !== "manual") return false;
  if (localDataWritePaused && reason === "manual") {
    const okToOverwrite = confirm(`当前关联的文件夹里已有 ${LOCAL_DATA_FILE}，为防止旧资料被当前浏览器数据覆盖，自动保存已暂停。

确定要用“当前浏览器里的档案数据”覆盖这个本地文件吗？

建议：如果你是想读取旧资料，请点“取消”，再使用“从本地数据文件恢复”。`);
    if (!okToOverwrite) {
      localFileStatus = { ...localFileStatus, lastError: "已取消覆盖旧本地数据文件。" };
      return false;
    }
  }
  if (localWriteRunning) {
    localWriteQueued = true;
    return false;
  }
  localWriteRunning = true;
  try {
    const ok = await ensureFolderWritePermission(archiveFolderHandle);
    if (!ok) throw new Error("没有本地文件夹写入权限");
    const payload = fullLocalDataPackage();
    const json = JSON.stringify(payload, null, 2);
    await writeTextFile(archiveFolderHandle, LOCAL_DATA_FILE, json);
    if (reason === "manual") {
      const backupDir = await archiveFolderHandle.getDirectoryHandle(LOCAL_BACKUP_DIR, { create: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      await writeTextFile(backupDir, `${LOCAL_SNAPSHOT_PREFIX}-${stamp}.json`, json);
    }
    setLocalDataWritePaused(false);
    localFileStatus = { ...localFileStatus, lastSavedAt: Date.now(), lastError: "" };
    return true;
  } catch (error) {
    localFileStatus = { ...localFileStatus, lastError: error instanceof Error ? error.message : "本地保存失败" };
    console.warn("Local data file save failed:", error);
    return false;
  } finally {
    localWriteRunning = false;
    if (localWriteQueued) {
      localWriteQueued = false;
      queueLocalDataWrite();
    }
  }
}

function queueLocalDataWrite() {
  if (!archiveFolderHandle) return;
  if (localDataWritePaused) return;
  window.clearTimeout(localWriteTimer);
  localWriteTimer = window.setTimeout(() => void writeFullDataFile("auto"), 500);
}

function importStoreData(imported) {
  if (!Array.isArray(imported?.profiles)) throw new Error("invalid store");
  store = imported;
  store.api = { baseUrl: "", model: "", apiKey: "", persona: "", ...store.api };
  store.api.apiKey = "";
  store.me = normalizeMe(store.me);
  store.app = { ...defaultAppSettings, ...(store.app || {}) };
  store.trash ??= [];
  store.profiles.forEach(normalizeProfile);
  activeAccount.data = store;
}

function importFullLocalPayload(payload) {
  if (payload?.accountBook?.accounts?.length) {
    const importedBook = cloneWithoutCredentials(payload.accountBook);
    accountBook = importedBook;
    activeAccountId = payload.activeAccountId || importedBook.activeId || importedBook.accounts[0].id;
    if (!importedBook.accounts.some((account) => account.id === activeAccountId)) activeAccountId = importedBook.accounts[0].id;
    importedBook.activeId = activeAccountId;
    activeAccount = importedBook.accounts.find((account) => account.id === activeAccountId) || importedBook.accounts[0];
    if (!activeAccount.data) activeAccount.data = newAccountStore();
    store = activeAccount.data;
    store.api = { baseUrl: "", model: "", apiKey: "", persona: "", ...store.api };
    store.api.apiKey = "";
    store.me = normalizeMe(store.me);
    store.app = { ...defaultAppSettings, ...(store.app || {}) };
    store.trash ??= [];
    store.profiles.forEach(normalizeProfile);
    accountLocked = Boolean(activeAccount.pinHash);
    return;
  }
  const imported = [SYNC_FORMAT, LEGACY_SYNC_FORMAT].includes(payload?.format) ? payload.data : (payload?.data || payload);
  importStoreData(imported);
}

async function restoreFromLocalDataFile() {
  if (!archiveFolderHandle) {
    alert(`请先关联本地数据文件夹。新浏览器第一次使用时，请选择之前保存过“${LOCAL_DATA_FILE}”的那个文件夹。`);
    return;
  }
  try {
    const payload = await readLocalDataFilePayload();
    if (!payload) throw new Error("not found");
    importFullLocalPayload(payload);
    setLocalDataWritePaused(false);
    localFileStatus = { ...localFileStatus, lastLoadedAt: Date.now(), lastError: "" };
    save();
    render();
    alert("已从本地数据文件恢复。API Key 不会随资料文件恢复，请在本机重新填写。");
  } catch {
    alert(`没有在当前文件夹找到 ${LOCAL_DATA_FILE}，或文件内容不可用。`);
  }
}

async function manualSaveLocalData() {
  const ok = await writeFullDataFile("manual");
  render();
  alert(ok ? `已保存到本地文件夹：${LOCAL_DATA_FILE}` : (localFileStatus.lastError || "保存失败，请先关联可写入的本地文件夹。"));
}

async function createEmptyDataSpace() {
  const name = prompt("请输入新的空白数据空间名称：", "新的档案空间");
  if (!name) return;
  const account = { id: `account-${Date.now()}`, name: name.trim() || "新的档案空间", pinHash: "", data: newAccountStore() };
  accountBook.accounts.push(account);
  activeAccountId = account.id;
  activeAccount = account;
  store = account.data;
  accountLocked = false;
  save();
  closeModal();
  render();
}

function clearCurrentDataSpace() {
  if (!confirm(`确定清空当前数据空间“${activeAccount?.name || "我的档案"}”吗？清空前建议先手动保存一次本地快照。`)) return;
  activeAccount.data = newAccountStore();
  store = activeAccount.data;
  save();
  closeModal();
  render();
}

async function scanArchiveFolder(directory = archiveFolderHandle, prefix = "") {
  if (!directory) return [];
  const files = [];
  for await (const [name, handle] of directory.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === "directory") files.push(...await scanArchiveFolder(handle, path));
    if (handle.kind === "file" && /\.md$/i.test(name)) files.push({ path, handle });
  }
  return files;
}

async function chooseArchiveFolder() {
  if (!window.showDirectoryPicker) {
    alert("当前浏览器不支持直接关联文件夹。请用 Chrome / Edge，并通过 npm run dev 或启动器打开 localhost 页面；单纯双击 OFFLINE.html 通常不能直接写入文件夹。" );
    return;
  }
  const previousHandle = archiveFolderHandle;
  const previousFiles = archiveFolderFiles;
  try {
    archiveFolderHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    const ok = await ensureFolderWritePermission(archiveFolderHandle);
    if (!ok) throw new Error("没有写入权限");
    archiveFolderFiles = await scanArchiveFolder();
    const existing = await readLocalDataFilePayload();
    if (existing) {
      const browserPayload = fullLocalDataPackage();
      const shouldMerge = confirm(`检测到当前文件夹已有 ${LOCAL_DATA_FILE}。

点击“确定”：读取文件夹里的旧数据，并把当前浏览器新增档案合并进去，然后保存为合并后的完整数据。
点击“取消”：取消本次关联，不读取、不写入，当前界面和旧文件都保持不变。`);
      if (!shouldMerge) {
        archiveFolderHandle = previousHandle;
        archiveFolderFiles = previousFiles;
        alert("已取消关联。当前界面和文件夹里的旧数据都没有改变。");
        render();
        return;
      }
      const backupDir = await archiveFolderHandle.getDirectoryHandle(LOCAL_BACKUP_DIR, { create: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      await writeTextFile(backupDir, `${LOCAL_SNAPSHOT_PREFIX}-合并前旧数据-${stamp}.json`, JSON.stringify(existing, null, 2));
      const mergedPayload = mergeLocalDataPackages(existing, browserPayload);
      await saveFolderHandle(archiveFolderHandle);
      importFullLocalPayload(mergedPayload);
      setLocalDataWritePaused(false);
      localFileStatus = { ...localFileStatus, lastLoadedAt: Date.now(), lastError: "" };
      save();
      await writeFullDataFile("manual");
      alert("已合并完成：文件夹旧数据和当前浏览器新增档案已合并，并已保存回本地文件。合并前旧文件已放入“自动备份”文件夹。API Key 不会随资料文件恢复，请在本机重新填写。");
    } else if (!existing) {
      await saveFolderHandle(archiveFolderHandle);
      setLocalDataWritePaused(false);
      await writeFullDataFile("manual");
    }
    render();
  } catch (error) {
    if (error?.name !== "AbortError") alert("关联文件夹失败，请确认该文件夹可读写。" );
  }
}

function safeFileName(value) {
  return value.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "-").slice(0, 60);
}

function localMarkdownStamp(time = Date.now()) {
  return new Date(time).toISOString().replace(/[:.]/g, "-");
}

async function getPersonArchiveDirectory(profile) {
  if (!archiveFolderHandle) return null;
  const root = await archiveFolderHandle.getDirectoryHandle("人际关系管理器记录", { create: true });
  return root.getDirectoryHandle(safeFileName(profile.name), { create: true });
}

async function writeEventMarkdown(profile, event) {
  if (!archiveFolderHandle) return;
  const person = await getPersonArchiveDirectory(profile);
  const file = await person.getFileHandle(`${safeFileName(event.date)}-${safeFileName(event.title)}.md`, { create: true });
  const writable = await file.createWritable();
  const stage = profile.milestones[event.stage] || "未归类";
  await writable.write(`# ${event.title}\n\n- 日期：${event.date}\n- 人物：${profile.name}\n- 关系阶段：${stage}\n\n## 事件简述\n\n${event.summary}\n\n## 整理后的完整记录\n\n${event.detail}\n\n## 原始口述\n\n${event.rawText || "无"}\n`);
  await writable.close();
  archiveFolderFiles = await scanArchiveFolder();
}

async function writeRawSourceMarkdown(profile, record) {
  if (!archiveFolderHandle || !record) return;
  try {
    const person = await getPersonArchiveDirectory(profile);
    const dir = await person.getDirectoryHandle("原始资料", { create: true });
    const title = safeFileName(record.name || "保存原文");
    const fileName = `${localMarkdownStamp(record.createdAt)}-${title}.md`;
    const attachments = record.name && !["手动存入的原始资料", "手动保存的原文"].includes(record.name) ? record.name : "无";
    await writeTextFile(dir, fileName, `# ${record.name || "保存原文"}\n\n- 人物：${profile.name}\n- 保存时间：${new Date(record.createdAt || Date.now()).toLocaleString("zh-CN")}\n- 附件：${attachments}\n\n## 原文\n\n${record.text || ""}\n`);
    archiveFolderFiles = await scanArchiveFolder();
  } catch (error) {
    console.warn("Raw source markdown save failed:", error);
  }
}

async function writeArchiveChatMarkdown(profile) {
  if (!archiveFolderHandle) return;
  try {
    const person = await getPersonArchiveDirectory(profile);
    const dir = await person.getDirectoryHandle("聊天记录", { create: true });
    const date = new Date().toISOString().slice(0, 10);
    const lines = (profile.archiveChat || [])
      .filter((message) => !isArchiveOperationMessage(message))
      .map((message) => {
        const who = message.role === "user" ? "我" : "档案 AI";
        const time = message.time ? new Date(message.time).toLocaleString("zh-CN") : "";
        const attachments = message.attachments?.length ? `\n附件：${message.attachments.join("、")}` : "";
        return `## ${who}${time ? ` · ${time}` : ""}${attachments}\n\n${message.text || ""}`;
      })
      .join("\n\n---\n\n");
    await writeTextFile(dir, `${date}-AI对话.md`, `# ${profile.name} 的 AI 对话记录\n\n${lines || "暂无对话。"}\n`);
    archiveFolderFiles = await scanArchiveFolder();
  } catch (error) {
    console.warn("Archive chat markdown save failed:", error);
  }
}

function profileOverviewMarkdown(profile) {
  normalizeProfile(profile);
  normalizeStageMetrics(profile);
  const schema = getMetricSchema(profile);
  const focused = Math.min(Math.max(profile.focusedMilestone ?? profile.current ?? 0, 0), profile.milestones.length - 1);
  const metrics = profile.stageMetrics?.[focused] || activeMetrics(profile);
  const stages = (profile.milestoneDetails || []).map((detail, index) => {
    const marker = index === profile.current ? "（当前）" : "";
    return `- ${index + 1}. ${detail.name}${marker}\n  ${detail.description || "待补充"}`;
  }).join("\n");
  const metricLines = schema.map((metric) => `- ${metric.label}：${Math.min(100, Math.max(0, Number(metrics[metric.id] ?? 0)))}`).join("\n");
  const tags = (profile.tags || []).join(" / ") || "无";
  const persona = profile.persona || {};
  return `# ${profile.name} 档案总览

- 当前阶段：${profile.stage || profile.milestones?.[profile.current] || "未设置"}
- 副标题：${profile.title || "待补充"}
- 标签：${tags}
- 事件数：${profile.events?.length || 0}
- 照片数：${profile.photos?.length || 0}
- 导出时间：${new Date().toLocaleString("zh-CN")}

## 故事梗概

${profile.summary || "待补充"}

## 人物画像

- 沟通风格：${persona.communication || "待补充"}
- 兴趣偏好：${Array.isArray(persona.interests) && persona.interests.length ? persona.interests.join(" / ") : "待补充"}
- 边界与在意：${persona.boundaries || "待补充"}

## 关系阶段

${stages || "待补充"}

## 当前查看阶段关系维度

${metricLines || "待补充"}

## 当前关系判断

${profile.direction || "待补充"}

## 当前分析

${profile.analysis || "待补充"}

## 接下来怎么做

${profile.aiAdvice || "待补充"}
`;
}

function eventMarkdown(profile, event) {
  const stage = profile.milestones?.[event.stage] || "未归类";
  return `# ${event.title || "未命名事件"}

- 日期：${event.date || "时间待补"}
- 人物：${profile.name}
- 关系阶段：${stage}

## 事件简述

${event.summary || "待补充"}

## 完整记录

${event.detail || "待补充"}

## 原始口述

${event.rawText || "无"}
`;
}

async function exportReadableProfileArchive(profile) {
  const person = await getPersonArchiveDirectory(profile);
  await writeTextFile(person, "档案总览.md", profileOverviewMarkdown(profile));

  const eventDir = await person.getDirectoryHandle("事件记录", { create: true });
  const sorted = sortedEvents(profile, false);
  for (const event of sorted) {
    const fileName = `${safeFileName(event.date || "时间待补")}-${safeFileName(event.title || "未命名事件")}.md`;
    await writeTextFile(eventDir, fileName, eventMarkdown(profile, event));
  }

  const sourceDir = await person.getDirectoryHandle("原始资料", { create: true });
  for (const record of (profile.sourceRecords || [])) {
    const title = safeFileName(record.name || "原始资料");
    const fileName = `${localMarkdownStamp(record.createdAt || Date.now())}-${title}.md`;
    const attachments = record.name && !["手动存入的原始资料", "手动保存的原文"].includes(record.name) ? record.name : "无";
    await writeTextFile(sourceDir, fileName, `# ${record.name || "原始资料"}\n\n- 人物：${profile.name}\n- 保存时间：${new Date(record.createdAt || Date.now()).toLocaleString("zh-CN")}\n- 附件：${attachments}\n\n## 原文\n\n${record.text || record.content || ""}\n`);
  }

  await writeArchiveChatMarkdown(profile);
}

async function exportReadableArchive() {
  if (!archiveFolderHandle) {
    alert("请先关联本地数据文件夹，再导出可读档案。");
    return;
  }
  try {
    for (const profile of store.profiles || []) {
      await exportReadableProfileArchive(profile);
    }
    archiveFolderFiles = await scanArchiveFolder();
    alert(`已导出 ${store.profiles.length} 位人物的可读 Markdown 档案。`);
  } catch (error) {
    alert(`导出可读档案失败：${error instanceof Error ? error.message : "请检查本地文件夹权限。"}`);
  }
}

async function readLinkedMaterials(profile) {
  if (!archiveFolderHandle || !profile.materials.length) return "";
  const texts = [];
  for (const path of profile.materials.slice(-3)) {
    try {
      const parts = path.split("/");
      const fileName = parts.pop();
      let parent = archiveFolderHandle;
      for (const part of parts) parent = await parent.getDirectoryHandle(part);
      const file = await parent.getFileHandle(fileName);
      const text = await (await file.getFile()).text();
      texts.push(`材料：${path}\n${text.slice(0, 6000)}`);
    } catch { /* Existing manual material labels remain local-only. */ }
  }
  return texts.join("\n\n");
}

const app = document.querySelector("#app");
const selected = () => store.profiles.find((item) => item.id === store.selected) || store.profiles[0];
const save = () => {
  activeAccount.data = store;
  accountBook.activeId = activeAccountId;
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accountBook));
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, activeAccountId);
  // Keep a legacy-compatible copy for existing local backups and launchers.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  // Browser storage remains the fast cache; the linked folder is the durable local mirror.
  queueLocalDataWrite();
};

// Sync packages intentionally exclude credentials. They can be moved by cable,
// trusted local transfer, or the system share sheet without using our server.
const syncPackage = () => {
  const data = structuredClone(store);
  data.api ??= {};
  data.api.apiKey = "";
  return { format: SYNC_FORMAT, exportedAt: new Date().toISOString(), data };
};

function downloadSyncPackage(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `人际关系管理器同步包-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSyncPackage() {
  downloadSyncPackage(syncPackage());
}
const escapeHtml = (text = "") => text.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

function shrinkPhotoForArchive(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("浏览器无法读取这张图片。"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("这张图片的格式无法在浏览器中处理，请换成 JPG、PNG 或 WebP。"));
      image.onload = () => {
        const maxEdge = 960;
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        // Store a compact local preview instead of the original camera file.
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const chatEndpoint = (baseUrl) => {
  const normalized = baseUrl.trim().replace(/\/$/, "");
  return /\/chat\/completions$/i.test(normalized) ? normalized : `${normalized}/chat/completions`;
};
async function parseApiError(response) {
  const body = await response.text();
  try {
    const payload = JSON.parse(body);
    return payload?.error?.message || body;
  } catch {
    return body || `HTTP ${response.status}`;
  }
}
function parseModelJson(text) {
  const cleaned = (text || "").replace(/```json|```/gi, "").trim();
  try { return JSON.parse(cleaned); } catch { /* Some compatible APIs add a short preface. */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("模型没有按要求返回可用的结构化内容。");
}
const photoStyle = (profile) => {
  const photo = profile.photos?.[profile.coverPhotoIndex];
  return photo ? `background-image:url('${photo}');--avatar:${profile.color}` : `--avatar:${profile.color}`;
};
const meAvatarStyle = () => store.me?.avatar ? `background-image:url('${store.me.avatar}')` : "";

function buildLocalMePortraitText() {
  const me = normalizeMe(store.me);
  const filled = [
    ["基本情况", me.about],
    ["工作与创作", me.workAndCreation],
    ["生活、健康与精力", me.lifeAndHealth],
    ["关系经历", me.relationshipHistory],
    ["思维习惯", me.patterns],
    ["当前目标", me.goals],
    ["边界提醒", me.boundaries],
  ].filter(([, value]) => String(value || "").trim());
  if (!filled.length) return "资料还不够。先在“我的档案库”里补充你的基本情况、工作创作、关系经历、目标和边界；后续 AI 会基于这些长期资料形成更准确的用户画像。";
  const lines = filled.map(([label, value]) => `【${label}】${String(value).slice(0, 220)}`);
  return lines.join("\n\n");
}


function meProfileCardModal() {
  const me = normalizeMe(store.me);
  const portrait = me.aiPortrait || buildLocalMePortraitText();
  openModal(`<div class="modal-header"><h2>我的头像与用户画像</h2><button class="quiet-btn" data-action="close">关闭</button></div><div class="me-profile-card"><button class="me-avatar-large" data-action="upload-me-avatar" style="${me.avatar ? `background-image:url('${me.avatar}')` : ""}" title="更换头像"><span>${me.avatar ? "更换头像" : "上传头像"}</span></button><div class="me-profile-copy"><p class="section-caption">AI 用户画像</p><h3>${escapeHtml(activeAccount?.name || "我的档案")}</h3><p>${escapeHtml(portrait)}</p>${me.aiPortraitUpdatedAt ? `<small>上次生成：${new Date(me.aiPortraitUpdatedAt).toLocaleString("zh-CN")}</small>` : `<small>当前为本地资料概览；填写 API 后可点击“重新生成画像”。</small>`}</div></div><div class="modal-actions"><button class="quiet-btn" data-action="upload-me-avatar">更换头像</button><button class="quiet-btn" data-action="me">编辑我的档案库</button><button class="quiet-btn" data-action="reanalyze-me-portrait">重新生成画像</button><button class="primary-btn" data-action="close">完成</button></div>`);
}

async function reanalyzeMePortrait() {
  const me = normalizeMe(store.me);
  const source = buildLocalMePortraitText();
  if (!store.api.baseUrl || !store.api.model) {
    store.me.aiPortrait = source;
    store.me.aiPortraitUpdatedAt = Date.now();
    save();
    meProfileCardModal();
    return;
  }
  try {
    const response = await fetch(chatEndpoint(store.api.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(store.api.apiKey ? { Authorization: `Bearer ${store.api.apiKey}` } : {}) },
      body: JSON.stringify({ model: store.api.model, temperature: 0.3, messages: [
        { role: "system", content: "你是本地档案馆的用户画像整理助手。只依据用户在“我的档案库”里填写的长期资料，输出克制、客观、非诊断式的用户画像。不要分析具体关系档案，不要给医疗、法律、财务结论。200-350字。" },
        { role: "user", content: `我的长期资料：
${source.slice(0, 12000)}` },
      ] }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await parseApiError(response)}`);
    const data = await response.json();
    store.me.aiPortrait = data.choices?.[0]?.message?.content?.trim() || source;
    store.me.aiPortraitUpdatedAt = Date.now();
    save();
    meProfileCardModal();
  } catch (error) {
    alert(`用户画像生成失败：${error instanceof Error ? error.message : "请检查接口设置。"}`);
  }
}


function metricValueFromAny(profile, input, metric, index, stageIndex = 0) {
  if (!input || typeof input !== "object") return undefined;
  const legacyKeys = ["familiarity", "trust", "curiosity", "initiative", "risk"];
  const candidates = [metric.id, metric.label, metricLabels[metric.id], legacyKeys[index]];
  for (const key of candidates) {
    if (key && input[key] !== undefined && input[key] !== null && input[key] !== "") return Number(input[key]);
  }
  const byIndex = Array.isArray(input) ? input[index] : Object.values(input)[index];
  return Number(byIndex);
}
function isRiskLike(label = "") {
  return /风险|压力|冲突|警惕|负担|消耗|危险|矛盾|不安/.test(label);
}
function defaultMetricObject(profile, stageIndex = 0) {
  const schema = getMetricSchema(profile);
  const count = Math.max(1, profile.milestones?.length || profile.milestoneDetails?.length || 1);
  const ratio = count <= 1 ? 0.45 : (stageIndex + 1) / count;
  const eventCount = (profile.events || []).filter((event) => Number(event.stage) === Number(stageIndex)).length;
  const hasAnyEvent = (profile.events || []).length > 0;
  const obj = {};
  schema.forEach((metric, index) => {
    let value;
    if (isRiskLike(metric.label)) value = Math.round(8 + ratio * 22 + Math.min(28, eventCount * 6));
    else value = Math.round((hasAnyEvent ? 18 : 0) + ratio * 58 + Math.min(18, eventCount * 5) + Math.max(0, index - 1) * 2);
    obj[metric.id] = Math.min(100, Math.max(0, value));
  });
  return obj;
}
function normalizeMetricObject(profile, input = {}, stageIndex = 0) {
  const schema = getMetricSchema(profile);
  const fallback = defaultMetricObject(profile, stageIndex);
  const out = {};
  schema.forEach((metric, index) => {
    const raw = metricValueFromAny(profile, input, metric, index, stageIndex);
    out[metric.id] = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : fallback[metric.id];
  });
  return out;
}
function metricObjectIsAllZero(profile, metricObject = {}) {
  return getMetricSchema(profile).every((metric) => Number(metricObject?.[metric.id] || 0) === 0);
}
function metricObjectsEquivalent(profile, left = {}, right = {}) {
  return getMetricSchema(profile).every((metric) => Number(left?.[metric.id] ?? NaN) === Number(right?.[metric.id] ?? NaN));
}
function defaultStageMetrics(profile) {
  const count = Math.max(1, profile.milestones?.length || profile.milestoneDetails?.length || 1);
  return Array.from({ length: count }, (_, index) => defaultMetricObject(profile, index));
}
function coerceStageMetricsArray(profile, input) {
  if (!Array.isArray(input)) return defaultStageMetrics(profile);
  const count = Math.max(1, profile.milestones?.length || profile.milestoneDetails?.length || input.length || 1);
  return Array.from({ length: count }, (_, index) => normalizeMetricObject(profile, input[index] || defaultMetricObject(profile, index), index));
}
function normalizeStageMetrics(profile) {
  getMetricSchema(profile);
  const count = Math.max(1, profile.milestones?.length || profile.milestoneDetails?.length || 1);
  const existing = Array.isArray(profile.stageMetrics) ? profile.stageMetrics : [];
  const schema = getMetricSchema(profile);
  const allZero = existing.length > 0 && existing.slice(0, count).every((item, stageIndex) => schema.every((metric, metricIndex) => {
    const raw = metricValueFromAny(profile, item || {}, metric, metricIndex, stageIndex);
    return !Number.isFinite(raw) || Number(raw) === 0;
  }));
  const shouldUseHeuristic = !existing.length || (allZero && (profile.events || []).length > 0);
  profile.stageMetrics = Array.from({ length: count }, (_, index) => {
    const source = shouldUseHeuristic ? defaultMetricObject(profile, index) : (existing[index] || defaultMetricObject(profile, index));
    return normalizeMetricObject(profile, source, index);
  });
  for (let index = 1; index < profile.stageMetrics.length; index += 1) {
    const tailRepeats = profile.stageMetrics.slice(index).every((item) => metricObjectsEquivalent(profile, item, profile.stageMetrics[index - 1]));
    if (tailRepeats && profile.stageMetrics.length - index >= 2) {
      for (let tailIndex = index; tailIndex < profile.stageMetrics.length; tailIndex += 1) {
        profile.stageMetrics[tailIndex] = normalizeMetricObject(profile, defaultMetricObject(profile, tailIndex), tailIndex);
      }
      break;
    }
  }
  const current = Math.min(Math.max(profile.current ?? 0, 0), profile.stageMetrics.length - 1);
  profile.metrics = normalizeMetricObject(profile, profile.metrics || profile.stageMetrics[current] || {}, current);
}
function activeMetrics(profile) {
  normalizeStageMetrics(profile);
  const focused = Math.min(Math.max(profile.focusedMilestone ?? profile.current ?? 0, 0), profile.stageMetrics.length - 1);
  return profile.stageMetrics[focused] || defaultMetricObject(profile, focused);
}
function metricHtml(profile) {
  const schema = getMetricSchema(profile);
  const metrics = activeMetrics(profile);
  return schema.map((metric) => {
    const value = Math.min(100, Math.max(0, Number(metrics[metric.id] ?? 0)));
    return `<div class="metric"><span class="metric-name">${escapeHtml(metric.label)}</span><strong>${value}</strong><div class="metric-line"><i style="width:${value}%"></i></div></div>`;
  }).join("");
}
function metricEditorHtml(profile) {
  const schema = getMetricSchema(profile);
  const metrics = activeMetrics(profile);
  return schema.map((metric) => `<label class="metric-editor"><span>${escapeHtml(metric.label)}</span><input type="number" min="0" max="100" step="1" data-metric="${escapeHtml(metric.id)}" value="${Math.min(100, Math.max(0, Number(metrics[metric.id] ?? 0)))}"></label>`).join("");
}
function metricJsonExample(profile) {
  return `{${getMetricSchema(profile).map((metric) => `"${metric.id}":0`).join(",")}}`;
}
function profileJsonSchemaPrompt(profile) {
  const metricExample = metricJsonExample(profile);
  return `{"title":"人物副标题","tags":["标签"],"summary":"总梗概","persona":{"communication":"沟通风格","interests":["兴趣/关注点"],"boundaries":"边界与在意","confidence":"资料依据说明"},"milestones":[{"name":"节点名","description":"阶段事实概述"}],"current":0,"metrics":${metricExample},"stageMetrics":[${metricExample}],"events":[{"date":"YYYY-MM-DD 或 YYYY-MM 或 时间待补","title":"事件标题","summary":"简述","detail":"完整记录","stage":0}],"direction":"当前阶段判断","analysis":"当前分析","advice":"接下来怎么做","contextSummary":"上下文摘要"}`;
}
function metricSchemaInstruction(profile) {
  return `当前关系维度 metricSchema：${JSON.stringify(getMetricSchema(profile))}。metrics 和 stageMetrics 必须只使用这些 id 作为键，数值为 0-100；不要输出 familiarity/trust 等不存在的旧键，除非它们本来就是当前 id。`;
}

function personaHtml(profile) {
  const persona = profile.persona;
  const interests = persona.interests.length ? persona.interests : ["待补充"];
  return `<aside class="persona-card"><div class="persona-head"><div><p class="section-caption">人物画像</p><h2 class="section-title">她/他的相处方式</h2></div></div><div class="persona-row"><span>沟通风格</span>${compactTextHtml(persona.communication, "persona-text")}</div><div class="persona-row"><span>兴趣偏好</span><div class="persona-tags">${interests.slice(0, 8).map((item) => `<i>${escapeHtml(item)}</i>`).join("")}</div></div><div class="persona-row"><span>边界与在意</span>${compactTextHtml(persona.boundaries, "persona-text")}</div><small>由手动记录与 AI 整理共同维护，未确认内容不作为事实。</small></aside>`;
}

function compactTextHtml(text, className = "") {
  const value = String(text || "待补充").trim() || "待补充";
  return `<details class="compact-text ${className}"><summary><span>${escapeHtml(value)}</span><i aria-hidden="true"></i></summary><p>${escapeHtml(value)}</p></details>`;
}

function nodesHtml(profile) {
  const progress = Math.min(100, (profile.current / Math.max(1, profile.milestones.length - 1)) * 100);
  return `<div class="relationship-map" style="--progress:${progress}%"><div class="nodes">${profile.milestones.map((name, index) => `<button type="button" class="node ${index < profile.current ? "done" : ""} ${index === profile.current ? "current" : ""} ${index === profile.focusedMilestone ? "selected" : ""}" data-stage-node="${index}" aria-pressed="${index === profile.focusedMilestone}" title="查看 ${escapeHtml(name)} 的阶段档案"><div class="node-mark">${index < profile.current ? "✓" : index + 1}</div><div class="node-name">${escapeHtml(name)}</div></button>`).join("")}</div></div>`;
}

function selectStage(profile, stage) {
  const index = Math.min(Math.max(Number(stage), 0), profile.milestones.length - 1);
  profile.focusedMilestone = index;
  save();
  render();
}

function momentsPreviewHtml(profile) {
  const tiles = Array.from({ length: 5 }, (_, index) => {
    const photo = profile.photos?.[index];
    return `<button type="button" class="moment-tile ${photo ? "has-photo" : "empty"}" data-action="photos" ${photo ? `style="background-image:url('${photo}')"` : ""} title="打开精彩瞬间"><span>${photo ? `照片 ${index + 1}` : "待添加"}</span></button>`;
  }).join("");
  return `<div class="moments-preview"><div class="moments-head"><p class="section-caption moments-title">精彩瞬间</p><button class="quiet-btn" data-action="photos">管理照片</button></div><div class="moment-strip">${tiles}</div></div>`;
}

function stageNodeDetailHtml(profile, stageIndex, detail) {
  const stageEvents = sortedEvents(profile, false).filter((event) => Number(event.stage) === stageIndex);
  const eventItems = stageEvents.length
    ? stageEvents.map((event) => `<li><span>${escapeHtml(event.date || "时间待补")}</span><b>${escapeHtml(event.title || "未命名事件")}</b></li>`).join("")
    : `<li class="stage-node-empty"><span>暂无事件</span><b>这个节点还没有归属事件。</b></li>`;
  return `<details class="stage-node-card"><summary><div class="stage-detail-head"><p>查看节点</p><b>${escapeHtml(detail.name)}</b></div><p class="stage-node-summary">${escapeHtml(detail.description || "待补充这个阶段的事实与变化。")}</p><i class="stage-node-toggle" aria-hidden="true"></i></summary><div class="stage-node-events"><p>本节点时间线</p><ul>${eventItems}</ul></div></details>`;
}

function archiveActionStatusHtml() {
  if (pendingArchiveFiles.length) {
    return `<div class="archive-action-status"><b>已选择资料</b><span>${escapeHtml(pendingArchiveFiles.map((file) => file.name).join("、"))}</span></div>`;
  }
  if (archiveFolderHandle) {
    return `<div class="archive-action-status"><b>已关联：${escapeHtml(archiveFolderHandle.name)}</b><span>${archiveFolderFiles.length} 个 Markdown · 可继续选择资料</span></div>`;
  }
  return `<div class="archive-action-status"><b>未关联资料文件夹</b><span>可选择 .md / .txt / .json 文件，也可以直接粘贴</span></div>`;
}

function isArchiveOperationMessage(message) {
  if (message?.kind === "operation") return true;
  const text = String(message?.text || "");
  return message?.role === "assistant" && /^(已存入原始资料库|已保存原文|智能整理完成|更新档案完成|已重建 \d+ 条时间线事件|已追加 \d+ 条时间线事件|宸插瓨鍏ュ師濮嬭祫鏂欏簱|鏅鸿兘鏁寸悊瀹屾垚|宸.*(閲嶅缓|杩藉姞).*(鏃堕棿绾|浜嬩欢))/.test(text);
}

function archiveChatLogHtml(profile) {
  const messages = (profile.archiveChat || []).filter((message) => !isArchiveOperationMessage(message)).slice(-40);
  if (!messages.length) {
    return `<div class="archive-chat-log"><div class="chat-placeholder">长期对话记录会显示在这里。整理完成、重建完成这类操作提示不会再占用聊天窗口。</div></div>`;
  }
  return `<div class="archive-chat-log">${messages.map((message) => `<div class="chat-bubble ${message.role}"><small>${message.role === "user" ? "我" : "档案 AI"}${message.time ? ` · ${new Date(message.time).toLocaleString("zh-CN")}` : ""}</small><p>${escapeHtml(message.text)}</p>${message.attachments?.length ? `<span>附件：${message.attachments.map(escapeHtml).join("、")}</span>` : ""}</div>`).join("")}</div>`;
}

function timelineEventHtml(event) {
  const real = Boolean(event.id);
  return `<div class="event ${real ? "" : "placeholder"}" ${real ? `data-event-id="${escapeHtml(event.id)}"` : ""} title="${real ? "查看这条事件的完整记录" : ""}"><span class="event-date">${escapeHtml(event.date)}</span><i class="event-pin"></i><div class="event-main"><h4>${escapeHtml(event.title)}${real ? "" : ""}</h4><p>${escapeHtml(event.summary)}</p></div>${real ? `<div class="event-action-row"><button type="button" class="event-link" data-open-event="${escapeHtml(event.id)}">查看详情</button><button type="button" class="event-delete" data-delete-event="${escapeHtml(event.id)}">删除</button></div>` : ""}</div>`;
}

function dashboardHtml(profile) {
  const current = profile.milestones[profile.current] || "未设定";
  const focused = Math.min(Math.max(profile.focusedMilestone ?? profile.current, 0), profile.milestones.length - 1);
  const focusedDetail = profile.milestoneDetails[focused] || { name: profile.milestones[focused], description: "待补充" };
  const events = profile.events.length ? sortedEvents(profile, true) : [{ date: "待补", title: "还没有新增记录", summary: "从右上角的“新增记录”开始，把事实先放进档案。" }];
  return `<section class="card profile-head v2-profile-head" id="archive-overview"><button class="portrait" data-action="photos" style="${photoStyle(profile)}" data-initial="${escapeHtml(profile.initial)}" title="上传照片或打开本地相册"><span>${profile.photos.length ? `${profile.photos.length} 张照片` : "添加照片"}</span></button><div class="identity-block"><div class="profile-heading"><div><p class="eyebrow">现实人物档案</p><h1>${escapeHtml(profile.name)}</h1></div><button class="quiet-btn" data-action="edit">编辑档案</button></div><div class="profile-meta">${escapeHtml(profile.title)}</div><div class="tag-row">${profile.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>${compactTextHtml(profile.summary, "head-summary")}<div class="identity-footer"><span>已记录 ${profile.events.length} 条事件</span><span>照片 ${profile.photos.length} 张</span></div></div>${personaHtml(profile)}</section>
  <section class="card stage-ribbon"><div class="stage-ribbon-title"><div><p class="section-caption">当前关系阶段</p><b>${escapeHtml(profile.stage)}</b></div><button class="quiet-btn" data-action="edit-stages">编辑节点</button></div>${nodesHtml(profile)}</section>
  <div class="dashboard v2-dashboard" id="archive-records"><section class="card timeline-card"><div class="section-top"><div><p class="section-caption">关系时间线</p><h2 class="section-title">发生过什么</h2></div><button class="quiet-btn" data-action="record">新增事件 ＋</button></div><div class="timeline">${events.map(timelineEventHtml).join("")}</div></section>
  <section class="card relation-card"><div class="section-top"><div><p class="section-caption">关系阶段</p><h2 class="section-title">当前阶段档案</h2></div><span class="relation-current">正在查看：${escapeHtml(focusedDetail.name)}</span></div>${stageNodeDetailHtml(profile, focused, focusedDetail)}<div class="metrics-header"><p class="section-caption">关系维度 · ${escapeHtml(focusedDetail.name)}</p><span>数值跟随当前查看阶段</span></div><div class="metric-strip">${metricHtml(profile)}</div>${momentsPreviewHtml(profile)}</section></div>
  <div class="bottom-grid" id="archive-ai"><section class="card source-card"><div class="section-top"><div><p class="section-caption">档案 AI 工作台</p><h2 class="section-title">直接对话，或整理成档案</h2></div><button class="quiet-btn" data-action="link-folder">关联资料文件夹</button></div><div class="source-library-mini"><b>原始资料库</b><span>${profile.sourceRecords.length} 条资料 · 上次更新档案：${profile.lastSmartOrganizedAt ? new Date(profile.lastSmartOrganizedAt).toLocaleString("zh-CN") : "尚未更新"}</span></div>${archiveChatLogHtml(profile)}<textarea id="archive-chat-input" class="archive-chat-input" placeholder="直接和 AI 对话，或粘贴一段原始资料 / 故事记录…"></textarea><div class="context-row"><label>AI 上下文范围 <select id="context-mode"><option value="smart">智能摘要模式</option><option value="recent">最近完整上下文</option><option value="full">全量档案上下文</option><option value="none">仅本次输入</option></select></label></div><div class="archive-chat-actions action-grid">${archiveActionStatusHtml()}<div><button class="quiet-btn" data-action="attach-archive-file">选择资料</button><button class="quiet-btn" data-action="store-source-only">保存原文</button><button class="quiet-btn" data-action="split-timeline">初建/重建故事线</button><button class="quiet-btn" data-action="smart-organize">更新档案</button><button class="primary-btn" data-action="send-archive-chat">和 AI 对话</button></div></div></section><section class="card ai-card"><div class="section-top"><div><p class="section-caption">AI 关系判断</p><h2 class="section-title">当前分析</h2></div><button class="quiet-btn" data-action="analyze">重新分析 ✦</button></div><p class="ai-text">${escapeHtml(profile.analysis)}</p></section><section class="card advice-card"><div class="section-top"><div><p class="section-caption">AI 行动建议</p><h2 class="section-title">接下来怎么做</h2></div><span class="local-badge">随资料动态更新</span></div><p class="advice-text">${escapeHtml(profile.aiAdvice)}</p></section></div>`;
}

function render() {
  if (accountLocked) {
    app.innerHTML = accountLockScreen();
    bindEvents();
    return;
  }
  const profile = selected();
  applyAppTheme();
  const appCfg = appSettings();
  app.innerHTML = `<div class="app-shell"><div class="layout"><aside class="side"><div class="brand"><button type="button" class="brand-mark user-brand-avatar" data-action="me-profile-card" style="${meAvatarStyle()}" title="我的头像与用户画像">${store.me?.avatar ? "" : escapeHtml(appCfg.mark)}</button><div><strong>${escapeHtml(appCfg.title)}</strong><small>${escapeHtml(appCfg.subtitle)}</small></div></div><button class="account-switch" data-action="accounts"><span>当前档案空间</span><b>${escapeHtml(activeAccount.name)}</b></button><p class="side-label">人物档案 · ${store.profiles.length}</p><div class="profile-list">${store.profiles.map((item) => `<button class="profile-select ${item.id === profile.id ? "active" : ""}" data-profile="${item.id}"><span class="mini-avatar" style="${photoStyle(item)}">${item.photos.length ? "" : escapeHtml(item.initial)}</span><span><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.stage)} · ${item.events.length} 条记录</span></span>${item.id === profile.id ? '<i class="dot"></i>' : ""}</button>`).join("")}</div><button class="profile-select" data-action="new" style="margin-top:7px;color:#b9b4bd"><span class="mini-avatar">＋</span><span><b>新建档案</b><span>添加一位新人物</span></span></button><div class="side-footer"><button data-action="me">我的档案库</button><button data-action="trash">回收站${store.trash.length ? ` · ${store.trash.length}` : ""}</button><button data-action="backup-import">导入同步包</button><button data-action="settings">AI 与本地设置</button></div></aside><main class="workspace"><header class="topbar"><div class="trail">档案总览 <b>${escapeHtml(profile.name)}</b></div><nav class="tabs">${["概览", "记录", "分析", "设置"].map((tab) => `<button class="tab ${store.tab === tab ? "active" : ""}" data-tab="${tab}">${tab}</button>`).join("")}</nav><div class="top-actions"><button class="quiet-btn" data-action="export">导出同步包</button><button class="primary-btn" data-action="record">＋ 记录新事件</button></div></header><div class="content">${dashboardHtml(profile)}</div></main></div></div><input id="material-input" class="hidden" type="file" multiple><input id="archive-file-input" class="hidden" type="file" accept=".md,.txt,.json" multiple><input id="backup-input" class="hidden" type="file" accept="application/json"><input id="photo-input" class="hidden" type="file" accept="image/*" multiple><input id="me-avatar-input" class="hidden" type="file" accept="image/*">${modal || ""}`;
  bindEvents();
}

function openModal(content) { modal = `<div class="modal-backdrop"><section class="modal">${content}</section></div>`; render(); }
function closeModal() { modal = null; render(); }

function editModal(profile) {
  openModal(`<div class="modal-header"><h2>编辑 ${escapeHtml(profile.name)} 的档案</h2><button class="quiet-btn" data-action="close">关闭</button></div><div class="field-grid"><label class="field">姓名<input id="edit-name" value="${escapeHtml(profile.name)}"></label><label class="field">当前关系节点<select id="edit-current">${profile.milestones.map((name, index) => `<option value="${index}" ${index === profile.current ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label><label class="field full">人物标签<input id="edit-tags" value="${escapeHtml(profile.tags.join(" / "))}"></label><label class="field full">故事梗概<textarea id="edit-summary">${escapeHtml(profile.summary)}</textarea></label><label class="field">沟通风格<input id="edit-persona-communication" value="${escapeHtml(profile.persona.communication)}"></label><label class="field">兴趣偏好<input id="edit-persona-interests" value="${escapeHtml(profile.persona.interests.join(" / "))}"></label><label class="field full">边界与在意<textarea id="edit-persona-boundaries">${escapeHtml(profile.persona.boundaries)}</textarea></label><label class="field full">当前关系判断<textarea id="edit-direction">${escapeHtml(profile.direction)}</textarea></label><label class="field full">关系维度名称（用 / 分隔，可设置 3 - 9 个，例如：信任度 / 忠诚度 / 风险性）<input id="edit-metric-schema" value="${escapeHtml(metricSchemaText(profile))}"></label><div class="field full"><span>当前查看阶段的关系维度数值（0 - 100，可手动校准）</span><div class="metric-editor-grid">${metricEditorHtml(profile)}</div></div></div><div class="modal-actions"><button class="danger-btn" data-action="trash-profile">移入回收站</button><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="save-profile">保存档案</button></div>`);
}

function trashModal() {
  const items = store.trash.length ? store.trash.map((item) => `<div class="trash-item"><div><b>${escapeHtml(item.name)}</b><span>移入时间：${new Date(item.deletedAt).toLocaleString("zh-CN")}</span></div><div><button class="quiet-btn" data-restore-profile="${item.id}">恢复</button><button class="danger-btn" data-delete-profile="${item.id}">彻底删除</button></div></div>`).join("") : `<div class="trash-empty">回收站是空的。移入这里的档案可随时恢复。</div>`;
  openModal(`<div class="modal-header"><h2>回收站</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">移入回收站的档案仍保留照片、事件、原始资料和 AI 记录。只有点“彻底删除”才会真正清除。</p><div class="trash-list">${items}</div><div class="modal-actions"><button class="primary-btn" data-action="close">完成</button></div>`);
}

function moveProfileToTrash(profile) {
  if (store.profiles.length <= 1) {
    alert("至少保留一份人物档案。请先新建另一份档案，再移入回收站。");
    return;
  }
  if (!confirm(`将“${profile.name}”移入回收站？之后可以恢复。`)) return;
  store.profiles = store.profiles.filter((item) => item.id !== profile.id);
  store.trash.unshift({ ...profile, deletedAt: Date.now() });
  store.selected = store.profiles[0].id;
  save();
  closeModal();
}

function restoreProfile(id) {
  const index = store.trash.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [profile] = store.trash.splice(index, 1);
  delete profile.deletedAt;
  normalizeProfile(profile);
  store.profiles.push(profile);
  store.selected = profile.id;
  save();
  closeModal();
}

function permanentlyDeleteProfile(id) {
  const profile = store.trash.find((item) => item.id === id);
  if (!profile || !confirm(`彻底删除“${profile.name}”？此操作无法恢复。`)) return;
  store.trash = store.trash.filter((item) => item.id !== id);
  save();
  trashModal();
}

async function hashAccessCode(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function accountModal() {
  const accounts = accountBook.accounts.map((account) => `<button class="account-item ${account.id === activeAccountId ? "active" : ""}" data-account-id="${account.id}"><span>${escapeHtml(account.name)}</span><small>${account.pinHash ? "已设置访问码" : "无访问码"}</small></button>`).join("");
  openModal(`<div class="modal-header"><h2>本地档案空间</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">每个空间的数据、照片、事件、回收站和 AI 设置彼此独立，只保存在这台电脑。访问码用于避免多人共用电脑时误进入他人档案，不等同于云端账户。</p><div class="account-list">${accounts}</div><div class="modal-actions"><button class="quiet-btn" data-action="set-account-code">设置当前访问码</button><button class="primary-btn" data-action="new-account">新建档案空间</button></div>`);
}

function newAccountModal() {
  openModal(`<div class="modal-header"><h2>新建本地档案空间</h2><button class="quiet-btn" data-action="close">关闭</button></div><div class="field-grid"><label class="field full">空间名称<input id="account-name" placeholder="例如：张三的档案"></label><label class="field full">访问码（可留空）<input id="account-pin" type="password" inputmode="numeric" placeholder="留空则切换时不需要验证"></label></div><div class="modal-actions"><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="create-account">创建并进入</button></div>`);
}

function accountCodeModal() {
  openModal(`<div class="modal-header"><h2>设置 ${escapeHtml(activeAccount.name)} 的访问码</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">留空并保存可移除访问码。访问码只用于本机切换验证，不会上传云端。</p><div class="field-grid"><label class="field full">新访问码<input id="new-account-pin" type="password" inputmode="numeric" placeholder="至少 4 位更合适"></label></div><div class="modal-actions"><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="save-account-code">保存访问码</button></div>`);
}

function unlockAccountModal(account) {
  pendingAccountId = account.id;
  openModal(`<div class="modal-header"><h2>进入 ${escapeHtml(account.name)}</h2><button class="quiet-btn" data-action="accounts">返回</button></div><div class="field-grid"><label class="field full">访问码<input id="unlock-account-pin" type="password" inputmode="numeric" autofocus></label></div><p id="account-unlock-error" class="form-error" aria-live="polite"></p><div class="modal-actions"><button class="quiet-btn" data-action="accounts">返回</button><button class="primary-btn" data-action="unlock-account">进入档案</button></div>`);
}

function enterAccount(account) {
  activeAccountId = account.id;
  activeAccount = account;
  store = account.data;
  store.trash ??= [];
  store.profiles.forEach(normalizeProfile);
  accountLocked = false;
  save();
  closeModal();
}

function accountLockScreen() {
  return `<div class="lock-screen"><section class="lock-card"><div class="brand-mark">心</div><p class="eyebrow">本地档案空间</p><h1>${escapeHtml(activeAccount.name)}</h1><p>此空间已设置访问码。档案仍只保存在这台设备。</p><label class="field">访问码<input id="unlock-account-pin" type="password" inputmode="numeric" autofocus></label><p id="account-unlock-error" class="form-error" aria-live="polite"></p><div class="modal-actions"><button class="quiet-btn" data-action="accounts">切换空间</button><button class="primary-btn" data-action="unlock-account">进入档案</button></div></section></div>`;
}

async function createAccount() {
  const name = document.querySelector("#account-name")?.value.trim();
  const pin = document.querySelector("#account-pin")?.value || "";
  if (!name) return;
  const account = { id: `account-${Date.now()}`, name, pinHash: pin ? await hashAccessCode(pin) : "", data: newAccountStore() };
  accountBook.accounts.push(account);
  enterAccount(account);
}

async function saveAccountCode() {
  const pin = document.querySelector("#new-account-pin")?.value || "";
  activeAccount.pinHash = pin ? await hashAccessCode(pin) : "";
  save();
  closeModal();
}

async function unlockCurrentAccount() {
  const pin = document.querySelector("#unlock-account-pin")?.value || "";
  const target = accountBook.accounts.find((account) => account.id === (pendingAccountId || activeAccountId));
  if (!target) return;
  if (!target.pinHash || await hashAccessCode(pin) === target.pinHash) {
    pendingAccountId = null;
    enterAccount(target);
    return;
  }
  document.querySelector("#account-unlock-error").textContent = "访问码不正确。";
}

function recordModal(profile) {
  openModal(`<div class="modal-header"><h2>添加一条真实记录</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">先把你记得的原话、事实和感受写下来。AI 可以帮你生成标题、简述和完整故事稿；原始口述会同时保留。</p><div class="field-grid"><label class="field">日期<input id="record-date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label><label class="field">归属阶段<select id="record-stage">${profile.milestones.map((name, index) => `<option value="${index}" ${index === profile.focusedMilestone ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label><label class="field full">原始口述 / 事件详情<textarea id="record-detail" placeholder="尽量写清发生了什么、双方说了什么、你观察到的变化。"></textarea></label><label class="field full">事件标题<input id="record-title" placeholder="可留空，点击 AI 整理后生成"></label><label class="field full">事件简述<textarea id="record-summary" placeholder="可留空，点击 AI 整理后生成"></textarea></label></div><div class="modal-actions"><button class="quiet-btn" data-action="ai-organize-event">AI 整理草稿</button><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="save-record">保存事件</button></div>`);
}

function eventDetailModal(profile, event) {
  const stageName = profile.milestones[event.stage] || "未归类";
  openModal(`<div class="modal-header"><h2>${escapeHtml(event.title)}</h2><button class="quiet-btn" data-action="close">关闭</button></div><div class="event-detail-meta">${escapeHtml(event.date)} · ${escapeHtml(stageName)}</div><section class="event-detail-block"><p>事件简述</p><div>${escapeHtml(event.summary)}</div></section><section class="event-detail-block"><p>完整记录</p><div>${escapeHtml(event.detail)}</div></section>${event.rawText ? `<details class="raw-record"><summary>查看原始口述</summary><p>${escapeHtml(event.rawText)}</p></details>` : ""}<div class="modal-actions"><button class="quiet-btn" data-action="close">关闭</button></div>`);
}

async function organizeEventDraft(profile) {
  const rawText = document.querySelector("#record-detail")?.value.trim();
  if (!rawText) return;
  if (!store.api.baseUrl || !store.api.model) { settingsModal(); return; }
  const button = document.querySelector('[data-action="ai-organize-event"]');
  if (button) { button.textContent = "整理中…"; button.disabled = true; }
  try {
    const response = await fetch(chatEndpoint(store.api.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(store.api.apiKey ? { Authorization: `Bearer ${store.api.apiKey}` } : {}) },
      body: JSON.stringify({ model: store.api.model, temperature: 0.2, messages: [
        { role: "system", content: "你是关系档案整理助手。只整理用户提供的事实，不补充猜测或评价。严格输出 JSON：{\"title\":\"12字内标题\",\"summary\":\"60字内简述\",\"detail\":\"按时间和事实写成完整记录\"}。" },
        { role: "user", content: `人物：${profile.name}\n阶段：${profile.milestones[Number(document.querySelector("#record-stage").value)]}\n原始口述：${rawText}` },
      ] }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await parseApiError(response)}`);
    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim();
    const result = parseModelJson(text);
    document.querySelector("#record-title").value = result.title || "新事件记录";
    document.querySelector("#record-summary").value = result.summary || rawText.slice(0, 60);
    document.querySelector("#record-detail").value = result.detail || rawText;
  } catch (error) {
    alert(`AI 整理失败：${error instanceof Error ? error.message : "请检查接口设置。"}`);
  } finally {
    if (button) { button.textContent = "AI 整理草稿"; button.disabled = false; }
  }
}

async function sendArchiveChat(profile, mode = "chat") {
  const input = document.querySelector("#archive-chat-input");
  const spokenText = input?.value.trim() || "";
  const filesText = pendingArchiveFiles.map((file) => `文件：${file.name}\n${file.text}`).join("\n\n");
  if (!spokenText && !filesText) return;
  if (!store.api.baseUrl || !store.api.model) { settingsModal(); return; }

  const attachments = pendingArchiveFiles.map((file) => file.name);
  const userText = [spokenText, filesText].filter(Boolean).join("\n\n");
  const contextMode = document.querySelector("#context-mode")?.value || "smart";
  profile.archiveChat.push({ role: "user", text: spokenText || "提交了资料文件", attachments, time: Date.now() });
  attachments.forEach((fileName) => { if (!profile.materials.includes(fileName)) profile.materials.push(fileName); });
  if (input) input.value = "";
  pendingArchiveFiles = [];
  // 先落盘、先刷新界面，再发请求。即使 AI 请求中断，用户刚提交的内容也不会丢。
  save();
  void writeArchiveChatMarkdown(profile);
  render();
  const button = document.querySelector(mode === "organize" ? '[data-action="organize-archive-chat"]' : '[data-action="send-archive-chat"]');
  if (button) { button.textContent = mode === "organize" ? "整理中…" : "思考中…"; button.disabled = true; }

  try {
    const systemPrompt = mode === "organize"
      ? "你是关系档案整理助手。只整理用户提供的事实，不补充猜测。严格输出 JSON：{\"reply\":\"给用户的简短说明\",\"event\":{\"title\":\"12字内标题\",\"summary\":\"80字内简述\",\"detail\":\"完整的时间线式故事稿\",\"stage\":0}}。stage 必须是给定阶段编号之一。"
      : `${store.api.persona} 你正在和用户直接聊天。基于人物档案、已记录事件与对话上下文回答；不要把普通提问自动改写成事件。`;
    const history = mode === "chat" ? profile.archiveChat.slice(-8, -1).map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.text })) : [];
    const requestText = mode === "organize"
      ? `人物：${profile.name}\n可用阶段：${profile.milestones.map((name, index) => `${index}:${name}`).join("；")}\n当前档案梗概：${profile.summary}\n\n本次资料：\n${userText.slice(0, 50000)}`
      : `${contextMode === "none" ? "" : `【当前档案上下文】\n${buildFullContext(profile, contextMode)}\n\n`}【我的问题或资料】\n${userText.slice(0, 50000)}`;
    const response = await fetch(chatEndpoint(store.api.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(store.api.apiKey ? { Authorization: `Bearer ${store.api.apiKey}` } : {}) },
      body: JSON.stringify({ model: store.api.model, temperature: 0.2, messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: requestText }] }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await parseApiError(response)}`);
    const responseText = (await response.json()).choices?.[0]?.message?.content?.trim?.() || "模型没有返回内容。";

    if (mode === "chat") {
      profile.archiveChat.push({ role: "assistant", text: responseText, attachments: [], time: Date.now() });
      save();
      void writeArchiveChatMarkdown(profile);
      render();
      return;
    }

    const result = parseModelJson(responseText);
    profile.archiveChat.push({ role: "assistant", text: result.reply || "已整理为档案事件。", attachments: [], time: Date.now() });
    if (result.event?.detail) {
      const event = { id: `${profile.id}-event-${Date.now()}`, date: new Date().toISOString().slice(0, 10), title: result.event.title || "AI 整理事件", summary: result.event.summary || result.event.detail.slice(0, 80), detail: result.event.detail, rawText: userText, stage: Math.min(Math.max(Number(result.event.stage) || profile.focusedMilestone, 0), profile.milestones.length - 1) };
      profile.events.unshift(event);
      void writeEventMarkdown(profile, event);
    }
    save();
    void writeArchiveChatMarkdown(profile);
    render();
    void runAnalysis();
  } catch (error) {
    profile.archiveChat.push({ role: "assistant", text: `请求失败：${error instanceof Error ? error.message : "请检查接口设置。"}`, attachments: [], time: Date.now() });
    save();
    void writeArchiveChatMarkdown(profile);
    render();
  }
}


async function storeSourceOnly(profile) {
  const { input, sourceText, attachments } = collectWorkbenchInput();
  if (!sourceText.trim()) { alert("请先粘贴资料，或选择 .md / .txt / .json 文件。"); return; }
  const record = saveRawSource(profile, sourceText, attachments, "手动保存的原文");
  void writeRawSourceMarkdown(profile, record);
  profile.archiveChat.push({ role: "assistant", text: `已保存原文：${record.name}。本次没有调用 AI，也没有改动故事线、画像、关系维度和分析。`, attachments, time: Date.now() });
  clearWorkbenchInput(input);
  save();
  render();
}

function applySmartProfileResult(profile, result, sourceRecords = []) {
  if (result.summary) profile.summary = String(result.summary).slice(0, 1600);
  if (Array.isArray(result.tags)) profile.tags = result.tags.slice(0, 12).map((x) => String(x).slice(0, 18));
  if (result.title) profile.title = String(result.title).slice(0, 80);
  if (result.persona) {
    profile.persona = {
      communication: String(result.persona.communication || profile.persona.communication || "待补充").slice(0, 500),
      interests: Array.isArray(result.persona.interests) ? result.persona.interests.slice(0, 12).map((x) => String(x).slice(0, 20)) : profile.persona.interests,
      boundaries: String(result.persona.boundaries || profile.persona.boundaries || "待补充").slice(0, 600),
      confidence: String(result.persona.confidence || "AI 根据新增资料更新").slice(0, 180),
    };
  }
  if (Array.isArray(result.milestones) && result.milestones.length) {
    profile.milestoneDetails = result.milestones.slice(0, 12).map((item, index) => typeof item === "string"
      ? { name: item.slice(0, 24) || `节点 ${index + 1}`, description: "待补充这个阶段的事实与变化。" }
      : { name: String(item.name || `节点 ${index + 1}`).slice(0, 24), description: String(item.description || "待补充这个阶段的事实与变化。").slice(0, 500) });
    profile.milestones = profile.milestoneDetails.map((item) => item.name);
  }
  if (Array.isArray(result.stageMetrics)) profile.stageMetrics = coerceStageMetricsArray(profile, result.stageMetrics);
  if (result.metrics) profile.metrics = normalizeMetricObject(profile, result.metrics, profile.current || 0);
  normalizeStageMetrics(profile);
  if (Number.isFinite(Number(result.current))) {
    profile.current = Math.min(Math.max(Number(result.current), 0), profile.milestones.length - 1);
    profile.stage = profile.milestones[profile.current] || profile.stage;
    profile.focusedMilestone = profile.current;
    profile.metrics = profile.stageMetrics[profile.current] || profile.metrics;
  }
  if (Array.isArray(result.events) && result.events.length) {
    const existingKey = new Set(profile.events.map((event) => `${event.date}|${event.title}|${event.summary}`));
    const nextEvents = result.events.slice(0, 60).map((item, index) => {
      const stage = Math.min(Math.max(Number(item.stage) || profile.current || 0, 0), profile.milestones.length - 1);
      return {
        id: `${profile.id}-smart-${Date.now()}-${index}`,
        date: String(item.date || "时间待补").slice(0, 32),
        title: String(item.title || "更新档案事件").slice(0, 80),
        summary: String(item.summary || item.detail || "待补充简述。").slice(0, 360),
        detail: String(item.detail || item.summary || "待补充完整记录。").slice(0, 8000),
        rawText: String(item.rawText || "").slice(0, 8000),
        stage,
        source: "更新档案",
      };
    }).filter((event) => !existingKey.has(`${event.date}|${event.title}|${event.summary}`));
    profile.events = [...nextEvents, ...profile.events];
    sourceRecords.forEach((record) => { record.linkedEventIds = nextEvents.map((event) => event.id); record.processedAt = Date.now(); });
  } else {
    sourceRecords.forEach((record) => { record.processedAt = Date.now(); });
  }
  normalizeStageMetrics(profile);
  if (result.direction) profile.direction = String(result.direction).slice(0, 500);
  if (result.analysis) profile.analysis = String(result.analysis).slice(0, 1000);
  if (result.advice) profile.aiAdvice = String(result.advice).slice(0, 1000);
  if (result.contextSummary) profile.contextSummary = String(result.contextSummary).slice(0, 1600);
  profile.lastSmartOrganizedAt = Date.now();
}

async function smartOrganizeArchive(profile) {
  const { input, sourceText, attachments } = collectWorkbenchInput();
  if (sourceText.trim()) {
    const directRecord = saveRawSource(profile, sourceText, attachments, "本次新增资料");
    void writeRawSourceMarkdown(profile, directRecord);
  }
  const newSources = (profile.sourceRecords || []).filter((item) => !item.processedAt || item.createdAt > (profile.lastSmartOrganizedAt || 0)).slice(0, 20);
  if (!newSources.length) { alert("没有发现上次更新后的新增资料。可以先点“保存原文”，或直接在输入框粘贴新资料。"); return; }
  if (requiresLocalOnlyHandling(newSources.map((item) => item.text).join("\n\n"))) {
    alert("这份资料包含不适合发送给远程 AI 的敏感内容。已保存在本地，请改写为克制的事实描述后再更新档案。");
    return;
  }
  if (!store.api.baseUrl || !store.api.model) { settingsModal(); return; }
  const button = document.querySelector('[data-action="smart-organize"]');
  if (button) { button.textContent = "更新档案中…"; button.disabled = true; }
  try {
    const response = await fetch(chatEndpoint(store.api.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(store.api.apiKey ? { Authorization: `Bearer ${store.api.apiKey}` } : {}) },
      body: JSON.stringify({ model: store.api.model, temperature: 0.15, messages: [
        { role: "system", content: `你是本地关系档案的智能整理系统。用户可能记录恋爱、亲情、职场、朋友或其他人际关系。只基于资料做档案更新，不编造事实，不把过去意愿视作当前意愿，不鼓励操控、越界、骚扰或职场风险行为。严格输出 JSON：${profileJsonSchemaPrompt(profile)}。${metricSchemaInstruction(profile)}` },
        { role: "user", content: `【已有完整档案】\n${buildFullContext(profile, "smart")}\n\n【上次整理后的新增原始资料】\n${newSources.map((item, index) => `### 资料 ${index + 1}：${item.name}\n${item.text}`).join("\n\n").slice(0, 60000)}` },
      ] }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await parseApiError(response)}`);
    const raw = (await response.json()).choices?.[0]?.message?.content?.trim?.() || "";
    const result = parseModelJson(raw);
    applySmartProfileResult(profile, result, newSources);
    profile.archiveChat.push({ role: "assistant", text: `更新档案完成：已处理 ${newSources.length} 条原始资料。`, attachments: [], time: Date.now() });
    clearWorkbenchInput(input);
    save();
    render();
  } catch (error) {
    alert(`更新档案失败：${error instanceof Error ? error.message : "请检查接口设置。"}`);
  } finally {
    if (button) { button.textContent = "更新档案"; button.disabled = false; }
  }
}


function requiresLocalOnlyHandling(text) {
  const hasPossibleMinorAge = /(?:\b(?:[0-9]|1[0-7])\s*岁|未成年|初中生|高中生)/.test(text);
  const hasExplicitSensitiveDetail = /(发生关系|性行为|裸体|裸照|SM|强迫|性虐|性交)/i.test(text);
  return hasPossibleMinorAge && hasExplicitSensitiveDetail;
}

function dateSortValue(value, fallback) {
  const match = String(value || "").match(/(\d{4})(?:[-./年](\d{1,2}))?(?:[-./月](\d{1,2}))?/);
  if (!match) return 9_000_000_000_000 + fallback;
  return Date.UTC(Number(match[1]), Math.max(0, Number(match[2] || 1) - 1), Number(match[3] || 1));
}

function normalizeTimelineDraft(profile, result) {
  const suppliedMilestones = Array.isArray(result.milestones) ? result.milestones : [];
  const milestones = suppliedMilestones.slice(0, 10).map((item, index) => {
    if (typeof item === "string") return { name: item.slice(0, 24) || `节点 ${index + 1}`, description: "待补充这个阶段的事实与变化。" };
    return { name: String(item?.name || `节点 ${index + 1}`).slice(0, 24), description: String(item?.description || "待补充这个阶段的事实与变化。").slice(0, 360) };
  });
  const finalMilestones = milestones.length ? milestones : profile.milestoneDetails;
  const events = (Array.isArray(result.events) ? result.events : []).slice(0, 80).map((item, index) => {
    const requestedStage = Number(item?.stage);
    const stage = Number.isFinite(requestedStage) ? Math.min(Math.max(requestedStage, 0), finalMilestones.length - 1) : 0;
    return {
      id: `${profile.id}-timeline-${Date.now()}-${index}`,
      date: String(item?.date || "时间待补").slice(0, 32),
      title: String(item?.title || "未命名事件").slice(0, 80),
      summary: String(item?.summary || "待补充事件简述。").slice(0, 360),
      detail: String(item?.detail || item?.summary || "待补充完整记录。").slice(0, 8000),
      rawText: "",
      stage,
      source: "完整故事线整理",
      order: index,
    };
  }).sort((a, b) => dateSortValue(a.date, a.order) - dateSortValue(b.date, b.order));
  return {
    summary: String(result.summary || profile.summary).slice(0, 1600),
    title: String(result.title || profile.title || "").slice(0, 80),
    tags: Array.isArray(result.tags) ? result.tags.slice(0, 12).map((x) => String(x).slice(0, 18)) : profile.tags,
    persona: result.persona || profile.persona,
    metrics: result.metrics ? normalizeMetricObject(profile, result.metrics, Number(result.current) || profile.current || 0) : profile.metrics,
    stageMetrics: Array.isArray(result.stageMetrics) ? coerceStageMetricsArray(profile, result.stageMetrics) : null,
    direction: String(result.direction || profile.direction || "").slice(0, 500),
    analysis: String(result.analysis || profile.analysis || "").slice(0, 1000),
    advice: String(result.advice || profile.aiAdvice || "").slice(0, 1000),
    contextSummary: String(result.contextSummary || profile.contextSummary || "").slice(0, 1600),
    milestones: finalMilestones,
    current: Math.min(Math.max(Number(result.current) || 0, 0), finalMilestones.length - 1),
    events,
  };
}

function timelinePreviewModal(profile, draft) {
  const stages = draft.milestones.map((item, index) => `<li><b>${index + 1}. ${escapeHtml(item.name)}</b><span>${escapeHtml(item.description)}</span></li>`).join("");
  const events = draft.events.map((event) => `<li><b>${escapeHtml(event.date)} · ${escapeHtml(event.title)}</b><span>${escapeHtml(event.summary)} · 节点：${escapeHtml(draft.milestones[event.stage]?.name || "未归类")}</span></li>`).join("");
  openModal(`<div class="modal-header"><h2>完整故事线预览</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">AI 已按时间排序并为每条事件分配关系节点。原始资料会留在本地档案中；请确认后写入。</p><section class="timeline-preview"><p>建议的关系节点</p><ol>${stages}</ol></section><section class="timeline-preview"><p>将写入 ${draft.events.length} 条时间线事件</p><ol>${events || "<li><span>没有识别出可写入的事件。</span></li>"}</ol></section><div class="modal-actions"><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="apply-timeline-rebuild">确认初建/重建故事线</button></div>`);
}

async function splitStoryTimeline(profile) {
  const input = document.querySelector("#archive-chat-input");
  const spokenText = input?.value.trim() || "";
  const filesText = pendingArchiveFiles.map((file) => `文件：${file.name}\n${file.text}`).join("\n\n");
  const sourceText = [spokenText, filesText].filter(Boolean).join("\n\n");
  if (!sourceText) return;
  if (requiresLocalOnlyHandling(sourceText)) {
    alert("这份资料已保留在本地档案中，但其中的敏感原文不能发送给 AI 整理。请改用不含该类细节的版本后再拆分故事线。");
    return;
  }
  if (!store.api.baseUrl || !store.api.model) { settingsModal(); return; }
  const button = document.querySelector('[data-action="split-timeline"]');
  if (button) { button.textContent = "重建中…"; button.disabled = true; }
  try {
    const response = await fetch(chatEndpoint(store.api.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(store.api.apiKey ? { Authorization: `Bearer ${store.api.apiKey}` } : {}) },
      body: JSON.stringify({ model: store.api.model, temperature: 0.1, messages: [
        { role: "system", content: `你是本地关系档案的时间线整理助手。仅整理用户提供、可核验的关系事实；不补充猜测，不把过去视为当前意愿。涉及亲密关系时仅使用克制、非露骨的档案语言。严格输出 JSON：${profileJsonSchemaPrompt(profile)}。事件必须按时间从早到晚排列，stage 对应 milestones 的下标。${metricSchemaInstruction(profile)}` },
        { role: "user", content: `人物：${profile.name}\n已有档案梗概：${profile.summary}\n\n请把以下完整故事拆成时间线：\n${sourceText.slice(0, 50000)}` },
      ] }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await parseApiError(response)}`);
    const text = (await response.json()).choices?.[0]?.message?.content?.trim?.() || "";
    const draft = normalizeTimelineDraft(profile, parseModelJson(text));
    if (!draft.events.length) throw new Error("没有识别出可写入的事件，请补充明确的时间或发生经过。");
    timelineDraft = { profileId: profile.id, draft, sourceText, attachments: pendingArchiveFiles.map((file) => file.name) };
    timelinePreviewModal(profile, draft);
  } catch (error) {
    alert(`完整故事线整理失败：${error instanceof Error ? error.message : "请检查接口设置。"}`);
  } finally {
    if (button) { button.textContent = "初建/重建故事线"; button.disabled = false; }
  }
}

function applyTimelineDraft(profile, mode) {
  if (!timelineDraft || timelineDraft.profileId !== profile.id) return;
  const { draft, sourceText, attachments } = timelineDraft;
  profile.milestoneDetails = draft.milestones;
  profile.milestones = draft.milestones.map((item) => item.name);
  profile.current = draft.current;
  profile.focusedMilestone = draft.current;
  profile.stage = profile.milestones[draft.current] || profile.stage;
  profile.summary = draft.summary || profile.summary;
  if (draft.title) profile.title = draft.title;
  if (Array.isArray(draft.tags)) profile.tags = draft.tags;
  if (draft.persona) profile.persona = { ...profile.persona, ...draft.persona };
  if (draft.metrics) profile.metrics = normalizeMetricObject(profile, draft.metrics, draft.current || profile.current || 0);
  if (Array.isArray(draft.stageMetrics)) profile.stageMetrics = coerceStageMetricsArray(profile, draft.stageMetrics);
  normalizeStageMetrics(profile);
  if (draft.direction) profile.direction = draft.direction;
  if (draft.analysis) profile.analysis = draft.analysis;
  if (draft.advice) profile.aiAdvice = draft.advice;
  if (draft.contextSummary) profile.contextSummary = draft.contextSummary;
  profile.events = mode === "rebuild" ? draft.events : [...profile.events, ...draft.events].sort((a, b) => dateSortValue(a.date, 0) - dateSortValue(b.date, 0));
  normalizeStageMetrics(profile);
  profile.sourceRecords.unshift({ id: `${profile.id}-source-${Date.now()}`, name: attachments.length ? attachments.join("、") : "完整故事线原文", text: sourceText, createdAt: Date.now(), processedAt: Date.now(), linkedEventIds: draft.events.map((event) => event.id) });
  attachments.forEach((name) => { if (!profile.materials.includes(name)) profile.materials.push(name); });
  profile.archiveChat.push({ role: "assistant", text: `已${mode === "rebuild" ? "重建" : "追加"} ${draft.events.length} 条时间线事件，并更新 ${draft.milestones.length} 个关系节点。`, attachments: [], time: Date.now() });
  pendingArchiveFiles = [];
  timelineDraft = null;
  save();
  closeModal();
  void runAnalysis();
}

function stagesModal(profile) {
  const rows = profile.milestoneDetails.map((detail, index) => `<div class="stage-editor-row"><span>${index + 1}</span><input data-stage-name="${index}" value="${escapeHtml(detail.name)}"><textarea data-stage-description="${index}" placeholder="这个阶段发生了什么、需要记住什么">${escapeHtml(detail.description)}</textarea></div>`).join("");
  openModal(`<div class="modal-header"><h2>关系节点设置</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">节点名称、阶段说明和事件归属都由你自己决定。点击主页节点可查看对应阶段档案。</p><div id="stage-editor-list" class="stage-editor-list">${rows}</div><div class="modal-actions"><button class="quiet-btn" data-action="add-stage">新增节点</button><button class="primary-btn" data-action="save-stages">保存节点</button></div>`);
}

function photosModal(profile) {
  const photos = profile.photos.length
    ? profile.photos.map((photo, index) => `<button class="photo-tile ${index === profile.coverPhotoIndex ? "cover" : ""}" data-cover-photo="${index}" style="background-image:url('${photo}')"><span>${index === profile.coverPhotoIndex ? "当前头像" : "设为头像"}</span></button>`).join("")
    : `<div class="photo-empty">还没有照片。上传后的照片只存放在这台设备的本地档案中。</div>`;
  openModal(`<div class="modal-header"><h2>${escapeHtml(profile.name)} 的本地相册</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">点击任意照片设为档案头像。支持一次选择多张；上传时会自动压缩为适合本地档案保存的版本，不会上传到 AI 接口。</p><div class="photo-grid">${photos}</div><div class="modal-actions"><button class="quiet-btn" data-action="upload-photos">上传照片</button><button class="primary-btn" data-action="close">完成</button></div>`);
}

function newProfileModal() {
  openModal(`<div class="modal-header"><h2>新建人物档案</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">先填姓名或代号即可创建，后续资料、照片、关系节点都可以再补。</p><div class="field-grid"><label class="field">姓名或代号<input id="new-name" placeholder="例如：小林" autofocus></label><label class="field">当前阶段<input id="new-stage" value="初识"></label><label class="field full">一句故事梗概<textarea id="new-summary" placeholder="你们认识的背景、现在的状态。"></textarea></label></div><p id="new-profile-error" class="form-error" aria-live="polite"></p><div class="modal-actions"><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="create-profile">创建档案</button></div>`);
}

function themePaletteCards(selectedKey = "heart") {
  return Object.entries(themePalettes).map(([key, item]) => {
    const checked = key === selectedKey ? "checked" : "";
    return `<label class="theme-choice" style="--swatch-a:${item.bgA};--swatch-b:${item.bgB};--swatch-accent:${item.accent};--swatch-gold:${item.gold}"><input type="radio" name="theme-palette-choice" data-theme-choice value="${key}" ${checked}><span class="theme-swatch"><i></i><b></b></span><strong>${escapeHtml(item.label)}</strong></label>`;
  }).join("");
}

function settingsModal() {
  const appCfg = appSettings();
  const presetOptions = Object.entries(appPresets).map(([key, item]) => `<option value="${key}" ${appCfg.activePreset === key ? "selected" : ""}>${escapeHtml(item.modeLabel)}</option>`).join("");
  const paletteCards = themePaletteCards(appCfg.themePalette);
  const apiPresets = [
    { name: "DeepSeek 官方｜V4 Flash", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-flash" },
    { name: "DeepSeek 官方｜V4 Pro", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-pro" },
    { name: "DeepSeek 兼容旧名｜Chat", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    { name: "DeepSeek 兼容旧名｜Reasoner", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-reasoner" },
    { name: "OpenAI｜GPT-5.5", baseUrl: "https://api.openai.com/v1", model: "gpt-5.5" },
    { name: "OpenAI｜GPT-5.4", baseUrl: "https://api.openai.com/v1", model: "gpt-5.4" },
    { name: "OpenAI｜GPT-5.4 mini", baseUrl: "https://api.openai.com/v1", model: "gpt-5.4-mini" },
    { name: "OpenAI｜GPT-5.4 nano", baseUrl: "https://api.openai.com/v1", model: "gpt-5.4-nano" },
    { name: "OpenAI｜GPT-4.1", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1" },
    { name: "OpenAI｜GPT-4.1 mini", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
    { name: "Google Gemini｜3.5 Flash", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.5-flash" },
    { name: "Google Gemini｜3.1 Pro", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.1-pro" },
    { name: "Google Gemini｜3.1 Flash", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.1-flash" },
    { name: "Google Gemini｜2.5 Pro", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-pro" },
    { name: "Google Gemini｜2.5 Flash", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
    { name: "xAI Grok｜Grok 4.3", baseUrl: "https://api.x.ai/v1", model: "grok-4.3" },
    { name: "xAI Grok｜Grok Build 0.1", baseUrl: "https://api.x.ai/v1", model: "grok-build-0.1" },
    { name: "xAI Grok｜Grok 4", baseUrl: "https://api.x.ai/v1", model: "grok-4" },
    { name: "xAI Grok｜Grok 3 mini", baseUrl: "https://api.x.ai/v1", model: "grok-3-mini" },
    { name: "xAI Grok｜Grok 3 mini fast", baseUrl: "https://api.x.ai/v1", model: "grok-3-mini-fast" },
    { name: "硅基流动 CN｜DeepSeek V3", baseUrl: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3" },
    { name: "硅基流动 CN｜DeepSeek R1 Pro", baseUrl: "https://api.siliconflow.cn/v1", model: "Pro/deepseek-ai/DeepSeek-R1" },
    { name: "硅基流动 CN｜Qwen3 235B", baseUrl: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen3-235B-A22B" },
    { name: "硅基流动 CN｜Qwen3 32B", baseUrl: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen3-32B" },
    { name: "LM Studio 本地", baseUrl: "http://127.0.0.1:1234/v1", model: "local-model" },
    { name: "Ollama 本地｜Qwen", baseUrl: "http://127.0.0.1:11434/v1", model: "qwen2.5" },
    { name: "Ollama 本地｜Llama", baseUrl: "http://127.0.0.1:11434/v1", model: "llama3.1" },
  ];
  const modelOptions = [...new Set(apiPresets.map((item) => item.model).concat(["deepseek-v4-pro", "deepseek-v4-flash", "deepseek-chat", "deepseek-reasoner", "gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gemini-3.5-flash", "gemini-3.1-pro", "gemini-3.1-flash", "gemini-3-flash", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "grok-4.3", "grok-4.3-latest", "grok-build-0.1", "grok-4", "grok-3", "grok-3-mini", "grok-3-mini-fast", "deepseek-ai/DeepSeek-V3", "Pro/deepseek-ai/DeepSeek-R1", "Pro/deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-235B-A22B", "Qwen/Qwen3-32B", "Qwen/QwQ-32B", "local-model", "qwen2.5", "llama3.1"]))];
  const localStatusText = archiveFolderHandle
    ? `已关联：${archiveFolderHandle.name}${localDataWritePaused ? " · 自动保存已暂停，旧数据不会被覆盖" : localFileStatus.lastSavedAt ? ` · 上次保存：${new Date(localFileStatus.lastSavedAt).toLocaleString("zh-CN")}` : " · 等待首次保存"}${localFileStatus.lastError ? ` · 提醒：${localFileStatus.lastError}` : ""}`
    : `尚未关联。本机浏览器会自动缓存，但换浏览器会看不到；关联文件夹后会生成 ${LOCAL_DATA_FILE}。`;
  openModal(`<div class="modal-header"><h2>关系模式、配色与 AI 设置</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">这个软件不限定为恋爱记录。你可以用它管理朋友、亲情、职场协作、暧昧关系，也可以记录和宠物之间的日常互动；数据默认先存在本机浏览器，关联本地数据文件夹后，会同时写入真实本地 JSON 文件。使用远程 API 时，点击 AI 功能才会发送相关文字。</p><div class="field-grid"><label class="field">关系模式<select id="app-preset">${presetOptions}</select></label><label class="field">界面名称<input id="app-title" value="${escapeHtml(appCfg.title)}" placeholder="例如：人际关系管理器"></label><label class="field">副标题<input id="app-subtitle" value="${escapeHtml(appCfg.subtitle)}"></label><label class="field">左上角图标字<input id="app-mark" value="${escapeHtml(appCfg.mark)}" maxlength="2"></label></div><div class="theme-setting-block"><div class="setting-block-title"><p class="section-caption">主题配色</p><span>点击色卡选择，保存后整体界面会按该主题切换。</span></div><div class="theme-palette-grid">${paletteCards}</div></div><hr class="soft-line"><div class="field-grid"><label class="field full">常见接口预设<select id="api-preset">${apiPresets.map((item, index) => `<option value="${index}">${escapeHtml(item.name)}｜${escapeHtml(item.model)}</option>`).join("")}</select></label><label class="field full">OpenAI 兼容 API 地址<input id="api-url" value="${escapeHtml(store.api.baseUrl)}" placeholder="https://api.deepseek.com/v1"></label><label class="field full">模型名称<input id="api-model" value="${escapeHtml(store.api.model)}" list="model-list"></label><datalist id="model-list">${modelOptions.map((model) => `<option value="${escapeHtml(model)}"></option>`).join("")}</datalist><label class="field full">API Key<input id="api-key" type="password" value="${escapeHtml(store.api.apiKey)}" placeholder="仅保存于当前设备"></label><label class="field full">分析口吻与规则<textarea id="api-persona">${escapeHtml(store.api.persona)}</textarea></label></div><hr class="soft-line"><div class="data-management-panel"><h3>数据管理</h3><p class="modal-note">保存规则：浏览器内数据会即时缓存；已关联文件夹后，每次新增人物、事件、聊天或设置变更，会延迟约 0.5 秒自动写入完整 JSON。若关联的文件夹已有旧数据，点击“确定”会先把旧数据和当前浏览器新增档案合并，再保存合并结果；点击“取消”会放弃本次关联，不读取也不写入。</p><div class="local-data-status">${escapeHtml(localStatusText)}</div><div class="modal-actions data-actions"><button class="quiet-btn" data-action="link-folder">关联/更换本地数据文件夹</button><button class="quiet-btn" data-action="save-local-data">立即保存到本地文件</button><button class="quiet-btn" data-action="restore-local-data">从本地数据文件恢复</button><button class="quiet-btn" data-action="export-readable-archive">导出可读档案</button><button class="quiet-btn" data-action="export">导出当前数据</button><button class="quiet-btn" data-action="backup-import">导入同步包</button><button class="quiet-btn" data-action="create-empty-space">新建空白数据空间</button><button class="danger-btn" data-action="clear-current-space">清空当前数据空间</button></div></div><p id="api-test-result" class="api-test-result" aria-live="polite">测试连接只发送一条“连接测试”文本，不会发送任何人物档案。</p><div class="modal-actions"><button class="quiet-btn" data-action="apply-api-preset">套用接口预设</button><button class="quiet-btn" data-action="test-api">测试连接</button><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="save-settings">保存设置</button></div>`);
  window.__apiPresets = apiPresets;
  window.__themePalettes = themePalettes;
}

async function testApiFromSettings() {
  const result = document.querySelector("#api-test-result");
  const button = document.querySelector('[data-action="test-api"]');
  const baseUrl = document.querySelector("#api-url")?.value.trim();
  const model = document.querySelector("#api-model")?.value.trim();
  const apiKey = document.querySelector("#api-key")?.value;
  if (!baseUrl || !model) {
    result.textContent = "请先填写 API 地址和模型名称。";
    return;
  }
  result.textContent = "正在测试连接…";
  if (button) button.disabled = true;
  try {
    const response = await fetch(chatEndpoint(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({ model, max_tokens: 16, messages: [{ role: "user", content: "连接测试：请仅回复“连接成功”。" }] }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await parseApiError(response)}`);
    const text = (await response.json()).choices?.[0]?.message?.content?.trim?.() || "接口已响应。";
    result.textContent = `连接成功：${text.slice(0, 80)}`;
  } catch (error) {
    result.textContent = `连接失败：${error instanceof Error ? error.message : "请检查地址、模型名和 Key。"}`;
  } finally {
    if (button) button.disabled = false;
  }
}

function meModal() {
  openModal(`<div class="modal-header"><h2>我的档案库</h2><button class="quiet-btn" data-action="close">关闭</button></div><p class="modal-note">这些内容会成为 AI 理解你的长期背景。仅在你主动发起 AI 整理或关系分析时，相关部分才会发送到你配置的模型。</p><div class="field-grid"><label class="field full">基本情况<textarea id="me-about">${escapeHtml(store.me.about)}</textarea></label><label class="field full">工作与创作<textarea id="me-work">${escapeHtml(store.me.workAndCreation)}</textarea></label><label class="field full">生活、健康与精力情况<textarea id="me-life">${escapeHtml(store.me.lifeAndHealth)}</textarea></label><label class="field full">关系经历与回顾<textarea id="me-history">${escapeHtml(store.me.relationshipHistory)}</textarea></label><label class="field full">思维习惯与容易卡住的地方<textarea id="me-patterns">${escapeHtml(store.me.patterns)}</textarea></label><label class="field full">当前目标与困扰<textarea id="me-goals">${escapeHtml(store.me.goals)}</textarea></label><label class="field full">边界与提醒<textarea id="me-boundaries">${escapeHtml(store.me.boundaries)}</textarea></label></div><div class="modal-actions"><button class="quiet-btn" data-action="close">取消</button><button class="primary-btn" data-action="save-me">保存档案</button></div>`);
}

async function runAnalysis() {
  const profile = selected();
  if (!store.api.baseUrl || !store.api.model) {
    settingsModal();
    return;
  }
  if (/deepseek\.com/i.test(store.api.baseUrl) && !store.api.apiKey) {
    profile.analysis = "等待配置 DeepSeek API Key；填好后，新增资料会自动刷新分析与建议。";
    save();
    render();
    return;
  }

  const endpoint = chatEndpoint(store.api.baseUrl);
  const system = `${store.api.persona} 只基于资料做辅助整理，明确区分事实、合理推测与未知。不得鼓励操控、越界、骚扰、把过往亲密视为当前同意，或把他人脆弱当成推进关系的机会。`;
  const linkedMaterials = await readLinkedMaterials(profile);
  const user = `请严格返回 JSON：{"analysis":"当前关系判断，150字内","advice":"接下来建议，120字内，尊重边界、无施压","contextSummary":"本轮分析后的上下文摘要"}。\n\n当前档案上下文：\n${buildFullContext(profile, "full")}\n\n已关联 Markdown 原文：\n${linkedMaterials || "无"}`;
  profile.analysis = "正在请求已配置的 AI 分析…";
  save();
  render();
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(store.api.apiKey ? { Authorization: `Bearer ${store.api.apiKey}` } : {}) },
    body: JSON.stringify({ model: store.api.model, temperature: 0.3, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await parseApiError(response)}`);
      const payload = await response.json();
      const raw = payload?.choices?.[0]?.message?.content?.trim?.() || "";
      try {
        const result = parseModelJson(raw);
        profile.analysis = result.analysis || raw;
        profile.aiAdvice = result.advice || profile.aiAdvice;
        if (result.metrics) profile.metrics = normalizeMetricObject(profile, result.metrics, profile.current || 0);
        if (Array.isArray(result.stageMetrics)) profile.stageMetrics = coerceStageMetricsArray(profile, result.stageMetrics);
        normalizeStageMetrics(profile);
        if (result.contextSummary) profile.contextSummary = result.contextSummary;
      } catch {
        profile.analysis = raw || "模型没有返回可用内容。";
      }
      save(); render();
    })
    .catch((error) => { profile.analysis = `分析失败：${error instanceof Error ? error.message : "请检查接口设置。"}`; save(); render(); });
}

function bindEvents() {
  // Node and timeline handlers run outside the action-button callback, so keep
  // the currently rendered profile available for those direct interactions.
  const profile = selected();
  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => { store.selected = button.dataset.profile; save(); render(); }));
  document.querySelectorAll("[data-account-id]").forEach((button) => button.addEventListener("click", () => {
    const account = accountBook.accounts.find((item) => item.id === button.dataset.accountId);
    if (!account) return;
    if (account.pinHash) unlockAccountModal(account);
    else enterAccount(account);
  }));
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    store.tab = tab;
    save();
    if (tab === "设置") {
      settingsModal();
      return;
    }
    render();
    const targetId = { "概览": "archive-overview", "记录": "archive-records", "分析": "archive-ai" }[tab];
    requestAnimationFrame(() => document.querySelector(`#${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }));
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.action; const profile = selected();
    if (action === "close") closeModal();
    if (action === "accounts") accountModal();
    if (action === "new-account") newAccountModal();
    if (action === "create-account") void createAccount();
    if (action === "set-account-code") accountCodeModal();
    if (action === "save-account-code") void saveAccountCode();
    if (action === "unlock-account") void unlockCurrentAccount();
    if (action === "edit") editModal(profile);
    if (action === "record") recordModal(profile);
    if (action === "photos") photosModal(profile);
    if (action === "me-profile-card") meProfileCardModal();
    if (action === "upload-me-avatar") document.querySelector("#me-avatar-input")?.click();
    if (action === "reanalyze-me-portrait") void reanalyzeMePortrait();
    if (action === "edit-stages") stagesModal(profile);
    if (action === "new") newProfileModal();
    if (action === "settings") settingsModal();
    if (action === "test-api") void testApiFromSettings();
    if (action === "me") meModal();
    if (action === "trash") trashModal();
    if (action === "trash-profile") moveProfileToTrash(profile);
    if (action === "analyze") runAnalysis();
    if (action === "source") document.querySelector("#material-input").click();
    if (action === "link-folder") void chooseArchiveFolder();
    if (action === "attach-archive-file") document.querySelector("#archive-file-input").click();
    if (action === "send-archive-chat") void sendArchiveChat(profile);
    if (action === "organize-archive-chat") void sendArchiveChat(profile, "organize");
    if (action === "store-source-only") void storeSourceOnly(profile);
    if (action === "smart-organize") void smartOrganizeArchive(profile);
    if (action === "split-timeline") void splitStoryTimeline(profile);
    if (action === "apply-timeline-append") applyTimelineDraft(profile, "append");
    if (action === "apply-timeline-rebuild") applyTimelineDraft(profile, "rebuild");
    if (action === "upload-photos") document.querySelector("#photo-input").click();
    if (action === "backup-import") document.querySelector("#backup-input").click();
    if (action === "export") void exportSyncPackage();
    if (action === "save-local-data") void manualSaveLocalData();
    if (action === "restore-local-data") void restoreFromLocalDataFile();
    if (action === "export-readable-archive") void exportReadableArchive();
    if (action === "create-empty-space") void createEmptyDataSpace();
    if (action === "clear-current-space") clearCurrentDataSpace();
    if (action === "save-profile") {
      profile.name = document.querySelector("#edit-name").value.trim() || profile.name;
      profile.initial = profile.name[0];
      profile.current = Math.min(Math.max(Number(document.querySelector("#edit-current").value), 0), profile.milestones.length - 1);
      profile.focusedMilestone = profile.current;
      profile.stage = profile.milestones[profile.current] || profile.stage;
      profile.tags = document.querySelector("#edit-tags").value.split(/[，,/]/).map((x) => x.trim()).filter(Boolean);
      profile.summary = document.querySelector("#edit-summary").value.trim();
      profile.persona.communication = document.querySelector("#edit-persona-communication").value.trim() || "待补充";
      profile.persona.interests = document.querySelector("#edit-persona-interests").value.split(/[，,/]/).map((x) => x.trim()).filter(Boolean);
      profile.persona.boundaries = document.querySelector("#edit-persona-boundaries").value.trim() || "待补充";
      profile.direction = document.querySelector("#edit-direction").value.trim();
      applyMetricSchemaText(profile, document.querySelector("#edit-metric-schema")?.value || metricSchemaText(profile));
      normalizeStageMetrics(profile);
      const focusedIndex = Math.min(Math.max(profile.focusedMilestone ?? profile.current ?? 0, 0), profile.stageMetrics.length - 1);
      document.querySelectorAll("[data-metric]").forEach((input) => {
        const value = Math.min(100, Math.max(0, Number(input.value)));
        if (Number.isFinite(value)) {
          profile.stageMetrics[focusedIndex][input.dataset.metric] = value;
          if (focusedIndex === profile.current) profile.metrics[input.dataset.metric] = value;
        }
      });
      save();
      closeModal();
    }
    if (action === "ai-organize-event") void organizeEventDraft(profile);
    if (action === "save-record") { const detail = document.querySelector("#record-detail").value.trim(); const title = document.querySelector("#record-title").value.trim() || "新事件记录"; const summary = document.querySelector("#record-summary").value.trim() || detail.slice(0, 60); if (!detail) return; const event = { id: `${profile.id}-event-${Date.now()}`, date: document.querySelector("#record-date").value, title, summary, detail, rawText: detail, stage: Number(document.querySelector("#record-stage").value) }; profile.events.unshift(event); save(); void writeEventMarkdown(profile, event); closeModal(); void runAnalysis(); }
    if (action === "create-profile") {
      const nameInput = document.querySelector("#new-name");
      const name = nameInput.value.trim();
      if (!name) {
        const error = document.querySelector("#new-profile-error");
        error.textContent = "请先填写姓名或代号，再创建档案。";
        nameInput.focus();
        return;
      }
      const id = `p-${Date.now()}`;
      const stage = document.querySelector("#new-stage").value.trim() || "初识";
      store.profiles.push({
        id, name, initial: name[0], title: "待补充", stage,
        color: "linear-gradient(145deg,#786589,#27283f 58%,#263b39)",
        tags: ["新建档案"],
        relationType: appSettings().activePreset,
        metricSchema: metricPresetForMode(appSettings().activePreset),
        metrics: {},
        milestones: ["初识", "熟悉", "了解加深", "关系确认"],
        milestoneDetails: ["初识", "熟悉", "了解加深", "关系确认"].map((stageName) => ({ name: stageName, description: "待补充这个阶段的真实事件与变化。" })),
        focusedMilestone: 0, current: 0, photos: [], materials: [], coverPhotoIndex: 0,
        persona: { communication: "待补充", interests: [], boundaries: "待补充", confidence: "" },
        summary: document.querySelector("#new-summary").value.trim() || "等待补充故事梗概。",
        direction: "先记录真实互动，再做整理。", analysis: "资料不足，等待后续记录。", aiAdvice: "先补充真实资料，不急着下结论。", archiveChat: [], events: [], sourceRecords: [], contextSummary: "", lastSmartOrganizedAt: 0,
        stageMetrics: []
      });
      store.selected = id;
      save();
      closeModal();
    }
    if (action === "apply-theme-preset") {
      const palette = window.__themePalettes?.[document.querySelector("#theme-palette")?.value || "heart"];
      if (palette) {
        document.querySelector("#app-accent").value = palette.accent;
        document.querySelector("#app-gold").value = palette.gold;
      }
    }
    if (action === "apply-api-preset") {
      const preset = window.__apiPresets?.[Number(document.querySelector("#api-preset")?.value || 0)];
      if (preset) { document.querySelector("#api-url").value = preset.baseUrl; document.querySelector("#api-model").value = preset.model; }
    }
    if (action === "save-settings") {
      const selectedTheme = document.querySelector('input[name="theme-palette-choice"]:checked')?.value || "heart";
      store.app = {
        activePreset: document.querySelector("#app-preset").value,
        themePalette: selectedTheme,
        customTitle: document.querySelector("#app-title").value.trim(),
        customSubtitle: document.querySelector("#app-subtitle").value.trim(),
        customMark: document.querySelector("#app-mark").value.trim(),
        customAccent: "",
        customGold: "",
      };
      store.api.baseUrl = document.querySelector("#api-url").value.trim();
      store.api.model = document.querySelector("#api-model").value.trim();
      store.api.apiKey = document.querySelector("#api-key").value;
      store.api.persona = document.querySelector("#api-persona").value.trim();
      save(); closeModal();
    }
    if (action === "save-me") { store.me.about = document.querySelector("#me-about").value.trim(); store.me.workAndCreation = document.querySelector("#me-work").value.trim(); store.me.lifeAndHealth = document.querySelector("#me-life").value.trim(); store.me.relationshipHistory = document.querySelector("#me-history").value.trim(); store.me.patterns = document.querySelector("#me-patterns").value.trim(); store.me.goals = document.querySelector("#me-goals").value.trim(); store.me.boundaries = document.querySelector("#me-boundaries").value.trim(); save(); closeModal(); }
    if (action === "add-stage") { profile.milestoneDetails.push({ name: "新节点", description: "补充这个阶段的重要事实与变化。" }); profile.milestones = profile.milestoneDetails.map((detail) => detail.name); stagesModal(profile); }
    if (action === "save-stages") { profile.milestoneDetails = profile.milestoneDetails.map((detail, index) => ({ name: document.querySelector(`[data-stage-name="${index}"]`).value.trim() || `节点 ${index + 1}`, description: document.querySelector(`[data-stage-description="${index}"]`).value.trim() || "待补充" })); profile.milestones = profile.milestoneDetails.map((detail) => detail.name); profile.current = Math.min(profile.current, profile.milestones.length - 1); profile.focusedMilestone = Math.min(profile.focusedMilestone, profile.milestones.length - 1); normalizeStageMetrics(profile); save(); closeModal(); }
  }));
  document.querySelectorAll("[data-stage-node]").forEach((node) => node.addEventListener("click", () => {
    selectStage(profile, node.dataset.stageNode);
  }));
  document.querySelectorAll(".event[data-event-id]").forEach((item) => item.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    const record = profile.events.find((entry) => entry.id === item.dataset.eventId);
    if (record) eventDetailModal(profile, record);
  }));
  document.querySelectorAll("[data-open-event]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const record = profile.events.find((entry) => entry.id === button.dataset.openEvent);
    if (record) eventDetailModal(profile, record);
  }));
  document.querySelectorAll("[data-delete-event]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const record = profile.events.find((entry) => entry.id === button.dataset.deleteEvent);
    if (!record) return;
    if (!confirm(`确定删除事件“${record.title}”吗？这个操作只删除当前档案里的这条事件。`)) return;
    profile.events = profile.events.filter((entry) => entry.id !== record.id);
    normalizeStageMetrics(profile);
    save();
    render();
  }));
  document.querySelectorAll("[data-restore-profile]").forEach((button) => button.addEventListener("click", () => restoreProfile(button.dataset.restoreProfile)));
  document.querySelectorAll("[data-delete-profile]").forEach((button) => button.addEventListener("click", () => permanentlyDeleteProfile(button.dataset.deleteProfile)));
  document.querySelectorAll("[data-cover-photo]").forEach((button) => button.addEventListener("click", () => { profile.coverPhotoIndex = Number(button.dataset.coverPhoto); save(); photosModal(profile); }));
  document.querySelectorAll("[data-theme-choice]").forEach((input) => input.addEventListener("change", () => {
    const palette = themePalettes[input.value] || themePalettes.heart;
    document.documentElement.style.setProperty("--rose", palette.accent);
    document.documentElement.style.setProperty("--gold", palette.gold);
    document.documentElement.style.setProperty("--theme-bg-a", palette.bgA);
    document.documentElement.style.setProperty("--theme-bg-b", palette.bgB);
  }));
  document.querySelector("#material-input")?.addEventListener("change", (event) => { const files = [...event.target.files]; if (files.length) { profile.materials.push(...files.map((file) => file.name)); save(); render(); } });
  document.querySelector("#archive-file-input")?.addEventListener("change", async (event) => {
    const files = [...event.target.files];
    pendingArchiveFiles = await Promise.all(files.map(async (file) => ({ name: file.name, text: (await file.text()).slice(0, 50000) })));
    render();
  });
  document.querySelector("#photo-input")?.addEventListener("change", (event) => {
    const files = [...event.target.files].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    const input = event.currentTarget;
    Promise.all(files.slice(0, 8).map(shrinkPhotoForArchive))
      .then((photos) => {
        const previousLength = profile.photos.length;
        profile.photos.push(...photos);
        profile.coverPhotoIndex = previousLength;
        try {
          save();
          photosModal(profile);
        } catch (error) {
          profile.photos.splice(previousLength, photos.length);
          profile.coverPhotoIndex = Math.min(profile.coverPhotoIndex, Math.max(0, profile.photos.length - 1));
          alert("照片已压缩，但本地档案空间不足，暂时无法保存。请删除部分旧照片或导出后清理资料。");
        }
      })
      .catch((error) => alert(error instanceof Error ? error.message : "照片读取失败，请重新选择。"))
      .finally(() => { input.value = ""; });
  });
  document.querySelector("#me-avatar-input")?.addEventListener("change", async (event) => {
    const [file] = [...event.target.files].filter((item) => item.type.startsWith("image/"));
    if (!file) return;
    try {
      store.me = normalizeMe(store.me);
      store.me.avatar = await shrinkPhotoForArchive(file);
      save();
      meProfileCardModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : "头像读取失败，请重新选择。")
    } finally {
      event.currentTarget.value = "";
    }
  });
  document.querySelector("#backup-input")?.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if ([LOCAL_DATA_FORMAT, LEGACY_LOCAL_DATA_FORMAT].includes(payload?.format) || payload?.accountBook?.accounts?.length) {
        importFullLocalPayload(payload);
      } else {
        const imported = [SYNC_FORMAT, LEGACY_SYNC_FORMAT].includes(payload?.format) ? payload.data : payload;
        importStoreData(imported);
      }
      save();
      render();
      alert("资料包已导入。本机的 API Key 不会随资料包导入，请在本机设置里单独填写。");
    } catch {
      alert("这不是可用的同步资料包。");
    } finally {
      event.currentTarget.value = "";
    }
  });
}

render();
void getSavedFolderHandle().then(async (handle) => {
  if (!handle) return;
  const permission = await handle.queryPermission({ mode: "readwrite" });
  if (permission !== "granted") return;
  archiveFolderHandle = handle;
  archiveFolderFiles = await scanArchiveFolder();
  render();
}).catch(() => {});
