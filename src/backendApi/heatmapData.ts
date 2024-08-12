import { post } from './apiUtils';  // Adjust the path to where your post function is defined

export const processHeatmapData = async (data: File): Promise<any> => {

//   console.log('********* data is *******',data)
   // Use FileReader to read the content as text

  const formData = new FormData();
  formData.append('data', data);

//   formData.forEach((value, key) => {
//     console.log(`${key}: ${value}`);
//   });

  try {
    const response = await post<any>('api/heatmapdata/process/', formData);
    return response;
  } catch (error) {
    console.error('Error processing heatmap data:', error);
    throw error;
  }
};