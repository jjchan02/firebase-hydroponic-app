import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)  # Set the logging level to DEBUG
logger = logging.getLogger(__name__)

def load_and_preprocess_data(file_path):
    df = pd.read_csv(file_path, parse_dates=['Time'])
    df = df.dropna(how='all')

    # Convert columns to numeric, coercing errors
    for col in df.columns:
        if col != 'Time':
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Set 'Time' as the index
    df.set_index('Time', inplace=True)

    # Select only the necessary features
    features = ['Surrounding Temperature', 'Surrounding Humidity', 'Solution Temperature',
                'Light Intensity', 'TDS', 'pH']
    df = df[features]

    return df

def prepare_features(df):
    # Use SimpleImputer to fill missing values
    imputer = SimpleImputer(strategy='mean')
    X = imputer.fit_transform(df)
    return X, df.columns

def scale_features(X):
    # Use StandardScaler to scale the features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled, scaler

def create_sequences(X, seq_length):
    # Create sequences of the specified length
    try:
        sequences = []
        for i in range(len(X) - seq_length + 1):
            sequences.append(X[i:i+seq_length])
        return np.array(sequences)
    except ValueError as ve:
            logger.error('ValueError during data reception: %s', ve)
