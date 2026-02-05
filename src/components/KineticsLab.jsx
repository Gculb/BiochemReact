/**
 * KineticsLab Component
 * Interactive Michaelis-Menten enzyme kinetics simulator
 */

import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { InlineMath } from "react-katex";
import "./KineticsLab.css";

function KineticsLab() {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [data, setData] = useState(null);
  const [fit, setFit] = useState(null);

  // Form state
  const [E, setE] = useState(1.0);
  const [kcat, setKcat] = useState(100);
  const [Km, setKm] = useState(50);
  const [Smax, setSmax] = useState(300);
  const [step, setStep] = useState(10);
  const [noise, setNoise] = useState(false);

  // Michaelis-Menten equation
  const mmRate = (S, Vmax, Km) => {
    return (Vmax * S) / (Km + S);
  };

  // Generate kinetic data
  const generateData = () => {
    const Vmax = kcat * E;
    const newData = [];

    for (let S = 0; S <= Smax + 1e-9; S += step) {
      let v = mmRate(S, Vmax, Km);

      if (noise) {
        const sigma = 0.08 * v; // ±8% noise
        const noiseAmount = (Math.random() * 2 - 1) * sigma;
        v = v + noiseAmount;
        if (v < 0) v = 0; // Prevent negative values
      }

      newData.push({
        S: parseFloat(S.toFixed(3)),
        v: parseFloat(v.toFixed(4))
      });
    }

    setData({ data: newData, Vmax });
    setFit(null); // Clear previous fit
    plotData(newData);
  };

  // Plot data
  const plotData = (plotData) => {
    if (!chartRef.current || !plotData) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Initial velocity (v₀)",
            data: plotData.map((d) => ({ x: d.S, y: d.v })),
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.4)",
            showLine: true,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              font: { size: 12 },
              color: "#2c3e50"
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: 10,
            callbacks: {
              label: function (context) {
                return `[S] = ${context.parsed.x.toFixed(1)} µM, v₀ = ${context.parsed.y.toFixed(2)} µM·s⁻¹`;
              }
            }
          }
        },
        scales: {
          x: {
            type: "linear",
            title: {
              display: true,
              text: "[S] Substrate Concentration (µM)",
              font: { size: 12, weight: "bold" }
            },
            ticks: { color: "#666" }
          },
          y: {
            title: {
              display: true,
              text: "v₀ Initial Velocity (µM·s⁻¹)",
              font: { size: 12, weight: "bold" }
            },
            ticks: { color: "#666" }
          }
        }
      }
    });
  };

  // Fit Michaelis-Menten parameters
  const fitParameters = () => {
    if (!data || !data.data) return;

    let best = { err: Infinity, kmTest: 0, vmaxTest: 0 };

    for (let kmTest = 1; kmTest <= 500; kmTest += 1) {
      for (let vmaxTest = 1; vmaxTest <= 1000; vmaxTest += 5) {
        let err = 0;
        for (const p of data.data) {
          const pred = mmRate(p.S, vmaxTest, kmTest);
          err += (pred - p.v) ** 2;
        }
        if (err < best.err) {
          best = { err, kmTest, vmaxTest };
        }
      }
    }

    setFit({
      Vmax: best.vmaxTest,
      Km: best.kmTest,
      err: best.err,
      rmse: Math.sqrt(best.err / data.data.length)
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="kinetics-lab">
      <div className="kl-header">
        <h2>Michaelis-Menten Kinetics Lab</h2>
        <p>
          Simulate enzyme kinetics and determine Km and Vmax from experimental data
        </p>
      </div>

      <div className="kl-container">
        {/* Chart */}
        <div className="kl-chart-section">
          <div className="kl-chart-wrap">
            <canvas ref={chartRef}></canvas>
          </div>
          <div className="kl-info">
            {data && (
              <>
                <div className="kl-info-block">
                  <h4>Experimental Data</h4>
                  <p>
                    <strong>True Vmax:</strong> {data.Vmax.toFixed(2)} µM·s⁻¹
                  </p>
                  <p>
                    <strong>True Km:</strong> {Km} µM
                  </p>
                  <p>
                    <strong>Data points:</strong> {data.data.length}
                  </p>
                </div>
              </>
            )}

            {fit && (
              <div className="kl-info-block kl-info-fit">
                <h4 style={{ color: "#2ecc71" }}>Fitted Parameters</h4>
                <p>
                  <strong>Fitted Vmax:</strong> {fit.Vmax.toFixed(1)} µM·s⁻¹
                </p>
                <p>
                  <strong>Fitted Km:</strong> {fit.Km.toFixed(1)} µM
                </p>
                <p>
                  <strong>RMSE:</strong> {fit.rmse.toFixed(4)}
                </p>
                <div className="kl-accuracy">
                  <span>
                    Vmax error: {Math.abs(fit.Vmax - data.Vmax).toFixed(2)} (
                    {(
                      (Math.abs(fit.Vmax - data.Vmax) / data.Vmax) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="kl-controls">
          <form className="kl-form" onSubmit={(e) => e.preventDefault()}>
            <div className="kl-form-group">
              <label>Enzyme Concentration [E] (µM)</label>
              <input
                type="number"
                value={E}
                onChange={(e) => setE(parseFloat(e.target.value) || 0)}
                min="0.1"
                max="10"
                step="0.1"
              />
              <small>0.1 – 10 µM</small>
            </div>

            <div className="kl-form-group">
              <label>Turnover Number kcat (s⁻¹)</label>
              <input
                type="number"
                value={kcat}
                onChange={(e) => setKcat(parseFloat(e.target.value) || 0)}
                min="10"
                max="1000"
                step="10"
              />
              <small>10 – 1000 s⁻¹</small>
            </div>

            <div className="kl-form-group">
              <label>Michaelis Constant Km (µM)</label>
              <input
                type="number"
                value={Km}
                onChange={(e) => setKm(parseFloat(e.target.value) || 0)}
                min="1"
                max="500"
                step="5"
              />
              <small>1 – 500 µM (what you're trying to find!)</small>
            </div>

            <div className="kl-form-group">
              <label>Maximum Substrate Concentration [S]max (µM)</label>
              <input
                type="number"
                value={Smax}
                onChange={(e) => setSmax(parseFloat(e.target.value) || 0)}
                min="50"
                max="1000"
                step="50"
              />
              <small>50 – 1000 µM</small>
            </div>

            <div className="kl-form-group">
              <label>Data Collection Step (µM)</label>
              <input
                type="number"
                value={step}
                onChange={(e) => setStep(parseFloat(e.target.value) || 1)}
                min="1"
                max="100"
                step="1"
              />
              <small>1 – 100 µM</small>
            </div>

            <div className="kl-form-group kl-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={noise}
                  onChange={(e) => setNoise(e.target.checked)}
                />
                Add ±8% random noise
              </label>
              <small>Realistic experimental error</small>
            </div>

            <div className="kl-buttons">
              <button className="kl-btn kl-btn-primary" onClick={generateData}>
                Generate Data
              </button>
              <button
                className="kl-btn kl-btn-secondary"
                onClick={fitParameters}
                disabled={!data}
              >
                Fit Parameters
              </button>
            </div>
          </form>

          {/* Theory Section */}
          <div className="kl-theory">
            <h4>Michaelis-Menten Equation</h4>
            <div className="kl-formula">
              <InlineMath>{String.raw`v_0 = \frac{V_{max} \cdot [S]}{K_m + [S]}`}</InlineMath>
            </div>
            <ul className="kl-definitions">
              <li>
                <strong>v₀:</strong> Initial reaction velocity
              </li>
              <li>
                <strong>Vmax:</strong> Maximum velocity; equals kcat times [E]
              </li>
              <li>
                <strong>Km:</strong> Michaelis constant; relates to substrate affinity
              </li>
              <li>
                <strong>[S]:</strong> Substrate concentration
              </li>
            </ul>

            <div className="kl-interpretation">
              <h5>Interpretation</h5>
              <ul>
                <li>
                  <strong>Low Km:</strong> High substrate affinity (enzyme catalyzes at low [S])
                </li>
                <li>
                  <strong>High Km:</strong> Low substrate affinity (need more substrate)
                </li>
                <li>
                  <strong>At [S] equals Km:</strong> v0 equals one-half Vmax
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KineticsLab;
