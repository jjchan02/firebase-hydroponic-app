import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.regularizers import l1, l2

def create_model(seq_length, input_dim):
    model = Sequential([
        LSTM(64, activation='relu', return_sequences=True, input_shape=(seq_length - 1, input_dim)),
        Dropout(0.2),
        LSTM(32, activation='relu', return_sequences=False),
        Dropout(0.2),
        Dense(input_dim)
    ])
    model.compile(optimizer=Adam(learning_rate=1e-3), loss=tf.keras.losses.MeanSquaredError())
    return model

def create_modelv3(seq_length, input_dim):
    model = Sequential([
        LSTM(64, activation='relu', return_sequences=True, input_shape=(seq_length - 1, input_dim)),
        # Dropout(0.2),
        LSTM(32, activation='relu', return_sequences=False),
        Dropout(0.2),
        # LSTM(16, activation='relu', return_sequences=False),
        # Dropout(0.2),
        Dense(input_dim, kernel_regularizer=l2(0.01)) 
        # Dense(input_dim)
    ])
    model.compile(optimizer=Adam(learning_rate=1e-3), loss=tf.keras.losses.MeanSquaredError(), metrics=['mse', 'mae'])
    return model

def create_modelv4(timesteps, input_dim):
    model = Sequential([
        LSTM(64, activation='relu', return_sequences=True, input_shape=(timesteps, input_dim)),
        LSTM(32, activation='relu', return_sequences=False),
        Dropout(0.2),
        Dense(input_dim, kernel_regularizer=l2(0.01))
    ])
    optimizer = Adam(learning_rate=1e-3)
    loss_fn = tf.keras.losses.MeanSquaredError()

    model.compile(optimizer=optimizer, loss=loss_fn, metrics=['mse', 'mae'])
    return model
