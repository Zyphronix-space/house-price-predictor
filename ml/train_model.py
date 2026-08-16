"""
Beginner ML training program: predict California house prices.

Steps:
1. Load a built-in dataset
2. Split it into training and test sets
3. Scale the features
4. Train a regression model
5. Evaluate how good the model is
6. Save the trained model to disk
"""

import joblib
import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 1. Load the data
# X = input features (median income, house age, rooms, location, etc.)
# y = target we want to predict (median house value, in $100,000s)
data = fetch_california_housing()
X, y = data.data, data.target
feature_names = data.feature_names

print(f"Dataset shape: {X.shape[0]} houses, {X.shape[1]} features")
print(f"Features: {feature_names}\n")

# 2. Split into training data (used to learn) and test data (used to check)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. Scale features so they're all on a similar numeric range.
# Fit the scaler on training data only, then apply it to both sets.
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 4. Train the model
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# 5. Evaluate on data the model has never seen
predictions = model.predict(X_test_scaled)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print("Evaluation on test data:")
print(f"  Mean Absolute Error: {mae:.3f} (in $100,000s, so ${mae * 100000:,.0f})")
print(f"  R^2 score:           {r2:.3f} (closer to 1.0 is better)\n")

# Show a few example predictions vs actual values
print("Sample predictions (predicted vs actual, in $100,000s):")
for pred, actual in list(zip(predictions[:5], y_test[:5])):
    print(f"  predicted={pred:.2f}  actual={actual:.2f}")

# 6. Save the trained model and scaler so they can be reused without retraining
joblib.dump(model, "house_price_model.joblib")
joblib.dump(scaler, "scaler.joblib")
print("\nSaved model to house_price_model.joblib")
print("Saved scaler to scaler.joblib")
