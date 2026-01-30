// All available TradingView timeframes
export const ALL_TIMEFRAMES = [
  // Seconds
  { value: '1s', label: '1 Second' },
  { value: '5s', label: '5 Seconds' },
  { value: '10s', label: '10 Seconds' },
  { value: '15s', label: '15 Seconds' },
  { value: '30s', label: '30 Seconds' },
  // Minutes
  { value: '1m', label: '1 Minute' },
  { value: '2m', label: '2 Minutes' },
  { value: '3m', label: '3 Minutes' },
  { value: '4m', label: '4 Minutes' },
  { value: '5m', label: '5 Minutes' },
  { value: '6m', label: '6 Minutes' },
  { value: '7m', label: '7 Minutes' },
  { value: '8m', label: '8 Minutes' },
  { value: '9m', label: '9 Minutes' },
  { value: '10m', label: '10 Minutes' },
  { value: '11m', label: '11 Minutes' },
  { value: '12m', label: '12 Minutes' },
  { value: '13m', label: '13 Minutes' },
  { value: '14m', label: '14 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '20m', label: '20 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '45m', label: '45 Minutes' },
  // Hours
  { value: '1h', label: '1 Hour' },
  { value: '2h', label: '2 Hours' },
  { value: '3h', label: '3 Hours' },
  { value: '4h', label: '4 Hours' },
  { value: '6h', label: '6 Hours' },
  { value: '8h', label: '8 Hours' },
  { value: '12h', label: '12 Hours' },
  // Days
  { value: '1d', label: '1 Day' },
  { value: '2d', label: '2 Days' },
  { value: '3d', label: '3 Days' },
  // Weeks
  { value: '1w', label: '1 Week' },
  { value: '2w', label: '2 Weeks' },
  // Months
  { value: '1M', label: '1 Month' },
  { value: '2M', label: '2 Months' },
  { value: '3M', label: '3 Months' },
  { value: '4M', label: '4 Months' },
  { value: '6M', label: '6 Months' },
  { value: '12M', label: '1 Year' },
];

// Default timeframes if user hasn't selected any
export const DEFAULT_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

export const getTimeframeLabel = (value: string): string => {
  const tf = ALL_TIMEFRAMES.find(t => t.value === value);
  return tf?.label || value;
};

// Get filtered timeframes based on provided selection
export const getFilteredTimeframes = (selected: string[]) => {
  return ALL_TIMEFRAMES.filter(tf => selected.includes(tf.value));
};
