# Interactive Biochemistry Guide

An interactive biochemistry learning platform built for students who learn better by doing than reading. Features a custom canvas-based protein viewer with RCSB and AlphaFold structures, a Michaelis-Menten kinetics simulator with client-side curve fitting, and 100+ topic cards with LaTeX-rendered equations.

**Live Demo:** [Deployed on GitHub Pages](https://gculb.github.io/BiochemReact)

**Viewer preview**

![Demo](./public/demos/demo-gif.gif)

## 🎯 Features

### 📚 Learning Modules
- **35+ Topic Categories** covering General Chemistry, Organic Chemistry, Biochemistry I & II, Molecular Biology, Genetics, Bioinformatics, and more
- **100+ Interactive Topic Cards** with expandable details and LaTeX-rendered mathematical equations
- **Critical Concepts** section highlighting essential topics with color-coded importance indicators
- **Practice Problem Bank** with categorized problems and detailed solutions
- **RCSB Protein Search** supporting PDB IDs, protein names, and full-text database results
- **Protein Comparison Mode** with side-by-side structures, Cα overlays, AlphaFold mode, and statistics

### 🧪 Interactive Tools

#### 3D Molecular Viewer
- **10+ Molecules** including glucose, ATP, amino acids, DNA, proteins, and lipids
- **Interactive Rotation & Zoom** using mouse drag and scroll
- **Save Custom Views** to localStorage for quick reference
- **Detailed Info Cards** with molecular properties and biochemical role
- **Responsive Design** optimized for desktop and tablet

#### Michaelis-Menten Kinetics Lab
- **Parameter Exploration** adjust enzyme concentration, Km, Vmax, and substrate range
- **Data Generation** with optional realistic noise simulation
- **Curve Fitting** automatic parameter estimation from generated data
- **Real-time Visualization** with Chart.js plotting
- **Educational Annotations** with theory, equations, and interpretation guide

### 🔬 Technical Features
- **LaTeX Math Rendering** using KaTeX for proper equation display
- **Data-Driven Architecture** all content sourced from JSON files
- **Client-Side Data Fitting** parameter optimization without server calls
- **Persistent Storage** save molecular views to browser localStorage
- **Accessibility** keyboard navigation, ARIA labels, semantic HTML
- **Responsive Design** mobile-first CSS with breakpoints for all devices
- **Performance Optimized** efficient animations and sampled large-structure overlays

## 📋 Technology Stack

### Frontend
- **React** 19.2.4 – Modern component architecture with hooks
- **React Router** 7.13.0 – Client-side routing
- **Three.js** 0.182.0 – 3D molecular visualization
- **Canvas 2D** – custom protein ribbon and Cα rendering
- **Chart.js** – Data plotting and visualization
- **KaTeX** 0.16.28 – LaTeX math rendering
- **react-katex** 3.1.0 – React wrapper for KaTeX
- **FontAwesome** 7.1.0 – Icon library

### Build & Deploy
- **Create React App** – Standard React project setup
- **GitHub Pages** – Free hosting and deployment
- **gh-pages** – GitHub Pages deployment tool
- **GitHub Actions** – Automated test and production-build checks for pushes and pull requests

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm (or yarn)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gculb/BiochemReact.git
   cd BiochemReact
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

### Building & Deployment

**Build for production:**
```bash
npm run build
```

**Deploy to GitHub Pages:**
```bash
npm run deploy
```

**Run tests:**
```bash
npm test -- --watchAll=false
```

The test suite includes protein parsing and calculation checks plus UI interaction tests for homepage navigation and sidebar controls. CI runs the test suite and production build automatically through [`.github/workflows/ci.yml`](.github/workflows/ci.yml).



## 🎮 Usage Guide

### Browsing Topics
1. Click on a category in the sidebar
2. Expand topic cards to view summaries and details
3. Equations render with LaTeX formatting
4. Star-marked topics are critical concepts

### 3D Molecular Viewer
1. Navigate to **Viewer** or click "Launch 3D Viewer"
2. Select a molecule from the left panel
3. **Mouse Controls:**
   - Click and drag to rotate
   - Scroll to zoom in/out
4. Use the fold/unfold controls or pause automatic rotation
5. Search for another PDB structure or open **Compare proteins**
6. Save current view by entering a name and clicking "Save"
7. Restore saved views instantly

### Kinetics Lab
1. Navigate to **Lab** or click "Try Virtual Lab"
2. Adjust enzyme kinetic parameters:
   - **[E]**: Enzyme concentration
   - **kcat**: Turnover number (catalytic constant)
   - **Km**: Michaelis constant
   - **[S]max**: Maximum substrate concentration
   - **Step**: Data point spacing
   - **Noise**: Toggle ±8% experimental error
3. Click **"Generate Data"** to simulate enzyme kinetics
4. Review the hyperbolic curve and true parameters
5. Click **"Fit Parameters"** to estimate Km and Vmax from data
6. Compare fitted vs. actual values

### Practice Problems
1. Select a category from the sidebar
2. Scroll to the Practice Problems section
3. Each problem shows:
   - Category and difficulty
   - Question text (with equations if applicable)
   - Collapsible hint and solution
4. Toggle solutions to check your work

## 📊 Data Structure

### topicCards.json
Each topic has:
```json
{
  "id": "unique-id",
  "title": "Topic Title",
  "summary": "Brief description (displays when collapsed)",
  "details": "Detailed explanation (displays when expanded)",
  "important": false
}
```

### categories.json
Each category has:
```json
{
  "id": "category-id",
  "title": "Category Title",
  "icon": "FontAwesome icon name",
  "color": "#HEX color",
  "description": "Category description",
  "order": 0-26
}
```

## 🔮 Future Enhancements
NO MORE PLANNED FEATURES. 

### Planned Features
- [x] 3D Protein Visualizations
- [x] RCSB and AlphaFold protein comparison
- [*] Student problem-solving with code execution  (Bioinformatics)
- [*] Activity logging and progress tracking 
- [*] Glossary with searchable terms
- [*] Add more sections




## 🏆 Code Quality

- **React Hooks** for modern state management
- **Semantic HTML** for accessibility
- **Responsive Design** mobile-first CSS
- **Performance Optimized** efficient animations and responsive layouts
- **Automated CI** GitHub Actions runs tests and production builds on pushes and pull requests
- **JSDoc Comments** for complex logic
- **Consistent Styling** with CSS modules and classes

## 📝 License

This project is licensed under the ISC License. See package.json for details.

## 👨‍💻 Author

**Grant Culbertson**
- GitHub: [@gculb](https://github.com/gculb)


## 🙏 Acknowledgments

- **Three.js** – molecular rendering library used by the molecule viewer
- **RCSB PDB** – protein structure data and search API
- **AlphaFold EBI** – predicted structure data
- **Chart.js** – Data visualization
- **KaTeX** – LaTeX math rendering
- **React** – Frontend framework
- **FontAwesome** – Icon library

## 🐛 Troubleshooting

### 3D Viewer Not Rendering
- The protein viewer uses Canvas 2D; reload the page and check the browser console for API errors
- The molecule viewer uses WebGL through Three.js; ensure your browser supports WebGL
- Try a different browser (Chrome, Firefox, Safari)

### Math Equations Not Displaying
- KaTeX requires proper LaTeX syntax: `$...$` for inline, `$$...$$` for block
- Check console for parsing errors

### Slow Data Fitting
- Parameter fitting uses brute-force search; reduce range or step size
- Currently optimized for Km ≤ 500, Vmax ≤ 1000

## 📧 Contact

For questions, suggestions, or contributions, please open an issue or pull request on the [GitHub repository](https://github.com/gculb/BiochemReact).

---

**Last Updated:** September 2026
