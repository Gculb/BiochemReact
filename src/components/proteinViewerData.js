// Protein viewer API endpoints and display data.
export const RCSB_META = id => `https://data.rcsb.org/rest/v1/core/entry/${id}`;
export const RCSB_ENTITY = id => `https://data.rcsb.org/rest/v1/core/polymer_entity/${id}/1`;
export const RCSB_PDB = id => `https://files.rcsb.org/download/${id}.pdb`;
export const RCSB_SEARCH = "https://search.rcsb.org/rcsbsearch/v2/query";
export const UNIPROT_SEARCH = pdb =>
  `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(`xref:pdb-${pdb}`)}&format=json` +
  `&fields=accession,id,protein_name,gene_names,organism_name,cc_function,ft_domain,sequence,` +
  `cc_disease,keyword,cc_subcellular_location,cc_cofactor,ft_act_site,ft_binding,ft_site&size=1`;
export const AF_API = uniprotAcc => `https://alphafold.ebi.ac.uk/api/prediction/${uniprotAcc}`;

export const PROTEINS = {
  "1MBN": { label: "Myoglobin",        class: "All-α",       bio: "Oxygen storage in muscle" },
  "4INS": { label: "Insulin",          class: "α + α",       bio: "Blood glucose regulation" },
  "1TIM": { label: "TIM Barrel",       class: "(β/α)₈",      bio: "Triosephosphate isomerase" },
  "2POR": { label: "Porin",            class: "All-β barrel", bio: "Outer membrane channel" },
  "3NIR": { label: "GFP",              class: "β-barrel",    bio: "Green fluorescent protein" },
  "1HHO": { label: "Hemoglobin",       class: "All-α",       bio: "O₂ transport (α₂β₂ tetramer)" },
  "1CAG": { label: "Collagen",         class: "Triple helix", bio: "Extracellular matrix structure" },
  "6LU7": { label: "SARS-CoV-2 Mpro",  class: "α/β mixed",   bio: "Main protease, key drug target" },
  "5XNL": { label: "p53 DBD",          class: "β-sandwich",  bio: "Tumor suppressor DNA-binding domain", tier: "advanced" },
  "1UBQ": { label: "Ubiquitin",         class: "α+β",         bio: "Protein degradation tag" },
};

export const WARN_THRESHOLD = 5000;
export const BLOCK_THRESHOLD = 20000;
export const SS_COLOR = { 0: "#7f8896", 1: "#79a8ca", 2: "#c8a35b" };
export const SS_WIDTH = { 0: 2, 1: 5.5, 2: 4 };
export const SITE_COLORS = {
  "Active site": "#d7c06a",
  "Binding site": "#87aec0",
  "Site": "#b28ab8",
  default: "#c8a35b",
};

export const AA_MASS = {
  A:89.09,R:174.20,N:132.12,D:133.10,C:121.16,E:147.13,Q:146.15,G:75.03,
  H:155.16,I:131.17,L:131.17,K:146.19,M:149.20,F:165.19,P:115.13,S:105.09,
  T:119.12,W:204.23,Y:181.19,V:117.15,
};
export const KD = {
  A:1.8,R:-4.5,N:-3.5,D:-3.5,C:2.5,E:-3.5,Q:-3.5,G:-0.4,H:-3.2,
  I:4.5,L:3.8,K:-3.9,M:1.9,F:2.8,P:-1.6,S:-0.8,T:-0.7,W:-0.9,Y:-1.3,V:4.2,
};
export const PKA = {
  D:3.65,E:4.25,C:8.18,Y:10.07,H:6.00,K:10.53,R:12.48,Nterm:8.00,Cterm:3.10,
};
export const DIWV_DESTAB = new Set([
  "WW","WC","WM","WH","WF","WR","WK","WQ","WP","WS","WN","WT","WA","WD","WE","WG","WI","WL","WV","WY",
  "CK","CM","CS","CT","CH","CR","CC","CQ","CP","CN","CA","CD","CE","CF","CG","CI","CL","CV","CY","CW",
  "MK","ML","MM","MR","MS","MN","MC","MA","MD","ME","MF","MG","MH","MI","MP","MQ","MT","MV","MY","MW",
  "FK","FM","FR","FY","FW","FC","FH","FN","FD","FE","FG","FI","FL","FP","FQ","FS","FT","FA","FV",
  "YK","YM","YR","YC","YD","YE","YF","YG","YH","YI","YL","YN","YP","YQ","YS","YT","YA","YV","YW",
  "IK","IM","IR","IC","ID","IE","IF","IG","IH","IL","IN","IP","IQ","IS","IT","IA","IV","IW","IY",
  "LK","LR","LC","LD","LE","LF","LG","LH","LI","LM","LN","LP","LQ","LS","LT","LA","LV","LW","LY",
  "RK","RR","RM","RC","RD","RE","RF","RG","RH","RI","RL","RN","RP","RQ","RS","RT","RA","RV","RW","RY",
  "KK","KR","KM","KC","KD","KE","KF","KG","KH","KI","KL","KN","KP","KQ","KS","KT","KA","KV","KW","KY",
  "SS","ST","SD","SE","SF","SG","SH","SI","SK","SL","SM","SN","SP","SQ","SR","SA","SV","SW","SY",
]);
export const HALFLIFE = {
  A:{mam:"4.4h",yeast:">20h",ecoli:">10h"}, R:{mam:"1h",yeast:"2min",ecoli:"2min"},
  N:{mam:"1.4h",yeast:"3min",ecoli:">10h"}, D:{mam:"1.1h",yeast:"3min",ecoli:"1.1h"},
  C:{mam:"1.2h",yeast:">20h",ecoli:">10h"}, E:{mam:"1h",yeast:"30min",ecoli:"1h"},
  Q:{mam:"0.8h",yeast:"10min",ecoli:">10h"}, G:{mam:"30h",yeast:">20h",ecoli:">10h"},
  H:{mam:"3.5h",yeast:"10min",ecoli:">10h"}, I:{mam:"20h",yeast:"30min",ecoli:">10h"},
  L:{mam:"5.5h",yeast:"3min",ecoli:"2min"}, K:{mam:"1.3h",yeast:"3min",ecoli:"2min"},
  M:{mam:"30h",yeast:">20h",ecoli:">10h"}, F:{mam:"1.1h",yeast:"3min",ecoli:"2min"},
  P:{mam:">20h",yeast:">20h",ecoli:"?"}, S:{mam:"1.9h",yeast:">20h",ecoli:">10h"},
  T:{mam:"7.2h",yeast:">20h",ecoli:">10h"}, W:{mam:"2.8h",yeast:"3min",ecoli:"2min"},
  Y:{mam:"2.8h",yeast:"10min",ecoli:"2min"}, V:{mam:"100h",yeast:">20h",ecoli:">10h"},
};

export function plddtColor(v) {
  if (v >= 90) return "#5f8f7b";
  if (v >= 70) return "#6f90b0";
  if (v >= 50) return "#b89257";
  return "#a97878";
}
