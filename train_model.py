import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay
)


# ============================================================
# SETTINGS
# ============================================================

DATA_FILE = "final_dataset.csv"
MODEL_FILE = "fitness_model.pkl"

FEATURES = [
    "Weight",
    "Height",
    "BMI",
    "Gender",
    "Age",
    "BMIcase"
]

TARGET = "Exercise Recommendation Plan"


# ============================================================
# LOAD DATASET
# ============================================================

print("\n==========================================")
print("     AI FITNESS MODEL TRAINING")
print("==========================================\n")

if not os.path.exists(DATA_FILE):
    print(f"ERROR: {DATA_FILE} not found.")
    print("Put final_dataset.csv in the same folder as train_model.py")
    exit()

df = pd.read_csv(DATA_FILE)

print("Dataset loaded successfully!")
print(f"Rows    : {df.shape[0]}")
print(f"Columns : {df.shape[1]}")

print("\nColumns:")
for column in df.columns:
    print(" -", column)


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = FEATURES + [TARGET]

missing_columns = [
    column for column in required_columns
    if column not in df.columns
]

if missing_columns:
    print("\nERROR: Missing columns:")
    for column in missing_columns:
        print(" -", column)
    exit()


# ============================================================
# CLEAN COLUMN NAMES
# ============================================================

df.columns = df.columns.str.strip()


# ============================================================
# CLEAN NUMERIC DATA
# ============================================================

numeric_columns = [
    "Weight",
    "Height",
    "BMI",
    "Age"
]

for column in numeric_columns:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# CLEAN TEXT DATA
# ============================================================

text_columns = [
    "Gender",
    "BMIcase",
    TARGET
]

for column in text_columns:
    df[column] = (
        df[column]
        .astype(str)
        .str.strip()
    )


# ============================================================
# REMOVE INVALID TARGET VALUES
# ============================================================

df = df.replace(
    ["", "nan", "None", "null"],
    np.nan
)

df = df.dropna(
    subset=[TARGET]
)

print(f"\nRows after cleaning: {len(df)}")


# ============================================================
# REMOVE DUPLICATES
# ============================================================

before_duplicates = len(df)

df = df.drop_duplicates()

after_duplicates = len(df)

print(
    f"Duplicate rows removed: "
    f"{before_duplicates - after_duplicates}"
)


# ============================================================
# DISPLAY TARGET DISTRIBUTION
# ============================================================

print("\n==========================================")
print("EXERCISE RECOMMENDATION DISTRIBUTION")
print("==========================================")

target_distribution = df[TARGET].value_counts()

print(target_distribution)


if df[TARGET].nunique() < 2:
    print("\nERROR: The target contains less than 2 classes.")
    print("At least 2 different exercise plans are required.")
    exit()


# ============================================================
# PREPARE FEATURES AND TARGET
# ============================================================

X = df[FEATURES]

y_text = df[TARGET]


# ============================================================
# ENCODE TARGET
# ============================================================

target_encoder = LabelEncoder()

y = target_encoder.fit_transform(y_text)


print("\nTarget classes:")

for number, class_name in enumerate(target_encoder.classes_):
    print(f"{number} -> {class_name}")


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n==========================================")
print("DATA SPLIT")
print("==========================================")

print(f"Training samples : {len(X_train)}")
print(f"Testing samples  : {len(X_test)}")


# ============================================================
# PREPROCESSING
# ============================================================

numeric_features = [
    "Weight",
    "Height",
    "BMI",
    "Age"
]

categorical_features = [
    "Gender",
    "BMIcase"
]


numeric_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        )
    ]
)


categorical_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent"
            )
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_transformer,
            numeric_features
        ),
        (
            "categorical",
            categorical_transformer,
            categorical_features
        )
    ]
)


# ============================================================
# MODELS
# ============================================================

models = {

    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    ),

    "Decision Tree": DecisionTreeClassifier(
        random_state=42,
        class_weight="balanced"
    ),

    "Logistic Regression": LogisticRegression(
        max_iter=2000,
        class_weight="balanced"
    ),

    "Gradient Boosting": GradientBoostingClassifier(
        random_state=42
    )
}


# ============================================================
# TRAIN AND EVALUATE
# ============================================================

results = []

trained_models = {}

best_model = None
best_model_name = None
best_f1 = -1


print("\n==========================================")
print("MODEL TRAINING")
print("==========================================\n")


for model_name, classifier in models.items():

    print(f"Training {model_name}...")

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor
            ),
            (
                "classifier",
                classifier
            )
        ]
    )

    pipeline.fit(
        X_train,
        y_train
    )

    predictions = pipeline.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    results.append({
        "Model": model_name,
        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1 Score": f1
    })

    trained_models[model_name] = pipeline

    print(
        f"Accuracy : {accuracy:.4f}"
    )
    print(
        f"Precision: {precision:.4f}"
    )
    print(
        f"Recall   : {recall:.4f}"
    )
    print(
        f"F1 Score : {f1:.4f}\n"
    )

    # Select model using F1 score
    if f1 > best_f1:
        best_f1 = f1
        best_model = pipeline
        best_model_name = model_name


# ============================================================
# MODEL COMPARISON
# ============================================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="F1 Score",
    ascending=False
)

print("\n==========================================")
print("MODEL COMPARISON")
print("==========================================\n")

print(
    results_df.to_string(
        index=False
    )
)


results_df.to_csv(
    "model_comparison.csv",
    index=False
)


# ============================================================
# BEST MODEL
# ============================================================

print("\n==========================================")
print("BEST MODEL")
print("==========================================")

print(
    f"Best model: {best_model_name}"
)

print(
    f"Best F1 Score: {best_f1:.4f}"
)


# ============================================================
# DETAILED CLASSIFICATION REPORT
# ============================================================

best_predictions = best_model.predict(
    X_test
)

print("\n==========================================")
print("CLASSIFICATION REPORT")
print("==========================================\n")

print(
    classification_report(
        y_test,
        best_predictions,
        target_names=target_encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    y_test,
    best_predictions
)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=target_encoder.classes_
)

fig, ax = plt.subplots(
    figsize=(10, 8)
)

disp.plot(
    ax=ax,
    xticks_rotation=45
)

plt.title(
    f"Confusion Matrix - {best_model_name}"
)

plt.tight_layout()

plt.savefig(
    "confusion_matrix.png",
    dpi=300
)

plt.close()

print(
    "\nSaved: confusion_matrix.png"
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

classifier = best_model.named_steps[
    "classifier"
]

model_preprocessor = best_model.named_steps[
    "preprocessor"
]


if hasattr(
    classifier,
    "feature_importances_"
):

    feature_names = (
        model_preprocessor
        .get_feature_names_out()
    )

    importances = (
        classifier
        .feature_importances_
    )

    importance_df = pd.DataFrame({
        "Feature": feature_names,
        "Importance": importances
    })

    importance_df = (
        importance_df
        .sort_values(
            by="Importance",
            ascending=False
        )
    )

    print("\n==========================================")
    print("FEATURE IMPORTANCE")
    print("==========================================\n")

    print(
        importance_df.head(15)
        .to_string(index=False)
    )

    importance_df.to_csv(
        "feature_importance.csv",
        index=False
    )

    # Plot top features
    top_features = importance_df.head(15)

    plt.figure(
        figsize=(10, 7)
    )

    plt.barh(
        top_features["Feature"][::-1],
        top_features["Importance"][::-1]
    )

    plt.xlabel(
        "Importance"
    )

    plt.ylabel(
        "Feature"
    )

    plt.title(
        f"Feature Importance - {best_model_name}"
    )

    plt.tight_layout()

    plt.savefig(
        "feature_importance.png",
        dpi=300
    )

    plt.close()

    print(
        "\nSaved: feature_importance.png"
    )


# ============================================================
# SAVE MODEL
# ============================================================

model_data = {

    "model": best_model,

    "target_encoder": target_encoder,

    "model_name": best_model_name,

    "features": FEATURES,

    "target": TARGET,

    "metrics": {
        "accuracy": accuracy_score(
            y_test,
            best_predictions
        ),

        "precision": precision_score(
            y_test,
            best_predictions,
            average="weighted",
            zero_division=0
        ),

        "recall": recall_score(
            y_test,
            best_predictions,
            average="weighted",
            zero_division=0
        ),

        "f1_score": f1_score(
            y_test,
            best_predictions,
            average="weighted",
            zero_division=0
        )
    }

}


joblib.dump(
    model_data,
    MODEL_FILE
)


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n==========================================")
print("TRAINING COMPLETED")
print("==========================================\n")

print(
    f"Model saved as: {MODEL_FILE}"
)

print(
    "Model comparison saved as: "
    "model_comparison.csv"
)

print(
    "Confusion matrix saved as: "
    "confusion_matrix.png"
)

print(
    "Feature importance saved as: "
    "feature_importance.png"
)

print("\nYour AI fitness ML model is ready! 🚀")