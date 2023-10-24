from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    with open('config.json', 'r') as f:
        config = json.load(f)
    return render_template('index.html', config=config)

@app.route('/get_timers', methods=['GET'])
def get_timers():
    if os.path.exists('timers.json'):
        with open('timers.json', 'r') as f:
            timers = json.load(f)
    else:
        timers = {}
    return jsonify(timers)

@app.route('/update_timers', methods=['POST'])
def update_timers():
    data = request.json
    with open('timers.json', 'w') as f:
        json.dump(data, f)
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run()
