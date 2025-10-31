// DOM Elements
const algorithmSelect = document.getElementById('algorithm');
const trafficModelSelect = document.getElementById('trafficModel');
const packetRateSlider = document.getElementById('packetRate');
const rateValue = document.getElementById('rateValue');
const bufferSizeSlider = document.getElementById('bufferSize');
const bufferValue = document.getElementById('bufferValue');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const plotContainer = document.getElementById('plotContainer');

// Stat Elements
const currentCwndElement = document.getElementById('currentCwnd');
const packetsSentElement = document.getElementById('packetsSent');
const packetsDroppedElement = document.getElementById('packetsDropped');
const transmissionRateElement = document.getElementById('transmissionRate');

// Chart variables
let cwndChart, bufferChart;
let simulationInterval;
let isSimulating = false;

// Simulation data
let simulationData = {
    time: [],
    cwnd: [],
    buffer: [],
    sent: 0,
    dropped: 0,
    cwndValue: 1,
    bufferSize: 100,
    packetRate: 50
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    packetRateSlider.addEventListener('input', function() {
        rateValue.textContent = this.value;
        simulationData.packetRate = parseInt(this.value);
    });
    
    bufferSizeSlider.addEventListener('input', function() {
        bufferValue.textContent = this.value;
        simulationData.bufferSize = parseInt(this.value);
    });
    
    startBtn.addEventListener('click', toggleSimulation);
    resetBtn.addEventListener('click', resetSimulation);
}

// Initialize charts
function initializeCharts() {
    const cwndCtx = document.getElementById('cwndChart').getContext('2d');
    const bufferCtx = document.getElementById('bufferChart').getContext('2d');
    
    cwndChart = new Chart(cwndCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Congestion Window Size',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Window Size (packets)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    }
                }
            }
        }
    });
    
    bufferChart = new Chart(bufferCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Buffer Status',
                data: [],
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: simulationData.bufferSize,
                    title: {
                        display: true,
                        text: 'Packets'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    }
                }
            }
        }
    });
}

// Toggle simulation
function toggleSimulation() {
    if (isSimulating) {
        stopSimulation();
    } else {
        startSimulation();
    }
}

// Start simulation
async function startSimulation() {
    isSimulating = true;
    startBtn.textContent = 'Stop Simulation';
    
    // Send start request to backend
    try {
        const response = await fetch('http://localhost:5000/api/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                algorithm: algorithmSelect.value,
                traffic_model: trafficModelSelect.value,
                packet_rate: parseInt(packetRateSlider.value),
                buffer_size: parseInt(bufferSizeSlider.value)
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to start simulation');
        }
        
        // Clear previous data
        simulationData.time = [];
        simulationData.cwnd = [];
        simulationData.buffer = [];
        simulationData.sent = 0;
        simulationData.dropped = 0;
        simulationData.cwndValue = 1;
        
        // Update charts
        updateCharts();
        updateStats();
        
        // Start simulation loop
        simulationInterval = setInterval(runSimulationStep, 1000);
    } catch (error) {
        console.error('Error starting simulation:', error);
        isSimulating = false;
        startBtn.textContent = 'Start Simulation';
        alert('Failed to start simulation. Please make sure the server is running.');
    }
}

// Stop simulation
function stopSimulation() {
    isSimulating = false;
    startBtn.textContent = 'Start Simulation';
    clearInterval(simulationInterval);
}

// Reset simulation
async function resetSimulation() {
    stopSimulation();
    
    // Send reset request to backend
    try {
        const response = await fetch('http://localhost:5000/api/reset', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to reset simulation');
        }
        
        // Reset data
        simulationData.time = [];
        simulationData.cwnd = [];
        simulationData.buffer = [];
        simulationData.sent = 0;
        simulationData.dropped = 0;
        simulationData.cwndValue = 1;
        
        // Reset sliders to default values
        packetRateSlider.value = 50;
        rateValue.textContent = '50';
        bufferSizeSlider.value = 100;
        bufferValue.textContent = '100';
        simulationData.packetRate = 50;
        simulationData.bufferSize = 100;
        
        // Update charts and stats
        updateCharts();
        updateStats();
        
        // Clear plot
        plotContainer.innerHTML = '';
    } catch (error) {
        console.error('Error resetting simulation:', error);
        alert('Failed to reset simulation.');
    }
}

// Run a single simulation step
async function runSimulationStep() {
    try {
        const response = await fetch('http://localhost:5000/api/step', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to run simulation step');
        }
        
        const data = await response.json();
        
        // Update simulation data with backend results
        simulationData.time.push(data.time);
        simulationData.cwnd.push(data.cwnd);
        simulationData.buffer.push(data.buffer);
        simulationData.sent = data.sent;
        simulationData.dropped = data.dropped;
        simulationData.cwndValue = data.cwnd;
        
        // Update UI
        updateCharts();
        updateStats();
    } catch (error) {
        console.error('Error running simulation step:', error);
        stopSimulation();
        alert('Simulation error. Stopping simulation.');
    }
}

// Update charts with new data
function updateCharts() {
    // Update cwnd chart
    cwndChart.data.labels = simulationData.time;
    cwndChart.data.datasets[0].data = simulationData.cwnd;
    cwndChart.update();
    
    // Update buffer chart
    bufferChart.data.labels = simulationData.time;
    bufferChart.data.datasets[0].data = simulationData.buffer;
    bufferChart.options.scales.y.max = simulationData.bufferSize;
    bufferChart.update();
}

// Update statistics display
function updateStats() {
    currentCwndElement.textContent = simulationData.cwndValue.toFixed(2);
    packetsSentElement.textContent = simulationData.sent;
    packetsDroppedElement.textContent = simulationData.dropped;
    
    // Calculate transmission rate (packets/sec)
    const totalTime = simulationData.time.length;
    const transmissionRate = totalTime > 0 ? (simulationData.sent / totalTime).toFixed(2) : 0;
    transmissionRateElement.textContent = transmissionRate;
}

// Generate and display plot
async function generatePlot() {
    try {
        const response = await fetch('http://localhost:5000/api/plot');
        if (!response.ok) {
            throw new Error('Failed to generate plot');
        }
        
        const data = await response.json();
        if (data.plot) {
            plotContainer.innerHTML = `<img src="data:image/png;base64,${data.plot}" alt="Simulation Plot" style="max-width: 100%;">`;
        } else {
            plotContainer.innerHTML = '<p>No data to plot yet. Run the simulation first.</p>';
        }
    } catch (error) {
        console.error('Error generating plot:', error);
        plotContainer.innerHTML = '<p>Error generating plot.</p>';
    }
}

// Add event listener for plot button if it exists
document.addEventListener('DOMContentLoaded', function() {
    const plotBtn = document.getElementById('plotBtn');
    if (plotBtn) {
        plotBtn.addEventListener('click', generatePlot);
    }
});