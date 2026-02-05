import React from "react";
import "./ResourcesPage.css";

const ResourcesPage = () => {
  const resources = {
    databases: [
      {
        title: "RCSB Protein Data Bank",
        url: "https://www.rcsb.org/",
        description: "Repository of 3D structures of proteins, nucleic acids, and complexes. Essential for visualizing real biomolecules.",
        tags: ["3D Structures", "Proteins", "DNA/RNA"]
      },
      {
        title: "PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/",
        description: "Free full-text archive of biomedical and life sciences journal literature. Search 35+ million citations.",
        tags: ["Research Papers", "Citations", "Articles"]
      },
      {
        title: "UniProt",
        url: "https://www.uniprot.org/",
        description: "Comprehensive, high-quality protein sequence and functional information. Essential reference for protein research.",
        tags: ["Proteins", "Sequences", "Function"]
      },
      {
        title: "NCBI Sequence Database",
        url: "https://www.ncbi.nlm.nih.gov/",
        description: "National Center for Biotechnology Information—comprehensive bioinformatics resource for DNA, RNA, and protein sequences.",
        tags: ["Bioinformatics", "Sequences", "Tools"]
      },
      {
        title: "Kyoto Encyclopedia of Genes and Genomes (KEGG)",
        url: "https://www.kegg.jp/",
        description: "Database of biological pathways, genetic information, and chemical compounds. Great for understanding metabolic routes.",
        tags: ["Pathways", "Metabolism", "Reactions"]
      },
      {
        title: "ExPASy",
        url: "https://www.expasy.org/",
        description: "Swiss bioinformatics resource portal with tools for sequence analysis, protein structure, and enzyme databases.",
        tags: ["Proteins", "Enzymes", "Analysis Tools"]
      }
    ],
    visualization: [
      {
        title: "Mol*",
        url: "https://molstar.org/",
        description: "Modern, powerful 3D molecular visualization framework. Used by RCSB PDB. Supports protein structures and molecular data.",
        tags: ["3D Visualization", "Web-based", "Molecules"]
      },
      {
        title: "NGL Viewer",
        url: "https://nglviewer.org/",
        description: "WebGL-based molecular viewer for large protein complexes. Fast rendering of biomolecular structures.",
        tags: ["3D Visualization", "Web-based", "Large Structures"]
      },
      {
        title: "PyMOL",
        url: "https://pymol.org/",
        description: "Professional molecular visualization software. Industry standard for research and education. Desktop application.",
        tags: ["3D Visualization", "Desktop", "Advanced"]
      },
      {
        title: "SWISS-PdbViewer",
        url: "https://spdbv.ucsf.edu/",
        description: "User-friendly tool for viewing and analyzing 3D structures of biological macromolecules.",
        tags: ["3D Visualization", "Structure Analysis"]
      },
      {
        title: "Chimera/ChimeraX",
        url: "https://www.rbvi.ucsf.edu/chimerax/",
        description: "Visualization system for interactive exploration of structures, sequences, and related data.",
        tags: ["3D Visualization", "Advanced Analysis"]
      },
      {
        title: "JSmol",
        url: "https://jsmol.sourceforge.net/",
        description: "JavaScript-based molecular viewer compatible with desktop viewers. Great for web integration.",
        tags: ["3D Visualization", "JavaScript", "Web-based"]
      }
    ],
    labs: [
      {
        title: "PhET Interactive Simulations",
        url: "https://phet.colorado.edu/",
        description: "Free interactive simulations covering chemistry, physics, and biology. Excellent for hands-on learning.",
        tags: ["Virtual Lab", "Simulations", "Interactive"]
      },
      {
        title: "Labster Virtual Labs",
        url: "https://www.labster.com/",
        description: "Immersive virtual lab platform for chemistry and biology. Covers enzyme kinetics, fermentation, and more.",
        tags: ["Virtual Lab", "Simulations", "Premium"]
      },
      {
        title: "OpenStax Biology & Chemistry",
        url: "https://openstax.org/",
        description: "Free, peer-reviewed textbooks with integrated simulations and interactive elements for biology and chemistry.",
        tags: ["Textbooks", "Simulations", "Free"]
      },
      {
        title: "Khan Academy: Biochemistry",
        url: "https://www.khanacademy.org/science/chemistry",
        description: "Free video tutorials on chemistry and biochemistry topics, with practice problems and explanations.",
        tags: ["Video Tutorials", "Practice Problems", "Free"]
      },
      {
        title: "Biology Online",
        url: "https://www.biology-online.org/",
        description: "Virtual laboratory with experiments and 3D models for biology and chemistry education.",
        tags: ["Virtual Lab", "3D Models"]
      }
    ],
    learning: [
      {
        title: "LibreTexts Chemistry",
        url: "https://chem.libretexts.org/",
        description: "Comprehensive, free chemistry textbook with detailed explanations, examples, and interactive content.",
        tags: ["Textbook", "Free", "Comprehensive"]
      },
      {
        title: "LibreTexts Biology",
        url: "https://bio.libretexts.org/",
        description: "Free biology textbook covering molecular biology, biochemistry, genetics, and cell biology.",
        tags: ["Textbook", "Free", "Comprehensive"]
      },
      {
        title: "Enzyme Kinetics Visualizer",
        url: "https://en.wikipedia.org/wiki/Michaelis%E2%80%93Menten_kinetics",
        description: "Wikipedia overview of Michaelis-Menten kinetics with equations, graphs, and historical context.",
        tags: ["Enzyme Kinetics", "Theory", "Reference"]
      },
      {
        title: "Berg, Tymoczko & Stryer's Biochemistry",
        url: "https://www.macmillanlearning.com/college/us/product/Biochemistry/p/1319114881",
        description: "Standard biochemistry textbook used in universities worldwide. Available in free and premium versions.",
        tags: ["Textbook", "Advanced", "Reference"]
      },
      {
        title: "Molecular Biology of the Cell (Alberts)",
        url: "https://www.garlandscience.com/product/molecular-biology-of-the-cell/",
        description: "Authoritative textbook on cellular and molecular biology. Essential reference for advanced studies.",
        tags: ["Textbook", "Advanced", "Reference"]
      },
      {
        title: "Campbell Biology",
        url: "https://www.pearson.com/en-us/subject-catalog/p/campbell-biology/P200000003378",
        description: "Comprehensive introductory biology textbook with chapters on biochemistry and molecular biology.",
        tags: ["Textbook", "Introductory", "Comprehensive"]
      }
    ],
    tools: [
      {
        title: "NCBI BLAST",
        url: "https://blast.ncbi.nlm.nih.gov/",
        description: "Compare protein or nucleotide sequences to find similarities. Essential bioinformatics tool.",
        tags: ["Sequence Analysis", "Bioinformatics", "Free"]
      },
      {
        title: "Clustal Omega",
        url: "https://www.ebi.ac.uk/Tools/msa/clustalo/",
        description: "Multiple sequence alignment tool for comparing and analyzing protein/DNA sequences.",
        tags: ["Sequence Analysis", "Alignment", "Free"]
      },
      {
        title: "SWISS-MODEL",
        url: "https://swissmodel.expasy.org/",
        description: "Automated protein structure homology modeling. Predict 3D structures from amino acid sequences.",
        tags: ["Structure Prediction", "Modeling", "Free"]
      },
      {
        title: "Jmol",
        url: "http://jmol.sourceforge.net/",
        description: "Open-source Java viewer for 3D chemical structures, utilized in many educational websites.",
        tags: ["3D Visualization", "Open Source", "Educational"]
      },
      {
        title: "ImageJ",
        url: "https://imagej.net/",
        description: "Open-source image analysis software. Useful for analyzing experimental data and microscopy images.",
        tags: ["Image Analysis", "Data Analysis", "Open Source"]
      },
      {
        title: "GraphPad Prism",
        url: "https://www.graphpad.com/",
        description: "Data analysis and visualization software widely used in life sciences research.",
        tags: ["Data Analysis", "Statistics", "Premium"]
      }
    ]
  };

  return (
    <div className="resources-page">
      <div className="resources-container">
        {/* Hero Section */}
        <section className="resources-hero">
          <div className="hero-content">
            <h1>Resources & Links</h1>
            <p className="hero-subtitle">
              Curated collection of databases, visualization tools, virtual labs, and learning resources for biochemistry and molecular biology
            </p>
          </div>
        </section>

        {/* Databases Section */}
        <section className="resources-section">
          <div className="section-header">
            <h2>
              <i className="fa-solid fa-database"></i> Databases & Molecular References
            </h2>
            <p>Access authoritative biological databases and molecular structure repositories</p>
          </div>
          <div className="resources-grid">
            {resources.databases.map((resource, idx) => (
              <ResourceCard key={idx} resource={resource} />
            ))}
          </div>
        </section>

        {/* Visualization Section */}
        <section className="resources-section">
          <div className="section-header">
            <h2>
              <i className="fa-solid fa-cube"></i> 3D Visualization Tools
            </h2>
            <p>Professional and educational tools for visualizing molecular structures</p>
          </div>
          <div className="resources-grid">
            {resources.visualization.map((resource, idx) => (
              <ResourceCard key={idx} resource={resource} />
            ))}
          </div>
        </section>

        {/* Virtual Labs Section */}
        <section className="resources-section">
          <div className="section-header">
            <h2>
              <i className="fa-solid fa-flask-vial"></i> Virtual Labs & Simulations
            </h2>
            <p>Interactive simulations and hands-on learning experiences</p>
          </div>
          <div className="resources-grid">
            {resources.labs.map((resource, idx) => (
              <ResourceCard key={idx} resource={resource} />
            ))}
          </div>
        </section>

        {/* Learning Resources Section */}
        <section className="resources-section">
          <div className="section-header">
            <h2>
              <i className="fa-solid fa-book"></i> Learning Resources & Textbooks
            </h2>
            <p>Comprehensive textbooks, courses, and reference materials</p>
          </div>
          <div className="resources-grid">
            {resources.learning.map((resource, idx) => (
              <ResourceCard key={idx} resource={resource} />
            ))}
          </div>
        </section>

        {/* Tools Section */}
        <section className="resources-section">
          <div className="section-header">
            <h2>
              <i className="fa-solid fa-screwdriver"></i> Analysis & Bioinformatics Tools
            </h2>
            <p>Sequence analysis, structure prediction, and data analysis tools</p>
          </div>
          <div className="resources-grid">
            {resources.tools.map((resource, idx) => (
              <ResourceCard key={idx} resource={resource} />
            ))}
          </div>
        </section>

        {/* Tips Section */}
        <section className="resources-tips">
          <h2>Tips for Using These Resources</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <h3>
                <i className="fa-solid fa-lightbulb"></i> For Protein 3D Structures
              </h3>
              <p>Start with RCSB PDB, use Mol* or PyMOL to visualize structures, then explore related structures and literature.</p>
            </div>

            <div className="tip-card">
              <h3>
                <i className="fa-solid fa-lightbulb"></i> For Learning Biochemistry
              </h3>
              <p>Combine textbooks (LibreTexts, Campbell Biology) with virtual labs (PhET, OpenStax) and this platform for interactive practice.</p>
            </div>

            <div className="tip-card">
              <h3>
                <i className="fa-solid fa-lightbulb"></i> For Research
              </h3>
              <p>Use BLAST for sequence comparison, PubMed for literature, and UniProt for protein function information.</p>
            </div>

            <div className="tip-card">
              <h3>
                <i className="fa-solid fa-lightbulb"></i> For Bioinformatics
              </h3>
              <p>Combine NCBI tools (BLAST, FASTA), multiple sequence alignment (Clustal), and structure prediction (SWISS-MODEL).</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ResourceCard = ({ resource }) => {
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-card">
      <div className="card-header">
        <h3>{resource.title}</h3>
        <i className="fa-solid fa-arrow-up-right-from-square"></i>
      </div>
      <p className="card-description">{resource.description}</p>
      <div className="card-tags">
        {resource.tags.map((tag, idx) => (
          <span key={idx} className="resource-tag">
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
};

export default ResourcesPage;
