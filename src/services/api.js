import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const fetchEmployee = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/employee/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || 'Failed to fetch employee data');
  }
};

