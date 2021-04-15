module.exports = (value, maxValue, size) => {
	// Calculate the percentage of the bar.
	const percentage = value / maxValue;
	// Calculate the number of square characters to fill the progress side.
	const progress = Math.round(size * percentage);
	// Calculate the number of dash characters to fill the empty progress side.
	const emptyProgress = size - progress;
	// Repeat is creating a string with progress * chars in it.
	const progressText = '[▇](https://www.google.com)'.repeat(progress);
	// Repeat is creating a string with empty progress * chars in it.
	const emptyProgressText = '[—](https://www.google.com)'.repeat(emptyProgress);
	// Displaying the percentage of the bar.
	const percentageText = `${Math.round(percentage * 100)}%`;
	return `[${progressText}${emptyProgressText}]${percentageText}`;
};
