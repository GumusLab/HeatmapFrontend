import { OLINK_PROTEIN_GENE_MAP } from '../const/index';


    // Define the types of data your app can handle
  export type DataType = 'olink' | 'proteomics' | 'rna-seq';
  
  /**
   * Maps a list of feature IDs (proteins, etc.) to a list of gene symbols.
   * @param features - An array of feature IDs from a cluster.
   *- The type of omics data.
   * @returns A single string of gene symbols, separated by newlines.
   */
  export function mapFeaturesToGeneList(features: string[], dataType: string): string {
    const geneSet = new Set<string>();
  
    features.forEach((feature) => {
      if (dataType === 'olink') {
        const gene = OLINK_PROTEIN_GENE_MAP[feature];
        if (gene) {
          // Handle cases where a map might contain multiple genes like "GENE1_GENE2"
          gene.split('_').forEach(g => geneSet.add(g));
        }
      } else {
        // Add logic for other data types here
        // For now, assume the feature is the gene symbol
        geneSet.add(feature);
      }
    });
  
    return Array.from(geneSet).join('\n');
  }