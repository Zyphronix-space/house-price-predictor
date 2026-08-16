"""
Compare a simple model (Linear Regression) against a stronger one
(Random Forest) on the same house price data, to see how much
model choice affects accuracy.
"""

from sklearn.datasets import fetch_california_housing
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

data = fetch_california_housing()
X, y = data.data, data.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Random forests don't need feature scaling, but linear regression
# benefits from it. Scaling doesn't hurt the forest, so we reuse it
# for both to keep the code simple.
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

models = {
    "Linear Regression": LinearRegression(),
    "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
}

print(f"{'Model':<20} {'MAE ($)':>12} {'R^2':>8}")
print("-" * 42)
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    predictions = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    print(f"{name:<20} {mae * 100000:>12,.0f} {r2:>8.3f}")
