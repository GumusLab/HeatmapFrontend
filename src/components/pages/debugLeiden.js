/**
 * DEBUG UTILITY FOR LEIDEN CLUSTERING
 * Use this to test Leiden clustering with known good data
 */

// Simple test data generator
export function generateTestData(nodeCount = 10, correlationCount = 20) {
  console.log('🧪 GENERATING TEST DATA:');
  console.log(`   - Nodes: ${nodeCount}`);
  console.log(`   - Correlations: ${correlationCount}`);
  
  // Generate node names
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(`GENE_${i.toString().padStart(3, '0')}`);
  }
  
  // Generate random correlations
  const correlations = [];
  for (let i = 0; i < correlationCount; i++) {
    const gene1 = nodes[Math.floor(Math.random() * nodes.length)];
    let gene2 = nodes[Math.floor(Math.random() * nodes.length)];
    
    // Ensure gene1 !== gene2
    while (gene2 === gene1) {
      gene2 = nodes[Math.floor(Math.random() * nodes.length)];
    }
    
    // Generate correlation between -1 and 1
    const correlation = (Math.random() - 0.5) * 2;
    
    correlations.push({
      gene1,
      gene2,
      correlation
    });
  }
  
  const testData = { nodes, correlations };
  
  console.log('✅ Test data generated:');
  console.log(`   - Sample nodes: ${nodes.slice(0, 5).join(', ')}`);
  console.log(`   - Sample correlations:`, correlations.slice(0, 3));
  
  return testData;
}

// Validate data format
export function validateNetworkData(data) {
  console.log('🔍 VALIDATING NETWORK DATA:');
  
  const issues = [];
  
  // Check data exists
  if (!data) {
    issues.push('Data is null or undefined');
    return { valid: false, issues };
  }
  
  // Check nodes
  if (!data.nodes) {
    issues.push('Missing nodes array');
  } else if (!Array.isArray(data.nodes)) {
    issues.push('Nodes is not an array');
  } else if (data.nodes.length === 0) {
    issues.push('Nodes array is empty');
  } else {
    // Check node format
    data.nodes.forEach((node, index) => {
      if (typeof node !== 'string') {
        issues.push(`Node ${index} is not a string: ${typeof node}`);
      }
      if (!node || node.trim() === '') {
        issues.push(`Node ${index} is empty or whitespace`);
      }
    });
  }
  
  // Check correlations
  if (!data.correlations) {
    issues.push('Missing correlations array');
  } else if (!Array.isArray(data.correlations)) {
    issues.push('Correlations is not an array');
  } else {
    // Check correlation format
    data.correlations.forEach((corr, index) => {
      if (!corr) {
        issues.push(`Correlation ${index} is null/undefined`);
        return;
      }
      
      if (!corr.gene1 || typeof corr.gene1 !== 'string') {
        issues.push(`Correlation ${index} has invalid gene1: ${corr.gene1}`);
      }
      
      if (!corr.gene2 || typeof corr.gene2 !== 'string') {
        issues.push(`Correlation ${index} has invalid gene2: ${corr.gene2}`);
      }
      
      if (typeof corr.correlation !== 'number') {
        issues.push(`Correlation ${index} has non-numeric correlation: ${typeof corr.correlation}`);
      } else if (isNaN(corr.correlation)) {
        issues.push(`Correlation ${index} has NaN correlation`);
      } else if (!isFinite(corr.correlation)) {
        issues.push(`Correlation ${index} has infinite correlation`);
      } else if (corr.correlation < -1 || corr.correlation > 1) {
        issues.push(`Correlation ${index} is out of range [-1, 1]: ${corr.correlation}`);
      }
      
      // Check if genes exist in nodes array
      if (data.nodes && Array.isArray(data.nodes)) {
        if (!data.nodes.includes(corr.gene1)) {
          issues.push(`Correlation ${index} gene1 '${corr.gene1}' not found in nodes array`);
        }
        if (!data.nodes.includes(corr.gene2)) {
          issues.push(`Correlation ${index} gene2 '${corr.gene2}' not found in nodes array`);
        }
      }
    });
  }
  
  console.log(`📊 Validation results:`);
  console.log(`   - Issues found: ${issues.length}`);
  if (issues.length > 0) {
    console.log(`   - First 10 issues:`, issues.slice(0, 10));
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}

// Test Leiden clustering with debugging
export async function testLeidenClustering() {
  console.log('🧪 TESTING LEIDEN CLUSTERING:');
  
  try {
    // Import Leiden clustering (adjust path as needed)
    const { detectCommunitiesWithLeiden } = await import('./leidenClustering');
    
    // Test with small dataset first
    console.log('\n📊 Test 1: Small dataset (10 nodes, 20 correlations)');
    const smallData = generateTestData(10, 20);
    const smallValidation = validateNetworkData(smallData);
    
    if (!smallValidation.valid) {
      console.error('❌ Small test data is invalid:', smallValidation.issues);
      return;
    }
    
    console.log('🔄 Running Leiden on small dataset...');
    const smallClusters = await detectCommunitiesWithLeiden(smallData, 0.1, 1.0);
    console.log(`✅ Small dataset result: ${smallClusters.length} clusters`);
    
    // Test with medium dataset
    console.log('\n📊 Test 2: Medium dataset (50 nodes, 100 correlations)');
    const mediumData = generateTestData(50, 100);
    const mediumValidation = validateNetworkData(mediumData);
    
    if (!mediumValidation.valid) {
      console.error('❌ Medium test data is invalid:', mediumValidation.issues);
      return;
    }
    
    console.log('🔄 Running Leiden on medium dataset...');
    const mediumClusters = await detectCommunitiesWithLeiden(mediumData, 0.1, 1.0);
    console.log(`✅ Medium dataset result: ${mediumClusters.length} clusters`);
    
    console.log('\n✅ All tests passed! Leiden clustering is working with test data.');
    
    return {
      success: true,
      smallClusters,
      mediumClusters
    };
    
  } catch (error) {
    console.error('❌ Leiden clustering test failed:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Debug your actual data
export function debugYourData(processedNetworkData) {
  console.log('🔍 DEBUGGING YOUR ACTUAL DATA:');
  
  if (!processedNetworkData) {
    console.error('❌ No data provided to debug');
    return;
  }
  
  console.log('📊 Data overview:');
  console.log('   - Type:', typeof processedNetworkData);
  console.log('   - Keys:', Object.keys(processedNetworkData));
  
  // Validate the data
  const validation = validateNetworkData(processedNetworkData);
  
  if (validation.valid) {
    console.log('✅ Your data format is valid!');
    
    // Additional statistics
    console.log('\n📈 Data statistics:');
    console.log(`   - Nodes: ${processedNetworkData.nodes.length}`);
    console.log(`   - Correlations: ${processedNetworkData.correlations.length}`);
    
    // Correlation statistics
    const correlations = processedNetworkData.correlations.map(c => c.correlation);
    const validCorrelations = correlations.filter(c => !isNaN(c) && isFinite(c));
    
    console.log(`   - Valid correlations: ${validCorrelations.length}/${correlations.length}`);
    
    if (validCorrelations.length > 0) {
      const min = Math.min(...validCorrelations);
      const max = Math.max(...validCorrelations);
      const avg = validCorrelations.reduce((sum, c) => sum + c, 0) / validCorrelations.length;
      
      console.log(`   - Correlation range: ${min.toFixed(3)} to ${max.toFixed(3)}`);
      console.log(`   - Average correlation: ${avg.toFixed(3)}`);
      
      // Count strong correlations
      const strongPositive = validCorrelations.filter(c => c > 0.5).length;
      const strongNegative = validCorrelations.filter(c => c < -0.5).length;
      const weak = validCorrelations.filter(c => Math.abs(c) < 0.1).length;
      
      console.log(`   - Strong positive (>0.5): ${strongPositive}`);
      console.log(`   - Strong negative (<-0.5): ${strongNegative}`);
      console.log(`   - Weak (|c| < 0.1): ${weak}`);
    }
    
  } else {
    console.error('❌ Your data has validation issues:');
    validation.issues.forEach((issue, index) => {
      console.error(`   ${index + 1}. ${issue}`);
    });
  }
  
  return validation;
} 