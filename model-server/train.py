import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
import numpy as np

def train_model(model, train_sequences, val_sequences, n_epochs=200, save_path='model.h5'):
    loss_fn = tf.keras.losses.MeanSquaredError()
    optimizer = Adam(learning_rate=1e-3)

    best_loss = np.inf
    best_weights = None
    history = {'train': [], 'val': []}

    for epoch in range(1, n_epochs + 1):
        # Training step
        train_losses = []
        for seq in train_sequences:
            X_train = seq[:-1].reshape((1, seq.shape[0] - 1, seq.shape[1]))
            y_train = seq[-1].reshape((1, seq.shape[1]))

            with tf.GradientTape() as tape:
                y_pred = model(X_train, training=True)
                loss = loss_fn(y_train, y_pred)

            grads = tape.gradient(loss, model.trainable_weights)
            optimizer.apply_gradients(zip(grads, model.trainable_weights))
            train_losses.append(loss.numpy())

        # Validation step
        val_losses = []
        for seq in val_sequences:
            X_val = seq[:-1].reshape((1, seq.shape[0] - 1, seq.shape[1]))
            y_val = seq[-1].reshape((1, seq.shape[1]))

            y_pred = model(X_val, training=False)
            loss = loss_fn(y_val, y_pred)
            val_losses.append(loss.numpy())

        # Calculate average losses
        train_loss = np.mean(train_losses)
        val_loss = np.mean(val_losses)

        # Save best model weights
        if val_loss < best_loss:
            best_loss = val_loss
            best_weights = model.get_weights()

        history['train'].append(train_loss)
        history['val'].append(val_loss)

        print(f'Epoch {epoch}: train loss {train_loss:.4f} val loss {val_loss:.4f}')

    # Restore best weights
    model.set_weights(best_weights)

    # Save the model
    model.save(save_path)
    print(f"Model saved to {save_path}")

    return model, history