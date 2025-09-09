// export const BASE_API_PATH = process.env.NODE_ENV !== "production"
//     ? "http://127.0.0.1:8001/"
//     : "https://rawalo01.u.hpc.mssm.edu/myApp/index.wsgi";

// export const BASE_API_PATH = "http://127.0.0.1:8000/"
    
export const BASE_API_PATH = process.env.NODE_ENV !== "production"
    ? "http://127.0.0.1:8000/"
    :"https://rawalo01.dmz.hpc.mssm.edu/clusterchirp-dmz/backend/index.wsgi/"
    // : "https://rawalo01.u.hpc.mssm.edu/clusterchirp-test/backend/index.wsgi/";


    // "https://rawalo01.u.hpc.mssm.edu/clusterchirp/backend/index.wsgi/";
    // "https://clusterchirp.mssm.edu/backend/index.wsgi/";