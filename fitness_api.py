# ============================================================
# AI FITNESS PRO - FASTAPI BACKEND
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import os


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="AI Fitness Pro API",
    version="5.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD TRAINED ML MODEL
# ============================================================

MODEL_PATH = "fitness_model.pkl"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"{MODEL_PATH} not found. Please run train_model.py first."
    )

model_data = joblib.load(MODEL_PATH)

model = model_data["model"]
target_encoder = model_data["target_encoder"]
model_name = model_data.get("model_name", "Random Forest")
features = model_data.get("features", [])


# ============================================================
# USER INPUT MODEL
# ============================================================

class UserData(BaseModel):

    age: int
    weight: float
    height: float
    gender: str

    goal: str
    activity_level: str
    intensity: str


# ============================================================
# BMI CALCULATION
# ============================================================

def calculate_bmi(weight, height):

    # Height is received in centimeters
    height_m = height / 100

    if height_m <= 0:
        return 0

    bmi = weight / (height_m ** 2)

    return round(bmi, 2)


# ============================================================
# BMI CATEGORY
# ============================================================

def get_bmi_category(bmi):

    if bmi < 18.5:
        return "Underweight"

    elif bmi < 25:
        return "Normal"

    elif bmi < 30:
        return "Overweight"

    else:
        return "Obese"


# ============================================================
# BMI CASE
# ============================================================

def get_bmi_case(bmi):

    if bmi < 18.5:
        return "Underweight"

    elif bmi < 25:
        return "Normal"

    elif bmi < 30:
        return "Overweight"

    else:
        return "Obese"


# ============================================================
# BMR CALCULATION
# Mifflin-St Jeor Equation
# ============================================================

def calculate_bmr(age, weight, height, gender):

    if gender.lower() == "male":

        bmr = (
            10 * weight
            + 6.25 * height
            - 5 * age
            + 5
        )

    else:

        bmr = (
            10 * weight
            + 6.25 * height
            - 5 * age
            - 161
        )

    return round(bmr, 2)


# ============================================================
# TDEE CALCULATION
# ============================================================

def calculate_tdee(bmr, activity_level):

    activity_multipliers = {

        "low": 1.2,

        "medium": 1.5,

        "high": 1.75
    }

    multiplier = activity_multipliers.get(
        activity_level.lower(),
        1.2
    )

    tdee = bmr * multiplier

    return round(tdee, 2)


# ============================================================
# CALORIE TARGET
# ============================================================

def calculate_calorie_target(tdee, goal):

    goal = goal.lower()

    if goal == "weight_loss":

        calories = tdee - 400

    elif goal == "muscle_gain":

        calories = tdee + 300

    else:

        calories = tdee

    # Minimum calorie limit
    calories = max(calories, 1200)

    return round(calories)


# ============================================================
# AI EXERCISE PLAN PREDICTION
# ============================================================

def predict_exercise_plan(
    weight,
    height,
    bmi,
    gender,
    age,
    bmi_case
):

    input_data = pd.DataFrame([{

        "Weight": weight,

        "Height": height,

        "BMI": bmi,

        "Gender": gender,

        "Age": age,

        "BMIcase": bmi_case
    }])

    prediction = model.predict(input_data)

    predicted_plan = target_encoder.inverse_transform(
        prediction
    )[0]

    return predicted_plan


# ============================================================
# EXERCISE PLAN DESCRIPTION
# ============================================================

def get_exercise_plan_description(plan):

    plans = {

        1: "Light walking, stretching and basic mobility exercises.",

        2: "Beginner cardio with walking, light jogging and bodyweight exercises.",

        3: "Moderate cardio combined with strength training.",

        4: "Balanced strength and cardio training program.",

        5: "Intermediate workout with cardio and resistance training.",

        6: "Advanced strength and cardio workout with progressive overload.",

        7: "High-intensity training with strength, cardio and conditioning."
    }

    try:

        plan_number = int(plan)

        return plans.get(
            plan_number,
            "Customized exercise plan based on your fitness profile."
        )

    except:

        return "Customized exercise plan based on your fitness profile."


# ============================================================
# WORKOUT GENERATOR
# ============================================================

def generate_workout(goal, intensity):

    workout_plans = {

        "weight_loss": {

            "low": [
                "30 min brisk walking",
                "10 min stretching",
                "Bodyweight squats - 2 sets × 10 reps",
                "Wall push-ups - 2 sets × 10 reps"
            ],

            "medium": [
                "20 min jogging",
                "20 min brisk walking",
                "Squats - 3 sets × 12 reps",
                "Push-ups - 3 sets × 10 reps",
                "Plank - 3 × 30 seconds"
            ],

            "high": [
                "30 min running",
                "HIIT - 15 minutes",
                "Squats - 4 sets × 15 reps",
                "Push-ups - 4 sets × 12 reps",
                "Mountain climbers - 3 × 30 seconds",
                "Plank - 3 × 60 seconds"
            ]
        },

        "muscle_gain": {

            "low": [
                "Full body strength training",
                "Squats - 3 sets × 10 reps",
                "Push-ups - 3 sets × 10 reps",
                "Lunges - 3 sets × 10 reps",
                "Light stretching"
            ],

            "medium": [
                "Strength training - 45 minutes",
                "Squats - 4 sets × 10 reps",
                "Push-ups - 4 sets × 12 reps",
                "Lunges - 3 sets × 12 reps",
                "Plank - 3 × 45 seconds"
            ],

            "high": [
                "Heavy strength training",
                "Squats - 5 sets × 8 reps",
                "Push-ups - 5 sets × 15 reps",
                "Lunges - 4 sets × 12 reps",
                "Pull-ups - 4 sets × 8 reps",
                "Core training - 15 minutes"
            ]
        },

        "maintenance": {

            "low": [
                "30 min walking",
                "Light stretching",
                "Bodyweight squats - 2 sets × 10 reps",
                "Mobility exercises"
            ],

            "medium": [
                "30 min jogging",
                "Strength training - 20 minutes",
                "Squats - 3 sets × 12 reps",
                "Push-ups - 3 sets × 10 reps",
                "Plank - 3 × 30 seconds"
            ],

            "high": [
                "30 min running",
                "Strength training - 30 minutes",
                "HIIT - 15 minutes",
                "Squats - 4 sets × 15 reps",
                "Push-ups - 4 sets × 12 reps",
                "Core workout"
            ]
        }
    }

    goal = goal.lower()
    intensity = intensity.lower()

    if goal not in workout_plans:

        goal = "maintenance"

    if intensity not in workout_plans[goal]:

        intensity = "medium"

    return workout_plans[goal][intensity]


# ============================================================
# DIET GENERATOR
# ============================================================
# Diet is rule-based, NOT ML predicted.
# It changes according to goal and intensity.
# ============================================================

def generate_diet(goal, intensity, calories):

    # Calorie distribution
    breakfast_calories = round(calories * 0.25)

    lunch_calories = round(calories * 0.35)

    snack_calories = round(calories * 0.15)

    dinner_calories = round(calories * 0.25)


    # ========================================================
    # WEIGHT LOSS
    # ========================================================

    if goal == "weight_loss":

        # LOW INTENSITY
        if intensity == "low":

            selected_diet = [

                {
                    "meal": "Breakfast",
                    "food": "Oats + banana + 1 boiled egg",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Lunch",
                    "food": "Rice + dal + sabji + fish",
                    "calories": lunch_calories
                },

                {
                    "meal": "Evening Snack",
                    "food": "Muri + cucumber + green tea",
                    "calories": snack_calories
                },

                {
                    "meal": "Dinner",
                    "food": "2 roti + vegetables + egg",
                    "calories": dinner_calories
                }
            ]


        # MEDIUM INTENSITY
        elif intensity == "medium":

            selected_diet = [

                {
                    "meal": "Breakfast",
                    "food": "Oats + 2 eggs + banana",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Lunch",
                    "food": "Rice + dal + sabji + chicken/fish",
                    "calories": lunch_calories
                },

                {
                    "meal": "Workout Snack",
                    "food": "Banana + boiled egg + curd",
                    "calories": snack_calories
                },

                {
                    "meal": "Dinner",
                    "food": "2 roti + chicken/fish + vegetables",
                    "calories": dinner_calories
                }
            ]


        # HIGH INTENSITY
        else:

            selected_diet = [

                {
                    "meal": "High Protein Breakfast",
                    "food": "Oats + 3 eggs + banana + milk",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Performance Lunch",
                    "food": "Rice + chicken/fish + dal + vegetables",
                    "calories": lunch_calories
                },

                {
                    "meal": "Post Workout Snack",
                    "food": "Banana + curd + 2 boiled eggs",
                    "calories": snack_calories
                },

                {
                    "meal": "Recovery Dinner",
                    "food": "2 roti + chicken/fish + vegetables",
                    "calories": dinner_calories
                }
            ]


    # ========================================================
    # MUSCLE GAIN
    # ========================================================

    elif goal == "muscle_gain":

        # LOW INTENSITY
        if intensity == "low":

            selected_diet = [

                {
                    "meal": "Breakfast",
                    "food": "3 eggs + oats + banana + milk",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Lunch",
                    "food": "Rice + dal + chicken/fish + sabji",
                    "calories": lunch_calories
                },

                {
                    "meal": "Snack",
                    "food": "Milk + banana + peanuts",
                    "calories": snack_calories
                },

                {
                    "meal": "Dinner",
                    "food": "3 roti + chicken/fish + vegetables",
                    "calories": dinner_calories
                }
            ]


        # MEDIUM INTENSITY
        elif intensity == "medium":

            selected_diet = [

                {
                    "meal": "Breakfast",
                    "food": "Oats + 3 eggs + banana + milk",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Lunch",
                    "food": "Rice + chicken + dal + vegetables + curd",
                    "calories": lunch_calories
                },

                {
                    "meal": "Post Workout Snack",
                    "food": "Banana + milk + peanuts + boiled egg",
                    "calories": snack_calories
                },

                {
                    "meal": "Dinner",
                    "food": "Rice + fish/chicken + vegetables + curd",
                    "calories": dinner_calories
                }
            ]


        # HIGH INTENSITY
        else:

            selected_diet = [

                {
                    "meal": "High Protein Breakfast",
                    "food": "Oats + 4 eggs + banana + milk",
                    "calories": breakfast_calories
                },

                {
                    "meal": "High Energy Lunch",
                    "food": "Rice + chicken + dal + vegetables + curd",
                    "calories": lunch_calories
                },

                {
                    "meal": "Post Workout Meal",
                    "food": "Banana + milk + eggs + peanuts",
                    "calories": snack_calories
                },

                {
                    "meal": "Recovery Dinner",
                    "food": "Rice + chicken/fish + vegetables + curd",
                    "calories": dinner_calories
                }
            ]


    # ========================================================
    # MAINTENANCE
    # ========================================================

    else:

        # LOW INTENSITY
        if intensity == "low":

            selected_diet = [

                {
                    "meal": "Breakfast",
                    "food": "Oats + seasonal fruit + boiled egg",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Lunch",
                    "food": "Rice + dal + sabji + fish",
                    "calories": lunch_calories
                },

                {
                    "meal": "Evening Snack",
                    "food": "Fruit + curd",
                    "calories": snack_calories
                },

                {
                    "meal": "Dinner",
                    "food": "2 roti + vegetables + egg curry",
                    "calories": dinner_calories
                }
            ]


        # MEDIUM INTENSITY
        elif intensity == "medium":

            selected_diet = [

                {
                    "meal": "Breakfast",
                    "food": "Oats + 2 eggs + banana",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Lunch",
                    "food": "Rice + dal + vegetables + fish/chicken",
                    "calories": lunch_calories
                },

                {
                    "meal": "Workout Snack",
                    "food": "Banana + curd + boiled egg",
                    "calories": snack_calories
                },

                {
                    "meal": "Dinner",
                    "food": "Roti + chicken/fish + vegetables",
                    "calories": dinner_calories
                }
            ]


        # HIGH INTENSITY
        else:

            selected_diet = [

                {
                    "meal": "High Energy Breakfast",
                    "food": "Oats + eggs + banana + milk",
                    "calories": breakfast_calories
                },

                {
                    "meal": "Performance Lunch",
                    "food": "Rice + chicken/fish + dal + vegetables",
                    "calories": lunch_calories
                },

                {
                    "meal": "Post Workout Snack",
                    "food": "Banana + milk + 2 boiled eggs",
                    "calories": snack_calories
                },

                {
                    "meal": "Recovery Dinner",
                    "food": "Rice/roti + protein + vegetables + curd",
                    "calories": dinner_calories
                }
            ]

    return selected_diet


# ============================================================
# COMPLETE RECOMMENDATION GENERATOR
# ============================================================

def generate_recommendation(user):

    # --------------------------------------------------------
    # BMI
    # --------------------------------------------------------

    bmi = calculate_bmi(
        user.weight,
        user.height
    )

    bmi_category = get_bmi_category(bmi)

    bmi_case = get_bmi_case(bmi)


    # --------------------------------------------------------
    # BMR
    # --------------------------------------------------------

    bmr = calculate_bmr(
        user.age,
        user.weight,
        user.height,
        user.gender
    )


    # --------------------------------------------------------
    # TDEE
    # --------------------------------------------------------

    tdee = calculate_tdee(
        bmr,
        user.activity_level
    )


    # --------------------------------------------------------
    # CALORIE TARGET
    # --------------------------------------------------------

    target_calories = calculate_calorie_target(
        tdee,
        user.goal
    )


    # --------------------------------------------------------
    # AI EXERCISE PLAN
    # --------------------------------------------------------

    predicted_plan = predict_exercise_plan(
        user.weight,
        user.height,
        bmi,
        user.gender,
        user.age,
        bmi_case
    )


    # --------------------------------------------------------
    # EXERCISE PLAN DESCRIPTION
    # --------------------------------------------------------

    exercise_description = get_exercise_plan_description(
        predicted_plan
    )


    # --------------------------------------------------------
    # WORKOUT
    # --------------------------------------------------------

    workout_plan = generate_workout(
        user.goal,
        user.intensity
    )


    # --------------------------------------------------------
    # DIET
    # --------------------------------------------------------

    diet_plan = generate_diet(
        user.goal,
        user.intensity,
        target_calories
    )


    # --------------------------------------------------------
    # FINAL AI RECOMMENDATION
    # --------------------------------------------------------

    recommendation = {

        "BMI": bmi,

        "BMI_Category": bmi_category,

        "BMIcase": bmi_case,

        "BMR": bmr,

        "TDEE": tdee,

        "Calories": target_calories,

        "Goal": user.goal,

        "Activity_Level": user.activity_level,

        "Selected_Intensity": user.intensity,

        "AI_Predicted_Exercise_Plan": predicted_plan,

        "AI_Exercise_Plan": exercise_description,

        "Intensity": user.intensity,

        "Workouts": workout_plan,

        "Diet": diet_plan,

        "AI_Recommendation":
            f"Based on your BMI of {bmi}, "
            f"your recommended exercise plan is "
            f"Plan {predicted_plan}. "
            f"Your estimated daily calorie target is "
            f"{target_calories} kcal."
    }

    return recommendation


# ============================================================
# RECOMMEND API
# ============================================================

@app.post("/recommend")
def recommend(user: UserData):

    try:

        result = generate_recommendation(user)

        return result

    except Exception as e:

        return {
            "error": str(e)
        }


# ============================================================
# HOME API
# ============================================================

@app.get("/")
def home():

    return {

        "message": "AI Fitness Pro API is running",

        "version": "5.0",

        "model": model_name,

        "target": "Exercise Recommendation Plan",

        "status": "active"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {

        "status": "healthy",

        "model_loaded": True,

        "model_name": model_name
    }


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "fitness_api:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )