// // https://medium.com/code-well-live-forever/dry-up-your-api-requests-b4337049a2c1
// import axios from "axios";
// import { BASE_API_PATH } from "./api.const";
// import handleError from "./handleError";
// const getHeaders = () => {
//   return {
//     headers: {
//       Accept: "application/json",
//       // "Content-Type": "application/json",
//     },
//   };
// };
// // HTTP GET Request - Returns Resolved or Rejected Promise
// export const get = <T>(path: string, params?: Record<string, any>) => {
//   return new Promise<T>((resolve, reject) => {
//     axios
//       .get<T>(`${BASE_API_PATH}${path}`, { params: params, ...getHeaders()})
//       .then((response) => {
//         resolve(response.data);
//       })
//       .catch((error) => {
//         reject(handleError(error));
//       });
//   });
// };
// // HTTP PATCH Request - Returns Resolved or Rejected Promise
// export const patch = <T>(path: string, data: any) => {
//   return new Promise<T>((resolve, reject) => {
//     axios
//       .patch<T>(`${BASE_API_PATH}${path}`, data, getHeaders())
//       .then((response) => {
//         resolve(response.data);
//       })
//       .catch((error) => {
//         reject(handleError(error));
//       });
//   });
// };
// // HTTP POST Request - Returns Resolved or Rejected Promise
// // export const post = <T>(path: string, data: any) => {
// //   return new Promise<T>((resolve, reject) => {
// //     axios
// //       .post<T>(
// //         `${BASE_API_PATH}${path.slice(-1) === "/" ? path : `${path}/`}`,
// //         data,
// //         getHeaders()
// //       )
// //       .then((response) => {
// //         resolve(response.data);
// //       })
// //       .catch((error) => {
// //         reject(handleError(error));
// //       });
// //   });
// // };
// export const post = <T>(path: string, data: any) => {

//   data.forEach((value:any, key:any) => {
//     console.log(`${key}: ${value}`);
//   })

//   return new Promise<T>((resolve, reject) => {
//     axios
//       .post<T>(
//         `${BASE_API_PATH}${path}`,
//         data
//       )
//       .then((response) => {
//         resolve(response.data);
//       })
//       .catch((error) => {
//         reject(handleError(error));
//       });
//   });
// };

// // HTTP DELETE Request - Returns Resolved or Rejected Promise
// export const del = <T>(path: string) => {
//   return new Promise<T>((resolve, reject) => {
//     axios
//       .delete<T>(`${BASE_API_PATH}${path}`, getHeaders())
//       .then((response) => {
//         resolve(response.data);
//       })
//       .catch((error) => {
//         reject(handleError(error));
//       });
//   });
// };


import axios from "axios";
import { BASE_API_PATH } from "./api.const";
import handleError from "./handleError";

// Helper to get correct headers
const getHeaders = (isFormData = false) => ({
  headers: {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  },
});

// HTTP GET Request
export const get = <T>(path: string, params?: Record<string, any>) => {
  return axios
    .get<T>(`${BASE_API_PATH}${path}`, { params, ...getHeaders() })
    .then((res) => res.data)
    .catch(handleError);
};

// HTTP PATCH Request
export const patch = <T>(path: string, data: any) => {
  return axios
    .patch<T>(`${BASE_API_PATH}${path}`, data, getHeaders())
    .then((res) => res.data)
    .catch(handleError);
};

// ✅ HTTP POST Request with Automatic JSON or FormData Handling
export const post = <T>(path: string, data: any) => {
  let payload = data;
  let isFormData = false;

  if (data instanceof FormData) {
    isFormData = true;
  } else if (data && typeof data === "object" && Object.values(data).some((v) => v instanceof File)) {
    // Auto-convert plain objects with File objects to FormData
    payload = new FormData();
    Object.keys(data).forEach((key) => payload.append(key, data[key]));
    isFormData = true;
  }

  return axios
    .post<T>(`${BASE_API_PATH}${path}`, payload, getHeaders(isFormData))
    .then((res) => res.data)
    .catch((error) => {
      // Handle duplicate upload detection specifically
      if (error.response?.status === 409 && error.response?.data?.error?.includes('Duplicate')) {
        console.warn('⚠️ Duplicate upload detected by server - this is expected behavior');
        console.warn('   The first upload was interrupted, browser auto-retried, server caught duplicate');
        // Return a special error that the frontend can handle gracefully
        throw new Error('DUPLICATE_UPLOAD_DETECTED');
      }
      handleError(error);
    });
};

// HTTP DELETE Request
export const del = <T>(path: string) => {
  return axios
    .delete<T>(`${BASE_API_PATH}${path}`, getHeaders())
    .then((res) => res.data)
    .catch((error) => { handleError(error); });
};
