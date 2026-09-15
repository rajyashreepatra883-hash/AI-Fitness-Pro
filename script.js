// ============================================================
// AI FITNESS PRO - INTERACTIVE FRONTEND
// ============================================================

const API_URL = "http://127.0.0.1:8000/recommend";

let bmiChart = null;
let calorieChart = null;

let waterGlasses = 0;

let lastRecommendation = null;

let dailyMeals = [];

let dailyCalorieTarget = 0;

let workoutCompleted = [];

let dietCompleted = [];


// ============================================================
// DOM HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// GENERAL HELPERS
// ============================================================

function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatValue(value, decimals = 0) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return number.toFixed(decimals);
}


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}


function showElement(id) {

    const element = $(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(id) {

    const element = $(id);

    if (element) {
        element.classList.add("hidden");
    }
}


// ============================================================
// FORM DATA
// ============================================================

function getFormData() {

    return {

        age: safeNumber($("age")?.value),

        height: safeNumber($("height")?.value),

        weight: safeNumber($("weight")?.value),

        gender:
            $("gender")?.value ||
            "Male",

        goal:
            $("goal")?.value ||
            "Weight Loss",

        activity_level:
            $("activity_level")?.value ||
            "Moderate",

        intensity:
            $("intensity")?.value ||
            "Moderate"
    };
}


// ============================================================
// VALIDATION
// ============================================================

function validateForm(data) {

    if (
        !data.age ||
        data.age < 10 ||
        data.age > 100
    ) {

        return "Please enter a valid age between 10 and 100.";
    }


    if (
        !data.height ||
        data.height < 100 ||
        data.height > 250
    ) {

        return "Please enter a valid height between 100 and 250 cm.";
    }


    if (
        !data.weight ||
        data.weight < 25 ||
        data.weight > 300
    ) {

        return "Please enter a valid weight between 25 and 300 kg.";
    }


    return "";
}


// ============================================================
// GENERATE BUTTON
// ============================================================

function setGenerateLoading(loading) {

    const button = $("generateBtn");

    if (!button) {
        return;
    }


    button.disabled = loading;


    if (loading) {

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Generating Plan...
        `;

    } else {

        button.innerHTML = `
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Generate My AI Plan
        `;
    }
}


// ============================================================
// GENERATE PLAN
// ============================================================

async function generatePlan() {

    const formData = getFormData();

    const error = validateForm(formData);


    if (error) {

        alert(error);

        return;
    }


    setGenerateLoading(true);


    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(formData)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to generate fitness plan."
            );
        }


        lastRecommendation = data;


        saveUserProfile(formData);


        displayDashboard(data);


    } catch (error) {

        console.error(
            "Backend Error:",
            error
        );


        alert(
            "Unable to connect to the AI Fitness Pro backend.\n\n" +
            "Make sure FastAPI is running at:\n" +
            "http://127.0.0.1:8000\n\n" +
            "Error: " +
            error.message
        );


    } finally {

        setGenerateLoading(false);
    }
}


// ============================================================
// DISPLAY DASHBOARD
// ============================================================

function displayDashboard(data) {

    showElement("dashboard");


    const bmi =
        safeNumber(data.BMI);


    const bmr =
        safeNumber(data.BMR);


    const calories =
        safeNumber(data.Calories);


    dailyCalorieTarget =
        calories;


    const intensity =
        data.Selected_Intensity ||
        data.Intensity ||
        "Moderate";


    const bmiCategory =
        data.BMI_Category ||
        data.BMIcase ||
        "—";


    setText(
        "bmiValue",
        formatValue(bmi, 1)
    );


    setText(
        "bmiStatus",
        bmiCategory
    );


    setText(
        "bmrValue",
        `${formatValue(bmr, 0)} kcal/day`
    );


    setText(
        "calories",
        `${formatValue(calories, 0)} kcal/day`
    );


    setText(
        "intensityLabel",
        intensity
    );


    setText(
        "goalLabel",
        data.Goal ||
        getFormData().goal ||
        "Fitness"
    );


    renderAIRecommendation(data);


    renderWorkouts(data.Workouts);


    renderDiet(data.Diet);


    updateCharts(data);


    updateCalorieTracker();


    updateAllProgress();


    const dashboard =
        $("dashboard");


    if (dashboard) {

        dashboard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


// ============================================================
// AI RECOMMENDATION
// ============================================================

function renderAIRecommendation(data) {

    const container =
        $("aiRecommendation");


    if (!container) {
        return;
    }


    const recommendation =
        data.AI_Recommendation ||
        data.AI_Exercise_Plan ||
        "Your personalized AI recommendation is ready.";


    const predictedPlan =
        data.AI_Predicted_Exercise_Plan;


    let recommendationHTML =
        "";


    if (Array.isArray(recommendation)) {

        recommendationHTML =
            recommendation
                .map(
                    item =>
                        `<div>${objectToReadableText(item)}</div>`
                )
                .join("");

    } else {

        recommendationHTML =
            objectToReadableText(
                recommendation
            )
            .replace(/\n/g, "<br>");
    }


    let planHTML =
        "";


    if (
        predictedPlan !== undefined &&
        predictedPlan !== null &&
        predictedPlan !== ""
    ) {

        planHTML = `
            <div class="ai-plan-number">

                <strong>
                    AI Exercise Plan:
                </strong>

                ${escapeHTML(predictedPlan)}

            </div>
        `;
    }


    container.innerHTML = `

        <div class="ai-card-content">

            <div class="ai-icon">

                <i class="fa-solid fa-robot"></i>

            </div>

            <div class="ai-text">

                <h3>
                    AI Coach Recommendation
                </h3>

                ${planHTML}

                <p>
                    ${recommendationHTML}
                </p>

            </div>

        </div>

    `;
}


// ============================================================
// NORMALIZE LIST
// ============================================================

function normalizeList(value) {

    if (Array.isArray(value)) {
        return value;
    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return [];
    }


    if (typeof value === "string") {

        return value
            .split(/\n|•|\u2022/)
            .map(
                item => item.trim()
            )
            .filter(Boolean);
    }


    return [value];
}


// ============================================================
// OBJECT TO READABLE TEXT
// ============================================================

function objectToReadableText(item) {

    if (
        item === null ||
        item === undefined
    ) {

        return "";
    }


    if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
    ) {

        return escapeHTML(item);
    }


    if (typeof item === "object") {

        return Object.entries(item)

            .map(
                ([key, value]) => {

                    const readableKey =
                        key
                            .replace(/_/g, " ")
                            .replace(
                                /\b\w/g,
                                letter =>
                                    letter.toUpperCase()
                            );


                    let readableValue;


                    if (
                        typeof value === "object" &&
                        value !== null
                    ) {

                        readableValue =
                            JSON.stringify(value);

                    } else {

                        readableValue =
                            String(
                                value ?? ""
                            );
                    }


                    return `
                        <strong>
                            ${escapeHTML(readableKey)}:
                        </strong>

                        ${escapeHTML(readableValue)}
                    `;
                }
            )
            .join("<br>");
    }


    return escapeHTML(item);
}


// ============================================================
// WORKOUT RENDERING
// ============================================================

function renderWorkouts(workouts) {

    const container =
        $("workouts");


    if (!container) {
        return;
    }


    const items =
        normalizeList(workouts);


    workoutCompleted =
        loadTaskState(
            "workout"
        );


    workoutCompleted =
        workoutCompleted.filter(
            index =>
                index < items.length
        );


    saveTaskState(
        "workout",
        workoutCompleted
    );


    if (items.length === 0) {

        container.innerHTML = `
            <li class="empty-state">
                No workout details were returned.
            </li>
        `;

        updateAllProgress();

        return;
    }


    container.innerHTML =
        items

            .map(
                (item, index) => {

                    const completed =
                        workoutCompleted.includes(
                            index
                        );


                    return `

                        <li
                            class="workout-item ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                            data-index="${index}"
                        >

                            <span class="item-number">

                                ${
                                    completed
                                        ? "✓"
                                        : index + 1
                                }

                            </span>

                            <span>
                                ${objectToReadableText(item)}
                            </span>

                        </li>
                    `;
                }
            )

            .join("");


    container
        .querySelectorAll(".workout-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            item.dataset.index
                        );


                    toggleWorkout(index);
                }
            );

        });


    updateAllProgress();
}


// ============================================================
// TOGGLE WORKOUT
// ============================================================

function toggleWorkout(index) {

    if (
        workoutCompleted.includes(index)
    ) {

        workoutCompleted =
            workoutCompleted.filter(
                value =>
                    value !== index
            );

    } else {

        workoutCompleted.push(index);
    }


    saveTaskState(
        "workout",
        workoutCompleted
    );


    if (lastRecommendation) {

        renderWorkouts(
            lastRecommendation.Workouts
        );

    } else {

        updateAllProgress();
    }
}


// ============================================================
// DIET RENDERING
// ============================================================

function renderDiet(diet) {

    const container =
        $("diet");


    if (!container) {
        return;
    }


    const items =
        normalizeList(diet);


    dietCompleted =
        loadTaskState(
            "diet"
        );


    dietCompleted =
        dietCompleted.filter(
            index =>
                index < items.length
        );


    saveTaskState(
        "diet",
        dietCompleted
    );


    if (items.length === 0) {

        container.innerHTML = `
            <li class="empty-state">
                No diet details were returned.
            </li>
        `;

        updateAllProgress();

        return;
    }


    container.innerHTML =
        items

            .map(
                (item, index) => {

                    const completed =
                        dietCompleted.includes(
                            index
                        );


                    return `

                        <li
                            class="diet-item ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                            data-index="${index}"
                        >

                            <span class="item-number">

                                ${
                                    completed
                                        ? "✓"
                                        : index + 1
                                }

                            </span>

                            <span>
                                ${objectToReadableText(item)}
                            </span>

                        </li>

                    `;
                }
            )

            .join("");


    container
        .querySelectorAll(".diet-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            item.dataset.index
                        );


                    toggleDiet(index);
                }
            );

        });


    updateAllProgress();
}


// ============================================================
// TOGGLE DIET
// ============================================================

function toggleDiet(index) {

    if (
        dietCompleted.includes(index)
    ) {

        dietCompleted =
            dietCompleted.filter(
                value =>
                    value !== index
            );

    } else {

        dietCompleted.push(index);
    }


    saveTaskState(
        "diet",
        dietCompleted
    );


    if (lastRecommendation) {

        renderDiet(
            lastRecommendation.Diet
        );

    } else {

        updateAllProgress();
    }
}


// ============================================================
// TASK STORAGE
// ============================================================

function getTodayKey() {

    const today =
        new Date();


    return (
        today.getFullYear() +
        "_" +
        String(
            today.getMonth() + 1
        ).padStart(2, "0") +
        "_" +
        String(
            today.getDate()
        ).padStart(2, "0")
    );
}


function saveTaskState(type, values) {

    localStorage.setItem(
        `fitness_${type}_${getTodayKey()}`,
        JSON.stringify(values)
    );
}


function loadTaskState(type) {

    try {

        const saved =
            localStorage.getItem(
                `fitness_${type}_${getTodayKey()}`
            );


        if (!saved) {
            return [];
        }


        const parsed =
            JSON.parse(saved);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {

        return [];
    }
}


// ============================================================
// ALL PROGRESS
// ============================================================

function updateAllProgress() {

    let workoutPercent = 0;

    let dietPercent = 0;


    if (lastRecommendation) {

        const workouts =
            normalizeList(
                lastRecommendation.Workouts
            );


        const diet =
            normalizeList(
                lastRecommendation.Diet
            );


        if (workouts.length > 0) {

            workoutPercent =
                Math.round(
                    (
                        workoutCompleted.length /
                        workouts.length
                    ) * 100
                );
        }


        if (diet.length > 0) {

            dietPercent =
                Math.round(
                    (
                        dietCompleted.length /
                        diet.length
                    ) * 100
                );
        }
    }


    setText(
        "workoutProgressText",
        `${workoutPercent}%`
    );


    setText(
        "dietProgressText",
        `${dietPercent}%`
    );


    const workoutProgress =
        $("workoutProgress");


    const dietProgress =
        $("dietProgress");


    if (workoutProgress) {

        workoutProgress.style.width =
            `${workoutPercent}%`;
    }


    if (dietProgress) {

        dietProgress.style.width =
            `${dietPercent}%`;
    }


    const overall =
        Math.round(
            (
                workoutPercent +
                dietPercent
            ) / 2
        );


    setText(
        "overallProgressText",
        `${overall}%`
    );


    const overallProgress =
        $("overallProgress");


    if (overallProgress) {

        overallProgress.style.width =
            `${overall}%`;
    }
}


// ============================================================
// CALORIE TRACKER
// ============================================================

function getMealStorageKey() {

    return (
        "fitnessMeals_" +
        getTodayKey()
    );
}


function loadMeals() {

    try {

        const saved =
            localStorage.getItem(
                getMealStorageKey()
            );


        if (saved) {

            const parsed =
                JSON.parse(saved);


            if (Array.isArray(parsed)) {

                dailyMeals =
                    parsed;
            }
        }

    } catch (error) {

        console.error(
            "Unable to load saved meals:",
            error
        );


        dailyMeals = [];
    }


    renderMealList();

    updateCalorieTracker();
}


function saveMeals() {

    localStorage.setItem(
        getMealStorageKey(),
        JSON.stringify(dailyMeals)
    );
}


function addMeal() {

    const mealType =
        $("mealType")?.value ||
        "Other";


    const foodName =
        $("foodName")?.value.trim();


    const calories =
        safeNumber(
            $("foodCalories")?.value
        );


    if (!foodName) {

        alert(
            "Please enter the food name."
        );

        return;
    }


    if (
        calories <= 0 ||
        calories > 10000
    ) {

        alert(
            "Please enter a valid calorie value."
        );

        return;
    }


    const meal = {

        id:
            Date.now(),

        type:
            mealType,

        food:
            foodName,

        calories:
            Math.round(calories)

    };


    dailyMeals.push(meal);


    saveMeals();

    renderMealList();

    updateCalorieTracker();


    $("foodName").value = "";

    $("foodCalories").value = "";
}


function deleteMeal(id) {

    dailyMeals =
        dailyMeals.filter(
            meal =>
                meal.id !== id
        );


    saveMeals();

    renderMealList();

    updateCalorieTracker();
}


function getTotalCalories() {

    return dailyMeals.reduce(

        (total, meal) => {

            return total +
                safeNumber(
                    meal.calories
                );

        },

        0
    );
}


function getMealIcon(type) {

    switch (type) {

        case "Breakfast":
            return "fa-mug-hot";

        case "Lunch":
            return "fa-bowl-food";

        case "Snack":
            return "fa-cookie-bite";

        case "Dinner":
            return "fa-utensils";

        default:
            return "fa-plate-wheat";
    }
}


function renderMealList() {

    const container =
        $("mealList");


    if (!container) {
        return;
    }


    if (dailyMeals.length === 0) {

        container.innerHTML = `

            <div class="empty-meals">

                <i class="fa-solid fa-bowl-food"></i>

                <p>
                    No meals added yet.
                </p>

                <small>
                    Add your first meal above.
                </small>

            </div>
        `;

        return;
    }


    container.innerHTML =
        dailyMeals

            .map(
                meal => `

                    <div class="meal-item">

                        <div class="meal-left">

                            <div class="meal-icon">

                                <i class="fa-solid ${
                                    getMealIcon(
                                        meal.type
                                    )
                                }"></i>

                            </div>

                            <div>

                                <div class="meal-name">

                                    ${escapeHTML(
                                        meal.food
                                    )}

                                </div>

                                <div class="meal-type">

                                    ${escapeHTML(
                                        meal.type
                                    )}

                                </div>

                            </div>

                        </div>


                        <div>

                            <span class="meal-calories">

                                ${safeNumber(
                                    meal.calories
                                )} kcal

                            </span>


                            <button
                                type="button"
                                class="delete-meal-btn"
                                data-meal-id="${meal.id}"
                                title="Delete meal"
                            >

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </div>

                    </div>

                `
            )

            .join("");


    container
        .querySelectorAll(
            ".delete-meal-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.mealId
                        );


                    deleteMeal(id);
                }
            );

        });
}


// ============================================================
// CALORIE TRACKER UPDATE
// ============================================================

function updateCalorieTracker() {

    const consumed =
        getTotalCalories();


    const target =
        safeNumber(
            dailyCalorieTarget
        );


    const remaining =
        Math.max(
            target - consumed,
            0
        );


    let percentage = 0;


    if (target > 0) {

        percentage =
            (
                consumed /
                target
            ) * 100;
    }


    percentage =
        Math.min(
            percentage,
            100
        );


    setText(
        "caloriesConsumed",
        `${Math.round(consumed)} kcal`
    );


    setText(
        "calorieTarget",
        target > 0
            ? `${Math.round(target)} kcal`
            : "Generate plan"
    );


    setText(
        "caloriesRemaining",
        target > 0
            ? `${Math.round(remaining)} kcal`
            : "—"
    );


    setText(
        "calorieIntakePercent",
        `${Math.round(percentage)}%`
    );


    const progress =
        $("calorieIntakeProgress");


    if (progress) {

        progress.style.width =
            `${percentage}%`;
    }


    updateProgressBarColor(
        percentage
    );
}


function updateProgressBarColor(
    percentage
) {

    const progress =
        $("calorieIntakeProgress");


    if (!progress) {
        return;
    }


    progress.classList.remove(
        "calorie-warning",
        "calorie-danger"
    );


    if (percentage >= 100) {

        progress.classList.add(
            "calorie-danger"
        );

    } else if (percentage >= 80) {

        progress.classList.add(
            "calorie-warning"
        );
    }
}


function resetMeals() {

    if (
        dailyMeals.length > 0
    ) {

        const confirmed =
            confirm(
                "Are you sure you want to remove all today's meals?"
            );


        if (!confirmed) {
            return;
        }
    }


    dailyMeals = [];


    localStorage.removeItem(
        getMealStorageKey()
    );


    renderMealList();

    updateCalorieTracker();
}


// ============================================================
// WATER TRACKER
// ============================================================

function getWaterStorageKey() {

    return (
        "fitnessWater_" +
        getTodayKey()
    );
}


function loadWater() {

    waterGlasses =
        safeNumber(
            localStorage.getItem(
                getWaterStorageKey()
            )
        );


    waterGlasses =
        Math.min(
            Math.max(
                waterGlasses,
                0
            ),
            8
        );


    updateWaterDisplay();
}


function addWater() {

    const maximumGlasses = 8;


    waterGlasses =
        Math.min(
            waterGlasses + 1,
            maximumGlasses
        );


    localStorage.setItem(
        getWaterStorageKey(),
        waterGlasses
    );


    updateWaterDisplay();
}


function updateWaterDisplay() {

    const maximumGlasses = 8;


    const percentage =
        Math.min(

            100,

            (
                waterGlasses /
                maximumGlasses
            ) * 100

        );


    setText(
        "waterValue",
        `${waterGlasses} / ${maximumGlasses} glasses`
    );


    const progress =
        $("waterProgress");


    if (progress) {

        progress.style.width =
            `${percentage}%`;
    }
}


// ============================================================
// CHARTS
// ============================================================

function getChartTextColor() {

    return getComputedStyle(
        document.body
    ).getPropertyValue(
        "--text"
    ).trim() || "#1e293b";
}


function updateCharts(data) {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.warn(
            "Chart.js is not loaded."
        );

        return;
    }


    const bmi =
        safeNumber(data.BMI);


    const bmr =
        safeNumber(data.BMR);


    const calories =
        safeNumber(data.Calories);


    const bmiCanvas =
        $("bmiChart");


    if (bmiCanvas) {

        if (bmiChart) {

            bmiChart.destroy();

            bmiChart = null;
        }


        const bmiDisplay =
            Math.min(
                Math.max(
                    bmi,
                    0
                ),
                40
            );


        const remaining =
            Math.max(
                40 -
                bmiDisplay,
                0
            );


        bmiChart =
            new Chart(
                bmiCanvas,
                {

                    type:
                        "doughnut",

                    data: {

                        labels: [
                            "Your BMI",
                            "Remaining"
                        ],

                        datasets: [

                            {

                                data: [
                                    bmiDisplay,
                                    remaining
                                ]

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        animation: {

                            animateRotate: true,

                            duration: 1200
                        },

                        plugins: {

                            legend: {

                                position:
                                    "bottom",

                                labels: {

                                    color:
                                        getChartTextColor()
                                }
                            }

                        }

                    }

                }
            );
    }


    const calorieCanvas =
        $("calorieChart");


    if (calorieCanvas) {

        if (calorieChart) {

            calorieChart.destroy();

            calorieChart = null;
        }


        calorieChart =
            new Chart(
                calorieCanvas,
                {

                    type:
                        "bar",

                    data: {

                        labels: [
                            "BMR",
                            "Daily Target"
                        ],

                        datasets: [

                            {

                                label:
                                    "Calories",

                                data: [
                                    bmr,
                                    calories
                                ],

                                borderRadius: 10

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        animation: {

                            duration: 1000
                        },

                        scales: {

                            x: {

                                ticks: {

                                    color:
                                        getChartTextColor()
                                }

                            },

                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    color:
                                        getChartTextColor()
                                }

                            }

                        },

                        plugins: {

                            legend: {

                                display:
                                    false
                            }

                        }

                    }

                }
            );
    }
}


// ============================================================
// PROFILE STORAGE
// ============================================================

function saveUserProfile(data) {

    localStorage.setItem(
        "fitnessUserProfile",
        JSON.stringify(data)
    );
}


function loadUserProfile() {

    try {

        const saved =
            localStorage.getItem(
                "fitnessUserProfile"
            );


        if (!saved) {
            return;
        }


        const data =
            JSON.parse(saved);


        if ($("age")) {
            $("age").value =
                data.age || "";
        }


        if ($("height")) {
            $("height").value =
                data.height || "";
        }


        if ($("weight")) {
            $("weight").value =
                data.weight || "";
        }


        if ($("gender")) {
            $("gender").value =
                data.gender || "Male";
        }


        if ($("goal")) {
            $("goal").value =
                data.goal || "Weight Loss";
        }


        if ($("activity_level")) {
            $("activity_level").value =
                data.activity_level || "Moderate";
        }


        if ($("intensity")) {
            $("intensity").value =
                data.intensity || "Moderate";
        }

    } catch (error) {

        console.error(
            "Profile loading failed:",
            error
        );
    }
}


// ============================================================
// THEME
// ============================================================

function applyTheme(theme) {

    const body =
        document.body;


    if (!body) {
        return;
    }


    body.classList.remove(

        "theme-light",
        "theme-dark",
        "theme-neon",
        "theme-glass"

    );


    body.classList.add(
        theme ||
        "theme-light"
    );


    updateChartsAfterTheme();
}


// ============================================================
// ACCENT
// ============================================================

function applyAccent(accent) {

    const body =
        document.body;


    if (!body) {
        return;
    }


    body.classList.remove(

        "accent-blue",
        "accent-green",
        "accent-purple",
        "accent-orange"

    );


    body.classList.add(
        accent ||
        "accent-blue"
    );


    updateChartsAfterTheme();
}


// ============================================================
// UPDATE CHART AFTER THEME
// ============================================================

function updateChartsAfterTheme() {

    if (!lastRecommendation) {
        return;
    }


    setTimeout(
        () => {

            updateCharts(
                lastRecommendation
            );

        },
        100
    );
}


// ============================================================
// SETTINGS
// ============================================================

function loadSettings() {

    const savedTheme =
        localStorage.getItem(
            "fitnessTheme"
        ) ||
        "theme-light";


    const savedAccent =
        localStorage.getItem(
            "fitnessAccent"
        ) ||
        "accent-blue";


    applyTheme(
        savedTheme
    );


    applyAccent(
        savedAccent
    );


    const themeSelector =
        $("themeSelector");


    const accentSelector =
        $("accentSelector");


    if (themeSelector) {

        themeSelector.value =
            savedTheme;
    }


    if (accentSelector) {

        accentSelector.value =
            savedAccent;
    }
}


function handleThemeChange(event) {

    const theme =
        event.target.value;


    applyTheme(theme);


    localStorage.setItem(
        "fitnessTheme",
        theme
    );
}


function handleAccentChange(event) {

    const accent =
        event.target.value;


    applyAccent(accent);


    localStorage.setItem(
        "fitnessAccent",
        accent
    );
}


// ============================================================
// RESET DASHBOARD
// ============================================================

function resetDashboard() {

    hideElement(
        "dashboard"
    );


    lastRecommendation = null;


    dailyCalorieTarget = 0;


    workoutCompleted = [];

    dietCompleted = [];


    if (bmiChart) {

        bmiChart.destroy();

        bmiChart = null;
    }


    if (calorieChart) {

        calorieChart.destroy();

        calorieChart = null;
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

function attachEvents() {

    const themeSelector =
        $("themeSelector");


    const accentSelector =
        $("accentSelector");


    const generateBtn =
        $("generateBtn");


    const waterBtn =
        $("waterBtn");


    const addMealBtn =
        $("addMealBtn");


    const resetMealsBtn =
        $("resetMealsBtn");


    if (themeSelector) {

        themeSelector.addEventListener(
            "change",
            handleThemeChange
        );
    }


    if (accentSelector) {

        accentSelector.addEventListener(
            "change",
            handleAccentChange
        );
    }


    if (generateBtn) {

        generateBtn.addEventListener(
            "click",
            generatePlan
        );
    }


    if (waterBtn) {

        waterBtn.addEventListener(
            "click",
            addWater
        );
    }


    if (addMealBtn) {

        addMealBtn.addEventListener(
            "click",
            addMeal
        );
    }


    if (resetMealsBtn) {

        resetMealsBtn.addEventListener(
            "click",
            resetMeals
        );
    }


    const foodCalories =
        $("foodCalories");


    if (foodCalories) {

        foodCalories.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addMeal();
                }

            }
        );
    }


    const foodName =
        $("foodName");


    if (foodName) {

        foodName.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addMeal();
                }

            }
        );
    }
}


// ============================================================
// KEYBOARD SHORTCUT
// CTRL + ENTER
// ============================================================

function setupKeyboardShortcut() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key ===
                    "Enter"
            ) {

                event.preventDefault();

                generatePlan();
            }

        }
    );
}


// ============================================================
// INITIALIZE
// ============================================================

function initialize() {

    loadSettings();

    loadUserProfile();

    attachEvents();

    setupKeyboardShortcut();

    loadMeals();

    loadWater();

    updateWaterDisplay();

    updateCalorieTracker();

    updateAllProgress();
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initialize
);