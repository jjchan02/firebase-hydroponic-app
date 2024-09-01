import tensorflow as tf
from tensorflow.keras.optimizers import Adam
import numpy as np

def online_learning(model, X_new, y_new, n_epochs=5):
    optimizer = Adam(learning_rate=1e-3)
    loss_fn = tf.keras.losses.MeanSquaredError()

    for epoch in range(n_epochs):
        with tf.GradientTape() as tape:
            y_pred = model(X_new, training=True)
            loss = loss_fn(y_new, y_pred)

        grads = tape.gradient(loss, model.trainable_weights)
        optimizer.apply_gradients(zip(grads, model.trainable_weights))
    
    return model
