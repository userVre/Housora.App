"use client";

import "../../app/workflows/create-workflow.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Eye,
  House,
  LayoutGrid as SquaresFour,
  Leaf,
  Building2 as Buildings,
  Plus,
  Settings as GearSix,
  Sparkles as Sparkle,
  Upload as UploadSimple,
  Maximize2 as CornersOut,
  X,
} from "lucide-react";

export type CreateWorkflowMode = "Interior" | "Exterior" | "Garden";

export type CreateWorkflowProps = {
  /** Current preview image URL or data URL. Null when no photo yet. */
  preview: string | null;
  mode: CreateWorkflowMode;
  /** Adaptive space value: room type / building type / garden area */
  space: string;
  /** Design style value */
  style: string;
  prompt: string;
  /** Selected detail values keyed by label (e.g. "Color palette": "Warm neutrals") */
  details: Record<string, string>;
  /** Aspect ratio value e.g. "auto", "1:1", "16:9" */
  aspectRatio: string;
  /** True when a photo is present and generation can run */
  ready: boolean;
  /** True while generation is in progress */
  busy: boolean;
  /** Error message to show inline */
  error?: string;
  onModeChange: (mode: CreateWorkflowMode) => void;
  onSpaceChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onDetailChange: (label: string, value: string) => void;
  onAspectRatioChange: (value: string) => void;
  /** Called with the selected File when user uploads */
  onUpload: (file: File) => void;
  /** Called when user clicks Generate */
  onGenerate: () => void;
  /** Optional: called when user clicks "Try an example" */
  onUseExample?: () => void;
  /** Optional id for file input accessibility */
  uploadInputId?: string;
};

type DetailOption = { label: string; values: string[] };

const modeData: Record<
  CreateWorkflowMode,
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
    prompt: "Make this room warm, calm and practical. Keep the windows and main layout.",
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
    prompt: "Refresh this exterior with natural materials and stronger curb appeal.",
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
    prompt: "Create a lush, low-maintenance garden with room to relax and entertain.",
  },
};

const detailOptions: Record<CreateWorkflowMode, DetailOption[]> = {
  Interior: [
    {
      label: "Color palette",
      values: ["Auto", "Warm neutrals", "Earth tones", "Soft pastels", "Monochrome", "Cool greys", "Deep jewel"],
    },
    {
      label: "Lighting",
      values: ["Auto", "Natural daylight", "Warm ambient", "Bright task lighting", "Golden hour", "Evening"],
    },
    {
      label: "Wall finish",
      values: ["Auto", "Smooth plaster", "Limewash", "Wood panelling", "Exposed brick", "Stone cladding", "Subway tile"],
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
      values: ["Keep existing", "Floor-to-ceiling", "Black frame", "Crittall grid", "Arched", "Bay window", "Sash"],
    },
    {
      label: "Door style",
      values: ["Keep existing", "Flush minimal", "French glass", "Panelled classic", "Pivot", "Arched", "Sliding barn"],
    },
    {
      label: "Staircase style",
      values: ["Keep existing", "Modern oak", "Floating steel", "Stone cantilever", "Glass balustrade", "Spiral", "Classic carpeted"],
    },
  ],
  Exterior: [
    {
      label: "Color palette",
      values: ["Auto", "Warm neutral", "Earthy", "Light stone", "Dark contrast", "Coastal", "Heritage"],
    },
    {
      label: "Lighting",
      values: ["Auto", "Midday", "Golden hour", "Blue hour", "Overcast", "Night"],
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
      values: ["Keep existing", "Flat", "Gable", "Hip", "Mansard", "Green roof"],
    },
    {
      label: "Window style",
      values: ["Keep existing", "Floor-to-ceiling", "Black frame", "Crittall grid", "Arched", "Bay window", "Sash"],
    },
    {
      label: "Door style",
      values: ["Keep existing", "Flush minimal", "French glass", "Panelled classic", "Pivot", "Arched"],
    },
    { label: "Landscape level", values: ["Keep existing", "Minimal", "Balanced", "Lush"] },
  ],
  Garden: [
    {
      label: "Greenery",
      values: ["Auto", "Balanced", "Lush planting", "Minimal green", "Native and wild", "Low maintenance", "Edible garden"],
    },
    {
      label: "Paving",
      values: ["Auto", "Stone paving", "Gravel", "Stepping stones", "Timber decking", "Brick path", "Poured concrete"],
    },
    {
      label: "Boundary",
      values: ["Keep existing", "Hedge", "Stone wall", "Timber slat", "Metal railing", "Woven willow"],
    },
    {
      label: "Lighting",
      values: ["Auto", "Daylight", "Golden hour", "Path lighting", "Ambient evening", "Festoon lights"],
    },
    { label: "Maintenance", values: ["Low", "Balanced", "Hands-on"] },
    {
      label: "Climate",
      values: ["Auto-detect", "Temperate", "Mediterranean", "Tropical", "Arid", "Cold"],
    },
    {
      label: "Outdoor furniture",
      values: ["Auto", "Dining set", "Lounge seating", "Built-in bench", "Daybed", "No furniture"],
    },
  ],
};

const aspectValues = ["auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"];

function styleImageFor(mode: CreateWorkflowMode, value: string): string {
  if (value.startsWith("Auto")) return modeData[mode].image;
  const slug = value.toLowerCase().replaceAll(" ", "-");
  return `/pictures/${mode.toLowerCase()}-design-style-${slug}.png`;
}

/**
 * Reusable Create workflow — narrow portrait stage + single anchored composer.
 * All generation/upload behavior is delegated via props; no fake APIs.
 * Desktop: one-row controls, Generate sticky far right. Mobile: horizontally scrollable row.
 */
export function CreateWorkflow({
  preview,
  mode,
  space,
  style,
  prompt,
  details,
  aspectRatio,
  ready,
  busy,
  error,
  onModeChange,
  onSpaceChange,
  onStyleChange,
  onPromptChange,
  onDetailChange,
  onAspectRatioChange,
  onUpload,
  onGenerate,
  onUseExample,
}: CreateWorkflowProps) {
  const [menu, setMenu] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const spaceLabel = mode === "Interior" ? "Room type" : mode === "Exterior" ? "Building type" : "Garden area";
  const atmosphereLabel = mode === "Interior" ? "Color palette" : "Lighting";

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const active = rootRef.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]');
        active?.focus();
        setMenu(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const toggle = (key: string) => setMenu((c) => (c === key ? null : key));
  const choose = (action: () => void) => {
    action();
    setMenu(null);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    onUpload(file);
  };

  const optionsTitle =
    menu === "mode"
      ? "Design type"
      : menu === "space"
        ? spaceLabel
        : menu === "style"
          ? "Design style"
          : menu === "atmosphere"
            ? atmosphereLabel
            : menu === "details"
              ? "Details"
              : "Aspect ratio";

  const spaceOptions = modeData[mode].spaces;
  const styleOptions = modeData[mode].styles;
  const atmosphereOptions = detailOptions[mode].find((d) => d.label === atmosphereLabel)?.values ?? [];
  const ratioOptions = aspectValues;

  return (
    <div className="create-workflow" ref={rootRef} data-mode={mode}>
      <div
        className="create-workflow-stage"
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <header className="create-workflow-heading">
          <h1>Redesign any space from a photo</h1>
          <p>Upload a picture of your {mode === "Interior" ? "room" : mode === "Exterior" ? "building" : "garden"}, then choose the direction below.</p>
        </header>

        {preview ? (
          <figure className="create-workflow-preview" aria-label="Current project image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Current project space"
              width={1536}
              height={1024}
              style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
            />
            <figcaption>
              {mode} · {space}
            </figcaption>
          </figure>
        ) : (
          <button
            type="button"
            className={`create-workflow-dropzone${dragging ? " is-dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            aria-label="Upload a space photo"
          >
            <span aria-hidden>
              <UploadSimple style={{ width: 28, height: 28, color: "#ffad6d" }} />
            </span>
            <b>Drag a photo of your {mode === "Interior" ? "room" : mode === "Exterior" ? "building" : "garden"} here</b>
            <span>or click to browse</span>
            <small>JPG, PNG or WEBP · up to 10 MB</small>
          </button>
        )}

        {!preview && onUseExample ? (
          <button type="button" className="create-workflow-example" onClick={onUseExample} aria-label="Try an example image">
            <SquaresFour aria-hidden style={{ width: 16, height: 16 }} /> Just looking around? <u>Try an example</u>
          </button>
        ) : null}

        {error && !preview ? <p className="create-workflow-error" role="alert">{error}</p> : null}
      </div>

      <input
        ref={fileRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Choose a space photo"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      {/* Single composer anchored at bottom — visible before and after upload */}
      <div className="create-workflow-composer-anchor">
        {menu ? (
          <section
            id="create-workflow-options"
            className={`create-workflow-options ${menu === "mode" || menu === "style" ? "is-visual" : ""}`}
            aria-label={optionsTitle}
          >
            <header>
              <b>{optionsTitle}</b>
              <button type="button" aria-label="Close options" onClick={() => setMenu(null)}>
                <X />
              </button>
            </header>

            {menu === "mode" ? (
              <div className="create-workflow-mode-images">
                {(["Interior", "Exterior", "Garden"] as CreateWorkflowMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={mode === item}
                    onClick={() => choose(() => onModeChange(item))}
                  >
                    <Image src={modeData[item].image} width={300} height={200} alt="" unoptimized />
                    <span>{item} design</span>
                  </button>
                ))}
              </div>
            ) : menu === "details" ? (
              <div className="create-workflow-detail-groups">
                {detailOptions[mode].map((detail) => (
                  <fieldset key={detail.label}>
                    <legend>{detail.label}</legend>
                    <div>
                      {detail.values.map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={(details[detail.label] || detail.values[0]) === value}
                          onClick={() => onDetailChange(detail.label, value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            ) : (
              <div className={menu === "style" ? "create-workflow-style-images" : "create-workflow-option-list"}>
                {(menu === "space" ? spaceOptions : menu === "style" ? styleOptions : menu === "atmosphere" ? atmosphereOptions : ratioOptions).map(
                  (value) => {
                    const selected =
                      menu === "space"
                        ? space
                        : menu === "style"
                          ? style
                          : menu === "atmosphere"
                            ? details[atmosphereLabel] || atmosphereOptions[0] || "Auto"
                            : aspectRatio;
                    const isSelected = selected === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          choose(() => {
                            if (menu === "space") onSpaceChange(value);
                            else if (menu === "style") onStyleChange(value);
                            else if (menu === "atmosphere") onDetailChange(atmosphereLabel, value);
                            else onAspectRatioChange(value);
                          })
                        }
                      >
                        {menu === "style" ? (
                          <Image
                            src={styleImageFor(mode, value)}
                            width={180}
                            height={120}
                            alt=""
                            unoptimized
                            onError={(event) => {
                              (event.currentTarget as HTMLImageElement).src = modeData[mode].image;
                            }}
                          />
                        ) : null}
                        <span>{value === "auto" ? "Auto" : value}</span>
                        {isSelected ? <Check aria-hidden /> : null}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </section>
        ) : null}

        <div className="create-workflow-composer">
          <textarea
            aria-label="Describe the redesign"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Describe the redesign you want, then hit generate…"
            rows={2}
            disabled={busy}
          />
          <div className="create-workflow-row" role="toolbar" aria-label="Create controls">
            <button
              type="button"
              className="create-workflow-add-photo"
              aria-label={preview ? "Replace photo" : "Upload photo"}
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <Plus aria-hidden />
            </button>

            <button
              type="button"
              aria-expanded={menu === "mode"}
              aria-controls="create-workflow-options"
              onClick={() => toggle("mode")}
            >
              <SquaresFour aria-hidden />
              {mode} design
            </button>

            <button
              type="button"
              aria-expanded={menu === "space"}
              aria-controls="create-workflow-options"
              onClick={() => toggle("space")}
            >
              {mode === "Interior" ? <House aria-hidden /> : mode === "Exterior" ? <Buildings aria-hidden /> : <Leaf aria-hidden />}
              {space === "Auto-detect" ? spaceLabel : space}
            </button>

            <button
              type="button"
              aria-expanded={menu === "style"}
              aria-controls="create-workflow-options"
              onClick={() => toggle("style")}
            >
              <Sparkle aria-hidden />
              {style}
            </button>

            <button
              type="button"
              aria-expanded={menu === "atmosphere"}
              aria-controls="create-workflow-options"
              onClick={() => toggle("atmosphere")}
            >
              <Eye aria-hidden />
              {details[atmosphereLabel] || atmosphereLabel}
            </button>

            <button
              type="button"
              aria-expanded={menu === "details"}
              aria-controls="create-workflow-options"
              onClick={() => toggle("details")}
            >
              <GearSix aria-hidden />
              Details
            </button>

            <button
              type="button"
              aria-expanded={menu === "ratio"}
              aria-controls="create-workflow-options"
              onClick={() => toggle("ratio")}
            >
              <CornersOut aria-hidden />
              {aspectRatio === "auto" ? "Auto" : aspectRatio}
            </button>

            <button
              type="button"
              className="create-workflow-generate is-sticky"
              aria-label={busy ? "Generating redesign" : "Generate redesign"}
              title={ready ? "Generate" : "Add a photo first"}
              disabled={!ready || busy}
              onClick={onGenerate}
            >
              {busy ? <span className="spinner" aria-hidden style={{ width: 16, height: 16, borderWidth: 2 }} /> : <ArrowUp aria-hidden />}
            </button>
          </div>

          {error && preview ? (
            <p className="create-workflow-inline-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default CreateWorkflow;
