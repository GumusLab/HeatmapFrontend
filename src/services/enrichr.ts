// enrichr.ts
	
// import json
// import requests


// ENRICHR_URL = 'https://maayanlab.cloud/Enrichr/addList'
// genes_str = '\n'.join([
//     'PHF14', 'RBM3', 'MSL1', 'PHF21A', 'ARL10', 'INSR', 'JADE2', 'P2RX7',
//     'LINC00662', 'CCDC101', 'PPM1B', 'KANSL1L', 'CRYZL1', 'ANAPC16', 'TMCC1',
//     'CDH8', 'RBM11', 'CNPY2', 'HSPA1L', 'CUL2', 'PLBD2', 'LARP7', 'TECPR2', 
//     'ZNF302', 'CUX1', 'MOB2', 'CYTH2', 'SEC22C', 'EIF4E3', 'ROBO2',
//     'ADAMTS9-AS2', 'CXXC1', 'LINC01314', 'ATF7', 'ATP5F1'
// ])
// description = 'Example gene list'
// payload = {
//     'list': (None, genes_str),
//     'description': (None, description)
// }

// response = requests.post(ENRICHR_URL, files=payload)
// if not response.ok:
//     raise Exception('Error analyzing gene list')

// data = json.loads(response.text)
// print(data)

// import fetch from 'node-fetch';

// // Define a function that accepts gene_str and description as parameters
// export async function analyzeGeneList(gene_str: string, description: string): Promise<any> {
//   const ENRICHR_URL = 'https://maayanlab.cloud/Enrichr/addList';

//   console.log(gene_str)
// //   const formData:any = new FormData();
//   // Define the payload for the POST request
//   const genes_str = 'INSR'
// //   formData.append('list', genes_str);
// //   formData.append('description', description);

//   const payload = {
//     'list': genes_str,
//     'description': description,
//   };

//   try {
//     const response = await fetch(ENRICHR_URL, {
//       method: 'POST',
//       body: JSON.stringify(payload),
//     //   headers: {
//     //     'Content-Type': 'application/json',
//     //   },
//     });

//     // const response = await fetch(ENRICHR_URL, {
//     //     method: 'POST',
//     //     body: JSON.stringify(formData), // Use FormData directly as the body
//     //     // headers: {
//     //     //   // Specify the Content-Type header for form data
//     //     // //   'Content-Type': 'multipart/form-data',
//     //     //    'Content-Type': 'application/json'

//     //     // },
//     //   });
  

//     if (!response.ok) {
//         const errorResponse = await response.json();
//         throw new Error(`Error analyzing gene list: ${errorResponse.error}`);
//         }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     throw error;
//   }
// }

// import axios from 'axios';

// export async function analyzeGeneList(): Promise<any> {
//   const ENRICHR_URL = 'https://maayanlab.cloud/Enrichr/addList';

// //   const formData:any = new FormData();
//   // Define the payload for the POST request
//   const genes_str = 'INSR'
//   const description = 'A sample gene'
//   const formData = new FormData();

//   formData.append('list', genes_str);
//   formData.append('description', description);

//   axios.post(ENRICHR_URL, formData, {
//     headers: {
//         'Content-Type': 'multipart/form-data'
//     }
// })
// .then((response) => {
//     console.log(response.data);

//     const { shortId,userListId } = response.data;
//     console.log(userListId)

//     // Construct the URL with userListId and shortId
//     const enrichrURL = `https://maayanlab.cloud/Enrichr/enrich?shortId=${shortId}`;
//     // const enrichrURL = https://maayanlab.cloud/Enrichr/enrich?backgroundType=ChEA_2022&userListId=68866142&_=1706116792185


//     // Open the URL in a new tab or window
//     window.open(enrichrURL, '_blank');

//     return response.data;
// })
// .catch((error) => {
//     console.error('Error:', error);
// });

// }

// https://maayanlab.cloud/Enrichr/enrich?dataset=363320&shortId=59lh


export function enrich(options: { list: string; description?: string; popup?: boolean }) {
  if (typeof options.list === 'undefined') {
    alert('No genes defined.');
    return;
  }

  // const exampleList = ['PHF14', 'RBM3', 'MSL1', 'PHF21A', 'ARL10', 'INSR', 'JADE2', 'P2RX7',
  // 'LINC00662', 'CCDC101', 'PPM1B', 'KANSL1L', 'CRYZL1', 'ANAPC16', 'TMCC1',
  // 'CDH8', 'RBM11', 'CNPY2', 'HSPA1L', 'CUL2', 'PLBD2', 'LARP7', 'TECPR2', 
  // 'ZNF302', 'CUX1', 'MOB2', 'CYTH2', 'SEC22C', 'EIF4E3', 'ROBO2',
  // 'ADAMTS9-AS2', 'CXXC1', 'LINC01314', 'ATF7', 'ATP5F1']
  // const eg =  exampleList.join('\n');
 
  const description = options.description || '';
  const popup = options.popup || false;
  console.log(options)
  const form = document.createElement('form');
  const listField = document.createElement('input');
  const descField = document.createElement('input');

  form.setAttribute('method', 'post');
  form.setAttribute('action', 'https://maayanlab.cloud/Enrichr/enrich');
  if (popup) {
    form.setAttribute('target', '_blank');
  }
  form.setAttribute('target', '_blank');

  form.setAttribute('enctype', 'multipart/form-data');

  listField.setAttribute('type', 'hidden');
  listField.setAttribute('name', 'list');
  listField.setAttribute('value', options.list);
  // listField.setAttribute('value',eg);

  form.appendChild(listField);

  descField.setAttribute('type', 'hidden');
  descField.setAttribute('name', 'description');
  descField.setAttribute('value', description);
  // descField.setAttribute('value', 'A saample gene');

  form.appendChild(descField);

  // Submit the form directly
  // document.body.appendChild(form);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

}

// Example usage:
// enrich({ list: 'PHF14,RBM3,MSL1' });
