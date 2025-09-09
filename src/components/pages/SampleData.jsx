// components/pages/SampleData.jsx
import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button
} from "@mui/material";

function SampleData() {
  // Sample data that matches the requested format
  const sampleData = [
    // Header rows with sample IDs and categories
    ["", "", "SampleID1", "SampleID2", "SampleID3"],
    ["", "", "Condition: Treated", "Condition: Control", "Condition: Treated"],
    ["", "", "Timepoint: 24h", "Timepoint: 48h", "Timepoint: 24h"],
    
    // Data rows with genes and values
    ["Gene1", "Category: High Interest", -2.34, 4.56, 0.23],
    ["Gene2", "Category: High Interest", 3.45, -1.23, -5.67],
    ["Gene3", "Category: Low Interest", 1.23, 2.34, 0.78]
  ];
  
  // Generate sample CSV content
  const generateCSVContent = () => {
    return sampleData.map(row => row.join('\t')).join('\n');
  };
  
  return (
    <Box sx={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <Typography variant="h5" sx={{ mb: 3,fontWeight: 'bold'  }}>
        Sample Data Format
      </Typography>
      
      <Typography sx={{ mb: 3 }}>
        This is an example of the data format expected by ClusterChirp. Your data should be organized in a tabular format:
      </Typography>
      
      {/* <Typography component="ul" sx={{ mb: 4, pl: 2 }}>
        <li>Column headers representing sample IDs</li>
        <li>Additional header rows for sample categories (Condition, Timepoint, Gender, etc.)</li>
        <li>Row headers representing genes</li>
        <li>Second column containing gene categories</li>
        <li>Numerical expression values in the data cells</li>
        <li>File formats supported: CSV, TSV, or TXT</li>
      </Typography> */}
      
      <Typography sx={{ mb: 3 }}>
        Example data:
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 4, overflowX: "auto" }}>
        <Table>
          <TableBody>
            {sampleData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => {
                  // Special styling for headers
                  const isHeaderRow = rowIndex < 3;
                  const isHeaderCol = cellIndex < 2;
                  
                  return (
                    <TableCell 
                      key={cellIndex}
                      align={typeof cell === 'number' ? 'right' : 'left'}
                      sx={{
                        fontWeight: (isHeaderRow || isHeaderCol) ? 'bold' : 'normal',
                        backgroundColor: (isHeaderRow && cellIndex >= 2) ? '#f5f5f5' : 
                                        (isHeaderCol && rowIndex >= 3) ? '#f5f5f5' : 'inherit',
                        minWidth: cellIndex < 2 ? '180px' : '120px'
                      }}
                    >
                      {cell}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="h6" sx={{ mb: 2 }}>
        Sample TSV Format
      </Typography>
      
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          p: 2,
          borderRadius: 1,
          mb: 4,
          maxHeight: "300px",
          overflow: "auto",
          fontFamily: "monospace",
          whiteSpace: "pre"
        }}
      >
        {generateCSVContent()}
      </Box>
      
      <Typography sx={{ mb: 3 }}>
        You can download this example as a TSV file and use it as a template for your own data.
      </Typography>
      
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.close()}
          sx={{ mr: 2 }}
        >
          Close
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => window.location.href = "/"}
        >
          Back to Home
        </Button>
      </Box>
    </Box>
  );
}

export default SampleData;