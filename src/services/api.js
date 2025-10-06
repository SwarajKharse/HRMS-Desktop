import axios from 'axios';

const BASE_URL = `${process.env.REACT_APP_API_URL}/employee`

export const fetchEmployee = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || 'Failed to fetch employee data');
  }
};

