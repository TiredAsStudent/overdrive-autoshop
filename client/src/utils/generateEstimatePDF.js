/**
 * Utility to generate a branded PDF for Estimates.
 * Currently uses standard browser print, but ready to be hooked into jsPDF.
 */
export const generateEstimatePDF = (estimateData) => {
  console.log("Generating PDF for:", estimateData.reference_number);

  // In a real production app, you would map estimateData into a jsPDF template here.
  // For the Capstone demo, triggering the browser's native print dialogue is often sufficient
  // if you have a print stylesheet (@media print) set up in your CSS.

  setTimeout(() => {
    window.print();
  }, 500);
};
