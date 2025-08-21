// A mock weather service to simulate fetching weather data

const weatherConditions = [
    { condition: "Despejado", icon: "fas fa-sun" },
    { condition: "Parcialmente Nublado", icon: "fas fa-cloud-sun" },
    { condition: "Nublado", icon: "fas fa-cloud" },
    { condition: "Lluvia Ligera", icon: "fas fa-cloud-sun-rain" },
    { condition: "Lluvia", icon: "fas fa-cloud-showers-heavy" },
    { condition: "Tormenta", icon: "fas fa-bolt" },
    { condition: "Bruma", icon: "fas fa-smog" },
];

export const getWeather = (): { condition: string; temp: number; icon: string } => {
    const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const randomTemp = Math.floor(Math.random() * 20) + 10; // Temp between 10°C and 29°C

    return {
        ...randomCondition,
        temp: randomTemp,
    };
};
