from flask import Flask, jsonify, request
import math
import random
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64
from datetime import datetime
from flask import Flask, jsonify, request, make_response

app = Flask(__name__)

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Handle preflight OPTIONS requests
@app.route('/', methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path=''):
    return make_response(), 200

class TCPSimulation:
    def __init__(self):
        self.cwnd = 1
        self.ssthresh = 65535
        self.algorithm = "tahoe"
        self.traffic_model = "leaky"
        self.packet_rate = 50
        self.buffer_size = 100
        self.packets_sent = 0
        self.packets_dropped = 0
        self.time_step = 0
        self.history = {
            "time": [],
            "cwnd": [],
            "buffer": [],
            "sent": [],
            "dropped": []
        }
    
    def set_parameters(self, algorithm, traffic_model, packet_rate, buffer_size):
        self.algorithm = algorithm
        self.traffic_model = traffic_model
        self.packet_rate = packet_rate
        self.buffer_size = buffer_size
    
    def run_step(self):
        self.time_step += 1
        
        # Generate packets based on rate
        packets_generated = max(1, int(self.packet_rate / 10))
        
        # Apply traffic shaping
        if self.traffic_model == "leaky":
            # Leaky bucket - constant rate output
            packets_to_send = min(packets_generated, max(1, int(self.packet_rate / 20)))
        else:
            # Token bucket - allows bursts up to cwnd
            packets_to_send = min(packets_generated, int(self.cwnd))
        
        # Apply congestion control algorithm
        if self.algorithm == "tahoe":
            self._apply_tahoe(packets_to_send)
        elif self.algorithm == "reno":
            self._apply_reno(packets_to_send)
        elif self.algorithm == "cubic":
            self._apply_cubic(packets_to_send)
        
        # Update buffer level
        buffer_level = max(0, packets_generated - packets_to_send)
        
        # Update statistics
        self.packets_sent += packets_to_send
        self.packets_dropped += (packets_generated - packets_to_send)
        
        # Store history
        self.history["time"].append(self.time_step)
        self.history["cwnd"].append(self.cwnd)
        self.history["buffer"].append(buffer_level)
        self.history["sent"].append(self.packets_sent)
        self.history["dropped"].append(self.packets_dropped)
        
        return {
            "time": self.time_step,
            "cwnd": float(self.cwnd),  # Convert to float for JSON serialization
            "buffer": buffer_level,
            "sent": self.packets_sent,
            "dropped": self.packets_dropped,
            "current_sent": packets_to_send,
            "current_dropped": packets_generated - packets_to_send
        }
    
    def _apply_tahoe(self, packets_sent):
        # Slow start
        if self.cwnd < self.ssthresh:
            self.cwnd += 1
        else:
            # Congestion avoidance
            self.cwnd += 1 / self.cwnd
        
        # Simulate packet loss (10% chance)
        if random.random() < 0.1:
            self.ssthresh = max(2, self.cwnd / 2)
            self.cwnd = 1  # Reset to slow start
    
    def _apply_reno(self, packets_sent):
        # Slow start
        if self.cwnd < self.ssthresh:
            self.cwnd += 1
        else:
            # Congestion avoidance
            self.cwnd += 1 / self.cwnd
        
        # Simulate packet loss (8% chance)
        if random.random() < 0.08:
            self.ssthresh = max(2, self.cwnd / 2)
            # Fast recovery - don't reset cwnd completely
            self.cwnd = self.ssthresh
    
    def _apply_cubic(self, packets_sent):
        # Slow start
        if self.cwnd < self.ssthresh:
            self.cwnd += 1.5
        else:
            # Cubic-like growth function
            self.cwnd += 0.2 * math.pow(self.cwnd / 10, 3)
        
        # Simulate packet loss (5% chance)
        if random.random() < 0.05:
            self.ssthresh = max(2, self.cwnd * 0.8)
            self.cwnd = self.ssthresh
    
    def reset(self):
        self.cwnd = 1
        self.ssthresh = 65535
        self.packets_sent = 0
        self.packets_dropped = 0
        self.time_step = 0
        self.history = {
            "time": [],
            "cwnd": [],
            "buffer": [],
            "sent": [],
            "dropped": []
        }
    
    def generate_plot(self):
        """Generate a plot of cwnd over time and return as base64 encoded string"""
        if not self.history["time"]:
            return None
            
        plt.figure(figsize=(10, 6))
        
        # Plot cwnd
        plt.subplot(2, 1, 1)
        plt.plot(self.history["time"], self.history["cwnd"], 'b-', linewidth=2)
        plt.title('TCP Congestion Window Size Over Time')
        plt.ylabel('Window Size (packets)')
        plt.grid(True)
        
        # Plot buffer status
        plt.subplot(2, 1, 2)
        plt.plot(self.history["time"], self.history["buffer"], 'r-', linewidth=2)
        plt.title('Buffer Status Over Time')
        plt.xlabel('Time (steps)')
        plt.ylabel('Packets in Buffer')
        plt.grid(True)
        
        plt.tight_layout()
        
        # Save plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        
        return plot_data

# Create simulation instance
simulation = TCPSimulation()

@app.route('/')
def index():
    return jsonify({"message": "TCP Congestion Control Simulation API"})

@app.route('/api/start', methods=['POST'])
def start_simulation():
    data = request.json or {}
    algorithm = data.get('algorithm', 'tahoe')
    traffic_model = data.get('traffic_model', 'leaky')
    packet_rate = data.get('packet_rate', 50)
    buffer_size = data.get('buffer_size', 100)
    
    simulation.set_parameters(algorithm, traffic_model, packet_rate, buffer_size)
    return jsonify({"status": "simulation started"})

@app.route('/api/step', methods=['POST'])
def simulation_step():
    result = simulation.run_step()
    return jsonify(result)

@app.route('/api/reset', methods=['POST'])
def reset_simulation():
    simulation.reset()
    return jsonify({"status": "simulation reset"})

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(simulation.history)

@app.route('/api/plot', methods=['GET'])
def get_plot():
    plot_data = simulation.generate_plot()
    if plot_data:
        return jsonify({"plot": plot_data})
    else:
        return jsonify({"plot": None})

if __name__ == '__main__':
    app.run(debug=True, port=5000)