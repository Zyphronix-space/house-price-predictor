"""
Load the trained model and predict the price for one house.
Run train_model.py first to create the saved model files.
"""

import joblib
import numpy as np
from sklearn.datasets import fetch_california_housing

model = joblib.load("house_price_model.joblib")
scaler = joblib.load("scaler.joblib")

data = fetch_california_housing()
feature_names = data.feature_names

# Take one example house from the dataset to predict on
example = data.data[0].reshape(1, -1)
actual_price = data.target[0]

example_scaled = scaler.transform(example)
predicted_price = model.predict(example_scaled)[0]

print("House features:")
for name, value in zip(feature_names, example[0]):
    print(f"  {name}: {value:.2f}")

print(f"\nPredicted price: ${predicted_price * 100000:,.0f}")
print(f"Actual price:    ${actual_price * 100000:,.0f}")
