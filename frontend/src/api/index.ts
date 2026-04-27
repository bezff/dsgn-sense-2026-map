import axios from 'axios';
import { MapData, MarkerData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export const getMapBackground = async (): Promise<MapData | null> => {
  try {
    const response = await axios.get(`${API_URL}/map/background`);
    return response.data;
  } catch (error) {
    console.error('фон карты:', error);
    return null;
  }
};

export const uploadMapBackground = async (file: File): Promise<MapData> => {
  const formData = new FormData();
  formData.append('mapImage', file);
  const response = await axios.post(`${API_URL}/map/background`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMarkers = async (): Promise<MarkerData[]> => {
  try {
    const response = await axios.get(`${API_URL}/markers`);
    return response.data;
  } catch (error) {
    console.error('метки:', error);
    return [];
  }
};

export const createMarker = async (data: Omit<MarkerData, 'id'>): Promise<MarkerData> => {
  const response = await axios.post(`${API_URL}/markers`, data);
  return response.data;
};

export const updateMarker = async (id: number, data: Partial<MarkerData>): Promise<MarkerData> => {
  const response = await axios.put(`${API_URL}/markers/${id}`, data);
  return response.data;
};

export const deleteMarker = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/markers/${id}`);
};

export const uploadMarkerPhoto = async (id: number, file: File): Promise<MarkerData> => {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await axios.post(`${API_URL}/markers/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
