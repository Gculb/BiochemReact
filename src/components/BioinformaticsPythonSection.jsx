import React, { useState } from "react";
import "./BioinformaticsPythonSection.css";

const workflowCards = [
  {
    title: "Read FASTA",
    icon: "fa-file-lines",
    text: "Parse sequence records, validate headers, and keep sequence metadata attached to each sample."
  },
  {
    title: "Clean Sequences",
    icon: "fa-broom",
    text: "Normalize case, remove gaps when appropriate, and flag ambiguous bases before analysis."
  },
  {
    title: "Compute Metrics",
    icon: "fa-chart-simple",
    text: "Calculate GC content, k-mer frequencies, translation frames, and simple sequence quality checks."
  },
  {
    title: "Compare Results",
    icon: "fa-code-compare",
    text: "Summarize alignments, annotate variants, and export tables for downstream reports."
  }
];

const starterCode = `from Bio import SeqIO

def gc_content(seq):
    seq = str(seq).upper()
    gc = seq.count("G") + seq.count("C")
    return round((gc / len(seq)) * 100, 2)

records = SeqIO.parse("samples.fasta", "fasta")

for record in records:
    print(record.id, len(record.seq), gc_content(record.seq))`;

const sampleFasta = `>insulin_alpha
GIVEQCCTSICSLYQLENYCN
>hemoglobin_beta
MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLST
>gc_rich_marker
GCGCGATCGCCGATCGGCCAT`;

const parseFasta = (text) => {
  const records = [];
  let current = null;

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) return;

    if (trimmed.startsWith(">")) {
      current = { id: trimmed.slice(1).trim() || "unnamed_record", seq: "" };
      records.push(current);
      return;
    }

    if (!current) {
      current = { id: "unnamed_record", seq: "" };
      records.push(current);
    }

    current.seq += trimmed.replace(/\s/g, "");
  });

  return records;
};

const getGcContent = (sequence) => {
  const cleaned = sequence.toUpperCase().replace(/[^ACGT]/g, "");
  if (!cleaned.length) return null;

  const gc = [...cleaned].filter((base) => base === "G" || base === "C").length;
  return {
    length: cleaned.length,
    gc: Number(((gc / cleaned.length) * 100).toFixed(2))
  };
};

const validateCode = (code) => {
  const checks = [
    {
      ok: /def\s+gc_content\s*\(/.test(code),
      message: "Define a gc_content function."
    },
    {
      ok: /count\s*\(\s*["']G["']\s*\)/.test(code) && /count\s*\(\s*["']C["']\s*\)/.test(code),
      message: "Count both G and C bases."
    },
    {
      ok: /len\s*\(/.test(code),
      message: "Use sequence length in the percentage calculation."
    },
    {
      ok: /print\s*\(/.test(code),
      message: "Print each record result."
    }
  ];

  return checks.filter((check) => !check.ok).map((check) => check.message);
};

const BioinformaticsPythonSection = () => {
  const [code, setCode] = useState(starterCode);
  const [fasta, setFasta] = useState(sampleFasta);
  const [output, setOutput] = useState("Run the practice script to see sequence metrics.");
  const [feedback, setFeedback] = useState([]);

  const runPractice = () => {
    const missingChecks = validateCode(code);
    const records = parseFasta(fasta);
    const rows = records
      .map((record) => {
        const metric = getGcContent(record.seq);
        return metric ? `${record.id}\t${metric.length} bp\t${metric.gc}% GC` : `${record.id}\tNo valid A/C/G/T bases`;
      });

    setFeedback(missingChecks);
    setOutput(rows.length ? rows.join("\n") : "No FASTA records found. Add a header like >sample_1 and a sequence.");
  };

  const resetPractice = () => {
    setCode(starterCode);
    setFasta(sampleFasta);
    setFeedback([]);
    setOutput("Run the practice script to see sequence metrics.");
  };

  return (
    <section className="bio-python" aria-labelledby="bio-python-title">
      <div className="bio-python__intro">
        <p className="bio-python__eyebrow">Python Coding</p>
        <h2 id="bio-python-title">Bioinformatics Coding Practice</h2>
        <p>
          Practice the core scripting moves used in sequence analysis: reading FASTA files, cleaning records,
          calculating sequence metrics, and turning results into reproducible tables.
        </p>
      </div>

      <div className="bio-python__layout">
        <div className="bio-python__workflow">
          {workflowCards.map((card) => (
            <article className="bio-python__card" key={card.title}>
              <span>
                <i className={`fa-solid ${card.icon}`} />
              </span>
              <div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="bio-python__practice">
          <div className="bio-python__code-panel">
            <div className="bio-python__code-header">
              <span>gc_content.py</span>
              <i className="fa-brands fa-python" aria-hidden="true" />
            </div>
            <textarea
              className="bio-python__editor"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck="false"
              aria-label="Editable Python practice code"
            />
          </div>

          <div className="bio-python__runner-grid">
            <label className="bio-python__input-panel">
              <span>samples.fasta</span>
              <textarea
                value={fasta}
                onChange={(event) => setFasta(event.target.value)}
                spellCheck="false"
                aria-label="Sample FASTA input"
              />
            </label>

            <div className="bio-python__output-panel">
              <div className="bio-python__output-header">
                <span>Output</span>
                <div className="bio-python__actions">
                  <button type="button" onClick={resetPractice}>
                    Reset
                  </button>
                  <button type="button" className="bio-python__run" onClick={runPractice}>
                    <i className="fa-solid fa-play" aria-hidden="true" />
                    Run
                  </button>
                </div>
              </div>
              <pre>{output}</pre>
              {feedback.length > 0 && (
                <div className="bio-python__feedback" role="status">
                  <strong>Check your code:</strong>
                  <ul>
                    {feedback.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BioinformaticsPythonSection;
