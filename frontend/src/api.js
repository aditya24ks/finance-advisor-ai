import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const analyzeStock = async (symbol, daysStock = 30, daysNews = 7) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/analyze/${symbol}`, {
            params: { days_stock: daysStock, days_news: daysNews }
        });
        return response.data;
    } catch (error) {
        console.error("Error analyzing stock:", error);
        throw error;
    }
};

export const searchStocks = async (query) => {
    if (!query) return [];
    try {
        const response = await axios.get(`${API_BASE_URL}/search`, { params: { q: query } });
        return response.data;
    } catch (error) {
        console.error("Error searching stocks:", error);
        return [];
    }
};

export const screenStocks = async (criteria) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/screen`, criteria);
        return response.data.screened_stocks;
    } catch (error) {
        console.error("Error screening stocks:", error);
        throw error;
    }
};
