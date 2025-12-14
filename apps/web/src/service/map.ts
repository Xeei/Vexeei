import axios from 'axios';

const instance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	timeout: 10000,
});

export async function getUniBou() {
	try {
		const response = await instance.get(`/map/uni`);
		return response.data;
	} catch (error) {
		console.error('Error fetching mock geojson:', error);
		return null;
	}
}

export async function getUniHexBou() {
	try {
		const response = await instance.get(`/map/uni/hex`);
		return response.data;
	} catch (error) {
		console.error('Error fetching mock geojson:', error);
		return null;
	}
}
