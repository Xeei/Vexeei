export function getGeolocation(): Promise<[number, number] | null> {
	return new Promise((resolve) => {
		if (typeof window !== 'undefined' && 'geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					resolve([
						position.coords.longitude,
						position.coords.latitude,
					]);
				},
				(error) => {
					console.warn('Error getting geolocation:', error);
					resolve(null);
				}
			);
		} else {
			resolve(null);
		}
	});
}
