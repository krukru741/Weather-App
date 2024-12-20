export function groupBy(key) {
  return function group(array) {
    return array.reduce((acc, obj) => {
      const property = obj[key];
      const { date, ...rest } = obj;
      acc[property] = acc[property] || [];
      acc[property].push(rest);
      return acc;
    }, {});
  };
}

export function getAverage(array, isRound = true) {
  if (array.length === 0) return 0; // Handle empty array case

  const total = array.reduce((a, b) => a + b, 0);
  return isRound 
    ? Math.round(total / array.length) 
    : parseFloat((total / array.length).toFixed(2)); // Ensure it's a number
}

export function getMostFrequentWeather(arr) {
  const hashmap = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(hashmap).reduce((a, b) =>
    hashmap[a] > hashmap[b] ? a : b
  );
}

export const descriptionToIconName = (desc, descriptions_list) => {
  const iconName = descriptions_list.find((item) => item.description === desc);
  return iconName ? iconName.icon : 'unknown'; // Ensure we handle undefined
};

export const getWeekForecastWeather = (response, descriptions_list) => {
  if (!response || Object.keys(response).length === 0 || response.cod === '404') return [];

  const forecast_data = [];
  const descriptions_data = [];

  response.list.forEach((item) => {
    const date = item.dt_txt.substring(0, 10);
    descriptions_data.push({
      description: item.weather[0].description,
      date,
    });
    forecast_data.push({
      date,
      temp: item.main.temp,
      humidity: item.main.humidity,
      wind: item.wind.speed,
      clouds: item.clouds.all,
    });
  });

  const groupByDate = groupBy('date');
  const grouped_forecast_data = groupByDate(forecast_data);
  const grouped_forecast_descriptions = groupByDate(descriptions_data);

  const description_keys = Object.keys(grouped_forecast_descriptions);
  const dayDescList = description_keys.map((key) => {
    const singleDayDescriptions = grouped_forecast_descriptions[key].map(
      (item) => item.description
    );
    return getMostFrequentWeather(singleDayDescriptions);
  });

  const forecast_keys = Object.keys(grouped_forecast_data);
  return forecast_keys.map((key, idx) => {
    const dayData = grouped_forecast_data[key];
    return {
      date: key,
      temp: getAverage(dayData.map(d => d.temp)),
      humidity: getAverage(dayData.map(d => d.humidity)),
      wind: getAverage(dayData.map(d => d.wind), false),
      clouds: getAverage(dayData.map(d => d.clouds)),
      description: dayDescList[idx],
      icon: descriptionToIconName(dayDescList[idx], descriptions_list),
    };
  });
};

export const getTodayForecastWeather = (response, current_date, current_datetime) => {
  const all_today_forecasts = response?.list
    .filter(item => item.dt_txt.startsWith(current_date.substring(0, 10)) && item.dt > current_datetime)
    .map(item => ({
      time: item.dt_txt.split(' ')[1].substring(0, 5),
      icon: item.weather[0].icon,
      temperature: Math.round(item.main.temp) + ' °C',
    }));

  return all_today_forecasts.length < 7 
    ? [...all_today_forecasts] 
    : all_today_forecasts.slice(-6);
};
