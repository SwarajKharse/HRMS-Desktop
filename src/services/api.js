import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/employee';

export const fetchEmployee = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || 'Failed to fetch employee data');
  }
};

