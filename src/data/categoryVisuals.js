const VISUAL_META = {
  default: {
    label: "Concept Map",
    accent: "#7ec8f8",
    motif: "pathway",
  },
  genchem: { label: "Periodic Trends", accent: "#ffd166", motif: "hex" },
  physics: { label: "Core Principles", accent: "#ffcf91", motif: "wave" },
  stats: { label: "Data Patterns", accent: "#ffd36b", motif: "chart" },
  genchemlab: { label: "Lab Workflow", accent: "#9df3c4", motif: "chart" },
  ochem: { label: "Reaction Logic", accent: "#ffd27a", motif: "hex" },
  "ochem-lab": { label: "Separation & Synthesis", accent: "#ffc48b", motif: "pathway" },
  analytical: { label: "Signal & Detection", accent: "#8bc5ff", motif: "chart" },
  inorganic: { label: "Coordination Chemistry", accent: "#ffbb7d", motif: "hex" },
  biochem1: { label: "Metabolic Flow", accent: "#ffb3a9", motif: "pathway" },
  biochem2: { label: "Cell Signaling", accent: "#d6b3ff", motif: "helix" },
  "biochem-lab": { label: "Experimental Design", accent: "#ffb29d", motif: "chart" },
  calculus: { label: "Rate & Change", accent: "#b9b0ff", motif: "wave" },
  physical: { label: "Energy Landscapes", accent: "#9bd5ff", motif: "wave" },
  genbio: { label: "Cell Systems", accent: "#8af0cd", motif: "cell" },
  molbio: { label: "Genetic Information", accent: "#ffbb82", motif: "helix" },
  microbio: { label: "Microbial Systems", accent: "#95e0aa", motif: "cell" },
  bioinformatics: { label: "Sequence Analysis", accent: "#8de5d9", motif: "chart" },
  genetics: { label: "Inheritance & Control", accent: "#ffb0b8", motif: "helix" },
  problems: { label: "Applied Practice", accent: "#c6b0ff", motif: "chart" },
  lab: { label: "Simulation Workspace", accent: "#8ef0e0", motif: "chart" },
  resources: { label: "Reference Hub", accent: "#b8d8ff", motif: "pathway" },
  glossary: { label: "Key Vocabulary", accent: "#d8b7ff", motif: "pathway" },
  "metabolic-cycles": { label: "Pathway Integration", accent: "#ffc18f", motif: "pathway" },
  "mcat-prep": { label: "High-Yield Review", accent: "#cbd5df", motif: "chart" },
  "cell-biology": { label: "Membranes & Organelles", accent: "#8ce8d8", motif: "cell" },
  "cell-physiology": { label: "Transport & Potentials", accent: "#8ee7ce", motif: "wave" },
  immunology: { label: "Defense Networks", accent: "#ffb4a9", motif: "cell" },
  "cognitive-psychology": { label: "Memory & Attention", accent: "#d3b5ff", motif: "wave" },
  neurobiology: { label: "Signals & Synapses", accent: "#c6d2dd", motif: "wave" },
  viewer: { label: "Small Molecule Models", accent: "#d7b4ff", motif: "hex" },
  "protein-viewer": { label: "Protein Structure", accent: "#ddc2ff", motif: "helix" },
  degree: { label: "Learning Roadmap", accent: "#b7d7ff", motif: "pathway" },
  about: { label: "Platform Overview", accent: "#d3dde5", motif: "pathway" },
  contact: { label: "Support & Feedback", accent: "#9fe9b8", motif: "pathway" },
};

const escapeXml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const clamp = (value) => Math.max(0, Math.min(255, value));

const hexToRgb = (hex) => {
  const sanitized = hex.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized;

  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => clamp(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const mixColors = (base, target, amount) => {
  const rgbBase = hexToRgb(base);
  const rgbTarget = hexToRgb(target);

  return rgbToHex({
    r: Math.round(rgbBase.r + (rgbTarget.r - rgbBase.r) * amount),
    g: Math.round(rgbBase.g + (rgbTarget.g - rgbBase.g) * amount),
    b: Math.round(rgbBase.b + (rgbTarget.b - rgbBase.b) * amount),
  });
};

const svgToDataUri = (svg) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const buildMotif = (motif, accent, accentSoft, width, height) => {
  const centerX = width * 0.72;
  const centerY = height * 0.46;

  if (motif === "helix") {
    return `
      <path d="M ${centerX - 120} ${centerY - 88} C ${centerX - 20} ${centerY - 40}, ${centerX - 20} ${centerY + 40}, ${centerX + 120} ${centerY + 88}" stroke="${accent}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M ${centerX - 120} ${centerY + 88} C ${centerX - 20} ${centerY + 40}, ${centerX - 20} ${centerY - 40}, ${centerX + 120} ${centerY - 88}" stroke="${accentSoft}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M ${centerX - 82} ${centerY - 56} L ${centerX + 82} ${centerY + 56}" stroke="#ffffff" stroke-opacity="0.55" stroke-width="3"/>
      <path d="M ${centerX - 82} ${centerY + 56} L ${centerX + 82} ${centerY - 56}" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>
    `;
  }

  if (motif === "chart") {
    return `
      <rect x="${centerX - 116}" y="${centerY - 76}" width="232" height="150" rx="24" fill="#08101d" fill-opacity="0.28" stroke="${accentSoft}" stroke-width="2"/>
      <path d="M ${centerX - 88} ${centerY + 34} L ${centerX - 28} ${centerY - 8} L ${centerX + 18} ${centerY + 12} L ${centerX + 82} ${centerY - 50}" stroke="${accent}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${centerX - 88}" cy="${centerY + 34}" r="8" fill="${accent}"/>
      <circle cx="${centerX - 28}" cy="${centerY - 8}" r="8" fill="${accentSoft}"/>
      <circle cx="${centerX + 18}" cy="${centerY + 12}" r="8" fill="#ffffff"/>
      <circle cx="${centerX + 82}" cy="${centerY - 50}" r="8" fill="${accent}"/>
      <rect x="${centerX - 92}" y="${centerY + 54}" width="32" height="18" rx="9" fill="${accentSoft}" fill-opacity="0.9"/>
      <rect x="${centerX - 50}" y="${centerY + 42}" width="54" height="30" rx="10" fill="#ffffff" fill-opacity="0.6"/>
      <rect x="${centerX + 14}" y="${centerY + 26}" width="74" height="46" rx="12" fill="${accent}" fill-opacity="0.88"/>
    `;
  }

  if (motif === "cell") {
    return `
      <circle cx="${centerX - 24}" cy="${centerY}" r="88" fill="${accentSoft}" fill-opacity="0.92"/>
      <circle cx="${centerX - 24}" cy="${centerY}" r="34" fill="#08101d" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.4" stroke-width="4"/>
      <circle cx="${centerX + 96}" cy="${centerY - 52}" r="34" fill="${accent}" fill-opacity="0.9"/>
      <circle cx="${centerX + 62}" cy="${centerY + 70}" r="26" fill="#ffffff" fill-opacity="0.58"/>
      <path d="M ${centerX - 132} ${centerY + 108} C ${centerX - 64} ${centerY + 52}, ${centerX + 40} ${centerY + 52}, ${centerX + 122} ${centerY + 118}" stroke="${accent}" stroke-width="6" fill="none" stroke-linecap="round"/>
    `;
  }

  if (motif === "wave") {
    return `
      <path d="M ${centerX - 146} ${centerY + 26} C ${centerX - 104} ${centerY - 70}, ${centerX - 42} ${centerY - 70}, ${centerX + 6} ${centerY + 10} S ${centerX + 102} ${centerY + 98}, ${centerX + 144} ${centerY - 16}" stroke="${accent}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M ${centerX - 130} ${centerY + 86} C ${centerX - 74} ${centerY + 24}, ${centerX - 18} ${centerY + 24}, ${centerX + 38} ${centerY + 84} S ${centerX + 104} ${centerY + 128}, ${centerX + 144} ${centerY + 70}" stroke="${accentSoft}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="${centerX - 94}" cy="${centerY - 24}" r="10" fill="${accentSoft}"/>
      <circle cx="${centerX + 4}" cy="${centerY + 8}" r="10" fill="#ffffff"/>
      <circle cx="${centerX + 108}" cy="${centerY - 26}" r="10" fill="${accent}"/>
    `;
  }

  if (motif === "hex") {
    return `
      <path d="M ${centerX - 78} ${centerY - 60} L ${centerX - 38} ${centerY - 82} L ${centerX + 2} ${centerY - 60} L ${centerX + 2} ${centerY - 16} L ${centerX - 38} ${centerY + 6} L ${centerX - 78} ${centerY - 16} Z" fill="${accent}" fill-opacity="0.92"/>
      <path d="M ${centerX + 10} ${centerY - 16} L ${centerX + 52} ${centerY - 38} L ${centerX + 94} ${centerY - 16} L ${centerX + 94} ${centerY + 28} L ${centerX + 52} ${centerY + 50} L ${centerX + 10} ${centerY + 28} Z" fill="${accentSoft}" fill-opacity="0.95"/>
      <path d="M ${centerX - 26} ${centerY + 30} L ${centerX + 14} ${centerY + 8} L ${centerX + 54} ${centerY + 30} L ${centerX + 54} ${centerY + 74} L ${centerX + 14} ${centerY + 96} L ${centerX - 26} ${centerY + 74} Z" fill="#ffffff" fill-opacity="0.48"/>
      <path d="M ${centerX - 4} ${centerY - 18} L ${centerX + 12} ${centerY - 18}" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <path d="M ${centerX + 94} ${centerY + 6} L ${centerX + 110} ${centerY + 6}" stroke="#08101d" stroke-opacity="0.26" stroke-width="4" stroke-linecap="round"/>
    `;
  }

  return `
    <circle cx="${centerX - 108}" cy="${centerY - 18}" r="20" fill="${accentSoft}" />
    <circle cx="${centerX - 8}" cy="${centerY - 68}" r="16" fill="#ffffff" fill-opacity="0.65" />
    <circle cx="${centerX + 92}" cy="${centerY + 18}" r="24" fill="${accent}" />
    <path d="M ${centerX - 88} ${centerY - 18} L ${centerX - 18} ${centerY - 58} L ${centerX + 72} ${centerY + 6}" stroke="${accent}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M ${centerX - 88} ${centerY - 18} L ${centerX + 92} ${centerY + 18}" stroke="#ffffff" stroke-opacity="0.2" stroke-width="3" fill="none" stroke-linecap="round"/>
  `;
};

export const buildCategoryIllustration = ({
  category,
  topics = [],
  size = "hero",
  subtitle,
}) => {
  const meta = VISUAL_META[category.id] || VISUAL_META.default;
  const isHero = size === "hero";
  const width = isHero ? 960 : 420;
  const height = isHero ? 520 : 260;
  const baseColor = category.color || "#5b9bd5";
  const accent = meta.accent || mixColors(baseColor, "#ffffff", 0.35);
  const accentSoft = mixColors(accent, "#ffffff", 0.3);
  const backgroundEnd = mixColors(baseColor, "#08101d", 0.72);
  const backgroundMid = mixColors(baseColor, "#10213a", 0.55);
  const title = category.title;
  const label = subtitle || meta.label;
  const topicPills = topics.slice(0, 3);
  const pillY = isHero ? 332 : 164;
  const pillWidth = isHero ? 236 : 116;
  const pillHeight = isHero ? 44 : 30;
  const pillGap = isHero ? 18 : 12;
  const pillX = isHero ? 48 : 26;
  const pillFont = isHero ? 18 : 11;

  const pillMarkup = topicPills
    .map((topic, index) => {
      const x = pillX + index * (pillWidth + pillGap);
      return `
        <rect x="${x}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${isHero ? 20 : 15}" fill="#08101d" fill-opacity="0.42" stroke="#ffffff" stroke-opacity="0.15"/>
        <text x="${x + 16}" y="${pillY + (isHero ? 28 : 19)}" fill="#f7fbff" font-size="${pillFont}" font-family="Segoe UI, Tahoma, sans-serif">${escapeXml(topic.slice(0, isHero ? 24 : 14))}</text>
      `;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)} illustration">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${baseColor}" stop-opacity="0.96" />
          <stop offset="54%" stop-color="${backgroundMid}" stop-opacity="1" />
          <stop offset="100%" stop-color="${backgroundEnd}" stop-opacity="1" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="26%" r="48%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="${isHero ? 36 : 26}" fill="url(#bg)" />
      <rect width="${width}" height="${height}" rx="${isHero ? 36 : 26}" fill="url(#glow)" />
      <circle cx="${isHero ? 786 : 322}" cy="${isHero ? 118 : 72}" r="${isHero ? 134 : 72}" fill="${accent}" fill-opacity="0.12" />
      <text x="${isHero ? 48 : 26}" y="${isHero ? 74 : 42}" fill="#d7ecff" font-size="${isHero ? 20 : 12}" font-family="Segoe UI, Tahoma, sans-serif" letter-spacing="2">${escapeXml(label.toUpperCase())}</text>
      <text x="${isHero ? 48 : 26}" y="${isHero ? 156 : 90}" fill="#ffffff" font-size="${isHero ? 56 : 26}" font-family="Segoe UI, Tahoma, sans-serif" font-weight="700">${escapeXml(title)}</text>
      <text x="${isHero ? 48 : 26}" y="${isHero ? 214 : 122}" fill="#e7f3fd" font-size="${isHero ? 24 : 14}" font-family="Segoe UI, Tahoma, sans-serif">${escapeXml((subtitle && size !== "hero" ? subtitle : category.description || "").slice(0, isHero ? 72 : 34))}</text>
      <text x="${isHero ? 48 : 26}" y="${isHero ? 286 : 146}" fill="#d2e3f3" font-size="${isHero ? 18 : 11}" font-family="Segoe UI, Tahoma, sans-serif">${escapeXml(isHero ? "Visual anchors for the core ideas on this page" : "Key subtopic")}</text>
      ${pillMarkup}
      ${buildMotif(meta.motif, accent, accentSoft, width, height)}
    </svg>
  `;

  return svgToDataUri(svg);
};

