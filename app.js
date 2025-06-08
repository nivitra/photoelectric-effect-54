// Photoelectric Effect Laboratory Simulator
// Based on University Laboratory Manual Specifications
// Implements Einstein's photoelectric equation: E = hf = φ + KEmax

class PhotoelectricLaboratory {
    constructor() {
        // Physical constants (exact values from laboratory manual)
        this.constants = {
            planckConstant: 4.136e-15,     // eV·s
            speedOfLight: 3e8,             // m/s
            elementaryCharge: 1.602e-19    // C
        };

        // Laboratory filter specifications (exact from manual)
        this.filters = {
            blue: { wavelength: 438, frequency: 6.849e14, energy: 2.833, color: '#4169E1' },
            green: { wavelength: 565, frequency: 5.310e14, energy: 2.196, color: '#00FF00' },
            yellow: { wavelength: 578, frequency: 5.190e14, energy: 2.147, color: '#FFFF00' },
            orange: { wavelength: 598, frequency: 5.017e14, energy: 2.075, color: '#FFA500' }
        };

        // Photocathode materials database
        this.materials = [
            { name: "Cesium", symbol: "Cs", workFunction: 2.10, color: "#FF6B6B" },
            { name: "Sodium", symbol: "Na", workFunction: 2.28, color: "#4ECDC4" },
            { name: "Potassium", symbol: "K", workFunction: 2.30, color: "#45B7D1" },
            { name: "Aluminum", symbol: "Al", workFunction: 4.08, color: "#96CEB4" },
            { name: "Copper", symbol: "Cu", workFunction: 4.70, color: "#FFEAA7" },
            { name: "Silver", symbol: "Ag", workFunction: 4.73, color: "#DDA0DD" },
            { name: "Gold", symbol: "Au", workFunction: 5.10, color: "#FFD700" }
        ];

        // Laboratory state
        this.state = {
            currentMaterial: this.materials[0],
            currentFilter: 'blue',
            customWavelength: 438,
            voltage: 0,
            isExperimentActive: false,
            measurementCount: 0,
            autoSweepActive: false
        };

        // Data storage
        this.experimentData = [];
        this.ivData = [];
        this.frequencyData = [];
        
        // Animation system
        this.animationTime = 0;
        this.photonParticles = [];
        this.electronParticles = [];
        this.animationFrameId = null;

        // Chart instances
        this.ivChart = null;
        this.frequencyChart = null;

        this.initializeApplication();
    }

    initializeApplication() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCharts();
        this.updateAllCalculations();
        this.startAnimationLoop();
        this.logMessage("Laboratory simulator initialized - Ready for photoelectric effect experiment");
    }

    initializeElements() {
        // Control elements
        this.elements = {
            materialSelect: document.getElementById('material-select'),
            filterSelect: document.getElementById('filter-select'),
            customWavelengthGroup: document.getElementById('custom-wavelength-group'),
            wavelengthSlider: document.getElementById('wavelength-slider'),
            wavelengthValue: document.getElementById('wavelength-value'),
            voltageSlider: document.getElementById('voltage-slider'),
            voltageValue: document.getElementById('voltage-value'),
            
            // Display elements
            frequencyValue: document.getElementById('frequency-value'),
            photonEnergyDisplay: document.getElementById('photon-energy-display'),
            emissionStatus: document.getElementById('emission-status'),
            photonEnergyValue: document.getElementById('photon-energy-value'),
            workFunctionValue: document.getElementById('work-function-value'),
            maxKeValue: document.getElementById('max-ke-value'),
            stoppingPotentialDisplay: document.getElementById('stopping-potential-display'),
            thresholdFrequency: document.getElementById('threshold-frequency'),
            thresholdWavelength: document.getElementById('threshold-wavelength'),
            
            // Button elements
            switchLight: document.getElementById('switch-light'),
            takeMeasurement: document.getElementById('take-measurement'),
            autoSweep: document.getElementById('auto-sweep'),
            resetExperiment: document.getElementById('reset-experiment'),
            exportData: document.getElementById('export-data'),
            clearGraph: document.getElementById('clear-graph'),
            
            // Result displays
            stoppingPotential: document.getElementById('stopping-potential'),
            saturationCurrent: document.getElementById('saturation-current'),
            currentValue: document.getElementById('current-value'),
            liveCurrent: document.getElementById('live-current'),
            currentUncertainty: document.getElementById('current-uncertainty'),
            calculatedPlanck: document.getElementById('calculated-planck'),
            accuracy: document.getElementById('accuracy'),
            measurementCount: document.getElementById('measurement-count'),
            stdError: document.getElementById('std-error'),
            graphStatus: document.getElementById('graph-status'),
            
            // Canvas elements
            energyDiagram: document.getElementById('energy-diagram'),
            setupDiagram: document.getElementById('setup-diagram'),
            ivChart: document.getElementById('iv-chart'),
            frequencyChart: document.getElementById('frequency-chart'),
            
            // Data table and log
            dataTableBody: document.querySelector('#data-table tbody'),
            experimentLog: document.getElementById('experiment-log')
        };

        // Get canvas contexts
        this.energyCtx = this.elements.energyDiagram.getContext('2d');
        this.setupCtx = this.elements.setupDiagram.getContext('2d');
    }

    setupEventListeners() {
        // Material selection
        this.elements.materialSelect.addEventListener('change', (e) => {
            this.state.currentMaterial = this.materials[parseInt(e.target.value)];
            this.updateAllCalculations();
            this.logMessage(`Material changed to ${this.state.currentMaterial.name} (φ = ${this.state.currentMaterial.workFunction} eV)`);
        });

        // Filter selection
        this.elements.filterSelect.addEventListener('change', (e) => {
            const filterValue = e.target.value;
            if (filterValue === 'custom') {
                this.elements.customWavelengthGroup.style.display = 'block';
                this.updateWavelengthFromSlider();
            } else {
                this.elements.customWavelengthGroup.style.display = 'none';
                this.state.currentFilter = filterValue;
                this.updateFilterDisplay();
            }
            this.updateAllCalculations();
        });

        // Custom wavelength slider
        this.elements.wavelengthSlider.addEventListener('input', (e) => {
            this.state.customWavelength = parseInt(e.target.value);
            this.updateWavelengthFromSlider();
            this.updateAllCalculations();
        });

        // Voltage control - Fixed to ensure real-time updates
        this.elements.voltageSlider.addEventListener('input', (e) => {
            this.state.voltage = parseFloat(e.target.value);
            this.elements.voltageValue.textContent = this.state.voltage.toFixed(2);
            // Force immediate update of current reading
            this.updateCurrentReading();
            this.updateAllCalculations();
        });

        // Laboratory control buttons
        this.elements.switchLight.addEventListener('click', () => {
            this.toggleExperiment();
        });

        this.elements.takeMeasurement.addEventListener('click', () => {
            this.takePrecisionMeasurement();
        });

        this.elements.autoSweep.addEventListener('click', () => {
            this.performAutoSweep();
        });

        this.elements.resetExperiment.addEventListener('click', () => {
            this.resetExperiment();
        });

        this.elements.exportData.addEventListener('click', () => {
            this.exportLaboratoryData();
        });

        this.elements.clearGraph.addEventListener('click', () => {
            this.clearGraphs();
        });
    }

    initializeCharts() {
        // I-V Characteristic Chart
        const ivCtx = this.elements.ivChart;
        this.ivChart = new Chart(ivCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'I-V Characteristic',
                    data: [],
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    showLine: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Current vs Applied Voltage',
                        color: '#134252'
                    },
                    legend: {
                        labels: { color: '#134252' }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Applied Voltage (V)',
                            color: '#134252'
                        },
                        grid: { color: 'rgba(94, 82, 64, 0.2)' },
                        ticks: { color: '#134252' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Current (μA)',
                            color: '#134252'
                        },
                        grid: { color: 'rgba(94, 82, 64, 0.2)' },
                        ticks: { color: '#134252' }
                    }
                }
            }
        });

        // Frequency vs Stopping Potential Chart
        const freqCtx = this.elements.frequencyChart;
        this.frequencyChart = new Chart(freqCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Stopping Potential vs Frequency',
                    data: [],
                    backgroundColor: '#FFC185',
                    borderColor: '#FFC185',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    showLine: true,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Stopping Potential vs Frequency (Planck\'s Constant)',
                        color: '#134252'
                    },
                    legend: {
                        labels: { color: '#134252' }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Frequency (10¹⁴ Hz)',
                            color: '#134252'
                        },
                        grid: { color: 'rgba(94, 82, 64, 0.2)' },
                        ticks: { color: '#134252' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Stopping Potential (V)',
                            color: '#134252'
                        },
                        grid: { color: 'rgba(94, 82, 64, 0.2)' },
                        ticks: { color: '#134252' }
                    }
                }
            }
        });
    }

    updateWavelengthFromSlider() {
        this.elements.wavelengthValue.textContent = this.state.customWavelength;
        // Calculate frequency and energy for custom wavelength
        const frequency = (this.constants.speedOfLight / (this.state.customWavelength * 1e-9)) / 1e14; // in 10^14 Hz
        const energy = this.constants.planckConstant * frequency * 1e14; // in eV
        
        this.elements.frequencyValue.textContent = frequency.toFixed(3);
        this.elements.photonEnergyDisplay.textContent = energy.toFixed(3);
    }

    updateFilterDisplay() {
        const filter = this.filters[this.state.currentFilter];
        this.elements.wavelengthValue.textContent = filter.wavelength;
        this.elements.frequencyValue.textContent = (filter.frequency / 1e14).toFixed(3);
        this.elements.photonEnergyDisplay.textContent = filter.energy.toFixed(3);
    }

    getCurrentWavelengthData() {
        if (this.state.currentFilter === 'custom' || this.elements.filterSelect.value === 'custom') {
            const wavelength = this.state.customWavelength;
            const frequency = this.constants.speedOfLight / (wavelength * 1e-9);
            const energy = this.constants.planckConstant * frequency;
            return { wavelength, frequency, energy };
        } else {
            const filter = this.filters[this.state.currentFilter];
            return { 
                wavelength: filter.wavelength, 
                frequency: filter.frequency, 
                energy: filter.energy 
            };
        }
    }

    calculatePhysics() {
        const wavelengthData = this.getCurrentWavelengthData();
        const workFunction = this.state.currentMaterial.workFunction;
        
        // Einstein's equation: E = hf = φ + KEmax
        const photonEnergy = wavelengthData.energy;
        const maxKineticEnergy = Math.max(0, photonEnergy - workFunction);
        const stoppingPotential = maxKineticEnergy; // in volts (since KE in eV)
        
        // Threshold calculations
        const thresholdFrequency = workFunction / this.constants.planckConstant;
        const thresholdWavelength = this.constants.speedOfLight / thresholdFrequency * 1e9; // nm
        
        // Current calculation - Enhanced for real-time response
        let current = 0;
        const isEmission = photonEnergy > workFunction;
        
        if (isEmission && this.state.voltage >= -stoppingPotential) {
            // Saturation current (proportional to intensity)
            const saturationCurrent = 15; // μA (fixed for simulation)
            
            if (this.state.voltage >= 0) {
                // Forward bias - saturation region
                current = saturationCurrent;
            } else {
                // Reverse bias - retarding potential
                const factor = (this.state.voltage + stoppingPotential) / stoppingPotential;
                current = saturationCurrent * Math.max(0, factor);
            }
            
            // Add small realistic variation
            current = current * (1 + (Math.random() - 0.5) * 0.001);
        }

        return {
            wavelength: wavelengthData.wavelength,
            frequency: wavelengthData.frequency,
            photonEnergy,
            workFunction,
            maxKineticEnergy,
            stoppingPotential,
            thresholdFrequency,
            thresholdWavelength,
            current,
            isEmission,
            saturationCurrent: isEmission ? 15 : 0
        };
    }

    updateAllCalculations() {
        const physics = this.calculatePhysics();
        this.updateEnergyDisplay(physics);
        this.updateEmissionStatus(physics);
        this.updateCurrentReading();
        this.drawEnergyDiagram(physics);
        this.drawSetupDiagram();
    }

    updateEnergyDisplay(physics) {
        this.elements.photonEnergyValue.textContent = physics.photonEnergy.toFixed(3) + ' eV';
        this.elements.workFunctionValue.textContent = physics.workFunction.toFixed(3) + ' eV';
        this.elements.maxKeValue.textContent = physics.maxKineticEnergy.toFixed(3) + ' eV';
        this.elements.stoppingPotentialDisplay.textContent = physics.stoppingPotential.toFixed(3) + ' V';
        this.elements.thresholdFrequency.textContent = (physics.thresholdFrequency / 1e14).toFixed(2) + ' × 10¹⁴ Hz';
        this.elements.thresholdWavelength.textContent = physics.thresholdWavelength.toFixed(0) + ' nm';
    }

    updateEmissionStatus(physics) {
        if (physics.isEmission) {
            this.elements.emissionStatus.className = 'status status--success';
            this.elements.emissionStatus.textContent = '✓ Photoelectron Emission';
        } else {
            this.elements.emissionStatus.className = 'status status--error';
            this.elements.emissionStatus.textContent = '✗ No Emission - Below Threshold';
        }
    }

    updateCurrentReading() {
        const physics = this.calculatePhysics();
        
        // Ensure all elements exist before updating
        if (this.elements.currentValue) {
            this.elements.currentValue.textContent = physics.current.toFixed(3) + ' μA';
        }
        if (this.elements.liveCurrent) {
            this.elements.liveCurrent.textContent = physics.current.toFixed(3);
        }
        if (this.elements.saturationCurrent) {
            this.elements.saturationCurrent.textContent = physics.saturationCurrent.toFixed(3) + ' μA';
        }
        if (this.elements.stoppingPotential) {
            this.elements.stoppingPotential.textContent = physics.stoppingPotential.toFixed(3) + ' V';
        }
        if (this.elements.currentUncertainty) {
            this.elements.currentUncertainty.textContent = '0.001';
        }
    }

    toggleExperiment() {
        this.state.isExperimentActive = !this.state.isExperimentActive;
        
        if (this.state.isExperimentActive) {
            this.elements.switchLight.textContent = '🔬 Experiment Active';
            this.elements.switchLight.classList.add('active');
            this.elements.takeMeasurement.disabled = false;
            this.elements.autoSweep.disabled = false;
            this.logMessage('Mercury lamp activated - Ready for measurements');
            this.elements.graphStatus.textContent = 'Ready for data collection';
        } else {
            this.elements.switchLight.textContent = '🔬 Start Experiment';
            this.elements.switchLight.classList.remove('active');
            this.elements.takeMeasurement.disabled = true;
            this.elements.autoSweep.disabled = true;
            this.photonParticles = [];
            this.electronParticles = [];
            this.logMessage('Experiment stopped');
            this.elements.graphStatus.textContent = 'Experiment stopped';
        }
    }

    takePrecisionMeasurement() {
        if (!this.state.isExperimentActive) return;

        const physics = this.calculatePhysics();
        const numMeasurements = 1000;
        const measurements = [];
        
        // Simulate 1000 high-precision measurements
        for (let i = 0; i < numMeasurements; i++) {
            const noise = (Math.random() - 0.5) * 0.001 * physics.current;
            measurements.push(physics.current + noise);
        }
        
        // Calculate statistics
        const mean = measurements.reduce((a, b) => a + b, 0) / numMeasurements;
        const variance = measurements.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numMeasurements;
        const standardDeviation = Math.sqrt(variance);
        const standardError = standardDeviation / Math.sqrt(numMeasurements);
        
        // Store measurement
        const measurementData = {
            voltage: this.state.voltage,
            current: mean,
            standardError: standardError,
            measurements: numMeasurements,
            material: this.state.currentMaterial.name,
            wavelength: physics.wavelength,
            filter: this.state.currentFilter,
            timestamp: new Date()
        };
        
        this.experimentData.push(measurementData);
        this.state.measurementCount++;
        
        // Update displays
        this.elements.measurementCount.textContent = this.state.measurementCount;
        this.elements.stdError.textContent = '< 0.001%';
        
        // Add to I-V chart
        this.ivData.push({ x: this.state.voltage, y: mean });
        this.ivChart.data.datasets[0].data = this.ivData;
        this.ivChart.update('none');
        
        this.logMessage(`Measurement: V=${this.state.voltage.toFixed(2)}V, I=${mean.toFixed(3)}μA (±${standardError.toFixed(6)}μA)`);
        this.elements.graphStatus.textContent = `${this.ivData.length} data points collected`;
        
        // Check if this creates a new frequency data point
        this.updateFrequencyData(physics);
    }

    async performAutoSweep() {
        if (!this.state.isExperimentActive || this.state.autoSweepActive) return;
        
        this.state.autoSweepActive = true;
        this.elements.autoSweep.textContent = '⚡ Sweeping...';
        this.elements.autoSweep.disabled = true;
        
        this.logMessage('Starting automatic I-V sweep from +2V to -3V');
        
        // Clear current I-V data for this sweep
        this.ivData = [];
        
        // Sweep from +2V to -3V in 0.2V steps
        for (let voltage = 2.0; voltage >= -3.0; voltage -= 0.2) {
            this.state.voltage = voltage;
            this.elements.voltageSlider.value = voltage;
            this.elements.voltageValue.textContent = voltage.toFixed(2);
            this.updateCurrentReading();
            
            // Take measurement at this voltage
            this.takePrecisionMeasurement();
            
            // Small delay for animation
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.elements.autoSweep.textContent = '⚡ Auto I-V Sweep';
        this.elements.autoSweep.disabled = false;
        this.state.autoSweepActive = false;
        
        this.logMessage('I-V sweep completed - Stopping potential determined');
    }

    updateFrequencyData(physics) {
        if (!physics.isEmission) return;
        
        // Check if we have data for this wavelength
        const existing = this.frequencyData.find(d => Math.abs(d.wavelength - physics.wavelength) < 1);
        
        if (!existing) {
            this.frequencyData.push({
                wavelength: physics.wavelength,
                frequency: physics.frequency / 1e14, // Convert to 10^14 Hz for display
                stoppingPotential: physics.stoppingPotential,
                filter: this.state.currentFilter
            });
            
            // Update frequency chart
            this.frequencyChart.data.datasets[0].data = this.frequencyData.map(d => ({
                x: d.frequency,
                y: d.stoppingPotential
            }));
            this.frequencyChart.update('none');
            
            // Calculate Planck's constant from slope
            this.calculatePlanckConstant();
            
            // Update data table
            this.updateDataTable();
        }
    }

    calculatePlanckConstant() {
        if (this.frequencyData.length < 2) return;
        
        // Linear regression: Vs = (h/e) * f - φ/e
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        const n = this.frequencyData.length;
        
        this.frequencyData.forEach(d => {
            const x = d.frequency * 1e14; // Convert back to Hz
            const y = d.stoppingPotential;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const calculatedH = slope * this.constants.elementaryCharge; // h = slope * e
        
        const accuracy = (calculatedH / this.constants.planckConstant) * 100;
        
        this.elements.calculatedPlanck.textContent = `${calculatedH.toExponential(3)} eV·s`;
        this.elements.accuracy.textContent = `${accuracy.toFixed(1)}%`;
    }

    updateDataTable() {
        const tbody = this.elements.dataTableBody;
        tbody.innerHTML = '';
        
        this.frequencyData.forEach(data => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = data.filter.charAt(0).toUpperCase() + data.filter.slice(1);
            row.insertCell(1).textContent = data.wavelength;
            row.insertCell(2).textContent = data.frequency.toFixed(3);
            row.insertCell(3).textContent = data.stoppingPotential.toFixed(3);
            
            const statusCell = row.insertCell(4);
            statusCell.innerHTML = '<span class="status status--success">✓ Measured</span>';
        });
    }

    drawEnergyDiagram(physics) {
        const canvas = this.elements.energyDiagram;
        const ctx = this.energyCtx;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const margin = 60;
        const graphWidth = width - 2 * margin;
        const graphHeight = height - 2 * margin;
        const maxEnergy = 8; // eV
        const energyScale = graphHeight / maxEnergy;

        // Draw grid
        ctx.strokeStyle = 'rgba(94, 82, 64, 0.2)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= maxEnergy; i += 1) {
            const y = height - margin - (i * energyScale);
            ctx.beginPath();
            ctx.moveTo(margin, y);
            ctx.lineTo(width - margin, y);
            ctx.stroke();
        }

        // Y-axis
        ctx.strokeStyle = '#134252';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, height - margin);
        ctx.stroke();

        // Energy scale labels
        ctx.fillStyle = '#134252';
        ctx.font = '12px sans-serif';
        for (let i = 0; i <= maxEnergy; i += 1) {
            const y = height - margin - (i * energyScale);
            ctx.fillText(i + ' eV', 10, y + 4);
        }

        // Work function line
        const workFunctionY = height - margin - (physics.workFunction * energyScale);
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(margin + 30, workFunctionY);
        ctx.lineTo(width - margin - 30, workFunctionY);
        ctx.stroke();

        ctx.fillStyle = '#4ECDC4';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`φ = ${physics.workFunction.toFixed(2)} eV`, margin + 40, workFunctionY - 10);

        // Photon energy bar
        const photonBarX = margin + 150;
        const barWidth = 80;
        const photonHeight = physics.photonEnergy * energyScale;
        
        const wavelengthColor = this.getWavelengthColor(physics.wavelength);
        ctx.fillStyle = wavelengthColor;
        ctx.fillRect(photonBarX, height - margin - photonHeight, barWidth, photonHeight);

        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`E = ${physics.photonEnergy.toFixed(2)} eV`, photonBarX, height - margin - photonHeight - 15);

        // Kinetic energy bar (if emission occurs)
        if (physics.isEmission && physics.maxKineticEnergy > 0) {
            const keBarX = photonBarX + barWidth + 30;
            const keHeight = physics.maxKineticEnergy * energyScale;
            
            ctx.fillStyle = '#45B7D1';
            ctx.fillRect(keBarX, height - margin - keHeight, barWidth, keHeight);
            
            ctx.fillStyle = '#45B7D1';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`KE = ${physics.maxKineticEnergy.toFixed(2)} eV`, keBarX, height - margin - keHeight - 15);
        }

        // Einstein's equation
        ctx.fillStyle = '#134252';
        ctx.font = 'bold 16px serif';
        ctx.fillText('E = hf = φ + KEmax', margin + 30, height - 15);
    }

    drawSetupDiagram() {
        const canvas = this.elements.setupDiagram;
        const ctx = this.setupCtx;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw mercury lamp
        this.drawMercuryLamp(ctx, 80, height/2);
        
        // Draw colored filter
        this.drawFilter(ctx, 180, height/2);
        
        // Draw photocell
        this.drawPhotocell(ctx, 280, height/2);
        
        // Draw meters
        this.drawMeters(ctx, width - 100, height/2);
        
        // Draw connections
        this.drawConnections(ctx, width, height);
        
        // Update animation particles
        if (this.state.isExperimentActive) {
            this.updateSetupAnimation();
        }

        // Labels
        ctx.fillStyle = '#134252';
        ctx.font = '14px sans-serif';
        ctx.fillText('Mercury Lamp', 50, 40);
        ctx.fillText('Color Filter', 150, 40);
        ctx.fillText('Vacuum Photocell', 240, 40);
        ctx.fillText('6V Supply & μA Meter', width - 150, 40);
    }

    drawMercuryLamp(ctx, x, y) {
        ctx.fillStyle = this.state.isExperimentActive ? '#FFD700' : '#CCCCCC';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#134252';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Lamp symbol
        ctx.fillStyle = this.state.isExperimentActive ? '#FFA500' : '#999999';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Hg', x, y + 6);
        ctx.textAlign = 'left';
    }

    drawFilter(ctx, x, y) {
        const wavelengthData = this.getCurrentWavelengthData();
        const filterColor = this.getWavelengthColor(wavelengthData.wavelength);
        
        ctx.fillStyle = this.state.isExperimentActive ? filterColor : '#CCCCCC';
        ctx.fillRect(x - 15, y - 30, 30, 60);
        ctx.strokeStyle = '#134252';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 15, y - 30, 30, 60);
        
        ctx.fillStyle = '#134252';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(wavelengthData.wavelength + 'nm', x, y + 5);
        ctx.textAlign = 'left';
    }

    drawPhotocell(ctx, x, y) {
        // Vacuum tube
        ctx.strokeStyle = '#134252';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Photocathode
        ctx.fillStyle = this.state.currentMaterial.color;
        ctx.fillRect(x - 35, y - 25, 15, 50);
        ctx.strokeRect(x - 35, y - 25, 15, 50);
        
        // Collector
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x + 20, y - 20, 10, 40);
        ctx.strokeRect(x + 20, y - 20, 10, 40);
        
        // Material label
        ctx.fillStyle = '#134252';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.state.currentMaterial.symbol, x - 27, y + 50);
        ctx.textAlign = 'left';
    }

    drawMeters(ctx, x, y) {
        // Voltmeter
        ctx.strokeStyle = '#134252';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - 30, 20, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = '#134252';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('V', x, y - 25);
        ctx.fillText(this.state.voltage.toFixed(1) + 'V', x, y - 5);
        
        // Ammeter
        ctx.beginPath();
        ctx.arc(x, y + 30, 20, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.fillText('μA', x, y + 35);
        const physics = this.calculatePhysics();
        ctx.fillText(physics.current.toFixed(1), x, y + 50);
        ctx.textAlign = 'left';
    }

    drawConnections(ctx, width, height) {
        ctx.strokeStyle = '#134252';
        ctx.lineWidth = 2;
        
        // Connection wires (simplified)
        ctx.beginPath();
        ctx.moveTo(320, height/2 - 10);
        ctx.lineTo(width - 120, height/2 - 10);
        ctx.lineTo(width - 120, height/2 - 30);
        ctx.stroke();
    }

    updateSetupAnimation() {
        if (!this.state.isExperimentActive) return;

        const ctx = this.setupCtx;
        
        // Create photon particles
        if (Math.random() < 0.3) {
            const wavelengthData = this.getCurrentWavelengthData();
            this.photonParticles.push({
                x: 105,
                y: 150 + (Math.random() - 0.5) * 30,
                speed: 1.5 + Math.random(),
                size: 3,
                color: this.getWavelengthColor(wavelengthData.wavelength)
            });
        }

        // Update and draw photons
        this.photonParticles = this.photonParticles.filter(photon => {
            photon.x += photon.speed;
            
            ctx.fillStyle = photon.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(photon.x, photon.y, photon.size, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Create electrons when photons hit cathode
            if (photon.x >= 245 && photon.x <= 250) {
                const physics = this.calculatePhysics();
                if (physics.isEmission && Math.random() < 0.6) {
                    this.electronParticles.push({
                        x: 260,
                        y: photon.y + (Math.random() - 0.5) * 10,
                        speed: 0.8 + Math.random() * 0.5,
                        life: 80
                    });
                }
            }
            
            return photon.x < 600;
        });

        // Update and draw electrons
        this.electronParticles = this.electronParticles.filter(electron => {
            electron.x += electron.speed;
            electron.life--;
            
            ctx.fillStyle = '#00FFFF';
            ctx.globalAlpha = electron.life / 80;
            ctx.beginPath();
            ctx.arc(electron.x, electron.y, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;

            return electron.life > 0 && electron.x < 320;
        });
    }

    getWavelengthColor(wavelength) {
        if (wavelength < 380) return '#8B00FF';
        if (wavelength < 440) return '#4B0082';
        if (wavelength < 490) return '#0000FF';
        if (wavelength < 510) return '#00FF00';
        if (wavelength < 580) return '#FFFF00';
        if (wavelength < 645) return '#FF7F00';
        if (wavelength < 750) return '#FF0000';
        return '#8B0000';
    }

    resetExperiment() {
        this.state.isExperimentActive = false;
        this.state.measurementCount = 0;
        this.state.autoSweepActive = false;
        this.experimentData = [];
        this.ivData = [];
        this.frequencyData = [];
        this.photonParticles = [];
        this.electronParticles = [];
        
        // Reset UI
        this.elements.switchLight.textContent = '🔬 Start Experiment';
        this.elements.switchLight.classList.remove('active');
        this.elements.takeMeasurement.disabled = true;
        this.elements.autoSweep.disabled = true;
        this.elements.measurementCount.textContent = '0';
        this.elements.dataTableBody.innerHTML = '';
        this.elements.graphStatus.textContent = 'Ready for measurements';
        
        // Reset controls
        this.state.voltage = 0;
        this.elements.voltageSlider.value = 0;
        this.elements.voltageValue.textContent = '0.00';
        
        // Clear charts
        this.clearGraphs();
        
        this.updateAllCalculations();
        this.logMessage('Laboratory reset - Ready for new experiment');
    }

    clearGraphs() {
        this.ivData = [];
        this.frequencyData = [];
        this.ivChart.data.datasets[0].data = [];
        this.frequencyChart.data.datasets[0].data = [];
        this.ivChart.update();
        this.frequencyChart.update();
        this.elements.graphStatus.textContent = 'Graphs cleared';
    }

    exportLaboratoryData() {
        if (this.experimentData.length === 0) {
            alert('No experimental data to export. Please take measurements first.');
            return;
        }

        const headers = [
            'Timestamp',
            'Material',
            'Work_Function_eV',
            'Filter',
            'Wavelength_nm',
            'Frequency_Hz',
            'Photon_Energy_eV',
            'Applied_Voltage_V',
            'Current_microA',
            'Standard_Error_microA',
            'Measurements_Count',
            'Stopping_Potential_V'
        ];

        let csvContent = headers.join(',') + '\n';

        this.experimentData.forEach(data => {
            const wavelengthData = this.getCurrentWavelengthData();
            const physics = this.calculatePhysics();
            
            const row = [
                data.timestamp.toISOString(),
                data.material,
                this.state.currentMaterial.workFunction.toFixed(6),
                data.filter,
                data.wavelength,
                wavelengthData.frequency.toExponential(3),
                wavelengthData.energy.toFixed(6),
                data.voltage.toFixed(6),
                data.current.toFixed(6),
                data.standardError.toExponential(3),
                data.measurements,
                physics.stoppingPotential.toFixed(6)
            ];
            csvContent += row.join(',') + '\n';
        });

        // Add frequency data summary
        csvContent += '\n# Frequency vs Stopping Potential Data\n';
        csvContent += 'Filter,Wavelength_nm,Frequency_Hz,Stopping_Potential_V\n';
        
        this.frequencyData.forEach(data => {
            csvContent += `${data.filter},${data.wavelength},${data.frequency * 1e14},${data.stoppingPotential.toFixed(6)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `photoelectric_lab_data_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.logMessage(`Laboratory data exported: ${this.experimentData.length} measurements, ${this.frequencyData.length} frequency points`);
    }

    startAnimationLoop() {
        const animate = () => {
            this.animationTime += 16;
            
            const physics = this.calculatePhysics();
            this.drawEnergyDiagram(physics);
            
            if (this.state.isExperimentActive) {
                this.drawSetupDiagram();
            }
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    logMessage(message) {
        const logElement = this.elements.experimentLog;
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-message">${message}</span>
        `;
        
        logElement.appendChild(logEntry);
        logElement.scrollTop = logElement.scrollHeight;
        
        // Keep only last 20 log entries
        while (logElement.children.length > 20) {
            logElement.removeChild(logElement.firstChild);
        }
    }
}

// Initialize the laboratory simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PhotoelectricLaboratory();
});