import React from 'react';
import { useEditMap } from '../context/EditMapContext';

const EditMap: React.FC = () => {
  const { mapContainer } = useEditMap();
  return (
    <div style={{ width: '100%', height: '300px', borderRadius: '8px', overflow: 'hidden', margin: '1rem 0' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default EditMap;
