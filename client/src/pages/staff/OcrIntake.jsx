import React, { useState } from "react";
import { ReceiptUploader } from "../../features/staff/components/ReceiptUploader";
import { OcrReviewer } from "../../features/staff/components/OcrReviewer";

// Mock User Context
const MOCK_USER = { assigned_branch: "Second Branch" };

const OcrIntake = ({ user = MOCK_USER }) => {
  const [step, setStep] = useState("upload"); // 'upload' | 'review'
  const [activeImage, setActiveImage] = useState(null);
  const [activeMethod, setActiveMethod] = useState("ai");

  const handleUploadComplete = (imgData, methodUsed) => {
    setActiveImage(imgData);
    setActiveMethod(methodUsed);
    setStep("review");
  };

  const handleSubmit = () => {
    alert(
      "Receipt Data Saved! This transaction is now pending Manager Review in the Submission History tab.",
    );
    // Reset back to the capture station
    setStep("upload");
    setActiveImage(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 animate-in fade-in duration-500">
      {step === "upload" ? (
        <div className="pt-4">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
              Receipt Digitation Hub
            </h2>
          </div>
          <ReceiptUploader onUpload={handleUploadComplete} />
        </div>
      ) : (
        <OcrReviewer
          image={activeImage}
          method={activeMethod}
          user={user}
          onCancel={() => setStep("upload")}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default OcrIntake;
