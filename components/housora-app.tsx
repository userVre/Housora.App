"use client";

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
  Buildings,
  CaretDown,
  Check,
  CheckCircle,
  Cube,
  ClockCounterClockwise,
  CopySimple,
  CreditCard,
  CursorClick,
  Selection,
  ScribbleLoop,
  TextT,
  ChatCircle,
  ImagesSquare,
  CornersOut,
  DotsThree,
  ArrowCounterClockwise,
  DownloadSimple,
  Eye,
  FilePdf,
  FolderOpen,
  Heart,
  House,
  GearSix,
  Leaf,
  LinkSimple,
  List,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Ruler,
  ShareNetwork,
  SignOut,
  Sparkle,
  SquaresFour,
  TrashSimple,
  UploadSimple,
  UserPlus,
  Users,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { ModelViewer } from "./model-viewer";
import { PricingPage, SettingsPage } from "./billing-settings";
import { DetectedObjects } from "./detected-objects";
import { CreditConfirmation, WorkspaceDialog } from "./credit-confirmation";
import { AI_COSTS, type DetectedObject } from "../lib/ai-costs";
import { prepareImage } from "../lib/prepare-image";

type DesignMode = "Interior" | "Exterior" | "Garden";
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
  title: string;
  image: string;
  mode: DesignMode;
  savedAt: string;
};
type ProjectDraft = {
  title: string;
  image: string;
  prompt?: string;
  mode: DesignMode;
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
  page?: WorkspacePage | "gallery" | "favorites";
}) {
  const normalized: WorkspacePage =
    page === "gallery" ? "projects" : page === "favorites" ? "library" : page;
  const [activePage, setActivePage] = useState<WorkspacePage>(normalized);
  const [railOpen, setRailOpen] = useState(false);
  const [dialog, setDialog] = useState<DemoDialog>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const designRows = useQuery(api.savedDesigns.list, {});
  const referenceRows = useQuery(api.savedReferences.list, {});
  const saveDesignRecord = useMutation(api.savedDesigns.save);
  const removeDesignRecord = useMutation(api.savedDesigns.remove);
  const saveReferenceRecord = useMutation(api.savedReferences.save);
  const removeReferenceRecord = useMutation(api.savedReferences.remove);
  const creditBalance = useQuery(api.credits.getMyBalance, {});
  const initializeCredits = useMutation(api.credits.initialize);
  useEffect(() => { void initializeCredits(); }, [initializeCredits]);
  const savedDesigns: SavedDesign[] = (designRows ?? []).map((row) => ({
    id: row.designId,
    title: row.title,
    image: row.image,
    mode: row.mode as DesignMode,
    savedAt: row.savedAt,
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
  const profileInitials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}` || profileName.slice(0, 2).toUpperCase();
  const [projectDraft, setProjectDraft] = useState<ProjectDraft | null>(null);
  const [removedDesign, setRemovedDesign] = useState<SavedDesign | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get("view") as WorkspacePage | null;
    if (
      requestedView &&
      ["projects", "discover", "library", "album", "pricing", "settings"].includes(requestedView)
    ) {
      setActivePage(requestedView);
    }
    const restoreView = () => {
      const view = new URLSearchParams(window.location.search).get(
        "view",
      ) as WorkspacePage | null;
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
    await saveDesignRecord({
      designId: design.id,
      title: design.title,
      image: design.image,
      mode: design.mode,
      savedAt: new Date().toISOString(),
    });
    setNotice("Design saved");
    window.setTimeout(() => setNotice(""), 3200);
  };
  const unsaveDesign = async (id: string) => {
    setRemovedDesign(savedDesigns.find((item) => item.id === id) ?? null);
    await removeDesignRecord({ designId: id });
    setNotice("Removed from Saved");
    window.setTimeout(() => setNotice(""), 3200);
  };
  const restoreDesign = async () => {
    if (!removedDesign) return;
    await saveDesignRecord({
      designId: removedDesign.id,
      title: removedDesign.title,
      image: removedDesign.image,
      mode: removedDesign.mode,
      savedAt: removedDesign.savedAt,
    });
    setRemovedDesign(null);
    setNotice("Design restored");
  };
  const saveReference = async (reference: InspirationReference) => {
    const exists = savedReferences.some((item) => item.title === reference.title);
    await saveReferenceRecord({
      ...reference,
      savedAt: new Date().toISOString(),
    });
    setNotice(exists ? "Already saved" : "Inspiration saved");
    window.setTimeout(() => setNotice(""), 3200);
  };
  const unsaveReference = async (title: string) => {
    await removeReferenceRecord({ title });
    setNotice("Inspiration removed");
  };
  const navigate = (next: WorkspacePage) => {
    setActivePage(next);
    setProfileOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    if (next !== "discover") {
      url.searchParams.delete("q");
      url.searchParams.delete("space");
    }
    window.history.pushState({ view: next }, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const startBlankProject = async () => {
    const draftId = `draft-${Date.now()}`;
    const title = `Untitled project ${savedDesigns.length + 1}`;
    const image = "/pictures/interior-design-cover.png";
    try {
      await saveDesign({ id: draftId, title, image, mode: "Interior" });
    } catch {}
    setProjectDraft({ title, image, prompt: "", mode: "Interior" });
    navigate("album");
  };
  const startFromReference = (reference: InspirationReference) => {
    setProjectDraft({
      title: reference.title,
      image: reference.image,
      prompt: reference.prompt,
      mode: "Interior",
    });
    navigate("album");
  };
  const openSavedProject = (design: SavedDesign) => {
    setProjectDraft({
      title: design.title,
      image: design.image,
      mode: design.mode,
    });
    navigate("album");
  };
  const openStudio = () => navigate("studio");

  return (
    <div className="product-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className={railOpen ? "product-rail is-open" : "product-rail"}>
        <div className="product-brand">
          <Link href="/">Housora</Link>
          <button
            onClick={() => setRailOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Workspace navigation">
          <NavButton
            active={activePage === "projects" || activePage === "album"}
            icon={<FolderOpen />}
            label="Projects"
            onClick={() => navigate("projects")}
          />
          <NavButton
            active={activePage === "discover"}
            icon={<MagnifyingGlass />}
            label="Discover"
            onClick={() => navigate("discover")}
          />
          <NavButton
            active={activePage === "library"}
            icon={<Heart />}
            label="Saved"
            onClick={() => navigate("library")}
          />
          <NavButton
            active={activePage === "pricing"}
            icon={<CreditCard />}
            label="Pricing"
            onClick={() => navigate("pricing")}
          />
        </nav>
        <div className="rail-account">
          {profileOpen ? (
            <div className="profile-menu" role="menu">
              <div className="profile-menu-head">
                <span>{profileInitials}</span>
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
          <button
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <span>{user?.imageUrl ? <Image src={user.imageUrl} alt="" width={40} height={40} /> : profileInitials}</span>
            <span>
              <b>{profileName}</b>
              <small>{creditBalance ? `${creditBalance.plan.replaceAll("_", " ")} · ${creditBalance.total} credits` : "Loading workspace…"}</small>
            </span>
            <CaretDown className={profileOpen ? "rotate" : ""} />
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
          onClick={() => openUserProfile()}
          aria-label="Open account settings"
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
            onBack={() => navigate("projects")}
            onSaveDesign={saveDesign}
            onOpenStudio={openStudio}
          />
        ) : null}
        {activePage === "projects" ? (
          <ProjectsPage
            designs={savedDesigns}
            onNew={startBlankProject}
            onOpen={openSavedProject}
          />
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
          <SavedPage
            designs={savedDesigns}
            references={savedReferences}
            onCreate={startBlankProject}
            onUnsave={unsaveDesign}
            onUnsaveReference={unsaveReference}
            onUseReference={startFromReference}
            onBrowse={() => navigate("discover")}
          />
        ) : null}
        {activePage === "studio" ? (
          <ThreeDLaunchPage onBack={() => navigate("projects")} />
        ) : null}
        {activePage === "album" ? (
          <AlbumWorkspace
            onBack={() => navigate("projects")}
            onSaveDesign={saveDesign}
            initialDraft={projectDraft}
            onOpenStudio={openStudio}
          />
        ) : null}
        {activePage === "pricing" ? <PricingPage /> : null}
        {activePage === "settings" ? <SettingsPage onPricing={() => navigate("pricing")} /> : null}
      </main>
      <nav
        className="mobile-bottom-nav"
        aria-label="Mobile workspace navigation"
      >
        <NavButton
          active={activePage === "projects" || activePage === "album"}
          icon={<FolderOpen />}
          label="Projects"
          onClick={() => navigate("projects")}
        />
        <NavButton
          active={activePage === "discover"}
          icon={<MagnifyingGlass />}
          label="Discover"
          onClick={() => navigate("discover")}
        />
        <NavButton
          active={activePage === "library"}
          icon={<Heart />}
          label="Saved"
          onClick={() => navigate("library")}
        />
        <NavButton
          active={activePage === "pricing"}
          icon={<CreditCard />}
          label="Pricing"
          onClick={() => navigate("pricing")}
        />
      </nav>
      {notice ? (
        <div className="workspace-toast" role="status">
          <span>{notice}</span>
          {removedDesign ? <button onClick={restoreDesign}>Undo</button> : null}
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
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? "active" : ""}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span>{label}</span>
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
  return (
    <section className="visual-projects clean-projects" aria-labelledby="projects-title">
      <header className="visual-projects-header">
        <div>
          <span className="eyebrow">Your design space</span>
          <div className="project-title-row">
            <h1 id="projects-title">Your projects</h1>
          </div>
          <p>
            {designs.length
              ? `You have ${designs.length} saved project${designs.length > 1 ? "s" : ""} — pick one to continue or start a new one.`
              : "Start with your photo or try an example. New projects appear here instantly, even before you generate."}
          </p>
        </div>
        <button className="primary-action" onClick={onNew} aria-label="Create new project">
          <Plus /> New project
        </button>
      </header>

      <div className="project-library-toolbar clean-project-toolbar">
        <div className="project-tabs">
          <span>Saved projects</span>
          <small style={{ marginLeft: 8, color: "#8f9187", fontSize: 11 }}>{designs.length} total</small>
        </div>
        <span className="project-hint">Click any card to open in editor — 3D and Edit are inside.</span>
      </div>

      <div className={`album-grid ${designs.length ? "" : "album-grid-empty"}`}>
        <button className="new-album-card" onClick={onNew} aria-label="Create new empty project">
          <span>
            <Plus />
          </span>
          <b>New project</b>
          <small>Creates instantly on the right → then upload or try example</small>
        </button>
        {designs.map((design) => (
          <button className="album-card" key={design.id} onClick={() => onOpen(design)} aria-label={`Open ${design.title}`}>
            <span>
              <Image src={design.image} alt="" fill sizes="(max-width: 700px) 50vw, 240px" />
              <i className="card-badge">{design.mode}</i>
            </span>
            <b>{design.title}</b>
            <small>
              {design.mode} · Saved design
            </small>
          </button>
        ))}
      </div>

      {designs.length === 0 ? (
        <div className="projects-empty-hint">
          <p>
            Tip: <b>New project</b> creates a draft immediately — it will stay here even if you close the tab. You can then upload your space in <b>Create</b> or jump to <b>3D studio</b>.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function AlbumWorkspace({
  onBack,
  onSaveDesign,
  onOpenStudio,
  initialDraft,
}: {
  onBack: () => void;
  onSaveDesign: (design: Omit<SavedDesign, "savedAt">) => Promise<void>;
  onOpenStudio: () => void;
  initialDraft?: ProjectDraft | null;
}) {
  const [mode, setMode] = useState<DesignMode>(
    initialDraft?.mode ?? "Interior",
  );
  const [space, setSpace] = useState("Auto-detect");
  const [style, setStyle] = useState("Auto style");
  const [prompt, setPrompt] = useState(initialDraft?.prompt ?? "");
  const [preview, setPreview] = useState<string | null>(
    initialDraft?.image ?? null,
  );
  const [tab, setTab] = useState<"create" | "edit">("create");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailChoices, setDetailChoices] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationConfirmOpen, setGenerationConfirmOpen] = useState(false);
  const generationLock = useRef(false);
  const [generationError, setGenerationError] = useState("");
  const [activeTool, setActiveTool] = useState("select");
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [previewRatio, setPreviewRatio] = useState(1.5);
  // 2. Version history + undo/redo per image/project
  const [history, setHistory] = useState<string[]>(() => (initialDraft?.image ? [initialDraft.image] : []));
  const [historyIndex, setHistoryIndex] = useState(0);
  const pushHistory = (img: string) => {
    setHistory((h) => {
      const next = h.slice(0, historyIndex + 1);
      if (next[next.length - 1] === img) return h;
      const updated = [...next, img].slice(-20);
      setHistoryIndex(updated.length - 1);
      return updated;
    });
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
  }, [historyIndex, history]);
  const [threeDSource, setThreeDSource] = useState<string | null>(null);
  const [threeDOpen, setThreeDOpen] = useState(false);
  const [threeDBusy, setThreeDBusy] = useState(false);
  const open3d = (source: string) => {
    if (!threeDBusy) setThreeDSource(source);
    setThreeDOpen(true);
  };
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [selectionPoint, setSelectionPoint] = useState<{ x: number; y: number } | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [canvasNotes, setCanvasNotes] = useState<Array<{ kind: string; text: string }>>([]);
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
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportStatus(share ? "Sharing isn't supported here. Image downloaded so you can send it." : "Image downloaded.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setExportStatus("Couldn't export this image. Please try again.");
    }
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
      setTab("create");
      setCompareOriginal(false);
      setSaved(false);
      setSaveError("");
    };
    reader.onerror = () => setUploadError("This image could not be opened. Try another photo.");
    reader.readAsDataURL(file);
  };
  const startTemplate = () => {
    const img = modeData[mode].image;
    setPreview(img);
    pushHistory(img);
    originalPreview.current = img;
    setTab("create");
    setSaved(false);
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
      // Use prepareImage for consistent compression and size limit compliance
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
          requestId: crypto.randomUUID(),
          confirmed: true,
          aspectRatio: "auto",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Generation failed.");
      if (!result.image) throw new Error("Model returned no image.");
      setPreview(result.image);
      pushHistory(result.image);
      originalPreview.current = result.image;
      setSelectedObject(null);
      setTab("create");
      setCompareOriginal(false);
      setSaved(false);
      if (result.cached) setExportStatus("Loaded from cache — no credits used. Same image + prompt as before.");
      else setExportStatus("");
      if (result.cached) setTimeout(() => setExportStatus(""), 4000);
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
    setDetailsOpen(false);
  };
  const spaceLabel =
    mode === "Interior"
      ? "Room type"
      : mode === "Exterior"
        ? "Building type"
        : "Garden area";
  return (
    <section className="album-workspace" aria-label="New project workspace">
      <header className="album-workspace-bar">
        <button className="album-back" onClick={onBack}>
          <ArrowLeft /> Projects
        </button>
        <span>{initialDraft?.title ?? "New project"}</span>
        <div className="album-bar-center">
          {preview ? (
            <div className="album-bar-actions">
              <button className="album-3d-button primary-3d" onClick={() => open3d(selectedObject?.thumbnail || preview)} title="Open 3D studio — create AR-ready models">
                <Cube /> 3D studio
              </button>
              <button aria-label="Compare with original" aria-pressed={compareOriginal} title="Compare with original" onClick={() => setCompareOriginal((value) => !value)}>
                <ImagesSquare />
              </button>
              <button aria-label="Download image" title="Download image" onClick={() => void exportImage(false)}>
                <DownloadSimple />
              </button>
              <button className="share-design" onClick={() => void exportImage(true)}>
                Share
              </button>
            </div>
          ) : null}
          <ol className="creation-progress" aria-label="Creation progress">
            <li className={preview ? "complete" : "active"}>Space</li>
            <li className={preview && tab === "create" ? "active" : preview ? "complete" : ""}>Direction</li>
            <li className={tab === "edit" ? "active" : ""}>Result</li>
          </ol>
        </div>
      </header>
      <input
        ref={fileRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Upload a space photo"
        onChange={(event) => {
          upload(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <p className="visually-hidden" role="alert" aria-live="assertive">
        {uploadError}
      </p>
      <div className="album-workspace-body">
        <main
          ref={canvasRef}
          className="album-canvas"
          onDrop={(event) => {
            event.preventDefault();
            upload(event.dataTransfer.files[0]);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          {preview ? (
            <div className={`album-preview tool-${activeTool}`} style={{ width: `min(100%, calc((100dvh - 230px) * ${previewRatio}))`, aspectRatio: previewRatio }} onClick={(event) => {
              if (activeTool !== "area" && activeTool !== "draw") return;
              const bounds = event.currentTarget.getBoundingClientRect();
              setSelectionPoint({ x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 });
            }}>
              <Image
                src={compareOriginal && originalPreview.current ? originalPreview.current : preview}
                alt="Current project space"
                width={1536}
                height={1024}
                onLoad={event => setPreviewRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)}
                priority
                unoptimized={preview.startsWith("data:") || preview.startsWith("http")}
              />
              <span>
                {compareOriginal ? "Original space" : `${mode} · ${space}`}
              </span>
              {selectionPoint ? <i className={activeTool === "draw" ? "canvas-draw-mark" : "canvas-area-mark"} style={{ left: `${selectionPoint.x}%`, top: `${selectionPoint.y}%` }} aria-label="Selected edit area" /> : null}
              {canvasNotes.map((note, index) => <em key={`${note.kind}-${index}`} className={`canvas-annotation ${note.kind}`}>{note.kind === "comment" ? <ChatCircle /> : <TextT />}{note.text}</em>)}
              {selectedObject && !compareOriginal && tab === "edit" ? <div className="detected-object-box" style={{ left: `${selectedObject.box[0] * 100}%`, top: `${selectedObject.box[1] * 100}%`, width: `${(selectedObject.box[2] - selectedObject.box[0]) * 100}%`, height: `${(selectedObject.box[3] - selectedObject.box[1]) * 100}%` }}><b>{selectedObject.label}</b></div> : null}
            </div>
          ) : (
            <div className="album-empty">
              <div>
                <span className="eyebrow">Your space, reimagined</span>
                <h1>Start with your space</h1>
                <p>
                  Upload a photo or try an example. Choose your style next.
                </p>
              </div>
              <div className="album-start-actions">
                <button onClick={() => fileRef.current?.click()}>
                  <UploadSimple />
                  <b>Upload your space</b>
                  <small>JPG, PNG, or WEBP</small>
                </button>
                <button onClick={startTemplate}>
                  <SquaresFour />
                  <b>Try an example</b>
                  <small>Explore without uploading</small>
                </button>
              </div>
              {uploadError ? (
                <p className="album-upload-error" role="alert">
                  {uploadError}
                </p>
              ) : null}
            </div>
          )}
          {preview && tab === "edit" ? <div className="canvas-tool-dock" role="toolbar" aria-label="Canvas tools">
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><ArrowCounterClockwise /></button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><ArrowRight /></button>
            <span />
            <button className={activeTool === "select" ? "active" : ""} onClick={() => setActiveTool("select")} title="Select an object" aria-label="Select an object"><CursorClick /></button>
            <button className={compareOriginal ? "active" : ""} onClick={() => setCompareOriginal(value => !value)} title="Compare with original" aria-label="Compare with original"><ImagesSquare /></button>
            <span />
            <button onClick={() => void canvasRef.current?.requestFullscreen()} title="View fullscreen" aria-label="View fullscreen"><CornersOut /></button>
          </div> : null}
          {preview && tab === "edit" && (activeTool === "text" || activeTool === "comment") ? <form className="canvas-note-composer" onSubmit={(event) => { event.preventDefault(); if (!noteDraft.trim()) return; setCanvasNotes(items => [...items, { kind: activeTool, text: noteDraft.trim() }]); setNoteDraft(""); setActiveTool("select"); }}>
            <input autoFocus value={noteDraft} onChange={event => setNoteDraft(event.target.value)} placeholder={activeTool === "comment" ? "Add feedback for this design" : "Add a label to the canvas"} />
            <button type="submit">Add</button>
          </form> : null}
        </main>
        <aside className="album-control-panel">
          <div
            className="album-tabs"
            role="tablist"
            aria-label="Project controls"
          >
            <button
              role="tab"
              aria-selected={tab === "create"}
              onClick={() => setTab("create")}
            >
              Create
            </button>
            <button
              role="tab"
              aria-selected={tab === "edit"}
              onClick={() => setTab("edit")}
              disabled={!preview}
            >
              Edit
            </button>
          </div>
          <div className="album-panel-content">
            {exportStatus ? <p role="status">{exportStatus}</p> : null}
            {tab === "create" ? (
              <>
                <p className="album-help">
                  {preview
                    ? "Shape the atmosphere. You can refine every detail after generation."
                    : "Choose a direction now, or add a photo to begin."}
                </p>
                <div className="album-mode-switch" aria-label="Project type">
                  {(["Interior", "Exterior", "Garden"] as DesignMode[]).map(
                    (item) => (
                      <button
                        key={item}
                        className={mode === item ? "selected" : ""}
                        onClick={() => changeMode(item)}
                        aria-pressed={mode === item}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
                <VisualSelect
                  label={spaceLabel}
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
                <label className="prompt-field album-prompt">
                  <span>
                    Describe the direction <small>Optional</small>
                  </span>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={modeData[mode].prompt}
                  />
                </label>
                <button
                  className="album-details-toggle"
                  onClick={() => setDetailsOpen((open) => !open)}
                  aria-expanded={detailsOpen}
                >
                  <Sparkle />
                  <span>
                    <b>More options</b>
                    <small>
                      {mode === "Interior"
                        ? "Finishes, doors & windows"
                        : mode === "Exterior"
                          ? "Facade, roof & landscape"
                          : "Planting, paving & boundaries"}
                    </small>
                  </span>
                  <CaretDown className={detailsOpen ? "rotate" : ""} />
                </button>
                {detailsOpen ? (
                  <DirectionDetails
                    key={mode}
                    mode={mode}
                    choices={detailChoices}
                    onChange={(label, value) =>
                      setDetailChoices((current) => ({ ...current, [label]: value }))
                    }
                  />
                ) : null}
                {preview ? (
                  <button className="studio-entry-card" onClick={() => open3d(preview)} aria-label="Open 3D studio">
                    <span className="studio-entry-icon">
                      <Cube />
                    </span>
                    <span className="studio-entry-copy">
                      <b>3D studio — Create AR-ready object</b>
                      <small>Where to find 3D: choose any furniture, generate 12 cr, preview in AR (no app)</small>
                    </span>
                    <ArrowRight />
                  </button>
                ) : null}
                {preview ? (
                  <button
                    className="album-generate primary-action"
                    onClick={() => setGenerationConfirmOpen(true)}
                    disabled={generating}
                  >
                    {generating ? <><span className="spinner" /> Creating your design…</> : <><Sparkle /> Generate · {AI_COSTS.imageEdit} credits</>}
                  </button>
                ) : null}
                <p className="integration-error" role="alert">{generationError}</p>
              </>
            ) : !preview ? (
              <div className="objects-empty">
                <SquaresFour />
                <h3>Upload a photo first</h3>
                <p>
                  After upload, Housora will identify editable objects in the
                  space.
                </p>
                <button onClick={() => fileRef.current?.click()}>
                  <UploadSimple /> Upload a photo
                </button>
              </div>
            ) : null}
            {preview ? <div hidden={tab !== "edit"}>
              <DetectedObjects key={`${mode}:${preview}`} hasImage active={tab === "edit" && !threeDOpen}
                mode={mode} image={preview} onUpload={() => fileRef.current?.click()}
                onSelect={setSelectedObject} onCreate3d={open3d}
                onImageChange={(image) => { setPreview(image); pushHistory(image); setSelectedObject(null); setSaved(false); }} />
            </div> : null}
            {preview ? (
              <button
                className="album-save"
                disabled={saved || saving}
                onClick={async () => {
                  setSaving(true);
                  setSaveError("");
                  try {
                    await onSaveDesign({
                      id: `album-${mode}-${preview.length}-${preview.slice(-24)}`,
                      title: initialDraft?.title ?? `${mode} design`,
                      image: preview,
                      mode,
                    });
                    setSaved(true);
                  } catch (reason) {
                    setSaveError(
                      reason instanceof Error
                        ? reason.message
                        : "The design could not be saved. Try again.",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner" /> Saving design…
                  </>
                ) : saved ? (
                  <>
                    <Check /> Saved to Projects & Saved
                  </>
                ) : (
                  <>
                    <Heart /> Save this design
                  </>
                )}
              </button>
            ) : null}
            {preview && history.length > 1 ? (
              <div className="version-history-inline" role="status" aria-live="polite">
                <ClockCounterClockwise size={14} /> {history.length} versions • {canUndo ? "Undo available" : "At oldest"} • Ctrl+Z / Shift+Ctrl+Z
                <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button onClick={undo} disabled={!canUndo} style={{ opacity: canUndo ? 1 : 0.4 }}>Undo</button>
                  <button onClick={redo} disabled={!canRedo} style={{ opacity: canRedo ? 1 : 0.4 }}>Redo</button>
                </span>
              </div>
            ) : null}
            {preview && tab === "edit" ? (
              <p className="integration-error" role="alert">
                {saveError || uploadError}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
      <CreditConfirmation open={generationConfirmOpen} cost={AI_COSTS.imageEdit} title="Generate your design?" description="Create a new version of this photo. Your original stays available for comparison." action="Generate" onCancel={() => setGenerationConfirmOpen(false)} onConfirm={() => void generateDesign()} />
      {threeDSource ? <WorkspaceDialog open={threeDOpen} onClose={() => { if (!threeDBusy) setThreeDOpen(false); }} title="3D studio" wide>
        <ThreeDWorkspace key={threeDSource} initialImage={threeDSource} onBusyChange={setThreeDBusy} />
        {threeDBusy ? <p className="three-d-stay" role="status">Keep this studio open until the model finishes. Your request is already running.</p> : null}
      </WorkspaceDialog> : null}
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

const inspirationReferences: InspirationReference[] = [
  {
    title: "Warm minimal living room",
    room: "Living room",
    style: "Warm minimal",
    image: "/inspiration/discover/01-warm-minimal-living-room.png",
    prompt:
      "Create a warm minimalist living room with a sculptural cream sofa, oak slatted feature wall, low travertine coffee table, quiet plants, full-height curtains and refined styling. Soft late-afternoon natural light; no people.",
  },
  {
    title: "Limestone kitchen",
    room: "Kitchen",
    style: "Japandi",
    image: "/inspiration/discover/02-japandi-kitchen.png",
    prompt:
      "Create a Japandi kitchen with pale oak cabinetry, a limestone island, handmade ceramic pendants and floor-to-ceiling garden windows. Bright overcast daylight; no people.",
  },
  {
    title: "Olive courtyard",
    room: "Courtyard",
    style: "Mediterranean",
    image: "/inspiration/discover/03-mediterranean-courtyard.png",
    prompt:
      "Create an intimate Mediterranean courtyard with limewashed walls, an olive tree, terracotta paving, built-in curved seating and a quiet water bowl. Warm morning sun; no people.",
  },
  {
    title: "Hillside villa",
    room: "Villa exterior",
    style: "Contemporary",
    image: "/inspiration/discover/04-contemporary-villa.png",
    prompt:
      "Create a contemporary hillside villa of natural stone and warm timber, an infinity pool, native landscaping and large glass openings. Golden hour; no people.",
  },
  {
    title: "Quiet boutique bedroom",
    room: "Bedroom",
    style: "Soft luxury",
    image: "/inspiration/discover/05-quiet-bedroom.png",
    prompt:
      "Create a quiet boutique-hotel bedroom with textured plaster walls, upholstered headboard, linen bedding, travertine side tables and a soft amber pendant. Tranquil early morning; no people.",
  },
  {
    title: "Stone spa bath",
    room: "Bathroom",
    style: "Spa modern",
    image: "/inspiration/discover/06-sculptural-bathroom.png",
    prompt:
      "Create a sculptural spa bathroom with a freestanding oval stone tub, fluted oak vanity, plaster walls, skylight and olive branch. Soft daylight; no people.",
  },
  {
    title: "Gaming media room",
    room: "Gaming room",
    style: "Moody modern",
    image: "/inspiration/discover/07-gaming-studio.png",
    prompt:
      "Create a sophisticated adult gaming and media room with charcoal acoustic wall panels, integrated warm LED shelving, a low modular sofa, walnut console and restrained blue ambient light. No people.",
  },
  {
    title: "Collected family room",
    room: "Living room",
    style: "Contemporary",
    image: "/inspiration/discover/08-family-living-room.png",
    prompt:
      "Create an elevated family living room with a creamy curved sofa, colorful art, custom bookshelves, woven rug and sculptural floor lamp. Soft sunny afternoon; no people.",
  },
  {
    title: "Urban roof garden",
    room: "Roof terrace",
    style: "Natural",
    image: "/inspiration/discover/09-rooftop-garden.png",
    prompt:
      "Create a lush urban rooftop garden with olive trees in planters, a pale stone dining table, linen shade sail and distant city skyline. Late afternoon; no people.",
  },
  {
    title: "Creative kids room",
    room: "Kids room",
    style: "Soft contemporary",
    image: "/inspiration/discover/10-kids-room.png",
    prompt:
      "Create a calming creative children's bedroom with custom arched storage, soft sage and warm sand walls, a natural wood desk, linen canopy and tactile rug. Gentle daylight; no people.",
  },
  {
    title: "Oak gathering table",
    room: "Dining room",
    style: "Natural modern",
    image: "/inspiration/discover/11-oak-dining-room.png",
    prompt:
      "Create a warm modern dining room with a long solid-oak table, woven pendant lamps, a wall of open shelving and hand-thrown ceramics. Sunset glow; no people.",
  },
  {
    title: "Desert pool villa",
    room: "Poolside",
    style: "Desert",
    image: "/inspiration/discover/12-desert-pool.png",
    prompt:
      "Create a serene desert villa pool patio with rammed-earth walls, cactus garden, pale concrete lounge chairs and strong shadow patterns. Clean midday sun; no people.",
  },
  {
    title: "Walnut home office",
    room: "Home office",
    style: "Refined modern",
    image: "/inspiration/discover/13-home-office.png",
    prompt:
      "Create a refined home office with a built-in walnut library, sculptural desk, parchment wallcovering, low lounge chair and framed abstract art. Moody window daylight; no people.",
  },
  {
    title: "Quiet gathering",
    room: "Living room",
    style: "Warm minimal",
    image: "/inspiration/cozy_modern_living_room.webp",
    prompt:
      "Create a quiet, warm-minimal living room with low modular seating, textured ivory upholstery, pale oak, sculptural lighting and soft afternoon daylight. Keep the architecture calm and uncluttered.",
  },
  {
    title: "Soft geometry",
    room: "Living room",
    style: "Japandi",
    image: "/inspiration/japandi_minimalist_living_room.webp",
    prompt:
      "Design a Japandi living room with soft sculptural forms, a restrained oatmeal palette, pale timber, handmade ceramics and diffused natural light.",
  },
  {
    title: "Collected comfort",
    room: "Living room",
    style: "Contemporary",
    image: "/inspiration/modern_living_room.webp",
    prompt:
      "Create a contemporary living room that feels collected rather than staged: layered neutral textiles, a generous sofa, warm wood, art-led styling and natural daylight.",
  },
  {
    title: "Oak and cane",
    room: "Dining room",
    style: "Scandinavian",
    image: "/inspiration/scandinavian_japandi_dining_room.webp",
    prompt:
      "Design a Scandinavian-Japandi dining room with a solid oak table, cane-backed chairs, black accents, handmade vessels and a large framed line drawing.",
  },
  {
    title: "Northern calm",
    room: "Living room",
    style: "Scandinavian",
    image: "/inspiration/scandinavian_living_room.webp",
    prompt:
      "Create a light Scandinavian living room with clean-lined furniture, tactile wool, warm oak, black details and a calm, practical family layout.",
  },
  {
    title: "Restful retreat",
    room: "Bedroom",
    style: "Warm minimal",
    image: "/inspiration/warm_minimalist_bedroom.webp",
    prompt:
      "Create a restful warm-minimal bedroom with a low upholstered bed, linen bedding, creamy plaster walls, timber accents and gentle bedside lighting.",
  },
  {
    title: "Gallery wall",
    room: "Living room",
    style: "Editorial",
    image: "/inspiration/inspo-1.webp",
    prompt:
      "Create an editorial living room with a gallery-like composition, tactile upholstery, considered art, sculptural accents and balanced negative space.",
  },
  {
    title: "Stone and shadow",
    room: "Bathroom",
    style: "Spa modern",
    image: "/inspiration/inspo-2.webp",
    prompt:
      "Design a spa-like modern bathroom with honed stone, sculptural fixtures, soft indirect lighting and an atmosphere of quiet luxury.",
  },
  {
    title: "Sculptural entry",
    room: "Hallway",
    style: "Contemporary",
    image: "/inspiration/inspo-3.webp",
    prompt:
      "Create a contemporary entrance with sculptural lighting, a restrained material palette, a strong focal point and warm welcoming light.",
  },
  {
    title: "Lived-in modern",
    room: "Living room",
    style: "Modern",
    image: "/inspiration/inspo-4.webp",
    prompt:
      "Create a lived-in modern living room with grounded proportions, natural materials, soft neutral textiles and a sophisticated layered mood.",
  },
  {
    title: "Tactile kitchen",
    room: "Kitchen",
    style: "Natural modern",
    image: "/inspiration/inspo-5.webp",
    prompt:
      "Design a natural-modern kitchen with timber cabinetry, honed stone, integrated storage, warm metal details and a calm material rhythm.",
  },
  {
    title: "Earthy dining",
    room: "Dining room",
    style: "Organic",
    image: "/inspiration/inspo-6.webp",
    prompt:
      "Create an organic dining space using earth-toned plaster, natural wood, woven texture, soft pendant lighting and generous proportions.",
  },
  {
    title: "Layered neutrals",
    room: "Bedroom",
    style: "Soft luxury",
    image: "/inspiration/inspo-7.webp",
    prompt:
      "Create a soft-luxury bedroom with layered neutral linens, an upholstered headboard, warm timber, tailored lighting and an unhurried hotel feel.",
  },
  {
    title: "Material study",
    room: "Detail",
    style: "Material-led",
    image: "/inspiration/inspo-8.webp",
    prompt:
      "Build an interior direction around tactile natural materials, warm neutrals, visible craftsmanship and restrained sculptural forms.",
  },
  {
    title: "Daylight studio",
    room: "Home office",
    style: "Minimal",
    image: "/inspiration/inspo-9.webp",
    prompt:
      "Create a minimal home office with daylight-focused planning, built-in storage, warm wood, a clean desk and a quiet professional backdrop.",
  },
  {
    title: "Candlelit table",
    room: "Dining room",
    style: "Mediterranean",
    image: "/inspiration/inspo-10.webp",
    prompt:
      "Design a Mediterranean-influenced dining room with mineral walls, warm wood, crafted ceramics, linen and intimate evening lighting.",
  },
  {
    title: "Monochrome corner",
    room: "Living room",
    style: "Monochrome",
    image: "/inspiration/inspo-11.webp",
    prompt:
      "Create a refined monochrome living room with tonal layering, sculptural furniture, charcoal accents and sophisticated contrast.",
  },
  {
    title: "Soft contrast",
    room: "Bedroom",
    style: "Contemporary",
    image: "/inspiration/inspo-12.webp",
    prompt:
      "Create a contemporary bedroom with soft contrast, tailored joinery, indirect lighting, natural fabric and a calm boutique-hotel quality.",
  },
  {
    title: "Architectural lounge",
    room: "Living room",
    style: "Modernist",
    image: "/inspiration/inspo-13.webp",
    prompt:
      "Design an architectural lounge with strong spatial proportions, a low sculptural sofa, stone, wood and warm pools of light.",
  },
  {
    title: "Crafted corner",
    room: "Detail",
    style: "Wabi-sabi",
    image: "/inspiration/inspo-14.webp",
    prompt:
      "Create a wabi-sabi interior moment with handmade textures, imperfect ceramics, natural wood, soft shadow and earthy calm.",
  },
  {
    title: "Sunlit kitchen",
    room: "Kitchen",
    style: "Scandinavian",
    image: "/inspiration/inspo-15.webp",
    prompt:
      "Create a sunlit Scandinavian kitchen with quiet cabinetry, pale timber, practical open shelving and a clean, welcoming layout.",
  },
  {
    title: "Deep comfort",
    room: "Living room",
    style: "Moody modern",
    image: "/inspiration/inspo-16.webp",
    prompt:
      "Design a moody modern living room with deep tonal walls, tactile seating, warm lamps, refined art and intimate evening atmosphere.",
  },
  {
    title: "Textural bath",
    room: "Bathroom",
    style: "Natural spa",
    image: "/inspiration/inspo-17.webp",
    prompt:
      "Create a natural spa bathroom with textural plaster, timber, stone, a simple vanity and soft, restorative lighting.",
  },
  {
    title: "Gentle color",
    room: "Bedroom",
    style: "Soft contemporary",
    image: "/inspiration/inspo-18.webp",
    prompt:
      "Create a soft contemporary bedroom with gentle color, tactile fabrics, custom joinery and a sophisticated relaxed feeling.",
  },
  {
    title: "Sculptural table",
    room: "Dining room",
    style: "Modern",
    image: "/inspiration/inspo-19.webp",
    prompt:
      "Design a modern dining room centered on a sculptural table, expressive chairs, natural finishes and gallery-like lighting.",
  },
  {
    title: "The reading room",
    room: "Living room",
    style: "Collected",
    image: "/inspiration/inspo-20.webp",
    prompt:
      "Create a collected reading room with generous shelves, comfortable seating, warm oak, art, books and a timeless residential feel.",
  },
  {
    title: "Balanced palette",
    room: "Living room",
    style: "Earth tones",
    image: "/inspiration/inspo-21.webp",
    prompt:
      "Create a balanced earth-tone living room with warm clay, sand, oak, linen and soft sculptural forms in natural daylight.",
  },
  {
    title: "Light and line",
    room: "Hallway",
    style: "Minimal",
    image: "/inspiration/inspo-22.webp",
    prompt:
      "Design a minimal hallway with a strong play of light and line, carefully chosen material transitions and a calm gallery-like atmosphere.",
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
  const [selected, setSelected] = useState<InspirationReference | null>(null);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeReference = () => {
    setSelected(null);
    setCopied(false);
  };
  const dialogRef = useDialogFocus(Boolean(selected), closeReference);
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
          ["Courtyard", "Roof terrace", "Poolside"].includes(entry.room))) &&
      `${entry.title} ${entry.room} ${entry.style} ${entry.prompt}`
        .toLowerCase()
        .includes(normalizedQuery),
  );
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
        {results.length} directions
      </p>
      <section className="inspiration-grid" aria-label="Design inspiration">
        {results.map((entry, index) => (
          <button
            key={entry.title}
            className={`inspiration-card card-${index % 7}`}
            onClick={() => {
              setSelected(entry);
              setCopied(false);
            }}
          >
            <Image
              src={entry.image}
              alt={`${entry.title}, ${entry.style} ${entry.room} reference`}
              fill
              sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
              priority={
                visualColumnLength > 0 && index % visualColumnLength < 2
              }
            />
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
        ))}
      </section>
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
            if (event.target === event.currentTarget) {
              setSelected(null);
              setCopied(false);
            }
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
              onClick={() => {
                setSelected(null);
                setCopied(false);
              }}
              aria-label="Close reference"
            >
              <X />
            </button>
            <div className="reference-image">
              <Image
                src={selected.image}
                alt={`${selected.title}, ${selected.style} ${selected.room} reference`}
                fill
                sizes="(max-width: 800px) 100vw, 58vw"
                priority
              />
            </div>
            <div className="reference-details">
              <span className="eyebrow">
                {selected.style} · {selected.room}
              </span>
              <h2 id="reference-title">{selected.title}</h2>
              <p>
                Use this atmosphere as a starting point, then make it work for
                your own space.
              </p>
              <label className="reference-prompt">
                <span>Design prompt</span>
                <textarea
                  value={selected.prompt}
                  readOnly
                  aria-label="Design prompt"
                />
                <button className="copy-prompt" onClick={copyPrompt}>
                  <CopySimple />{" "}
                  {copied ? "Prompt copied" : "Copy design prompt"}
                </button>
              </label>
              <div className="reference-actions">
                <button
                  className="reference-save"
                  onClick={() => {
                    const reference = selected;
                    closeReference();
                    onCreate(reference);
                  }}
                >
                  <Sparkle /> Use this direction
                </button>
                <button
                  className="reference-heart"
                  onClick={() => onSave(selected)}
                  aria-label="Save this inspiration"
                >
                  <Heart
                    weight={
                      savedTitles.includes(selected.title) ? "fill" : "regular"
                    }
                  />{" "}
                  <span>
                    {savedTitles.includes(selected.title)
                      ? "Saved"
                      : "Save inspiration"}
                  </span>
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
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
  const [tab, setTab] = useState<"designs" | "inspiration">("designs");
  const [selected, setSelected] = useState<SavedDesign | null>(null);
  const [selectedReference, setSelectedReference] =
    useState<InspirationReference | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const moveSavedTab = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    next: "designs" | "inspiration",
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
        <h1 id="saved-title">Your saved designs</h1>
        <p>{designs.length + references.length} saved</p>
      </header>
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
          onKeyDown={(event) => moveSavedTab(event, "designs")}
          onClick={() => setTab("inspiration")}
        >
          Inspiration <span>{references.length}</span>
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
          {designs.map((design, index) => (
            <button
              className={`saved-tile saved-tile-${index % 4}`}
              key={design.id}
              onClick={() => {
                setSelected(design);
                setShareMessage("");
              }}
            >
              <Image
                src={design.image}
                alt={design.title}
                fill
                sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
              />
              <span>{design.title}</span>
            </button>
          ))}
        </div>
      ) : tab === "inspiration" && references.length ? (
        <div
          id="saved-panel"
          role="tabpanel"
          aria-labelledby="saved-tab-inspiration"
          className="saved-masonry"
          aria-label="Saved inspiration"
        >
          {references.map((reference, index) => (
            <button
              className={`saved-tile saved-tile-${index % 4}`}
              key={reference.title}
              onClick={() => {
                setSelectedReference(reference);
                setShareMessage("");
              }}
            >
              <Image
                src={reference.image}
                alt={reference.title}
                fill
                sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
              />
              <span>{reference.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="saved-empty">
          <span>
            <Heart />
          </span>
          <h2>
            {tab === "designs"
              ? "No saved designs yet"
              : "No saved inspiration yet"}
          </h2>
          <p>
            {tab === "designs"
              ? "Generate a design you love, then save it here for later."
              : "Save a direction from Discover to keep it close."}
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
                  <Heart weight="fill" /> Unsave
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
                  <Heart weight="fill" /> Unsave
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

function ThreeDWorkspace({ initialImage = null, onBusyChange }: { initialImage?: string | null; onBusyChange?: (busy: boolean) => void } = {}) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "queued" | "running" | "success" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelPoster, setModelPoster] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [trackingPaused, setTrackingPaused] = useState(false);

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
        const response = await fetch(`/api/tripo/tasks/${encodeURIComponent(taskId)}${query}`, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
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
          setStatus("success");
          return;
        }
        if (["failed", "banned", "expired", "cancelled", "unknown"].includes(result.status)) {
          setError(result.error || `Tripo ended with status: ${result.status}.`);
          setStatus("failed");
          setTaskId(null);
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
  }, [taskId, trackingToken, pollAttempt]);

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Use a JPG, PNG or WEBP image under 10 MB.");
      return;
    }
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setModelUrl(null);
    setTaskId(null);
    setTrackingToken(null);
    setStatus("idle");
    setProgress(0);
    setError("");
  };

  const generateModel = async () => {
    if (!imagePreview || submitting.current || status === "uploading" || status === "queued" || status === "running") return;
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
      form.append("requestId", crypto.randomUUID());
      const response = await fetch("/api/tripo/generate", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start 3D generation.");
      if (!result.taskId || !result.trackingToken) {
        throw new Error("The 3D service returned an incomplete task. Contact support before trying again.");
      }
      setTaskId(result.taskId);
      setTrackingToken(result.trackingToken);
      setStatus("queued");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start 3D generation.");
      setStatus("failed");
    } finally {
      submitting.current = false;
    }
  };

  const busy = status === "uploading" || status === "queued" || status === "running";
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  return (
    <section className="three-d-workspace tripo-workspace">
      <header className="three-d-heading">
        <div>
          <span className="eyebrow"><Cube /> 3D & augmented reality</span>
          <h2>See the furniture in your room.</h2>
          <p>Start with a clear furniture photo. Create a 3D model, then preview it in your room with a compatible phone. Check dimensions before buying: generated models may not be true to scale.</p>
        </div>
        {modelUrl ? <span className="integration-ready"><CheckCircle /> AR ready</span> : null}
      </header>

      <div className="tripo-grid">
        <div className="tripo-stage">
          {modelUrl ? (
            <ModelViewer src={modelUrl} poster={modelPoster} />
          ) : imagePreview ? (
            <div className="tripo-source-preview">
              <Image src={imagePreview} alt="Furniture selected for 3D generation" fill sizes="(max-width: 900px) 100vw, 65vw" unoptimized />
              {busy ? (
                <div className="tripo-progress" role="status" aria-live="polite">
                  <span className="spinner" />
                  <b>{status === "uploading" ? "Uploading securely…" : status === "queued" ? "Waiting for Tripo…" : "Building your 3D model…"}</b>
                  <small>{progress ? `${Math.round(progress)}% complete` : "This usually takes one or two minutes."}</small>
                  <i><em style={{ width: `${Math.max(4, progress)}%` }} /></i>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="tripo-empty" onClick={() => inputRef.current?.click()}>
              <Cube />
              <b>Add a furniture image</b>
              <span>Use one object on a plain or uncluttered background for the best 3D result.</span>
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
          <span className="eyebrow">Image to 3D</span>
          <h3>{modelUrl ? "Your model is ready" : "Create an AR-ready object"}</h3>
          <p>{modelUrl ? "Drag to rotate, scroll to zoom, or open this page on your phone and select View in your room." : "For accurate placement, use a front three-quarter product photo and avoid objects that are cut off."}</p>
          <ol className="tripo-steps">
            <li className={imagePreview ? "complete" : "active"}><span>1</span><b>Choose furniture</b></li>
            <li className={busy ? "active" : modelUrl ? "complete" : ""}><span>2</span><b>Generate with Tripo</b></li>
            <li className={modelUrl ? "active" : ""}><span>3</span><b>Preview or launch AR</b></li>
          </ol>
          <p className="integration-error" role="alert">{error}</p>
          {trackingPaused ? <button onClick={() => { setTrackingPaused(false); setPollAttempt(value => value + 1); }}>Check existing model status · no extra credits</button> : null}
          <div className="tripo-actions">
            <button onClick={() => inputRef.current?.click()} disabled={busy}>
              <UploadSimple /> {image ? "Replace image" : "Choose image"}
            </button>
            {!modelUrl ? (
              <button className="primary-action" onClick={() => setConfirmOpen(true)} disabled={!imagePreview || busy}>
                {busy ? <><span className="spinner" /> Generating…</> : <><Cube /> Generate 3D · {AI_COSTS.model3d} credits</>}
              </button>
            ) : (
              <>
                <a className="primary-action" href={modelUrl} download target="_blank" rel="noreferrer">
                  <DownloadSimple /> Download GLB
                </a>
                <button
                  onClick={async () => {
                    const arUrl = `${window.location.origin}/ar?src=${encodeURIComponent(modelUrl)}${modelPoster ? `&poster=${encodeURIComponent(modelPoster)}` : ""}`;
                    await navigator.clipboard.writeText(arUrl);
                    alert("AR browser link copied — open on phone for View in your room (no app needed).");
                  }}
                >
                  <ShareNetwork /> Copy AR browser link
                </button>
              </>
            )}
          </div>
          <small className="tripo-expiry-note">Generated Tripo links are temporary. Download the GLB or save it to permanent project storage before sharing. AR link is a shareable browser URL (Google model-viewer) — no app install.</small>
        </aside>
      </div>
      <CreditConfirmation open={confirmOpen} cost={AI_COSTS.model3d} title="Create this 3D model?"
        description="Send this image to Tripo to build a textured 3D model. Confirmed failed generations return your Housora credits. AI models are approximations, not measured replicas."
        action="Create 3D" onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); void generateModel(); }} />
    </section>
  );
}

function LegacyThreeDWorkspace() {
  const [view, setView] = useState<"3D" | "Plan">("3D");
  const [selected, setSelected] = useState("Sofa");
  const [notice, setNotice] = useState("Select an item to move or replace it.");
  const items = ["Sofa", "Coffee table", "Rug", "Armchair", "Floor lamp"];
  return (
    <section className="three-d-workspace">
      <header className="three-d-heading">
        <div>
          <span className="eyebrow">
            <Cube /> Layout studio
          </span>
          <h2>Plan it before you render it.</h2>
          <p>
            Test furniture placement, clearances and proportions in a simple 3D
            room—not a complicated CAD tool.
          </p>
        </div>
        <div
          className="layout-view-toggle"
          role="tablist"
          aria-label="Layout view"
        >
          <button
            role="tab"
            aria-selected={view === "3D"}
            onClick={() => setView("3D")}
          >
            3D view
          </button>
          <button
            role="tab"
            aria-selected={view === "Plan"}
            onClick={() => setView("Plan")}
          >
            Floor plan
          </button>
        </div>
      </header>
      <div
        className={
          view === "3D" ? "layout-stage is-3d" : "layout-stage is-plan"
        }
      >
        <div className="layout-room">
          <i className="room-wall back" />
          <i className="room-wall side" />
          <i className="room-floor" />
          <button
            className={
              selected === "Sofa"
                ? "layout-object sofa selected"
                : "layout-object sofa"
            }
            onClick={() => {
              setSelected("Sofa");
              setNotice(
                "Sofa selected · 286 × 96 cm · Keep 85 cm clear behind.",
              );
            }}
          >
            <span>Sofa</span>
          </button>
          <button
            className={
              selected === "Coffee table"
                ? "layout-object table selected"
                : "layout-object table"
            }
            onClick={() => {
              setSelected("Coffee table");
              setNotice(
                "Coffee table selected · 100 cm Ø · 45 cm clearance recommended.",
              );
            }}
          >
            <span>Table</span>
          </button>
          <button
            className={
              selected === "Rug"
                ? "layout-object rug selected"
                : "layout-object rug"
            }
            onClick={() => {
              setSelected("Rug");
              setNotice(
                "Rug selected · 240 × 340 cm · Front sofa legs sit on rug.",
              );
            }}
          >
            <span>Rug</span>
          </button>
          <button
            className={
              selected === "Armchair"
                ? "layout-object armchair selected"
                : "layout-object armchair"
            }
            onClick={() => {
              setSelected("Armchair");
              setNotice(
                "Armchair selected · Rotate it toward the conversation area.",
              );
            }}
          >
            <span>Chair</span>
          </button>
          <button
            className={
              selected === "Floor lamp"
                ? "layout-object lamp selected"
                : "layout-object lamp"
            }
            onClick={() => {
              setSelected("Floor lamp");
              setNotice(
                "Floor lamp selected · Place beside the reading corner.",
              );
            }}
          >
            <span>Lamp</span>
          </button>
          <em className="layout-window">Window</em>
          <em className="layout-door">Door</em>
        </div>
        <span className="layout-dimension width">4.8 m</span>
        <span className="layout-dimension depth">3.6 m</span>
        <span className="layout-camera">
          {view === "3D"
            ? "Perspective camera · eye height"
            : "Scaled plan · 1:50"}
        </span>
      </div>
      <aside className="layout-panel">
        <div>
          <span className="eyebrow">Room setup</span>
          <b>Living room · 4.8 × 3.6 m</b>
          <small>Ceiling height 2.72 m</small>
        </div>
        <div className="layout-library">
          <span>Furniture in this layout</span>
          {items.map((item) => (
            <button
              key={item}
              className={selected === item ? "selected" : ""}
              onClick={() => {
                setSelected(item);
                setNotice(
                  `${item} selected · Drag controls will be connected to the 3D engine.`,
                );
              }}
            >
              <i>{item.slice(0, 2)}</i>
              {item}
              <Check />
            </button>
          ))}
        </div>
        <p className="layout-notice" aria-live="polite">
          {notice}
        </p>
        <div className="layout-actions">
          <button
            onClick={() =>
              setNotice(
                "AI tested three furniture arrangements. This layout has the clearest circulation.",
              )
            }
          >
            <Sparkle /> Suggest layout
          </button>
          <button
            className="primary-action"
            onClick={() => setNotice("3D layout saved to Concept 03.")}
          >
            <Check /> Save layout
          </button>
        </div>
      </aside>
    </section>
  );
}

function ExportWorkspace() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const createPdf = async () => {
    setExporting(true);
    setMessage("");
    try {
      await downloadDesignPackage();
      setMessage("Your two-page design package has downloaded.");
    } catch {
      setMessage("The PDF could not be created. Please try again.");
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
        <button
          className="primary-action"
          onClick={createPdf}
          disabled={exporting}
        >
          <FilePdf />
          {exporting ? "Building PDF…" : "Download design package"}
        </button>
        <p className="export-message" role="status" aria-live="polite">
          {message}
        </p>
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
