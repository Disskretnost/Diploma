import axios from 'axios';
import { API_URL } from './api';


const $api = axios.create({
    withCredentials: true,
    baseURL: API_URL
})

$api.interceptors.request.use( (config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
    return config;
})

$api.interceptors.response.use( (response) => {
    return response;
}, async (error) =>{
    const originalRequest = error.config;
    if (error.response.status === 401 && error.config && !error.config._isRetry){
        originalRequest._isRetry = true;
        try{
            const refreshToken = localStorage.getItem('refreshToken');        
            if (!refreshToken) {
                throw new Error('No refresh token found');
            }
            const response = await axios.post(
                `${API_URL}/refresh`, 
                { refreshToken }, 
                { withCredentials: true }
            );
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            return $api.request(originalRequest);
        }catch{
            console.log("Не авторизован")
        }
    }
}
); 

export default $api;
