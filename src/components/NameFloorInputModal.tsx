// components/NameInputModal.tsx
import React, { useState } from 'react';
import Modal from './Modal';

interface NameInputModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (name: string, floorCount: number) => void;
}

const NameFloorInputModal: React.FC<NameInputModalProps> = ({
  isOpen,
  title,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [floorCount, setFloorCount] = useState(0);
  
  const handleSubmit = () => {
    if (name.trim() && floorCount) {
      onSubmit(name, floorCount);
      setName('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSubmit={handleSubmit}
      submitText="Save"
    >
      <label htmlFor="Tower Name" style={{color:'White'}}>Tower Name</label>
      <input
        type="text"
        style={{ marginTop : 1 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Order Number"
        className="modal-input"
      />
      <label htmlFor="Number of floors" style={{color:'White'}}>Number of floors</label>
      <input
        type="number"
        style={{ marginTop : 1 }}
        value={floorCount}
        onChange={(e) => setFloorCount(parseInt(e.target.value))}
        placeholder="Number of floors"
        className="modal-input"
      />
    </Modal>
  );
};

export default NameFloorInputModal;
