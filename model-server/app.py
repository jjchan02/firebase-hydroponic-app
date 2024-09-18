from flask import Flask, request, jsonify
import numpy as np
from model import create_modelv4
import logging
from detectAnomalies import detect_anomalies
from dataProcessing import scale_features, create_sequences

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)  # Set the logging level to DEBUG
logger = logging.getLogger(__name__)

def predict_trigger(data, seq_length):
    # Convert the dictionary to a list of lists
    all_values = []
    expected_params = ['surroundingTemperature', 'surroundingHumidity', 'solutionTemperature', 'pH', 'tds', 'lightIntensity', 'foggerTemperature', 'foggerHumidity', 'lowTdsTrigger', 'highTdsTrigger', 'lowPhTrigger', 'highPhTrigger', 'foggerTrigger']
    
    # Ensure there are enough data points
    if len(data[expected_params[0]]) < seq_length:
        raise ValueError(f"Not enough data points to form the required sequence length of {seq_length}.")
    
    for i in range(len(data[expected_params[0]]) - seq_length + 1):
        row = [data[param][i]['value'] for param in expected_params]
        all_values.append(row)

    all_values = np.array(all_values)

    # Scale the features (ensure that scaling method is consistent)
    X_scaled, scaler = scale_features(all_values)  # Ensure this uses the same scaling logic as detect_anomalies
    sequences = create_sequences(X_scaled, seq_length)
    print(f"Total sequences generated:", sequences.shape)

    # Load the model
    input_dim = sequences.shape[2]
    timesteps = sequences.shape[1] - 1
    model = create_modelv4(timesteps, input_dim)
    model.load_weights("model_v4.h5")

    # Perform predictions
    predictions = []
    actual_values = []

    for seq in sequences:
        seq_input = seq[:-1].reshape((1, timesteps, input_dim))
        seq_true = seq[-1]

        seq_pred = model.predict(seq_input)
        predictions.append(seq_pred.flatten())
        actual_values.append(seq_true)

    predictions = np.array(predictions)
    actual_values = np.array(actual_values)

    # Inverse transform predictions back to original scale
    predictions_original_scale = scaler.inverse_transform(predictions)
    actual_values_original_scale = scaler.inverse_transform(actual_values)

    # Map predictions to parameter names, using the last index of the predictions
    parameter_names = ['surroundingTemperature', 'surroundingHumidity', 'solutionTemperature', 'pH', 'tds', 'lightIntensity', 'foggerTemperature', 'foggerHumidity', 'lowTdsTrigger', 'highTdsTrigger', 'lowPhTrigger', 'highPhTrigger', 'foggerTrigger']
    predictions_dict = {}
    
    for i, name in enumerate(parameter_names):
        if i < predictions_original_scale.shape[1]:  # Check index bounds
            # Use the last value of the predictions
            predictions_dict[name] = predictions_original_scale[-1, i].tolist()

    # Debug: Print out the predictions dictionary
    print(f"Predictions Dictionary: {predictions_dict}")

    return predictions_dict


# def check_trigger(predictions, thresholds):
#     trigger_status = {}
    
#     for trigger_name, threshold in thresholds.items():
#         if trigger_name in predictions:
#             predicted_value = predictions[trigger_name]
#             if predicted_value >= threshold:
#                 trigger_status[trigger_name] = True
#             else:
#                 trigger_status[trigger_name] = False
#         else:
#             # Debug: Print a message if the trigger_name is missing in predictions
#             print(f"Trigger name {trigger_name} not found in predictions")
    
#     # Debug: Print out the resulting trigger statuses
#     print(f"Trigger Status: {trigger_status}")

#     return trigger_status

def check_trigger(predictions, parameter_settings):
    trigger_status = {}

    # Extract boundaries from parameter settings
    tds_lower, tds_upper = parameter_settings['tds']
    ph_lower, ph_upper = parameter_settings['pH']
    humidity_lower, humidity_upper = parameter_settings['surroundingHumidity']

    # TDS trigger
    if 'tds' in predictions:
        tds_value = predictions['tds']
        if tds_value < tds_lower:
            trigger_status['lowTdsTrigger'] = True
        else:
            trigger_status['lowTdsTrigger'] = False

        if tds_value > tds_upper:
            trigger_status['highTdsTrigger'] = True
        else:
            trigger_status['highTdsTrigger'] = False

    # pH trigger
    if 'pH' in predictions:
        ph_value = predictions['pH']
        if ph_value < ph_lower:
            trigger_status['lowPhTrigger'] = True
        else:
            trigger_status['lowPhTrigger'] = False

        if ph_value > ph_upper:
            trigger_status['highPhTrigger'] = True
        else:
            trigger_status['highPhTrigger'] = False

    # Humidity (surroundingHumidity) trigger for fogger
    if 'surroundingHumidity' in predictions:
        humidity_value = predictions['surroundingHumidity']
        if humidity_value < humidity_lower:
            trigger_status['foggerTrigger'] = True
        else:
            trigger_status['foggerTrigger'] = False

    # Debug: Print out the resulting trigger statuses
    print(f"Trigger Status: {trigger_status}")

    return trigger_status

@app.route('/hello', methods=['GET'])
def hello():
    return "Hello World"

@app.route('/receive-data', methods=['POST'])
def receive_data():
    try:
        logger.debug("Received data request")
        data = request.get_json(force=True)
        if not data:
            raise ValueError("No data received")

        # Extract parameters from latestData
        parameters = data.get('latestData', {})
        expected_params = ['surroundingTemperature', 'surroundingHumidity', 'solutionTemperature', 'pH', 'tds', 'lightIntensity', 'foggerTemperature', 'foggerHumidity', 'lowTdsTrigger', 'highTdsTrigger', 'lowPhTrigger', 'highPhTrigger', 'foggerTrigger']
        missing_params = [param for param in expected_params if param not in parameters]
        if missing_params:
            raise ValueError(f"Missing parameter(s) in data: {missing_params}")

        # Convert the dictionary to a list of lists, assuming parameters have the same length
        all_values = []
        for i in range(len(parameters[expected_params[0]])):
            row = [parameters[param][i]['value'] for param in expected_params]
            all_values.append(row)

        all_values = np.array(all_values)
        logger.debug('All Values: %s', all_values.shape)

        # Scale the features
        X_scaled, scaler = scale_features(all_values)
        seq_length = 10
        sequences = create_sequences(X_scaled, seq_length)

        # Load your initial model
        input_dim = sequences.shape[2]
        timesteps = sequences.shape[1] - 1
        model = create_modelv4(timesteps, input_dim)
        model.load_weights("model_v4.h5")
        
        # Perform anomaly detection using the sequences and ranges (parameterSettings)
        padded_anomalies, predictions, actual_values, threshold, exceeding_losses = detect_anomalies(model, X_scaled, seq_length)

        if predictions.size == 0 or actual_values.size == 0:
            raise ValueError("Empty predictions or actual values arrays")

        predictions_original_scale = scaler.inverse_transform(predictions)
        actual_values_original_scale = scaler.inverse_transform(actual_values)
        predictions_dict = {str(i): pred.tolist() for i, pred in enumerate(predictions_original_scale)}
        actual_values_dict = {str(i): actual.tolist() for i, actual in enumerate(actual_values_original_scale)}

        # Get the last anomaly index if any anomaly is detected
        anomaly_indices = np.where(padded_anomalies)[0]
        if len(anomaly_indices) > 0:
            last_anomaly_index = anomaly_indices[-1]
            detected = bool(padded_anomalies[last_anomaly_index])
            
            # Ensure last_anomaly_index is within the bounds of exceeding_losses
            if len(exceeding_losses) > 0:
                if last_anomaly_index < len(exceeding_losses):
                    detected_loss = exceeding_losses[last_anomaly_index]
                else:
                    detected_loss = exceeding_losses[-1]  # Handle case where only one loss exists
            else:
                detected_loss = None
        else:
            detected = False
            detected_loss = None

        # Prepare response with anomaly data and prediction data
        response = {
            "summary": {
                "detected": detected,
                'detected_list': np.sum(padded_anomalies).tolist(),
                "threshold": float(threshold),
                'loss': detected_loss,
                'indices': anomaly_indices.tolist(),
                'exceeding_losses': exceeding_losses
            },
            "predictions": predictions_dict,
            "actual_values": actual_values_dict,
        }

        return jsonify(response), 200

    except ValueError as ve:
        logger.error('ValueError during data reception: %s', ve)
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        logger.error('Error during data reception: %s', e)
        return jsonify({"error": str(e)}), 400

@app.route('/predict-triggers', methods=['POST'])
def predict_triggers():
    try:
        logger.debug("Received prediction request")
        data = request.get_json(force=True)
        if not data:
            raise ValueError("No data received")

        # Extract parameters from latestData
        parameters = data.get('latestData', {})
        parameterSettings = data.get('parameterSettings', {})
        seq_length = 10  # or set as needed

        # Predict triggers
        predictions = predict_trigger(parameters, seq_length)

        # # Define your thresholds for triggers
        # thresholds = {
        #     'lowTdsTrigger': 0.5,
        #     'highTdsTrigger': 0.5,
        #     'lowPhTrigger': 0.5,
        #     'highPhTrigger': 0.5,
        #     'foggerTrigger': 0.5
        # }

        # Check triggers based on predictions
        # trigger_status = check_trigger(predictions, thresholds)
        trigger_status = check_trigger(predictions, parameterSettings)

        # Prepare response
        response = {
            "predictions": predictions,
            "trigger_status": trigger_status,
        }

        return jsonify(response), 200

    except ValueError as ve:
        logger.error('ValueError during prediction request: %s', ve)
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        logger.error('Error during prediction request: %s', e)
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5000")
    app.run(port=8000)
