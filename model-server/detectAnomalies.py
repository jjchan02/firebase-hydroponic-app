from dataProcessing import create_sequences
import numpy as np
from sklearn.preprocessing import MinMaxScaler, StandardScaler

def detect_anomalies(model, X_scaled, seq_length, threshold_multiplier=3, history_window=50):
    # scaler = StandardScaler()
    # X_scaled = scaler.fit_transform(X)
    
    sequences = create_sequences(X_scaled, seq_length)
    print(f"Total sequences generated:", sequences.shape) 

    predictions = []
    losses = []
    actual_values = []

    for seq in sequences:
        seq_input = seq[:-1].reshape((1, seq_length-1, X_scaled.shape[1]))
        seq_true = seq[-1]

        seq_pred = model.predict(seq_input)
        predictions.append(seq_pred.flatten())
        actual_values.append(seq_true)

        loss = np.mean(np.abs(seq_true - seq_pred))
        losses.append(loss)

    predictions = np.array(predictions)
    actual_values = np.array(actual_values)

    if len(losses) > history_window:
        recent_losses = losses[-history_window:]
    else:
        recent_losses = losses

    threshold = np.mean(recent_losses) + threshold_multiplier * np.std(recent_losses)
    print("Threshold:", threshold)
    print("Standard Deviation of losses", np.std(recent_losses))

    anomalies = np.array(losses) > threshold
    padded_anomalies = np.pad(anomalies, (seq_length-1, 0), mode='constant', constant_values=False)

    # Extract losses that exceed the threshold
    exceeding_losses = [loss for loss, anomaly in zip(losses, anomalies) if anomaly]
    print("Anomalies detected:", np.sum(padded_anomalies))
    print("Anomaly indices:", np.where(padded_anomalies)[0])
    print("Exceeding losses:", exceeding_losses)

    return padded_anomalies, predictions, actual_values, threshold, exceeding_losses
