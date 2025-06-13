import React, { useState } from 'react';

const Building: React.FC<{ onUpload: (svg: string) => void }> = ({ onUpload }) => {
  const [preview, setPreview] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgText = e.target?.result as string;
        setPreview(svgText);
        onUpload(svgText);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid SVG file.');
    }
  };

  return (
    <div>
      <input type="file" accept=".svg" onChange={handleFileChange} />
      <div dangerouslySetInnerHTML={{ __html: preview }} />
    </div>
  );
};

export default Building;
