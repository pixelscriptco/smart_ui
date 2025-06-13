import React, { useState } from 'react';
import SvgUploader from './SvgUploader';
import parse, { domToReact } from 'html-react-parser';

const SmartWorld: React.FC = () => {
  const [svgData, setSvgData] = useState('');

  const handleClick = (id: string) => {
    alert(`You clicked: ${id}`);
    // You can fetch tower data or highlight based on this ID
  };

  const parsedSvg = svgData
    ? parse(svgData, {
        replace: (domNode: any) => {
          if (
            domNode.name === 'path' &&
            domNode.attribs &&
            domNode.attribs.id
          ) {
            const id = domNode.attribs.id;
            return (
              <path
                {...domNode.attribs}
                onClick={() => handleClick(id)}
                style={{ cursor: 'pointer', stroke: 'black' }}
              />
            );
          }
        },
      })
    : null;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upload Your Floor Plan</h2>
      <SvgUploader onUpload={setSvgData} />

      {svgData && (
        <div style={{ marginTop: '30px', border: '1px solid #ccc' }}>
          {parsedSvg}
        </div>
      )}
    </div>
  );
};

export default SmartWorld;
