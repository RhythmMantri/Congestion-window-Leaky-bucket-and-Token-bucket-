# TCP Congestion Window Simulation

This project simulates TCP congestion control algorithms (Tahoe, Reno, and CUBIC) with traffic shaping models (Leaky Bucket and Token Bucket) to visualize how congestion window (cwnd) changes over time.

## Features

- **TCP Congestion Control Algorithms**:
  - TCP Tahoe
  - TCP Reno
  - TCP CUBIC

- **Traffic Shaping Models**:
  - Leaky Bucket
  - Token Bucket

- **Visualization**:
  - Real-time charts using Chart.js
  - Static plots using Matplotlib
  - Statistics dashboard

## Technology Stack

### Backend
- Python 3.9+
- Flask (Web Framework)
- NumPy (Numerical Computations)
- Matplotlib (Static Plot Generation)

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js (Real-time Charts)

## Installation

1. Install Python 3.9 or higher
2. Install required packages:
   ```
   pip install flask matplotlib numpy
   ```

## Usage

### Method 1: Using Batch Files (Windows)

1. Double-click `start_simulation.bat` to start the server and open the simulation
2. Or double-click `run_simulation.bat` to just open the simulation in your browser (server must be started separately)

### Method 2: Manual Start

1. Start the server:
   ```
   python server.py
   ```

2. Open `index.html` in a web browser

3. Configure simulation parameters:
   - Select a TCP congestion control algorithm
   - Choose a traffic shaping model
   - Adjust packet generation rate and buffer size

4. Click "Start Simulation" to begin

5. View real-time charts and statistics

6. Click "Generate Plot" to create a static plot of the simulation results

## API Endpoints

- `POST /api/start` - Start simulation with parameters
- `POST /api/step` - Run one simulation step
- `POST /api/reset` - Reset simulation
- `GET /api/history` - Get simulation history
- `GET /api/plot` - Generate static plot

## Project Structure

```
├── server.py              # Flask backend with simulation logic
├── index.html             # Main HTML page
├── script.js              # Frontend JavaScript logic
├── style.css              # Styling
├── start_simulation.bat   # Batch file to start server and open browser
├── run_simulation.bat     # Batch file to open simulation in browser
└── README.md              # This file
```

## Integration Details

The frontend and backend are integrated using REST API calls:
- Frontend makes HTTP requests to `http://localhost:5000/api/*` endpoints
- Backend responds with JSON data for real-time visualization
- CORS is enabled to allow cross-origin requests from the frontend