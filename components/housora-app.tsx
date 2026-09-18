"use client";

import "../app/projects.css";
import "../app/saved.css";
import "../app/workflow-studio.css";
import Image from "next/image";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2 as Buildings,
  ChevronDown as CaretDown,
  Check,
  CircleCheck as CheckCircle,
  Box as Cube,
  History as ClockCounterClockwise,
  Copy as CopySimple,
  CreditCard,
  MousePointerClick as CursorClick,
  Scan as Selection,
  Pencil as ScribbleLoop,
  Type as TextT,
  MessageCircle as ChatCircle,
  Images as ImagesSquare,
  Maximize2 as CornersOut,
  Ellipsis as DotsThree,
  RotateCcw as ArrowCounterClockwise,
  Download as DownloadSimple,
  Eye,
  FileText as FilePdf,
  FolderOpen,
  Heart,
  House,
  Settings as GearSix,
  Leaf,
  Link as LinkSimple,
  Menu as List,
  Search as MagnifyingGlass,
  Pencil as PencilSimple,
  Plus,
  Ruler,
  Share2 as ShareNetwork,
  Smartphone,
  LogOut as SignOut,
  Sparkles as Sparkle,
  LayoutGrid as SquaresFour,
  Trash2 as TrashSimple,
  Upload as UploadSimple,
  UserPlus,
  Users,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Archive,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ModelViewer } from "./model-viewer";
import { PricingPage, SettingsPage } from "./billing-settings";
import { DetectedObjects } from "./detected-objects";
import { CreditConfirmation, WorkspaceDialog } from "./credit-confirmation";
import { AI_COSTS, type DetectedObject } from "../lib/ai-costs";
import { prepareImage } from "../lib/prepare-image";
import { readAiResponse } from "../lib/await-ai-response";
import { RecentAiTasks } from "./recent-ai-tasks";
import { guidanceForInvalid, isValidThreeDSource, type ThreeDSource } from "../lib/threeD-validation";
import { CreateWorkflow } from "./workflows/create-workflow";
import { EditWorkflow } from "./workflows/edit-workflow";
import { ThreeDWorkflow } from "./workflows/three-d-workflow";
import { ArWorkflow } from "./workflows/ar-workflow";
import { smoothMask } from "../lib/mask-postprocess";

function getInitials(name: string): string {
  const normalized = name.trim();
  if (!normalized) return "HS";
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return normalized.slice(0, 2).toUpperCase();
}

function Avatar({
  src,
  alt,
  initials,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  initials: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  if (showImage && src) {
    return (
      <span className="avatar avatar-image" aria-hidden="true" style={{ width: size, height: size }}>
        <img src={src} alt="" width={size} height={size} onError={() => setFailed(true)} referrerPolicy="no-referrer" />
        <span className="visually-hidden">{alt}</span>
      </span>
    );
  }
  return (
    <span className="avatar avatar-initials" aria-hidden="true" style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}

function safeUUID() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type DesignMode = "Interior" | "Exterior" | "Garden";
type ProjectWorkflow = "create" | "edit" | "3d" | "ar";
type WorkspacePage =
  | "home"
  | "create"
  | "projects"
  | "discover"
  | "clients"
  | "library"
  | "studio"
  | "album"
  | "pricing"
  | "settings";
type SavedDesign = {
  id: string;
  projectId?: string;
  roomId?: string;
  prompt?: string;
  title: string;
  image: string;
  mode: DesignMode;
  savedAt: string;
  pinned?: boolean;
  archivedAt?: number;
  workflow?: ProjectWorkflow;
};
type ProjectDraft = {
  detectedObjects?: DetectedObject[];
  id?: string;
  projectId?: string;
  roomId?: string;
  title: string;
  image: string;
  prompt?: string;
  mode: DesignMode;
  workflow?: ProjectWorkflow;
};

function useDialogFocus(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);
  return dialogRef;
}

const modeData: Record<
  DesignMode,
  { image: string; spaces: string[]; styles: string[]; prompt: string }
> = {
  Interior: {
    image: "/pictures/interior-design-cover.png",
    spaces: [
      "Auto-detect",
      "Living room",
      "Bedroom",
      "Kitchen",
      "Bathroom",
      "Dining room",
      "Home office",
      "Kids room",
      "Hallway",
      "Balcony",
    ],
    styles: [
      "Auto style",
      "Modern",
      "Japandi",
      "Scandinavian",
      "Minimalist",
      "Mid-century",
      "Industrial",
      "Coastal",
      "Farmhouse",
      "Bohemian",
    ],
    prompt:
      "Make this room warm, calm and practical. Keep the windows and main layout.",
  },
  Exterior: {
    image: "/pictures/exterior-design-cover.png",
    spaces: [
      "Auto-detect",
      "Detached house",
      "Townhouse",
      "Apartment block",
      "Office building",
      "Retail storefront",
      "Hotel",
      "Cabin",
      "Warehouse conversion",
    ],
    styles: [
      "Auto style",
      "Contemporary",
      "Modernist",
      "Mediterranean",
      "Scandinavian",
      "Victorian",
      "Colonial",
      "Art deco",
      "Brutalist",
    ],
    prompt:
      "Refresh this exterior with natural materials and stronger curb appeal.",
  },
  Garden: {
    image: "/pictures/garden-design-cover.png",
    spaces: [
      "Auto-detect",
      "Back garden",
      "Front garden",
      "Courtyard",
      "Patio",
      "Roof terrace",
      "Poolside",
      "Balcony garden",
    ],
    styles: [
      "Auto style",
      "Modern",
      "Mediterranean",
      "Japanese",
      "Cottage",
      "Formal English",
      "Tropical",
      "Desert",
    ],
    prompt:
      "Create a lush, low-maintenance garden with room to relax and entertain.",
  },
};

const projectRows = [
  {
    name: "Bright Scandinavian living room",
    client: "Design session",
    room: "Interior",
    status: "Edited 2h ago",
    image: "/pictures/interior-design-room-living-room.png",
  },
  {
    name: "Warm oak kitchen refresh",
    client: "Design session",
    room: "Interior",
    status: "Edited yesterday",
    image: "/pictures/interior-design-room-kitchen.png",
  },
  {
    name: "Coastal bedroom in soft blues",
    client: "Design session",
    room: "Interior",
    status: "Edited 3 days ago",
    image: "/pictures/interior-design-room-bedroom.png",
  },
];

const detailOptions: Record<DesignMode, { label: string; values: string[] }[]> =
  {
    Interior: [
      {
        label: "Color palette",
        values: [
          "Auto",
          "Warm neutrals",
          "Earth tones",
          "Soft pastels",
          "Monochrome",
          "Cool greys",
          "Deep jewel",
        ],
      },
      {
        label: "Lighting",
        values: [
          "Auto",
          "Natural daylight",
          "Warm ambient",
          "Bright task lighting",
          "Golden hour",
          "Evening",
        ],
      },
      {
        label: "Wall finish",
        values: [
          "Auto",
          "Smooth plaster",
          "Limewash",
          "Wood panelling",
          "Exposed brick",
          "Stone cladding",
          "Subway tile",
        ],
      },
      {
        label: "Floor material",
        values: [
          "Auto",
          "Wide-plank oak",
          "Oak herringbone",
          "Polished concrete",
          "Terrazzo",
          "White marble",
          "Patterned tile",
          "Dark slate",
        ],
      },
      {
        label: "Window style",
        values: [
          "Keep existing",
          "Floor-to-ceiling",
          "Black frame",
          "Crittall grid",
          "Arched",
          "Bay window",
          "Sash",
        ],
      },
      {
        label: "Door style",
        values: [
          "Keep existing",
          "Flush minimal",
          "French glass",
          "Panelled classic",
          "Pivot",
          "Arched",
          "Sliding barn",
        ],
      },
      {
        label: "Staircase style",
        values: [
          "Keep existing",
          "Modern oak",
          "Floating steel",
          "Stone cantilever",
          "Glass balustrade",
          "Spiral",
          "Classic carpeted",
        ],
      },
    ],
    Exterior: [
      {
        label: "Color palette",
        values: [
          "Auto",
          "Warm neutral",
          "Earthy",
          "Light stone",
          "Dark contrast",
          "Coastal",
          "Heritage",
        ],
      },
      {
        label: "Lighting",
        values: [
          "Auto",
          "Midday",
          "Golden hour",
          "Blue hour",
          "Overcast",
          "Night",
        ],
      },
      {
        label: "Facade material",
        values: [
          "Auto",
          "Natural stone",
          "Brick",
          "Timber cladding",
          "Smooth render",
          "Metal panel",
          "Glass curtain wall",
          "Exposed concrete",
        ],
      },
      {
        label: "Roof style",
        values: [
          "Keep existing",
          "Flat",
          "Gable",
          "Hip",
          "Mansard",
          "Green roof",
        ],
      },
      {
        label: "Window style",
        values: [
          "Keep existing",
          "Floor-to-ceiling",
          "Black frame",
          "Crittall grid",
          "Arched",
          "Bay window",
          "Sash",
        ],
      },
      {
        label: "Door style",
        values: [
          "Keep existing",
          "Flush minimal",
          "French glass",
          "Panelled classic",
          "Pivot",
          "Arched",
        ],
      },
      {
        label: "Landscape level",
        values: ["Keep existing", "Minimal", "Balanced", "Lush"],
      },
    ],
    Garden: [
      {
        label: "Greenery",
        values: [
          "Auto",
          "Balanced",
          "Lush planting",
          "Minimal green",
          "Native and wild",
          "Low maintenance",
          "Edible garden",
        ],
      },
      {
        label: "Paving",
        values: [
          "Auto",
          "Stone paving",
          "Gravel",
          "Stepping stones",
          "Timber decking",
          "Brick path",
          "Poured concrete",
        ],
      },
      {
        label: "Boundary",
        values: [
          "Keep existing",
          "Hedge",
          "Stone wall",
          "Timber slat",
          "Metal railing",
          "Woven willow",
        ],
      },
      {
        label: "Lighting",
        values: [
          "Auto",
          "Daylight",
          "Golden hour",
          "Path lighting",
          "Ambient evening",
          "Festoon lights",
        ],
      },
      { label: "Maintenance", values: ["Low", "Balanced", "Hands-on"] },
      {
        label: "Climate",
        values: [
          "Auto-detect",
          "Temperate",
          "Mediterranean",
          "Tropical",
          "Arid",
          "Cold",
        ],
      },
      {
        label: "Outdoor furniture",
        values: [
          "Auto",
          "Dining set",
          "Lounge seating",
          "Built-in bench",
          "Daybed",
          "No furniture",
        ],
      },
    ],
  };

type DemoDialog =
  | "account"
  | "credits"
  | "project"
  | "client"
  | "team"
  | "library"
  | null;

export function HousoraApp({
  page = "projects",
}: {
  page?: WorkspacePage | "gallery" | "favorites" | "saved";
}) {
  const normalized: WorkspacePage =
    page === "gallery" ? "projects" : page === "favorites" || page === "saved" ? "library" : page;
  const [activePage, setActivePage] = useState<WorkspacePage>(normalized);
  const [railOpen, setRailOpen] = useState(false);
  const [dialog, setDialog] = useState<DemoDialog>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const designRows = useQuery(api.savedDesigns.list, {});
  const referenceRows = useQuery(api.savedReferences.list, {});
  const saveDesignRecord = useMutation(api.savedDesigns.save);
  const removeDesignRecord = useMutation(api.savedDesigns.remove);
  const updateDesignMeta = useMutation(api.savedDesigns.updateMeta);
  const saveReferenceRecord = useMutation(api.savedReferences.save);
  const removeReferenceRecord = useMutation(api.savedReferences.remove);
  const creditBalance = useQuery(api.credits.getMyBalance, {});
  const initializeCredits = useMutation(api.credits.initialize);
  const repairCredits = useMutation(api.credits.repairMyFreeBalance);
  useEffect(() => { void initializeCredits(); }, [initializeCredits]);
  useEffect(() => { void repairCredits().catch(() => {}); }, [repairCredits]);
  const savedDesigns: SavedDesign[] = (designRows ?? []).map((row) => ({
    id: row.designId,
    projectId: row.projectId,
    roomId: row.roomId,
    prompt: row.prompt,
    title: row.title,
    image: row.image,
    mode: row.mode as DesignMode,
    savedAt: row.savedAt,
    pinned: row.pinned,
    archivedAt: row.archivedAt,
    workflow: row.workflow as ProjectWorkflow | undefined,
  }));
  const savedReferences: InspirationReference[] = (referenceRows ?? []).map((row) => ({
    title: row.title,
    room: row.room,
    style: row.style,
    image: row.image,
    prompt: row.prompt,
  }));
  const profileName = user?.fullName || user?.username || "Housora designer";
  const profileEmail = user?.primaryEmailAddress?.emailAddress || "Signed in";
  const profileInitials = getInitials(`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || profileName);
  const isEditor = activePage === "album";
  const shellCollapsed = isEditor && editorCollapsed;
  const [projectDraft, setProjectDraft] = useState<ProjectDraft | null>(null);
  useEffect(() => {
    if (activePage !== "album" || !designRows) return;
    const designId = new URLSearchParams(window.location.search).get("design");
    const row = designRows.find(item => item.designId === designId);
    if (row && projectDraft?.id !== row.designId) {
      setProjectDraft({ id: row.designId, projectId: row.projectId, roomId: row.roomId, title: row.title, image: row.image, prompt: row.prompt, mode: row.mode, workflow: row.workflow as ProjectWorkflow | undefined });
    }
  }, [activePage, designRows, projectDraft?.id]);
  const [removedDesign, setRemovedDesign] = useState<SavedDesign | null>(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);
  const showNotice = (message: string, duration = 3200) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    if (duration > 0) {
      noticeTimer.current = window.setTimeout(() => setNotice(""), duration);
    }
  };
  const dismissNotice = () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    setNotice("");
    setRemovedDesign(null);
  };
  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
  }, []);
  const [recentMenuOpen, setRecentMenuOpen] = useState<string | null>(null);
  const [renamingRecentId, setRenamingRecentId] = useState<string | null>(null);
  const [recentRename, setRecentRename] = useState("");
  const recentOpenTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (recentOpenTimer.current) window.clearTimeout(recentOpenTimer.current);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawRequestedView = params.get("view");
    const requestedView = rawRequestedView === "saved" ? "library" : rawRequestedView as WorkspacePage | null;
    if (
      requestedView &&
      ["projects", "discover", "library", "album", "pricing", "settings"].includes(requestedView)
    ) {
      setActivePage(requestedView);
    }
    const restoreView = () => {
      const rawView = new URLSearchParams(window.location.search).get(
        "view",
      );
      const view = rawView === "saved" ? "library" : rawView as WorkspacePage | null;
      setActivePage(
        view && ["projects", "discover", "library", "album", "pricing", "settings"].includes(view)
          ? view
          : normalized,
      );
    };
    window.addEventListener("popstate", restoreView);
    return () => window.removeEventListener("popstate", restoreView);
  }, [normalized]);
  const saveDesign = async (design: Omit<SavedDesign, "savedAt">) => {
    let image = design.image;
    if (/^(data:|blob:)/.test(image)) {
      const form = new FormData();
      form.append("image", await (await fetch(image)).blob(), "design.png");
      const response = await fetch("/api/assets/image", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Image could not be saved.");
      image = result.url;
    }
    const context = await saveDesignRecord({
      designId: design.id,
      title: design.title,
      image,
      mode: design.mode,
      savedAt: new Date().toISOString(),
      prompt: design.prompt,
      workflow: design.workflow,
    });
    if (new URLSearchParams(window.location.search).get("view") === "album") {
      const url = new URL(window.location.href);
      url.searchParams.set("design", design.id);
      window.history.replaceState(window.history.state, "", url);
    }
    showNotice("Design saved");
    return context;
  };
  const unsaveDesign = async (id: string) => {
    setRemovedDesign(savedDesigns.find((item) => item.id === id) ?? null);
    await removeDesignRecord({ designId: id });
    showNotice("Removed from Saved");
  };
  const restoreDesign = async () => {
    if (!removedDesign) return;
    await saveDesignRecord({
      designId: removedDesign.id,
      title: removedDesign.title,
      image: removedDesign.image,
      mode: removedDesign.mode,
      savedAt: removedDesign.savedAt,
      workflow: removedDesign.workflow,
    });
    setRemovedDesign(null);
    showNotice("Design restored");
  };
  const saveReference = async (reference: InspirationReference) => {
    const exists = savedReferences.some((item) => item.title === reference.title);
    await saveReferenceRecord({
      title: reference.title,
      room: reference.room,
      style: reference.style,
      image: reference.image,
      prompt: reference.prompt,
      savedAt: new Date().toISOString(),
    });
    showNotice(exists ? "Already saved" : "Inspiration saved");
  };
  const unsaveReference = async (title: string) => {
    await removeReferenceRecord({ title });
    showNotice("Inspiration removed");
  };
  const navigate = (next: WorkspacePage, designId?: string) => {
    // Scoped feedback: a toast belongs to the screen that raised it and must
    // not persist across Pricing, Projects or Settings.
    dismissNotice();
    setActivePage(next);
    setProfileOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    if (designId) url.searchParams.set("design", designId);
    else url.searchParams.delete("design");
    if (next !== "discover") {
      url.searchParams.delete("q");
      url.searchParams.delete("space");
    }
    window.history.pushState({ view: next }, "", url);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const startBlankProject = () => {
    const draftId = safeUUID();
    setProjectDraft({ id: draftId, title: "Untitled concept", image: "", prompt: "", mode: "Interior" });
    navigate("album");
  };
  const startFromReference = (reference: InspirationReference) => {
    const draftId = safeUUID();
    const room = reference.room.toLowerCase();
    const inferredMode: DesignMode = room.includes("exterior") || room.includes("villa")
      ? "Exterior"
      : room.includes("garden") || room.includes("courtyard") || room.includes("terrace") || room.includes("poolside") || room.includes("patio")
        ? "Garden"
        : "Interior";
    const draft: ProjectDraft = {
      id: draftId,
      title: reference.title,
      image: reference.image,
      prompt: reference.prompt,
      mode: inferredMode,
      workflow: "create",
    };
    setProjectDraft(draft);
    navigate("album");
    void saveDesign({ ...draft, id: draftId }).then((context) => {
      setProjectDraft((current) => current?.id === draftId ? { ...current, ...context } : current);
    }).catch(() => showNotice("The image opened, but the project could not be saved. Use Retry in the editor save status.", 8000));
  };
  const openSavedProject = (design: SavedDesign) => {
    setProjectDraft({
      id: design.id,
      projectId: design.projectId,
      roomId: design.roomId,
      prompt: design.prompt,
      title: design.title,
      image: design.image,
      mode: design.mode,
      workflow: design.workflow,
    });
    navigate("album", design.id);
  };
  const openStudio = () => navigate("studio");
  const renameProject = async (design: SavedDesign, requestedTitle: string) => {
    const nextTitle = requestedTitle.trim();
    if (!nextTitle || nextTitle === design.title) return;
    await updateDesignMeta({ designId: design.id, title: nextTitle });
    // Keep the open editor header in sync when the renamed project is open.
    setProjectDraft((draft) => (draft && (draft.id === design.id || draft.projectId === design.projectId) ? { ...draft, title: nextTitle } : draft));
    showNotice("Project renamed");
    setRecentMenuOpen(null);
  };
  const beginRecentRename = (design: SavedDesign) => {
    if (recentOpenTimer.current) window.clearTimeout(recentOpenTimer.current);
    setRecentMenuOpen(null);
    setRenamingRecentId(design.id);
    setRecentRename(design.title);
  };
  const finishRecentRename = (design: SavedDesign) => {
    const nextTitle = recentRename.trim();
    setRenamingRecentId(null);
    setRecentRename("");
    if (nextTitle && nextTitle !== design.title) void renameProject(design, nextTitle);
  };
  const shareProject = async (design: SavedDesign) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "album");
    url.searchParams.set("design", design.id);
    try {
      const canShare = typeof navigator.share === "function";
      if (canShare) await navigator.share({ title: design.title, url: url.toString() });
      else await navigator.clipboard.writeText(url.toString());
      showNotice(canShare ? "Share opened" : "Project link copied");
    } catch { showNotice("Sharing cancelled"); }
    setRecentMenuOpen(null);
  };
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("housora:editorCollapsed");
      if (stored === "1") setEditorCollapsed(true);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("housora:editorCollapsed", editorCollapsed ? "1" : "0");
    } catch {}
  }, [editorCollapsed]);
  const recentProjects = savedDesigns
    .filter((design) => !design.archivedAt)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.savedAt.localeCompare(a.savedAt))
    .slice(0, 8);
  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".rail-account") && !t.closest(".profile-menu")) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  return (
    <div className={`product-shell${shellCollapsed ? " shell-collapsed" : ""}${isEditor ? " is-editor" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className={`${railOpen ? "product-rail is-open" : "product-rail"}${shellCollapsed ? " is-collapsed" : ""}`} aria-label="Primary" data-collapsed={shellCollapsed ? "true" : "false"}>
        <div className="product-brand">
          <Link href="/" aria-label="Housora home">Housora</Link>
          <div className="product-brand-actions">
            {isEditor ? (
              <button className="rail-collapse-toggle" onClick={() => setEditorCollapsed(v => !v)} aria-label={shellCollapsed ? "Expand navigation" : "Collapse navigation"} aria-pressed={shellCollapsed} title={shellCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                {shellCollapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
              </button>
            ) : null}
            <button className="rail-close-mobile" onClick={() => setRailOpen(false)} aria-label="Close navigation">
              <X />
            </button>
          </div>
        </div>
        <nav aria-label="Workspace navigation">
          <NavButton active={activePage === "album"} icon={<Plus />} label="New project" collapsed={shellCollapsed} onClick={startBlankProject} />
          <NavButton active={activePage === "discover"} icon={<ImagesSquare />} label="Images" collapsed={shellCollapsed} onClick={() => navigate("discover")} />
          <NavButton active={activePage === "library"} icon={<FolderOpen />} label="Library" collapsed={shellCollapsed} onClick={() => navigate("library")} />
          <NavButton active={activePage === "pricing"} icon={<CreditCard />} label="Pricing" collapsed={shellCollapsed} onClick={() => navigate("pricing")} />
        </nav>
        {!shellCollapsed ? <section className="rail-recents" aria-labelledby="recent-projects-title">
          <div className="rail-section-title"><span id="recent-projects-title">Recent</span><button onClick={() => navigate("projects")} aria-label="View all projects">View all</button></div>
          {recentProjects.length ? <ul>{recentProjects.map((design) => <li key={design.id}>
            {renamingRecentId === design.id ? <input className="rail-recent-rename" aria-label={`Rename ${design.title}`} title="Enter to save · Escape to cancel" value={recentRename} onChange={(event) => setRecentRename(event.target.value)} onBlur={() => finishRecentRename(design)} onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") { setRenamingRecentId(null); setRecentRename(""); }
            }} autoFocus /> : <button className="rail-recent-project" onClick={(event) => {
              if (event.detail !== 1) return;
              if (recentOpenTimer.current) window.clearTimeout(recentOpenTimer.current);
              recentOpenTimer.current = window.setTimeout(() => openSavedProject(design), 220);
            }} onDoubleClick={() => beginRecentRename(design)} title={`${design.title} · Double-click to rename`}>
              {design.pinned ? <Pin aria-hidden="true" /> : <span aria-hidden="true" />}
              <span className="rail-recent-label"><span>{design.title}</span><small>{(() => { try { const d = new Date(design.savedAt); return Number.isNaN(d.getTime()) ? design.mode : `${design.mode} · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`; } catch { return design.mode; } })()}</small></span>
            </button>}
            <button className="rail-recent-more" onClick={() => setRecentMenuOpen(recentMenuOpen === design.id ? null : design.id)} aria-label={`Project actions for ${design.title}`} aria-expanded={recentMenuOpen === design.id}><DotsThree aria-hidden="true" /></button>
            {recentMenuOpen === design.id ? <div className="rail-project-menu" role="menu">
              <button role="menuitem" onClick={() => beginRecentRename(design)}><PencilSimple /> Rename</button>
              <button role="menuitem" onClick={() => void shareProject(design)}><ShareNetwork /> Share</button>
              <button role="menuitem" onClick={() => { void updateDesignMeta({ designId: design.id, pinned: !design.pinned }); setRecentMenuOpen(null); }}><Pin /> {design.pinned ? "Unpin" : "Pin"}</button>
              <button role="menuitem" onClick={() => { void updateDesignMeta({ designId: design.id, archived: true }); setRecentMenuOpen(null); showNotice("Project archived"); }}><Archive /> Archive</button>
              <button role="menuitem" className="danger" onClick={() => { void unsaveDesign(design.id); setRecentMenuOpen(null); }}><TrashSimple /> Delete</button>
            </div> : null}
          </li>)}</ul> : <p>Your projects will appear here.</p>}
        </section> : null}
        <div className="rail-account">
          {profileOpen ? (
            <div className="profile-menu" role="menu" aria-label="Account menu">
              <div className="profile-menu-head">
                <Avatar src={user?.imageUrl ?? null} alt={profileName} initials={profileInitials} size={32} />
                <div>
                  <b>{profileName}</b>
                  <small>{profileEmail}</small>
                </div>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  navigate("pricing");
                  setProfileOpen(false);
                }}
              >
                <Sparkle />
                <span>
                  <b>Usage remaining</b>
                  <small>{creditBalance ? `${creditBalance.total} credits available` : "Loading balance…"}</small>
                </span>
                <ArrowRight />
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  navigate("settings");
                  setProfileOpen(false);
                }}
              >
                <GearSix />
                <span>
                  <b>Settings</b>
                  <small>Profile, studio and preferences</small>
                </span>
              </button>
              <button
                role="menuitem"
                className="logout-item"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <SignOut />
                <span>
                  <b>Log out</b>
                </span>
              </button>
            </div>
          ) : null}
          <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-haspopup="menu" aria-expanded={profileOpen} aria-label={shellCollapsed ? `${profileName} — open account menu` : undefined} title={shellCollapsed ? profileName : undefined}>
            <Avatar src={user?.imageUrl ?? null} alt={profileName} initials={profileInitials} size={36} />
            <span className="profile-meta">
              <b>{profileName}</b>
              <small>{creditBalance ? `${creditBalance.plan.replaceAll("_", " ")} · ${creditBalance.total} credits` : "Loading workspace…"}</small>
            </span>
            <CaretDown className={profileOpen ? "rotate" : ""} aria-hidden />
          </button>
        </div>
      </aside>
      {railOpen ? (
        <button
          className="rail-scrim"
          aria-label="Close navigation"
          onClick={() => setRailOpen(false)}
        />
      ) : null}
      <main className="product-main" id="main-content">
        <button
          className="mobile-nav floating-mobile-nav"
          onClick={() => setRailOpen(true)}
          aria-label="Open navigation"
        >
          <List />
        </button>
        <button
          className="mobile-account-button"
          onClick={() => navigate("settings")}
          aria-label="Open Housora settings"
        >
          {profileInitials}
        </button>
        {activePage === "home" ? (
          <DesignHome
            onCreate={() => navigate("album")}
            onDiscover={() => navigate("discover")}
            onOpenProject={openStudio}
          />
        ) : null}
        {activePage === "create" ? (
          <AlbumWorkspace
            key={projectDraft?.id || "new-project"}
            onBack={() => navigate("projects")}
            onSaveDesign={saveDesign}
          />
        ) : null}
        {activePage === "projects" ? (
          <>
          <ProjectsPage
            designs={savedDesigns}
            onNew={startBlankProject}
            onOpen={openSavedProject}
          />
          <RecentAiTasks onOpen={(image, objects, taskMode, projectId, roomId) => {
            // Attach recovered result to its original project/room if available, else new draft
            if (projectId && roomId) {
              setProjectDraft({ id: safeUUID(), projectId, roomId, title: "Recovered result", image, detectedObjects: objects, mode: taskMode === "Exterior" || taskMode === "Garden" ? taskMode : "Interior" });
            } else {
              setProjectDraft({ id: safeUUID(), title: "Recovered result", image, detectedObjects: objects, mode: taskMode === "Exterior" || taskMode === "Garden" ? taskMode : "Interior" });
            }
            navigate("album");
          }} />
          </>
        ) : null}
        {activePage === "clients" ? (
          <ClientsPage
            onInvite={() => setDialog("client")}
            onOpen={openStudio}
          />
        ) : null}
        {activePage === "discover" ? (
          <DiscoverPage
            onSave={saveReference}
            savedTitles={savedReferences.map((item) => item.title)}
            onCreate={startFromReference}
          />
        ) : null}
        {activePage === "library" ? (
          <LibraryPage
            designs={savedDesigns}
            references={savedReferences}
            onCreate={startBlankProject}
            onOpenDesign={openSavedProject}
            onOpenReference={startFromReference}
            onBrowse={() => navigate("discover")}
          />
        ) : null}
        {activePage === "studio" ? (
          <ThreeDLaunchPage onBack={() => navigate("projects")} />
        ) : null}
        {activePage === "album" ? (
          <AlbumWorkspace
            key={`${projectDraft?.id || "new-project"}:${projectDraft?.projectId || "draft"}`}
            onBack={() => navigate("projects")}
            onSaveDesign={saveDesign}
            initialDraft={projectDraft}
          />
        ) : null}
        {activePage === "pricing" ? <PricingPage /> : null}
        {activePage === "settings" ? <SettingsPage onPricing={() => navigate("pricing")} /> : null}
      </main>
      {!isEditor ? <nav
        className="mobile-bottom-nav"
        aria-label="Mobile workspace navigation"
      >
        <NavButton
          active={activePage === "projects"}
          icon={<Plus />}
          label="New"
          onClick={startBlankProject}
        />
        <NavButton
          active={activePage === "discover"}
          icon={<ImagesSquare />}
          label="Images"
          onClick={() => navigate("discover")}
        />
        <NavButton
          active={activePage === "library"}
          icon={<FolderOpen />}
          label="Library"
          onClick={() => navigate("library")}
        />
        <NavButton
          active={activePage === "pricing"}
          icon={<CreditCard />}
          label="Pricing"
          onClick={() => navigate("pricing")}
        />
      </nav> : null}
      {notice ? (
        <div className="workspace-toast" role="status">
          <span>{notice}</span>
          {removedDesign ? <button onClick={restoreDesign}>Undo</button> : null}
          <button className="workspace-toast-dismiss" onClick={dismissNotice} aria-label="Dismiss notification">
            <X aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {dialog ? (
        <QuickDialog
          type={dialog}
          onClose={() => setDialog(null)}
          onTeam={() => setDialog("team")}
        />
      ) : null}
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  collapsed = false,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick} aria-current={active ? "page" : undefined} aria-label={label} title={collapsed ? label : undefined}>
      {icon}
      <span className={collapsed ? "nav-label-collapsed" : undefined}>{label}</span>
    </button>
  );
}

function DesignHome({
  onCreate,
  onDiscover,
  onOpenProject,
}: {
  onCreate: () => void;
  onDiscover: () => void;
  onOpenProject: () => void;
}) {
  return (
    <div className="design-home">
      <header>
        <div>
          <span className="eyebrow">Your design workspace</span>
          <h1>Make the next room feel inevitable.</h1>
          <p>
            Start from a real space, a strong reference, or a saved concept.
          </p>
        </div>
        <button className="primary-action" onClick={onCreate}>
          <Sparkle /> Redesign a room
        </button>
      </header>
      <section className="design-home-start">
        <button onClick={onCreate}>
          <UploadSimple />
          <span>
            <b>Upload a room</b>
            <small>Analyze a real space and generate directions</small>
          </span>
          <ArrowRight />
        </button>
        <button onClick={onDiscover}>
          <MagnifyingGlass />
          <span>
            <b>Explore inspiration</b>
            <small>Find a reference and use its prompt</small>
          </span>
          <ArrowRight />
        </button>
        <button onClick={onOpenProject}>
          <Cube />
          <span>
            <b>Open 3D layout</b>
            <small>Test furniture placement and proportions</small>
          </span>
          <ArrowRight />
        </button>
      </section>
      <section className="design-home-recent">
        <div>
          <span className="eyebrow">Continue designing</span>
          <h2>Recent concepts</h2>
        </div>
        <div className="recent-grid">
          {projectRows.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              onOpen={onOpenProject}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function HomeDashboard({
  onCreate,
  onProjects,
  onOpenProject,
}: {
  onCreate: () => void;
  onProjects: () => void;
  onOpenProject: () => void;
}) {
  const tasks = [
    {
      title: "Emma is waiting for your sofa revision",
      meta: "Bordeaux residence · Due today",
      tone: "urgent",
    },
    {
      title: "Approve the oak flooring quote",
      meta: "$2,160 · Quote expires tomorrow",
      tone: "warning",
    },
    {
      title: "Kitchen samples arrive Friday",
      meta: "3 materials · Track delivery",
      tone: "info",
    },
  ];
  return (
    <div className="home-dashboard">
      <header className="home-heading">
        <div>
          <span className="eyebrow">Thursday, August 27</span>
          <h1>Good morning.</h1>
          <p>Three decisions need your attention today.</p>
        </div>
        <button className="primary-action" onClick={onCreate}>
          <Sparkle /> New design
        </button>
      </header>
      <section className="home-metrics" aria-label="Studio overview">
        <article>
          <span>Active projects</span>
          <b>3</b>
          <small>7 rooms in progress</small>
        </article>
        <article>
          <span>Awaiting approval</span>
          <b>2</b>
          <small>1 due today</small>
        </article>
        <article>
          <span>Open purchase orders</span>
          <b>6</b>
          <small>$8,420 committed</small>
        </article>
        <article>
          <span>Budget alerts</span>
          <b>1</b>
          <small>Living room +4.2%</small>
        </article>
      </section>
      <div className="home-grid">
        <section className="attention-panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">Next actions</span>
              <h2>Your attention</h2>
            </div>
            <button onClick={onProjects}>
              View projects <ArrowRight />
            </button>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <button key={task.title} onClick={onOpenProject}>
                <i className={task.tone} />
                <span>
                  <b>{task.title}</b>
                  <small>{task.meta}</small>
                </span>
                <ArrowRight />
              </button>
            ))}
          </div>
        </section>
        <section className="delivery-panel">
          <span className="eyebrow">This week</span>
          <h2>Schedule</h2>
          <div>
            <b>Today</b>
            <span>Client review · Bordeaux</span>
            <small>3:30 PM</small>
          </div>
          <div>
            <b>Fri</b>
            <span>Material samples · Cedar House</span>
            <small>10:00 AM</small>
          </div>
          <div>
            <b>Mon</b>
            <span>Installation · Olive courtyard</span>
            <small>8:00 AM</small>
          </div>
        </section>
      </div>
      <section className="dashboard-projects">
        <div className="section-title">
          <div>
            <span className="eyebrow">In progress</span>
            <h2>Recent projects</h2>
          </div>
          <button onClick={onProjects}>
            All projects <ArrowRight />
          </button>
        </div>
        <div className="recent-grid">
          {projectRows.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              onOpen={onOpenProject}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CreateWorkspace({
  onOpenProject,
  onViewProjects,
}: {
  onOpenProject: () => void;
  onViewProjects: () => void;
}) {
  const [mode, setMode] = useState<DesignMode>("Interior");
  const [space, setSpace] = useState("Auto-detect");
  const [style, setStyle] = useState("Auto style");
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [complete, setComplete] = useState(false);
  const [panel, setPanel] = useState<"brief" | "objects">("brief");
  const [resolution, setResolution] = useState("2K");
  const [model, setModel] = useState("Quality");
  const [aspect, setAspect] = useState("Auto");
  const [protectionInfo, setProtectionInfo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedImage = preview || modeData[mode].image;
  const changeMode = (next: DesignMode) => {
    setMode(next);
    setSpace("Auto-detect");
    setStyle("Auto style");
    setComplete(false);
    setAdvanced(false);
    setPanel("brief");
  };
  const upload = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      setComplete(false);
      setPanel("objects");
    };
    reader.readAsDataURL(file);
  };
  const generate = () => {
    setGenerating(true);
    setComplete(false);
    window.setTimeout(() => {
      setGenerating(false);
      setComplete(true);
    }, 1800);
  };

  return (
    <div className="creation-page">
      <section className="creation-intro">
        <h1>What space are we transforming?</h1>
        <p>
          Upload a photo, choose a direction, and create your first concepts.
        </p>
      </section>
      {!complete ? (
        <section className="creation-stage">
          <div
            className="mode-switch mode-switch-expanded"
            aria-label="Project type"
          >
            <span>Project type</span>
            <button
              className={mode === "Interior" ? "selected" : ""}
              onClick={() => changeMode("Interior")}
              aria-pressed={mode === "Interior"}
            >
              <House />
              Interior
            </button>
            <button
              className={mode === "Exterior" ? "selected" : ""}
              onClick={() => changeMode("Exterior")}
              aria-pressed={mode === "Exterior"}
            >
              <Buildings />
              Exterior
            </button>
            <button
              className={mode === "Garden" ? "selected" : ""}
              onClick={() => changeMode("Garden")}
              aria-pressed={mode === "Garden"}
            >
              <Leaf />
              Garden
            </button>
          </div>
          <div className="creation-grid">
            <button
              className="upload-canvas"
              onClick={() => fileRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                upload(e.dataTransfer.files[0]);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <Image
                src={selectedImage}
                alt={`${mode} design example`}
                fill
                sizes="(max-width: 800px) 100vw, 48vw"
                priority
              />
              <span className="image-wash" />
              <span className="upload-message">
                <UploadSimple />
                <b>{preview ? "Replace your photo" : "Upload your space"}</b>
                <small>
                  Drag and drop, paste, or browse · JPG, PNG or WEBP
                </small>
              </span>
            </button>
            <input
              ref={fileRef}
              className="visually-hidden"
              type="file"
              name="space-photo"
              aria-label="Choose a space photo"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => upload(e.target.files?.[0])}
            />
            <div className="creation-form">
              <div
                className="creation-panel-tabs editor-mode-tabs"
                role="tablist"
                aria-label="Creation controls"
              >
                <button
                  role="tab"
                  aria-selected={panel === "brief"}
                  onClick={() => setPanel("brief")}
                >
                  Create
                </button>
                <button
                  role="tab"
                  aria-selected={panel === "objects"}
                  onClick={() => setPanel("objects")}
                >
                  Edit {preview ? <span>8</span> : null}
                </button>
                <span className="create-room-summary">
                  <b>
                    {mode === "Interior"
                      ? "Room type"
                      : mode === "Exterior"
                        ? "Building type"
                        : "Garden area"}
                  </b>
                  <small>{space}</small>
                </span>
              </div>
              {panel === "brief" ? (
                <>
                  <div className="field-row">
                    <VisualSelect
                      label={
                        mode === "Interior"
                          ? "Room type"
                          : mode === "Exterior"
                            ? "Building type"
                            : "Garden area"
                      }
                      value={space}
                      values={modeData[mode].spaces}
                      onChange={setSpace}
                      mode={mode}
                      kind="space"
                    />
                    <VisualSelect
                      label="Design style"
                      value={style}
                      values={modeData[mode].styles}
                      onChange={setStyle}
                      mode={mode}
                      kind="style"
                    />
                  </div>
                  <label className="prompt-field">
                    <span>
                      Describe what you want <small>Optional</small>
                    </span>
                    <textarea
                      name="design-brief"
                      autoComplete="off"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={modeData[mode].prompt}
                    />
                  </label>
                  <button
                    className="advanced-toggle"
                    onClick={() => setAdvanced(!advanced)}
                    aria-expanded={advanced}
                  >
                    <Plus /> Design details{" "}
                    <small>Colors, materials, lighting & more</small>
                    <CaretDown className={advanced ? "rotate" : ""} />
                  </button>
                  {advanced ? (
                    <>
                      <AdvancedDetails mode={mode} />
                      <div className="output-row advanced-output">
                        <OptionChips
                          label="Aspect ratio"
                          value={aspect}
                          values={["Auto", "1:1", "4:3", "16:9", "4:5", "9:16"]}
                          onChange={setAspect}
                        />
                        <OptionChips
                          label="Resolution"
                          value={resolution}
                          values={["1K", "2K", "4K"]}
                          onChange={setResolution}
                        />
                        <OptionChips
                          label="Generation"
                          value={model}
                          values={["Fast", "Quality"]}
                          onChange={setModel}
                        />
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <DetectedObjects
                  key={`${mode}:${selectedImage}`}
                  hasImage={Boolean(preview)}
                  mode={mode}
                  image={selectedImage}
                  onUpload={() => fileRef.current?.click()}
                />
              )}
              <div className="generate-row">
                <div className="protection-note">
                  <button
                    onClick={() => setProtectionInfo(!protectionInfo)}
                    aria-expanded={protectionInfo}
                  >
                    <CheckCircle /> Structure protected <ArrowRight />
                  </button>
                  {protectionInfo ? (
                    <p>
                      Walls, openings and perspective stay fixed unless you
                      select them in Edit.
                    </p>
                  ) : null}
                </div>
                <button
                  className="primary-action"
                  onClick={generate}
                  disabled={generating}
                  aria-live="polite"
                >
                  {generating ? (
                    <>
                      <span className="spinner" /> Creating concepts…
                    </>
                  ) : (
                    <>
                      Generate 4 concepts <ArrowUp />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <Results
          mode={mode}
          onStartOver={() => setComplete(false)}
          onOpenProject={onOpenProject}
        />
      )}
      <section className="recent-strip" aria-labelledby="recent-title">
        <div>
          <span className="eyebrow">Continue where you left off</span>
          <h2 id="recent-title">Recent sessions</h2>
        </div>
        <button onClick={onViewProjects}>
          View gallery <ArrowRight />
        </button>
        <div className="recent-grid">
          {projectRows.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              onOpen={onOpenProject}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function VisualSelect({
  label,
  value,
  values,
  onChange,
  mode,
  kind,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  mode: DesignMode;
  kind: "space" | "style";
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(
    Math.max(0, values.indexOf(value)),
  );
  const controlId = `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const choose = (item: string) => {
    onChange(item);
    setHighlighted(values.indexOf(item));
    setOpen(false);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setHighlighted((current) =>
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? values.length - 1
            : event.key === "ArrowDown"
              ? (current + 1) % values.length
              : (current - 1 + values.length) % values.length,
      );
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      choose(values[highlighted]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };
  const imageFor = (item: string) => {
    if (item.startsWith("Auto")) return modeData[mode].image;
    const slug = item.toLowerCase().replace(/ /g, "-");
    const prefix = mode.toLowerCase();
    if (kind === "style") return `/pictures/${prefix}-design-style-${slug}.png`;
    if (mode === "Interior")
      return `/pictures/interior-design-room-${slug}.png`;
    if (mode === "Exterior")
      return `/pictures/exterior-design-building-${slug}.png`;
    return modeData[mode].image;
  };
  return (
    <div
      className="visual-select"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
    >
      <label id={`${controlId}-label`} htmlFor={controlId}>
        {label}
      </label>
      <button
        id={controlId}
        role="combobox"
        aria-labelledby={`${controlId}-label`}
        aria-controls={`${controlId}-listbox`}
        aria-haspopup="listbox"
        aria-activedescendant={
          open ? `${controlId}-option-${highlighted}` : undefined
        }
        onKeyDown={onKeyDown}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{value}</span>
        <CaretDown />
      </button>
      {open ? (
        <div
          id={`${controlId}-listbox`}
          className="visual-options"
          role="listbox"
          aria-label={label}
        >
          {values.map((item, index) => (
            <button
              id={`${controlId}-option-${index}`}
              key={item}
              role="option"
              aria-selected={value === item}
              className={highlighted === index ? "highlighted" : ""}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => choose(item)}
            >
              <Image
                src={imageFor(item)}
                alt=""
                width={84}
                height={58}
                onError={(e) => {
                  e.currentTarget.src = modeData[mode].image;
                }}
              />
              <span>
                <b>{item}</b>
                <small>
                  {item.startsWith("Auto")
                    ? "Let Housora choose"
                    : `${mode} direction`}
                </small>
              </span>
              {value === item ? <Check /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChoiceField({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange?: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const current = onChange ? value : localValue;
  return (
    <label className="choice-field">
      <span>{label}</span>
      <select
        value={current}
        onChange={(event) => {
          setLocalValue(event.target.value);
          onChange?.(event.target.value);
        }}
      >
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function OptionChips({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="option-chips">
      <legend>{label}</legend>
      <div>
        {values.map((item) => (
          <button
            type="button"
            key={item}
            className={value === item ? "selected" : ""}
            onClick={() => onChange(item)}
            aria-pressed={value === item}
          >
            {item}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function AdvancedDetails({ mode }: { mode: DesignMode }) {
  return (
    <div className="advanced-panel expanded-details">
      {detailOptions[mode].map((detail) => (
        <ChoiceField
          key={`${mode}-${detail.label}`}
          label={detail.label}
          value={detail.values[0]}
          values={detail.values}
        />
      ))}
      <button className="detail-action">
        <Ruler />
        <span>
          <b>Measurements & constraints</b>
          <small>Add dimensions, budget and must-keep items</small>
        </span>
        <ArrowRight />
      </button>
    </div>
  );
}

function DirectionDetails({
  mode,
  choices,
  onChange,
}: {
  mode: DesignMode;
  choices: Record<string, string>;
  onChange: (label: string, value: string) => void;
}) {
  return (
    <section
      className="direction-details"
      aria-label={`${mode} design details`}
    >
      <div>
        <span className="eyebrow">Design details</span>
        <p>
          {mode === "Interior"
            ? "Guide finishes, openings and spatial character."
            : mode === "Exterior"
              ? "Guide architecture, facade and the approach to the building."
              : "Guide planting, surfaces and the feeling of the outdoor space."}
        </p>
      </div>
      {detailOptions[mode].map((detail) => (
        <OptionChips
          key={`${mode}-${detail.label}`}
          label={detail.label}
          value={choices[detail.label] || detail.values[0]}
          values={detail.values}
          onChange={(value) => onChange(detail.label, value)}
        />
      ))}
    </section>
  );
}


function Results({
  mode,
  onStartOver,
  onOpenProject,
  onSave,
}: {
  mode: DesignMode;
  onStartOver: () => void;
  onOpenProject: () => void;
  onSave?: (design: Omit<SavedDesign, "savedAt">) => void;
}) {
  const images =
    mode === "Interior"
      ? ["modern", "japandi", "scandinavian", "mid-century"]
      : mode === "Exterior"
        ? ["contemporary", "modernist", "mediterranean", "scandinavian"]
        : ["modern", "mediterranean", "japanese", "cottage"];
  return (
    <section className="results-section" aria-live="polite">
      <div className="results-heading">
        <div>
          <span className="eyebrow">Four distinct directions</span>
          <h2>Your concepts are ready</h2>
          <p>
            The structure stays fixed. Choose one to refine or compare them with
            your client.
          </p>
        </div>
        <button onClick={onStartOver}>Start another design</button>
      </div>
      <div className="concept-grid">
        {images.map((style, index) => {
          const image = `/pictures/${mode.toLowerCase()}-design-style-${style}.png`;
          const title = `${capitalize(style.replace("-", " "))} ${mode.toLowerCase()}`;
          return (
            <article key={style}>
              <div className="concept-image">
                <Image
                  src={image}
                  alt={`${title} concept`}
                  fill
                  sizes="(max-width: 700px) 100vw, 25vw"
                />
                <button
                  aria-label={`Save ${title}`}
                  onClick={() =>
                    onSave?.({ id: `${mode}-${style}`, title, image, mode })
                  }
                >
                  <Heart />
                </button>
                <span>0{index + 1}</span>
              </div>
              <div>
                <h3>{capitalize(style.replace("-", " "))}</h3>
                <button onClick={onOpenProject}>
                  Open editor <ArrowRight />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProjectsPage({
  designs,
  onNew,
  onOpen,
}: {
  designs: SavedDesign[];
  onNew: () => void;
  onOpen: (design: SavedDesign) => void;
}) {
  const formatDate = (value?: string) => {
    if (!value) return "Saved recently";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "Saved recently";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Saved recently";
    }
  };
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const hasProjects = designs.length > 0;
  return (
    <section className="visual-projects clean-projects" aria-labelledby="projects-title">
      <header className="visual-projects-header">
        <div>
          <span className="eyebrow">Working documents</span>
          <div className="project-title-row">
            <h1 id="projects-title">Your projects</h1>
          </div>
          <p>
            {hasProjects
              ? "Editable rooms with history, versions, and 3D."
              : "Start from a photo — your first design becomes a project you can reopen and refine."}
          </p>
        </div>
        <button className="primary-action" onClick={onNew} aria-label="Create new project">
          <Plus /> New project
        </button>
      </header>

      <div className="project-library-toolbar clean-project-toolbar">
        <div className="project-tabs">
          <span>{hasProjects ? `Projects · ${designs.length}` : "No projects yet"}</span>
        </div>
      </div>

      {hasProjects ? (
        <div className="album-grid">
          {designs.map((design) => {
            const hasError = imageErrors[design.id];
            const isGenericTitle = /^(interior design|new project|untitled concept)$/i.test(design.title.trim());
            const displayTitle = isGenericTitle ? `${design.mode} concept` : design.title;
            return (
              <button
                className="album-card"
                key={design.id}
                onClick={() => onOpen(design)}
                aria-label={`Open ${design.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(design);
                  }
                }}
              >
                <span>
                  {!hasError ? (
                    <Image
                      src={design.image}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 50vw, 240px"
                      unoptimized={design.image.startsWith("data:") || design.image.startsWith("http")}
                      onError={() => setImageErrors((m) => ({ ...m, [design.id]: true }))}
                    />
                  ) : (
                    <span className="card-image-error" role="img" aria-label="Image failed to load">
                      <ImagesSquare />
                      <small>Image unavailable</small>
                      <button
                        className="card-retry"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageErrors((m) => ({ ...m, [design.id]: false }));
                        }}
                        aria-label={`Retry loading ${design.title}`}
                      >
                        Retry
                      </button>
                    </span>
                  )}
                  <i className="card-badge">{design.mode}</i>
                </span>
                <b>{displayTitle}</b>
                <small>
                  {design.mode} · {formatDate(design.savedAt)}
                </small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="album-grid album-grid-empty">
          <button className="new-album-card" onClick={onNew} aria-label="Create new empty project">
            <span>
              <Plus />
            </span>
            <b>New project</b>
            <small>Upload a photo or try an example</small>
          </button>
        </div>
      )}

    </section>
  );
}

function AlbumWorkspace({
  onBack,
  onSaveDesign,
  initialDraft,
}: {
  onBack: () => void;
  onSaveDesign: (design: Omit<SavedDesign, "savedAt">) => Promise<{ projectId: string; roomId: string }>;
  initialDraft?: ProjectDraft | null;
}) {
  const [mode, setMode] = useState<DesignMode>(initialDraft?.mode ?? "Interior");
  const [space, setSpace] = useState("Auto-detect");
  const [style, setStyle] = useState("Auto style");
  const [prompt, setPrompt] = useState(initialDraft?.prompt ?? "");
  const [preview, setPreview] = useState<string | null>(initialDraft?.image ?? null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ProjectWorkflow | null>(initialDraft?.workflow ?? (initialDraft?.image ? "create" : null));
  const workflowRef = useRef<ProjectWorkflow | null>(initialDraft?.workflow ?? (initialDraft?.image ? "create" : null));
  const [detailChoices, setDetailChoices] = useState<Record<string, string>>({});
  const [outputRatio, setOutputRatio] = useState("auto");
  const [saved, setSaved] = useState(Boolean(initialDraft?.image && initialDraft?.projectId && initialDraft.roomId));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationConfirmOpen, setGenerationConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const generationLock = useRef(false);
  const [generationError, setGenerationError] = useState("");
  const [activeTool, setActiveTool] = useState<"select" | "spotlight" | "draw" | "reframe">("select");
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>(() => initialDraft?.detectedObjects ?? []);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanConfirmOpen, setScanConfirmOpen] = useState(false);
  const scanPromptedImageRef = useRef<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ object: DetectedObject; instruction: string } | null>(null);
  const [regionConfirmOpen, setRegionConfirmOpen] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<{ image: string; mask: string; prompt: string } | null>(null);
  const [pendingReframe, setPendingReframe] = useState<{ image: string; aspectRatio: string } | null>(null);
  const [instruction, setInstruction] = useState("");
  const [regionPrompt, setRegionPrompt] = useState("");
  const [previewRatio, setPreviewRatio] = useState(1.5);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(true);
  const [history, setHistory] = useState<string[]>(() => (initialDraft?.image ? [initialDraft.image] : []));
  const [historyIndex, setHistoryIndex] = useState(0);
  const [designId] = useState(() => initialDraft?.id || safeUUID());
  const [versionContext, setVersionContext] = useState(initialDraft?.projectId && initialDraft.roomId ? { projectId: initialDraft.projectId, roomId: initialDraft.roomId } : null);
  const savedVersions = useQuery(api.roomVersions.list, versionContext || "skip");
  const historyLoaded = useRef(false);
  useEffect(() => {
    if (historyLoaded.current || !savedVersions?.length) return;
    historyLoaded.current = true;
    const images = [...savedVersions].reverse().map(version => version.image).slice(-20);
    setHistory(images);
    const selected = images.lastIndexOf(initialDraft?.image || "");
    setHistoryIndex(selected >= 0 ? selected : images.length - 1);
  }, [savedVersions, initialDraft?.image]);
  const persistImage = async (image: string, instructionText = prompt) => {
    setSaveError("");
    setSaving(true);
    historyLoaded.current = true;
    try {
      const workflow = workflowRef.current ?? selectedWorkflow ?? (activeTool !== "select" ? "edit" : "create");
      const autoTitleDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const autoTitleTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const draftTitle = initialDraft?.title && initialDraft.title !== "New project" ? initialDraft.title : `${mode} ${workflow === "edit" ? "edit" : workflow === "3d" ? "3D project" : workflow === "ar" ? "AR project" : "design"} · ${autoTitleDate}, ${autoTitleTime}`;
      const context = await onSaveDesign({ id: designId, title: draftTitle, image, mode, prompt: instructionText, workflow });
      setVersionContext(context);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };
  const retrySave = () => {
    if (!preview || saving) return;
    void persistImage(preview, prompt).catch(() => setSaveError("Still could not save this project. Your image and settings are preserved — try Retry again or download the image before leaving."));
  };
  const pushHistory = (img: string) => {
    setHistory((h) => {
      const next = h.slice(0, historyIndex + 1);
      if (next[next.length - 1] === img) return h;
      const updated = [...next, img].slice(-20);
      setHistoryIndex(updated.length - 1);
      return updated;
    });
    setSaved(false);
  };
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const undo = () => {
    if (!canUndo) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setPreview(history[idx]);
    setSaved(false);
  };
  const redo = () => {
    if (!canRedo) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setPreview(history[idx]);
    setSaved(false);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyIndex, history, preview]);
  useEffect(() => {
    if (!preview || saved || saving) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [preview, saved, saving]);

  // 3D / AR shared state
  const [threeDSource, setThreeDSource] = useState<ThreeDSource | null>(null);
  const [threeDConfirmOpen, setThreeDConfirmOpen] = useState(false);
  const [pendingThreeD, setPendingThreeD] = useState<{ source: ThreeDSource; imagePreview: string } | null>(null);
  const [threeDStatus, setThreeDStatus] = useState<"idle" | "uploading" | "queued" | "running" | "success" | "failed">("idle");
  const [threeDModelUrl, setThreeDModelUrl] = useState<string | null>(null);
  const [threeDModelPoster, setThreeDModelPoster] = useState<string | null>(null);
  const [threeDError, setThreeDError] = useState<string | null>(null);
  const [threeDBusy, setThreeDBusy] = useState(false);
  const [arReturnPending, setArReturnPending] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [trackingPaused, setTrackingPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const { user: threeDUser } = useUser();
  const createModelShare = useMutation(api.models.createShare);
  const revokeModelShare = useMutation(api.models.revokeShare);
  const recentModelsRaw = useQuery(api.models.list, {});
  const [newlyGeneratedModel, setNewlyGeneratedModel] = useState<{ id: string; url: string; title: string; createdAt: number | string; poster: string | null; thumbnail: string | null } | null>(null);
  const queryModels = (recentModelsRaw ?? []).filter(m => Boolean(m.url)).map(m => ({ id: m.taskId, url: m.url as string, title: `Furniture model ${m.taskId.slice(0,6)}`, createdAt: m.createdAt, poster: null as string | null, thumbnail: null as string | null }));
  const completedModels = newlyGeneratedModel ? [newlyGeneratedModel, ...queryModels.filter(m => m.id !== newlyGeneratedModel.id)] : queryModels;
  const [selectedArModelId, setSelectedArModelId] = useState<string | null>(null);
  const selectedArModel = completedModels.find(m => m.id === selectedArModelId) ?? completedModels[0] ?? null;
  useEffect(() => {
    if (completedModels.length && !selectedArModelId) setSelectedArModelId(completedModels[0].id);
  }, [completedModels, selectedArModelId]);

  useEffect(() => { workflowRef.current = selectedWorkflow; }, [selectedWorkflow]);

  // Auto-start segmentation after Edit image is saved (honest, with credit confirmation)
  useEffect(() => {
    if (selectedWorkflow === "edit" && preview && scanPromptedImageRef.current !== preview && detectedObjects.length === 0 && !isScanning && !scanError && !scanConfirmOpen) {
      const timer = setTimeout(() => {
        scanPromptedImageRef.current = preview;
        setScanConfirmOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [selectedWorkflow, preview, detectedObjects.length, isScanning, scanError, scanConfirmOpen]);

  const handleHeaderBack = () => {
    if (selectedWorkflow) {
      workflowRef.current = null;
      setSelectedWorkflow(null);
      return;
    }
    if (preview && !saved) setLeaveConfirmOpen(true);
    else onBack();
  };
  const headerBackLabel = selectedWorkflow ? "Back to tools" : "Back to Projects";

  const originalPreview = useRef<string | null>(initialDraft?.image ?? null);
  const canvasRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const exportImage = async (share: boolean) => {
    if (!preview) return;
    setExportStatus("");
    try {
      const response = await fetch(preview);
      if (!response.ok) throw new Error("Image unavailable");
      const blob = await response.blob();
      const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      const file = new File([blob], `housora-design.${extension}`, { type: blob.type });
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: initialDraft?.title ?? "Housora design", files: [file] });
        setExportStatus("Shared successfully.");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportStatus(share ? "Sharing is not supported on this device. Image downloaded." : "Image downloaded.");
      }
      window.setTimeout(() => setExportStatus(""), 3500);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setExportStatus("Could not export this image. Please try again.");
      window.setTimeout(() => setExportStatus(""), 3500);
    }
  };
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const requestUpload = (intent: "create" | "edit" = "create") => {
    const w: ProjectWorkflow = intent === "edit" ? "edit" : "create";
    setSelectedWorkflow(w);
    workflowRef.current = w;
    fileRef.current?.click();
  };
  const upload = (file?: File) => {
    setUploadError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Choose an image smaller than 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = String(reader.result);
      setPreview(img);
      pushHistory(img);
      originalPreview.current = String(reader.result);
      setSelectedObject(null);
      setDetectedObjects([]);
      setScanError(null);
      setEditError(null);
      setSaveError("");
      setZoom(1); setFit(true);
      void persistImage(img, prompt).catch(() => setSaveError("The image opened, but the project could not be saved. Your work is preserved — use Retry in the save status to try again."));
    };
    reader.onerror = () => setUploadError("This image could not be opened. Try another photo.");
    reader.readAsDataURL(file);
  };
  const startTemplate = () => {
    setSelectedWorkflow("create");
    workflowRef.current = "create";
    const img = modeData[mode].image;
    setPreview(img);
    pushHistory(img);
    originalPreview.current = img;
    setSaved(false);
    setZoom(1); setFit(true);
    void persistImage(img, prompt).catch(() => setSaveError("The example opened, but the project could not be saved. Your work is preserved — use Retry in the save status to try again."));
  };
  const buildGenerationPrompt = () => {
    const isAutoSpace = !space || space === "Auto-detect";
    const isAutoStyle = !style || style === "Auto style";
    const spaceFragment = isAutoSpace ? "" : ` of a ${space.toLowerCase()}`;
    const styleFragment = isAutoStyle ? "" : ` in ${style} style`;
    const modeLabel = mode === "Interior" ? "interior photograph" : mode === "Exterior" ? "exterior/architecture photograph" : "garden/outdoor photograph";
    const isAutoValue = (v: string) => v === "Auto" || v === "Auto style" || v === "Auto-detect" || v === "Keep existing" || v.startsWith("Auto");
    const selectedDetails = detailOptions[mode]
      .map((detail) => [detail.label, detailChoices[detail.label] || detail.values[0]] as const)
      .filter(([, value]) => !isAutoValue(value))
      .map(([label, value]) => `${label}: ${value}`)
      .join("; ");
    const userDirection = prompt.trim() || modeData[mode].prompt;
    const baseTask = `Redesign this ${modeLabel}${spaceFragment}${styleFragment}.`;
    const preservation = mode === "Interior"
      ? "Preserve the original architecture, camera position, perspective, windows, doors, walls and structural layout exactly. Only update finishes, furniture, decor, palette and lighting."
      : mode === "Exterior"
        ? "Preserve the original architecture, camera position, perspective, openings and structural massing exactly. Only update materials, palette, landscaping and lighting."
        : "Preserve the original camera position, perspective, boundaries and structural layout exactly. Only update planting, surfaces, furniture and lighting.";
    return [baseTask, userDirection, selectedDetails ? `Design details — ${selectedDetails}.` : "", preservation, "Photorealistic, high-detail, professional design visualization, natural light, 8k."].filter(Boolean).join(" ");
  };
  const generateDesign = async () => {
    if (!preview || generationLock.current) return;
    generationLock.current = true;
    setGenerationConfirmOpen(false);
    setGenerating(true);
    setGenerationError("");
    try {
      const finalPrompt = buildGenerationPrompt();
      if (!versionContext) await persistImage(preview, prompt);
      const rawImage = preview.startsWith("data:") ? preview : await asDataUrl(preview);
      const image = rawImage.startsWith("data:") ? await prepareImage(rawImage).catch(() => rawImage) : rawImage;
      const response = await fetch("/api/ai/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          prompt: finalPrompt,
          mode,
          space: space === "Auto-detect" ? null : space,
          style: style === "Auto style" ? null : style,
          details: detailChoices,
          requestId: safeUUID(),
          confirmed: true,
          aspectRatio: outputRatio,
          projectId: versionContext?.projectId,
          roomId: versionContext?.roomId,
        }),
      });
      const result = await readAiResponse(response);
      if (!response.ok) throw new Error(result.error || "Generation failed.");
      if (!result.image) throw new Error("Model returned no image.");
      setPreview(result.image);
      pushHistory(result.image);
      setSelectedObject(null);
      setDetectedObjects([]);
      try {
        if (result.storageWarning) throw new Error(result.storageWarning);
        await persistImage(result.image, finalPrompt);
        setExportStatus(result.cached ? "Saved cached result — no credits used." : "Generated and saved to project history.");
      } catch {
        setSaveError("Your image is ready, but saving failed. Your work is preserved — use Retry in the save status, or download the image before leaving.");
      }
      setTimeout(() => setExportStatus(""), 4000);
    } catch (reason) {
      setGenerationError(reason instanceof Error ? reason.message : "Generation failed.");
    } finally {
      generationLock.current = false;
      setGenerating(false);
    }
  };
  const changeMode = (next: DesignMode) => {
    setMode(next);
    setSpace("Auto-detect");
    setStyle("Auto style");
    setDetailChoices({});
  };

  const doScan = async () => {
    if (!preview || isScanning) return;
    setScanConfirmOpen(false);
    setIsScanning(true);
    setScanError(null);
    try {
      const pixels = await prepareImage(preview);
      const response = await fetch("/api/ai/segment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: pixels, autoDetect: true, mode, confirmed: true, requestId: safeUUID() }),
        signal: AbortSignal.timeout(295_000),
      });
      const result = await readAiResponse(response);
      if (!response.ok) throw new Error(result.error || "Detection failed. Please try again.");
      if (!Array.isArray(result.objects)) throw new Error("Detection returned an invalid result. Contact support.");
      let processed = result.objects as DetectedObject[];
      try {
        processed = await Promise.all(processed.map(async (o) => {
          try { const smoothed = await smoothMask(o.mask, { feather: 1.6, closeRadius: 2 }); return { ...o, mask: smoothed }; } catch { return o; }
        }));
      } catch {}
      setDetectedObjects(processed);
      setSelectedObject(null);
    } catch (reason) {
      const raw = reason instanceof Error ? reason.message : "Detection failed.";
      const friendly = raw.includes("temporarily unavailable") || raw.includes("not configured")
        ? "Object detection is temporarily unavailable. Your credits were not charged. Please save your design and try again later."
        : raw;
      setScanError(friendly);
    } finally { setIsScanning(false); }
  };
  const doEditObject = async () => {
    if (!pendingEdit || !preview || isEditing) return;
    setEditConfirmOpen(false);
    setIsEditing(true);
    setEditError(null);
    try {
      const pixels = await prepareImage(preview);
      const response = await fetch("/api/ai/edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: pixels,
          mask: pendingEdit.object.mask,
          prompt: `Edit only the ${pendingEdit.object.label} inside the normalized bounding box ${JSON.stringify(pendingEdit.object.box)}: ${pendingEdit.instruction.trim()}. Preserve other objects, room architecture, perspective and lighting.`,
          requestId: safeUUID(), confirmed: true,
          projectId: versionContext?.projectId, roomId: versionContext?.roomId,
        }),
        signal: AbortSignal.timeout(295_000),
      });
      const result = await readAiResponse(response);
      if (!response.ok || !result.image) throw new Error(result.error || "Image editing failed.");
      setPreview(result.image); pushHistory(result.image); setSelectedObject(null); setDetectedObjects([]);
      await persistImage(result.image, `Object edit: ${pendingEdit.instruction.trim()}`);
    } catch (reason) { setEditError(reason instanceof Error ? reason.message : "Image editing failed."); }
    finally { setIsEditing(false); setPendingEdit(null); }
  };
  const doRegionEdit = async () => {
    if (!pendingRegion || !preview || isEditing) return;
    setRegionConfirmOpen(false);
    setIsEditing(true);
    setEditError(null);
    try {
      const response = await fetch("/api/ai/edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: pendingRegion.image, mask: pendingRegion.mask, prompt: `Edit only the marked region: ${pendingRegion.prompt.trim()}. Preserve everything outside the mask, the camera perspective, architecture and lighting.`, requestId: safeUUID(), confirmed: true, projectId: versionContext?.projectId, roomId: versionContext?.roomId }),
        signal: AbortSignal.timeout(295_000),
      });
      const result = await readAiResponse(response);
      if (!response.ok || !result.image) throw new Error(result.error || "The selected-area edit failed.");
      setPreview(result.image); pushHistory(result.image); setSelectedObject(null);
      await persistImage(result.image, `Region edit: ${pendingRegion.prompt.trim()}`);
    } catch (reason) { setEditError(reason instanceof Error ? reason.message : "The selected-area edit failed."); }
    finally { setIsEditing(false); setPendingRegion(null); }
  };
  const doReframe = async () => {
    if (!pendingReframe || !preview || isEditing) return;
    setRegionConfirmOpen(false);
    setIsEditing(true);
    setEditError(null);
    try {
      const image = await prepareImage(preview);
      const response = await fetch("/api/ai/edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, prompt: "Reframe this photograph naturally for the requested aspect ratio. Preserve the same room, architecture, objects, materials and lighting. Extend or crop the composition seamlessly without redesigning it.", aspectRatio: pendingReframe.aspectRatio, requestId: safeUUID(), confirmed: true, projectId: versionContext?.projectId, roomId: versionContext?.roomId }),
        signal: AbortSignal.timeout(295_000),
      });
      const result = await readAiResponse(response);
      if (!response.ok || !result.image) throw new Error(result.error || "Reframing failed.");
      setPreview(result.image); pushHistory(result.image);
      await persistImage(result.image, `Reframed to ${pendingReframe.aspectRatio}`);
    } catch (reason) { setEditError(reason instanceof Error ? reason.message : "Reframing failed."); }
    finally { setIsEditing(false); setPendingReframe(null); }
  };

  const trackingKey = threeDUser?.id ? `housora:tripo:${threeDUser.id}` : null;
  useEffect(() => {
    if (!trackingKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(trackingKey) || "null");
      if (saved?.taskId && saved?.trackingToken && Date.now() - saved.createdAt < 23 * 60 * 60_000) {
        setTaskId(saved.taskId); setTrackingToken(saved.trackingToken); setThreeDStatus("queued");
      }
    } catch {}
  }, [trackingKey]);
  useEffect(() => { return () => { if (threeDModelUrl?.startsWith("blob:")) URL.revokeObjectURL(threeDModelUrl); }; }, [threeDModelUrl]);
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const startedAt = Date.now();
    const readTask = async () => {
      try {
        const query = trackingToken ? `?trackingToken=${encodeURIComponent(trackingToken)}` : "";
        const response = await fetch(`/api/tripo/tasks/${encodeURIComponent(taskId)}${query}`, { cache: "no-store", signal: AbortSignal.timeout(180_000) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not check the 3D model.");
        if (cancelled) return;
        failures = 0;
        setThreeDError(null);
        setProgress(result.progress || 0);
        if (result.status === "success") {
          if (!result.modelUrl) throw new Error("Tripo completed without a model file.");
          setThreeDModelUrl(result.modelUrl);
          setThreeDModelPoster(result.previewUrl || null);
          setThreeDStatus("success");
          setThreeDBusy(false);
          if (trackingKey) { try { localStorage.removeItem(trackingKey); } catch {} }
          if (arReturnPending) {
            setArReturnPending(false);
            setSelectedWorkflow("ar");
            workflowRef.current = "ar";
          }
          // Auto-select newly generated model even when older models exist
          if (taskId && result.modelUrl) {
            const newModel = { id: taskId, url: result.modelUrl, title: `Furniture model ${taskId.slice(0,6)}`, createdAt: Date.now(), poster: result.previewUrl || null, thumbnail: null };
            setNewlyGeneratedModel(newModel);
            setSelectedArModelId(taskId);
          }
          return;
        }
        if (["failed", "banned", "expired", "cancelled"].includes(result.status)) {
          setThreeDError(result.error || `Tripo ended with status: ${result.status}.`);
          setThreeDStatus("failed");
          setThreeDBusy(false);
          setTaskId(null);
          if (trackingKey) { try { localStorage.removeItem(trackingKey); } catch {} }
          return;
        }
        setThreeDStatus(result.status === "running" ? "running" : "queued");
        setThreeDBusy(true);
        if (Date.now() - startedAt > 15 * 60_000) {
          setTrackingPaused(true);
          setThreeDError("This model is taking longer than expected. Check its status without creating a second request.");
          return;
        }
        timer = setTimeout(readTask, 5000);
      } catch {
        if (!cancelled) {
          failures += 1;
          setThreeDError("Connection interrupted. Your model may still be running; no new generation will be submitted.");
          if (failures < 4) timer = setTimeout(readTask, 5000 * failures);
          else setTrackingPaused(true);
        }
      }
    };
    readTask();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [taskId, trackingToken, pollAttempt, trackingKey, arReturnPending]);
  const handleThreeDGenerate = async (source: ThreeDSource, imagePreview: string) => {
    setPendingThreeD({ source, imagePreview });
    setThreeDConfirmOpen(true);
  };
  const doThreeDGenerate = async () => {
    if (!pendingThreeD || threeDBusy) return;
    setThreeDConfirmOpen(false);
    const { source, imagePreview } = pendingThreeD;
    const validation = isValidThreeDSource(source);
    if (!validation.valid || !imagePreview) { setThreeDError(validation.reason || "Choose a furniture image first."); return; }
    setThreeDBusy(true);
    setThreeDStatus("uploading");
    setThreeDError(null);
    setProgress(0);
    try {
      const form = new FormData();
      const pixels = await prepareImage(imagePreview);
      const blob = await (await fetch(pixels)).blob();
      form.append("image", blob, "furniture.jpg");
      form.append("confirmed", "true");
      form.append("requestId", safeUUID());
      form.append("sourceKind", source.kind);
      if (source.objectBox) form.append("sourceBox", JSON.stringify(source.objectBox));
      const response = await fetch("/api/tripo/generate", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start 3D generation.");
      if (!result.taskId || !result.trackingToken) throw new Error("The 3D service returned an incomplete task. Contact support before trying again.");
      setTaskId(result.taskId);
      setTrackingToken(result.trackingToken);
      if (trackingKey) { try { localStorage.setItem(trackingKey, JSON.stringify({ taskId: result.taskId, trackingToken: result.trackingToken, createdAt: Date.now() })); } catch {} }
      setThreeDStatus("queued");
    } catch (reason) {
      setThreeDError(reason instanceof Error ? reason.message : "Could not start 3D generation.");
      setThreeDStatus("failed");
      setThreeDBusy(false);
    } finally { setPendingThreeD(null); }
  };

  const handleCreate3DFromObject = async (payload: { object: DetectedObject; cropDataUrl: string }) => {
    setThreeDSource({ image: payload.cropDataUrl, kind: "sam-crop", objectLabel: payload.object.label, objectBox: payload.object.box });
    setSelectedWorkflow("3d");
    workflowRef.current = "3d";
    setThreeDStatus("idle");
    setThreeDModelUrl(null);
    setThreeDError(null);
  };

  const handleArStart3D = () => {
    setArReturnPending(true);
    setThreeDSource(null);
    setSelectedWorkflow("3d");
    workflowRef.current = "3d";
    setThreeDStatus("idle");
    setThreeDModelUrl(null);
    setThreeDError(null);
  };

  return (
    <section className="album-workspace" aria-label="Project editor">
      <header className="album-workspace-bar">
        <div className="album-bar-left">
          <button className="album-back" onClick={handleHeaderBack} aria-label={headerBackLabel}>
            <ArrowLeft /> {headerBackLabel}
          </button>
          <span className="album-project-title" title={preview ? initialDraft?.title && initialDraft.title !== "New project" ? initialDraft.title : `${mode} project` : "New project"}>{preview ? initialDraft?.title && initialDraft.title !== "New project" ? initialDraft.title : `${mode} project` : "New project"}</span>
        </div>
        <div className="album-bar-right">
          {preview ? (
            <div className="album-save-status" role="status" aria-live="polite">
              {saveError ? (
                <>
                  <span className="album-save-error">Couldn’t save — your work is preserved</span>
                  <button className="album-save-retry" onClick={retrySave} disabled={saving}>
                    {saving ? "Retrying…" : "Retry"}
                  </button>
                </>
              ) : saving ? (
                <span className="album-save-state">Saving…</span>
              ) : saved ? (
                <span className="album-save-state is-saved">Saved</span>
              ) : (
                <>
                  <span className="album-save-state">Unsaved</span>
                  <button className="album-save-retry" onClick={retrySave} disabled={saving}>
                    Save now
                  </button>
                </>
              )}
            </div>
          ) : null}
          {preview ? (
            <div className="album-bar-actions" aria-label="Project image actions">
              <button className="icon-secondary" aria-label="Download image" title="Download image" onClick={() => void exportImage(false)}>
                <DownloadSimple />
              </button>
              <button className="icon-secondary" aria-label="Share design" title="Share design" onClick={() => void exportImage(true)}>
                <ShareNetwork />
              </button>
            </div>
          ) : null}
          {preview ? (
            <div className="album-mobile-actions">
              <button className="icon-secondary" aria-label="More project actions" aria-controls="mobile-project-actions" aria-expanded={headerMenuOpen} onClick={() => setHeaderMenuOpen((open) => !open)}>
                <DotsThree aria-hidden="true" />
              </button>
              {headerMenuOpen ? <div id="mobile-project-actions" className="album-mobile-action-menu" aria-label="Project image actions">
                <button onClick={() => { setHeaderMenuOpen(false); void exportImage(false); }}><DownloadSimple aria-hidden="true" />Download image</button>
                <button onClick={() => { setHeaderMenuOpen(false); void exportImage(true); }}><ShareNetwork aria-hidden="true" />Share design</button>
              </div> : null}
            </div>
          ) : null}
        </div>
      </header>
      <input ref={fileRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload a space photo" onChange={(event) => { upload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      <p className="visually-hidden" role="alert" aria-live="assertive">{uploadError}</p>
      <div className={`album-workspace-body workflow-${selectedWorkflow || "launcher"}${preview ? "" : " is-launcher"}`}>
        {selectedWorkflow === "create" ? (
          <CreateWorkflow
            preview={preview}
            mode={mode}
            space={space}
            style={style}
            prompt={prompt}
            details={detailChoices}
            aspectRatio={outputRatio}
            ready={Boolean(preview)}
            busy={generating}
            error={generationError || saveError || uploadError}
            onModeChange={changeMode}
            onSpaceChange={setSpace}
            onStyleChange={setStyle}
            onPromptChange={setPrompt}
            onDetailChange={(label, value) => setDetailChoices(c => ({ ...c, [label]: value }))}
            onAspectRatioChange={setOutputRatio}
            onUpload={upload}
            onGenerate={() => setGenerationConfirmOpen(true)}
            onUseExample={startTemplate}
          />
        ) : selectedWorkflow === "edit" ? (
          <EditWorkflow
            image={preview}
            detectedObjects={detectedObjects}
            selectedObjectId={selectedObject?.id ?? null}
            onSelectObject={setSelectedObject}
            onReplaceImage={() => requestUpload("edit")}
            onScan={() => setScanConfirmOpen(true)}
            isScanning={isScanning}
            scanError={scanError}
            activeTool={activeTool}
            onActiveToolChange={setActiveTool}
            instruction={instruction}
            onInstructionChange={setInstruction}
            onEditObject={(payload) => { setPendingEdit(payload); setEditConfirmOpen(true); }}
            onCreate3D={handleCreate3DFromObject}
            onRegionEdit={(payload) => { setPendingRegion(payload); setRegionConfirmOpen(true); }}
            regionPrompt={regionPrompt}
            onRegionPromptChange={setRegionPrompt}
            onReframe={(payload) => { setPendingReframe(payload); setRegionConfirmOpen(true); }}
            history={history}
            historyIndex={historyIndex}
            onSelectHistory={(idx) => { setHistoryIndex(idx); setPreview(history[idx]); setSaved(false); }}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            isEditing={isEditing || isScanning}
            editError={editError || scanError}
          />
        ) : selectedWorkflow === "3d" ? (
          <ThreeDWorkflow
            initialSource={threeDSource}
            status={threeDStatus}
            modelUrl={threeDModelUrl}
            modelPoster={threeDModelPoster}
            error={threeDError}
            busy={threeDBusy}
            returnIntent={arReturnPending ? "When the model is ready, you'll return to AR to place it in your room." : null}
            onUpload={(file) => {
              // Single blob/data URL: read as data URL, set source, and persist as real project for Recent
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result);
                setThreeDSource({ image: dataUrl, kind: "furniture-upload" });
                setThreeDModelUrl(null);
                setThreeDError(null);
                setThreeDStatus("idle");
                // Save as real project and add to Recent (like Create/Edit)
                setPreview(dataUrl);
                pushHistory(dataUrl);
                originalPreview.current = dataUrl;
                void persistImage(dataUrl, prompt).catch(() => setSaveError("The furniture image was saved for preview but project persistence failed."));
              };
              reader.onerror = () => setThreeDError("This image could not be opened. Try another photo.");
              reader.readAsDataURL(file);
            }}
            onGenerate={handleThreeDGenerate}
            onReset={() => {
              setThreeDSource(null);
              setThreeDModelUrl(null);
              setThreeDStatus("idle");
              setThreeDError(null);
              setTaskId(null);
              setTrackingToken(null);
            }}
          />
        ) : selectedWorkflow === "ar" ? (
          <ArWorkflow
            completedModels={completedModels}
            selectedModel={selectedArModel}
            onSelectModel={(m) => setSelectedArModelId(m.id)}
            onStartImageTo3D={handleArStart3D}
            onOpenAr={(m) => {
              return createModelShare({ taskId: m.id }).then((token) => {
                window.location.assign(`/ar?token=${encodeURIComponent(token)}`);
              });
            }}
            onCopyPhoneLink={async (m) => {
              try {
                const token = await createModelShare({ taskId: m.id });
                const url = `${window.location.origin}/ar?token=${encodeURIComponent(token)}`;
                await navigator.clipboard.writeText(url);
              } catch (error) {
                throw error;
              }
            }}
          />
        ) : (
          <div className="album-empty">
            <div>
              <span className="eyebrow">Your space, reimagined</span>
              <h1>Start with your space</h1>
              <p>Choose what you want to make. Your project is created automatically after you add an image.</p>
            </div>
            <div className="project-workflow-grid" aria-label="Choose a project workflow">
              <button className="workflow-primary" aria-pressed="false" onClick={() => { workflowRef.current = "create"; setSelectedWorkflow("create"); }}>
                <span><Sparkle aria-hidden="true" /></span>
                <b>Create — start here</b>
                <small>Redesign an interior, exterior or garden from your photo</small>
              </button>
              <button aria-pressed="false" onClick={() => { workflowRef.current = "edit"; setSelectedWorkflow("edit"); }}>
                <span><Selection aria-hidden="true" /></span>
                <b>Edit</b>
                <small>Change furniture, surfaces, or details</small>
              </button>
              <button aria-pressed="false" onClick={() => { workflowRef.current = "3d"; setSelectedWorkflow("3d"); }}>
                <span><Cube aria-hidden="true" /></span>
                <b>3D</b>
                <small>Create a model from one furniture image</small>
              </button>
              <button aria-pressed="false" onClick={() => { workflowRef.current = "ar"; setSelectedWorkflow("ar"); }}>
                <span><Smartphone aria-hidden="true" /></span>
                <b>AR</b>
                <small>Place a finished 3D model in your room</small>
              </button>
            </div>
            <p className="project-workflow-prompt">Start with Create. Edit, 3D and AR open inside your project.</p>
            {uploadError ? <p className="album-upload-error" role="alert">{uploadError}</p> : null}
            <p className="album-credit-note">Uploading and choosing a direction are free. We always ask before using credits.</p>
          </div>
        )}
        {exportStatus ? <div role="status" aria-live="polite" style={{ position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)", background: "rgba(24,24,22,0.96)", color: "#f4f0e8", border: "1px solid #34362f", borderRadius: 10, padding: "8px 12px", fontSize: 12, zIndex: 5 }}>{exportStatus}</div> : null}
      </div>
      <CreditConfirmation open={generationConfirmOpen} cost={AI_COSTS.imageEdit} title="Generate your design?" description="Create a new version of this photo. Your original stays available for comparison. Detecting the room type is free; this generation costs credits." action="Generate" onCancel={() => setGenerationConfirmOpen(false)} onConfirm={() => void generateDesign()} />
      <CreditConfirmation open={scanConfirmOpen} cost={AI_COSTS.detection} title="Detect objects in this photo?" description="Scan this photo to find furniture and surfaces. Failed or empty scans return the detection credit." action="Detect objects" onCancel={() => setScanConfirmOpen(false)} onConfirm={() => void doScan()} />
      <CreditConfirmation open={editConfirmOpen} cost={AI_COSTS.imageEdit} title={pendingEdit?.object.label ? `Edit ${pendingEdit.object.label}?` : "Apply edit?"} description="Only the selected object will be edited. Everything else is preserved." action="Edit object" onCancel={() => { setEditConfirmOpen(false); setPendingEdit(null); }} onConfirm={() => void doEditObject()} />
      <CreditConfirmation open={regionConfirmOpen && Boolean(pendingRegion)} cost={AI_COSTS.imageEdit} title="Apply this local edit?" description="Only the spotlighted or drawn region is edited. The rest of your photo is preserved, and your original remains in version history." action="Apply edit" onCancel={() => { setRegionConfirmOpen(false); setPendingRegion(null); }} onConfirm={() => void doRegionEdit()} />
      <CreditConfirmation open={regionConfirmOpen && Boolean(pendingReframe)} cost={AI_COSTS.imageEdit} title="Apply this reframe?" description="Generate a naturally extended or cropped version in the selected format. Your original remains in version history." action="Apply reframe" onCancel={() => { setRegionConfirmOpen(false); setPendingReframe(null); }} onConfirm={() => void doReframe()} />
      <CreditConfirmation open={threeDConfirmOpen} cost={AI_COSTS.model3d} title="Create this 3D model?" description="Use this image to create a textured 3D model. Failed generations return your Housora credits. AI models are approximations, not measured replicas." action="Create 3D" onCancel={() => { setThreeDConfirmOpen(false); setPendingThreeD(null); }} onConfirm={() => void doThreeDGenerate()} />
      <WorkspaceDialog open={leaveConfirmOpen} onClose={() => setLeaveConfirmOpen(false)} title="Leave without saving?">
        <p className="workspace-dialog-copy">This version has not been saved to Projects. Stay here to save it, or leave and discard these unsaved changes.</p>
        <footer>
          <button onClick={() => setLeaveConfirmOpen(false)}>Stay here</button>
          <button className="primary-action" onClick={onBack}>Leave project</button>
        </footer>
      </WorkspaceDialog>
    </section>
  );
}





function ClientsPage({
  onInvite,
  onOpen,
}: {
  onInvite: () => void;
  onOpen: () => void;
}) {
  const clients = [
    {
      name: "Emma Laurent",
      meta: "Last contact today",
      decision: "Sofa fabric approval",
      value: "$25,000",
      portal: "Review open",
    },
    {
      name: "Noah Williams",
      meta: "Last contact yesterday",
      decision: "Flooring quote",
      value: "$45,000",
      portal: "Portal active",
    },
    {
      name: "Mia Chen",
      meta: "Last contact Aug 24",
      decision: "Installation schedule",
      value: "$15,000",
      portal: "Approved",
    },
  ];
  return (
    <CollectionPage
      eyebrow="Client relationships"
      title="Clients"
      subtitle="Briefs, communication, decisions and private client access."
      action="Invite client"
      onAction={onInvite}
    >
      {clients.map((client, index) => (
        <article className="client-card rich-client" key={client.name}>
          <span>
            {client.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <div>
            <h3>{client.name}</h3>
            <p>{client.meta}</p>
          </div>
          <div>
            <small>Outstanding decision</small>
            <b>{client.decision}</b>
          </div>
          <div>
            <small>Project value</small>
            <b>{client.value}</b>
          </div>
          <em>{client.portal}</em>
          <button onClick={onOpen}>
            Open <ArrowRight />
          </button>
          <div className="client-progress">
            <i style={{ width: `${76 - index * 18}%` }} />
          </div>
        </article>
      ))}
    </CollectionPage>
  );
}
type InspirationReference = {
  title: string;
  room: string;
  style: string;
  image: string;
  prompt: string;
};

type InspirationEntry = InspirationReference & {
  /** Stable record key — unique per record, never reused. Used for list keys and dialog identity. */
  id: string;
  /** One-line, image-specific description shown in the detail dialog. */
  summary: string;
};

const inspirationReferences: InspirationEntry[] = [
  {
    title: "Warm minimal living room",
    id: "warm-minimal-living-room",
    summary: "Curved bouclé sofa, oak slat wall and travertine coffee table in warm afternoon light.",
    room: "Living room",
    style: "Warm minimal",
    image: "/inspiration/discover/01-warm-minimal-living-room.png",
    prompt:
      "Create a warm minimalist living room with a sculptural cream sofa, oak slatted feature wall, low travertine coffee table, quiet plants, full-height curtains and refined styling. Soft late-afternoon natural light; no people.",
  },
  {
    title: "Limestone kitchen",
    id: "limestone-kitchen",
    summary: "Pale oak cabinetry, limestone island and ceramic pendants under garden windows.",
    room: "Kitchen",
    style: "Japandi",
    image: "/inspiration/discover/02-japandi-kitchen.png",
    prompt:
      "Create a Japandi kitchen with pale oak cabinetry, a limestone island, handmade ceramic pendants and floor-to-ceiling garden windows. Bright overcast daylight; no people.",
  },
  {
    title: "Olive courtyard",
    id: "olive-courtyard",
    summary: "Limewashed courtyard with an olive tree, curved seating and a quiet water bowl.",
    room: "Courtyard",
    style: "Mediterranean",
    image: "/inspiration/discover/03-mediterranean-courtyard.png",
    prompt:
      "Create an intimate Mediterranean courtyard with limewashed walls, an olive tree, terracotta paving, built-in curved seating and a quiet water bowl. Warm morning sun; no people.",
  },
  {
    title: "Hillside villa",
    id: "hillside-villa",
    summary: "Stone-and-timber villa with an infinity pool over the hills at golden hour.",
    room: "Villa exterior",
    style: "Contemporary",
    image: "/inspiration/discover/04-contemporary-villa.png",
    prompt:
      "Create a contemporary hillside villa of natural stone and warm timber, an infinity pool, native landscaping and large glass openings. Golden hour; no people.",
  },
  {
    title: "Quiet boutique bedroom",
    id: "quiet-boutique-bedroom",
    summary: "Textured plaster bedroom with an upholstered bed, travertine tables and amber pendant.",
    room: "Bedroom",
    style: "Soft luxury",
    image: "/inspiration/discover/05-quiet-bedroom.png",
    prompt:
      "Create a quiet boutique-hotel bedroom with textured plaster walls, upholstered headboard, linen bedding, travertine side tables and a soft amber pendant. Tranquil early morning; no people.",
  },
  {
    title: "Stone spa bath",
    id: "stone-spa-bath",
    summary: "Freestanding stone tub, fluted oak vanity and skylight with an olive branch.",
    room: "Bathroom",
    style: "Spa modern",
    image: "/inspiration/discover/06-sculptural-bathroom.png",
    prompt:
      "Create a sculptural spa bathroom with a freestanding oval stone tub, fluted oak vanity, plaster walls, skylight and olive branch. Soft daylight; no people.",
  },
  {
    title: "Gaming media room",
    id: "gaming-media-room",
    summary: "Charcoal media room with warm LED shelving, a modular sofa and a restrained blue glow.",
    room: "Gaming room",
    style: "Moody modern",
    image: "/inspiration/discover/07-gaming-studio.png",
    prompt:
      "Create a sophisticated adult gaming and media room with charcoal acoustic wall panels, integrated warm LED shelving, a low modular sofa, walnut console and restrained blue ambient light. No people.",
  },
  {
    title: "Collected family room",
    id: "collected-family-room",
    summary: "Curved cream sofa, colorful art and custom bookshelves in a sunny afternoon.",
    room: "Living room",
    style: "Contemporary",
    image: "/inspiration/discover/08-family-living-room.png",
    prompt:
      "Create an elevated family living room with a creamy curved sofa, colorful art, custom bookshelves, woven rug and sculptural floor lamp. Soft sunny afternoon; no people.",
  },
  {
    title: "Urban roof garden",
    id: "urban-roof-garden",
    summary: "Rooftop garden with olive planters, a stone dining table, a shade sail and skyline.",
    room: "Roof terrace",
    style: "Natural",
    image: "/inspiration/discover/09-rooftop-garden.png",
    prompt:
      "Create a lush urban rooftop garden with olive trees in planters, a pale stone dining table, linen shade sail and distant city skyline. Late afternoon; no people.",
  },
  {
    title: "Creative kids room",
    id: "creative-kids-room",
    summary: "Sage-and-sand kids room with arched storage, a wood desk, a canopy and a tactile rug.",
    room: "Kids room",
    style: "Soft contemporary",
    image: "/inspiration/discover/10-kids-room.png",
    prompt:
      "Create a calming creative children's bedroom with custom arched storage, soft sage and warm sand walls, a natural wood desk, linen canopy and tactile rug. Gentle daylight; no people.",
  },
  {
    title: "Oak gathering table",
    id: "oak-gathering-table",
    summary: "Long oak dining table, woven pendants and pottery shelves in a sunset glow.",
    room: "Dining room",
    style: "Natural modern",
    image: "/inspiration/discover/11-oak-dining-room.png",
    prompt:
      "Create a warm modern dining room with a long solid-oak table, woven pendant lamps, a wall of open shelving and hand-thrown ceramics. Sunset glow; no people.",
  },
  {
    title: "Desert pool villa",
    id: "desert-pool-villa",
    summary: "Rammed-earth pool patio with a cactus garden and concrete loungers in midday sun.",
    room: "Poolside",
    style: "Desert",
    image: "/inspiration/discover/12-desert-pool.png",
    prompt:
      "Create a serene desert villa pool patio with rammed-earth walls, cactus garden, pale concrete lounge chairs and strong shadow patterns. Clean midday sun; no people.",
  },
  {
    title: "Walnut home office",
    id: "walnut-home-office",
    summary: "Walnut library office with a sculptural desk, a lounge chair and moody daylight.",
    room: "Home office",
    style: "Refined modern",
    image: "/inspiration/discover/13-home-office.png",
    prompt:
      "Create a refined home office with a built-in walnut library, sculptural desk, parchment wallcovering, low lounge chair and framed abstract art. Moody window daylight; no people.",
  },
  {
    title: "Quiet gathering",
    id: "quiet-gathering",
    summary: "Low modular seating, ivory upholstery and sculptural lighting in afternoon sun.",
    room: "Living room",
    style: "Warm minimal",
    image: "/inspiration/cozy_modern_living_room.webp",
    prompt:
      "Create a quiet, warm-minimal living room with low modular seating, textured ivory upholstery, pale oak, sculptural lighting and soft afternoon daylight. Keep the architecture calm and uncluttered.",
  },
  {
    title: "Soft geometry",
    id: "soft-geometry",
    summary: "Sculptural oatmeal forms, pale timber and handmade ceramics in diffused light.",
    room: "Living room",
    style: "Japandi",
    image: "/inspiration/japandi_minimalist_living_room.webp",
    prompt:
      "Design a Japandi living room with soft sculptural forms, a restrained oatmeal palette, pale timber, handmade ceramics and diffused natural light.",
  },
  {
    title: "Collected comfort",
    id: "collected-comfort",
    summary: "Layered neutrals, a generous sofa, warm wood and art-led styling in daylight.",
    room: "Living room",
    style: "Contemporary",
    image: "/inspiration/modern_living_room.webp",
    prompt:
      "Create a contemporary living room that feels collected rather than staged: layered neutral textiles, a generous sofa, warm wood, art-led styling and natural daylight.",
  },
  {
    title: "Oak and cane",
    id: "oak-and-cane",
    summary: "Solid oak table, cane-backed chairs, black accents and a large line drawing.",
    room: "Dining room",
    style: "Scandinavian",
    image: "/inspiration/scandinavian_japandi_dining_room.webp",
    prompt:
      "Design a Scandinavian-Japandi dining room with a solid oak table, cane-backed chairs, black accents, handmade vessels and a large framed line drawing.",
  },
  {
    title: "Northern calm",
    id: "northern-calm",
    summary: "Clean-lined furniture, tactile wool, warm oak and a practical family layout.",
    room: "Living room",
    style: "Scandinavian",
    image: "/inspiration/scandinavian_living_room.webp",
    prompt:
      "Create a light Scandinavian living room with clean-lined furniture, tactile wool, warm oak, black details and a calm, practical family layout.",
  },
  {
    title: "Restful retreat",
    id: "restful-retreat",
    summary: "Low upholstered bed, linen bedding, plaster walls and gentle bedside light.",
    room: "Bedroom",
    style: "Warm minimal",
    image: "/inspiration/warm_minimalist_bedroom.webp",
    prompt:
      "Create a restful warm-minimal bedroom with a low upholstered bed, linen bedding, creamy plaster walls, timber accents and gentle bedside lighting.",
  },
  {
    title: "Steel windows, blank canvas",
    id: "steel-windows-blank-canvas",
    summary: "An empty white room with black steel windows and oak floors, ready for direction.",
    room: "Living room",
    style: "Blank canvas",
    image: "/inspiration/inspo-1.webp",
    prompt:
      "Use this empty white room with black steel windows and oak floors as a blank canvas. Design a calm living room with a low sofa, natural wood, soft textiles and daylight; no people.",
  },
  {
    title: "Sunlit empty room",
    id: "sunlit-empty-room",
    summary: "An unfurnished sunlit room with glazed walls and wood floors, ready for direction.",
    room: "Living room",
    style: "Blank canvas",
    image: "/inspiration/inspo-2.webp",
    prompt:
      "Use this unfurnished sunlit room with floor-to-ceiling glazing and wood floors as a starting point. Design a calm living room with low seating, natural materials and soft daylight; no people.",
  },
  {
    title: "Rattan dining room",
    id: "rattan-dining-room",
    summary: "Round wooden table with rattan chairs, open shelving and a woven pendant.",
    room: "Dining room",
    style: "Natural modern",
    image: "/inspiration/inspo-3.webp",
    prompt:
      "Create a natural-modern dining room with a round wooden table, rattan chairs, open timber shelving styled with books and ceramics, and a large woven pendant. Soft daylight; no people.",
  },
  {
    title: "Lived-in modern",
    id: "lived-in-modern",
    summary: "White sofa, oak coffee table and layered neutrals in a calm modern living room.",
    room: "Living room",
    style: "Modern",
    image: "/inspiration/inspo-4.webp",
    prompt:
      "Create a lived-in modern living room with grounded proportions, natural materials, soft neutral textiles and a sophisticated layered mood.",
  },
  {
    title: "Scandinavian shopping moodboard",
    id: "scandi-shopping-moodboard",
    summary: "An annotated living-room shopping board with Scandinavian pieces and example prices.",
    room: "Living room",
    style: "Moodboard",
    image: "/inspiration/inspo-5.webp",
    prompt:
      "Design a Scandinavian living room with a grey three-seat sofa, pale birch coffee table, white bookcases, jute rug and warm wood accents. Practical small-space layout; no people. (Reference is an annotated shopping board; prices shown are examples only.)",
  },
  {
    title: "Quiet sitting nook",
    id: "quiet-sitting-nook",
    summary: "A light corner with a wooden bench, linen cushions, coffee table and olive tree.",
    room: "Living room",
    style: "Warm minimal",
    image: "/inspiration/inspo-6.webp",
    prompt:
      "Create a quiet warm-minimal sitting nook with a wooden bench, linen cushions and chunky knit throw, a small oak coffee table, woven rug and an olive tree in soft daylight; no people.",
  },
  {
    title: "Travertine spa bath",
    id: "travertine-spa-bath",
    summary: "Oval stone tub, floating oak vanity and travertine walls in warm evening light.",
    room: "Bathroom",
    style: "Spa modern",
    image: "/inspiration/inspo-7.webp",
    prompt:
      "Create a spa-modern bathroom with an oval stone tub, floating oak vanity, travertine walls, brass pendants, folded towels and eucalyptus. Warm evening light; no people.",
  },
  {
    title: "Grey marble kitchen",
    id: "grey-marble-kitchen",
    summary: "Grey cabinetry, a waterfall marble island, brass pendants and open shelving.",
    room: "Kitchen",
    style: "Contemporary",
    image: "/inspiration/inspo-8.webp",
    prompt:
      "Create a contemporary kitchen with grey flat-front cabinetry, a waterfall marble island with black leather stools, ribbed brass pendants, marble splashback and styled open shelves. Bright daylight; no people.",
  },
  {
    title: "Slat-wall living room",
    id: "slat-wall-living-room",
    summary: "Light sofa, travertine coffee table and oak slat wall with line art in daylight.",
    room: "Living room",
    style: "Warm minimal",
    image: "/inspiration/inspo-9.webp",
    prompt:
      "Create a warm-minimal living room with a light sofa, travertine coffee table, oak slat feature wall with framed line art, an olive tree and linen curtains in bright daylight; no people.",
  },
  {
    title: "Oak table at sunset",
    id: "oak-table-at-sunset",
    summary: "The same oak dining room as Oak gathering table, seen in low sunset light.",
    room: "Dining room",
    style: "Natural modern",
    image: "/inspiration/discover/11-oak-dining-room.png",
    prompt:
      "Create a warm natural-modern dining room with a long solid-oak table, rush-seat chairs, woven pendants and open shelves of handmade pottery. Low sunset light through tall windows; no people.",
  },
  {
    title: "Oak door detail",
    id: "oak-door-detail",
    summary: "A flush oak door with a black lever, plaster walls and pampas grass nearby.",
    room: "Detail",
    style: "Material-led",
    image: "/inspiration/inspo-11.webp",
    prompt:
      "Study a flush oak door with visible grain and a matte black lever set in smooth plaster walls, pale oak floors and soft daylight. A detail reference for doors and wall finishes.",
  },
  {
    title: "Soft daylight sitting room",
    id: "soft-daylight-sitting-room",
    summary: "Oatmeal sofa, oak coffee table and knit throw in sheer-curtained daylight.",
    room: "Living room",
    style: "Scandinavian",
    image: "/inspiration/inspo-12.webp",
    prompt:
      "Create a soft Scandinavian sitting room with an oatmeal linen sofa, chunky knit throw, light oak coffee table, ceramics and sheer curtains in gentle daylight; no people.",
  },
  {
    title: "Architectural lounge",
    id: "architectural-lounge",
    summary: "Bouclé sofa, slatted wood wall, gallery frames and pools of lamplight at night.",
    room: "Living room",
    style: "Modernist",
    image: "/inspiration/inspo-13.webp",
    prompt:
      "Design an architectural lounge with strong spatial proportions, a low sculptural sofa, stone, wood and warm pools of light.",
  },
  {
    title: "Pergola garden retreat",
    id: "pergola-garden-retreat",
    summary: "A planted garden with a pergola terrace, stone paving, dining set and lounge sofa.",
    room: "Garden",
    style: "Natural",
    image: "/inspiration/inspo-14.webp",
    prompt:
      "Create a lush natural garden with a dark timber pergola terrace, stone paving, a wooden dining set, an outdoor lounge sofa, layered borders, lavender and hydrangeas. Late afternoon; no people.",
  },
  {
    title: "Glass-walled living room",
    id: "glass-walled-living-room",
    summary: "Sunlit seating with black steel glazing, oak sideboard and sculptural coffee table.",
    room: "Living room",
    style: "Modern",
    image: "/inspiration/inspo-15.webp",
    prompt:
      "Create a sunlit modern living room with black steel floor-to-ceiling glazing, an oak sideboard, sculptural oak coffee table, bouclé armchair and an olive tree. Bright daylight; no people.",
  },
  {
    title: "Bright gallery living room",
    id: "bright-gallery-living-room",
    summary: "Grey sofa, oak coffee table and a large monochrome artwork in bright daylight.",
    room: "Living room",
    style: "Minimal",
    image: "/inspiration/inspo-16.webp",
    prompt:
      "Create a bright minimal living room with a grey sofa, light oak coffee table, boucle armchair with a black side table, and one large monochrome artwork. Natural daylight; no people.",
  },
  {
    title: "Rattan-lit bedroom",
    id: "rattan-lit-bedroom",
    summary: "Linen bedding, oak nightstands and woven pendants in a warm plaster bedroom.",
    room: "Bedroom",
    style: "Natural modern",
    image: "/inspiration/inspo-17.webp",
    prompt:
      "Create a natural-modern bedroom with linen bedding in clay tones, an oak frame bed and nightstands, woven rattan pendant and table lamp, limewash walls and soft evening light; no people.",
  },
  {
    title: "Exposed brick detail",
    id: "exposed-brick-detail",
    summary: "Close-up of aged red brick with a sconce, oak shelf, vase and dried grasses.",
    room: "Detail",
    style: "Material-led",
    image: "/inspiration/inspo-18.webp",
    prompt:
      "Study an aged red-brick wall close-up with a black metal sconce, a floating oak shelf styled with a clay vase and dried grasses. A detail reference for brick texture and warm accent lighting.",
  },
  {
    title: "Quiet white sitting room",
    id: "quiet-white-sitting-room",
    summary: "White slipcovered sofa, oak coffee table and rattan chair in a bright white room.",
    room: "Living room",
    style: "Minimal",
    image: "/inspiration/inspo-19.webp",
    prompt:
      "Create a quiet minimal sitting room with a white slipcovered sofa, light oak coffee table, rattan armchair, olive tree and one framed line drawing. Bright natural light; no people.",
  },
  {
    title: "Cane-chair dining room",
    id: "cane-chair-dining-room",
    summary: "Oak dining table with black cane chairs, pottery shelves and a sculptural pendant.",
    room: "Dining room",
    style: "Scandinavian",
    image: "/inspiration/inspo-20.webp",
    prompt:
      "Create a Scandinavian dining room with an oak table, black cane chairs, open shelves of handmade pottery, a black sculptural pendant and tall garden windows. Daylight; no people.",
  },
  {
    title: "Marble-island kitchen",
    id: "marble-island-kitchen",
    summary: "Handleless cream kitchen with a waterfall marble island and brass globe pendants.",
    room: "Kitchen",
    style: "Warm minimal",
    image: "/inspiration/inspo-21.webp",
    prompt:
      "Create a warm-minimal kitchen with handleless cream cabinetry, a waterfall marble island with oak stools, brass globe pendants and a marble splashback. Bright daylight; no people.",
  },
  {
    title: "Chevron oak living room",
    id: "chevron-oak-living-room",
    summary: "Linen sofa, oak coffee table and chevron parquet in a calm window-lit room.",
    room: "Living room",
    style: "Scandinavian",
    image: "/inspiration/inspo-22.webp",
    prompt:
      "Create a calm Scandinavian living room with a linen sofa, oak coffee table, window bench with cushions and chevron parquet floors in soft natural light; no people.",
  },
];

function DiscoverPage({
  onSave,
  savedTitles,
  onCreate,
}: {
  onSave: (reference: InspirationReference) => void;
  savedTitles: string[];
  onCreate: (reference: InspirationReference) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<InspirationEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);
  const [modalImageLoaded, setModalImageLoaded] = useState(false);
  const [cardErrors, setCardErrors] = useState<Record<string, boolean>>({});
  const [cardLoaded, setCardLoaded] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const closeReference = () => {
    setSelected(null);
    setCopied(false);
    setPromptOpen(false);
    setModalImageError(false);
    setModalImageLoaded(false);
  };
  const dialogRef = useDialogFocus(Boolean(selected), closeReference);
  useEffect(() => {
    setModalImageError(false);
    setModalImageLoaded(false);
    setPromptOpen(false);
  }, [selected?.id]);
  const normalizedQuery = query.toLowerCase();
  const filters = [
    "All",
    "Living room",
    "Kitchen",
    "Bedroom",
    "Bathroom",
    "Exterior",
    "Garden",
  ];
  const results = inspirationReferences.filter(
    (entry) =>
      (filter === "All" ||
        entry.room === filter ||
        (filter === "Exterior" &&
          entry.room.toLowerCase().includes("exterior")) ||
        (filter === "Garden" &&
          (entry.room === "Garden" ||
            entry.room.toLowerCase().includes("garden") ||
            ["Courtyard", "Roof terrace", "Poolside"].includes(entry.room)))) &&
      `${entry.title} ${entry.room} ${entry.style} ${entry.prompt}`
        .toLowerCase()
        .includes(normalizedQuery),
  );
  const primaryResults = results.filter((r) => r.room !== "Detail");
  const detailResults = results.filter((r) => r.room === "Detail");
  const hasDetailResults = detailResults.length > 0;
  const renderCard = (entry: InspirationEntry, index: number, visualLen: number) => {
    const hasErr = cardErrors[entry.id];
    if (hasErr) return null;
    return (
      <button
        key={entry.id}
        className={`inspiration-card card-${index % 7}${cardLoaded[entry.id] ? " is-loaded" : ""}`}
        onClick={() => {
          setSelected(entry);
          setCopied(false);
        }}
        aria-label={`Open ${entry.title}, ${entry.style} ${entry.room}`}
      >
        {!hasErr ? (
          <Image
            src={entry.image}
            alt={`${entry.title}, ${entry.style} ${entry.room} reference`}
            fill
            sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
            priority={visualLen > 0 && index % visualLen < 2}
            unoptimized
            onLoad={() => setCardLoaded((m) => ({ ...m, [entry.id]: true }))}
            onError={() => setCardErrors((m) => ({ ...m, [entry.id]: true }))}
          />
        ) : (
          <span className="card-image-error" role="img" aria-label="Image failed to load">
            <ImagesSquare />
            <small>Image unavailable</small>
            <span
              className="card-retry"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setCardErrors((m) => ({ ...m, [entry.id]: false }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setCardErrors((m) => ({ ...m, [entry.id]: false }));
                }
              }}
            >
              Retry
            </span>
          </span>
        )}
        <span className="inspiration-overlay">
          <span>
            <b>{entry.title}</b>
            <small>
              {entry.style} · {entry.room}
            </small>
          </span>
          <i>
            <ArrowRight />
          </i>
        </span>
      </button>
    );
  };
  // CSS columns rebalance cards into visual columns. Eagerly load the first two
  // cards in each desktop column so the first viewport never contains blank tiles.
  const visualColumnLength = Math.ceil(results.length / 4);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    const requestedFilter = params.get("space");
    if (requestedFilter && filters.includes(requestedFilter))
      setFilter(requestedFilter);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    query ? url.searchParams.set("q", query) : url.searchParams.delete("q");
    filter !== "All"
      ? url.searchParams.set("space", filter)
      : url.searchParams.delete("space");
    window.history.replaceState(window.history.state, "", url);
  }, [query, filter]);
  const copyPrompt = async () => {
    if (!selected) return;
    await navigator.clipboard?.writeText(selected.prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="discover-page inspiration-page">
      <h1 className="visually-hidden">Discover design directions</h1>
      <div className="inspiration-tools simple-discover-tools">
        <label className="inspiration-search">
          <MagnifyingGlass />
          <input
            value={query}
            ref={searchRef}
            onChange={(event) => setQuery(event.target.value)}
            name="inspiration-search"
            aria-label="Search inspiration"
            autoComplete="off"
            placeholder="Search rooms, styles, or materials…"
          />
          {query ? (
            <button
              aria-label="Clear inspiration search"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
            >
              <X />
            </button>
          ) : null}
        </label>
        <div
          className="discover-filters"
          role="tablist"
          aria-label="Filter inspiration by space"
        >
          {filters.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <p className="discover-results-count" aria-live="polite">
        {results.length} directions {detailResults.length ? `· ${primaryResults.length} rooms · ${detailResults.length} detail studies` : ""}
      </p>
      <section className="inspiration-grid" aria-label="Design inspiration">
        {primaryResults.map((entry, index) => renderCard(entry, index, visualColumnLength))}
      </section>
      {hasDetailResults && primaryResults.length ? (
        <section className="inspiration-secondary" aria-label="Material and detail studies">
          <h2 className="eyebrow" style={{ margin: "28px 0 12px" }}>Material & detail studies — separate from room photography</h2>
          <div className="inspiration-grid secondary-grid" aria-label="Detail studies">
            {detailResults.map((entry, index) => renderCard(entry, index, 0))}
          </div>
          <p style={{ color: "#8f9187", fontSize: 12, marginTop: 8 }}>Texture and material close-ups, shown separately from room photography.</p>
        </section>
      ) : null}
      {!results.length ? (
        <div className="empty-panel">
          <MagnifyingGlass />
          <h2>No matching directions</h2>
          <p>Try a broader search or choose another space.</p>
          <button
            onClick={() => {
              setQuery("");
              setFilter("All");
            }}
          >
            Show all inspiration
          </button>
        </div>
      ) : null}
      {selected ? (
        <div
          className="inspiration-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReference();
          }}
        >
          <article
            ref={dialogRef}
            className="inspiration-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reference-title"
          >
            <button
              className="reference-close"
              onClick={closeReference}
              aria-label="Close reference"
            >
              <X />
            </button>
            <div className="reference-image">
              {!modalImageLoaded && !modalImageError ? (
                <span className="image-loading" role="status" aria-live="polite">
                  <span className="spinner" aria-hidden="true" /> Loading image…
                </span>
              ) : null}
              {modalImageError ? (
                <span className="card-image-error" role="alert">
                  <ImagesSquare />
                  <small>Image failed to load</small>
                  <button className="card-retry" onClick={() => setModalImageError(false)}>Retry</button>
                </span>
              ) : (
                <Image
                  src={selected.image}
                  alt={`${selected.title}, ${selected.style} ${selected.room} reference`}
                  fill
                  sizes="(max-width: 800px) 100vw, 58vw"
                  priority
                  unoptimized
                  onLoad={() => setModalImageLoaded(true)}
                  onError={() => setModalImageError(true)}
                />
              )}
            </div>
            <div className="reference-details">
              <span className="eyebrow">
                {selected.style} · {selected.room}
              </span>
              <h2 id="reference-title">{selected.title}</h2>
              <p>
                {selected.summary}
              </p>
              <button
                className="reference-save primary-action"
                onClick={() => {
                  const reference = selected;
                  closeReference();
                  onCreate(reference);
                }}
                autoFocus
              >
                <Sparkle /> Use this direction
              </button>
              <details className="reference-prompt-details" open={promptOpen} onToggle={(e) => setPromptOpen((e.target as HTMLDetailsElement).open)}>
                <summary>Design prompt — expand to view</summary>
                <textarea
                  value={selected.prompt}
                  readOnly
                  aria-label="Design prompt"
                  rows={4}
                />
                <button className="copy-prompt copy-prompt-demoted" onClick={copyPrompt} aria-label="Copy design prompt">
                  <CopySimple /> {copied ? "Prompt copied" : "Copy prompt"}
                </button>
              </details>
              <div className="reference-actions secondary-actions">
                <button
                  className="reference-heart secondary-action"
                  onClick={() => onSave(selected)}
                  aria-label={savedTitles.includes(selected.title) ? "Remove from saved inspiration" : "Save this inspiration"}
                  aria-pressed={savedTitles.includes(selected.title)}
                >
                  <Heart fill={savedTitles.includes(selected.title) ? "currentColor" : "none"} />{" "}
                  <span>{savedTitles.includes(selected.title) ? "Saved" : "Save inspiration"}</span>
                </button>
                <small style={{ color: "#8f9187", fontSize: 11 }}>{savedTitles.includes(selected.title) ? "Saved in Library → Saved" : "Saves to Library → Saved"}</small>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}

function LibraryPage({ designs, references, onCreate, onOpenDesign, onOpenReference, onBrowse }: {
  designs: SavedDesign[];
  references: InspirationReference[];
  onCreate: () => void;
  onOpenDesign: (design: SavedDesign) => void;
  onOpenReference: (reference: InspirationReference) => void;
  onBrowse: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "generated" | "uploaded" | "saved">("all");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matchingDesigns = designs.filter((item) => !normalized || `${item.title} ${item.mode} ${item.prompt || ""}`.toLowerCase().includes(normalized));
  const generated = matchingDesigns.filter((item) => Boolean(item.prompt?.trim()));
  const uploaded = matchingDesigns.filter((item) => !item.prompt?.trim());
  const saved = references.filter((item) => !normalized || `${item.title} ${item.room} ${item.style}`.toLowerCase().includes(normalized));
  const total = matchingDesigns.length + saved.length;
  const visibleDesigns = filter === "generated" ? generated : filter === "uploaded" ? uploaded : filter === "saved" ? [] : matchingDesigns;
  const visibleCount = visibleDesigns.length + (filter === "all" || filter === "saved" ? saved.length : 0);
  return <section className="asset-library" aria-labelledby="library-title">
    <header className="asset-library-header">
      <div><span className="eyebrow">Your visual workspace</span><h1 id="library-title">Library</h1><p>Find every design you created or saved, ready to reuse in a project.</p></div>
      <button className="primary-action" onClick={onCreate}><Plus /> New project</button>
    </header>
    <div className="asset-library-tools">
      <label><MagnifyingGlass aria-hidden="true" /><span className="visually-hidden">Search library</span><input name="library-search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your library…" /></label>
      <div role="tablist" aria-label="Filter library">
        <button role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")}>All <span>{total}</span></button>
        <button role="tab" aria-selected={filter === "generated"} onClick={() => setFilter("generated")}>Generated <span>{generated.length}</span></button>
        <button role="tab" aria-selected={filter === "uploaded"} onClick={() => setFilter("uploaded")}>Uploaded <span>{uploaded.length}</span></button>
        <button role="tab" aria-selected={filter === "saved"} onClick={() => setFilter("saved")}>Saved <span>{saved.length}</span></button>
      </div>
    </div>
    {visibleCount ? <div className="asset-library-grid">
      {visibleDesigns.map((design) => <button key={design.id} className="asset-card" onClick={() => onOpenDesign(design)}>
        <span><Image src={design.image} alt="" fill sizes="(max-width:700px) 50vw, 260px" unoptimized={design.image.startsWith("http") || design.image.startsWith("data:")} /><i>{design.prompt?.trim() ? "Generated" : "Uploaded"}</i></span>
        <b>{design.title}</b><small>{design.mode} · {new Intl.DateTimeFormat("en", { month:"short", day:"numeric" }).format(new Date(design.savedAt))}</small>
      </button>)}
      {filter === "all" || filter === "saved" ? saved.map((reference) => <button key={reference.title} className="asset-card" onClick={() => onOpenReference(reference)}>
        <span><Image src={reference.image} alt="" fill sizes="(max-width:700px) 50vw, 260px" unoptimized /><i>Saved</i></span>
        <b>{reference.title}</b><small>{reference.style} · {reference.room}</small>
      </button>) : null}
    </div> : <div className="asset-library-empty"><ImagesSquare /><h2>{query ? "No matching images" : filter === "saved" ? "No saved inspiration yet" : filter === "uploaded" ? "No uploads yet" : filter === "generated" ? "No generations yet" : "Your library is ready"}</h2><p>{query ? "Try another search or filter." : "Create a design or save an image to see it here."}</p><button onClick={onBrowse}>Browse images</button></div>}
  </section>;
}

function SavedPage({
  designs,
  references,
  onCreate,
  onUnsave,
  onUnsaveReference,
  onUseReference,
  onBrowse,
}: {
  designs: SavedDesign[];
  references: InspirationReference[];
  onCreate: () => void;
  onUnsave: (id: string) => void;
  onUnsaveReference: (title: string) => void;
  onUseReference: (reference: InspirationReference) => void;
  onBrowse: () => void;
}) {
  const [tab, setTab] = useState<"designs" | "inspiration" | "models">("designs");
  const [selected, setSelected] = useState<SavedDesign | null>(null);
  const [selectedReference, setSelectedReference] =
    useState<InspirationReference | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const recentModels = useQuery(api.models.list, {});
  const furnitureRows = useQuery(api.furniture.list, {});
  const hasModels = Array.isArray(recentModels) && recentModels.length > 0;
  const hasFurniture = Array.isArray(furnitureRows) && furnitureRows.length > 0;
  const formatSavedDate = (value?: string) => {
    if (!value) return "Saved recently";
    try { return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return "Saved recently"; }
  };
  const moveSavedTab = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    next: "designs" | "inspiration" | "models",
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    setTab(next);
    window.requestAnimationFrame(() =>
      document.getElementById(`saved-tab-${next}`)?.focus(),
    );
  };
  const closeSaved = () => {
    setSelected(null);
    setSelectedReference(null);
  };
  const dialogRef = useDialogFocus(
    Boolean(selected || selectedReference),
    closeSaved,
  );
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest?.(".saved-card-menu-wrap")) setMenuOpen(null);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(null); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);
  const share = async (design: SavedDesign) => {
    const url = new URL(design.image, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: design.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied");
      }
    } catch {
      setShareMessage("Sharing was cancelled");
    }
    window.setTimeout(() => setShareMessage(""), 2600);
  };
  const download = (design: SavedDesign) => {
    const link = document.createElement("a");
    link.href = design.image;
    link.download = `${design.title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
  };
  return (
    <section className="saved-page" aria-labelledby="saved-title">
      <header className="saved-heading">
        <div>
          <h1 id="saved-title">Saved</h1>
          <p>{designs.length + references.length} saved · Bookmarks, not working documents. Projects holds your editable work.</p>
        </div>
        <p className="saved-heading-meta" aria-hidden="true">{designs.length} designs · {references.length} inspiration</p>
      </header>
      <p className="saved-clarify">Your saved designs, inspiration, and 3D models live here. Editable rooms stay in Projects.</p>
      <div
        className="saved-tabs"
        role="tablist"
        aria-label="Saved content type"
      >
        <button
          id="saved-tab-designs"
          role="tab"
          aria-selected={tab === "designs"}
          aria-controls="saved-panel"
          tabIndex={tab === "designs" ? 0 : -1}
          onKeyDown={(event) => moveSavedTab(event, "inspiration")}
          onClick={() => setTab("designs")}
        >
          Designs <span>{designs.length}</span>
        </button>
        <button
          id="saved-tab-inspiration"
          role="tab"
          aria-selected={tab === "inspiration"}
          aria-controls="saved-panel"
          tabIndex={tab === "inspiration" ? 0 : -1}
          onKeyDown={(event) => moveSavedTab(event, tab === "designs" ? "models" : "designs")}
          onClick={() => setTab("inspiration")}
        >
          Inspiration <span>{references.length}</span>
        </button>
        <button
          id="saved-tab-models"
          role="tab"
          aria-selected={tab === "models"}
          aria-controls="saved-panel"
          tabIndex={tab === "models" ? 0 : -1}
          onKeyDown={(event) => moveSavedTab(event, "inspiration")}
          onClick={() => setTab("models")}
        >
          3D <span>{recentModels?.length ?? 0}</span>
        </button>
      </div>
      {tab === "designs" && designs.length ? (
        <div
          id="saved-panel"
          role="tabpanel"
          aria-labelledby="saved-tab-designs"
          className="saved-masonry"
          aria-label="Saved designs"
        >
          {designs.map((design, index) => {
            const hasErr = imageErrors[design.id];
            return (
              <article className={`saved-card saved-tile-${index % 4} ${menuOpen === design.id ? "has-menu-open" : ""}`} key={design.id}>
                <button className="saved-card-image" onClick={() => { setSelected(design); setShareMessage(""); }} aria-label={`Open ${design.title}`}>
                  {!hasErr ? (
                    <Image
                      src={design.image}
                      alt={design.title}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
                      unoptimized={design.image.startsWith("data:") || design.image.startsWith("http")}
                      onError={() => setImageErrors((m) => ({ ...m, [design.id]: true }))}
                    />
                  ) : (
                    <span className="card-image-error" role="img" aria-label="Image failed to load">
                      <ImagesSquare />
                      <small>Image unavailable</small>
                      <button className="card-retry" onClick={(e) => { e.stopPropagation(); setImageErrors((m) => ({ ...m, [design.id]: false })); }} aria-label={`Retry ${design.title}`}>Retry</button>
                    </span>
                  )}
                </button>
                <div className="saved-card-meta">
                  <div className="saved-card-info"><b>{design.title}</b><small>Design · {design.mode} · {formatSavedDate(design.savedAt)}</small></div>
                  <button className="saved-card-open" onClick={() => { setSelected(design); setShareMessage(""); }}>Open</button>
                  <div className="saved-card-menu-wrap">
                    <button className="saved-card-more" aria-label={`More actions for ${design.title}`} aria-haspopup="menu" aria-expanded={menuOpen === design.id} onClick={() => setMenuOpen((v) => (v === design.id ? null : design.id))}><DotsThree /></button>
                    {menuOpen === design.id ? <div className="saved-overflow-menu" role="menu"><button role="menuitem" onClick={() => { setMenuOpen(null); share(design); }}><ShareNetwork /> Share</button><button role="menuitem" onClick={() => { setMenuOpen(null); download(design); }}><DownloadSimple /> Download</button><button role="menuitem" onClick={() => { setMenuOpen(null); onUnsave(design.id); }}><TrashSimple /> Remove</button></div> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : tab === "inspiration" && references.length ? (
        <div
          id="saved-panel"
          role="tabpanel"
          aria-labelledby="saved-tab-inspiration"
          className="saved-masonry"
          aria-label="Saved inspiration"
        >
          {references.map((reference, index) => {
            const hasErr = imageErrors[reference.title];
            return (
              <article className={`saved-card saved-tile-${index % 4} ${menuOpen === reference.title ? "has-menu-open" : ""}`} key={reference.title}>
                <button className="saved-card-image" onClick={() => { setSelectedReference(reference); setShareMessage(""); }} aria-label={`Open ${reference.title}`}>
                  {!hasErr ? (
                    <Image src={reference.image} alt={reference.title} fill sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw" unoptimized onError={() => setImageErrors((m) => ({ ...m, [reference.title]: true }))} />
                  ) : (
                    <div className="card-image-error" aria-label="Image failed to load"><ImagesSquare aria-hidden="true" /><small>Image unavailable</small><button type="button" className="card-retry" onClick={(e) => { e.stopPropagation(); setImageErrors((m) => ({ ...m, [reference.title]: false })); }} aria-label={`Retry ${reference.title}`}>Retry</button></div>
                  )}
                </button>
                <div className="saved-card-meta">
                  <div className="saved-card-info"><b>{reference.title}</b><small>Inspiration · {reference.style} · {reference.room}</small></div>
                  <button className="saved-card-open" onClick={() => { setSelectedReference(reference); setShareMessage(""); }}>Open</button>
                  <div className="saved-card-menu-wrap">
                    <button className="saved-card-more" aria-label={`More actions for ${reference.title}`} aria-haspopup="menu" aria-expanded={menuOpen === reference.title} onClick={() => setMenuOpen((v) => (v === reference.title ? null : reference.title))}><DotsThree /></button>
                    {menuOpen === reference.title ? <div className="saved-overflow-menu" role="menu"><button role="menuitem" onClick={() => { setMenuOpen(null); onUseReference(reference); }}><Sparkle /> Use direction</button><button role="menuitem" onClick={() => { setMenuOpen(null); share({ id: reference.title, title: reference.title, image: reference.image, mode: "Interior", savedAt: "" }); }}><ShareNetwork /> Share</button><button role="menuitem" onClick={() => { setMenuOpen(null); download({ id: reference.title, title: reference.title, image: reference.image, mode: "Interior", savedAt: "" }); }}><DownloadSimple /> Download</button><button role="menuitem" onClick={() => { setMenuOpen(null); onUnsaveReference(reference.title); }}><TrashSimple /> Remove</button></div> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : tab === "models" ? (
        <div id="saved-panel" role="tabpanel" aria-labelledby="saved-tab-models" className="saved-masonry" aria-label="Saved 3D models">
          {recentModels === undefined ? (
            <div className="saved-empty small-empty" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" /><p>Loading 3D assets…</p></div>
          ) : hasModels ? (
            recentModels.map((m: any, i: number) => (
              <article key={m.taskId} className={`saved-card saved-tile-${i % 4}`}>
                <a className="saved-card-image" href={m.url} target="_blank" rel="noreferrer" aria-label={`Open 3D model ${i + 1}`}><img src={m.url} alt={`3D model preview ${i + 1}`} width="640" height="480" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /><span className="card-badge">3D · GLB</span></a>
                <div className="saved-card-meta"><div className="saved-card-info"><b>3D model {recentModels.length - i}</b><small>Generated · {new Date(m.createdAt).toLocaleDateString()}</small></div><a className="saved-card-open" href={m.url} download target="_blank" rel="noreferrer">Download</a></div>
              </article>
            ))
          ) : hasFurniture ? (
            furnitureRows.map((f: any, i: number) => (
              <article key={f._id} className={`saved-card saved-tile-${i % 4}`}>
                <div className="saved-card-image" aria-label={f.name}><img src={f.thumbnail || "/pictures/interior-design-cover.png"} alt={f.name} width="640" height="480" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><span className="card-badge">{f.category || f.source}</span></div>
                <div className="saved-card-meta"><div className="saved-card-info"><b>{f.name}</b><small>{f.category || "Furniture"} · {f.style || "Catalog"}</small></div><span className="saved-card-open" style={{ opacity: 0.6 }}>Catalog</span></div>
              </article>
            ))
          ) : (
            <div className="saved-empty small-empty">
              <span><Cube /></span>
              <h2>No 3D models yet</h2>
              <p>Your generated 3D models will appear here after you create one in the studio.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="saved-empty">
          <span>
            <Heart />
          </span>
          <h2>
            {tab === "designs"
              ? "No saved designs yet"
              : tab === "inspiration" ? "No saved inspiration yet" : "No 3D assets"}
          </h2>
          <p>
            {tab === "designs"
              ? "Generate a design you love, then save it here for later. Your working documents stay in Projects."
              : "Save a direction from Discover to keep it close. Bookmarks don’t move your projects."}
          </p>
          <button
            className="primary-action"
            onClick={tab === "designs" ? onCreate : onBrowse}
          >
            {tab === "designs" ? (
              <>
                <Sparkle /> Generate a design
              </>
            ) : (
              <>
                <MagnifyingGlass /> Browse inspiration
              </>
            )}
          </button>
        </div>
      )}
      {selected ? (
        <div
          className="saved-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <article
            ref={dialogRef}
            className="saved-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-design-title"
          >
            <button
              className="saved-modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close saved design"
            >
              <X />
            </button>
            <div className="saved-modal-image">
              <Image
                src={selected.image}
                alt={selected.title}
                fill
                sizes="(max-width: 800px) 100vw, 70vw"
                priority
              />
            </div>
            <footer>
              <div>
                <h2 id="saved-design-title">{selected.title}</h2>
                <p>{selected.mode} concept · Saved design</p>
              </div>
              <div className="saved-modal-actions">
                <button
                  onClick={() => {
                    onUnsave(selected.id);
                    setSelected(null);
                  }}
                >
                  <Heart fill="currentColor" /> Unsave
                </button>
                <button onClick={() => share(selected)}>
                  <ShareNetwork /> Share
                </button>
                <button
                  className="primary-action"
                  onClick={() => download(selected)}
                >
                  <DownloadSimple /> Download
                </button>
              </div>
              <p className="saved-share-status" role="status">
                {shareMessage}
              </p>
            </footer>
          </article>
        </div>
      ) : null}
      {selectedReference ? (
        <div
          className="saved-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSaved();
          }}
        >
          <article
            ref={dialogRef}
            className="saved-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-reference-title"
          >
            <button
              className="saved-modal-close"
              onClick={closeSaved}
              aria-label="Close saved inspiration"
            >
              <X />
            </button>
            <div className="saved-modal-image">
              <Image
                src={selectedReference.image}
                alt={selectedReference.title}
                fill
                sizes="(max-width: 800px) 100vw, 70vw"
                priority
              />
            </div>
            <footer>
              <div>
                <h2 id="saved-reference-title">{selectedReference.title}</h2>
                <p>
                  {selectedReference.style} · {selectedReference.room}
                </p>
              </div>
              <div className="saved-modal-actions">
                <button
                  onClick={() => {
                    onUnsaveReference(selectedReference.title);
                    closeSaved();
                  }}
                >
                  <Heart fill="currentColor" /> Unsave
                </button>
                <button
                  onClick={() =>
                    share({
                      id: selectedReference.title,
                      title: selectedReference.title,
                      image: selectedReference.image,
                      mode: "Interior",
                      savedAt: "",
                    })
                  }
                >
                  <ShareNetwork /> Share
                </button>
                <button
                  className="primary-action"
                  onClick={() => onUseReference(selectedReference)}
                >
                  <Sparkle /> Use direction
                </button>
                <button
                  onClick={() =>
                    download({
                      id: selectedReference.title,
                      title: selectedReference.title,
                      image: selectedReference.image,
                      mode: "Interior",
                      savedAt: "",
                    })
                  }
                >
                  <DownloadSimple /> Download
                </button>
              </div>
              <p className="saved-share-status" role="status">
                {shareMessage}
              </p>
            </footer>
          </article>
        </div>
      ) : null}
    </section>
  );
}

type StudioTab =
  | "brief"
  | "moodboard"
  | "design"
  | "layout"
  | "specify"
  | "export";

function ThreeDLaunchPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="three-d-launch-page">
      <header className="three-d-launch-bar">
        <button className="album-back" onClick={onBack}>
          <ArrowLeft /> Projects
        </button>
        <div>
          <span className="eyebrow">3D & augmented reality</span>
          <strong>Furniture model studio</strong>
        </div>
      </header>
      <ThreeDWorkspace />
    </div>
  );
}

function ProjectStudio({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<StudioTab>("brief");
  const [version, setVersion] = useState<"Original" | "Concept 03">(
    "Concept 03",
  );
  const [selectedObject, setSelectedObject] = useState("Sofa");
  const [activityOpen, setActivityOpen] = useState(false);
  const steps: { id: StudioTab; label: string; detail: string }[] = [
    { id: "brief", label: "Room", detail: "Understand space" },
    { id: "moodboard", label: "Mood board", detail: "Find direction" },
    { id: "design", label: "Design", detail: "Generate & edit" },
    { id: "layout", label: "3D layout", detail: "Plan the room" },
    { id: "specify", label: "Materials", detail: "Save selections" },
    { id: "export", label: "Export", detail: "Share package" },
  ];
  return (
    <div className="studio-page">
      <div className="studio-heading">
        <div>
          <button className="back-button" onClick={onBack}>
            <ArrowLeft /> Projects
          </button>
          <span className="eyebrow">Emma Laurent · Living room</span>
          <h1>Bordeaux residence</h1>
          <p>Last saved just now · Concept 03</p>
        </div>
        <div className="studio-actions">
          <button onClick={() => setActivityOpen(!activityOpen)}>
            <Cube /> Room data
          </button>
          <button
            className="share-button"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            <ShareNetwork /> Copy design link
          </button>
        </div>
      </div>
      <nav
        className="studio-steps simplified-steps"
        aria-label="Design workflow"
      >
        {steps.map((step, index) => (
          <button
            key={step.id}
            className={tab === step.id ? "active" : ""}
            onClick={() => setTab(step.id)}
            aria-current={tab === step.id ? "step" : undefined}
          >
            <span>{index + 1}</span>
            <b>{step.label}</b>
            <small>{step.detail}</small>
            {step.id === "layout" ? <i>New</i> : null}
          </button>
        ))}
      </nav>
      {activityOpen ? (
        <aside className="activity-popover" aria-label="Team activity">
          <div>
            <b>Project team</b>
            <button
              aria-label="Close team activity"
              onClick={() => setActivityOpen(false)}
            >
              <X />
            </button>
          </div>
          <p>
            <span>AI</span>
            <b>Ismail</b> updated the budget <small>2 min ago</small>
          </p>
          <p>
            <span>EL</span>
            <b>Emma</b> commented on Concept 03 <small>Yesterday</small>
          </p>
          <button>
            <UserPlus /> Invite collaborator
          </button>
        </aside>
      ) : null}
      {tab === "brief" ? <ProjectBrief /> : null}
      {tab === "moodboard" ? <MoodBoard /> : null}
      {tab === "design" ? (
        <DesignStudio
          version={version}
          setVersion={setVersion}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
        />
      ) : null}
      {tab === "layout" ? <ThreeDWorkspace /> : null}
      {tab === "specify" ? <Specifications /> : null}
      {tab === "export" ? <ExportWorkspace /> : null}
    </div>
  );
}

function DesignStudio({
  version,
  setVersion,
  selectedObject,
  setSelectedObject,
}: {
  version: "Original" | "Concept 03";
  setVersion: (value: "Original" | "Concept 03") => void;
  selectedObject: string;
  setSelectedObject: (value: string) => void;
}) {
  const [tool, setTool] = useState("Select");
  const [editText, setEditText] = useState("");
  const [notice, setNotice] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareMode, setCompareMode] = useState<"split" | "slider">("split");
  const [comparePosition, setComparePosition] = useState(50);
  const objects = ["Sofa", "Coffee table", "Rug", "Wall", "Windows", "Floor"];
  const applyEdit = () => {
    setNotice(
      editText
        ? `Edit queued for ${selectedObject}`
        : "Describe the change first",
    );
  };
  return (
    <section className="design-studio">
      <div className="canvas-toolbar" aria-label="Editing tools">
        {["Select", "Protect", "Remove", "Replace", "Measure"].map((item) => (
          <button
            key={item}
            className={tool === item ? "active" : ""}
            onClick={() => setTool(item)}
          >
            {item === "Measure" ? (
              <Ruler />
            ) : item === "Remove" ? (
              <TrashSimple />
            ) : item === "Replace" ? (
              <Sparkle />
            ) : item === "Protect" ? (
              <Check />
            ) : (
              <PencilSimple />
            )}
            {item}
          </button>
        ))}
        <i />
        <button>
          <ClockCounterClockwise /> Versions
        </button>
        <button onClick={() => setCompareOpen(true)}>
          <Eye /> Compare
        </button>
      </div>
      <div className="studio-canvas">
        <div className="canvas-image">
          <Image
            src={
              version === "Original"
                ? "/pictures/interior-design-cover.png"
                : "/pictures/interior-design-style-japandi.png"
            }
            alt={`${version} living room`}
            fill
            priority
            sizes="(max-width: 1000px) 100vw, 62vw"
          />
          <span className="canvas-label">{version}</span>
          {tool !== "Measure" ? (
            <button
              className="object-target"
              aria-label={`Selected ${selectedObject}`}
            >
              {selectedObject}
            </button>
          ) : (
            <>
              <span className="measure-line horizontal">4.8 m</span>
              <span className="measure-line vertical">3.6 m</span>
            </>
          )}
        </div>
        <aside className="editor-panel">
          <div className="version-toggle">
            <button
              className={version === "Original" ? "active" : ""}
              onClick={() => setVersion("Original")}
            >
              Before
            </button>
            <button
              className={version === "Concept 03" ? "active" : ""}
              onClick={() => setVersion("Concept 03")}
            >
              Concept 03
            </button>
          </div>
          <div className="detected-heading">
            <div>
              <span className="eyebrow">Detected objects</span>
              <b>Choose what to change</b>
            </div>
            <span>{objects.length}</span>
          </div>
          <div className="object-list">
            {objects.map((object) => (
              <button
                key={object}
                className={selectedObject === object ? "selected" : ""}
                onClick={() => setSelectedObject(object)}
              >
                <span>{object.slice(0, 2).toUpperCase()}</span>
                {object}
                <Check />
              </button>
            ))}
          </div>
          <label className="edit-prompt">
            <span>Edit {selectedObject}</span>
            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              placeholder={`Describe how to change the ${selectedObject.toLowerCase()}…`}
            />
            <button onClick={applyEdit}>
              Apply edit <ArrowUp />
            </button>
          </label>
          <p className="editor-notice" aria-live="polite">
            {notice || "Only the selected object will change."}
          </p>
          <button className="floorplan-button">
            <Ruler />
            <span>
              <b>Measurements & floor plan</b>
              <small>4.8 × 3.6 m · Floor plan attached</small>
            </span>
            <ArrowRight />
          </button>
        </aside>
      </div>
      {compareOpen ? (
        <div
          className="compare-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCompareOpen(false);
          }}
        >
          <section
            className="compare-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-title"
          >
            <header>
              <div>
                <span className="eyebrow">Version comparison</span>
                <h2 id="compare-title">Original vs Concept 03</h2>
                <p>
                  Check that the room structure stayed intact before refining
                  the design.
                </p>
              </div>
              <button
                onClick={() => setCompareOpen(false)}
                aria-label="Close comparison"
              >
                <X />
              </button>
            </header>
            <div className="compare-controls">
              <div role="tablist" aria-label="Comparison mode">
                <button
                  role="tab"
                  aria-selected={compareMode === "split"}
                  onClick={() => setCompareMode("split")}
                >
                  Side by side
                </button>
                <button
                  role="tab"
                  aria-selected={compareMode === "slider"}
                  onClick={() => setCompareMode("slider")}
                >
                  Overlay slider
                </button>
              </div>
              <span>
                <CheckCircle /> Openings protected
              </span>
            </div>
            {compareMode === "split" ? (
              <div className="compare-split">
                <figure>
                  <Image
                    src="/pictures/interior-design-cover.png"
                    alt="Original living room"
                    fill
                    sizes="(max-width: 850px) 100vw, 45vw"
                  />
                  <figcaption>Before · Original room</figcaption>
                </figure>
                <figure>
                  <Image
                    src="/pictures/interior-design-style-japandi.png"
                    alt="Concept 03 redesigned living room"
                    fill
                    sizes="(max-width: 850px) 100vw, 45vw"
                  />
                  <figcaption>After · Concept 03</figcaption>
                </figure>
              </div>
            ) : (
              <div className="compare-slider-wrap">
                <div className="compare-slider">
                  <Image
                    src="/pictures/interior-design-cover.png"
                    alt="Original living room"
                    fill
                    sizes="(max-width: 850px) 100vw, 80vw"
                  />
                  <div
                    className="compare-reveal"
                    style={{ width: `${comparePosition}%` }}
                  >
                    <Image
                      src="/pictures/interior-design-style-japandi.png"
                      alt="Concept 03 redesigned living room"
                      fill
                      sizes="(max-width: 850px) 100vw, 80vw"
                    />
                    <span>Concept 03</span>
                  </div>
                  <i style={{ left: `${comparePosition}%` }} />
                  <b className="compare-before">Original</b>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparePosition}
                    onChange={(event) =>
                      setComparePosition(Number(event.target.value))
                    }
                    aria-label="Adjust before and after comparison"
                  />
                </div>
              </div>
            )}
            <footer>
              <p>
                Changes: furnishings, lighting, palette and styling. Preserved:
                walls, windows, floor plan.
              </p>
              <button
                className="primary-action"
                onClick={() => setCompareOpen(false)}
              >
                Continue editing <ArrowRight />
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}



function ThreeDWorkspace({ initialSource = null, onBusyChange, onModelReady, onSourceSelected, compact = false }: { initialSource?: ThreeDSource | null; onBusyChange?: (busy: boolean) => void; onModelReady?: (url: string, poster: string | null) => void; onSourceSelected?: (image: string) => void; compact?: boolean } = {}) {
  const { user } = useUser();
  const trackingKey = user?.id ? `housora:tripo:${user.id}` : null;
  const recentModels = useQuery(api.models.list, {});
  const createModelShare = useMutation(api.models.createShare);
  const revokeModelShare = useMutation(api.models.revokeShare);
  const [modelSaved, setModelSaved] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [source, setSource] = useState<ThreeDSource | null>(initialSource);
  const [imagePreview, setImagePreview] = useState<string | null>(initialSource?.image || null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "queued" | "running" | "success" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelPoster, setModelPoster] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [trackingPaused, setTrackingPaused] = useState(false);
  useEffect(() => {
    if (!trackingKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(trackingKey) || "null");
      if (saved?.taskId && saved?.trackingToken && Date.now() - saved.createdAt < 23 * 60 * 60_000) {
        setTaskId(saved.taskId); setTrackingToken(saved.trackingToken); setStatus("queued");
      }
    } catch { /* Private browsing may disable local storage. */ }
  }, [trackingKey]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const startedAt = Date.now();
    const readTask = async () => {
      try {
        const query = trackingToken ? `?trackingToken=${encodeURIComponent(trackingToken)}` : "";
        const response = await fetch(`/api/tripo/tasks/${encodeURIComponent(taskId)}${query}`, { cache: "no-store", signal: AbortSignal.timeout(180_000) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not check the 3D model.");
        if (cancelled) return;
        failures = 0;
        setError("");
        setProgress(result.progress || 0);
        if (result.status === "success") {
          if (!result.modelUrl) throw new Error("Tripo completed without a model file.");
          setModelUrl(result.modelUrl);
          setModelPoster(result.previewUrl || null);
          setModelSaved(result.persisted === true);
          setError(result.storageWarning || "");
          setStatus("success");
          if (trackingKey) { try { localStorage.removeItem(trackingKey); } catch {} }
          return;
        }
        if (["failed", "banned", "expired", "cancelled"].includes(result.status)) {
          setError(result.error || `Tripo ended with status: ${result.status}.`);
          setStatus("failed");
          setTaskId(null);
          if (trackingKey) { try { localStorage.removeItem(trackingKey); } catch {} }
          return;
        }
        setStatus(result.status === "running" ? "running" : "queued");
        if (Date.now() - startedAt > 15 * 60_000) {
          setTrackingPaused(true);
          setError("This model is taking longer than expected. Check its status without creating a second request.");
          return;
        }
        timer = setTimeout(readTask, 5000);
      } catch (reason) {
        if (!cancelled) {
          failures += 1;
          setError("Connection interrupted. Your model may still be running; no new generation will be submitted.");
          if (failures < 4) timer = setTimeout(readTask, 5000 * failures);
          else setTrackingPaused(true);
        }
      }
    };
    readTask();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [taskId, trackingToken, pollAttempt, trackingKey]);

  const chooseImage = (file?: File) => {
    if (submitting.current || status === "uploading" || status === "queued" || status === "running") return;
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Use a JPG, PNG or WEBP image under 10 MB.");
      return;
    }
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setSource({ image: preview, kind: "furniture-upload" });
    onSourceSelected?.(preview);
    setModelUrl(null);
    setTaskId(null);
    setTrackingToken(null);
    setStatus("idle");
    setProgress(0);
    setError("");
  };

  const generateModel = async () => {
    const validation = isValidThreeDSource(source);
    if (!validation.valid || !imagePreview || submitting.current || status === "uploading" || status === "queued" || status === "running") { setError(validation.reason || "Choose a furniture image first."); return; }
    submitting.current = true;
    setStatus("uploading");
    setError("");
    setProgress(0);
    try {
      const form = new FormData();
      const pixels = await prepareImage(imagePreview);
      const blob = await (await fetch(pixels)).blob();
      form.append("image", blob, "furniture.jpg");
      form.append("confirmed", "true");
      form.append("requestId", safeUUID());
      form.append("sourceKind", source!.kind);
      if (source!.objectBox) form.append("sourceBox", JSON.stringify(source!.objectBox));
      const response = await fetch("/api/tripo/generate", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start 3D generation.");
      if (!result.taskId || !result.trackingToken) {
        throw new Error("The 3D service returned an incomplete task. Contact support before trying again.");
      }
      setTaskId(result.taskId);
      setTrackingToken(result.trackingToken);
      if (trackingKey) { try { localStorage.setItem(trackingKey, JSON.stringify({ taskId: result.taskId, trackingToken: result.trackingToken, createdAt: Date.now() })); } catch {} }
      setStatus("queued");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start 3D generation.");
      setStatus("failed");
    } finally {
      submitting.current = false;
    }
  };

  const busy = status === "uploading" || status === "queued" || status === "running";
  const sourceValidation = isValidThreeDSource(source);
  const userFacingError = /TRIPO_API_KEY|authentication|Tripo|provider/i.test(error)
    ? "3D creation is temporarily unavailable. No credits were used. Please try again later."
    : error;
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => { if (modelUrl) onModelReady?.(modelUrl, modelPoster); }, [modelUrl, modelPoster, onModelReady]);
  return (
    <section className="three-d-workspace tripo-workspace">
      {!compact ? <header className="three-d-heading">
        <div>
          <span className="eyebrow"><Cube /> Image to 3D</span>
          <h2>Turn furniture into a 3D model.</h2>
          <p>Use one clear furniture photo. Housora builds the model here; when it is ready, you can rotate it, download it, or place it in your room with AR.</p>
        </div>
        {modelUrl ? <span className="integration-ready"><CheckCircle /> 3D model ready</span> : null}
      </header> : null}

      <div className="tripo-grid">
        <div className="tripo-stage" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); event.stopPropagation(); chooseImage(event.dataTransfer.files[0]); }}>
          {modelUrl ? (
            <ModelViewer src={modelUrl} poster={modelPoster} />
          ) : imagePreview ? (
            <div className="tripo-source-preview">
              <Image src={imagePreview} alt="Furniture selected for 3D generation" fill sizes="(max-width: 900px) 100vw, 65vw" unoptimized />
              {busy ? (
                <div className="tripo-progress" role="status" aria-live="polite">
                  <span className="spinner" />
                  <b>{status === "uploading" ? "Uploading securely…" : status === "queued" ? "Preparing your model…" : "Building your 3D model…"}</b>
                  <small>{progress ? `${Math.round(progress)}% complete` : "This usually takes one or two minutes."}</small>
                  <i><em style={{ width: `${Math.max(4, progress)}%` }} /></i>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="tripo-empty" onClick={() => inputRef.current?.click()}>
              <UploadSimple />
              <b>Drag a furniture photo here</b>
              <span>or click to browse — use one complete object on a simple background.</span>
              <small>JPG, PNG or WEBP · Up to 10 MB</small>
            </button>
          )}
        </div>

        <aside className="tripo-panel">
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              chooseImage(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          <span className="eyebrow">Furniture photo → 3D model</span>
          <h3>{modelUrl ? "Your model is ready" : "Create your model"}</h3>
          <p>{modelUrl ? "Drag to rotate. Open on your phone to view it in your room." : "Upload a photo of one complete piece of furniture, on a plain background."}</p>
          <ol className="tripo-steps">
            <li className={imagePreview ? "complete" : "active"}><span>1</span><b>Choose furniture</b></li>
            <li className={busy ? "active" : modelUrl ? "complete" : ""}><span>2</span><b>Create 3D model</b></li>
            <li className={modelUrl ? "active" : ""}><span>3</span><b>Preview or View in AR</b></li>
          </ol>
          {userFacingError ? <p className="integration-error" role="alert">{userFacingError}</p> : null}
          {trackingPaused ? <button onClick={() => { setTrackingPaused(false); setPollAttempt(value => value + 1); }}>Check existing model status · no extra credits</button> : null}
          <div className="tripo-actions">
            <button onClick={() => inputRef.current?.click()} disabled={busy}>
              <UploadSimple /> {image ? "Replace image" : "Choose image"}
            </button>
            {!modelUrl ? (
              <button className="primary-action" onClick={() => setConfirmOpen(true)} disabled={!sourceValidation.valid || busy} title={sourceValidation.reason}>
                {busy ? <><span className="spinner" /> Generating…</> : <><Cube /> Generate 3D · {AI_COSTS.model3d} credits</>}
              </button>
            ) : (
              <>
                <a className="primary-action" href={modelUrl} download target="_blank" rel="noreferrer">
                  <DownloadSimple /> Download GLB
                </a>
                <button
                  onClick={async () => {
                    try {
                      if (!taskId || !modelSaved) throw new Error("Wait until the model is saved before sharing.");
                      const token = shareToken || await createModelShare({ taskId });
                      setShareToken(token);
                      const arUrl = `${window.location.origin}/ar?token=${encodeURIComponent(token)}${modelPoster ? `&poster=${encodeURIComponent(modelPoster)}` : ""}`;
                      await navigator.clipboard.writeText(arUrl);
                      setError("Secure AR link copied. You can revoke it at any time.");
                    } catch (reason) {
                      setError(reason instanceof Error ? reason.message : "Couldn't create the secure AR link.");
                    }
                  }}
                >
                  <ShareNetwork /> {shareToken ? "Copy secure AR link" : "Create secure AR link"}
                </button>
                {shareToken ? <button onClick={async () => { try { await revokeModelShare({ token: shareToken }); setShareToken(null); setError("AR share link revoked."); } catch { setError("The share link could not be revoked. Try again."); } }}>Revoke AR link</button> : null}
              </>
            )}
          </div>
          <small className="tripo-expiry-note">{modelSaved ? "Saved to your account. Shared links work only for people you send them to. " : ""}Generated dimensions are approximate. Confirm measurements before buying.</small>
          {recentModels?.length ? <div className="tripo-recent-models"><h3>Saved models</h3>{recentModels.filter(model => model.url).map((model, index) => <button key={model.taskId} disabled={busy} onClick={() => { setTaskId(model.taskId); setModelUrl(model.url); setModelPoster(null); setModelSaved(true); setShareToken(null); setStatus("success"); setError(""); }}>Open model {recentModels.length - index} · {new Date(model.createdAt).toLocaleDateString()}</button>)}</div> : null}
        </aside>
      </div>
      <CreditConfirmation open={confirmOpen} cost={AI_COSTS.model3d} title="Create this 3D model?"
        description="Use this image to create a textured 3D model. Failed generations return your Housora credits. AI models are approximations, not measured replicas."
        action="Create 3D" onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); void generateModel(); }} />
    </section>
  );
}



function ArWorkspace({ onCreateModel }: { onCreateModel: () => void }) {
  const recentModels = useQuery(api.models.list, {});
  const createArShare = useMutation(api.models.createShare);
  const readyModels = recentModels?.filter(model => Boolean(model.url)) ?? [];
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const selectedModel = readyModels.find(model => model.taskId === selectedTaskId) ?? readyModels[0] ?? null;
  const openSecureAr = async () => {
    if (!selectedModel) return;
    setCopyStatus("");
    try {
      const token = await createArShare({ taskId: selectedModel.taskId });
      window.location.assign(`/ar?token=${encodeURIComponent(token)}`);
    } catch {
      setCopyStatus("Could not create a secure AR link. Try again.");
    }
  };
  const copySecureAr = async () => {
    if (!selectedModel) return;
    setCopyStatus("");
    try {
      const token = await createArShare({ taskId: selectedModel.taskId });
      await navigator.clipboard.writeText(`${window.location.origin}/ar?token=${encodeURIComponent(token)}`);
      setCopyStatus("Secure AR link copied.");
    } catch {
      setCopyStatus("Could not copy a secure AR link. Try again.");
    }
  };
  return <section className="ar-workspace" aria-labelledby="ar-workspace-title">
    <header className="ar-workspace-heading">
      <span className="eyebrow"><Smartphone /> Augmented reality</span>
      <h2 id="ar-workspace-title">Place a 3D model in your room.</h2>
      <p>AR needs a finished 3D model — not a flat JPG or PNG. Choose one below, then open it on a compatible phone and allow camera access.</p>
    </header>
    {recentModels === undefined ? <div className="ar-model-empty" role="status"><span className="spinner" /><b>Loading your 3D models…</b></div> : readyModels.length === 0 ? <div className="ar-model-empty">
      <span><Cube /></span><h3>No AR-ready models yet</h3><p>Start with a normal furniture photo. Housora will turn it into a 3D model first, then bring you back to AR.</p><button className="primary-action" onClick={onCreateModel}><Cube /> Create a 3D model</button>
    </div> : <div className="ar-workspace-layout">
      <aside className="ar-model-library" aria-label="Choose a saved 3D model">
        <div><b>Your 3D models</b><small>{readyModels.length} ready for AR</small></div>
        {readyModels.map((model, index) => <button key={model.taskId} aria-pressed={selectedModel?.taskId === model.taskId} onClick={() => { setSelectedTaskId(model.taskId); setCopyStatus(""); }}>
          <span><Cube /></span><span><b>Furniture model {readyModels.length - index}</b><small>Ready · {new Date(model.createdAt).toLocaleDateString()}</small></span><ArrowRight />
        </button>)}
        <button className="ar-create-another" onClick={onCreateModel}><Plus /> Create from a furniture photo</button>
      </aside>
      <div className="ar-preview-stage">
        {selectedModel?.url ? <><ModelViewer src={selectedModel.url} /><div className="ar-preview-actions"><button className="primary-action" onClick={() => void openSecureAr()}><Smartphone /> Open AR view</button><button onClick={() => void copySecureAr()}><CopySimple /> Copy phone link</button></div><p role="status" aria-live="polite">{copyStatus}</p></> : <div className="ar-preview-placeholder"><Smartphone /><h3>Choose a model</h3><p>You will preview it here before opening the camera.</p></div>}
      </div>
    </div>}
    <footer className="ar-how-it-works"><span><b>1</b> Choose a 3D model</span><ArrowRight /><span><b>2</b> Open on your phone</span><ArrowRight /><span><b>3</b> Tap a floor to place it</span></footer>
  </section>;
}



function ExportWorkspace() {
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const exportPdf = async () => {
    setExporting(true);
    setExportMessage("");
    try {
      await downloadDesignPackage();
      setExportMessage("Design package downloaded as a two-page PDF.");
    } catch {
      setExportMessage("The PDF could not be created. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <section className="export-workspace">
      <div className="export-copy">
        <span className="eyebrow">Ready to share</span>
        <h2>Take the design out of Housora.</h2>
        <p>
          Export the concept, selected materials, layout notes and reference
          prompt in one concise design package.
        </p>
        <button className="primary-action" onClick={exportPdf} disabled={exporting}>
          <FilePdf />
          {exporting ? "Building PDF…" : "Download design package"}
        </button>
        <p className="export-message" role="status" aria-live="polite">{exportMessage}</p>
      </div>
      <div className="export-preview">
        <span>ISMAIL STUDIO</span>
        <Image
          src="/pictures/interior-design-style-japandi.png"
          alt="Concept 03 design package cover"
          fill
          sizes="(max-width: 700px) 100vw, 42vw"
        />
        <div>
          <small>Bordeaux residence · Concept 03</small>
          <b>A quiet room for gathering</b>
          <em>PDF · 2 pages</em>
        </div>
      </div>
    </section>
  );
}

function TechnicalWorkspace() {
  const [file, setFile] = useState("Existing floor plan.pdf");
  const [annotation, setAnnotation] = useState("Living room · 4.8 × 3.6 m");
  const [saved, setSaved] = useState(false);
  const files = [
    "Existing floor plan.pdf",
    "Electrical layout.pdf",
    "Ceiling plan.pdf",
    "Joinery elevations.pdf",
  ];
  return (
    <section className="project-panel technical-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Technical package</span>
          <h2>Plans that stay connected to the design.</h2>
          <p>
            Keep dimensions, drawings, finish schedules and site notes alongside
            the visual concept.
          </p>
        </div>
        <button className="primary-action" onClick={() => setSaved(true)}>
          <Check />
          {saved ? "Notes saved" : "Save technical notes"}
        </button>
      </div>
      <div className="technical-layout">
        <aside className="drawing-list">
          <span className="eyebrow">Project files</span>
          {files.map((item, index) => (
            <button
              key={item}
              className={file === item ? "active" : ""}
              onClick={() => setFile(item)}
            >
              <FilePdf />
              <span>
                <b>{item}</b>
                <small>
                  {index === 0
                    ? "Scaled · 1:50 · 2 pages"
                    : index === 1
                      ? "14 notes · Rev 02"
                      : "Draft · Rev 01"}
                </small>
              </span>
              <ArrowRight />
            </button>
          ))}
          <button className="upload-drawing">
            <Plus /> Upload drawing or CAD export
          </button>
        </aside>
        <div className="drawing-preview">
          <div className="drawing-sheet">
            <span>ISMAIL STUDIO · BORDEAUX RESIDENCE</span>
            <b>{file.replace(".pdf", "")}</b>
            <i className="drawing-box a" />
            <i className="drawing-box b" />
            <i className="drawing-door" />
            <em className="dimension width">4.8 m</em>
            <em className="dimension height">3.6 m</em>
            <small>Scale 1:50 · Concept 03 · Sep 2026</small>
          </div>
          <div className="drawing-controls">
            <button>
              <MagnifyingGlass /> Zoom
            </button>
            <button>
              <Ruler /> Calibrate scale
            </button>
            <button>
              <DownloadSimple /> Export PDF
            </button>
          </div>
        </div>
        <aside className="technical-notes">
          <span className="eyebrow">Site notes</span>
          <h3>Constraints & handoff</h3>
          <label>
            <span>Selected area</span>
            <input
              value={annotation}
              onChange={(event) => setAnnotation(event.target.value)}
            />
          </label>
          <label>
            <span>Note for the contractor</span>
            <textarea defaultValue="Keep window openings and existing oak flooring. Confirm outlet positions before ordering joinery." />
          </label>
          <div className="technical-checks">
            <label>
              <input type="checkbox" defaultChecked /> Existing dimensions
              verified
            </label>
            <label>
              <input type="checkbox" defaultChecked /> Electrical points
              reviewed
            </label>
            <label>
              <input type="checkbox" /> Joinery approved for issue
            </label>
          </div>
          <button className="technical-share">
            <ShareNetwork /> Issue to contractor
          </button>
        </aside>
      </div>
    </section>
  );
}

const specificationRows = [
  {
    item: "Luna modular sofa",
    category: "Furniture · Sand bouclé",
    size: "1 · 286 × 96 cm",
    supplier: "Menu · SKU LU-286",
    price: "$3,480 trade · $4,190 retail",
    lead: "6–8 weeks",
    status: "Client approved",
  },
  {
    item: "Travertine coffee table",
    category: "Furniture · Honed ivory",
    size: "1 · Ø 100 cm",
    supplier: "Local maker · Custom",
    price: "$1,250 trade · $1,540 retail",
    lead: "Quote expires Sep 2",
    status: "Quote requested",
  },
  {
    item: "Oak herringbone",
    category: "Flooring · Natural matte",
    size: "32 m² + 10% waste",
    supplier: "Havwoods · HW-113",
    price: "$2,160 trade · $2,880 retail",
    lead: "2–3 weeks",
    status: "Specified",
  },
  {
    item: "Linen 03 — Oat",
    category: "Fabric · FR certified",
    size: "14 m",
    supplier: "Kvadrat · LN-03",
    price: "$680 trade · $840 retail",
    lead: "Sample received",
    status: "Sample approved",
  },
];

function ProjectBrief() {
  return (
    <section className="project-panel brief-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Room profile</span>
          <h2>A calm room for gathering</h2>
          <p>
            The design constraints that keep every concept grounded in the real
            space.
          </p>
        </div>
        <button className="primary-action">
          <PencilSimple /> Edit room notes
        </button>
      </div>
      <div className="brief-grid">
        <article>
          <span>Room goal</span>
          <h3>Living room redesign</h3>
          <p>
            Explore furniture, finishes, lighting and spatial layouts for daily
            gathering.
          </p>
        </article>
        <article>
          <span>Design priorities</span>
          <ul>
            <li>Comfortable seating for six</li>
            <li>Warm, natural materials</li>
            <li>More concealed storage</li>
          </ul>
        </article>
        <article>
          <span>Design direction</span>
          <h3>Warm minimal</h3>
          <p>Soft neutrals · Oak · Textural upholstery</p>
        </article>
        <article>
          <span>Must preserve</span>
          <ul>
            <li>Window openings</li>
            <li>Oak flooring</li>
            <li>Family artwork</li>
          </ul>
        </article>
        <article>
          <span>Measurements</span>
          <h3>4.8 × 3.6 m</h3>
          <p>Ceiling 2.72 m · Floor plan attached</p>
        </article>
        <article>
          <span>Layout check</span>
          <p>
            Keep an 85 cm circulation path behind the sofa and protect the
            window light.
          </p>
        </article>
      </div>
      <div className="brief-files">
        <button>
          <FilePdf />
          <span>
            <b>Existing floor plan.pdf</b>
            <small>Scaled · 2 pages</small>
          </span>
          <ArrowRight />
        </button>
        <button>
          <SquaresFour />
          <span>
            <b>12 inspiration references</b>
            <small>Saved to mood board</small>
          </span>
          <ArrowRight />
        </button>
      </div>
    </section>
  );
}

function MoodBoard() {
  const references = [
    "interior-design-style-japandi.png",
    "interior-design-style-scandinavian.png",
    "interior-design-style-modern.png",
    "interior-design-room-living-room.png",
  ];
  return (
    <section className="project-panel mood-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Collaborative direction</span>
          <h2>Warm minimal living</h2>
          <p>
            References, materials and client reactions organized before
            generation.
          </p>
        </div>
        <button className="primary-action">
          <Plus /> Add reference
        </button>
      </div>
      <div className="mood-grid">
        {references.map((image, index) => (
          <button key={image}>
            <span>
              <Image src={`/pictures/${image}`} alt="" fill sizes="25vw" />
            </span>
            <div>
              <b>
                {
                  [
                    "Quiet geometry",
                    "Soft oak and linen",
                    "Sculptural lighting",
                    "Open gathering",
                  ][index]
                }
              </b>
              <small>{index < 2 ? "Client favorite" : "Saved by Ismail"}</small>
            </div>
            <Heart />
          </button>
        ))}
      </div>
      <div className="mood-footer">
        <p>
          <CheckCircle /> Direction approved by Emma · Aug 25
        </p>
        <button>
          Generate concepts from this board <Sparkle />
        </button>
      </div>
    </section>
  );
}

type PurchaseOrder = {
  item: string;
  supplier: string;
  status: string;
  delivery: string;
  amount: string;
};
const initialOrders: PurchaseOrder[] = [
  {
    item: "Luna modular sofa",
    supplier: "Menu",
    status: "Awaiting deposit",
    delivery: "Oct 2",
    amount: "$3,480",
  },
  {
    item: "Oak herringbone",
    supplier: "Havwoods",
    status: "Ordered",
    delivery: "Sep 18",
    amount: "$2,160",
  },
  {
    item: "Linen 03 — Oat",
    supplier: "Kvadrat",
    status: "Sample received",
    delivery: "—",
    amount: "$680",
  },
];

function ProcurementWorkspace() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [draft, setDraft] = useState({
    item: "",
    supplier: "",
    delivery: "",
    amount: "",
  });
  const [notice, setNotice] = useState("");
  const createOrder = () => {
    if (!draft.item.trim() || !draft.supplier.trim() || !draft.amount.trim()) {
      setNotice(
        "Add an item, supplier and amount before creating the purchase order.",
      );
      return;
    }
    setOrders((current) => [
      ...current,
      {
        ...draft,
        status: "Draft purchase order",
        delivery: draft.delivery || "Date not set",
      },
    ]);
    setDraft({ item: "", supplier: "", delivery: "", amount: "" });
    setNewOrderOpen(false);
    setNotice(
      "Purchase order created as a draft. Review it before sending to the supplier.",
    );
  };
  return (
    <section className="project-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Procurement</span>
          <h2>Orders & deliveries</h2>
          <p>
            Quotes, purchase orders, samples and installation in one timeline.
          </p>
        </div>
        <button
          className="primary-action"
          onClick={() => {
            setNewOrderOpen(true);
            setNotice("");
          }}
        >
          <Plus /> New purchase order
        </button>
      </div>
      {newOrderOpen ? (
        <section className="inline-form" aria-label="New purchase order">
          <div>
            <b>New purchase order</b>
            <button
              aria-label="Close purchase order form"
              onClick={() => setNewOrderOpen(false)}
            >
              <X />
            </button>
          </div>
          <label>
            Item
            <input
              value={draft.item}
              onChange={(event) =>
                setDraft({ ...draft, item: event.target.value })
              }
              placeholder="e.g. Wall light"
              autoComplete="off"
            />
          </label>
          <label>
            Supplier
            <input
              value={draft.supplier}
              onChange={(event) =>
                setDraft({ ...draft, supplier: event.target.value })
              }
              placeholder="Supplier name"
              autoComplete="organization"
            />
          </label>
          <label>
            Expected delivery
            <input
              value={draft.delivery}
              onChange={(event) =>
                setDraft({ ...draft, delivery: event.target.value })
              }
              placeholder="e.g. Oct 18"
              autoComplete="off"
            />
          </label>
          <label>
            Amount
            <input
              value={draft.amount}
              onChange={(event) =>
                setDraft({ ...draft, amount: event.target.value })
              }
              placeholder="e.g. $680"
              inputMode="decimal"
              autoComplete="off"
            />
          </label>
          <button className="primary-action" onClick={createOrder}>
            Create draft purchase order
          </button>
        </section>
      ) : null}
      <p className="form-notice" role="status" aria-live="polite">
        {notice}
      </p>
      <div className="procurement-summary">
        <article>
          <span>Committed</span>
          <b>$8,420</b>
          <small>{orders.length + 3} purchase orders</small>
        </article>
        <article>
          <span>Arriving this month</span>
          <b>4</b>
          <small>Next: oak flooring</small>
        </article>
        <article>
          <span>Needs action</span>
          <b>2</b>
          <small>Deposit and quote expiry</small>
        </article>
      </div>
      <div className="spec-table procurement-table">
        <div className="spec-row spec-head">
          <span>Item</span>
          <span>Supplier</span>
          <span>Status</span>
          <span>Delivery</span>
          <span>Amount</span>
        </div>
        {orders.map((row) => (
          <button className="spec-row" key={`${row.item}-${row.supplier}`}>
            <span>
              <i>{row.item.slice(0, 2)}</i>
              <b>{row.item}</b>
            </span>
            <span>{row.supplier}</span>
            <span>
              <em>{row.status}</em>
            </span>
            <span>{row.delivery}</span>
            <span>{row.amount}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Specifications() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const rows = specificationRows.filter((row) =>
    row.item.toLowerCase().includes(query.toLowerCase()),
  );
  const clearSearch = () => {
    setQuery("");
    searchRef.current?.focus();
  };
  return (
    <section className="project-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Live specification</span>
          <h2>Products & materials</h2>
          <p>
            Quantities, finishes, sourcing and samples ready for procurement.
          </p>
        </div>
        <button className="primary-action">
          <Plus /> Add product
        </button>
      </div>
      <div className="panel-tools">
        <div className="search-input">
          <MagnifyingGlass />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products and materials"
            placeholder="Search specification"
          />
          {query ? (
            <button
              className="clear-search"
              aria-label="Clear search"
              onClick={clearSearch}
            >
              <X />
            </button>
          ) : null}
        </div>
        <button>
          <LinkSimple /> Import product link
        </button>
        <button>
          <DownloadSimple /> Export schedule
        </button>
      </div>
      {rows.length ? (
        <div className="spec-table rich-spec">
          <div className="spec-row spec-head">
            <span>Item & finish</span>
            <span>Quantity / size</span>
            <span>Supplier / SKU</span>
            <span>Trade / retail</span>
            <span>Lead time</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <button className="spec-row" key={row.item}>
              <span>
                <i>{row.item.slice(0, 2)}</i>
                <span>
                  <b>{row.item}</b>
                  <small>{row.category}</small>
                </span>
              </span>
              <span>{row.size}</span>
              <span>{row.supplier}</span>
              <span>{row.price}</span>
              <span>{row.lead}</span>
              <span>
                <em>{row.status}</em>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <MagnifyingGlass />
          <h3>No products found</h3>
          <p>Try another name or clear your search.</p>
          <button onClick={clearSearch}>Clear search</button>
        </div>
      )}
    </section>
  );
}

function BudgetWorkspace() {
  const [contingency, setContingency] = useState(true);
  return (
    <section className="project-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Budget control</span>
          <h2>On budget, with room to decide</h2>
          <p>
            Forecast, commitments, payments and changes connected to specified
            items.
          </p>
        </div>
        <button className="primary-action">
          <DownloadSimple /> Export budget
        </button>
      </div>
      <div className="budget-summary expanded-budget">
        <article>
          <span>Client budget</span>
          <b>$25,000</b>
          <small>Set in approved brief</small>
        </article>
        <article>
          <span>Forecast</span>
          <b>$21,940</b>
          <small className="positive">$3,060 remaining</small>
        </article>
        <article>
          <span>Committed</span>
          <b>$8,420</b>
          <small>6 purchase orders</small>
        </article>
        <article>
          <span>Paid</span>
          <b>$3,480</b>
          <small>2 deposits recorded</small>
        </article>
      </div>
      <div className="budget-body">
        <div className="budget-list">
          <div>
            <b>Furniture</b>
            <span>$11,420</span>
            <i>
              <em style={{ width: "52%" }} />
            </i>
          </div>
          <div>
            <b>Materials</b>
            <span>$5,880</span>
            <i>
              <em style={{ width: "27%" }} />
            </i>
          </div>
          <div>
            <b>Lighting</b>
            <span>$2,140</span>
            <i>
              <em style={{ width: "10%" }} />
            </i>
          </div>
          <div>
            <b>Shipping, tax & installation</b>
            <span>$2,500</span>
            <i>
              <em style={{ width: "11%" }} />
            </i>
          </div>
          <button className="change-order">
            <span>
              <b>Change order 02</b>
              <small>Sofa fabric upgrade · Awaiting client</small>
            </span>
            <b>+$420</b>
            <ArrowRight />
          </button>
        </div>
        <aside className="quote-card">
          <span className="eyebrow">Quotes</span>
          <h3>2 decisions need attention</h3>
          <p>
            Travertine table has two supplier quotes. The best option saves
            $320.
          </p>
          <button>
            Compare quotes <ArrowRight />
          </button>
          <label>
            <input
              type="checkbox"
              checked={contingency}
              onChange={(e) => setContingency(e.target.checked)}
            />{" "}
            Include 10% contingency
          </label>
        </aside>
      </div>
    </section>
  );
}

async function downloadDesignPackage() {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.setFillColor(24, 25, 21);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setTextColor(239, 235, 225);
  pdf.setFont("times", "italic");
  pdf.setFontSize(30);
  pdf.text("Housora", 18, 24);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(191, 194, 183);
  pdf.text("ISMAIL STUDIO  /  BORDEAUX RESIDENCE  /  CONCEPT 03", 18, 34);
  pdf.setFont("times", "normal");
  pdf.setFontSize(32);
  pdf.setTextColor(239, 235, 225);
  pdf.text("A quiet room", 18, 54);
  pdf.text("for gathering", 18, 66);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const asset = new window.Image();
    asset.onload = () => resolve(asset);
    asset.onerror = () =>
      reject(new Error("The concept image could not be loaded."));
    asset.src = "/pictures/interior-design-style-japandi.png";
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.88), "JPEG", 18, 82, 174, 110);
  pdf.setTextColor(191, 194, 183);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("DESIGN DIRECTION", 18, 210);
  pdf.setTextColor(239, 235, 225);
  pdf.setFontSize(12);
  pdf.text("Warm minimal · Japandi · Natural oak · Oat bouclé", 18, 219);
  pdf.setTextColor(191, 194, 183);
  pdf.setFontSize(9);
  pdf.text("Prepared for Emma Laurent · September 2026", 18, 277);
  pdf.addPage();
  pdf.setTextColor(24, 25, 21);
  pdf.setFont("times", "normal");
  pdf.setFontSize(26);
  pdf.text("Design package", 18, 25);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(88, 90, 82);
  pdf.text("Concept 03 · Living room redesign", 18, 34);
  const sections = [
    [
      "Design intent",
      "A calm, flexible room for gathering. Preserve the existing window openings and oak floor.",
    ],
    [
      "Key selections",
      "Luna modular sofa — sand bouclé\nTravertine coffee table — honed ivory\nOak herringbone flooring — natural matte\nLinen 03 — oat upholstery",
    ],
    [
      "Budget snapshot",
      "Client budget: $25,000\nCurrent forecast: $21,940\nRemaining allowance: $3,060",
    ],
    [
      "Reference prompt",
      "Create a warm-minimal living room with low modular seating, textured ivory upholstery, pale oak, sculptural lighting and soft afternoon daylight. Keep the architecture calm and uncluttered.",
    ],
  ];
  let y = 53;
  sections.forEach(([title, body]) => {
    pdf.setTextColor(117, 128, 106);
    pdf.setFontSize(8);
    pdf.text(title.toUpperCase(), 18, y);
    pdf.setTextColor(24, 25, 21);
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(body, 160);
    pdf.text(lines, 18, y + 9);
    y += 22 + lines.length * 5;
  });
  pdf.setDrawColor(215, 211, 201);
  pdf.line(18, 276, 192, 276);
  pdf.setTextColor(88, 90, 82);
  pdf.setFontSize(8);
  pdf.text(
    "Generated by Housora · Design intelligence for real spaces",
    18,
    282,
  );
  pdf.save("bordeaux-residence-concept-03.pdf");
}

function PresentationWorkspace({
  shared,
  onShare,
}: {
  shared: boolean;
  onShare: () => void;
}) {
  const [approved, setApproved] = useState(false);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [commentResolved, setCommentResolved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const approvalReady = commentResolved && !approved;
  const exportPdf = async () => {
    setExporting(true);
    setExportMessage("");
    try {
      await downloadDesignPackage();
      setExportMessage("Design package downloaded as a two-page PDF.");
    } catch {
      setExportMessage("The PDF could not be created. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <section className="project-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Client-ready presentation</span>
          <h2>Present the whole story</h2>
          <p>Concept, products, costs and decisions in one branded link.</p>
        </div>
        <div className="presentation-actions">
          <button onClick={exportPdf} disabled={exporting}>
            <FilePdf />
            {exporting ? "Building PDF…" : "Export PDF"}
          </button>
          <button className="primary-action" onClick={onShare}>
            <ShareNetwork />
            {shared ? "Link copied" : "Share presentation"}
          </button>
        </div>
      </div>
      <p className="export-message" role="status" aria-live="polite">
        {exportMessage}
      </p>
      <div className="presentation-grid">
        <div className="presentation-preview">
          <div className="presentation-cover">
            <Image
              src="/pictures/interior-design-style-japandi.png"
              alt="Japandi living room presentation"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
            />
            <span>ISMAIL STUDIO</span>
            <div>
              <small>Bordeaux residence · Living room</small>
              <h3>A quiet room for gathering</h3>
              <p>Concept 03 · Prepared for Emma Laurent</p>
            </div>
          </div>
          <div className="presentation-pages">
            <span className="active">01 Cover</span>
            <span>02 Direction</span>
            <span>03 Products</span>
            <span>04 Budget</span>
          </div>
        </div>
        <aside className="approval-panel">
          <span className="eyebrow">Client review</span>
          <h3>
            {approved
              ? "Concept approved"
              : sent
                ? "Reply sent"
                : "One open comment"}
          </h3>
          {approved ? (
            <div className="approval-success">
              <CheckCircle />
              <b>Approved by Emma Laurent</b>
              <small>Recorded today · Concept 03</small>
            </div>
          ) : (
            <>
              <blockquote>
                “Could we see a warmer fabric on the sofa before approving?”
                <footer>Emma · Yesterday · Sofa fabric</footer>
              </blockquote>
              <label className="approval-scope">
                <input
                  type="checkbox"
                  checked={commentResolved}
                  onChange={(event) => setCommentResolved(event.target.checked)}
                />{" "}
                <span>
                  I have resolved the sofa-fabric comment. Approval covers
                  Concept 03 and its listed products, excluding future change
                  orders.
                </span>
              </label>
            </>
          )}
          <label>
            <span>Reply to Emma</span>
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write a clear response…"
            />
          </label>
          <button
            className="reply-button"
            disabled={!reply.trim()}
            onClick={() => {
              setSent(true);
              setReply("");
            }}
          >
            Send reply
          </button>
          <button
            className="approve-button"
            onClick={() => setApproved(true)}
            disabled={!approvalReady}
          >
            <Check />
            {approved ? "Approval recorded" : "Approve Concept 03"}
          </button>
          <button
            className="client-portal-button"
            onClick={() => setPortalOpen(!portalOpen)}
          >
            <Eye />
            {portalOpen ? "Hide client portal" : "Preview client portal"}
          </button>
          <p>
            {approved
              ? "Approval scope, concept version and revision history are recorded."
              : "Resolve the outstanding comment before recording this approval."}
          </p>
        </aside>
      </div>
      {portalOpen ? (
        <section
          className="client-portal-preview"
          aria-label="Client portal preview"
        >
          <div>
            <span className="eyebrow">Emma’s private client portal</span>
            <h3>Everything approved for Bordeaux residence</h3>
            <p>
              View the project schedule, budget, designs, selected products,
              documents and delivery updates in one place.
            </p>
          </div>
          <div>
            <b>3</b>
            <span>open decisions</span>
          </div>
          <div>
            <b>$21,940</b>
            <span>current forecast</span>
          </div>
          <div>
            <b>Sep 18</b>
            <span>next delivery</span>
          </div>
          <button>
            Open client view <ArrowRight />
          </button>
        </section>
      ) : null}
    </section>
  );
}
function CollectionPage({
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="collection-page">
      <div className="collection-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="primary-action" onClick={onAction}>
          <Plus />
          {action}
        </button>
      </div>
      <div className="search-row">
        <label>
          <MagnifyingGlass />
          <input
            name="workspace-search"
            autoComplete="off"
            placeholder={`Search ${title.toLowerCase()}`}
            aria-label={`Search ${title.toLowerCase()}`}
          />
        </label>
        <button>
          <List /> All
        </button>
      </div>
      <div className={`collection-grid ${title.toLowerCase()}`}>{children}</div>
    </div>
  );
}
function ProjectCard({
  project,
  onOpen,
}: {
  project: (typeof projectRows)[number];
  onOpen?: () => void;
}) {
  return (
    <article className="project-card">
      <div>
        <Image
          src={project.image}
          alt=""
          fill
          sizes="(max-width: 700px) 100vw, 30vw"
        />
        <span
          className={
            project.status === "Approved" ? "status approved" : "status"
          }
        >
          {project.status}
        </span>
      </div>
      <h3>{project.name}</h3>
      <p>
        {project.client} · {project.room}
      </p>
      <button aria-label={`Open ${project.name}`} onClick={onOpen}>
        <ArrowRight />
      </button>
    </article>
  );
}

function QuickDialog({
  type,
  onClose,
  onTeam,
}: {
  type: Exclude<DemoDialog, null>;
  onClose: () => void;
  onTeam: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const dialogRef = useDialogFocus(true, onClose);
  const copy: Record<
    Exclude<DemoDialog, null>,
    { eyebrow: string; title: string; description: string; action: string }
  > = {
    account: {
      eyebrow: "Workspace",
      title: "Settings",
      description: "Manage your identity, studio and workspace preferences.",
      action: "Save settings",
    },
    credits: {
      eyebrow: "Plan usage",
      title: "Usage remaining",
      description:
        "Track generations and choose the right capacity for your studio.",
      action: "Upgrade plan",
    },
    project: {
      eyebrow: "New work",
      title: "Create project",
      description: "Start with a client and add spaces whenever you need them.",
      action: "Create project",
    },
    client: {
      eyebrow: "Client access",
      title: "Invite a client",
      description:
        "Give your client a private review link with comments and approvals.",
      action: "Send invitation",
    },
    team: {
      eyebrow: "Collaboration",
      title: "Add team member",
      description: "Invite a designer and choose what they can access.",
      action: "Send invitation",
    },
    library: {
      eyebrow: "Studio library",
      title: "Add library item",
      description:
        "Save a product, material or reference to reuse in future projects.",
      action: "Add to library",
    },
  };
  const content = copy[type];
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="quick-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">{content.eyebrow}</span>
            <h2 id="dialog-title">{content.title}</h2>
            <p>{content.description}</p>
          </div>
          <button aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </header>
        {type === "account" ? (
          <div className="account-layout">
            <nav>
              <button className="active">Profile</button>
              <button>Studio</button>
              <button onClick={onTeam}>Team & permissions</button>
              <button>Preferences</button>
              <button>Integrations</button>
              <button>Billing</button>
            </nav>
            <div className="dialog-form">
              <label>
                <span>Full name</span>
                <input defaultValue="Ismail Alaoui" />
              </label>
              <label>
                <span>Studio name</span>
                <input defaultValue="Ismail Studio" />
              </label>
              <div className="form-pair">
                <ChoiceField
                  label="Currency"
                  value="USD"
                  values={["USD", "EUR", "GBP", "MAD"]}
                />
                <ChoiceField
                  label="Measurements"
                  value="Metric"
                  values={["Metric", "Imperial"]}
                />
              </div>
            </div>
          </div>
        ) : type === "credits" ? (
          <div className="credits-content">
            <div className="credit-balance">
              <Sparkle />
              <span>
                <b>42 credits</b>
                <small>Available this month</small>
              </span>
            </div>
            <div className="usage-bar">
              <i style={{ width: "58%" }} />
            </div>
            <div className="plan-row">
              <span>
                <b>Professional</b>
                <small>200 generations · 4K exports · 5 team members</small>
              </span>
              <b>$29 / month</b>
            </div>
          </div>
        ) : (
          <div className="dialog-form">
            <label>
              <span>
                {type === "project"
                  ? "Project name"
                  : type === "library"
                    ? "Item name"
                    : "Email address"}
              </span>
              <input
                placeholder={
                  type === "project"
                    ? "e.g. Atlas apartment"
                    : type === "library"
                      ? "e.g. Travertine coffee table"
                      : "name@example.com"
                }
              />
            </label>
            {type === "project" ? (
              <div className="form-pair">
                <label>
                  <span>Client</span>
                  <input placeholder="Choose or create client" />
                </label>
                <label>
                  <span>First space</span>
                  <input placeholder="Living room" />
                </label>
              </div>
            ) : null}
            {type === "library" ? (
              <div className="form-pair">
                <ChoiceField
                  label="Type"
                  value="Product"
                  values={["Product", "Material", "Reference"]}
                />
                <label>
                  <span>Source link</span>
                  <input placeholder="https://…" />
                </label>
              </div>
            ) : null}
            {type === "team" ? (
              <ChoiceField
                label="Role"
                value="Designer"
                values={["Designer", "Project manager", "Viewer"]}
              />
            ) : null}
            {type === "client" ? (
              <label>
                <span>Project</span>
                <input defaultValue="Bordeaux residence" />
              </label>
            ) : null}
          </div>
        )}
        <footer>
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary-action"
            onClick={() => (saved ? onClose() : setSaved(true))}
          >
            {saved ? (
              <>
                <Check /> Done
              </>
            ) : (
              content.action
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function asDataUrl(source: string) {
  if (source.startsWith("data:") || /^https:\/\//i.test(source)) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error("The source image could not be loaded.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The source image could not be prepared."));
    reader.readAsDataURL(blob);
  });
}
